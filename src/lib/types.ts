import { Prisma } from "@prisma/client";
import { BaseDMMF } from "@prisma/client/runtime/library";

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
  models: Partial<Record<Prisma.ModelName, ModelConfig | boolean>>;
  defaultConfig?: ModelConfig;
  dmmf?: BaseDMMF;
};
