import { Strapi } from "@strapi/strapi";
import fetchWordpressData from "../utils/fetchWordpressData";
import he from 'he';

// const WORDPRESS_POST_URL = "https://shega.co/wp-json/wp/v2/posts";
export default ({strapi}: {strapi:Strapi}) => ({
    async migratePosts(ctx) {
        const { stopPage, batch } = ctx.params;
        const{username,password,url}=ctx.request.body
        let page = ctx.params.page;
        const firstPage = page;
        let success = true;
        let hasMorePosts = true;
       const WORDPRESS_POST_URL=url
  
        const insertImage = async (content) => {
          const imgTags = content.match(/<img[^>]+>/g);
  
          if (imgTags) {
            let updatedContent = content;
            for (const imgTag of imgTags) {
              // Extract the media ID from the class attribute
              const mediaId = imgTag.match(/wp-image-(\d+)/);
  
              if (mediaId) {
                // Find the media by the extracted ID
                try {
                  const media = await strapi
                    .query("plugin::upload.file")
                    .findOne({
                      where: {
                        id: parseInt(mediaId[1]),
                      },
                    });
  
                  if (media) {
                    // Create a new img tag with updated src and srcset
                    let newImgTag = imgTag;
                    newImgTag = newImgTag.replace(
                      /src=\"([^"]*)"/,
                      `src="${media?.url}"`
                    );
  
                    // Extract the srcset URLs and update them
                    const srcsetMatch = imgTag.match(/srcset="([^"]*)"/);
                    if (srcsetMatch) {
                      const srcsetUrls = srcsetMatch[1]
                        .split(",")
                        .map((url) => url.trim());
                      let newSrcsetUrls = srcsetUrls
                        .map((srcsetUrl) => {
                          const [url, size] = srcsetUrl.split(" ");
                          return `${media?.url} ${size}`;
                        })
                        .join(", ");
  
                      newImgTag = newImgTag.replace(
                        /srcset="([^"]*)"/,
                        `srcset="${newSrcsetUrls}"`
                      );
                    }
  
                    // Replace the old img tag with the new one in the updated content
                    updatedContent = updatedContent.replace(imgTag, newImgTag);
                  }
                } catch (error) {
                  console.error(
                    `Error processing media ID ${mediaId[1]}: `,
                    error
                  );
                }
              }
            }
  
            return updatedContent;
          } else {
            return content;
          }
        };
        let totalPage;
        let message = "";
  
        while (hasMorePosts) {
          try {
            const data = await fetchWordpressData(
              page,
              WORDPRESS_POST_URL,
              batch,
              username,
              password
            );
            console.log({data})
            const { data: wordpressPosts, totalPages } = data;
            totalPage = totalPages;
            console.log('first',firstPage, totalPages );
           
            if(firstPage > totalPage ){
              message='Invalid page number';
              success=false
              break;
            }
            if (page > stopPage || page > totalPage) {
              hasMorePosts = false;
              break;
            }
            if (wordpressPosts.length === 0) {
              hasMorePosts = false;
              break;
            }
  
            const strapiPosts = await Promise.all(
              wordpressPosts.map(async (post) => {
                try {
                  let featuredImage = null;
                  if (post?.featured_media) {
                    try {
                      featuredImage = await strapi
                        .query("plugin::upload.file")
                        .findOne({
                          where: { id: post.featured_media },
                        });
                    } catch (error) {
                      console.error(
                        `Error fetching featured media for post ID ${post.id}: `,
                        error
                      );
                    }
                  }
                  return {
                    id: post?.id,
                    title: he.decode(post?.title.rendered) ?? "",
                    slug:
                     he.decode(post?.slug
                        .toString()
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, "-")
                        .replace(/[^\w-]+/g, "")
                        .replace(/--+/g, "-")) ?? "",
                    postedDate:
                      post?.date.split("T").slice(0, 1)[0].toString() ?? "",
                    style: "Style 1",
                    excerpt:
                    he.decode(post?.excerpt?.rendered?.replace(/<\/?[^>]+(>|$)/g, "")) ??
                      "",
                    enableComment: post?.comment_status === "open" ? true : false,
                    canonicalUrl: post?.yoast_head_json?.canonical ?? "",
                    isPromotional: false,
                    content: { body: await insertImage(post?.content?.rendered) },
                    featuredImage: featuredImage,
                    fromV2: true,
                    seo: {
                      metaTitle: he.decode(post?.yoast_head_json?.title),
                      metaDescription: he.decode(post?.yoast_head_json?.description),
                      metaImage: featuredImage,
                    },
                    // blocks:[{__component:'event.agenda-item' ?? '',title:'Agenda',presenter:'Me' ?? ''}],
                    topic: post?.categories[0],
                    author: post?.author ?? 1,
                    tags: post?.tags ?? [],
                    categories: post?.categories.splice(1) ?? [],
                    advancedSeo: post?.yoast_head_json,
                    readTime:(post?.yoast_head_json?.twitter_misc["Est. reading time"]).split(' ')[0]
                  };
                } catch (error) {
                    console.log(error)
                }
              })
            );
  
            await Promise.all(
              strapiPosts.map(async (post) => {
                if (post) {
                  try {
                    const exist = await strapi
                      .query("api::post.post")
                      .findOne({ where: { id: post?.id } });
                    if (!exist) {
                      await strapi
                        .service("api::post.post")
                        .create({ data: post });
                    }else{
                      console.log(`Post with ${post?.id} already exists`)
                    }
                  } catch (error) {
                    console.error(
                      `Error creating post with ID ${post.id}: `,
                      error
                    );
                  }
                }
              })
            );
            message = "migration completed successfully!";
            console.log(`Page ${page} migration completed successfully!`);
            page++;
          } catch (error) {
            message = `${error.message} || ${error.stack}`;
            success = false;
            break;
          }
        
        }
  
        ctx.send({
          success,
          postPerPage: batch,
          totalPages: totalPage,
          startPage: firstPage,
          lastPage: page - 1,
          message,
        });
      },
})