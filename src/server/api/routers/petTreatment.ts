import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const petTreatmentRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        petID: z.number(),
        category: z.string(),
        date: z.date(),
        type: z.string(),
        comments: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const petTreatment = await ctx.db.petTreatment.create({
        data: {
          date: input.date,
          pet: {
            connect: { petID: input.petID },
          },
          category: input.category,
          type: input.type,
          comments: input.comments,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return petTreatment;
    }),

  //update specific treatment
  update: publicProcedure
    .input(
      z.object({
        treatmentID: z.number(),
        category: z.string(),
        type: z.string(),
        comments: z.string(),
        date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const petTreatment = await ctx.db.petTreatment.update({
        where: {
          treatmentID: input.treatmentID,
        },
        data: {
          category: input.category,
          type: input.type,
          comments: input.comments,
          date: input.date,
          updatedAt: new Date(),
        },
      });
      return petTreatment;
    }),

  //Infinite query and search for volunteers
  searchTreatmentsInfinite: publicProcedure
    .input(
      z.object({
        treatmentID: z.number(),
        limit: z.number(),
        cursor: z.number().default(0),
        searchQuery: z.string(),
        order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Parse the search query
      const terms = input.searchQuery.match(/\+\w+/g)?.map((term) => term.substring(1)) ?? [];

      // Construct a complex search condition
      const searchConditions = terms.map((term) => {
        // Check if term is a date
        const termAsDate: Date = new Date(term);
        console.log(termAsDate);
        const dateCondition = !isNaN(termAsDate.getTime()) ? { updatedAt: { equals: termAsDate } } : {};
        return {
          OR: [{ category: { contains: term } }, { type: { contains: term } }, { comments: { contains: term } }, dateCondition].filter(
            (condition) => Object.keys(condition).length > 0,
          ), // Filter out empty conditions
        };
      });

      const order: Record<string, string> = {};

      if (input.order !== "date") {
        order.updatedAt = "desc";
      } else {
        order.date = "asc";
      }

      const user = await ctx.db.petTreatment.findMany({
        where: {
          AND: searchConditions,
        },
        orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { treatmentID: input.cursor } : undefined,
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (user.length > input.limit) {
        const nextRow = user.pop();
        newNextCursor = nextRow?.treatmentID;
      }

      //fetch the pet
      const pet = await ctx.db.pet.findMany({
        where: {
          petID: {
            in: user.map((treatment) => treatment.petID),
          },
        },
        select: {
          petID: true,
          petName: true,
          ownerID: true,
        },
      });

      //fetch the owner of the pet
      const owner = await ctx.db.petOwner.findMany({
        where: {
          ownerID: {
            in: pet.map((pet) => pet.ownerID),
          },
        },
        select: {
          ownerID: true,
          firstName: true,
          surname: true,
          addressGreaterArea: true,
          addressArea: true,
        },
      });

      return {
        pet_data: pet,
        user_data: user,
        owner_data: owner,
        nextCursor: newNextCursor,
      };
    }),

  //get one pet's treatment
  getTreatmentByID: publicProcedure
    .input(
      z.object({
        treatmentID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const petTreatment = await ctx.db.petTreatment.findUnique({
        where: {
          treatmentID: input.treatmentID,
        },
        select: {
          category: true,
          type: true,
          comments: true,
          petID: true,
          date: true,
          treatmentID: true,
        },
      });
      return petTreatment;
    }),

  //delete treatment
  deleteTreatment: publicProcedure
    .input(
      z.object({
        treatmentID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.petTreatment.delete({
        where: {
          treatmentID: input.treatmentID,
        },
      });
    }),

  //get all treatments
  getAllTreatments: protectedProcedure.query(async ({ ctx }) => {
    const petTreatment = await ctx.db.petTreatment.findMany();
    return petTreatment;
  }),
});
