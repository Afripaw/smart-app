import { z } from "zod";

import { Prisma } from "@prisma/client";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import Owner from "~/pages/owner";

export const infoRouter = createTRPCRouter({
  //Database report queries
  //sterilisation queries
  getSterilisationInfinite: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().default(0),
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        species: z.string(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //check what type of query it is and then decide what object will be in the where clause
      const sterilisationQuery =
        input.typeOfQuery === "Requested"
          ? { sterilisedRequested: { gte: input.startDate, lte: input.endDate } }
          : input.typeOfQuery === "Actioned"
            ? { sterilisationOutcome: { equals: "Actioned" }, sterilisationOutcomeDate: { gte: input.startDate, lte: input.endDate } }
            : input.typeOfQuery === "No Show"
              ? { sterilisationOutcome: { equals: "No show" }, sterilisationOutcomeDate: { gte: input.startDate, lte: input.endDate } }
              : {};

      const data = await ctx.db.pet.findMany({
        where: {
          AND: [sterilisationQuery, { species: input.species }],
        },
        //orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { petID: input.cursor } : undefined,
        include: {
          owner: {
            select: {
              firstName: true,
              surname: true,
              mobile: true,
              addressGreaterArea: { select: { greaterArea: true } },
              addressArea: { select: { area: true } },
              addressStreet: { select: { street: true } },
              addressStreetCode: true,
              addressStreetNumber: true,
            },
          },
        },
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (data.length > input.limit) {
        const nextRow = data.pop();
        newNextCursor = nextRow?.petID;
      }

      return {
        data: data,
        nextCursor: newNextCursor,
      };
    }),

  //membership queries
  getMembershipInfinite: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().default(0),
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        species: z.string(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //check what type of query it is and then decide what object will be in the where clause
      const membershipQuery =
        input.typeOfQuery === "Standard Card Holder"
          ? { membership: { equals: "Standard card holder" }, membershipDate: { gte: input.startDate, lte: input.endDate } }
          : input.typeOfQuery === "Gold Card Holder"
            ? { membership: { equals: "Gold card holder" }, membershipDate: { gte: input.startDate, lte: input.endDate } }
            : {};

      const data = await ctx.db.pet.findMany({
        where: {
          AND: [membershipQuery, { species: input.species }],
        },
        //orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { petID: input.cursor } : undefined,
        include: {
          owner: {
            select: {
              firstName: true,
              surname: true,
              addressGreaterArea: { select: { greaterArea: true } },
              addressArea: { select: { area: true } },
              addressStreet: { select: { street: true } },
              addressStreetCode: true,
              addressStreetNumber: true,
            },
          },
          clinicsAttended: {
            select: {
              clinic: {
                select: {
                  date: true,
                },
              },
            },
          },
        },
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (data.length > input.limit) {
        const nextRow = data.pop();
        newNextCursor = nextRow?.petID;
      }

      return {
        data: data,
        nextCursor: newNextCursor,
      };
    }),

  //clinic queries
  getClinicInfinite: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().default(0),
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        singleDate: z.date(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Helper function to calculate the start and end of a given date
      const getDayRange = (dateString: Date) => {
        //const date = new Date(dateString);
        const startOfDay = new Date(dateString);
        startOfDay.setHours(0, 0, 0, 0); // Midnight (start of the day)

        const endOfDay = new Date(dateString);
        endOfDay.setHours(23, 59, 59, 999); // Last millisecond of the day

        return { start: startOfDay, end: endOfDay };
      };

      // Generate the treatment query based on the type of query
      const clinicQuery =
        input.typeOfQuery === "Single Day"
          ? (() => {
              const { start, end } = getDayRange(input.singleDate);
              return {
                clinicsAttended: { some: { clinic: { date: { gte: start, lte: end } } } },
              };
            })()
          : { clinicsAttended: { some: { clinic: { date: { gte: input.startDate, lte: input.endDate } } } } };

      const data = await ctx.db.pet.findMany({
        where: {
          AND: [clinicQuery],
        },
        //orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { petID: input.cursor } : undefined,
        include: {
          owner: {
            select: {
              firstName: true,
              surname: true,
              mobile: true,
              addressGreaterArea: { select: { greaterArea: true } },
              addressArea: { select: { area: true } },
              addressStreet: { select: { street: true } },
              addressStreetCode: true,
              addressStreetNumber: true,
            },
          },
          clinicsAttended: {
            select: {
              clinic: {
                select: {
                  date: true,
                },
              },
            },
          },
        },
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (data.length > input.limit) {
        const nextRow = data.pop();
        newNextCursor = nextRow?.petID;
      }

      return {
        data: data,
        nextCursor: newNextCursor,
      };
    }),

  //treatment queries
  getTreatmentInfinite: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().default(0),
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        singleDate: z.date(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Helper function to calculate the start and end of a given date
      const getDayRange = (dateString: Date) => {
        //const date = new Date(dateString);
        const startOfDay = new Date(dateString);
        startOfDay.setHours(0, 0, 0, 0); // Midnight (start of the day)

        const endOfDay = new Date(dateString);
        endOfDay.setHours(23, 59, 59, 999); // Last millisecond of the day

        return { start: startOfDay, end: endOfDay };
      };

      // Generate the treatment query based on the type of query
      const treatmentQuery =
        input.typeOfQuery === "Single Day"
          ? (() => {
              const { start, end } = getDayRange(input.singleDate);
              return {
                petTreatments: { some: { date: { gte: start, lte: end } } },
              };
            })()
          : {
              petTreatments: {
                some: { date: { gte: new Date(input.startDate), lte: new Date(input.endDate) } },
              },
            };

      //   //check what type of query it is and then decide what object will be in the where clause
      //   const treatmentQuery =
      //     input.typeOfQuery == "Single Day"
      //       ? { petTreatments: { some: { date: input.singleDate } } }
      //       : { petTreatments: { some: { date: { gte: input.startDate, lte: input.endDate } } } };

      const data = await ctx.db.pet.findMany({
        where: {
          AND: [treatmentQuery],
        },
        //orderBy: order,
        take: input.limit + 1,
        cursor: input.cursor ? { petID: input.cursor } : undefined,
        include: {
          owner: {
            select: {
              firstName: true,
              surname: true,
              mobile: true,
              addressGreaterArea: { select: { greaterArea: true } },
              addressArea: { select: { area: true } },
              addressStreet: { select: { street: true } },
              addressStreetCode: true,
              addressStreetNumber: true,
            },
          },
          clinicsAttended: {
            select: {
              clinic: {
                select: {
                  date: true,
                },
              },
            },
          },
          petTreatments: {
            select: {
              category: true,
              type: {
                select: {
                  type: true,
                },
              },
              date: true,
              comments: true,
            },
          },
        },
      });

      let newNextCursor: typeof input.cursor | undefined = undefined;
      if (data.length > input.limit) {
        const nextRow = data.pop();
        newNextCursor = nextRow?.petID;
      }

      return {
        data: data,
        nextCursor: newNextCursor,
      };
    }),

  //Downloads
  //sterilisation downloads
  downloadSterilisation: protectedProcedure
    .input(
      z.object({
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        species: z.string(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //check what type of query it is and then decide what object will be in the where clause
      const sterilisationQuery =
        input.typeOfQuery === "Requested"
          ? { sterilisedRequested: { gte: input.startDate, lte: input.endDate } }
          : input.typeOfQuery === "Actioned"
            ? { sterilisationOutcome: { equals: "Actioned" }, sterilisationOutcomeDate: { gte: input.startDate, lte: input.endDate } }
            : input.typeOfQuery === "No Show"
              ? { sterilisationOutcome: { equals: "No show" }, sterilisationOutcomeDate: { gte: input.startDate, lte: input.endDate } }
              : {};

      const rawData = await ctx.db.pet.findMany({
        where: {
          AND: [sterilisationQuery, { species: input.species }],
        },
        //orderBy: order,
        select: {
          petName: true,
          species: true,
          sex: true,
          age: true,
          breed: true,
          colour: true,
          size: true,
          sterilisedRequested: true,
          sterilisedRequestSigned: true,
          vaccinationShot1: true,
          vaccinationShot2: true,
          vaccinationShot3: true,
          owner: {
            select: {
              firstName: true,
              surname: true,
              mobile: true,
              addressGreaterArea: { select: { greaterArea: true } },
              addressArea: { select: { area: true } },
              addressStreet: { select: { street: true } },
              addressStreetCode: true,
              addressStreetNumber: true,
            },
          },
        },
      });

      // Programmatically flatten the data into a more accessible structure
      const data = rawData.map((pet) => ({
        ownerFirstName: pet.owner?.firstName ?? "",
        ownerSurname: pet.owner?.surname ?? "",
        greaterArea: pet.owner?.addressGreaterArea?.greaterArea ?? "",
        area: pet.owner?.addressArea?.area ?? "",
        street: pet.owner?.addressStreet?.street ?? "",
        streetCode: pet.owner?.addressStreetCode ?? "",
        streetNumber: pet.owner?.addressStreetNumber ?? "",
        ownerMobile: pet.owner?.mobile ?? "",
        petName: pet.petName,
        species: pet.species,
        sex: pet.sex,
        age: pet.age,
        breed: pet.breed.join(", "),
        colour: pet.colour.join(", "),
        size: pet.size,
        sterilisedRequested: pet.sterilisedRequested,
        sterilisedRequestSignedAt: pet.sterilisedRequestSigned,
        vaccinationShot1: pet.vaccinationShot1,
        vaccinationShot2: pet.vaccinationShot2,
        vaccinationShot3: pet.vaccinationShot3,
      }));

      //change data so that there is no nested objects

      //take out the nested owner object
      // const data = await ctx.db.pet.findMany({
      //   where: {
      //     AND: [sterilisationQuery, { species: input.species }],
      //   },
      //   //orderBy: order,
      //   select: {
      //     petID: true,
      //     species: true,
      //
      //
      //   },
      //   include: {

      return {
        data: data,
      };
    }),

  //membership downloads
  downloadMembership: protectedProcedure
    .input(
      z.object({
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        species: z.string(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //check what type of query it is and then decide what object will be in the where clause
      const membershipQuery =
        input.typeOfQuery === "Standard Card Holder"
          ? { membership: { equals: "Standard card holder" }, membershipDate: { gte: input.startDate, lte: input.endDate } }
          : input.typeOfQuery === "Gold Card Holder"
            ? { membership: { equals: "Gold card holder" }, membershipDate: { gte: input.startDate, lte: input.endDate } }
            : {};

      const rawData = await ctx.db.pet.findMany({
        where: {
          AND: [membershipQuery, { species: input.species }],
        },
        //orderBy: order,
        select: {
          petName: true,
          species: true,
          sex: true,
          age: true,
          breed: true,
          colour: true,
          cardStatus: true,
          owner: {
            select: {
              firstName: true,
              surname: true,
              addressGreaterArea: { select: { greaterArea: true } },
              addressArea: { select: { area: true } },
              addressStreet: { select: { street: true } },
              addressStreetCode: true,
              addressStreetNumber: true,
            },
          },
          clinicsAttended: {
            select: {
              clinic: {
                select: {
                  date: true,
                },
              },
            },
          },
        },
      });

      //so that the dates look good on excel
      function formatDateToExcel(date: Date): string {
        return date.toLocaleString("en-UK", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          //hour: "numeric",
          //minute: "numeric",
          //   second: "numeric",
          //hour12: true, // Enables AM/PM formatting
        });
      }

      const data = rawData.map((pet) => ({
        ownerFirstName: pet.owner?.firstName ?? "",
        ownerSurname: pet.owner?.surname ?? "",
        greaterArea: pet.owner?.addressGreaterArea?.greaterArea ?? "",
        area: pet.owner?.addressArea?.area ?? "",
        street: pet.owner?.addressStreet?.street ?? "",
        streetCode: pet.owner?.addressStreetCode ?? "",
        streetNumber: pet.owner?.addressStreetNumber ?? "",
        petName: pet.petName ?? "",
        species: pet.species ?? "",
        sex: pet.sex ?? "",
        age: pet.age ?? "",
        breed: pet.breed.join(", ") ?? "",
        colour: pet.colour.join(", ") ?? "",
        cardStatus: pet.cardStatus ?? "",
        clinicsAttended: pet.clinicsAttended.map((clinic) => formatDateToExcel(new Date(clinic.clinic.date))).join(", ") ?? "",
        totalClinicsAttended: pet.clinicsAttended.length,
      }));

      return {
        data: data,
      };
    }),

  //clinic downloads
  downloadClinic: protectedProcedure
    .input(
      z.object({
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        singleDate: z.date(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Helper function to calculate the start and end of a given date
      const getDayRange = (dateString: Date) => {
        //const date = new Date(dateString);
        const startOfDay = new Date(dateString);
        startOfDay.setHours(0, 0, 0, 0); // Midnight (start of the day)

        const endOfDay = new Date(dateString);
        endOfDay.setHours(23, 59, 59, 999); // Last millisecond of the day

        return { start: startOfDay, end: endOfDay };
      };

      // Generate the treatment query based on the type of query
      const clinicQuery =
        input.typeOfQuery === "Single Day"
          ? (() => {
              const { start, end } = getDayRange(input.singleDate);
              return {
                clinicsAttended: { some: { clinic: { date: { gte: start, lte: end } } } },
              };
            })()
          : { clinicsAttended: { some: { clinic: { date: { gte: input.startDate, lte: input.endDate } } } } };

      const rawData = await ctx.db.pet.findMany({
        where: {
          AND: [clinicQuery],
        },
        //orderBy: order,
        include: {
          owner: {
            select: {
              firstName: true,
              surname: true,
              mobile: true,
              addressGreaterArea: { select: { greaterArea: true } },
              addressArea: { select: { area: true } },
              addressStreet: { select: { street: true } },
              addressStreetCode: true,
              addressStreetNumber: true,
            },
          },
          clinicsAttended: {
            select: {
              clinic: {
                select: {
                  date: true,
                },
              },
            },
          },
        },
      });

      //Checks if card status of membership is lapsed or active
      const membershipStatus = (membershipType: string, clinicsAttended: Date[]): string => {
        if (membershipType === "Standard card holder" || membershipType === "Gold card holder") {
          const currentDate = new Date();

          // // Convert clinicList dates to Date objects
          // const clinicDates = clinicsAttended.map((clinicDate) => {
          //   const [day, month, year] = clinicDate.clinic.date.split("/").map(Number);
          //   return new Date(year ?? 0, (month ?? 0) - 1, day);
          // });

          // Filter clinics within the last 'time' months
          const filteredClinicsLapsedMember = clinicsAttended.filter((clinicDate) => {
            const pastDate = new Date(currentDate);
            pastDate.setMonth(currentDate.getMonth() - 3);
            return clinicDate >= pastDate;
          });

          const filteredClinicsActiveMember = clinicsAttended.filter((clinicDate) => {
            const pastDate = new Date(currentDate);
            pastDate.setMonth(currentDate.getMonth() - 6);
            return clinicDate >= pastDate;
          });

          if (filteredClinicsLapsedMember.length < 1) {
            //setCardStatusOption("Lapsed card holder");
            return "Lapsed";
          } else if (filteredClinicsActiveMember.length >= 3) {
            return "Active";
          } else {
            return "Not Applicable";
          }
        } else {
          return "Not Applicable";
        }
      };

      //so that the dates look good on excel
      function formatDateToExcel(date: Date): string {
        return date.toLocaleString("en-UK", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          //hour: "numeric",
          //minute: "numeric",
          //   second: "numeric",
          //hour12: true, // Enables AM/PM formatting
        });
      }

      const data = rawData.map((pet) => ({
        ownerFirstName: pet.owner?.firstName ?? "",
        ownerSurname: pet.owner?.surname ?? "",
        greaterArea: pet.owner?.addressGreaterArea?.greaterArea ?? "",
        area: pet.owner?.addressArea?.area ?? "",
        street: pet.owner?.addressStreet?.street ?? "",
        streetCode: pet.owner?.addressStreetCode ?? "",
        streetNumber: pet.owner?.addressStreetNumber ?? "",
        ownerMobile: pet.owner?.mobile ?? "",
        petName: pet.petName ?? "",
        species: pet.species ?? "",
        sex: pet.sex ?? "",
        age: pet.age ?? "",
        breed: pet.breed.join(", ") ?? "",
        colour: pet.colour.join(", ") ?? "",
        size: pet.size ?? "",
        sterilised: pet.sterilisedStatus.getFullYear() != 1970 ? "Yes" : "No",
        sterilisedDate: pet.sterilisedStatus.getFullYear() != 1970 ? pet.sterilisedStatus : "",
        membership: pet.membership ?? "",
        membershipStatus: membershipStatus(
          pet.membership,
          pet.clinicsAttended.map((clinic) => new Date(clinic.clinic.date)),
        ),
        cardStatus: pet.cardStatus ?? "",
        clinicsAttended: pet.clinicsAttended.map((clinic) => formatDateToExcel(new Date(clinic.clinic.date))).join(", ") ?? "",
        totalClinicsAttended: pet.clinicsAttended.length,
        lastDeworming: formatDateToExcel(new Date(pet?.lastDeworming ?? "")) ?? "",
      }));

      return {
        data: data,
      };
    }),

  //treatment downloads
  //clinic downloads
  downloadTreatment: protectedProcedure
    .input(
      z.object({
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        singleDate: z.date(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Helper function to calculate the start and end of a given date
      const getDayRange = (dateString: Date) => {
        //const date = new Date(dateString);
        const startOfDay = new Date(dateString);
        startOfDay.setHours(0, 0, 0, 0); // Midnight (start of the day)

        const endOfDay = new Date(dateString);
        endOfDay.setHours(23, 59, 59, 999); // Last millisecond of the day

        return { start: startOfDay, end: endOfDay };
      };

      // Generate the treatment query based on the type of query
      const treatmentQuery =
        input.typeOfQuery === "Single Day"
          ? (() => {
              const { start, end } = getDayRange(input.singleDate);
              return {
                petTreatments: { some: { date: { gte: start, lte: end } } },
              };
            })()
          : { petTreatments: { some: { date: { gte: input.startDate, lte: input.endDate } } } };

      const rawData = await ctx.db.pet.findMany({
        where: {
          AND: [treatmentQuery],
        },
        //orderBy: order,
        include: {
          owner: {
            select: {
              firstName: true,
              surname: true,
              mobile: true,
              addressGreaterArea: { select: { greaterArea: true } },
              addressArea: { select: { area: true } },
              addressStreet: { select: { street: true } },
              addressStreetCode: true,
              addressStreetNumber: true,
            },
          },
          clinicsAttended: {
            select: {
              clinic: {
                select: {
                  date: true,
                },
              },
            },
          },
          petTreatments: {
            select: {
              category: true,
              type: {
                select: {
                  type: true,
                },
              },
              date: true,
              comments: true,
            },
          },
        },
      });

      //Checks if card status of membership is lapsed or active
      const membershipStatus = (membershipType: string, clinicsAttended: Date[]): string => {
        if (membershipType === "Standard card holder" || membershipType === "Gold card holder") {
          const currentDate = new Date();

          // // Convert clinicList dates to Date objects
          // const clinicDates = clinicsAttended.map((clinicDate) => {
          //   const [day, month, year] = clinicDate.clinic.date.split("/").map(Number);
          //   return new Date(year ?? 0, (month ?? 0) - 1, day);
          // });

          // Filter clinics within the last 'time' months
          const filteredClinicsLapsedMember = clinicsAttended.filter((clinicDate) => {
            const pastDate = new Date(currentDate);
            pastDate.setMonth(currentDate.getMonth() - 3);
            return clinicDate >= pastDate;
          });

          const filteredClinicsActiveMember = clinicsAttended.filter((clinicDate) => {
            const pastDate = new Date(currentDate);
            pastDate.setMonth(currentDate.getMonth() - 6);
            return clinicDate >= pastDate;
          });

          if (filteredClinicsLapsedMember.length < 1) {
            //setCardStatusOption("Lapsed card holder");
            return "Lapsed";
          } else if (filteredClinicsActiveMember.length >= 3) {
            return "Active";
          } else {
            return "Not Applicable";
          }
        } else {
          return "Not Applicable";
        }
      };

      //so that the dates look good on excel
      function formatDateToExcel(date: Date): string {
        return date.toLocaleString("en-UK", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          //hour: "numeric",
          //minute: "numeric",
          //   second: "numeric",
          //hour12: true, // Enables AM/PM formatting
        });
      }

      const data = rawData.map((pet) => ({
        ownerFirstName: pet.owner?.firstName ?? "",
        ownerSurname: pet.owner?.surname ?? "",
        greaterArea: pet.owner?.addressGreaterArea?.greaterArea ?? "",
        area: pet.owner?.addressArea?.area ?? "",
        street: pet.owner?.addressStreet?.street ?? "",
        streetCode: pet.owner?.addressStreetCode ?? "",
        streetNumber: pet.owner?.addressStreetNumber ?? "",
        ownerMobile: pet.owner?.mobile ?? "",
        petName: pet.petName ?? "",
        species: pet.species ?? "",
        sex: pet.sex ?? "",
        age: pet.age ?? "",
        breed: pet.breed.join(", ") ?? "",
        colour: pet.colour.join(", ") ?? "",
        size: pet.size ?? "",
        sterilised: pet.sterilisedStatus.getFullYear() != 1970 ? "Yes" : "No",
        sterilisedDate: pet.sterilisedStatus.getFullYear() != 1970 ? pet.sterilisedStatus : "",
        membership: pet.membership ?? "",
        membershipStatus: membershipStatus(
          pet.membership,
          pet.clinicsAttended.map((clinic) => new Date(clinic.clinic.date)),
        ),
        cardStatus: pet.cardStatus ?? "",
        clinicsAttended: pet.clinicsAttended.map((clinic) => formatDateToExcel(new Date(clinic.clinic.date))).join(", ") ?? "",
        totalClinicsAttended: pet.clinicsAttended.length,
        lastDeworming: formatDateToExcel(new Date(pet?.lastDeworming ?? "")) ?? "",
        treatmentDate: pet.petTreatments.map((treatment) => formatDateToExcel(new Date(treatment.date))).join(", ") ?? "",
        treatmentCategory: pet.petTreatments.map((treatment) => treatment.category).join(". ") ?? "",
        treatmentType: pet.petTreatments.map((treatment) => treatment.type.map((type) => type.type.type).join(", ")).join(". ") ?? "",
        treatmentComments: pet.petTreatments.map((treatment) => treatment.comments).join(". ") ?? "",
      }));

      return {
        data: data,
      };
    }),
});
