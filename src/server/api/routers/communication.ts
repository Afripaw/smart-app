import { equal } from "assert";
import { z } from "zod";

import {
  createTRPCRouter,
  //protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const communicationRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        message: z.string(),
        recipients: z.string().array(),
        greaterArea: z.string().array(),
        area: z.string().array(),
        success: z.string(),
        type: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const communication = await ctx.db.communication.create({
        data: {
          message: input.message,
          recipients: input.recipients,
          greaterArea: input.greaterArea,
          success: input.success,
          type: input.type,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

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
        const termAsDate: Date = new Date(term);
        console.log(termAsDate);
        const dateCondition = !isNaN(termAsDate.getTime()) ? { updatedAt: { equals: termAsDate } } : {};
        return {
          OR: [{ message: { contains: term } }, { success: { contains: term } }, { type: { contains: term } }, dateCondition].filter(
            (condition) => Object.keys(condition).length > 0,
          ), // Filter out empty conditions
        };
      });

      //Orders the results
      const order: Record<string, string> = {};

      if (input.order !== "date") {
        order.updatedAt = "desc";
      } else {
        order.date = "desc";
      }

      const communication = await ctx.db.communication.findMany({
        where: {
          AND: searchConditions,
        },
        orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { communicationID: input.cursor } : undefined,
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
        greaterArea: z.string().array(),
        area: z.string().array(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const users = ctx.db.user.findMany({
        where: {
          addressGreaterArea: { in: input.greaterArea },
          addressArea: { in: input.area },
          status: "Active",
        },
      });

      return users;
    }),

  //get all the pet owners with a given that their greaterArea is in an greaterArea array. As well as the Area
  getAllPetOwners: publicProcedure
    .input(
      z.object({
        greaterArea: z.string().array(),
        area: z.string().array(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const petOwners = ctx.db.petOwner.findMany({
        where: {
          addressGreaterArea: { in: input.greaterArea },
          addressArea: { in: input.area },
          status: "Active",
        },
      });

      return petOwners;
    }),

  //get all the volunteers with a given that their greaterArea is in an greaterArea array. As well as the Area
  getAllVolunteers: publicProcedure
    .input(
      z.object({
        greaterArea: z.string().array(),
        area: z.string().array(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const volunteers = ctx.db.volunteer.findMany({
        where: {
          addressGreaterArea: { hasSome: input.greaterArea },
          status: "Active",
        },
      });

      return volunteers;
    }),
});
