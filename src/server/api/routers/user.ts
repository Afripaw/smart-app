import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

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
        addressStreet: z.string(),
        addressStreetCode: z.string(),
        addressStreetNumber: z.string(),
        addressSuburb: z.string(),
        addressPostalCode: z.string(),
        preferredCommunication: z.string(),
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
          password: input.password,
          surname: input.surname,
          mobile: input.mobile,
          addressGreaterArea: input.addressGreaterArea,
          addressStreet: input.addressStreet,
          addressStreetCode: input.addressStreetCode,
          addressStreetNumber: input.addressStreetNumber,
          addressSuburb: input.addressSuburb,
          addressPostalCode: input.addressPostalCode,
          preferredCommunication: input.preferredCommunication,
          role: input.role,
          status: input.status,
          comments: input.comments,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        userID: z.string(),
        firstName: z.string(),
        email: z.string().email(),
        password: z.string().min(3),
        surname: z.string(),
        mobile: z.string().max(10),
        addressGreaterArea: z.string(),
        addressStreet: z.string(),
        addressStreetCode: z.string(),
        addressStreetNumber: z.string(),
        addressSuburb: z.string(),
        addressPostalCode: z.string(),
        preferredCommunication: z.string(),
        role: z.string(),
        status: z.string(),
        comments: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: {
          id: input.userID,
        },
        data: {
          name: input.firstName,
          email: input.email,
          password: input.password,
          surname: input.surname,
          mobile: input.mobile,
          addressGreaterArea: input.addressGreaterArea,
          addressStreet: input.addressStreet,
          addressStreetCode: input.addressStreetCode,
          addressStreetNumber: input.addressStreetNumber,
          addressSuburb: input.addressSuburb,
          addressPostalCode: input.addressPostalCode,
          preferredCommunication: input.preferredCommunication,
          role: input.role,
          status: input.status,
          comments: input.comments,
          updatedAt: new Date(),
        },
      });
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
      });
    }),
});
