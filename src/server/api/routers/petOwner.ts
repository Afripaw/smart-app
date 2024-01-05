import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const petOwnerRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        email: z.string().email(),
        surname: z.string().min(1),
        mobile: z.string().min(1),
        addressGreaterArea: z.string().min(1),
        addressArea: z.string().min(1),
        addressStreet: z.string().min(1),
        addressStreetCode: z.string().min(1),
        addressStreetNumber: z.string().min(1),
        addressSuburb: z.string().min(1),
        preferredCommunication: z.string().min(1),
        role: z.string().min(1),
        status: z.string().min(1),
        startingDate: z.date(),
        comments: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const petOwner = await ctx.db.petOwner.create({
        data: {
          firstName: input.firstName,
          email: input.email,
          surname: input.surname,
          mobile: input.mobile,
          addressGreaterArea: input.addressGreaterArea,
          addressArea: input.addressArea,
          addressStreet: input.addressStreet,
          addressStreetCode: input.addressStreetCode,
          addressStreetNumber: input.addressStreetNumber,
          preferredCommunication: input.preferredCommunication,
          status: input.status,
          startingDate: input.startingDate,
          comments: input.comments,
          createdAt: new Date(),
        },
      });

      return petOwner;
    }),

  //update pet owner
  update: protectedProcedure
    .input(
      z.object({
        petOwnerID: z.number(),
        firstName: z.string().min(1),
        email: z.string().email(),
        surname: z.string().min(1),
        mobile: z.string().min(1),
        addressGreaterArea: z.string().min(1),
        addressStreet: z.string().min(1),
        addressStreetCode: z.string().min(1),
        addressStreetNumber: z.string().min(1),
        preferredCommunication: z.string().min(1),
        role: z.string().min(1),
        status: z.string().min(1),
        comments: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const petOwner = await ctx.db.petOwner.update({
        where: {
          ownerID: input.petOwnerID,
        },
        data: {
          firstName: input.firstName,
          email: input.email,
          surname: input.surname,
          mobile: input.mobile,
          addressGreaterArea: input.addressGreaterArea,
          addressStreet: input.addressStreet,
          addressStreetCode: input.addressStreetCode,
          addressStreetNumber: input.addressStreetNumber,
          preferredCommunication: input.preferredCommunication,
          status: input.status,
          comments: input.comments,
          updatedAt: new Date(),
        },
      });

      return petOwner;
    }),

  //get one pet owner
  getOwner: protectedProcedure
    .input(
      z.object({
        petOwnerID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const petOwner = await ctx.db.petOwner.findUnique({
        where: {
          ownerID: input.petOwnerID,
        },
      });

      return petOwner;
    }),

  //get all pet owners
  getAllOwners: protectedProcedure.query(async ({ ctx }) => {
    const petOwners = await ctx.db.petOwner.findMany();
    return petOwners;
  }),
});
