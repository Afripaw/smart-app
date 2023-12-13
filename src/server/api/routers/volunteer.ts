import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const volunteerRouter = createTRPCRouter({
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
        status: z.string().min(1),
        clinicAttended: z.string().array().min(1),
        comments: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      //Create the volunteer
      const volunteer = await ctx.db.volunteer.create({
        data: {
          firstName: input.firstName,
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
          status: input.status,
          clinicsAttended: input.clinicAttended,
          comments: input.comments,
          createdAt: new Date(),
        },
      });

      return volunteer;
    }),

  //update volunteer
  update: protectedProcedure
    .input(
      z.object({
        volunteerID: z.number(),
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
        status: z.string().min(1),
        clinicAttended: z.string().array().min(1),
        comments: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      //find volunteer with same id and update that volunteer
      const volunteer = await ctx.db.volunteer.update({
        where: {
          volunteerID: input.volunteerID,
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
          addressSuburb: input.addressSuburb,
          addressPostalCode: input.addressPostalCode,
          preferredCommunication: input.preferredCommunication,
          status: input.status,
          clinicsAttended: input.clinicAttended,
          comments: input.comments,
        },
      });

      return volunteer;
    }),

  //get one volunteer
  getVolunteer: protectedProcedure
    .input(
      z.object({
        volunteerID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const volunteer = await ctx.db.volunteer.findUnique({
        where: {
          volunteerID: input.volunteerID,
        },
      });

      return volunteer;
    }),

  //get all volunteers
  getVolunteers: protectedProcedure.query(async ({ ctx }) => {
    const volunteers = await ctx.db.volunteer.findMany();

    return volunteers;
  }),
});
