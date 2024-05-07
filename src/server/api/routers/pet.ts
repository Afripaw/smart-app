import { ChatText } from "phosphor-react";
import { z } from "zod";
//import Owner from "~/pages/owner";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

import { Prisma } from "@prisma/client";

export const petRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        ownerID: z.number(),
        petName: z.string(),
        species: z.string(),
        sex: z.string(),
        age: z.string(),
        breed: z.string().array(),
        colour: z.string().array(),
        size: z.string(),
        markings: z.string(),
        status: z.string(),
        sterilisedStatus: z.date(),
        sterilisedRequested: z.date(),
        sterilisedRequestSigned: z.string(),
        sterilisationOutcome: z.string(),
        sterilisationOutcomeDate: z.date(),
        vaccinationShot1: z.date(),
        vaccinationShot2: z.date(),
        vaccinationShot3: z.date(),
        treatments: z.string(),
        clinicsAttended: z.number().array(),
        lastDeWorming: z.date(),
        membership: z.string(),
        membershipDate: z.date(),
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
          size: input.size,
          markings: input.markings,
          status: input.status,
          sterilisedStatus: input.sterilisedStatus,
          sterilisedRequested: input.sterilisedRequested,
          sterilisedRequestSigned: input.sterilisedRequestSigned,
          sterilisationOutcome: input.sterilisationOutcome,
          sterilisationOutcomeDate: input.sterilisationOutcomeDate,
          vaccinationShot1: input.vaccinationShot1,
          vaccinationShot2: input.vaccinationShot2,
          vaccinationShot3: input.vaccinationShot3,
          lastDeworming: input.lastDeWorming,
          membership: input.membership,
          membershipDate: input.membershipDate,
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
      //delete all the relationships with the treatment
      await ctx.db.petTreatment.deleteMany({
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

  //Update pet
  update: protectedProcedure
    .input(
      z.object({
        petID: z.number(),
        petName: z.string(),
        species: z.string(),
        sex: z.string(),
        age: z.string(),
        breed: z.string().array(),
        colour: z.string().array(),
        size: z.string(),
        markings: z.string(),
        status: z.string(),
        sterilisedStatus: z.date(),
        sterilisedRequested: z.date(),
        sterilisedRequestSigned: z.string(),
        sterilisedOutcome: z.string(),
        sterilisationOutcomeDate: z.date(),
        vaccinationShot1: z.date(),
        vaccinationShot2: z.date(),
        vaccinationShot3: z.date(),
        treatments: z.string(),
        clinicsAttended: z.number().array(),
        lastDeWorming: z.date(),
        membership: z.string(),
        membershipDate: z.date(),
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
          petName: input.petName,
          species: input.species,
          sex: input.sex,
          age: input.age,
          breed: input.breed,
          colour: input.colour,
          size: input.size,
          markings: input.markings,
          status: input.status,
          sterilisedStatus: input.sterilisedStatus,
          sterilisedRequested: input.sterilisedRequested,
          sterilisedRequestSigned: input.sterilisedRequestSigned,
          sterilisationOutcome: input.sterilisedOutcome,
          sterilisationOutcomeDate: input.sterilisationOutcomeDate,
          vaccinationShot1: input.vaccinationShot1,
          vaccinationShot2: input.vaccinationShot2,
          vaccinationShot3: input.vaccinationShot3,
          lastDeworming: input.lastDeWorming,
          membership: input.membership,
          membershipDate: input.membershipDate,
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

      //-------------------------------------SEARCH CONDITIONS-------------------------------------
      // Construct a complex search condition
      const searchConditions = terms.map((term) => {
        // Check if term is a date
        // const termAsDate: Date = new Date(term);
        // console.log(termAsDate);
        // const dateCondition = !isNaN(termAsDate.getTime()) ? { updatedAt: { equals: termAsDate } } : {};

        // Check if term is a number
        if (term.match(/^P\d+$/) !== null) {
          return {
            OR: [
              { petID: { equals: Number(term.substring(1)) } },
              { petName: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { species: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { sex: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { age: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { breed: { hasSome: [term] } },
              { colour: { hasSome: [term] } },
              { size: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { markings: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { status: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { owner: { firstName: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { owner: { surname: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { owner: { addressGreaterArea: { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { owner: { addressArea: { area: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { owner: { addressStreet: { street: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              //{ owner: { addressStreetNumber: { contains: term } } },
              // { sterilisedStatus: { contains: term } },
              // { sterilisedRequested: { contains: term } },
              { sterilisedRequestSigned: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //{ petTreatments: { some: { type: { hasSome: [term] } } } },
              {
                petTreatments: {
                  some: {
                    type: {
                      some: {
                        type: {
                          type: {
                            contains: term,
                            mode: Prisma.QueryMode.insensitive,
                          },
                        },
                      },
                    },
                  },
                },
              },
              // { vaccinatedStatus: { contains: term } },
              //{ treatments: { contains: term } },
              { membership: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { cardStatus: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { comments: { contains: term, mode: Prisma.QueryMode.insensitive } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
        if (term.match(/^N\d+$/) !== null) {
          return {
            OR: [
              { owner: { ownerID: { equals: Number(term.substring(1)) } } },
              { petName: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { species: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { sex: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { age: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { breed: { hasSome: [term] } },
              { colour: { hasSome: [term] } },
              { size: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { markings: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { status: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { owner: { firstName: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { owner: { surname: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { owner: { addressGreaterArea: { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { owner: { addressArea: { area: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { owner: { addressStreet: { street: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              //{ owner: { addressStreetNumber: { contains: term } } },
              // { sterilisedStatus: { contains: term } },
              // { sterilisedRequested: { contains: term } },
              { sterilisedRequestSigned: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //{ petTreatments: { some: { type: { contains: term } } } },
              // { petTreatments: { type: { hasSome: [term] } } },
              //{ petTreatments: { some: { type: { hasSome: [term] } } } },
              {
                petTreatments: {
                  some: {
                    type: {
                      some: {
                        type: {
                          type: {
                            contains: term,
                            mode: Prisma.QueryMode.insensitive,
                          },
                        },
                      },
                    },
                  },
                },
              },
              // { vaccinatedStatus: { contains: term } },
              //{ treatments: { contains: term } },
              { membership: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { cardStatus: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { comments: { contains: term, mode: Prisma.QueryMode.insensitive } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else if (term.match(/^\d+$/) !== null) {
          return {
            OR: [
              { petName: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { species: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { sex: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { age: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { breed: { hasSome: [term] } },
              { colour: { hasSome: [term] } },
              { size: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { markings: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { status: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { owner: { firstName: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { owner: { surname: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { owner: { addressGreaterArea: { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { owner: { addressArea: { area: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { owner: { addressStreet: { street: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { owner: { addressStreetNumber: { equals: Number(term) } } },
              // { sterilisedStatus: { contains: term } },
              // { sterilisedRequested: { contains: term } },
              { sterilisedRequestSigned: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //{ petTreatments: { some: { type: { hasSome: [term] } } } },
              {
                petTreatments: {
                  some: {
                    type: {
                      some: {
                        type: {
                          type: {
                            contains: term,
                            mode: Prisma.QueryMode.insensitive,
                          },
                        },
                      },
                    },
                  },
                },
              },
              // { vaccinatedStatus: { contains: term } },
              //{ treatments: { contains: term } },
              { membership: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { cardStatus: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { comments: { contains: term, mode: Prisma.QueryMode.insensitive } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { petName: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { species: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { sex: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { age: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { breed: { hasSome: [term] } },
              { colour: { hasSome: [term] } },
              { size: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { markings: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { status: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { owner: { firstName: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { owner: { surname: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { owner: { addressGreaterArea: { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { owner: { addressArea: { area: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { owner: { addressStreet: { street: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              //{ owner: { addressStreetNumber: { contains: term } } },
              // { sterilisedStatus: { contains: term } },
              // { sterilisedRequested: { contains: term } },
              { sterilisedRequestSigned: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //{ petTreatments: { some: { type: { hasSome: [term] } } } },
              {
                petTreatments: {
                  some: {
                    type: {
                      some: {
                        type: {
                          type: {
                            contains: term,
                            mode: Prisma.QueryMode.insensitive,
                          },
                        },
                      },
                    },
                  },
                },
              },
              // { vaccinatedStatus: { contains: term } },
              //{ treatments: { contains: term } },
              { membership: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { cardStatus: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { comments: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //  dateCondition,
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
      });

      //-------------------------------------SEARCH CONDITIONS-------------------------------------

      const order: Record<string, string> = {};

      if (input.order === "updatedAt") {
        order.updatedAt = "desc";
      } else if (input.order === "petName") {
        order.petName = "asc";
      }

      const user = await ctx.db.pet.findMany({
        where: {
          AND: searchConditions,
          // OR: [
          //   {
          //     AND: searchConditions,
          //   },
          //   {
          //     owner: {
          //       AND: searchConditionsOwner,
          //     },
          //   },
          // ],
        },

        // orderBy: input.order === "address" ? {
        //   owner: {
        //     addressStreet: {
        //       street: "asc",
        //     },
        //     addressStreetNumber: "asc",
        //     addressGreaterArea: {
        //       greaterArea: "asc",
        //     },
        //   },
        // } : order,

        orderBy:
          input.order === "address"
            ? [
                {
                  owner: {
                    addressStreet: {
                      street: "asc",
                    },
                  },
                },
                {
                  owner: {
                    addressStreetNumber: "asc",
                  },
                },
                {
                  owner: {
                    addressGreaterArea: {
                      greaterArea: "asc",
                    },
                  },
                },
              ]
            : [order],

        take: input.limit + 1,
        cursor: input.cursor ? { petID: input.cursor } : undefined,
        include: {
          owner: {
            select: {
              ownerID: true,
              firstName: true,
              surname: true,
              addressArea: true,
              addressGreaterArea: true,
              addressStreet: true,
              addressStreetNumber: true,
            },
          },
          petTreatments: {
            select: {
              treatmentID: true,
              petID: true,
              category: true,
              comments: true,
              date: true,
              type: {
                select: {
                  type: {
                    select: {
                      type: true,
                    },
                  },
                },
              },
            },
          },
          clinicsAttended: true,
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
              area: true,
              greaterArea: true,
            },
          },
        },
      });

      //combine the user with the clinics
      const pet_data = user.map((pet) => {
        const clinic_data = clinics.filter((clinic) => clinic.petID === pet.petID);
        return {
          ...pet,
          clinic_data,
        };
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (pet_data.length > input.limit) {
        const nextRow = pet_data.pop();
        newNextCursor = nextRow?.petID;
      }

      return {
        pet_data: pet_data,
        nextCursor: newNextCursor,
      };

      //---------------------------------ORIGINAL CODE---------------------------------
      // //fetch the pet owners
      // const petOwner = await ctx.db.petOwner.findMany({
      //   where: {
      //     ownerID: {
      //       in: user.map((pet) => pet.ownerID),
      //     },
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

      // //fetch the clinics
      // const clinics = await ctx.db.petOnPetClinic.findMany({
      //   where: {
      //     petID: {
      //       in: user.map((pet) => pet.petID),
      //     },
      //   },
      //   select: {
      //     clinicID: true,
      //     petID: true,
      //     clinic: {
      //       select: {
      //         date: true,
      //         area: true,
      //       },
      //     },
      //   },
      // });

      // //fetch all the treatments
      // const treatments = await ctx.db.petTreatment.findMany({
      //   where: {
      //     petID: {
      //       in: user.map((pet) => pet.petID),
      //     },
      //   },
      // });

      // return {
      //   owner_data: petOwner,
      //   treatment_data: treatments,
      //   clinic_data: clinics,
      //   user_data: user,
      //   nextCursor: newNextCursor,
      // };
      //---------------------------------ORIGINAL CODE---------------------------------
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
      //find all the treatmentIDs for this pet
      const treatmentIDs = await ctx.db.petTreatment.findMany({
        where: {
          petID: input.petID,
        },
        select: {
          treatmentID: true,
        },
      });

      await ctx.db.typesOnTreatment.deleteMany({
        where: {
          treatmentID: {
            in: treatmentIDs.map((treatment) => treatment.treatmentID),
          },
        },
      });

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
        //throw new Error("Invalid pet ID");
        return {};
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
              area: true,
              greaterArea: true,
            },
          },
        },
      });

      const treatments = await ctx.db.petTreatment.findMany({
        where: {
          petID: input.petID,
        },
        select: {
          treatmentID: true,
          petID: true,
          category: true,
          comments: true,
          date: true,
          type: {
            select: {
              type: {
                select: {
                  type: true,
                },
              },
            },
          },
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
          breed: z.string().array(),
          colour: z.string().array(),
          size: z.string(),
          markings: z.string(),
          status: z.string(),
          sterilisedStatus: z.date(),
          sterilisedRequested: z.date(),
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
      // const result = await ctx.db.pet.createMany({
      //   data: input,
      // });
      // return result;

      const result = await Promise.all(
        input.map(async (pet) => {
          // Check if the owner exists
          const owner = await ctx.db.petOwner.findUnique({
            where: { ownerID: pet.ownerID },
          });

          // If the owner exists, create the pet
          if (owner) {
            return await ctx.db.pet.create({
              data: pet,
            });
          }

          // If the owner does not exist, return a message
          return { message: `Owner with ID ${pet.ownerID} does not exist` };
        }),
      );

      return result;
    }),

  //Update identification
  updateIdentification: publicProcedure
    .input(
      z.object({
        petID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.identification.update({
        where: {
          identificationID: 1,
        },
        data: {
          petID: input.petID,
          updatedAt: new Date(),
        },
      });
    }),

  //get latest petID from identification
  getLatestPetID: publicProcedure.query(async ({ ctx }) => {
    const identification = await ctx.db.identification.findUnique({
      where: {
        identificationID: 1,
      },
    });

    return identification;
  }),

  //get the amount of pets sterilised for each year and seperate into two variables. The first for dogs and the other for cats
  getAmountOfPetsSterilised: protectedProcedure.query(async ({ ctx }) => {
    const pets = await ctx.db.pet.findMany({
      where: {
        sterilisedStatus: {
          not: "No",
        },
      },
    });

    const dogs = pets.filter((pet) => pet.species === "Dog");
    const cats = pets.filter((pet) => pet.species === "Cat");

    //return all the pets that are sterilised in the last 5 years, and return an array of integers for each type of animal that is sterilised
    const dogsLast5Years = dogs.filter((pet) => pet.updatedAt.getFullYear() >= new Date().getFullYear() - 5); //SHOULD USE STERILISEDDATE. NOT UPDATEDAT
    const catsLast5Years = cats.filter((pet) => pet.updatedAt.getFullYear() >= new Date().getFullYear() - 5); //SHOULD USE STERILISEDDATE. NOT UPDATEDAT

    //Now group the pets by year
    const dogsGroupedByYear = dogsLast5Years.reduce(
      (acc, pet) => {
        const year = pet.updatedAt.getFullYear();
        if (acc[year]) {
          acc[year]++;
        } else {
          acc[year] = 1;
        }
        return acc;
      },
      {} as Record<number, number>,
    );

    const catsGroupedByYear = catsLast5Years.reduce(
      (acc, pet) => {
        const year = pet.updatedAt.getFullYear();
        if (acc[year]) {
          acc[year]++;
        } else {
          acc[year] = 1;
        }
        return acc;
      },
      {} as Record<number, number>,
    );

    return {
      dogs: dogsGroupedByYear,
      cats: catsGroupedByYear,
    };
  }),

  //get the amount of active pets for each year and seperate into two variables. The first for dogs and the other for cats
  getAmountOfActivePets: protectedProcedure.query(async ({ ctx }) => {
    const pets = await ctx.db.pet.findMany({
      where: {
        status: "Active",
      },
    });

    const dogs = pets.filter((pet) => pet.species === "Dog");
    const cats = pets.filter((pet) => pet.species === "Cat");

    //return all the pets that are sterilised in the last 5 years, and return an array of integers for each type of animal that is sterilised
    const dogsLast5Years = dogs.filter((pet) => pet.updatedAt.getFullYear() >= new Date().getFullYear() - 5); //SHOULD USE STERILISEDDATE. NOT UPDATEDAT
    const catsLast5Years = cats.filter((pet) => pet.updatedAt.getFullYear() >= new Date().getFullYear() - 5); //SHOULD USE STERILISEDDATE. NOT UPDATEDAT

    //Now group the pets by year
    const dogsGroupedByYear = dogsLast5Years.reduce(
      (acc, pet) => {
        const year = pet.updatedAt.getFullYear();
        if (acc[year]) {
          acc[year]++;
        } else {
          acc[year] = 1;
        }
        return acc;
      },
      {} as Record<number, number>,
    );

    const catsGroupedByYear = catsLast5Years.reduce(
      (acc, pet) => {
        const year = pet.updatedAt.getFullYear();
        if (acc[year]) {
          acc[year]++;
        } else {
          acc[year] = 1;
        }
        return acc;
      },
      {} as Record<number, number>,
    );

    return {
      dogs: dogsGroupedByYear,
      cats: catsGroupedByYear,
    };
  }),

  // //get amount of pets sterilised for last 5 years. Seperate into data into respective greater areas
  // getSterilisedPets: protectedProcedure.query(async ({ ctx }) => {
  //   const currentYear = new Date().getFullYear();
  //   const sterilisedPets = [];

  //   const greaterAreas = await ctx.db.greaterArea.findMany();

  //   for (const area of greaterAreas) {
  //     const pets = await ctx.db.pet.findMany({
  //       where: {
  //         AND: [
  //           {
  //             owner: {
  //               addressGreaterAreaID: area.greaterAreaID,
  //             },
  //           },
  //           {
  //             sterilisedStatus: {
  //               gte: new Date(currentYear - 4),
  //               lte: new Date(currentYear + 1),
  //             },
  //           },
  //         ],
  //       },
  //     });

  //     sterilisedPets.push({
  //       greaterArea: area.greaterArea,
  //       sterilisedPets: {
  //         [currentYear - 4]: pets.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear - 4).length,
  //         [currentYear - 3]: pets.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear - 3).length,
  //         [currentYear - 2]: pets.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear - 2).length,
  //         [currentYear - 1]: pets.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear - 1).length,
  //         [currentYear]: pets.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear).length,
  //       },
  //     });
  //   }

  //   return sterilisedPets;
  // }),

  //get the amount of pets that are sterilised for the last 5 years seperate them into dogs and cats
  getSterilisedPets: protectedProcedure.query(async ({ ctx }) => {
    const currentYear = new Date().getFullYear();

    const pets = await ctx.db.pet.findMany({
      where: {
        sterilisedStatus: {
          gte: new Date(new Date().getFullYear() - 4),
        },
      },
    });

    const dogs = pets.filter((pet) => pet.species === "Dog");
    const cats = pets.filter((pet) => pet.species === "Cat");

    const sterilisedDogs = {
      [currentYear - 4]: dogs.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear - 4).length,
      [currentYear - 3]: dogs.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear - 3).length,
      [currentYear - 2]: dogs.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear - 2).length,
      [currentYear - 1]: dogs.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear - 1).length,
      [currentYear]: dogs.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear).length,
    };

    const sterilisedCats = {
      [currentYear - 4]: cats.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear - 4).length,
      [currentYear - 3]: cats.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear - 3).length,
      [currentYear - 2]: cats.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear - 2).length,
      [currentYear - 1]: cats.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear - 1).length,
      [currentYear]: cats.filter((pet) => pet.sterilisedStatus.getFullYear() === currentYear).length,
    };

    return {
      dogs: sterilisedDogs,
      cats: sterilisedCats,
    };
  }),

  //kennels provided over the last 5 years
  getKennelsProvided: protectedProcedure.query(async ({ ctx }) => {
    //get kennels received over the last 5 years
    const pets4yearsAgo = await ctx.db.pet.findMany({
      where: {
        kennelReceived: {
          hasSome: ["Kennel received in " + (new Date().getFullYear() - 4).toString()],
        },
      },
    });

    const pets3yearsAgo = await ctx.db.pet.findMany({
      where: {
        kennelReceived: {
          hasSome: ["Kennel received in " + (new Date().getFullYear() - 3).toString()],
        },
      },
    });

    const pet2yearsAgo = await ctx.db.pet.findMany({
      where: {
        kennelReceived: {
          hasSome: ["Kennel received in " + (new Date().getFullYear() - 2).toString()],
        },
      },
    });

    const pet1yearsAgo = await ctx.db.pet.findMany({
      where: {
        kennelReceived: {
          hasSome: ["Kennel received in " + (new Date().getFullYear() - 1).toString()],
        },
      },
    });

    const pet = await ctx.db.pet.findMany({
      where: {
        kennelReceived: {
          hasSome: ["Kennel received in " + new Date().getFullYear().toString()],
        },
      },
    });

    const kennels = {
      [new Date().getFullYear() - 4]: pets4yearsAgo.length,
      [new Date().getFullYear() - 3]: pets3yearsAgo.length,
      [new Date().getFullYear() - 2]: pet2yearsAgo.length,
      [new Date().getFullYear() - 1]: pet1yearsAgo.length,
      [new Date().getFullYear()]: pet.length,
    };

    return kennels;
  }),

  // //Get all the owners that are active and sum these owners for each year for the last 5 years. seperate into respective greater areas
  getKennels: protectedProcedure.query(async ({ ctx }) => {
    const currentYear = new Date().getFullYear();
    const kennelsProvided: Record<number, Record<string, number>> = {};

    const greaterAreas = await ctx.db.greaterArea.findMany();

    const kennels = await ctx.db.pet.findMany({
      where: {
        kennelReceived: {
          isEmpty: false,
        },
      },
      include: {
        owner: {
          select: {
            addressGreaterArea: true,
          },
        },
      },
    });

    const kennelYears = kennels.filter((kennel) => kennel.kennelReceived.some((kennel) => kennel === "Kennel received in " + currentYear.toString()));
    for (let year = currentYear - 4; year <= currentYear; year++) {
      const kennelsInYear = kennels.filter((kennel) => kennel.kennelReceived.some((kennel) => kennel === "Kennel received in " + year.toString()));
      //activeOwners[year] = {};

      for (const area of greaterAreas) {
        const kennelsInArea = kennelsInYear.filter((kennel) => kennel.owner.addressGreaterArea.greaterAreaID === area.greaterAreaID).length;
        if (kennelsProvided[year] === undefined) {
          kennelsProvided[year] = {};
        }
        kennelsProvided[year]![area.greaterArea] = kennelsInArea;
      }
    }

    const transformedData = Object.entries(kennelsProvided).map(([category, value]) => ({
      category: Number(category),
      value,
    }));

    return {
      transformedData: transformedData,
      kennels: kennels,
      kennelYears: kennelYears,
    };
  }),

  //get the amount of pet clinics visited by dogs and cats respectively
  getClinicsVisited: protectedProcedure.query(async ({ ctx }) => {
    const dogVisitations = await ctx.db.petOnPetClinic.findMany({
      where: {
        pet: {
          species: "Dog",
        },
      },
    });

    const catVisitations = await ctx.db.petOnPetClinic.findMany({
      where: {
        pet: {
          species: "Cat",
        },
      },
    });

    return {
      dogs: dogVisitations.length,
      cats: catVisitations.length,
    };
    /*
    const pets = await ctx.db.pet.findMany();

    const dogs = pets.filter((pet) => pet.species === "Dog");
    const cats = pets.filter((pet) => pet.species === "Cat");

    //return all the pets that are sterilised in the last 5 years, and return an array of integers for each type of animal that is sterilised
    const dogsLast5Years = dogs.filter((pet) => pet.updatedAt.getFullYear() >= new Date().getFullYear() - 5); //SHOULD USE STERILISEDDATE. NOT UPDATEDAT
    const catsLast5Years = cats.filter((pet) => pet.updatedAt.getFullYear() >= new Date().getFullYear() - 5); //SHOULD USE STERILISEDDATE. NOT UPDATEDAT

    //Now group the pets by year
    const dogsGroupedByYear = dogsLast5Years.reduce(
      (acc, pet) => {
        const year = pet.updatedAt.getFullYear();
        if (acc[year]) {
          acc[year]++;
        } else {
          acc[year] = 1;
        }
        return acc;
      },
      {} as Record<number, number>,
    );

    const catsGroupedByYear = catsLast5Years.reduce(
      (acc, pet) => {
        const year = pet.updatedAt.getFullYear();
        if (acc[year]) {
          acc[year]++;
        } else {
          acc[year] = 1;
        }
        return acc;
      },
      {} as Record<number, number>,
    );

    return {
      dogs: dogsGroupedByYear,
      cats: catsGroupedByYear,
    };*/
  }),

  //get all the treatments for dogs and cats respectively
  getTreatments: protectedProcedure.query(async ({ ctx }) => {
    const pets = await ctx.db.pet.findMany();

    const dogs = pets.filter((pet) => pet.species === "Dog");
    const cats = pets.filter((pet) => pet.species === "Cat");

    const treatments = await ctx.db.petTreatment.findMany();

    const dogsTreatments = treatments.filter((treatment) => dogs.some((dog) => dog.petID === treatment.petID)).length;
    const catsTreatments = treatments.filter((treatment) => cats.some((cat) => cat.petID === treatment.petID)).length;

    return {
      dogs: dogsTreatments,
      cats: catsTreatments,
    };
  }),

  //download
  download: publicProcedure
    .input(
      z.object({
        searchQuery: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Parse the search query
      const terms = input.searchQuery.match(/\+\w+/g)?.map((term) => term.substring(1)) ?? [];

      //-------------------------------------SEARCH CONDITIONS-------------------------------------
      // Construct a complex search condition
      const searchConditions = terms.map((term) => {
        // Check if term is a date
        // const termAsDate: Date = new Date(term);
        // console.log(termAsDate);
        // const dateCondition = !isNaN(termAsDate.getTime()) ? { updatedAt: { equals: termAsDate } } : {};

        // Check if term is a number
        if (term.match(/^P\d+$/) !== null) {
          return {
            OR: [
              { petID: { equals: Number(term.substring(1)) } },
              { petName: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { species: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { sex: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { age: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { breed: { hasSome: [term] } },
              { colour: { hasSome: [term] } },
              { size: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { markings: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { status: { contains: term, mode: Prisma.QueryMode.insensitive } },
              {
                petTreatments: {
                  some: {
                    type: {
                      some: {
                        type: {
                          type: {
                            contains: term,
                            mode: Prisma.QueryMode.insensitive,
                          },
                        },
                      },
                    },
                  },
                },
              },
              // { sterilisedStatus: { contains: term } },
              // { sterilisedRequested: { contains: term } },
              { sterilisedRequestSigned: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //{ petTreatments: { some: { type: { contains: term } } } },
              // { vaccinatedStatus: { contains: term } },
              //{ treatments: { contains: term } },
              { membership: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { cardStatus: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { comments: { contains: term, mode: Prisma.QueryMode.insensitive } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { petName: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { species: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { sex: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { age: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { breed: { hasSome: [term] } },
              { colour: { hasSome: [term] } },
              { size: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { markings: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { status: { contains: term, mode: Prisma.QueryMode.insensitive } },
              {
                petTreatments: {
                  some: {
                    type: {
                      some: {
                        type: {
                          type: {
                            contains: term,
                            mode: Prisma.QueryMode.insensitive,
                          },
                        },
                      },
                    },
                  },
                },
              },
              // { sterilisedStatus: { contains: term } },
              // { sterilisedRequested: { contains: term } },
              { sterilisedRequestSigned: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //{ petTreatments: { some: { type: { contains: term } } } },
              // { vaccinatedStatus: { contains: term } },
              //{ treatments: { contains: term } },
              { membership: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { cardStatus: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { comments: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //  dateCondition,
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
      });

      //complex search condition for owner table
      const searchConditionsOwner = terms.map((term) => {
        // Check if term is a number
        if (term.match(/^N\d+$/) !== null) {
          return {
            OR: [
              { ownerID: { equals: Number(term.substring(1)) } },
              { firstName: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { surname: { contains: term, mode: Prisma.QueryMode.insensitive } },
              // { addressGreaterArea: { contains: term } },
              // { addressArea: { contains: term } },
              // { addressStreet: { contains: term } },
              // { addressStreetNumber: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { firstName: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { surname: { contains: term, mode: Prisma.QueryMode.insensitive } },
              // { addressGreaterArea: { contains: term } },
              // { addressArea: { contains: term } },
              // { addressStreet: { contains: term } },
              //{ addressStreetNumber: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
      });

      const pet = await ctx.db.pet.findMany({
        where: {
          OR: [
            {
              AND: searchConditions,
            },
            {
              owner: {
                AND: searchConditionsOwner,
              },
            },
          ],
        },

        orderBy: { petID: "asc" },
        // include: {
        //   owner: true,
        //   petTreatments: true,
        //   clinicsAttended: true,
        // },
      });

      return pet;
    }),
});
