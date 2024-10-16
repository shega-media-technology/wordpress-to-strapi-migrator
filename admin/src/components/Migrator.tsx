import SButton from "./CommonButton";
import InputField from "./InputField";
import useMigrateCategory from "../hook/useMigrateCategory";
import useMigrator from "../hook/useMigrator";

interface MigratorProps {
  handleStartPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleEndPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleBatch: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFieldMapping: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRestApi: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  handleMigration: (
    start: number,
    end: number,
    batch: number,
    restAPI: string,
    fieldMap:string[],
  ) => void;
  startPage: number;
  endPage: number;
  batch: number;
  restApi: string;
  fieldMap:string[]
}
const Migrator = ({
  handleStartPage,
  handleEndPage,
  handleBatch,
  handleRestApi,
  handleMigration,
  handleFieldMapping,
  startPage,
  endPage,
  batch,
  restApi,
  label,
  fieldMap,
}: MigratorProps) => {
 
  return (
    <div className="migrateContent">
    
     
    <div className="migrateCategory">
      <InputField
        id="start-page"
        label="Start Page:"
        type="number"
        widthCss="input-field1"
        labelCss="label-width1"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          handleStartPage(event)
        }
      />
      <InputField
        id="rest-page"
        label="End Page:"
        type="number"
        widthCss="input-field1"
        labelCss="label-width1"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          handleEndPage(event)
        }
      />
      <InputField
        id="batch"
        label="Batch:"
        type="number"
        widthCss="input-field1"
        labelCss="label-width1"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          handleBatch(event)
        }
      />
      <InputField
        id="rest-api"
        label="REST API:"
        widthCss="input-field1"
        labelCss="label-width1"
        type="string"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          handleRestApi(event)
        }
      />
      <SButton
        id="migrate-button"
        onClick={() =>
          handleMigration(startPage, endPage, batch, restApi,fieldMap)
        }
        label={label}
        startPage={startPage}
        endPage={endPage}
        batch={batch}
        restAPI={restApi}
      />
    </div>
    </div>
  );
};

export default Migrator;
