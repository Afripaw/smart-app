import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  // publicProcedure,
} from "~/server/api/trpc";

export const petClinicRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        greaterArea: z.string().min(1),
        area: z.string().min(1),
        conditions: z.string().min(1),
        comments: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const petClinic = await ctx.db.petClinic.create({
        data: {
          date: new Date(),
          greaterArea: input.greaterArea,
          area: input.area,
          conditions: input.conditions,
          comments: input.comments,
        },
      });

      return petClinic;
    }),

  // update the clinic
  update: protectedProcedure
    .input(
      z.object({
        clinicID: z.number(),
        greaterArea: z.string().min(1),
        area: z.string().min(1),
        conditions: z.string().min(1),
        comments: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const petClinic = await ctx.db.petClinic.update({
        where: {
          clinicID: input.clinicID,
        },
        data: {
          greaterArea: input.greaterArea,
          area: input.area,
          conditions: input.conditions,
          comments: input.comments,
        },
      });

      return petClinic;
    }),

  //get one pet clinic
  getClinic: protectedProcedure
    .input(
      z.object({
        clinicID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const petClinic = await ctx.db.petClinic.findUnique({
        where: {
          clinicID: input.clinicID,
        },
        select: {
          greaterArea: true,
          area: true,
          conditions: true,
          comments: true,
        },
      });
      return petClinic;
    }),

  //get all clinics
  getAllClinics: protectedProcedure.query(async ({ ctx }) => {
    const petClinic = await ctx.db.petClinic.findMany();
    return petClinic;
  }),
});
