import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const petTreatmentRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        petID: z.number(),
        category: z.string(),
        date: z.date(),
        type: z.string(),
        comments: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const petTreatment = await ctx.db.petTreatment.create({
        data: {
          date: input.date,
          pet: {
            connect: { petID: input.petID },
          },
          category: input.category,
          type: input.type,
          comments: input.comments,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return petTreatment;
    }),

  //update specific treatment
  update: publicProcedure
    .input(
      z.object({
        treatmentID: z.number(),
        category: z.string(),
        type: z.string(),
        comments: z.string(),
        date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const petTreatment = await ctx.db.petTreatment.update({
        where: {
          treatmentID: input.treatmentID,
        },
        data: {
          category: input.category,
          type: input.type,
          comments: input.comments,
          date: input.date,
          updatedAt: new Date(),
        },
      });
      return petTreatment;
    }),

  //Infinite query and search for volunteers
  searchTreatmentsInfinite: publicProcedure
    .input(
      z.object({
        treatmentID: z.number(),
        limit: z.number(),
        cursor: z.number().default(0),
        searchQuery: z.string(),
        order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //------------------------------------------ORIGNAL CODE-------------------------------------
      // Parse the search query
      const terms = input.searchQuery.match(/\+\w+/g)?.map((term) => term.substring(1)) ?? [];

      // Construct a complex search condition for treatment table
      const searchConditions = terms.map((term) => {
        // Check if term is a number
        if (term.match(/^T\d+$/) !== null) {
          return {
            OR: [
              { treatmentID: { equals: Number(term.substring(1)) } },
              { category: { contains: term } },
              { type: { contains: term } },
              { comments: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [{ category: { contains: term } }, { type: { contains: term } }, { comments: { contains: term } }].filter(
              (condition) => Object.keys(condition).length > 0,
            ), // Filter out empty conditions
          };
        }
      });
      //------------------------------------------ORIGNAL CODE-------------------------------------

      //------------------------------------------NEW CODE-------------------------------------
      //complex search condition for pet table
      const searchConditionsPet = terms.map((term) => {
        // Check if term is a number
        if (term.match(/^P\d+$/) !== null) {
          return {
            OR: [
              { petID: { equals: Number(term.substring(1)) } },
              { petName: { contains: term } },
              { species: { contains: term } },
              { breed: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [{ petName: { contains: term } }, { species: { contains: term } }, { breed: { contains: term } }].filter(
              (condition) => Object.keys(condition).length > 0,
            ), // Filter out empty conditions
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
              { firstName: { contains: term } },
              { surname: { contains: term } },
              // { addressGreaterArea: { contains: term } },
              //  { addressArea: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { firstName: { contains: term } },
              { surname: { contains: term } },
              // { addressGreaterArea: { contains: term } },
              // { addressArea: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
      });
      //------------------------------------------NEW CODE-------------------------------------

      //-----------------------------------------ORIGNAL CODE-------------------------------------
      const order: Record<string, string> = {};

      if (input.order !== "date") {
        order.updatedAt = "desc";
      } else {
        order.date = "asc";
      }
      //-----------------------------------------ORIGNAL CODE-------------------------------------

      //-----------------------------------------NEW CODE-------------------------------------
      //------------------------------FIRST APPROACH-------------------------------------
      // const treatment = await ctx.db.petOwner.findMany({
      //   where: {
      //     AND: searchConditionsOwner,
      //   },
      //   select: {
      //     ownerID: true,
      //     firstName: true,
      //     surname: true,
      //     addressGreaterArea: true,
      //     addressArea: true,
      //     pets: {
      //       where: {
      //         AND: searchConditionsPet,
      //       },
      //       select: {
      //         petID: true,
      //         petName: true,
      //         species: true,
      //         breed: true,
      //         petTreatments: {
      //           where: {
      //             AND: searchConditions,
      //           },
      //           orderBy: order,
      //           take: input.limit + 1,
      //           cursor: input.cursor ? { treatmentID: input.cursor } : undefined,
      //         },
      //       },
      //     },
      //   },
      // });

      //---------------------------------SECOND APPROACH-------------------------------------
      // const treatment = await ctx.db.petTreatment.findMany({
      //   where: {
      //     AND: searchConditions,
      //   },
      //   orderBy: order,
      //   take: input.limit + 1,
      //   cursor: input.cursor ? { treatmentID: input.cursor } : undefined,
      //   include: {
      //     pet: {
      //       where: {
      //         AND: searchConditionsPet,
      //       },
      //       include: {
      //         owner: {
      //           where: {
      //             AND: searchConditionsOwner,
      //           },
      //         },
      //       },
      //     },
      //   },
      // });

      //---------------------------------------THIRD APPROACH-------------------------------------
      //       // First, fetch the treatments with the given conditions
      // const treatments = await ctx.db.petTreatment.findMany({
      //   where: {
      //     AND: searchConditions,
      //   },
      //   orderBy: order,
      //   take: input.limit + 1,
      //   cursor: input.cursor ? { treatmentID: input.cursor } : undefined,
      // });

      // // Then, for each treatment, fetch the associated pet and owner
      // const treatmentsWithPetsAndOwners = await Promise.all(
      //   treatments.map(async (treatment) => {
      //     const pet = await ctx.db.pet.findUnique({
      //       where: { petID: treatment.petID },
      //       include: { owner: true },
      //     });

      //     return {
      //       ...treatment,
      //       pet,
      //     };
      //   })
      // );

      //---------------------------------------FOURTH APPROACH-------------------------------------
      // // First, fetch the treatments with the given conditions
      // const treatments = await ctx.db.petTreatment.findMany({
      //   where: {
      //     AND: searchConditions,
      //   },
      //   orderBy: order,
      //   take: input.limit + 1,
      //   cursor: input.cursor ? { treatmentID: input.cursor } : undefined,
      // });

      // // Then, for each treatment, fetch the associated pet and owner if they match the conditions
      // const treatmentsWithPetsAndOwners = await Promise.all(
      //   treatments.map(async (treatment) => {
      //     const pet = await ctx.db.pet.findUnique({
      //       where: { petID: treatment.petID },
      //       include: { owner: true },
      //     });

      //     if (
      //       pet &&
      //       (input.searchQuery === "" ||
      //         (searchConditionsPet.some((condition) => {
      //           const key = Object.keys(condition)[0] as keyof typeof condition;
      //           return key in pet && condition[key] === pet[key];
      //         }) &&
      //           searchConditionsOwner.some((condition) => {
      //             const key = Object.keys(condition)[0] as keyof typeof condition;
      //             return pet.owner && key in pet.owner && condition[key] === pet.owner[key];
      //           })))
      //     ) {
      //       return {
      //         ...treatment,
      //         pet,
      //       };
      //     }
      //   }),
      // );

      // // Filter out any undefined values (treatments where the pet or owner didn't match the conditions)
      // const treatment = treatmentsWithPetsAndOwners.filter(Boolean);

      //-----------------------------------FIFTH APPROACH-------------------------------------
      // First, construct the search conditions for the treatment, pet, and owner
      // const searchConditionsTreatment = terms.map((term) => ({
      //   OR: [
      //     { treatmentID: { equals: isNaN(Number(term)) ? undefined : Number(term) } },
      //     { category: { contains: term } },
      //     { type: { contains: term } },
      //     { comments: { contains: term } },
      //   ],
      // }));

      // const searchConditionsPet = terms.map((term) => ({
      //   OR: [
      //     { petID: { equals: isNaN(Number(term)) ? undefined : Number(term) } },
      //     { name: { contains: term } },
      //     { type: { contains: term } },
      //     { breed: { contains: term } },
      //   ],
      // }));

      // const searchConditionsOwner = terms.map((term) => ({
      //   OR: [{ ownerID: { equals: isNaN(Number(term)) ? undefined : Number(term) } }, { name: { contains: term } }, { address: { contains: term } }],
      // }));

      // const searchConditionsTreatment = terms.map((term) => ({
      //   OR: [
      //     ...(isNaN(Number(term)) ? [] : [{ treatmentID: { equals: Number(term) } }]),
      //     { category: { contains: term } },
      //     { type: { contains: term } },
      //     { comments: { contains: term } },
      //   ],
      // }));

      // const searchConditionsPet = terms.map((term) => ({
      //   OR: [...(isNaN(Number(term)) ? [] : [{ petID: { equals: Number(term) } }]), { petName: { contains: term } }, { species: { contains: term } }],
      // }));

      // const searchConditionsOwner = terms.map((term) => ({
      //   OR: [
      //     ...(isNaN(Number(term)) ? [] : [{ ownerID: { equals: Number(term) } }]),
      //     { firstName: { contains: term } },
      //     { surname: { contains: term } },
      //     { addressGreaterArea: { contains: term } },
      //     { addressArea: { contains: term } },
      //   ],
      // }));

      // Fetch all the treatments based on the search conditions of treatments
      const treatment = await ctx.db.petTreatment.findMany({
        where:
          // input.searchQuery === ""
          //   ? {}
          //   :
          {
            OR: [
              {
                AND: searchConditions,
              },
              {
                pet: {
                  AND: searchConditionsPet,
                },
              },
              {
                pet: {
                  owner: {
                    AND: searchConditionsOwner,
                  },
                },
              },
            ],
          },
        orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { treatmentID: input.cursor } : undefined,
        include: {
          pet: {
            include: {
              owner: {
                include: {
                  addressArea: true,
                  addressGreaterArea: true,
                },
              },
            },
          },
        },
      });

      // //Fetch all the treatments based on the search conditions of pets
      // const treatment_pet = await ctx.db.petTreatment.findMany({
      //   where:
      //     // input.searchQuery === ""
      //     //   ? {}
      //     //   :
      //     {
      //       AND: [
      //         {
      //           pet: {
      //             OR: searchConditionsPet,
      //           },
      //         },
      //       ],
      //     },
      //   orderBy: order,
      //   take: input.limit + 1,
      //   cursor: input.cursor ? { treatmentID: input.cursor } : undefined,
      //   include: {
      //     pet: {
      //       include: {
      //         owner: true,
      //       },
      //     },
      //   },
      // });

      // //Fetch all the treatments based on the search conditions of owners
      // const treatment_owner = await ctx.db.petTreatment.findMany({
      //   where:
      //     // input.searchQuery === ""
      //     //   ? {}
      //     //   :
      //     {
      //       AND: [
      //         {
      //           pet: {
      //             owner: {
      //               OR: searchConditionsOwner,
      //             },
      //           },
      //         },
      //       ],
      //     },
      //   orderBy: order,
      //   take: input.limit + 1,
      //   cursor: input.cursor ? { treatmentID: input.cursor } : undefined,
      //   include: {
      //     pet: {
      //       include: {
      //         owner: true,
      //       },
      //     },
      //   },
      // });

      // //Combine all the treatments together
      // const treatments = treatment.concat(treatment_pet, treatment_owner);

      // //now order the data
      // treatments.sort((a, b) => {
      //   if (input.order === "date") {
      //     return a.date.getTime() - b.date.getTime();
      //   } else {
      //     return a.updatedAt.getTime() - b.updatedAt.getTime();
      //   }
      // });

      // // search for all the pets that could be searched for
      // const pet = await ctx.db.pet.findMany({
      //   where: {
      //     AND: searchConditionsPet,
      //   },
      //   include: {
      //     owner: true,
      //   },
      // });

      // // search for all the owners that could be searched for
      // const owner = await ctx.db.petOwner.findMany({
      //   where: {
      //     AND: searchConditionsOwner,
      //   },
      // });

      // // create a new object array that aggregates the pet and owner data and treatment data as well as orders it correctly
      // const treatments = treatment.map((treatment) => {
      //   // if a petID is not in the treatment data, then add that pets data to the treatment data
      //   pet.forEach((pet) => {
      //     if (treatment.petID !== pet.petID) {

      //     }
      //   });

      //   // if a ownerID is not in the treatment data, then add that owners data to the treatment data
      //   owner.forEach((owner) => {
      //     if (treatment.pet.owner.ownerID !== owner.ownerID) {

      //     }
      //   });
      // });

      //Add all the data together. So that the pet data and owner data is included in the treatment data
      // const treatments = treatment.map((treatment) => {
      //   const petData = pet.filter((pet) => pet.petID !== treatment.petID);
      //   const ownerData = owner.filter((owner) => owner.ownerID !== treatment?.pet?.ownerID);
      //   return {
      //     ...treatment,
      //     pet: petData,
      //     owner: ownerData,
      //   };
      // });

      // //Order the data correctly
      // treatments.sort((a, b) => {
      //   if (input.order === "date") {
      //     return a.date.getTime() - b.date.getTime();
      //   } else {
      //     return a.updatedAt.getTime() - b.updatedAt.getTime();
      //   }
      // });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (treatment.length > input.limit) {
        const nextRow = treatment.pop();
        newNextCursor = nextRow?.treatmentID;
      }

      return {
        treatment_data: treatment,
        nextCursor: newNextCursor,
      };
      //-----------------------------------------NEW CODE-------------------------------------

      //-----------------------------------ORIGNAL CODE----------------------------------------
      // const user = await ctx.db.petTreatment.findMany({
      //   where: {
      //     AND: searchConditions,
      //   },
      //   orderBy: order,
      //   take: input.limit + 1,
      //   cursor: input.cursor ? { treatmentID: input.cursor } : undefined,
      // });

      // let newNextCursor: typeof input.cursor | undefined = undefined;
      // if (user.length > input.limit) {
      //   const nextRow = user.pop();
      //   newNextCursor = nextRow?.treatmentID;
      // }

      // //fetch the pet
      // const pet = await ctx.db.pet.findMany({
      //   where: {
      //     petID: {
      //       in: user.map((treatment) => treatment.petID),
      //     },
      //   },
      //   select: {
      //     petID: true,
      //     petName: true,
      //     ownerID: true,
      //     species: true,
      //     breed: true,
      //   },
      // });

      // //fetch the owner of the pet
      // const owner = await ctx.db.petOwner.findMany({
      //   where: {
      //     ownerID: {
      //       in: pet.map((pet) => pet.ownerID),
      //     },
      //   },
      //   select: {
      //     ownerID: true,
      //     firstName: true,
      //     surname: true,
      //     addressGreaterArea: true,
      //     addressArea: true,
      //   },
      // });

      // return {
      //   pet_data: pet,
      //   user_data: user,
      //   owner_data: owner,
      //   nextCursor: newNextCursor,
      // };
      //-----------------------------------ORIGNAL CODE----------------------------------------
    }),

  //get one pet's treatment
  getTreatmentByID: publicProcedure
    .input(
      z.object({
        treatmentID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const petTreatment = await ctx.db.petTreatment.findUnique({
        where: {
          treatmentID: input.treatmentID,
        },
        select: {
          category: true,
          type: true,
          comments: true,
          petID: true,
          date: true,
          treatmentID: true,
        },
      });
      return petTreatment;
    }),

  //delete treatment
  deleteTreatment: publicProcedure
    .input(
      z.object({
        treatmentID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.petTreatment.delete({
        where: {
          treatmentID: input.treatmentID,
        },
      });
    }),

  //get all treatments
  getAllTreatments: protectedProcedure.query(async ({ ctx }) => {
    const petTreatment = await ctx.db.petTreatment.findMany();
    return petTreatment;
  }),

  //delete all treatments
  deleteAllTreatments: publicProcedure.mutation(async ({ ctx }) => {
    return await ctx.db.petTreatment.deleteMany({});
  }),

  //Bulk upload of all the owners
  insertExcelData: protectedProcedure
    .input(
      z.array(
        z.object({
          petID: z.number(),
          category: z.string(),
          date: z.date(),
          type: z.string(),
          comments: z.string(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.petTreatment.createMany({
        data: input,
      });
      return result;
    }),

  //Update identification
  updateIdentification: publicProcedure
    .input(
      z.object({
        treatmentID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.identification.update({
        where: {
          identificationID: 1,
        },
        data: {
          treatmentID: input.treatmentID,
          updatedAt: new Date(),
        },
      });
    }),

  //get latest treatmentID from identification
  getLatestTreatmentID: publicProcedure.query(async ({ ctx }) => {
    const identification = await ctx.db.identification.findUnique({
      where: {
        identificationID: 1,
      },
    });

    return identification;
  }),

  //download
  download: publicProcedure
    .input(
      z.object({
        searchQuery: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //------------------------------------------ORIGNAL CODE-------------------------------------
      // Parse the search query
      const terms = input.searchQuery.match(/\+\w+/g)?.map((term) => term.substring(1)) ?? [];

      // Construct a complex search condition for treatment table
      const searchConditions = terms.map((term) => {
        // Check if term is a number
        if (term.match(/^T\d+$/) !== null) {
          return {
            OR: [
              { treatmentID: { equals: Number(term.substring(1)) } },
              { category: { contains: term } },
              { type: { contains: term } },
              { comments: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [{ category: { contains: term } }, { type: { contains: term } }, { comments: { contains: term } }].filter(
              (condition) => Object.keys(condition).length > 0,
            ), // Filter out empty conditions
          };
        }
      });
      //------------------------------------------ORIGNAL CODE-------------------------------------

      //------------------------------------------NEW CODE-------------------------------------
      //complex search condition for pet table
      const searchConditionsPet = terms.map((term) => {
        // Check if term is a number
        if (term.match(/^P\d+$/) !== null) {
          return {
            OR: [
              { petID: { equals: Number(term.substring(1)) } },
              { petName: { contains: term } },
              { species: { contains: term } },
              { breed: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [{ petName: { contains: term } }, { species: { contains: term } }, { breed: { contains: term } }].filter(
              (condition) => Object.keys(condition).length > 0,
            ), // Filter out empty conditions
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
              { firstName: { contains: term } },
              { surname: { contains: term } },
              //  { addressGreaterArea: { contains: term } },
              //  { addressArea: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { firstName: { contains: term } },
              { surname: { contains: term } },
              //  { addressGreaterArea: { contains: term } },
              //  { addressArea: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
      });

      const treatment = await ctx.db.petTreatment.findMany({
        where: {
          OR: [
            {
              AND: searchConditions,
            },
            {
              pet: {
                AND: searchConditionsPet,
              },
            },
            {
              pet: {
                owner: {
                  AND: searchConditionsOwner,
                },
              },
            },
          ],
        },
        orderBy: {
          treatmentID: "asc",
        },
        // include: {
        //   pet: {
        //     include: {
        //       owner: true,
        //     },
        //   },
        // },
      });

      return treatment;
    }),
});
