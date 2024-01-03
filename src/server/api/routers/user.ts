import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const UserRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        firstName: z.string(),
        email: z.string().email(),
        password: z.string().min(3),
        surname: z.string(),
        mobile: z.string().max(10),
        addressGreaterArea: z.string(),
        addressArea: z.string(),
        addressStreet: z.string(),
        addressStreetCode: z.string(),
        addressStreetNumber: z.string(),
        addressSuburb: z.string(),
        addressPostalCode: z.string(),
        preferredCommunication: z.string(),
        startingDate: z.date(),
        role: z.string(),
        status: z.string(),
        comments: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.create({
        data: {
          name: input.firstName,
          email: input.email,
          password: ctx.security.hash(input.password),
          surname: input.surname,
          mobile: input.mobile,
          addressGreaterArea: input.addressGreaterArea,
          addressArea: input.addressArea,
          addressStreet: input.addressStreet,
          addressStreetCode: input.addressStreetCode,
          addressStreetNumber: input.addressStreetNumber,
          addressSuburb: input.addressSuburb,
          addressPostalCode: input.addressPostalCode,
          preferredCommunication: input.preferredCommunication,
          role: input.role,
          status: input.status,
          comments: input.comments,
          startingDate: input.startingDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string(),
        email: z.string().email(),
        password: z.string(),
        surname: z.string(),
        mobile: z.string().max(10),
        addressGreaterArea: z.string(),
        addressArea: z.string(),
        addressStreet: z.string(),
        addressStreetCode: z.string(),
        addressStreetNumber: z.string(),
        addressSuburb: z.string(),
        addressPostalCode: z.string(),
        preferredCommunication: z.string(),
        startingDate: z.date(),
        role: z.string(),
        status: z.string(),
        comments: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.password !== "") {
        const user = await ctx.db.user.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.firstName,
            email: input.email,
            password: ctx.security.hash(input.password),
            surname: input.surname,
            mobile: input.mobile,
            addressGreaterArea: input.addressGreaterArea,
            addressArea: input.addressArea,
            addressStreet: input.addressStreet,
            addressStreetCode: input.addressStreetCode,
            addressStreetNumber: input.addressStreetNumber,
            addressSuburb: input.addressSuburb,
            addressPostalCode: input.addressPostalCode,
            preferredCommunication: input.preferredCommunication,
            startingDate: input.startingDate,
            role: input.role,
            status: input.status,
            comments: input.comments,
            updatedAt: new Date(),
          },
        });
        return user;
      } else {
        const user = await ctx.db.user.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.firstName,
            email: input.email,
            surname: input.surname,
            mobile: input.mobile,
            addressGreaterArea: input.addressGreaterArea,
            addressArea: input.addressArea,
            addressStreet: input.addressStreet,
            addressStreetCode: input.addressStreetCode,
            addressStreetNumber: input.addressStreetNumber,
            addressSuburb: input.addressSuburb,
            addressPostalCode: input.addressPostalCode,
            preferredCommunication: input.preferredCommunication,
            startingDate: input.startingDate,
            role: input.role,
            status: input.status,
            comments: input.comments,
            updatedAt: new Date(),
          },
        });
        return user;
      }
    }),

  deleteAll: publicProcedure.mutation(async ({ ctx }) => {
    return await ctx.db.user.deleteMany({});
  }),

  getUserDetails: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findMany({
      where: { id: ctx.session.user.id },
    });
  }),

  getAllUsers: publicProcedure.query(({ ctx }) => {
    return ctx.db.user.findMany();
  }),

  //get the las id of the user
  getLastUserID: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findFirst({
      orderBy: {
        id: "desc",
      },
    });
  }),

  //implement full text search for users
  searchUsers: publicProcedure
    .input(
      z.object({
        searchQuery: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.user.findMany({
        where: {
          OR: [
            //{ userID: { contains: input.searchQuery } },
            { name: { contains: input.searchQuery } },
            { surname: { contains: input.searchQuery } },
            { email: { contains: input.searchQuery } },
            { role: { contains: input.searchQuery } },
            { status: { contains: input.searchQuery } },
            { mobile: { contains: input.searchQuery } },
            { addressGreaterArea: { contains: input.searchQuery } },
            { addressStreet: { contains: input.searchQuery } },
            { addressStreetCode: { contains: input.searchQuery } },
            { addressStreetNumber: { contains: input.searchQuery } },
            { addressSuburb: { contains: input.searchQuery } },
            { addressPostalCode: { contains: input.searchQuery } },
            { preferredCommunication: { contains: input.searchQuery } },
            { comments: { contains: input.searchQuery } },
          ],
        },
        orderBy: {
          userID: "asc",
        },
      });
    }),

  //get user by it's userID
  getUserByID: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      console.log(input.id);
      const user = await ctx.db.user.findUnique({
        where: {
          id: input.id,
        },
      });
      console.log(user);
      return user;
    }),

  //delete user
  deleteUser: publicProcedure
    .input(
      z.object({
        userID: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.delete({
        where: {
          id: input.userID,
        },
      });
    }),
});
