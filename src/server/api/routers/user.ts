import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const UserRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        email: z.string().email(),
        surname: z.string().min(1),
        mobile: z.string().min(1),
        addressGreaterArea: z.string().min(1),
        addressStreet: z.string().min(1),
        addressStreetCode: z.string().min(1),
        addressStreetNumber: z.string().min(1),
        addressSuburb: z.string().min(1),
        addressPostalCode: z.string().min(1),
        preferredCommunication: z.string().min(1),
        role: z.string().min(1),
        status: z.string().min(1),
        comments: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.create({
        data: {
          name: input.firstName,
          email: input.email,
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
        },
      });
    }),

  getUserDetails: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findMany({
      where: { id: ctx.session.user.id },
    });
  }),
});
