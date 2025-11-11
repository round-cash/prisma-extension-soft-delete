import { createSoftDeleteExtension } from "../../src";
import { MockClient } from "./utils/mockClient";
import { Prisma } from "@prisma/client";

describe("aggregate", () => {
  it("does not change aggregate action if model is not in the list", async () => {
    const client = new MockClient();
    const extendedClient = client.$extends(
      createSoftDeleteExtension({ models: {}, dmmf: Prisma.dmmf })
    );

    await extendedClient.user.aggregate({
      where: { email: { contains: "test" } },
      _sum: { id: true },
    });

    // args have not been modified
    expect(extendedClient.user.aggregate.query).toHaveBeenCalledWith({
      where: { email: { contains: "test" } },
      _sum: { id: true },
    });
  });

  it("excludes deleted records from aggregate with no where", async () => {
    const client = new MockClient();
    const extendedClient = client.$extends(
      createSoftDeleteExtension({
        models: {
          User: true,
        },
        dmmf: Prisma.dmmf,
      })
    );

    await extendedClient.user.aggregate({});

    // args have been modified
    expect(extendedClient.user.aggregate.query).toHaveBeenCalledWith({
      where: { deleted: false },
    });
  });

  it("excludes deleted record from aggregate with where", async () => {
    const client = new MockClient();
    const extendedClient = client.$extends(
      createSoftDeleteExtension({
        models: {
          User: true,
        },
        dmmf: Prisma.dmmf,
      })
    );

    await extendedClient.user.aggregate({
      where: { email: { contains: "test" } },
    });

    // args have been modified
    expect(extendedClient.user.aggregate.query).toHaveBeenCalledWith({
      where: { email: { contains: "test" }, deleted: false },
    });
  });
});
