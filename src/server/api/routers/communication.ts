import { z } from "zod";

import {
  createTRPCRouter,
  //protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { Prisma } from "@prisma/client";

export const communicationRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        message: z.string(),
        recipients: z.string().array(),
        greaterArea: z.number().array(),
        area: z.number().array(),
        success: z.string(),
        type: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const communication = await ctx.db.communication.create({
        data: {
          message: input.message,
          recipients: input.recipients,
          success: input.success,
          type: input.type,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const greaterAreaRelations = input.greaterArea.map(async (greaterAreaID) => {
        await ctx.db.greaterAreaOnCommunication.create({
          data: {
            communication: {
              connect: {
                communicationID: communication.communicationID,
              },
            },
            greaterArea: {
              connect: {
                greaterAreaID: greaterAreaID,
              },
            },
          },
        });
      });

      await Promise.all(greaterAreaRelations);

      const areaRelations = input.area.map(async (areaID) => {
        await ctx.db.areaOnCommunication.create({
          data: {
            communication: {
              connect: {
                communicationID: communication.communicationID,
              },
            },
            area: {
              connect: {
                areaID: areaID,
              },
            },
          },
        });
      });

      await Promise.all(areaRelations);

      return communication;
    }),

  //Infinite query and search for clinics
  searchCommunicationsInfinite: publicProcedure
    .input(
      z.object({
        communicationID: z.number(),
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
        // const termAsDate: Date = new Date(term);
        // console.log(termAsDate);
        // const dateCondition = !isNaN(termAsDate.getTime()) ? { updatedAt: { equals: termAsDate } } : {};
        // Check if term is a number
        if (term.match(/^M\d+$/)) {
          return {
            OR: [
              { communicationID: { equals: Number(term.substring(1)) } },
              { message: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { success: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { type: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { greaterArea: { some: { greaterArea: { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } } } } },
              { area: { some: { area: { area: { contains: term, mode: Prisma.QueryMode.insensitive } } } } },
              // { greaterArea: { hasSome: [term] } },
              // { area: { hasSome: [term] } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { message: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { success: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { type: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { greaterArea: { some: { greaterArea: { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } } } } },
              { area: { some: { area: { area: { contains: term, mode: Prisma.QueryMode.insensitive } } } } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
      });

      // //Orders the results
      // const order: Record<string, string> = {};

      // if (input.order !== "date") {
      //   order.updatedAt = "desc";
      // } else {
      //   order.date = "desc";
      // }
      const order: Record<string, string> = {};
      order.updatedAt = "desc";

      const communication = await ctx.db.communication.findMany({
        where: {
          AND: searchConditions,
        },
        orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { communicationID: input.cursor } : undefined,
        include: {
          greaterArea: {
            include: {
              greaterArea: true,
            },
          },
          area: {
            include: {
              area: true,
            },
          },
        },
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (communication.length > input.limit) {
        const nextRow = communication.pop();
        newNextCursor = nextRow?.communicationID;
      }

      return {
        user_data: communication,
        nextCursor: newNextCursor,
      };
    }),

  //delete clinic
  deleteCommunication: publicProcedure
    .input(
      z.object({
        communicationID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.greaterAreaOnCommunication.deleteMany({
        where: {
          communicationID: input.communicationID,
        },
      });

      await ctx.db.areaOnCommunication.deleteMany({
        where: {
          communicationID: input.communicationID,
        },
      });

      return await ctx.db.communication.delete({
        where: {
          communicationID: input.communicationID,
        },
      });
    }),

  //get one pet clinic
  getCommunicationByID: publicProcedure
    .input(
      z.object({
        communicationID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const communication = await ctx.db.communication.findUnique({
        where: {
          communicationID: input.communicationID,
        },
      });
      return communication;
    }),

  //get all clinics
  getAllCommunications: publicProcedure.query(async ({ ctx }) => {
    const communication = await ctx.db.communication.findMany();
    return communication;
  }),

  //delete all clinics
  deleteAllCommunications: publicProcedure.mutation(async ({ ctx }) => {
    return await ctx.db.communication.deleteMany({});
  }),

  //get all the users with a given that their greaterArea is in an greaterArea array. As well as the Area
  getAllUsers: publicProcedure
    .input(
      z.object({
        greaterAreaID: z.number().array(),
        areaID: z.number().array(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const users = ctx.db.user.findMany({
        where: {
          addressGreaterArea: {
            some: {
              greaterAreaID: { in: input.greaterAreaID },
            },
          },
          status: "Active",
        },
      });

      return users;
    }),

  // get all the pet owners with a given that their greaterArea is in an greaterArea array. As well as the Area
  getAllPetOwners: publicProcedure
    .input(
      z.object({
        greaterAreaID: z.number().array(),
        areaID: z.number().array(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const petOwners = ctx.db.petOwner.findMany({
        where: {
          addressGreaterAreaID: { in: input.greaterAreaID },
          addressAreaID: { in: input.areaID },
          status: "Active",
        },
      });

      return petOwners;
    }),

  //get all the volunteers with a given that their greaterArea is in an greaterArea array. As well as the Area
  getAllVolunteers: publicProcedure
    .input(
      z.object({
        greaterAreaID: z.number().array(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const volunteers = ctx.db.volunteer.findMany({
        where: {
          addressGreaterArea: {
            some: {
              greaterAreaID: { in: input.greaterAreaID },
            },
          },
          status: "Active",
        },
      });

      return volunteers;
    }),

  //Update identification
  updateIdentification: publicProcedure
    .input(
      z.object({
        communicationID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.identification.update({
        where: {
          identificationID: 1,
        },
        data: {
          communicationID: input.communicationID,
          updatedAt: new Date(),
        },
      });
    }),

  //get latest communicationID from identification
  getLatestCommunicationID: publicProcedure.query(async ({ ctx }) => {
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
      // Parse the search query
      const terms = input.searchQuery.match(/\+\w+/g)?.map((term) => term.substring(1)) ?? [];

      // Construct a complex search condition
      const searchConditions = terms.map((term) => {
        // Check if term is a date
        // const termAsDate: Date = new Date(term);
        // console.log(termAsDate);
        // const dateCondition = !isNaN(termAsDate.getTime()) ? { updatedAt: { equals: termAsDate } } : {};
        // Check if term is a number
        if (term.match(/^M\d+$/)) {
          return {
            OR: [
              { communicationID: { equals: Number(term.substring(1)) } },
              { message: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { success: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { type: { contains: term, mode: Prisma.QueryMode.insensitive } },
              // { greaterArea: { hasSome: [term] } },
              // { area: { hasSome: [term] } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { message: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { success: { contains: term, mode: Prisma.QueryMode.insensitive } },
              { type: { contains: term, mode: Prisma.QueryMode.insensitive } },
              //  { greaterArea: { hasSome: [term] } },
              //  { area: { hasSome: [term] } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
      });

      const communication = await ctx.db.communication.findMany({
        where: {
          AND: searchConditions,
        },
        orderBy: {
          communicationID: "asc",
        },
      });

      return communication;
    }),
});
