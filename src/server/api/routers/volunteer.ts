import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const volunteerRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        firstName: z.string(),
        email: z.string().email(),
        surname: z.string(),
        mobile: z.string(),
        addressGreaterArea: z.string(),
        addressStreet: z.string(),
        addressStreetCode: z.string(),
        addressStreetNumber: z.string(),
        addressSuburb: z.string(),
        addressPostalCode: z.string(),
        addressFreeForm: z.string(),
        preferredCommunication: z.string(),
        status: z.string(),
        startingDate: z.date(),
        clinicAttended: z.string().array(),
        comments: z.string(),
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
          addressFreeForm: input.addressFreeForm,
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
        firstName: z.string(),
        email: z.string().email(),
        surname: z.string(),
        mobile: z.string(),
        addressGreaterArea: z.string(),
        addressStreet: z.string(),
        addressStreetCode: z.string(),
        addressStreetNumber: z.string(),
        addressSuburb: z.string(),
        addressPostalCode: z.string(),
        addressFreeForm: z.string(),
        preferredCommunication: z.string(),
        status: z.string(),
        startingDate: z.date(),
        clinicAttended: z.string().array(),
        comments: z.string(),
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
          addressFreeForm: input.addressFreeForm,
          preferredCommunication: input.preferredCommunication,
          startingDate: input.startingDate,
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
        volunteerID: z.number(),
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
          OR: [
            { firstName: { contains: term } },
            { surname: { contains: term } },
            { email: { contains: term } },
            { status: { contains: term } },
            { mobile: { contains: term } },
            { addressGreaterArea: { contains: term } },
            { addressStreet: { contains: term } },
            { addressStreetCode: { contains: term } },
            { addressStreetNumber: { contains: term } },
            { addressSuburb: { contains: term } },
            { addressPostalCode: { contains: term } },
            { addressFreeForm: { contains: term } },
            { preferredCommunication: { contains: term } },
            { comments: { contains: term } },
            dateCondition,
          ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
        };
      });

      const order: Record<string, string> = {};

      if (input.order !== "surname") {
        order.updatedAt = "desc";
      } else {
        order.surname = "asc";
      }

      const user = await ctx.db.volunteer.findMany({
        where: {
          AND: searchConditions,
        },
        orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { volunteerID: input.cursor } : undefined,
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (user.length > input.limit) {
        const nextRow = user.pop();
        newNextCursor = nextRow?.volunteerID;
      }

      return {
        user_data: user,
        nextCursor: newNextCursor,
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
  getVolunteer: publicProcedure
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

  //get all the volunteers that are active
  getActiveVolunteers: protectedProcedure.query(async ({ ctx }) => {
    const volunteers = await ctx.db.volunteer.findMany({
      where: {
        status: {
          equals: "Active",
        },
      },
    });

    return volunteers;
  }),
});
