import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const volunteerRouter = createTRPCRouter({
  create: publicProcedure
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
        startingDate: z.date(),
        clinicAttended: z.date().array().min(1),
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
          startingDate: input.startingDate,
          clinicsAttended: input.clinicAttended,
          comments: input.comments,
          createdAt: new Date(),
        },
      });

      return volunteer;
    }),

  //update volunteer
  update: publicProcedure
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
        startingDate: z.date(),
        clinicAttended: z.date().array().min(1),
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

  //Infinite query and search for volunteers
  searchVolunteersInfinite: publicProcedure
    .input(
      z.object({
        id: z.number(),
        limit: z.number(),
        cursor: z.number().default(0),
        searchQuery: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const volunteer = await ctx.db.volunteer.findMany({
        where: {
          OR: [
            { firstName: { contains: input.searchQuery } },
            { surname: { contains: input.searchQuery } },
            { email: { contains: input.searchQuery } },
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
          volunteerID: "asc",
        },
        take: input.limit + 1,
        cursor: input.cursor ? { volunteerID: input.cursor } : undefined,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (volunteer.length > input.limit) {
        const nextRow = volunteer.pop();
        nextCursor = nextRow?.volunteerID;
      }

      return {
        volunteer_data: volunteer,
        nextCursor,
      };
    }),

  //delete volunteer
  deleteVolunteer: publicProcedure
    .input(
      z.object({
        volunteerID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.volunteer.delete({
        where: {
          volunteerID: input.volunteerID,
        },
      });
    }),

  //get user by it's userID
  getVolunteerByID: publicProcedure
    .input(
      z.object({
        volunteerID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      console.log(input.volunteerID);
      const volunteer = await ctx.db.volunteer.findUnique({
        where: {
          volunteerID: input.volunteerID,
        },
      });
      console.log(volunteer);
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
