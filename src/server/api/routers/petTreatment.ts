import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const petTreatmentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        category: z.string().min(1),
        type: z.string().min(1),
        comments: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const petTreatment = await ctx.db.petTreatment.create({
        data: {
          date: new Date(),
          pet: {
            connect: { petID: ctx.db.pet.fields.petID as unknown as number },
          },
          category: input.category,
          type: input.type,
          comments: input.comments,
        },
      });
      return petTreatment;
    }),

  //update specific treatment
  update: protectedProcedure
    .input(
      z.object({
        petID: z.number(),
        treatmentID: z.number(),
        category: z.string().min(1),
        type: z.string().min(1),
        comments: z.string().min(1),
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
        },
      });
      return petTreatment;
    }),

  //get one pet's treatment
  getTreatment: protectedProcedure
    .input(
      z.object({
        petID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const petTreatment = await ctx.db.petTreatment.findMany({
        where: {
          petID: input.petID,
        },
        select: {
          category: true,
          type: true,
          comments: true,
        },
      });
      return petTreatment;
    }),

  //get all treatments
  getAllTreatments: protectedProcedure.query(async ({ ctx }) => {
    const petTreatment = await ctx.db.petTreatment.findMany();
    return petTreatment;
  }),
});
