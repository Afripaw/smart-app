import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const welcomePageRouter = createTRPCRouter({
  //make a query of all the active volunteers
  getVolunteers: publicProcedure.query(async ({ ctx }) => {
    const volunteers = await ctx.db.volunteer.findMany({
      where: {
        status: "Active",
      },
    });
    return volunteers;
  }),

  //Give me all the pets that are sterilised
  getSterilisedPets: publicProcedure.query(async ({ ctx }) => {
    const pets = await ctx.db.pet.findMany({
      where: {
        sterilisedStatus: "Yes",
      },
    });
    return pets;
  }),

  //Give me all the pet clinic visits
  getAllClinicVisits: publicProcedure.query(async ({ ctx }) => {
    let total = 0;
    const clinics = await ctx.db.pet.findMany({
      where: {
        clinicsAttended: {
          every: {
            clinicID: {
              gt: 0,
            },
          },
        },
      },
      include: {
        clinicsAttended: true,
      },
    });

    clinics.forEach((clinic) => {
      total += clinic.clinicsAttended.length;
    });

    return total;
  }),

  //Give me all the kennels
  getAllKennels: publicProcedure.query(async ({ ctx }) => {
    let total = 0;
    const kennels = await ctx.db.pet.findMany({
      where: {
        kennelReceived: {
          isEmpty: false,
        },
      },
    });

    kennels.forEach((kennel) => {
      total += kennel.kennelReceived.length;
    });
    return total;
  }),
});
