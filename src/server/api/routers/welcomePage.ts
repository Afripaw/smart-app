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
        OR: [
          {
            sterilisedStatus: {
              gt: new Date("1970-12-31T23:59:59.999Z"),
            },
          },
          {
            sterilisedStatus: {
              lt: new Date("1970-01-01T00:00:00.000Z"),
            },
          },
        ],
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

  //Pets fully vaccinated
  getPetsVaccinated: publicProcedure.query(async ({ ctx }) => {
    const pets = await ctx.db.pet.findMany({
      where: {
        OR: [
          {
            vaccinationShot3: {
              gt: new Date("1971-12-31T23:59:59.999Z"),
            },
          },
          {
            vaccinationShot3: {
              lt: new Date("1970-01-01T00:00:00.000Z"),
            },
          },
        ],
      },
    });
    return pets.length;
  }),

  //get all the pet treatments
  getAllTreatments: publicProcedure.query(async ({ ctx }) => {
    return (await ctx.db.petTreatment.findMany()).length;
  }),
});
