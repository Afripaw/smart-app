import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const petOwnerRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        firstName: z.string(),
        email: z.string(),
        surname: z.string(),
        mobile: z.string(),
        addressGreaterArea: z.string(),
        addressArea: z.string(),
        addressStreet: z.string(),
        addressStreetCode: z.string(),
        addressStreetNumber: z.string(),
        addressFreeForm: z.string(),
        preferredCommunication: z.string(),
        status: z.string(),
        startingDate: z.date(),
        comments: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const petOwner = await ctx.db.petOwner.create({
        data: {
          firstName: input.firstName,
          email: input.email,
          surname: input.surname,
          mobile: input.mobile,
          addressGreaterArea: input.addressGreaterArea,
          addressArea: input.addressArea,
          addressStreet: input.addressStreet,
          addressStreetCode: input.addressStreetCode,
          addressStreetNumber: input.addressStreetNumber,
          addressFreeForm: input.addressFreeForm,
          preferredCommunication: input.preferredCommunication,
          status: input.status,
          pets: {
            create: undefined,
          },
          startingDate: input.startingDate,
          comments: input.comments,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return petOwner;
    }),

  //update pet owner
  update: publicProcedure
    .input(
      z.object({
        petOwnerID: z.number(),
        firstName: z.string(),
        email: z.string(),
        surname: z.string(),
        mobile: z.string(),
        addressGreaterArea: z.string(),
        addressFreeForm: z.string(),
        addressArea: z.string(),
        addressStreet: z.string(),
        addressStreetCode: z.string(),
        addressStreetNumber: z.string(),
        preferredCommunication: z.string(),
        startingDate: z.date(),
        status: z.string(),
        comments: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const petOwner = await ctx.db.petOwner.update({
        where: {
          ownerID: input.petOwnerID,
        },
        data: {
          firstName: input.firstName,
          email: input.email,
          surname: input.surname,
          mobile: input.mobile,
          addressGreaterArea: input.addressGreaterArea,
          addressFreeForm: input.addressFreeForm,
          addressArea: input.addressArea,
          addressStreet: input.addressStreet,
          addressStreetCode: input.addressStreetCode,
          addressStreetNumber: input.addressStreetNumber,
          preferredCommunication: input.preferredCommunication,
          startingDate: input.startingDate,
          status: input.status,
          comments: input.comments,
          updatedAt: new Date(),
        },
      });

      return petOwner;
    }),

  //get one pet owner
  getOwnerByID: protectedProcedure
    .input(
      z.object({
        petOwnerID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const petOwner = await ctx.db.petOwner.findUnique({
        where: {
          ownerID: input.petOwnerID,
        },
      });

      return petOwner;
    }),

  //Infinite query and search for volunteers
  searchOwnersInfinite: publicProcedure
    .input(
      z.object({
        ownerID: z.number(),
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

        // Check if term is a number
        if (!isNaN(Number(term))) {
          return {
            OR: [
              { ownerID: { equals: Number(term) } },
              {
                pets: {
                  some: {
                    petID: { equals: Number(term) },
                  },
                },
              },
              { firstName: { contains: term } },
              { surname: { contains: term } },
              { email: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              { addressGreaterArea: { contains: term } },
              { addressArea: { contains: term } },
              { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              { addressStreetNumber: { contains: term } },
              // { addressSuburb: { contains: term } },
              // { addressPostalCode: { contains: term } },
              { pets: { some: { petName: { contains: term } } } },
              { addressFreeForm: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
              dateCondition,
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { firstName: { contains: term } },
              { surname: { contains: term } },
              { email: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              { addressGreaterArea: { contains: term } },
              { addressArea: { contains: term } },
              { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              { addressStreetNumber: { contains: term } },
              // { addressSuburb: { contains: term } },
              // { addressPostalCode: { contains: term } },
              { pets: { some: { petName: { contains: term } } } },
              { addressFreeForm: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
              dateCondition,
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
      });

      const order: Record<string, string> = {};

      if (input.order !== "surname") {
        order.updatedAt = "desc";
      } else {
        order.surname = "asc";
      }

      const user = await ctx.db.petOwner.findMany({
        where: {
          AND: searchConditions,
        },
        orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { ownerID: input.cursor } : undefined,
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (user.length > input.limit) {
        const nextRow = user.pop();
        newNextCursor = nextRow?.ownerID;
      }

      //get all the pets of each owner
      const pets = [];
      for (const owner of user) {
        const pet = await ctx.db.pet.findMany({
          where: {
            ownerID: owner.ownerID,
          },
        });
        pets.push(pet);
      }

      return {
        user_data: user,
        pets_data: pets,
        nextCursor: newNextCursor,
      };
    }),

  //delete owner
  deleteOwner: publicProcedure
    .input(
      z.object({
        userID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      //delete all pet to petTreatment
      await ctx.db.petTreatment.deleteMany({
        where: {
          pet: {
            ownerID: input.userID,
          },
        },
      });

      //delete all pet to petClinic
      await ctx.db.petOnPetClinic.deleteMany({
        where: {
          pet: {
            ownerID: input.userID,
          },
        },
      });

      //delete all pets
      await ctx.db.pet.deleteMany({
        where: {
          ownerID: input.userID,
        },
      });

      return await ctx.db.petOwner.delete({
        where: {
          ownerID: input.userID,
        },
      });
    }),

  //get all pet owners
  getAllOwners: protectedProcedure.query(async ({ ctx }) => {
    const petOwners = await ctx.db.petOwner.findMany();
    return petOwners;
  }),

  //delete all pet owners
  deleteAllOwners: protectedProcedure.mutation(async ({ ctx }) => {
    //delete all pet to petTreatment
    await ctx.db.petTreatment.deleteMany();
    //delete all pet to petClinic
    await ctx.db.petOnPetClinic.deleteMany();
    //delete all pets
    await ctx.db.pet.deleteMany();
    return await ctx.db.petOwner.deleteMany();
  }),

  //Bulk upload of all the owners
  insertExcelData: protectedProcedure
    .input(
      z.array(
        z.object({
          firstName: z.string(),
          email: z.string(),
          surname: z.string(),
          mobile: z.string(),
          addressGreaterArea: z.string(),
          addressArea: z.string(),
          addressStreet: z.string(),
          addressStreetCode: z.string(),
          addressStreetNumber: z.string(),
          addressFreeForm: z.string(),
          preferredCommunication: z.string(),
          status: z.string(),
          startingDate: z.date(),
          comments: z.string(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.petOwner.createMany({
        data: input,
      });
      return result;
    }),

  //Update identification
  updateIdentification: publicProcedure
    .input(
      z.object({
        ownerID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.identification.update({
        where: {
          identificationID: 80,
        },
        data: {
          petOwnerID: input.ownerID,
        },
      });
    }),

  //get latest ownerID from identification
  getLatestOwnerID: publicProcedure.query(async ({ ctx }) => {
    const identification = await ctx.db.identification.findUnique({
      where: {
        identificationID: 80,
      },
    });

    return identification;
  }),

  //Get all the owners that are active and sum these owners for each year for the last 5 years
  getActiveOwners: protectedProcedure.query(async ({ ctx }) => {
    const owners = await ctx.db.petOwner.findMany({
      where: {
        status: "Active",
      },
    });

    const last5YearsOwners = owners.filter((owner) => owner.startingDate.getFullYear() >= new Date().getFullYear() - 4);

    const firstYearOwners = last5YearsOwners.filter((owner) => owner.startingDate.getFullYear() === new Date().getFullYear() - 4);
    const secondYearOwners = last5YearsOwners.filter((owner) => owner.startingDate.getFullYear() === new Date().getFullYear() - 3);
    const thirdYearOwners = last5YearsOwners.filter((owner) => owner.startingDate.getFullYear() === new Date().getFullYear() - 2);
    const fourthYearOwners = last5YearsOwners.filter((owner) => owner.startingDate.getFullYear() === new Date().getFullYear() - 1);
    const fifthYearOwners = last5YearsOwners.filter((owner) => owner.startingDate.getFullYear() === new Date().getFullYear());

    const activeOwners = {
      [new Date().getFullYear() - 4]: firstYearOwners.length,
      [new Date().getFullYear() - 3]: secondYearOwners.length,
      [new Date().getFullYear() - 2]: thirdYearOwners.length,
      [new Date().getFullYear() - 1]: fourthYearOwners.length,
      [new Date().getFullYear()]: fifthYearOwners.length,
    };

    // const activeOwners = last5YearsOwners.reduce(
    //   (acc, owner) => {
    //     const year = owner.startingDate.getFullYear();
    //     if (acc[year]) {
    //       acc[year]++;
    //     } else {
    //       acc[year] = 1;
    //     }
    //     return acc;
    //   },
    //   {} as Record<number, number>,
    // );

    return activeOwners;
  }),
});
