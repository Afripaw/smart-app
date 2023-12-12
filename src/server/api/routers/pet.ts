import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const petRouter = createTRPCRouter({
  create: protectedProcedure
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
});
