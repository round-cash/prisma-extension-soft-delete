import { Prisma as PrismaExtensions } from "@prisma/client/extension";
import {
  NestedOperation,
  withNestedOperations,
} from "@roundtreasury/prisma-extension-nested-operations";
import {
  createAggregateParams,
  createCountParams,
  createDeleteManyParams,
  createDeleteParams,
  createFindFirstParams,
  createFindFirstOrThrowParams,
  createFindManyParams,
  createFindUniqueParams,
  createFindUniqueOrThrowParams,
  createIncludeParams,
  createSelectParams,
  createUpdateManyParams,
  createUpdateParams,
  createUpsertParams,
  createWhereParams,
  createGroupByParams,
  CreateParams,
  createContext,
} from "./helpers/createParams";

import { Config, Context, ModelConfig } from "./types";
import { ModifyResult, modifyReadResult } from "./helpers/modifyResult";

type ConfigBound<F> = F extends (
  c: Context,
  x: ModelConfig,
  ...args: infer P
) => infer R
  ? (...args: P) => R
  : never;

export function createSoftDeleteExtension({
  models,
  defaultConfig = {
    field: "deleted",
    createValue: Boolean,
    allowToOneUpdates: false,
    allowCompoundUniqueIndexWhere: false,
  },
  modelsMeta,
}: Config) {
  if (!defaultConfig.field) {
    throw new Error(
      "prisma-extension-soft-delete: defaultConfig.field is required"
    );
  }
  if (!defaultConfig.createValue) {
    throw new Error(
      "prisma-extension-soft-delete: defaultConfig.createValue is required"
    );
  }

  const modelConfig: Record<string, ModelConfig> = {};

  Object.keys(models).forEach((model) => {
    const config = models[model];
    if (config) {
      modelConfig[model] =
        typeof config === "boolean" && config ? defaultConfig : config;
    }
  });

  const context = createContext(modelsMeta);

  const createParamsByModel = Object.keys(modelConfig).reduce<
    Record<string, Record<string, ConfigBound<CreateParams> | undefined>>
  >((acc, model) => {
    const config = modelConfig[model]!;
    return {
      ...acc,
      [model]: {
        delete: createDeleteParams.bind(null, context, config),
        deleteMany: createDeleteManyParams.bind(null, context, config),
        update: createUpdateParams.bind(null, context, config),
        updateMany: createUpdateManyParams.bind(null, context, config),
        upsert: createUpsertParams.bind(null, context, config),
        findFirst: createFindFirstParams.bind(null, context, config),
        findFirstOrThrow: createFindFirstOrThrowParams.bind(
          null,
          context,
          config
        ),
        findUnique: createFindUniqueParams.bind(null, context, config),
        findUniqueOrThrow: createFindUniqueOrThrowParams.bind(
          null,
          context,
          config
        ),
        findMany: createFindManyParams.bind(null, context, config),
        count: createCountParams.bind(null, context, config),
        aggregate: createAggregateParams.bind(null, context, config),
        where: createWhereParams.bind(null, context, config),
        include: createIncludeParams.bind(null, context, config),
        select: createSelectParams.bind(null, context, config),
        groupBy: createGroupByParams.bind(null, context, config),
      },
    };
  }, {});

  const modifyResultByModel = Object.keys(modelConfig).reduce<
    Record<string, Record<string, ConfigBound<ModifyResult> | undefined>>
  >((acc, model) => {
    const config = modelConfig[model]!;
    return {
      ...acc,
      [model]: {
        include: modifyReadResult.bind(null, context, config),
        select: modifyReadResult.bind(null, context, config),
      },
    };
  }, {});

  return PrismaExtensions.defineExtension((client) => {
    return client.$extends({
      query: {
        $allModels: {
          $allOperations: withNestedOperations({
            modelsMeta,
            async $rootOperation(initialParams) {
              const model = String(initialParams.model || "");
              const createParams =
                createParamsByModel[model]?.[initialParams.operation];

              if (!createParams) return initialParams.query(initialParams.args);

              const { params, ctx } = createParams(initialParams as any);
              const { model: paramsModel } = params;

              const operationChanged =
                params.operation !== initialParams.operation;

              const result = operationChanged
                ? // @ts-expect-error - we don't know what the client is
                  await client[
                    paramsModel![0].toLowerCase() + paramsModel!.slice(1)
                  ][params.operation](params.args)
                : await params.query(params.args);

              const modifyResult =
                modifyResultByModel[params.model || ""]?.[params.operation];

              if (!modifyResult) return result;

              return modifyResult(result, params, ctx);
            },
            async $allNestedOperations(initialParams) {
              const model = String(initialParams.model || "");
              const createParams =
                createParamsByModel[model]?.[initialParams.operation];

              if (!createParams) return initialParams.query(initialParams.args);

              const { params, ctx } = createParams(initialParams);

              const result = await params.query(
                params.args,
                params.operation as NestedOperation
              );

              const modifyResult =
                modifyResultByModel[params.model || ""]?.[params.operation];

              if (!modifyResult) return result;

              return modifyResult(result, params, ctx);
            },
          }),
        },
      },
    } as any);
  });
}
