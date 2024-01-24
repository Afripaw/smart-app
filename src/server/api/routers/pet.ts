import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const petRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        ownerID: z.number(),
        petName: z.string(),
        species: z.string(),
        sex: z.string(),
        age: z.string(),
        breed: z.string(),
        colour: z.string(),
        markings: z.string(),
        status: z.string(),
        sterilisedStatus: z.string(),
        sterilisedRequested: z.string(),
        sterilisedRequestSigned: z.string(),
        sterilisationOutcome: z.string(),
        vaccinationShot1: z.string(),
        vaccinationShot2: z.string(),
        vaccinationShot3: z.string(),
        treatments: z.string(),
        clinicsAttended: z.string().array(),
        lastDeWorming: z.string(),
        membership: z.string(),
        cardStatus: z.string(),
        kennelReceived: z.string(),
        comments: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      //create pet
      const pet = await ctx.db.pet.create({
        data: {
          petName: input.petName,
          owner: {
            connect: {
              //ownerID: ctx.db.petOwner.fields.ownerID as unknown as number,
              ownerID: input.ownerID,
            },
          },
          species: input.species,
          sex: input.sex,
          age: input.age,
          breed: input.breed,
          colour: input.colour,
          markings: input.markings,
          status: input.status,
          sterilisedStatus: input.sterilisedStatus,
          sterilisedRequested: input.sterilisedRequested,
          sterilisedRequestSigned: input.sterilisedRequestSigned,
          sterilisationOutcome: input.sterilisationOutcome,
          vaccinationShot1: input.vaccinationShot1,
          vaccinationShot2: input.vaccinationShot2,
          vaccinationShot3: input.vaccinationShot3,
          treatments: input.treatments,
          clinicsAttended: input.clinicsAttended,
          lastDeworming: input.lastDeWorming,
          membership: input.membership,
          cardStatus: input.cardStatus,
          kennelReceived: input.kennelReceived,
          comments: input.comments,
          createdAt: new Date(),
        },
      });

      return pet;
    }),

  //Delete pet
  delete: protectedProcedure
    .input(
      z.object({
        petID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pet = await ctx.db.pet.delete({
        where: {
          petID: input.petID,
        },
      });
      return pet;
    }),

  //Update pet
  update: protectedProcedure
    .input(
      z.object({
        petID: z.number(),
        petName: z.string(),
        species: z.string(),
        sex: z.string(),
        age: z.string(),
        breed: z.string(),
        colour: z.string(),
        markings: z.string(),
        status: z.string(),
        sterilisedStatus: z.string(),
        sterilisedRequested: z.string(),
        sterilisedRequestSigned: z.string(),
        sterilisedOutcome: z.string(),
        vaccinationShot1: z.string(),
        vaccinationShot2: z.string(),
        vaccinationShot3: z.string(),
        treatments: z.string(),
        clinicsAttended: z.string().array(),
        lastDeWorming: z.string(),
        membership: z.string(),
        cardStatus: z.string(),
        kennelReceived: z.string(),
        comments: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      //find pet with same id and update that pet
      const pet = await ctx.db.pet.update({
        where: {
          petID: input.petID,
        },
        data: {
          species: input.species,
          sex: input.sex,
          age: input.age,
          breed: input.breed,
          colour: input.colour,
          markings: input.markings,
          status: input.status,
          sterilisedStatus: input.sterilisedStatus,
          sterilisedRequested: input.sterilisedRequested,
          sterilisedRequestSigned: input.sterilisedRequestSigned,
          sterilisationOutcome: input.sterilisedOutcome,
          vaccinationShot1: input.vaccinationShot1,
          vaccinationShot2: input.vaccinationShot2,
          vaccinationShot3: input.vaccinationShot3,
          treatments: input.treatments,
          clinicsAttended: input.clinicsAttended,
          lastDeworming: input.lastDeWorming,
          membership: input.membership,
          cardStatus: input.cardStatus,
          kennelReceived: input.kennelReceived,
          comments: input.comments,
          updatedAt: new Date(),
        },
      });
      return pet;
    }),

  //Infinite query and search for volunteers
  searchPetsInfinite: publicProcedure
    .input(
      z.object({
        petID: z.number(),
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
            { petName: { contains: term } },
            { species: { contains: term } },
            { sex: { contains: term } },
            { age: { contains: term } },
            { breed: { contains: term } },
            { colour: { contains: term } },
            { markings: { contains: term } },
            { status: { contains: term } },
            { sterilisedStatus: { contains: term } },
            { sterilisedRequested: { contains: term } },
            { sterilisedRequestSigned: { contains: term } },
            { vaccinatedStatus: { contains: term } },
            { treatments: { contains: term } },
            { lastDeworming: { contains: term } },
            { membership: { contains: term } },
            { cardStatus: { contains: term } },
            { kennelReceived: { contains: term } },
            { comments: { contains: term } },
            dateCondition,
          ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
        };
      });

      const order: Record<string, string> = {};

      if (input.order !== "petName") {
        order.updatedAt = "desc";
      } else {
        order.petName = "asc";
      }

      const user = await ctx.db.pet.findMany({
        where: {
          AND: searchConditions,
        },
        orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { petID: input.cursor } : undefined,
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (user.length > input.limit) {
        const nextRow = user.pop();
        newNextCursor = nextRow?.petID;
      }

      return {
        user_data: user,
        nextCursor: newNextCursor,
      };
    }),

  //delete pet
  deletePet: publicProcedure
    .input(
      z.object({
        petID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.pet.delete({
        where: {
          petID: input.petID,
        },
      });
    }),

  //get one pet
  getPetByID: protectedProcedure
    .input(
      z.object({
        petID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const pet = await ctx.db.pet.findUnique({
        where: {
          petID: input.petID,
        },
      });
      return pet;
    }),

  //get all pets
  getAllPets: protectedProcedure.query(async ({ ctx }) => {
    const pet = await ctx.db.pet.findMany();
    return pet;
  }),

  //get all the pets who visited any pet clinic
  getAllPetsClinic: protectedProcedure.query(async ({ ctx }) => {
    const pet = await ctx.db.pet.findMany({
      where: {
        clinicsAttended: {
          isEmpty: false,
        },
      },
    });
    return pet;
  }),

  //get all the pets that are sterilised
  getAllPetsSterilised: protectedProcedure.query(async ({ ctx }) => {
    const pet = await ctx.db.pet.findMany({
      where: {
        sterilisedStatus: {
          not: "",
        },
      },
    });
    return pet;
  }),

  //get all the pets that have kennels
  getAllPetsKennel: protectedProcedure.query(async ({ ctx }) => {
    const pet = await ctx.db.pet.findMany({
      where: {
        kennelReceived: {
          not: "",
        },
      },
    });
    return pet;
  }),
});
