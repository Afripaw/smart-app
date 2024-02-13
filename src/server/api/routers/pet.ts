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
        colour: z.string().array(),
        markings: z.string(),
        status: z.string(),
        sterilisedStatus: z.string(),
        sterilisedRequested: z.string(),
        sterilisedRequestSigned: z.string(),
        sterilisationOutcome: z.string(),
        vaccinationShot1: z.date(),
        vaccinationShot2: z.date(),
        vaccinationShot3: z.date(),
        treatments: z.string(),
        clinicsAttended: z.number().array(),
        lastDeWorming: z.date(),
        membership: z.string(),
        cardStatus: z.string(),
        kennelReceived: z.string().array(),
        comments: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create pet
      const pet = await ctx.db.pet.create({
        data: {
          petName: input.petName,
          owner: {
            connect: {
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
          lastDeworming: input.lastDeWorming,
          membership: input.membership,
          cardStatus: input.cardStatus,
          kennelReceived: input.kennelReceived,
          comments: input.comments,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create relationships with clinics
      const clinicRelationships = input.clinicsAttended.map(async (clinicID) => {
        await ctx.db.petOnPetClinic.create({
          data: {
            pet: {
              connect: {
                petID: pet.petID,
              },
            },
            clinic: {
              connect: {
                clinicID: clinicID,
              },
            },
          },
        });
      });

      await Promise.all(clinicRelationships);

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
        colour: z.string().array(),
        markings: z.string(),
        status: z.string(),
        sterilisedStatus: z.string(),
        sterilisedRequested: z.string(),
        sterilisedRequestSigned: z.string(),
        sterilisedOutcome: z.string(),
        vaccinationShot1: z.date(),
        vaccinationShot2: z.date(),
        vaccinationShot3: z.date(),
        treatments: z.string(),
        clinicsAttended: z.number().array(),
        lastDeWorming: z.date(),
        membership: z.string(),
        cardStatus: z.string(),
        kennelReceived: z.string().array(),
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
          lastDeworming: input.lastDeWorming,
          membership: input.membership,
          cardStatus: input.cardStatus,
          kennelReceived: input.kennelReceived,
          comments: input.comments,
          updatedAt: new Date(),
        },
      });

      // Handle clinicsAttended
      // First, remove existing relationships
      await ctx.db.petOnPetClinic.deleteMany({
        where: {
          petID: input.petID,
        },
      });

      // Then, create new relationships with clinics
      const clinicRelationships = input.clinicsAttended.map(async (clinicID) => {
        await ctx.db.petOnPetClinic.create({
          data: {
            pet: {
              connect: {
                petID: pet.petID,
              },
            },
            clinic: {
              connect: {
                clinicID: clinicID,
              },
            },
          },
        });
      });

      await Promise.all(clinicRelationships);

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
            //{ colour: { contains: term } },
            { markings: { contains: term } },
            { status: { contains: term } },
            { sterilisedStatus: { contains: term } },
            { sterilisedRequested: { contains: term } },
            { sterilisedRequestSigned: { contains: term } },
            { vaccinatedStatus: { contains: term } },
            { treatments: { contains: term } },
            { membership: { contains: term } },
            { cardStatus: { contains: term } },
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

      //fetch the pet owners
      const petOwner = await ctx.db.petOwner.findMany({
        where: {
          ownerID: {
            in: user.map((pet) => pet.ownerID),
          },
        },
        select: {
          ownerID: true,
          firstName: true,
          surname: true,
          addressArea: true,
          addressGreaterArea: true,
          addressStreet: true,
          addressStreetNumber: true,
        },
      });

      //fetch the clinics
      const clinics = await ctx.db.petOnPetClinic.findMany({
        where: {
          petID: {
            in: user.map((pet) => pet.petID),
          },
        },
        select: {
          clinicID: true,
          petID: true,
          clinic: {
            select: {
              date: true,
            },
          },
        },
      });

      //fetch all the treatments
      const treatments = await ctx.db.petTreatment.findMany({
        where: {
          petID: {
            in: user.map((pet) => pet.petID),
          },
        },
      });

      return {
        owner_data: petOwner,
        treatment_data: treatments,
        clinic_data: clinics,
        user_data: user,
        nextCursor: newNextCursor,
      };
    }),

  //Add clinic to pet
  addClinicToPet: protectedProcedure
    .input(
      z.object({
        petID: z.number(),
        clinicID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.pet.update({
        where: {
          petID: input.petID,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      const pet = await ctx.db.petOnPetClinic.create({
        data: {
          pet: {
            connect: {
              petID: input.petID,
            },
          },
          clinic: {
            connect: {
              clinicID: input.clinicID,
            },
          },
        },
      });
      return pet;
    }),

  //delete pet
  deletePet: publicProcedure
    .input(
      z.object({
        petID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      //delete all the relationships with the treatment
      await ctx.db.petTreatment.deleteMany({
        where: {
          petID: input.petID,
        },
      });

      //delete all the relationships with the clinic
      await ctx.db.petOnPetClinic.deleteMany({
        where: {
          petID: input.petID,
        },
      });

      const pet = await ctx.db.pet.delete({
        where: {
          petID: input.petID,
        },
      });

      return pet;
    }),

  //get one pet
  getPetByID: protectedProcedure
    .input(
      z.object({
        petID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.petID === 0) {
        // Return some default response or error
        throw new Error("Invalid pet ID");
      }

      const pet = await ctx.db.pet.findUnique({
        where: {
          petID: input.petID,
        },
      });

      if (!pet) {
        // Handle the case where pet is not found
        throw new Error("Pet not found");
      }

      const owner = await ctx.db.petOwner.findUnique({
        where: {
          ownerID: pet?.ownerID,
        },
        select: {
          ownerID: true,
          firstName: true,
          surname: true,
          addressArea: true,
          addressGreaterArea: true,
          addressStreet: true,
          addressStreetNumber: true,
        },
      });

      const clinics = await ctx.db.petOnPetClinic.findMany({
        where: {
          petID: input.petID,
        },
        select: {
          clinicID: true,
          petID: true,
          clinic: {
            select: {
              date: true,
            },
          },
        },
      });

      const treatments = await ctx.db.petTreatment.findMany({
        where: {
          petID: input.petID,
        },
      });

      return {
        pet_data: pet,
        clinic_data: clinics,
        treatment_data: treatments,
        owner_data: owner,
      };

      // //Also get the owner of the pet
      // const owner = await ctx.db.petOwner.findUnique({
      //   where: {
      //     ownerID: pet?.ownerID,
      //   },
      //   select: {
      //     ownerID: true,
      //     firstName: true,
      //     surname: true,
      //     addressArea: true,
      //     addressGreaterArea: true,
      //     addressStreet: true,
      //     addressStreetNumber: true,
      //   },
      // });

      //combine the pet and owner data
    }),

  //get all pets
  getAllPets: protectedProcedure.query(async ({ ctx }) => {
    const pet = await ctx.db.pet.findMany();
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
  // getAllPetsKennel: protectedProcedure.query(async ({ ctx }) => {
  //   const pet = await ctx.db.pet.findMany({
  //     where: {
  //       kennelReceived: {
  //         not: "",
  //       },
  //     },
  //   });
  //   return pet;
  // }),

  //Delete all pets
  deleteAllPets: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.petTreatment.deleteMany();
    await ctx.db.petOnPetClinic.deleteMany();
    return await ctx.db.pet.deleteMany();
  }),

  //Bulk upload of all the owners
  insertExcelData: protectedProcedure
    .input(
      z.array(
        z.object({
          ownerID: z.number(),
          petName: z.string(),
          species: z.string(),
          sex: z.string(),
          age: z.string(),
          breed: z.string(),
          colour: z.string().array(),
          markings: z.string(),
          status: z.string(),
          sterilisedStatus: z.string(),
          sterilisedRequested: z.string(),
          sterilisedRequestSigned: z.string(),
          sterilisationOutcome: z.string(),
          vaccinationShot1: z.date(),
          vaccinationShot2: z.date(),
          vaccinationShot3: z.date(),
          lastDeworming: z.date(),
          membership: z.string(),
          cardStatus: z.string(),
          kennelReceived: z.string().array(),
          comments: z.string(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.pet.createMany({
        data: input,
      });
      return result;
    }),
});
