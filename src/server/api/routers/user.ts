import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const UserRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        firstName: z.string(),
        email: z.string(),
        password: z.string().min(3),
        surname: z.string(),
        southAfricanID: z.string(),
        mobile: z.string().max(10),
        addressGreaterAreaID: z.number().array(),
        addressStreet: z.string(),
        //addressAreaID: z.number(),
        // addressStreetID: z.number(),
        addressStreetCode: z.string(),
        addressStreetNumber: z.number(),
        addressSuburb: z.string(),
        addressPostalCode: z.string(),
        addressFreeForm: z.string(),
        preferredCommunication: z.string(),
        startingDate: z.date(),
        role: z.string(),
        status: z.string(),
        comments: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.create({
        data: {
          name: input.firstName,
          email: input.email,
          password: ctx.security.hash(input.password),
          surname: input.surname,
          southAfricanID: input.southAfricanID,
          mobile: input.mobile,
          addressGreaterArea: {
            createMany: {
              data: input.addressGreaterAreaID.map((areaID) => ({
                greaterAreaID: areaID,
              })),
            },
          },
          addressStreet: input.addressStreet,
          //addressGreaterAreaID: input.addressGreaterAreaID,
          // addressGreaterArea: {
          //   connect: {
          //     greaterAreaID: input.addressGreaterAreaID,
          //   },
          // },
          // //addressAreaID: input.addressAreaID,
          // addressArea: input.addressAreaID
          //   ? {
          //       connect: {
          //         areaID: input.addressAreaID,
          //       },
          //     }
          //   : undefined,
          // addressStreet: input.addressStreetID
          //   ? {
          //       connect: {
          //         streetID: input.addressStreetID,
          //       },
          //     }
          //   : undefined,
          addressStreetCode: input.addressStreetCode,
          addressStreetNumber: input.addressStreetNumber,
          addressSuburb: input.addressSuburb,
          addressPostalCode: input.addressPostalCode,
          addressFreeForm: input.addressFreeForm,
          preferredCommunication: input.preferredCommunication,
          role: input.role,
          status: input.status,
          comments: input.comments,
          startingDate: input.startingDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string(),
        email: z.string(),
        password: z.string(),
        surname: z.string(),
        southAfricanID: z.string(),
        mobile: z.string().max(10),
        addressGreaterAreaID: z.number().array(),
        addressStreet: z.string(),
        // addressGreaterAreaID: z.number(),
        // addressAreaID: z.number(),
        // addressStreetID: z.number(),
        addressStreetCode: z.string(),
        addressStreetNumber: z.number(),
        addressSuburb: z.string(),
        addressPostalCode: z.string(),
        addressFreeForm: z.string(),
        preferredCommunication: z.string(),
        startingDate: z.date(),
        role: z.string(),
        status: z.string(),
        comments: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.password !== "") {
        const user = await ctx.db.user.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.firstName,
            email: input.email,
            password: ctx.security.hash(input.password),
            surname: input.surname,
            mobile: input.mobile,
            addressGreaterArea: {
              createMany: {
                data: input.addressGreaterAreaID.map((areaID) => ({
                  greaterAreaID: areaID,
                })),
              },
            },
            addressStreet: input.addressStreet,
            southAfricanID: input.southAfricanID,
            //addressGreaterAreaID: input.addressGreaterAreaID,
            // addressGreaterArea: {
            //   connect: {
            //     greaterAreaID: input.addressGreaterAreaID,
            //   },
            // },
            // addressArea: input.addressAreaID
            //   ? {
            //       connect: {
            //         areaID: input.addressAreaID,
            //       },
            //     }
            //   : undefined,

            // addressArea: input.addressAreaID
            //   ? {
            //       connect: {
            //         areaID: input.addressAreaID,
            //       },
            //     }
            //   : {
            //       disconnect: true,
            //     },
            // addressStreet: input.addressStreetID
            //   ? {
            //       connect: {
            //         streetID: input.addressStreetID,
            //       },
            //     }
            //   : {
            //       disconnect: true,
            //     },
            addressStreetCode: input.addressStreetCode,
            addressStreetNumber: input.addressStreetNumber,
            addressSuburb: input.addressSuburb,
            addressPostalCode: input.addressPostalCode,
            addressFreeForm: input.addressFreeForm,
            preferredCommunication: input.preferredCommunication,
            startingDate: input.startingDate,
            role: input.role,
            status: input.status,
            comments: input.comments,
            updatedAt: new Date(),
          },
        });
        return user;
      } else {
        const user = await ctx.db.user.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.firstName,
            email: input.email,
            surname: input.surname,
            mobile: input.mobile,
            addressGreaterArea: {
              createMany: {
                data: input.addressGreaterAreaID.map((areaID) => ({
                  greaterAreaID: areaID,
                })),
              },
            },
            addressStreet: input.addressStreet,
            southAfricanID: input.southAfricanID,
            //addressGreaterAreaID: input.addressGreaterAreaID,
            // addressGreaterArea: {
            //   connect: {
            //     greaterAreaID: input.addressGreaterAreaID,
            //   },
            // },
            // addressArea: input.addressAreaID
            //   ? {
            //       connect: {
            //         areaID: input.addressAreaID,
            //       },
            //     }
            //   : {
            //       disconnect: true,
            //     },
            // addressStreet: input.addressStreetID
            //   ? {
            //       connect: {
            //         streetID: input.addressStreetID,
            //       },
            //     }
            //   : {
            //       disconnect: true,
            //     },
            addressStreetCode: input.addressStreetCode,
            addressStreetNumber: input.addressStreetNumber,
            addressSuburb: input.addressSuburb,
            addressPostalCode: input.addressPostalCode,
            addressFreeForm: input.addressFreeForm,
            preferredCommunication: input.preferredCommunication,
            startingDate: input.startingDate,
            role: input.role,
            status: input.status,
            comments: input.comments,
            updatedAt: new Date(),
          },
        });
        return user;
      }
    }),

  deleteAll: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.db.greaterAreaOnUser.deleteMany();
    return await ctx.db.user.deleteMany();
  }),

  getUserDetails: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findMany({
      where: { id: ctx.session.user.id },
    });
  }),

  getAllUsers: publicProcedure.query(({ ctx }) => {
    return ctx.db.user.findMany();
  }),

  //get the las id of the user
  getLastUserID: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findFirst({
      orderBy: {
        id: "desc",
      },
    });
  }),

  //implement full text search for users
  searchUsers: publicProcedure
    .input(
      z.object({
        searchQuery: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.user.findMany({
        where: {
          OR: [
            //{ userID: { contains: input.searchQuery } },
            { name: { contains: input.searchQuery } },
            { surname: { contains: input.searchQuery } },
            { email: { contains: input.searchQuery } },
            { role: { contains: input.searchQuery } },
            { status: { contains: input.searchQuery } },
            { mobile: { contains: input.searchQuery } },
            { southAfricanID: { contains: input.searchQuery } },
            //{ addressGreaterArea: { contains: input.searchQuery } },
            { addressStreet: { contains: input.searchQuery } },
            // { addressGreaterArea: { contains: input.searchQuery } },
            // { addressArea: { contains: input.searchQuery } },
            // { addressStreet: { contains: input.searchQuery } },
            { addressStreetCode: { contains: input.searchQuery } },
            // { addressStreetNumber: { equals: input.searchQuery } },
            { addressSuburb: { contains: input.searchQuery } },
            { addressPostalCode: { contains: input.searchQuery } },
            { addressFreeForm: { contains: input.searchQuery } },
            { preferredCommunication: { contains: input.searchQuery } },
            { comments: { contains: input.searchQuery } },
          ],
        },
        orderBy: {
          userID: "asc",
        },
      });
    }),

  //Infinite query and search for users
  searchUsersInfinite: publicProcedure
    .input(
      z.object({
        id: z.string(),
        limit: z.number(),
        cursor: z.string().default(""),
        searchQuery: z.string(),
        order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Parse the search query
      const terms = input.searchQuery.match(/\+\w+/g)?.map((term) => term.substring(1)) ?? [];

      // // If the term is a U followed by a number, it is a user ID
      // const userIDs = terms
      //   .filter((term) => term.match(/^U\d+$/) !== null)
      //   .map((term) => Number(term.substring(1)));

      // Construct a complex search condition
      // Construct a complex search condition
      const searchConditions = terms.map((term) => {
        // Check if term is a UserID
        if (term.match(/^U\d+$/) !== null) {
          return {
            OR: [
              { userID: { equals: Number(term.substring(1)) } },
              { name: { contains: term } },
              { surname: { contains: term } },
              { email: { contains: term } },
              { role: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              { southAfricanID: { contains: term } },
              { addressGreaterArea: { some: { greaterArea: { greaterArea: { contains: term } } } } },
              { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              //{ addressStreetNumber: { equals: Number(term) } },
              { addressSuburb: { contains: term } },
              { addressPostalCode: { contains: term } },
              { addressFreeForm: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
          //checks for a number
        } else if (term.match(/^\d+$/) !== null) {
          return {
            OR: [
              { name: { contains: term } },
              { surname: { contains: term } },
              { email: { contains: term } },
              { role: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              { southAfricanID: { contains: term } },
              { addressGreaterArea: { some: { greaterArea: { greaterArea: { contains: term } } } } },
              { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              { addressStreetNumber: { equals: Number(term) } },
              { addressSuburb: { contains: term } },
              { addressPostalCode: { contains: term } },
              { addressFreeForm: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { name: { contains: term } },
              { surname: { contains: term } },
              { email: { contains: term } },
              { role: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              { southAfricanID: { contains: term } },
              { addressGreaterArea: { some: { greaterArea: { greaterArea: { contains: term } } } } },
              { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              //{ addressStreetNumber: { equals: Number(term) } },
              { addressSuburb: { contains: term } },
              { addressPostalCode: { contains: term } },
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

      const user = await ctx.db.user.findMany({
        where: { AND: searchConditions },
        orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        //include: {
        // addressGreaterArea: true,
        // addressArea: true,
        // addressStreet: true,
        //},
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (user.length > input.limit) {
        const nextRow = user.pop();
        nextCursor = nextRow?.id;
      }

      //fetch the greater areas
      const greaterAreas = await ctx.db.greaterAreaOnUser.findMany({
        where: {
          userID: {
            in: user.map((user) => user.userID),
          },
        },
        select: {
          greaterAreaID: true,
          userID: true,
          greaterArea: {
            // select: {
            //   date: true,
            //   area: true,
            // },
          },
        },
      });

      return {
        user_data: user,
        greater_areas_data: greaterAreas,
        nextCursor,
      };
    }),

  //get user by it's userID
  getUserByID: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      console.log(input.id);
      const user = await ctx.db.user.findUnique({
        where: {
          id: input.id,
        },
      });
      console.log(user);
      return user;
    }),

  //delete user
  deleteUser: publicProcedure
    .input(
      z.object({
        userID: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.delete({
        where: {
          id: input.userID,
        },
      });
    }),

  //Create a new identification record
  createIdentification: publicProcedure
    .input(
      z.object({
        userID: z.number(),
        volunteerID: z.number(),
        petID: z.number(),
        petOwnerID: z.number(),
        clinicID: z.number(),
        treatmentID: z.number(),
        communicationID: z.number(),
        greaterAreaID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.identification.create({
        data: {
          userID: input.userID,
          volunteerID: input.volunteerID,
          petID: input.petID,
          petOwnerID: input.petOwnerID,
          clinicID: input.clinicID,
          treatmentID: input.treatmentID,
          communicationID: input.communicationID,
          greaterAreaID: input.greaterAreaID,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }),

  //update identification
  updateIdentification: publicProcedure
    .input(
      z.object({
        userID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.identification.update({
        where: {
          identificationID: 1,
        },
        data: {
          userID: input.userID,
          updatedAt: new Date(),
        },
      });
    }),

  //delete all identification
  deleteAllIdentification: publicProcedure.mutation(async ({ ctx }) => {
    return await ctx.db.identification.deleteMany({});
  }),

  //get latest userID from identification
  getLatestUserID: publicProcedure.query(async ({ ctx }) => {
    const identification = await ctx.db.identification.findUnique({
      where: {
        identificationID: 1,
      },
    });

    return identification;
  }),

  //make a download
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
        if (term.match(/^U\d+$/) !== null) {
          return {
            OR: [
              // { userID: { equals: Number(term) } },
              { userID: { equals: Number(term.substring(1)) } },
              { name: { contains: term } },
              { surname: { contains: term } },
              { email: { contains: term } },
              { role: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              { southAfricanID: { contains: term } },
              { addressGreaterArea: { some: { greaterArea: { greaterArea: { contains: term } } } } },
              { addressStreet: { contains: term } },
              // { addressGreaterArea: { contains: term } },
              // { addressArea: { contains: term } },
              // { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              //{ addressStreetNumber: { equals: Number(term) } },
              { addressSuburb: { contains: term } },
              { addressPostalCode: { contains: term } },
              { addressFreeForm: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else if (term.match(/^\d+$/) !== null) {
          return {
            OR: [
              { name: { contains: term } },
              { surname: { contains: term } },
              { email: { contains: term } },
              { role: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              { southAfricanID: { contains: term } },
              { addressGreaterArea: { some: { greaterArea: { greaterArea: { contains: term } } } } },
              { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              { addressStreetNumber: { equals: Number(term) } },
              { addressSuburb: { contains: term } },
              { addressPostalCode: { contains: term } },
              { addressFreeForm: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { name: { contains: term } },
              { surname: { contains: term } },
              { email: { contains: term } },
              { role: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              { southAfricanID: { contains: term } },
              { addressGreaterArea: { some: { greaterArea: { greaterArea: { contains: term } } } } },
              { addressStreet: { contains: term } },
              //  { addressGreaterArea: { contains: term } },
              //  { addressArea: { contains: term } },
              //  { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              //{ addressStreetNumber: { equals: Number(term) } },
              { addressSuburb: { contains: term } },
              { addressPostalCode: { contains: term } },
              { addressFreeForm: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
      });

      const users = await ctx.db.user.findMany({
        where: {
          AND: searchConditions,
        },
        orderBy: {
          userID: "asc",
        },
      });

      return users;
    }),
});
