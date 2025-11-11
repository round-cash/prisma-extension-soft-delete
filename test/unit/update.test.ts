import { createSoftDeleteExtension } from "../../src";
import { MockClient } from "./utils/mockClient";
import { Prisma } from "@prisma/client";

describe("update", () => {
  it("does not change update action if model is not in the list", async () => {
    const client = new MockClient();
    const extendedClient = client.$extends(
      createSoftDeleteExtension({ models: {}, dmmf: Prisma.dmmf })
    );

    await extendedClient.user.update({
      where: { id: 1 },
      data: { email: "test@test.com" },
    });

    // params have not been modified
    expect(extendedClient.user.update.query).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { email: "test@test.com" },
    });
  });

  it("does not modify update results", async () => {
    const client = new MockClient();
    const extendedClient = client.$extends(
      createSoftDeleteExtension({ models: { User: true }, dmmf: Prisma.dmmf })
    );

    extendedClient.user.update.query.mockImplementation(
      () => Promise.resolve({ id: 1, name: "John" }) as any
    );
    const result = await extendedClient.user.update({
      where: { id: 1 },
      data: { name: "John" },
    });

    expect(result).toEqual({ id: 1, name: "John" });
  });

  it("throws when trying to update a model configured for soft delete through a toOne relation", async () => {
    const client = new MockClient();
    const extendedClient = client.$extends(
      createSoftDeleteExtension({
        models: { User: true },
        dmmf: Prisma.dmmf,
      })
    );

    await expect(
      extendedClient.post.update({
        where: { id: 1 },
        data: {
          author: {
            update: {
              email: "test@test.com",
            },
          },
        },
      })
    ).rejects.toThrowError(
      'prisma-extension-soft-delete: update of model "User" through "Post.author" found. Updates of soft deleted models through a toOne relation is not supported as it is possible to update a soft deleted record.'
    );
  });

  it("does nothing to nested update actions for toOne relations when allowToOneUpdates is true", async () => {
    const client = new MockClient();
    const extendedClient = client.$extends(
      createSoftDeleteExtension({
        models: { User: true },
        defaultConfig: {
          field: "deleted",
          createValue: Boolean,
          allowToOneUpdates: true,
        },
        dmmf: Prisma.dmmf,
      })
    );

    await extendedClient.post.update({
      where: { id: 1 },
      data: {
        author: {
          update: {
            email: "blah",
          },
        },
      },
    });

    // params have not been modified
    expect(extendedClient.post.update.query).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        author: {
          update: {
            email: "blah",
          },
        },
      },
    });
  });

  it("does nothing to nested update actions for toMany relations", async () => {
    const client = new MockClient();
    const extendedClient = client.$extends(
      createSoftDeleteExtension({
        models: { User: true },
        dmmf: Prisma.dmmf,
      })
    );

    await extendedClient.post.update({
      where: { id: 1 },
      data: {
        comments: {
          update: {
            where: {
              id: 2,
            },
            data: {
              content: "content",
            },
          },
        },
      },
    });

    // params have not been modified
    expect(extendedClient.post.update.query).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        comments: {
          update: {
            where: {
              id: 2,
            },
            data: {
              content: "content",
            },
          },
        },
      },
    });
  });

  it("does not modify update when no args are passed", async () => {
    const client = new MockClient();
    const extendedClient = client.$extends(
      createSoftDeleteExtension({ models: { User: true }, dmmf: Prisma.dmmf })
    );

    // @ts-expect-error - args are required
    await extendedClient.user.update(undefined);

    // params have not been modified
    expect(extendedClient.user.update.query).toHaveBeenCalledWith(undefined);
  });

  it("does not modify update when no where is passed", async () => {
    const client = new MockClient();
    const extendedClient = client.$extends(
      createSoftDeleteExtension({ models: { User: true }, dmmf: Prisma.dmmf })
    );

    // @ts-expect-error - where is required
    await extendedClient.user.update({});

    // params have not been modified
    expect(extendedClient.user.update.query).toHaveBeenCalledWith({});
  });
});
