import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure, accessProcedure } from "~/server/api/trpc";

import { Prisma } from "@prisma/client";

type Visits = {
  date: Date;
  species: string;
};

export const petClinicRouter = createTRPCRouter({
  create: accessProcedure(["System Administrator", "Data Analyst"])
    .input(
      z.object({
        greaterAreaID: z.number(),
        //areaID: z.number(),
        conditionsID: z.number().array(),
        comments: z.string(),
        date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const petClinic = await ctx.db.petClinic.create({
        data: {
          date: input.date,
          greaterArea: { connect: { greaterAreaID: input.greaterAreaID } },
          // area: { connect: { areaID: input.areaID } },
          //conditions: input.conditions,
          conditions: {
            createMany: {
              data: input.conditionsID.map((conditionID) => ({
                conditionID: conditionID,
              })),
            },
          },
          comments: input.comments,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return petClinic;
    }),

  // update the clinic
  update: accessProcedure(["System Administrator", "Data Analyst"])
    .input(
      z.object({
        clinicID: z.number(),
        greaterAreaID: z.number(),
        // areaID: z.number(),
        conditionsID: z.number().array(),
        comments: z.string(),
        date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const petClinic = await ctx.db.petClinic.update({
        where: {
          clinicID: input.clinicID,
        },
        data: {
          greaterArea: { connect: { greaterAreaID: input.greaterAreaID } },
          // area: { connect: { areaID: input.areaID } },
          //: input.conditions,
          comments: input.comments,
          date: input.date,
          updatedAt: new Date(),
        },
      });

      await ctx.db.conditionsOnClinic.deleteMany({
        where: {
          clinicID: input.clinicID,
        },
      });

      //create new greater areas
      const conditionsRelationships = input.conditionsID.map(async (conditionID) => {
        await ctx.db.conditionsOnClinic.create({
          data: {
            clinic: {
              connect: {
                clinicID: petClinic.clinicID,
              },
            },
            condition: {
              connect: {
                conditionID: conditionID,
              },
            },
          },
        });
      });

      await Promise.all(conditionsRelationships);

      return petClinic;
    }),

  //Infinite query and search for clinics
  searchClinicsInfinite: accessProcedure(["System Administrator", "Data Analyst"])
    .input(
      z.object({
        clinicID: z.number(),
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
        if (term.match(/^C\d+$/) !== null) {
          return {
            OR: [
              { clinicID: { equals: Number(term.substring(1)) } },
              { greaterArea: { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              // { area: { area: { contains: term } } },
              {
                conditions: {
                  some: {
                    condition: {
                      condition: {
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
              { greaterArea: { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              // { area: { area: { contains: term } } },
              //{ conditions: { hasSome: [term] } },
              {
                conditions: {
                  some: {
                    condition: {
                      condition: {
                        contains: term,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                  },
                },
              },
              { comments: { contains: term, mode: Prisma.QueryMode.insensitive } },
              // dateCondition,
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
      });

      //Orders the results
      const order: Record<string, string> = {};

      if (input.order !== "date") {
        order.updatedAt = "desc";
      } else {
        order.date = "desc";
      }

      const clinic = await ctx.db.petClinic.findMany({
        where: {
          AND: searchConditions,
        },
        orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { clinicID: input.cursor } : undefined,
        include: {
          greaterArea: true,
          //area: true,
          pet: {
            include: {
              pet: {
                select: {
                  species: true,
                },
              },
            },
          },
          conditions: {
            select: {
              condition: {
                select: {
                  condition: true,
                },
              },
              conditionID: true,
            },
          },
        },
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (clinic.length > input.limit) {
        const nextRow = clinic.pop();
        newNextCursor = nextRow?.clinicID;
      }

      return {
        user_data: clinic,
        nextCursor: newNextCursor,
      };
    }),

  //delete clinic
  deleteClinic: accessProcedure(["System Administrator", "Data Analyst"])
    .input(
      z.object({
        clinicID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.conditionsOnClinic.deleteMany({
        where: {
          clinicID: input.clinicID,
        },
      });

      await ctx.db.petOnPetClinic.deleteMany({
        where: {
          clinicID: input.clinicID,
        },
      });

      await ctx.db.volunteerOnPetClinic.deleteMany({
        where: {
          clinicID: input.clinicID,
        },
      });

      return await ctx.db.petClinic.delete({
        where: {
          clinicID: input.clinicID,
        },
      });
    }),

  //get one pet clinic
  getClinicByID: accessProcedure(["System Administrator", "Data Analyst"])
    .input(
      z.object({
        clinicID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const petClinic = await ctx.db.petClinic.findUnique({
        where: {
          clinicID: input.clinicID,
        },
        select: {
          clinicID: true,
          greaterArea: true,
          area: true,
          conditions: true,
          comments: true,
          date: true,
          updatedAt: true,
        },
      });
      return petClinic;
    }),

  //get all clinics
  getAllClinics: protectedProcedure.query(async ({ ctx }) => {
    const petClinic = await ctx.db.petClinic.findMany({
      orderBy: {
        date: "desc",
      },
      include: {
        greaterArea: true,
        area: true,
      },
    });
    return petClinic;
  }),

  //delete all clinics
  deleteAllClinics: accessProcedure(["System Administrator", "Data Analyst"]).mutation(async ({ ctx }) => {
    return await ctx.db.petClinic.deleteMany({});
  }),

  //Bulk upload of all the clinics
  insertExcelData: accessProcedure(["System Administrator", "Data Analyst"])
    .input(
      z.array(
        z.object({
          greaterAreaID: z.number(),
          areaID: z.number(),
          conditions: z.string().array(),
          comments: z.string(),
          date: z.date(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.petClinic.createMany({
        data: input,
      });
      return result;
    }),

  //Update identification
  updateIdentification: accessProcedure(["System Administrator", "Data Analyst"])
    .input(
      z.object({
        clinicID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.identification.update({
        where: {
          identificationID: 1,
        },
        data: {
          clinicID: input.clinicID,
          updatedAt: new Date(),
        },
      });
    }),

  //get latest clinicID from identification
  getLatestClinicID: accessProcedure(["System Administrator", "Data Analyst"]).query(async ({ ctx }) => {
    const identification = await ctx.db.identification.findUnique({
      where: {
        identificationID: 1,
      },
    });

    return identification;
  }),

  // //Get all the owners that are active and sum these owners for each year for the last 5 years. seperate into respective greater areas
  getClinicsHeld: protectedProcedure.query(async ({ ctx }) => {
    const currentYear = new Date().getFullYear();
    const clinicsHeld: Record<number, Record<string, number>> = {};

    const greaterAreas = await ctx.db.greaterArea.findMany();

    const clinics = await ctx.db.petClinic.findMany({});

    for (let year = currentYear - 4; year <= currentYear; year++) {
      const clinicsInYear = clinics.filter((clinic) => clinic.date.getFullYear() === year);
      //activeOwners[year] = {};

      for (const area of greaterAreas) {
        const clinicsInArea = clinicsInYear.filter((clinic) => clinic.greaterAreaID === area.greaterAreaID).length;
        if (clinicsHeld[year] === undefined) {
          clinicsHeld[year] = {};
        }
        clinicsHeld[year]![area.greaterArea] = clinicsInArea;
      }
    }

    const transformedData = Object.entries(clinicsHeld).map(([category, value]) => ({
      category: Number(category),
      value,
    }));

    return {
      transformedData: transformedData,
      clinics: clinics,
    };
  }),

  //GET CLINIC VISITS OF LAST 5 YEARS FOR DOGS AND CATS
  getClinicVisits: accessProcedure(["System Administrator", "Data Analyst"]).query(async ({ ctx }) => {
    const currentYear = new Date().getFullYear();
    const clinicVisits: Record<number, number> = {};

    const clinics = await ctx.db.petClinic.findMany({});

    for (let year = currentYear - 4; year <= currentYear; year++) {
      const clinicsInYear = clinics.filter((clinic) => clinic.date.getFullYear() === year);
      clinicVisits[year] = clinicsInYear.length;
    }

    const transformedData = Object.entries(clinicVisits).map(([category, value]) => ({
      category: Number(category),
      value,
    }));

    return {
      transformedData: transformedData,
      clinicVisits: clinicVisits,
    };
  }),

  getClinicVisitsBySpecies: protectedProcedure.query(async ({ ctx }) => {
    const currentYear = new Date().getFullYear();

    const clinicsVisited = await ctx.db.petClinic.findMany({
      // where: {
      //   date: {
      //     gte: new Date(new Date().getFullYear() - 4),
      //   },
      // },
      include: {
        pet: {
          include: {
            pet: {
              select: {
                species: true,
              },
            },
          },
        },
      },
    });

    const visits: Visits[] = clinicsVisited.map((clinic) => clinic.pet.map((pet) => ({ date: clinic.date, species: pet.pet.species }))).flat();
    // Extract all the dogs and cats
    const dogs = visits.filter((visit) => visit.species === "Dog");
    const cats = visits.filter((visit) => visit.species === "Cat");

    const clinicVisitsDogs = {
      [currentYear - 4]: dogs.filter((pet) => pet.date.getFullYear() === currentYear - 4).length,
      [currentYear - 3]: dogs.filter((pet) => pet.date.getFullYear() === currentYear - 3).length,
      [currentYear - 2]: dogs.filter((pet) => pet.date.getFullYear() === currentYear - 2).length,
      [currentYear - 1]: dogs.filter((pet) => pet.date.getFullYear() === currentYear - 1).length,
      [currentYear]: dogs.filter((pet) => pet.date.getFullYear() === currentYear).length,
    };

    const clinicVisitsCats = {
      [currentYear - 4]: cats.filter((pet) => pet.date.getFullYear() === currentYear - 4).length,
      [currentYear - 3]: cats.filter((pet) => pet.date.getFullYear() === currentYear - 3).length,
      [currentYear - 2]: cats.filter((pet) => pet.date.getFullYear() === currentYear - 2).length,
      [currentYear - 1]: cats.filter((pet) => pet.date.getFullYear() === currentYear - 1).length,
      [currentYear]: cats.filter((pet) => pet.date.getFullYear() === currentYear).length,
    };

    return {
      data: dogs,
      visits: { dogs: clinicVisitsDogs, cats: clinicVisitsCats },
    };
  }),

  //Conditions table create
  createConditions: accessProcedure(["System Administrator", "Data Analyst"])
    .input(
      z.object({
        conditions: z.string().array(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const conditions = input.conditions;
      const now = new Date();

      for (const condition of conditions) {
        await ctx.db.conditions.create({
          data: {
            condition: condition,
            createdAt: now,
            updatedAt: now,
          },
        });
      }

      return conditions;
    }),

  // //Get all the clinics and sum these clinics for each year for the last 5 years
  // getClinicsHeld: protectedProcedure.query(async ({ ctx }) => {
  //   const clinics = await ctx.db.petClinic.findMany();

  //   const last5YearsClinics = clinics.filter((clinic) => clinic.date.getFullYear() >= new Date().getFullYear() - 4);

  //   const firstYearClinics = last5YearsClinics.filter((clinic) => clinic.date.getFullYear() === new Date().getFullYear() - 4);
  //   const secondYearClinics = last5YearsClinics.filter((clinic) => clinic.date.getFullYear() === new Date().getFullYear() - 3);
  //   const thirdYearClinics = last5YearsClinics.filter((clinic) => clinic.date.getFullYear() === new Date().getFullYear() - 2);
  //   const fourthYearClinics = last5YearsClinics.filter((clinic) => clinic.date.getFullYear() === new Date().getFullYear() - 1);
  //   const fifthYearClinics = last5YearsClinics.filter((clinic) => clinic.date.getFullYear() === new Date().getFullYear());

  //   const clinicsHeld = {
  //     [new Date().getFullYear() - 4]: firstYearClinics.length,
  //     [new Date().getFullYear() - 3]: secondYearClinics.length,
  //     [new Date().getFullYear() - 2]: thirdYearClinics.length,
  //     [new Date().getFullYear() - 1]: fourthYearClinics.length,
  //     [new Date().getFullYear()]: fifthYearClinics.length,
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

  //   return clinicsHeld;
  // }),

  //download
  download: accessProcedure(["System Administrator", "Data Analyst"])
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
        if (term.match(/^C\d+$/) !== null) {
          return {
            OR: [
              { clinicID: { equals: Number(term.substring(1)) } },
              { greaterArea: { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              //  { area: { contains: term } },
              {
                conditions: {
                  some: {
                    condition: {
                      condition: {
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
              { greaterArea: { greaterArea: { contains: term, mode: Prisma.QueryMode.insensitive } } },
              // { area: { contains: term } },
              {
                conditions: {
                  some: {
                    condition: {
                      condition: {
                        contains: term,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                  },
                },
              },
              { comments: { contains: term, mode: Prisma.QueryMode.insensitive } },
              // dateCondition,
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
      });

      const clinic_data = await ctx.db.petClinic.findMany({
        where: {
          AND: searchConditions,
        },
        orderBy: {
          clinicID: "asc",
        },
        include: {
          greaterArea: true,
          pet: {
            include: {
              pet: {
                select: {
                  species: true,
                },
              },
            },
          },
          //area: true,
          conditions: {
            select: {
              condition: {
                select: {
                  condition: true,
                },
              },
            },
          },
        },
      });

      const clinic = clinic_data.map((clinic) => {
        return {
          "Clinic ID": clinic.clinicID,
          Date: clinic.date,
          "Greater Area": clinic.greaterArea.greaterArea,
          Conditions: clinic.conditions.map((condition) => condition.condition.condition).join(", "),
          "Dog visits": clinic.pet.filter((pet) => pet.pet.species === "Dog").length,
          "Cat visits": clinic.pet.filter((pet) => pet.pet.species === "Cat").length,
          Comments: clinic.comments,
        };
      });

      return clinic;
    }),
});
