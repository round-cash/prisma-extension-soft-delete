export type RelationField = {
  name: string;
  kind: string;
  isList: boolean;
  type: string;
  relationName: string;
};

export type ModelsMeta = Record<
  string,
  {
    uniqueFields: string[];
    uniqueIndexFields: string[];
    relations: RelationField[];
  }
>;

export type Context = {
  uniqueFieldsByModel: Record<string, string[]>;
  uniqueIndexFieldsByModel: Record<string, string[]>;
};

export type ModelConfig = {
  field: string;
  createValue: (deleted: boolean) => any;
  allowToOneUpdates?: boolean;
  allowCompoundUniqueIndexWhere?: boolean;
};

export type Config = {
  models: Record<string, ModelConfig | boolean>;
  defaultConfig?: ModelConfig;
  modelsMeta: ModelsMeta;
};
