import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

import { Prisma } from "@prisma/client";

export const petTreatmentRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        petID: z.number(),
        category: z.string(),
        date: z.date(),
        typesID: z.number().array(),
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
          // type: input.type,
          type: {
            createMany: {
              data: input.typesID.map((typeID) => ({
                typeID: typeID,
              })),
            },
          },
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
        typesID: z.number().array(),
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
          //type: input.type,
          comments: input.comments,
          date: input.date,
          updatedAt: new Date(),
        },
      });

      await ctx.db.typesOnTreatment.deleteMany({
        where: {
          treatmentID: input.treatmentID,
        },
      });

      //create new greater areas
      const typesRelationships = input.typesID.map(async (typeID) => {
        await ctx.db.typesOnTreatment.create({
          data: {
            treatment: {
              connect: {
                treatmentID: petTreatment.treatmentID,
              },
            },
            type: {
              connect: {
                typeID: typeID,
              },
            },
          },
        });
      });

      await Promise.all(typesRelationships);

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
              { category: { contains: term, mode: Prisma.QueryMode.insensitive } },
              {
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
              // { type: { hasSome: [term] } },
              { comments: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //pet
              { pet: { petName: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { pet: { species: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { pet: { breed: { hasSome: [term] } } },
              //owner
              { pet: { owner: { firstName: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { pet: { owner: { surname: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { pet: { owner: { addressGreaterArea: { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } } } } },
              { pet: { owner: { addressArea: { area: { contains: term, mode: Prisma.QueryMode.insensitive } } } } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else if (term.match(/^P\d+$/) !== null) {
          return {
            OR: [
              { pet: { petID: { equals: Number(term.substring(1)) } } },
              { category: { contains: term, mode: Prisma.QueryMode.insensitive } },
              {
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
              // { type: { hasSome: [term] } },
              { comments: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //pet
              { pet: { petName: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { pet: { species: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { pet: { breed: { hasSome: [term] } } },
              //owner
              { pet: { owner: { firstName: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { pet: { owner: { surname: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { pet: { owner: { addressGreaterArea: { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } } } } },
              { pet: { owner: { addressArea: { area: { contains: term, mode: Prisma.QueryMode.insensitive } } } } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else if (term.match(/^N\d+$/) !== null) {
          return {
            OR: [
              { ownerID: { equals: Number(term.substring(1)) } },
              { category: { contains: term, mode: Prisma.QueryMode.insensitive } },
              // { type: { hasSome: [term] } },
              {
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
              { comments: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //pet
              { pet: { petName: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { pet: { species: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { pet: { breed: { hasSome: [term] } } },
              //owner
              { pet: { owner: { firstName: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { pet: { owner: { surname: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { pet: { owner: { addressGreaterArea: { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } } } } },
              { pet: { owner: { addressArea: { area: { contains: term, mode: Prisma.QueryMode.insensitive } } } } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { category: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //{ type: { hasSome: [term] } },
              {
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
              { comments: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //pet
              { pet: { petName: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { pet: { species: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              { pet: { breed: { hasSome: [term] } } },
              //owner
              { pet: { owner: { firstName: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { pet: { owner: { surname: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
              { pet: { owner: { addressGreaterArea: { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } } } } },
              { pet: { owner: { addressArea: { area: { contains: term, mode: Prisma.QueryMode.insensitive } } } } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
      });

      //       const typeSearchResults = await ctx.db.$queryRaw`SELECT "treatmentID" FROM "PetTreatment"
      // WHERE "type" @> ARRAY[${terms.join(",")}::varchar[]]`;
      // const typeSearchResults = await ctx.db.$queryRaw`SELECT "treatmentID" FROM "PetTreatment" WHERE "type" @> ARRAY[${terms
      //   .map((term) => `'${term}'`)
      //   .join(",")}]::varchar[]`;

      //------------------------------------------ORIGNAL CODE-------------------------------------

      //-----------------------------------------ORIGNAL CODE-------------------------------------
      const order: Record<string, string> = {};

      if (input.order !== "date") {
        order.updatedAt = "desc";
      } else {
        order.date = "asc";
      }
      //-----------------------------------------ORIGNAL CODE-------------------------------------

      //  const treatmentIDsFromTypeSearch: number[] = (typeSearchResults as { treatmentID: number }[]).map((result) => result.treatmentID);

      // Fetch all the treatments based on the search conditions of treatments
      const treatment = await ctx.db.petTreatment.findMany({
        where: {
          // AND: searchConditions,
          AND: searchConditions,

          // category: {
          //   contains: input.searchQuery,
          //   mode: "insensitive",
          // },
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
          type: {
            select: {
              typeID: true,
              type: {
                select: {
                  type: true,
                },
              },
            },
          },
        },
      });

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
        // select: {
        //   category: true,
        //   type: true,
        //   comments: true,
        //   petID: true,
        //   date: true,
        //   treatmentID: true,
        // },
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
          type: {
            select: {
              typeID: true,
              type: {
                select: {
                  type: true,
                },
              },
            },
          },
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
      await ctx.db.typesOnTreatment.deleteMany({
        where: {
          treatmentID: input.treatmentID,
        },
      });

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
    await ctx.db.typesOnTreatment.deleteMany({});
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
          // type: z.string().array(),
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

  //Types table create
  createTypes: publicProcedure
    .input(
      z.object({
        types: z.string().array(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const types = input.types;
      const now = new Date();

      for (const type of types) {
        await ctx.db.type.create({
          data: {
            type: type,
            createdAt: now,
            updatedAt: now,
          },
        });
      }

      return types;
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
              { category: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //{ type: { hasSome: [term] } },
              {
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
              { comments: { contains: term, mode: Prisma.QueryMode.insensitive } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { category: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //{ type: { hasSome: [term] } },
              {
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
              { comments: { contains: term, mode: Prisma.QueryMode.insensitive } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
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
              { petName: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { species: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { breed: { hasSome: [term] } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { petName: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { species: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { breed: { hasSome: [term] } },
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
              //  { addressGreaterArea: { contains: term } },
              //  { addressArea: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { firstName: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { surname: { contains: term, mode: Prisma.QueryMode.insensitive } },
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

  getAllTreatmentsForPet: publicProcedure
    .input(
      z.object({
        petID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const petTreatment = await ctx.db.petTreatment.findMany({
        where: {
          petID: input.petID,
        },
        include: {
          type: {
            select: {
              typeID: true,
              type: {
                select: {
                  type: true,
                },
              },
            },
          },
        },
      });

      return petTreatment;
    }),
});
