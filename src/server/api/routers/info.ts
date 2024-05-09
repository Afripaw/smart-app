import { z } from "zod";

import { Prisma } from "@prisma/client";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const infoRouter = createTRPCRouter({
  //Database report queries
  //sterilisation queries
  getSterilisationInfinite: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().default(0),
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        species: z.string(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //check what type of query it is and then decide what object will be in the where clause
      const sterilisationQuery =
        input.typeOfQuery === "Requested"
          ? { sterilisedRequested: { gte: input.startDate, lte: input.endDate } }
          : input.typeOfQuery === "Actioned"
            ? { sterilisationOutcome: { equals: "Actioned" }, sterilisationOutcomeDate: { gte: input.startDate, lte: input.endDate } }
            : input.typeOfQuery === "No show"
              ? { sterilisationOutcome: { equals: "No show" }, sterilisationOutcomeDate: { gte: input.startDate, lte: input.endDate } }
              : {};

      const data = await ctx.db.pet.findMany({
        where: {
          AND: [sterilisationQuery, { species: input.species }],
        },
        //orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { petID: input.cursor } : undefined,
        include: {
          owner: {
            select: {
              firstName: true,
              surname: true,
              mobile: true,
              addressGreaterArea: { select: { greaterArea: true } },
              addressArea: { select: { area: true } },
              addressStreet: { select: { street: true } },
              addressStreetCode: true,
              addressStreetNumber: true,
            },
          },
        },
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (data.length > input.limit) {
        const nextRow = data.pop();
        newNextCursor = nextRow?.petID;
      }

      return {
        data: data,
        nextCursor: newNextCursor,
      };
    }),

  //membership queries
  getMembershipInfinite: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().default(0),
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        species: z.string(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //check what type of query it is and then decide what object will be in the where clause
      const membershipQuery =
        input.typeOfQuery === "Standard card holder"
          ? { membership: { equals: "Standard card holder" }, membershipDate: { gte: input.startDate, lte: input.endDate } }
          : input.typeOfQuery === "Gold card holder"
            ? { membership: { equals: "Gold card holder" }, membershipDate: { gte: input.startDate, lte: input.endDate } }
            : {};

      const data = await ctx.db.pet.findMany({
        where: {
          AND: [membershipQuery, { species: input.species }],
        },
        //orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { petID: input.cursor } : undefined,
        include: {
          owner: {
            select: {
              firstName: true,
              surname: true,
              addressGreaterArea: { select: { greaterArea: true } },
              addressArea: { select: { area: true } },
              addressStreet: { select: { street: true } },
              addressStreetCode: true,
              addressStreetNumber: true,
            },
          },
          clinicsAttended: {
            select: {
              clinic: {
                select: {
                  date: true,
                },
              },
            },
          },
        },
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (data.length > input.limit) {
        const nextRow = data.pop();
        newNextCursor = nextRow?.petID;
      }

      return {
        data: data,
        nextCursor: newNextCursor,
      };
    }),

  //clinic queries
  getClinicInfinite: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().default(0),
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        singleDate: z.date(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //check what type of query it is and then decide what object will be in the where clause
      const clinicQuery =
        input.typeOfQuery === "Single Day"
          ? { clinicsAttended: { some: { clinic: { date: input.singleDate } } } }
          : { clinicsAttended: { some: { clinic: { date: { gte: input.startDate, lte: input.endDate } } } } };

      const data = await ctx.db.pet.findMany({
        where: {
          AND: [clinicQuery],
        },
        //orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { petID: input.cursor } : undefined,
        include: {
          owner: {
            select: {
              firstName: true,
              surname: true,
              mobile: true,
              addressGreaterArea: { select: { greaterArea: true } },
              addressArea: { select: { area: true } },
              addressStreet: { select: { street: true } },
              addressStreetCode: true,
              addressStreetNumber: true,
            },
          },
          clinicsAttended: true,
        },
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (data.length > input.limit) {
        const nextRow = data.pop();
        newNextCursor = nextRow?.petID;
      }

      return {
        data: data,
        nextCursor: newNextCursor,
      };
    }),

  //treatment queries
  getTreatmentInfinite: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().default(0),
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        singleDate: z.date(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //check what type of query it is and then decide what object will be in the where clause
      const treatmentQuery =
        input.typeOfQuery === "Single Day"
          ? { petTreatments: { some: { date: input.singleDate } } }
          : { petTreatments: { some: { date: { gte: input.startDate, lte: input.endDate } } } };

      const data = await ctx.db.pet.findMany({
        where: {
          AND: [treatmentQuery],
        },
        //orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { petID: input.cursor } : undefined,
        include: {
          owner: {
            select: {
              firstName: true,
              surname: true,
              mobile: true,
              addressGreaterArea: { select: { greaterArea: true } },
              addressArea: { select: { area: true } },
              addressStreet: { select: { street: true } },
              addressStreetCode: true,
              addressStreetNumber: true,
            },
          },
          petTreatments: true,
        },
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (data.length > input.limit) {
        const nextRow = data.pop();
        newNextCursor = nextRow?.petID;
      }

      return {
        data: data,
        nextCursor: newNextCursor,
      };
    }),

  //get all the pets where sterilisation requested is Yes and where the input is: two dates between which the sterilisation was requested as well as whether it is dogs or cats
  getRequestedSterilisation: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        species: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const pets = await ctx.db.pet.findMany({
        where: {
          AND: [
            {
              sterilisedRequested: {
                gte: input.startDate,
                lte: input.endDate,
              },
            },
            {
              species: input.species,
            },
          ],
        },
        include: {
          owner: true,
        },
      });

      return pets;
    }),

  //get all the pets where sterilisation Outcome is Actioned and where the input is: two dates between which the sterilisation outcome happened as well as whether it is dogs or cats
  getSterilisationOutcomeActioned: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        species: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const pets = await ctx.db.pet.findMany({
        where: {
          AND: [
            { sterilisationOutcome: { equals: "Actioned" } },
            {
              sterilisationOutcomeDate: {
                gte: input.startDate,
                lte: input.endDate,
              },
            },
            {
              species: input.species,
            },
          ],
        },
        include: {
          owner: true,
        },
      });

      return pets;
    }),

  //get all the pets where sterilisation Outcome is No show and where the input is: two dates between which the sterilisation outcome happened as well as whether it is dogs or cats
  getSterilisationOutcomeNoShow: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        species: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const pets = await ctx.db.pet.findMany({
        where: {
          AND: [
            { sterilisationOutcome: { equals: "No show" } },
            {
              sterilisationOutcomeDate: {
                gte: input.startDate,
                lte: input.endDate,
              },
            },
            {
              species: input.species,
            },
          ],
        },
        include: {
          owner: true,
        },
      });

      return pets;
    }),

  //get all pets that have a membership of standard card holder as well as the dates of the membership to and from and the species of the pets
  getStandardCardHolder: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        species: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const pets = await ctx.db.pet.findMany({
        where: {
          AND: [
            { cardStatus: { not: "Lapsed card holder" } },
            { membership: { equals: "Standard card holder" } },
            {
              membershipDate: {
                gte: input.startDate,
                lte: input.endDate,
              },
            },
            {
              species: input.species,
            },
          ],
        },
        include: {
          owner: true,
        },
      });

      return pets;
    }),

  //get all pets that have a membership of gold card holder as well as the dates of the membership to and from and the species of the pets
  getGoldCardHolder: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        species: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const pets = await ctx.db.pet.findMany({
        where: {
          AND: [
            { cardStatus: { not: "Lapsed card holder" } },
            { membership: { equals: "Gold card holder" } },
            {
              membershipDate: {
                gte: input.startDate,
                lte: input.endDate,
              },
            },
            {
              species: input.species,
            },
          ],
        },
        include: {
          owner: true,
        },
      });

      return pets;
    }),

  //get all pets that went on clinic dates to and from or only on a specific clinic date
  getPetsAttendedClinic: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const pets = await ctx.db.pet.findMany({
        where: {
          clinicsAttended: {
            some: {
              clinic: {
                date: {
                  gte: input.startDate,
                  lte: input.endDate,
                },
              },
            },
          },
        },
        include: {
          clinicsAttended: true,
          owner: true,
        },
      });

      return pets;
    }),

  //get All Pets where Treatment Date is populated, with the Ability to search on specific to and from PetClinic Dates or just on a single Pet Clinic Date.
  getPetsTreatmentDate: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const pets = await ctx.db.pet.findMany({
        where: {
          petTreatments: {
            some: {
              date: {
                gte: input.startDate,
                lte: input.endDate,
              },
            },
          },
        },
        include: {
          owner: true,
        },
      });

      return pets;
    }),
});
