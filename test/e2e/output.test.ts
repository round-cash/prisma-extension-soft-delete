import faker from "faker";

import { createSoftDeleteExtension } from "../../src";
import client from "./client";
import { Prisma, PrismaClient, Profile, User } from "./../../prisma/generated";

describe("output", () => {
  let testClient: any;
  let profile: Profile;
  let user: User;

  beforeAll(async () => {
    testClient = new PrismaClient();
    testClient = testClient.$extends(
      createSoftDeleteExtension({
        models: { Comment: true, Profile: true },
        dmmf: Prisma.dmmf,
      })
    );

    profile = await client.profile.create({
      data: {
        bio: "foo",
      },
    });
    user = await client.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.name.findName(),
        profileId: profile.id,
        comments: {
          create: [
            { content: "foo" },
            { content: "foo", deleted: true },
            { content: "bar", deleted: true },
          ],
        },
      },
    });
  });
  afterEach(async () => {
    // restore soft deleted profile
    await client.profile.update({
      where: { id: profile.id },
      data: {
        deleted: false,
      },
    });
  });
  afterAll(async () => {
    // disconnect test client
    await testClient.$disconnect();

    // delete user and related data
    await client.user.update({
      where: { id: user.id },
      data: {
        comments: { deleteMany: {} },
        profile: { delete: true },
      },
    });
    await client.user.delete({ where: { id: user.id } });
  });

  it("excludes deleted when filtering using 'is'", async () => {
    const foundUser = await testClient.user.findFirst({
      where: { profile: { is: { bio: "foo" } } },
    });
    expect(foundUser).not.toBeNull();
    expect(foundUser!.id).toEqual(user.id);

    // soft delete profile
    await testClient.profile.update({
      where: { id: profile?.id },
      data: { deleted: true },
    });

    const notFoundUser = await testClient.user.findFirst({
      where: { profile: { is: { bio: "foo" } } },
    });
    expect(notFoundUser).toBeNull();
  });
});
