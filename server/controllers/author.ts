/**
 * author controller
 */
const path = require('path');
import { Strapi } from '@strapi/strapi';
import { mapFields } from '../utils/mapField';
import { fetchJsonStructure } from '../utils/fetch-json-structure';

const fs = require('fs');
const filePath = path.join('./w_authors.json');

export default ({ strapi }: { strapi: Strapi }) => ({
    async migrateAuthors(ctx) {
      let authorCount=0
      const fileContent = fs.readFileSync(filePath, 'utf8');
      // const {authorAttribute} = ctx.request.body;
  
   const authorStructure=  await fetchJsonStructure()
    const data = JSON.parse(fileContent);
   
        for (const author of data.author) {
          try{
            const authorFields = mapFields(author,authorStructure?.author);
           
            const authorExists = await strapi
            .query("api::author.author")
            .findOne({ where: { id: author?.id } });
             if(!authorExists){
             const createAuthor = await strapi.service("api::author.author").create({
               data: {
                ...authorFields,
                slug: author?.name
                   .toString()
                   .toLowerCase()
                   .trim()
                   .replace(/\s+/g, "-")
                   .replace(/[^\w\-]+/g, "")
                   .replace(/\-\-+/g, "-"),
                 seo: {
                   metaTitle: author?.name,
                   metaDescription: author?.name,
                 },
               },
               publishedAt: new Date(),
             });
             authorCount++
             console.log(`inserted successfully: ${createAuthor.id}`);
            }else{
              console.log('Author already exists')
            }
          }catch (error) {
            console.error(
              `Error creating Author with ID ${author.id}: `,
              error
            );
          }
         
        }
        ctx.send({
          message: "Author migrated successfully",
          totalAuthor: authorCount,
        });
     
    },
   
  })

