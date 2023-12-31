import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const petRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        petName: z.string().min(1),
        species: z.string().min(1),
        sex: z.string().min(1),
        age: z.string().min(1),
        breed: z.string().min(1),
        colour: z.string().min(1),
        markings: z.string().min(1),
        status: z.string().min(1),
        sterilisedStatus: z.string().min(1),
        sterilisedRequested: z.string().min(1),
        sterilisedRequestSigned: z.string().min(1),
        vaccinatedStatus: z.string().min(1),
        treatments: z.string().min(1),
        clinicsAttended: z.string().array().min(1),
        lastDeWorming: z.string().min(1),
        membership: z.string().min(1),
        cardStatus: z.string().min(1),
        kennelReceived: z.string().min(1),
        comments: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      //create pet
      const pet = await ctx.db.pet.create({
        data: {
          petName: input.petName,
          owner: {
            connect: {
              ownerID: ctx.db.petOwner.fields.ownerID as unknown as number,
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
          vaccinatedStatus: input.vaccinatedStatus,
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
        petName: z.string().min(1),
        species: z.string().min(1),
        sex: z.string().min(1),
        age: z.string().min(1),
        breed: z.string().min(1),
        colour: z.string().min(1),
        markings: z.string().min(1),
        status: z.string().min(1),
        sterilisedStatus: z.string().min(1),
        sterilisedRequested: z.string().min(1),
        sterilisedRequestSigned: z.string().min(1),
        vaccinatedStatus: z.string().min(1),
        treatments: z.string().min(1),
        clinicsAttended: z.string().array().min(1),
        lastDeWorming: z.string().min(1),
        membership: z.string().min(1),
        cardStatus: z.string().min(1),
        kennelReceived: z.string().min(1),
        comments: z.string().min(1),
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
          vaccinatedStatus: input.vaccinatedStatus,
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

  //get one pet
  getPet: protectedProcedure
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
