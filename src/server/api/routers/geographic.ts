import { z } from "zod";

import { areaStreetMapping } from "~/components/GeoLocation/areaStreetMapping";

import { Prisma } from "@prisma/client";

import {
  createTRPCRouter,
  //protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

//define type of area
type Area = {
  area: string;
  greaterAreaID: number;
  createdAt: Date;
  updatedAt: Date;
};

export const geographicRouter = createTRPCRouter({
  //create new greaterArea record
  createGreaterArea: publicProcedure
    .input(
      z.object({
        greaterArea: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const greaterArea = await ctx.db.greaterArea.create({
        data: {
          greaterArea: input.greaterArea,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return greaterArea;
    }),

  //create new area record
  createArea: publicProcedure
    .input(
      z.object({
        area: z.string(),
        greaterAreaID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // const area = input.area.map(async (area) => {
      //   return await ctx.db.area.create({
      //     data: {
      //       area: area,
      //       greaterArea: { connect: { greaterAreaID: input.greaterAreaID } },
      //       createdAt: new Date(),
      //       updatedAt: new Date(),
      //     },
      //   });
      // });
      const area = await ctx.db.area.create({
        data: {
          area: input.area,
          greaterArea: { connect: { greaterAreaID: input.greaterAreaID } },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return area;
    }),

  //     const area = await ctx.db.area.create({
  //     data: {
  //         area: ,
  //         greaterArea: { connect: { greaterAreaID: input.greaterAreaID } },
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //     },
  //     });
  //     return area;
  // }),

  //create new street record
  createStreet: publicProcedure
    .input(
      z.object({
        street: z.string(),
        areaID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // const street = input.street.map(async (street) => {
      //   return await ctx.db.street.create({
      //     data: {
      //       street: street,
      //       area: { connect: { areaID: input.areaID } },
      //       createdAt: new Date(),
      //       updatedAt: new Date(),
      //     },
      //   });
      // });
      const street = await ctx.db.street.create({
        data: {
          street: input.street,
          area: { connect: { areaID: input.areaID } },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return street;
    }),

  //update greaterArea
  updateGreaterArea: publicProcedure
    .input(
      z.object({
        greaterAreaID: z.number(),
        greaterArea: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.greaterArea.update({
        where: {
          greaterAreaID: input.greaterAreaID,
        },
        data: {
          greaterArea: input.greaterArea,
        },
      });
    }),

  //update area
  updateArea: publicProcedure
    .input(
      z.object({
        areaID: z.number(),
        area: z.string(),
        // greaterAreaID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.area.update({
        where: {
          areaID: input.areaID,
        },
        data: {
          area: input.area,
          // greaterArea: { connect: { greaterAreaID: input.greaterAreaID } },
        },
      });
    }),

  //update street
  updateStreet: publicProcedure
    .input(
      z.object({
        streetID: z.number(),
        street: z.string(),
        //areaID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.street.update({
        where: {
          streetID: input.streetID,
        },
        data: {
          street: input.street,
          // area: { connect: { areaID: input.areaID } },
        },
      });
    }),

  //delete greaterArea
  deleteGreaterArea: publicProcedure
    .input(
      z.object({
        greaterAreaID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.greaterAreaOnVolunteer.deleteMany({
        where: {
          greaterAreaID: input.greaterAreaID,
        },
      });

      await ctx.db.greaterAreaOnUser.deleteMany({
        where: {
          greaterAreaID: input.greaterAreaID,
        },
      });

      await ctx.db.pet.deleteMany({
        where: {
          owner: {
            addressGreaterAreaID: input.greaterAreaID,
          },
        },
      });

      await ctx.db.petOwner.deleteMany({
        where: {
          addressGreaterAreaID: input.greaterAreaID,
        },
      });

      await ctx.db.areaOnCommunication.deleteMany({
        where: {
          area: {
            greaterAreaID: input.greaterAreaID,
          },
        },
      });

      await ctx.db.greaterAreaOnCommunication.deleteMany({
        where: {
          greaterAreaID: input.greaterAreaID,
        },
      });

      await ctx.db.petClinic.deleteMany({
        where: {
          greaterAreaID: input.greaterAreaID,
        },
      });

      await ctx.db.street.deleteMany({
        where: {
          area: {
            greaterAreaID: input.greaterAreaID,
          },
        },
      });

      await ctx.db.area.deleteMany({
        where: {
          greaterAreaID: input.greaterAreaID,
        },
      });

      return await ctx.db.greaterArea.delete({
        where: {
          greaterAreaID: input.greaterAreaID,
        },
      });
    }),

  //delete area
  deleteArea: publicProcedure
    .input(
      z.object({
        areaID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.street.deleteMany({
        where: {
          areaID: input.areaID,
        },
      });
      return await ctx.db.area.delete({
        where: {
          areaID: input.areaID,
        },
      });
    }),

  //delete street

  deleteStreet: publicProcedure
    .input(
      z.object({
        streetID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.street.delete({
        where: {
          streetID: input.streetID,
        },
      });
    }),

  //get greaterArea by ID
  getGreaterAreaByID: publicProcedure
    .input(
      z.object({
        greaterAreaID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const greaterArea = await ctx.db.greaterArea.findUnique({
        where: {
          greaterAreaID: input.greaterAreaID,
        },
        include: {
          area: {
            include: {
              street: true,
            },
          },
        },
      });
      return greaterArea;
    }),

  //get all greater areas
  getAllGreaterAreas: publicProcedure.query(async ({ ctx }) => {
    const greaterAreas = await ctx.db.greaterArea.findMany({
      orderBy: {
        greaterArea: "asc",
      },
      include: {
        area: true,
      },
    });
    return greaterAreas;
  }),

  //get area by ID
  getAreaByID: publicProcedure
    .input(
      z.object({
        areaID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const area = await ctx.db.area.findUnique({
        where: {
          areaID: input.areaID,
        },
      });
      return area;
    }),

  //get all areas
  getAllAreas: publicProcedure.query(async ({ ctx }) => {
    const areas = await ctx.db.area.findMany({
      orderBy: {
        area: "asc",
      },
    });
    return areas;
  }),

  //get street by ID
  getStreetByID: publicProcedure
    .input(
      z.object({
        streetID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const street = await ctx.db.street.findUnique({
        where: {
          streetID: input.streetID,
        },
      });
      return street;
    }),

  //get all streets
  getAllStreets: publicProcedure.query(async ({ ctx }) => {
    const streets = await ctx.db.street.findMany({
      orderBy: {
        street: "asc",
      },
    });
    return streets;
  }),

  //get getAreasByGreaterID
  getAreasByGreaterID: publicProcedure
    .input(
      z.object({
        greaterAreaID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const areas = await ctx.db.area.findMany({
        where: {
          greaterAreaID: input.greaterAreaID,
        },
      });
      return areas;
    }),

  //get getStreetsByAreaID
  getStreetsByAreaID: publicProcedure
    .input(
      z.object({
        areaID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const streets = await ctx.db.street.findMany({
        where: {
          areaID: input.areaID,
        },
      });
      return streets;
    }),

  //delete all greater areas and areas and streets
  deleteAll: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.db.street.deleteMany({});
    await ctx.db.area.deleteMany({});
    return await ctx.db.greaterArea.deleteMany({});
  }),

  //Infinite query and search for greaterAreas and areas and streets
  searchInfinite: publicProcedure
    .input(
      z.object({
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
        return {
          OR: [
            { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } },
            { area: { some: { area: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
            { area: { some: { street: { some: { street: { contains: term, mode: Prisma.QueryMode.insensitive } } } } } },
            //{ area: { some: { area: { some: { street: { contains: term } } } } } },
            // { area: { contains: term } },
            // { street: { contains: term } },
          ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
        };
      });

      // //construct complex search condition for area
      // const searchConditionsArea = terms.map((term) => {
      // return {
      //     OR: [
      //     { area: { contains: term } },
      //     ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
      // };
      // });

      // //construct complex search condition for street
      // const searchConditionsStreet = terms.map((term) => {
      // return {
      //     OR: [
      //     { street: { contains: term } },
      //     ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
      // };
      // });

      //Orders the results
      const order: Record<string, string> = {};
      if (input.order !== "date") {
        order.updatedAt = "asc";
      } else {
        order.date = "asc";
      }
      const greaterArea_ = await ctx.db.greaterArea.findMany({
        where: {
          AND: searchConditions,
        },
        include: {
          area: {
            include: {
              street: true,
            },
          },
        },
        orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { greaterAreaID: input.cursor } : undefined,
      });

      //   //get all the areas of greater area
      //   const areas = [];
      //   for (const greaterArea of greaterArea_) {
      //     const area = await ctx.db.area.findMany({
      //       where: {
      //         greaterAreaID: greaterArea.greaterAreaID,
      //       },
      //     });
      //     areas.push(area);
      //   }

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (greaterArea_.length > input.limit) {
        const nextRow = greaterArea_.pop();
        newNextCursor = nextRow?.greaterAreaID;
      }
      return {
        geographic_data: greaterArea_,
        nextCursor: newNextCursor,
      };
    }),

  //UPLOAD
  upload: publicProcedure.mutation(async ({ ctx }) => {
    const greaterArea = await ctx.db.greaterArea.create({
      data: {
        greaterArea: "Greater Area 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    for (const area in areaStreetMapping) {
      const area_ = await ctx.db.area.create({
        data: {
          area: area,
          greaterArea: { connect: { greaterAreaID: greaterArea.greaterAreaID } },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // if (areaStreetMapping[area]) {
      for (const street of areaStreetMapping[area] ?? []) {
        await ctx.db.street.create({
          data: {
            street: street,
            area: { connect: { areaID: area_.areaID } },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
      // }
    }
  }),

  //Update identification
  updateIdentification: publicProcedure
    .input(
      z.object({
        greaterAreaID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.identification.update({
        where: {
          identificationID: 1,
        },
        data: {
          greaterAreaID: input.greaterAreaID,
          updatedAt: new Date(),
        },
      });
    }),

  //get latest communicationID from identification
  getLatestGreaterAreaID: publicProcedure.query(async ({ ctx }) => {
    const identification = await ctx.db.identification.findUnique({
      where: {
        identificationID: 1,
      },
    });

    return identification;
  }),

  //Download
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
        return {
          OR: [
            { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } },
            { area: { some: { area: { contains: term, mode: Prisma.QueryMode.insensitive } } } },
            { area: { some: { street: { some: { street: { contains: term, mode: Prisma.QueryMode.insensitive } } } } } },
          ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
        };
      });

      //get all the greaterAreas data specifically
      const greaterArea_ = await ctx.db.greaterArea.findMany({
        where: {
          AND: searchConditions,
        },
        orderBy: {
          greaterAreaID: "asc",
        },
      });

      // const all_data_for_areas_streets = await ctx.db.greaterArea.findMany({
      //   where: {
      //     AND: searchConditions,
      //   },
      //   include: {
      //     area: {
      //       include: {
      //         street: true,
      //       },
      //     },
      //   },
      //   orderBy: {
      //     greaterAreaID: "asc",
      //   },
      // });

      // type Area_ = {
      //   areaID: number;
      //   area: string;
      //   greaterAreaID: number;
      //   createdAt: Date;
      //   updatedAt: Date;
      // };

      // //retrieve all the areas data
      // const area_ = all_data_for_areas_streets.map((greaterArea) => {
      //   // if (greaterArea.area[0] === undefined || greaterArea.area === undefined)
      //   //   return { areaID: 0, area: "", greaterAreaID: greaterArea.greaterAreaID, createdAt: new Date(), updatedAt: new Date() };
      //   // else
      //   greaterArea.area.map((area) => {
      //     // if (area.street[0] === undefined) return { areaID: 0, area: "", greaterAreaID: 0, createdAt: new Date(), updatedAt: new Date() };
      //     return {
      //       areaID: area.areaID,
      //       area: area.area,
      //       greaterAreaID: area.greaterAreaID,
      //       createdAt: area.createdAt,
      //       updatedAt: area.updatedAt,
      //     };
      //   });
      // });

      const _area = await ctx.db.area.findMany({
        where: {
          greaterAreaID: {
            in: greaterArea_.map((greaterArea) => greaterArea.greaterAreaID),
          },
        },
        orderBy: {
          areaID: "asc",
        },
        select: {
          areaID: true,
          area: true,
          greaterAreaID: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const _street = await ctx.db.street.findMany({
        where: {
          areaID: {
            in: _area.map((area) => area.areaID),
          },
        },
        orderBy: {
          streetID: "asc",
        },
        select: {
          streetID: true,
          street: true,
          areaID: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // type Street_ = {
      //   streetID: number;
      //   street: string;
      //   areaID: number;
      //   createdAt: Date;
      //   updatedAt: Date;
      // };

      //retrieve all the streets data
      // const street_ = all_data_for_areas_streets.map((greaterArea) => {
      //   // if (greaterArea.area[0] === undefined || greaterArea === undefined)
      //   //   return { streetID: 0, street: "", areaID: 0, createdAt: new Date(), updatedAt: new Date() };
      //   // else
      //   greaterArea.area.map((area) => {
      //     if (area.street[0] === undefined) return { streetID: 0, street: "", areaID: 0, createdAt: new Date(), updatedAt: new Date() };
      //     else
      //       area.street.map((street) => {
      //         if (street.street === undefined) return { streetID: 0, street: "", areaID: 0, createdAt: new Date(), updatedAt: new Date() };
      //         return {
      //           streetID: street.streetID,
      //           street: street.street,
      //           areaID: street.areaID,
      //           createdAt: street.createdAt,
      //           updatedAt: street.updatedAt,
      //         };
      //       });
      //   });
      // });

      // const greaterArea_ = await ctx.db.greaterArea.findMany({
      //   where: {
      //     AND: searchConditions,
      //   },
      //   // include: {
      //   //   area: {
      //   //     include: {
      //   //       street: true,
      //   //     },
      //   //   },
      //   // },
      //   orderBy: {
      //     greaterAreaID: "asc",
      //   },
      // });

      // const area_ = await ctx.db.area.findMany({
      //   where: {
      //     greaterAreaID: {
      //       in: greaterArea_.map((greaterArea) => greaterArea.greaterAreaID),
      //     },
      //   },
      //   orderBy: {
      //     areaID: "asc",
      //   },
      //   select: {
      //     areaID: true,
      //     area: true,
      //     greaterAreaID: true,
      //     createdAt: true,
      //     updatedAt: true,
      //   },
      // });

      // const street_ = await ctx.db.street.findMany({
      //   where: {
      //     areaID: {
      //       in: area_.map((area) => area.areaID),
      //     },
      //   },
      //   orderBy: {
      //     streetID: "asc",
      //   },
      //   select: {
      //     streetID: true,
      //     street: true,
      //     areaID: true,
      //     createdAt: true,
      //     updatedAt: true,
      //   },
      // });

      return {
        greaterAreas: greaterArea_,
        areas: _area,
        streets: _street,
      };
    }),
});
