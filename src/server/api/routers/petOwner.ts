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
        addressGreaterAreaID: z.number(),
        addressAreaID: z.number(),
        addressStreetID: z.number(),
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
          addressGreaterArea: { connect: { greaterAreaID: input.addressGreaterAreaID } },
          addressArea: { connect: { areaID: input.addressAreaID } },
          addressStreet: { connect: { streetID: input.addressStreetID } },
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
        addressGreaterAreaID: z.number(),
        addressFreeForm: z.string(),
        addressAreaID: z.number(),
        addressStreetID: z.number(),
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
          addressGreaterArea: { connect: { greaterAreaID: input.addressGreaterAreaID } },
          addressFreeForm: input.addressFreeForm,
          addressArea: { connect: { areaID: input.addressAreaID } },
          addressStreet: { connect: { streetID: input.addressStreetID } },
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
        ownerID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const petOwner = await ctx.db.petOwner.findUnique({
        where: {
          ownerID: input.ownerID,
        },
        include: {
          addressGreaterArea: true,
          addressArea: true,
          addressStreet: true,
          pets: true,
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
        // Check if term is a number
        if (term.match(/^N\d+$/) !== null) {
          return {
            OR: [
              // { userID: { equals: Number(term) } },
              { ownerID: { equals: Number(term.substring(1)) } },
              // {
              //   pets: {
              //     some: {
              //       petID: { equals: Number(term.substring(1)) },
              //     },
              //   },
              // },
              { firstName: { contains: term } },
              { surname: { contains: term } },
              { email: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              // { addressGreaterArea: { contains: term } },
              // { addressArea: { contains: term } },
              //  { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              { addressStreetNumber: { contains: term } },
              // { addressSuburb: { contains: term } },
              // { addressPostalCode: { contains: term } },
              { pets: { some: { petName: { contains: term } } } },
              { addressFreeForm: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else if (term.match(/^P\d+$/) !== null) {
          return {
            OR: [
              {
                pets: {
                  some: {
                    petID: { equals: Number(term.substring(1)) },
                  },
                },
              },
              { firstName: { contains: term } },
              { surname: { contains: term } },
              { email: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              // { addressGreaterArea: { contains: term } },
              // { addressArea: { contains: term } },
              // { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              { addressStreetNumber: { contains: term } },
              // { addressSuburb: { contains: term } },
              // { addressPostalCode: { contains: term } },
              { pets: { some: { petName: { contains: term } } } },
              { addressFreeForm: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
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
              // { addressGreaterArea: { contains: term } },
              // { addressArea: { contains: term } },
              // { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              { addressStreetNumber: { contains: term } },
              // { addressSuburb: { contains: term } },
              // { addressPostalCode: { contains: term } },
              { pets: { some: { petName: { contains: term } } } },
              { addressFreeForm: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
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
        include: {
          addressGreaterArea: true,
          addressArea: true,
          addressStreet: true,
        },
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
          addressGreaterAreaID: z.number(),
          addressAreaID: z.number(),
          addressStreetID: z.number(),
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
        // data: input.map((item) => ({
        //   ...item,
        //   addressGreaterAreaID: 0, // Replace with the actual value
        //   addressAreaID: 0, // Replace with the actual value
        //   addressStreetID: 0, // Replace with the actual value
        // })),
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
          identificationID: 1,
        },
        data: {
          petOwnerID: input.ownerID,
          updatedAt: new Date(),
        },
      });
    }),

  //get latest ownerID from identification
  getLatestOwnerID: publicProcedure.query(async ({ ctx }) => {
    const identification = await ctx.db.identification.findUnique({
      where: {
        identificationID: 1,
      },
    });

    return identification;
  }),

  // //Get all the owners that are active and sum these owners for each year for the last 5 years. seperate into respective greater areas
  getActiveOwners: protectedProcedure.query(async ({ ctx }) => {
    const currentYear = new Date().getFullYear();
    const activeOwners: Record<number, Record<string, number>> = {};

    const greaterAreas = await ctx.db.greaterArea.findMany();

    const owners = await ctx.db.petOwner.findMany({
      where: {
        status: "Active",
      },
    });

    for (let year = currentYear - 4; year <= currentYear; year++) {
      const ownersInYear = owners.filter((owner) => owner.startingDate.getFullYear() === year);
      //activeOwners[year] = {};

      for (const area of greaterAreas) {
        const ownersInArea = ownersInYear.filter((owner) => owner.addressGreaterAreaID === area.greaterAreaID).length;
        if (activeOwners[year] === undefined) {
          activeOwners[year] = {};
        }
        activeOwners[year]![area.greaterArea] = ownersInArea;
      }
    }

    const transformedData = Object.entries(activeOwners).map(([category, value]) => ({
      category: Number(category),
      value,
    }));

    return {
      transformedData: transformedData,
      owners: owners,
    };
  }),

  // getActiveOwners: protectedProcedure.query(async ({ ctx }) => {
  //   const greaterAreas = await ctx.db.greaterArea.findMany();

  //   const activeOwners = [];

  //   const areas = [];

  //   //get all the active owners of the last 5 years
  //   const owners = await ctx.db.petOwner.findMany({
  //     where: {
  //       startingDate: {
  //         gte: new Date(new Date().getFullYear() - 4),
  //         lte: new Date(new Date().getFullYear() + 1),
  //       },
  //     },
  //   });

  //   for (const area of greaterAreas) {
  //     const ownersInArea = owners.filter((owner) => owner.addressGreaterAreaID === area.greaterAreaID).length;
  //     areas.push(ownersInArea);
  //   }

  // const currentYear = new Date().getFullYear();
  // const activeOwners = [];

  // const greaterAreas = await ctx.db.greaterArea.findMany();

  // for (const area of greaterAreas) {
  //   const owners = await ctx.db.petOwner.findMany({
  //     where: {
  //       AND: [
  //         {
  //           addressGreaterAreaID: area.greaterAreaID,
  //         },
  //         {
  //           startingDate: {
  //             gte: new Date(currentYear - 4),
  //             lte: new Date(currentYear + 1),
  //           },
  //         },
  //       ],
  //     },
  //   });

  //   const data = [
  //     {
  //       category: 2022,
  //       greaterArea1: 4000,
  //       greaterArea2: 2400,
  //     },
  //     {
  //       category: 2023,
  //       greaterArea1: 3000,
  //       greaterArea2: 1398,
  //     },
  //   ];

  //   activeOwners.push({
  //     greaterArea: area.greaterArea,
  //     activeOwners: {
  //       [currentYear - 4]: {
  //         value: owners.filter((owner) => owner.startingDate.getFullYear() === currentYear - 4).length,

  //       },
  //       [currentYear - 3]: owners.filter((owner) => owner.startingDate.getFullYear() === currentYear - 3).length,
  //       [currentYear - 2]: owners.filter((owner) => owner.startingDate.getFullYear() === currentYear - 2).length,
  //       [currentYear - 1]: owners.filter((owner) => owner.startingDate.getFullYear() === currentYear - 1).length,
  //       [currentYear]: owners.filter((owner) => owner.startingDate.getFullYear() === currentYear).length,
  //     },
  //   });
  // }

  // return activeOwners;
  //}),

  // getActiveOwners: protectedProcedure.query(async ({ ctx }) => {
  //   const owners = await ctx.db.petOwner.findMany({
  //     where: {
  //       status: "Active",
  //     },
  //   });

  //   const last5YearsOwners = owners.filter((owner) => owner.startingDate.getFullYear() >= new Date().getFullYear() - 4);

  //   const firstYearOwners = last5YearsOwners.filter((owner) => owner.startingDate.getFullYear() === new Date().getFullYear() - 4);
  //   const secondYearOwners = last5YearsOwners.filter((owner) => owner.startingDate.getFullYear() === new Date().getFullYear() - 3);
  //   const thirdYearOwners = last5YearsOwners.filter((owner) => owner.startingDate.getFullYear() === new Date().getFullYear() - 2);
  //   const fourthYearOwners = last5YearsOwners.filter((owner) => owner.startingDate.getFullYear() === new Date().getFullYear() - 1);
  //   const fifthYearOwners = last5YearsOwners.filter((owner) => owner.startingDate.getFullYear() === new Date().getFullYear());

  //   const activeOwners = {
  //     [new Date().getFullYear() - 4]: firstYearOwners.length,
  //     [new Date().getFullYear() - 3]: secondYearOwners.length,
  //     [new Date().getFullYear() - 2]: thirdYearOwners.length,
  //     [new Date().getFullYear() - 1]: fourthYearOwners.length,
  //     [new Date().getFullYear()]: fifthYearOwners.length,
  //   };

  //   // const activeOwners = last5YearsOwners.reduce(
  //   //   (acc, owner) => {
  //   //     const year = owner.startingDate.getFullYear();
  //   //     if (acc[year]) {
  //   //       acc[year]++;
  //   //     } else {
  //   //       acc[year] = 1;
  //   //     }
  //   //     return acc;
  //   //   },
  //   //   {} as Record<number, number>,
  //   // );

  //   return activeOwners;
  // }),

  //get all the dogs and cats respectively that are active and over the last 5 years since the owner's startingdate
  getActivePets: protectedProcedure.query(async ({ ctx }) => {
    const ownersOf5Years = await ctx.db.petOwner.findMany({
      where: {
        startingDate: {
          gte: new Date(new Date().getFullYear() - 4),
          lte: new Date(new Date().getFullYear() - 3),
        },
      },
    });

    const ownersOf4Years = await ctx.db.petOwner.findMany({
      where: {
        startingDate: {
          gte: new Date(new Date().getFullYear() - 3),
          lte: new Date(new Date().getFullYear() - 2),
        },
      },
    });

    const ownersOf3Years = await ctx.db.petOwner.findMany({
      where: {
        startingDate: {
          gte: new Date(new Date().getFullYear() - 2),
          lte: new Date(new Date().getFullYear() - 1),
        },
      },
    });

    const ownersOf2Years = await ctx.db.petOwner.findMany({
      where: {
        startingDate: {
          gte: new Date(new Date().getFullYear() - 1),
          lte: new Date(new Date().getFullYear()),
        },
      },
    });

    const ownersOf1Years = await ctx.db.petOwner.findMany({
      where: {
        startingDate: {
          gte: new Date(new Date().getFullYear()),
        },
      },
    });

    const pets = await ctx.db.pet.findMany({
      where: {
        status: "Active",
      },
    });

    const dogs = pets.filter((pet) => pet.species === "Dog");
    const cats = pets.filter((pet) => pet.species === "Cat");

    const last5YearsDogs = dogs.filter((pet) => ownersOf5Years.map((owner) => owner.ownerID).includes(pet.ownerID));
    const last4YearsDogs = dogs.filter((pet) => ownersOf4Years.map((owner) => owner.ownerID).includes(pet.ownerID));
    const last3YearsDogs = dogs.filter((pet) => ownersOf3Years.map((owner) => owner.ownerID).includes(pet.ownerID));
    const last2YearsDogs = dogs.filter((pet) => ownersOf2Years.map((owner) => owner.ownerID).includes(pet.ownerID));
    const last1YearsDogs = dogs.filter((pet) => ownersOf1Years.map((owner) => owner.ownerID).includes(pet.ownerID));

    const last5YearsCats = cats.filter((pet) => ownersOf5Years.map((owner) => owner.ownerID).includes(pet.ownerID));
    const last4YearsCats = cats.filter((pet) => ownersOf4Years.map((owner) => owner.ownerID).includes(pet.ownerID));
    const last3YearsCats = cats.filter((pet) => ownersOf3Years.map((owner) => owner.ownerID).includes(pet.ownerID));
    const last2YearsCats = cats.filter((pet) => ownersOf2Years.map((owner) => owner.ownerID).includes(pet.ownerID));
    const last1YearsCats = cats.filter((pet) => ownersOf1Years.map((owner) => owner.ownerID).includes(pet.ownerID));

    const activeDogs = {
      [new Date().getFullYear() - 4]: last5YearsDogs.length,
      [new Date().getFullYear() - 3]: last4YearsDogs.length,
      [new Date().getFullYear() - 2]: last3YearsDogs.length,
      [new Date().getFullYear() - 1]: last2YearsDogs.length,
      [new Date().getFullYear()]: last1YearsDogs.length,
    };

    const activeCats = {
      [new Date().getFullYear() - 4]: last5YearsCats.length,
      [new Date().getFullYear() - 3]: last4YearsCats.length,
      [new Date().getFullYear() - 2]: last3YearsCats.length,
      [new Date().getFullYear() - 1]: last2YearsCats.length,
      [new Date().getFullYear()]: last1YearsCats.length,
    };

    const activePets = {
      dogs: activeDogs,
      cats: activeCats,
    };

    return activePets;
    // const pets = await ctx.db.pet.findMany({
    //   where: {
    //     status: "Active",
    //   },
    // });

    // const last5YearsPets = pets.filter((pet) => pet.startingDate.getFullYear() >= new Date().getFullYear() - 4);

    // const firstYearPets = last5YearsPets.filter((pet) => pet.startingDate.getFullYear() === new Date().getFullYear() - 4);
    // const secondYearPets = last5YearsPets.filter((pet) => pet.startingDate.getFullYear() === new Date().getFullYear() - 3);
    // const thirdYearPets = last5YearsPets.filter((pet) => pet.startingDate.getFullYear() === new Date().getFullYear() - 2);
    // const fourthYearPets = last5YearsPets.filter((pet) => pet.startingDate.getFullYear() === new Date().getFullYear() - 1);
    // const fifthYearPets = last5YearsPets.filter((pet) => pet.startingDate.getFullYear() === new Date().getFullYear());

    // const activePets = {
    //   [new Date().getFullYear() - 4]: firstYearPets.length,
    //   [new Date().getFullYear() - 3]: secondYearPets.length,
    //   [new Date().getFullYear() - 2]: thirdYearPets.length,
    //   [new Date().getFullYear() - 1]: fourthYearPets.length,
    //   [new Date().getFullYear()]: fifthYearPets.length,
    // };

    // return activePets;
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

      // Construct a complex search condition
      const searchConditions = terms.map((term) => {
        // Check if term is a number
        if (term.match(/^N\d+$/) !== null) {
          return {
            OR: [
              // { userID: { equals: Number(term) } },
              { ownerID: { equals: Number(term.substring(1)) } },
              // {
              //   pets: {
              //     some: {
              //       petID: { equals: Number(term.substring(1)) },
              //     },
              //   },
              // },
              { firstName: { contains: term } },
              { surname: { contains: term } },
              { email: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              // { addressGreaterArea: { contains: term } },
              // { addressArea: { contains: term } },
              // { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              { addressStreetNumber: { contains: term } },
              // { addressSuburb: { contains: term } },
              // { addressPostalCode: { contains: term } },
              { pets: { some: { petName: { contains: term } } } },
              { addressFreeForm: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else if (term.match(/^P\d+$/) !== null) {
          return {
            OR: [
              {
                pets: {
                  some: {
                    petID: { equals: Number(term.substring(1)) },
                  },
                },
              },
              { firstName: { contains: term } },
              { surname: { contains: term } },
              { email: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              // { addressGreaterArea: { contains: term } },
              // { addressArea: { contains: term } },
              // { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              { addressStreetNumber: { contains: term } },
              // { addressSuburb: { contains: term } },
              // { addressPostalCode: { contains: term } },
              { pets: { some: { petName: { contains: term } } } },
              { addressFreeForm: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
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
              // { addressGreaterArea: { contains: term } },
              //  { addressArea: { contains: term } },
              //  { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              { addressStreetNumber: { contains: term } },
              // { addressSuburb: { contains: term } },
              // { addressPostalCode: { contains: term } },
              { pets: { some: { petName: { contains: term } } } },
              { addressFreeForm: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
      });

      const owners = await ctx.db.petOwner.findMany({
        where: {
          AND: searchConditions,
        },
        orderBy: {
          ownerID: "asc",
        },
      });

      return owners;
    }),

  //update owners starting date
  updateStartingDate: publicProcedure
    .input(
      z.object({
        ownerID: z.number(),
        startingDate: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.petOwner.update({
        where: {
          ownerID: input.ownerID,
        },
        data: {
          startingDate: input.startingDate,
        },
      });
    }),
});
