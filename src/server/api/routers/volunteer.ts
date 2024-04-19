import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const volunteerRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        firstName: z.string(),
        email: z.string(),
        surname: z.string(),
        southAfricanID: z.string(),
        mobile: z.string(),
        addressGreaterAreaID: z.number().array(),
        addressStreet: z.string(),
        addressStreetCode: z.string(),
        addressStreetNumber: z.number(),
        addressSuburb: z.string(),
        addressPostalCode: z.string(),
        addressFreeForm: z.string(),
        preferredCommunication: z.string(),
        role: z.string().array(),
        collaboratorOrg: z.string(),
        status: z.string(),
        startingDate: z.date(),
        clinicAttended: z.number().array(),
        comments: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      //Create the volunteer
      const volunteer = await ctx.db.volunteer.create({
        data: {
          firstName: input.firstName,
          email: input.email,
          surname: input.surname,
          southAfricanID: input.southAfricanID,
          mobile: input.mobile,
          // addressGreaterArea: {
          //   create: input.addressGreaterAreaID.map((areaID) => ({
          //     greaterArea: {
          //       connect: {
          //         greaterAreaID: areaID,
          //       },
          //     },
          //   })),
          // },
          addressStreet: input.addressStreet,
          addressStreetCode: input.addressStreetCode,
          addressStreetNumber: input.addressStreetNumber,
          addressSuburb: input.addressSuburb,
          addressPostalCode: input.addressPostalCode,
          addressFreeForm: input.addressFreeForm,
          preferredCommunication: input.preferredCommunication,
          role: input.role,
          collaboratorOrg: input.collaboratorOrg,
          status: input.status,
          startingDate: input.startingDate,
          comments: input.comments,
          createdAt: new Date(),
          updatedAt: new Date(),

          clinicsAttended: {
            createMany: {
              data: input.clinicAttended.map((clinicID) => ({
                clinicID: clinicID,
              })),
            },
          },

          addressGreaterArea: {
            createMany: {
              data: input.addressGreaterAreaID.map((areaID) => ({
                greaterAreaID: areaID,
              })),
            },
          },
        },
      });

      //First method
      // Create relationships with clinics
      // const clinicRelationships = input.clinicAttended.map(async (clinicID) => {
      //   await ctx.db.volunteerOnPetClinic.create({
      //     data: {
      //       volunteer: {
      //         connect: {
      //           volunteerID: volunteer.volunteerID,
      //         },
      //       },
      //       clinic: {
      //         connect: {
      //           clinicID: clinicID,
      //         },
      //       },
      //     },
      //   });
      // });

      //await Promise.all(clinicRelationships);

      //Second method
      // await ctx.db.volunteerOnPetClinic.createMany({
      //   data: input.clinicAttended.map((clinicID) => ({
      //     volunteerID: volunteer.volunteerID,
      //     clinicID: clinicID,
      //   })),
      // });

      //First method
      //Create relationships with greater areas
      // const greaterAreaRelationships = input.addressGreaterAreaID.map(async (areaID) => {
      //   await ctx.db.greaterAreaOnVolunteer.create({
      //     data: {
      //       volunteer: {
      //         connect: {
      //           volunteerID: volunteer.volunteerID,
      //         },
      //       },
      //       greaterArea: {
      //         connect: {
      //           greaterAreaID: areaID,
      //         },
      //       },
      //     },
      //   });
      // });

      // await Promise.all(greaterAreaRelationships);

      return volunteer;
    }),

  //update volunteer
  update: publicProcedure
    .input(
      z.object({
        volunteerID: z.number(),
        firstName: z.string(),
        email: z.string(),
        surname: z.string(),
        southAfricanID: z.string(),
        mobile: z.string(),
        addressGreaterAreaID: z.number().array(),
        addressStreet: z.string(),
        addressStreetCode: z.string(),
        addressStreetNumber: z.number(),
        addressSuburb: z.string(),
        addressPostalCode: z.string(),
        addressFreeForm: z.string(),
        preferredCommunication: z.string(),
        role: z.string().array(),
        collaboratorOrg: z.string(),
        status: z.string(),
        startingDate: z.date(),
        clinicAttended: z.number().array(),
        comments: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      //find volunteer with same id and update that volunteer
      const volunteer = await ctx.db.volunteer.update({
        where: {
          volunteerID: input.volunteerID,
        },
        data: {
          firstName: input.firstName,
          email: input.email,
          surname: input.surname,
          southAfricanID: input.southAfricanID,
          mobile: input.mobile,
          // addressGreaterArea: {
          //   create: input.addressGreaterAreaID.map((areaID) => ({
          //     greaterArea: {
          //       connect: {
          //         greaterAreaID: areaID,
          //       },
          //     },
          //   })),
          // },
          addressStreet: input.addressStreet,
          addressStreetCode: input.addressStreetCode,
          addressStreetNumber: input.addressStreetNumber,
          addressSuburb: input.addressSuburb,
          addressPostalCode: input.addressPostalCode,
          addressFreeForm: input.addressFreeForm,
          preferredCommunication: input.preferredCommunication,
          role: input.role,
          collaboratorOrg: input.collaboratorOrg,
          startingDate: input.startingDate,
          status: input.status,
          comments: input.comments,
          updatedAt: new Date(),
        },
      });

      //greater areas
      //delete all the greater areas
      await ctx.db.greaterAreaOnVolunteer.deleteMany({
        where: {
          volunteerID: input.volunteerID,
        },
      });

      //create new greater areas
      const greaterAreaRelationships = input.addressGreaterAreaID.map(async (areaID) => {
        await ctx.db.greaterAreaOnVolunteer.create({
          data: {
            volunteer: {
              connect: {
                volunteerID: volunteer.volunteerID,
              },
            },
            greaterArea: {
              connect: {
                greaterAreaID: areaID,
              },
            },
          },
        });
      });

      await Promise.all(greaterAreaRelationships);

      // Handle clinicsAttended
      // First, remove existing relationships
      await ctx.db.volunteerOnPetClinic.deleteMany({
        where: {
          volunteerID: input.volunteerID,
        },
      });

      // Then, create new relationships with clinics
      const clinicRelationships = input.clinicAttended.map(async (clinicID) => {
        await ctx.db.volunteerOnPetClinic.create({
          data: {
            volunteer: {
              connect: {
                volunteerID: volunteer.volunteerID,
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

      return volunteer;
    }),

  //Infinite query and search for volunteers
  searchVolunteersInfinite: publicProcedure
    .input(
      z.object({
        volunteerID: z.number(),
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

        //check if term is volunteer ID or not

        if (term.match(/^V\d+$/) !== null) {
          return {
            OR: [
              { volunteerID: { equals: Number(term.substring(1)) } },
              { firstName: { contains: term } },
              { surname: { contains: term } },
              { southAfricanID: { contains: term } },
              { email: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              { addressGreaterArea: { some: { greaterArea: { greaterArea: { contains: term } } } } },
              { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              //{ addressStreetNumber: { contains: term } },
              { addressSuburb: { contains: term } },
              { addressPostalCode: { contains: term } },
              { addressFreeForm: { contains: term } },
              { collaboratorOrg: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { firstName: { contains: term } },
              { surname: { contains: term } },
              { southAfricanID: { contains: term } },
              { email: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              { addressGreaterArea: { some: { greaterArea: { greaterArea: { contains: term } } } } },
              { addressStreetCode: { contains: term } },
              // { addressStreetNumber: { contains: term } },
              { addressSuburb: { contains: term } },
              { addressPostalCode: { contains: term } },
              { addressFreeForm: { contains: term } },
              { collaboratorOrg: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
              //  dateCondition,
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

      const user = await ctx.db.volunteer.findMany({
        where: {
          AND: searchConditions,
        },
        orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { volunteerID: input.cursor } : undefined,
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (user.length > input.limit) {
        const nextRow = user.pop();
        newNextCursor = nextRow?.volunteerID;
      }

      //fetch the clinics
      const clinics = await ctx.db.volunteerOnPetClinic.findMany({
        where: {
          volunteerID: {
            in: user.map((volunteer) => volunteer.volunteerID),
          },
        },
        select: {
          clinicID: true,
          volunteerID: true,
          clinic: {
            select: {
              area: true,
              date: true,
              greaterArea: true,
            },
            // select: {
            //   date: true,
            //   area: true,
            // },
          },
        },
      });

      //fetch the greater areas
      const greaterAreas = await ctx.db.greaterAreaOnVolunteer.findMany({
        where: {
          volunteerID: {
            in: user.map((volunteer) => volunteer.volunteerID),
          },
        },
        select: {
          greaterAreaID: true,
          volunteerID: true,
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
        clinics_data: clinics,
        greater_areas_data: greaterAreas,
        nextCursor: newNextCursor,
      };
    }),

  //Add clinic to volunteer
  addClinicToVolunteer: protectedProcedure
    .input(
      z.object({
        volunteerID: z.number(),
        clinicID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.volunteer.update({
        where: {
          volunteerID: input.volunteerID,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      const volunteer = await ctx.db.volunteerOnPetClinic.create({
        data: {
          volunteer: {
            connect: {
              volunteerID: input.volunteerID,
            },
          },
          clinic: {
            connect: {
              clinicID: input.clinicID,
            },
          },
        },
      });
      return volunteer;
    }),

  //delete volunteer
  deleteVolunteer: publicProcedure
    .input(
      z.object({
        volunteerID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      //delete volunteer clinic
      await ctx.db.volunteerOnPetClinic.deleteMany({
        where: {
          volunteerID: input.volunteerID,
        },
      });

      return await ctx.db.volunteer.delete({
        where: {
          volunteerID: input.volunteerID,
        },
      });
    }),

  //get user by it's userID
  getVolunteerByID: publicProcedure
    .input(
      z.object({
        volunteerID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      console.log(input.volunteerID);
      const volunteer = await ctx.db.volunteer.findUnique({
        where: {
          volunteerID: input.volunteerID,
        },
      });
      console.log(volunteer);
      return volunteer;
    }),

  //get one volunteer
  getVolunteer: publicProcedure
    .input(
      z.object({
        volunteerID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const volunteer = await ctx.db.volunteer.findUnique({
        where: {
          volunteerID: input.volunteerID,
        },
      });

      return volunteer;
    }),

  //get all volunteers
  getVolunteers: protectedProcedure.query(async ({ ctx }) => {
    const volunteers = await ctx.db.volunteer.findMany();

    return volunteers;
  }),

  //get all the volunteers that are active
  getActiveVolunteers: protectedProcedure.query(async ({ ctx }) => {
    const volunteers = await ctx.db.volunteer.findMany({
      where: {
        status: {
          equals: "Active",
        },
      },
    });

    return volunteers;
  }),

  //delete all volunteers
  deleteAllVolunteers: publicProcedure.mutation(async ({ ctx }) => {
    //delete all volunteer clinic
    await ctx.db.greaterAreaOnVolunteer.deleteMany({});
    await ctx.db.volunteerOnPetClinic.deleteMany({});
    return await ctx.db.volunteer.deleteMany({});
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
          //addressGreaterAreaID: z.number().array(),
          addressStreet: z.string(),
          addressStreetCode: z.string(),
          addressStreetNumber: z.number(),
          addressSuburb: z.string(),
          addressPostalCode: z.string(),
          addressFreeForm: z.string(),
          preferredCommunication: z.string(),
          role: z.string().array(),
          status: z.string(),
          startingDate: z.date(),
          //clinicAttended: z.number().array(),
          comments: z.string(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.volunteer.createMany({
        data: input,
      });
      return result;
    }),

  //Update identification
  updateIdentification: publicProcedure
    .input(
      z.object({
        volunteerID: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.identification.update({
        where: {
          identificationID: 1,
        },
        data: {
          volunteerID: input.volunteerID,
          updatedAt: new Date(),
        },
      });
    }),

  //get latest volunteer
  //get latest volunteerID from identification
  getLatestVolunteerID: publicProcedure.query(async ({ ctx }) => {
    const identification = await ctx.db.identification.findUnique({
      where: {
        identificationID: 1,
      },
    });

    return identification;
  }),

  // //Get all the volunteers that are active and sum these owners for each year for the last 5 years
  // getActiveVolunteersFor5Years: protectedProcedure.query(async ({ ctx }) => {
  //   const volunteers = await ctx.db.volunteer.findMany({
  //     where: {
  //       status: "Active",
  //     },
  //   });

  //   const last5YearsVolunteers = volunteers.filter((volunteer) => volunteer.startingDate.getFullYear() >= new Date().getFullYear() - 4);

  //   const firstYearVolunteers = last5YearsVolunteers.filter((volunteer) => volunteer.startingDate.getFullYear() === new Date().getFullYear() - 4);
  //   const secondYearVolunteers = last5YearsVolunteers.filter((volunteer) => volunteer.startingDate.getFullYear() === new Date().getFullYear() - 3);
  //   const thirdYearVolunteers = last5YearsVolunteers.filter((volunteer) => volunteer.startingDate.getFullYear() === new Date().getFullYear() - 2);
  //   const fourthYearVolunteers = last5YearsVolunteers.filter((volunteer) => volunteer.startingDate.getFullYear() === new Date().getFullYear() - 1);
  //   const fifthYearVolunteers = last5YearsVolunteers.filter((volunteer) => volunteer.startingDate.getFullYear() === new Date().getFullYear());

  //   const activeVolunteers = {
  //     [new Date().getFullYear() - 4]: firstYearVolunteers.length,
  //     [new Date().getFullYear() - 3]: secondYearVolunteers.length,
  //     [new Date().getFullYear() - 2]: thirdYearVolunteers.length,
  //     [new Date().getFullYear() - 1]: fourthYearVolunteers.length,
  //     [new Date().getFullYear()]: fifthYearVolunteers.length,
  //   };
  //   // const activeVolunteers = last5YearsVolunteers.reduce(
  //   //   (acc, volunteer) => {
  //   //     const year = volunteer.startingDate.getFullYear();
  //   //     if (acc[year]) {
  //   //       acc[year]++;
  //   //     } else {
  //   //       acc[year] = 1;
  //   //     }
  //   //     return acc;
  //   //   },
  //   //   {} as Record<number, number>,
  //   // );

  //   return activeVolunteers;
  // }),

  // //Get all the owners that are active and sum these owners for each year for the last 5 years. seperate into respective greater areas
  getActiveVolunteersFor5Years: protectedProcedure.query(async ({ ctx }) => {
    const currentYear = new Date().getFullYear();
    const activeVolunteers: Record<number, Record<string, number>> = {};

    const greaterAreas = await ctx.db.greaterArea.findMany();

    const volunteers = await ctx.db.volunteer.findMany({
      where: {
        status: "Active",
      },
      include: {
        addressGreaterArea: true,
      },
    });

    for (let year = currentYear - 4; year <= currentYear; year++) {
      const volunteersInYear = volunteers.filter((volunteer) => volunteer.startingDate.getFullYear() === year);
      //activeOwners[year] = {};

      for (const area of greaterAreas) {
        //search through the ID array of greaterAreas in volunteers and if any of the ids match the area.greaterAreaID, then count the number of volunteers in that area
        const volunteersInArea = volunteersInYear.filter((volunteer) =>
          volunteer.addressGreaterArea.some((greaterArea) => greaterArea.greaterAreaID === area.greaterAreaID),
        ).length;
        //const volunteersInArea = volunteersInYear.filter((volunteer) => volunteer. === area.greaterAreaID).length;
        if (activeVolunteers[year] === undefined) {
          activeVolunteers[year] = {};
        }
        activeVolunteers[year]![area.greaterArea] = volunteersInArea;
      }
    }

    const transformedData = Object.entries(activeVolunteers).map(([category, value]) => ({
      category: Number(category),
      value,
    }));

    return {
      transformedData: transformedData,
      owners: volunteers,
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

      // Construct a complex search condition
      const searchConditions = terms.map((term) => {
        if (term.match(/^V\d+$/) !== null) {
          return {
            OR: [
              { volunteerID: { equals: Number(term.substring(1)) } },
              { firstName: { contains: term } },
              { surname: { contains: term } },
              { southAfricanID: { contains: term } },
              { email: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              //{ addressGreaterArea: { hasSome: [term] } },
              { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              //{ addressStreetNumber: { contains: term } },
              { addressSuburb: { contains: term } },
              { addressPostalCode: { contains: term } },
              { addressFreeForm: { contains: term } },
              { collaboratorOrg: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        } else {
          return {
            OR: [
              { firstName: { contains: term } },
              { surname: { contains: term } },
              { southAfricanID: { contains: term } },
              { email: { contains: term } },
              { status: { contains: term } },
              { mobile: { contains: term } },
              //{ addressGreaterArea: { hasSome: [term] } },
              { addressStreet: { contains: term } },
              { addressStreetCode: { contains: term } },
              //{ addressStreetNumber: { contains: term } },
              { addressSuburb: { contains: term } },
              { addressPostalCode: { contains: term } },
              { addressFreeForm: { contains: term } },
              { collaboratorOrg: { contains: term } },
              { preferredCommunication: { contains: term } },
              { comments: { contains: term } },
              //  dateCondition,
            ].filter((condition) => Object.keys(condition).length > 0), // Filter out empty conditions
          };
        }
      });

      const volunteers = await ctx.db.volunteer.findMany({
        where: {
          AND: searchConditions,
        },
        orderBy: {
          volunteerID: "asc",
        },
      });

      return volunteers;
    }),

  //update owners starting date
  updateStartingDate: publicProcedure
    .input(
      z.object({
        volunteerID: z.number(),
        startingDate: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.volunteer.update({
        where: {
          volunteerID: input.volunteerID,
        },
        data: {
          startingDate: input.startingDate,
        },
      });
    }),
});
