import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
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
});
