import { z } from "zod";

import { Prisma } from "@prisma/client";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const infoRouter = createTRPCRouter({
  //Database report queries
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
