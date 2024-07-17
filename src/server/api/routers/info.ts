import { z } from "zod";

import { Prisma } from "@prisma/client";

import { createTRPCRouter, protectedProcedure, publicProcedure, accessProcedure } from "~/server/api/trpc";
import Owner from "~/pages/owner";
import { getYear } from "date-fns";
import { equal } from "assert";

export const infoRouter = createTRPCRouter({
  //Database report queries
  //sterilisation queries
  getSterilisationInfinite: accessProcedure(["System Administrator", "Data Analyst", "Data Consumer"])
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().default(0),
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        species: z.string().array(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //check what type of query it is and then decide what object will be in the where clause
      const sterilisationQuery =
        input.typeOfQuery === "Requested"
          ? { sterilisedRequested: { gte: input.startDate, lte: input.endDate } }
          : input.typeOfQuery === "Actioned"
            ? {
                // sterilisationOutcome: { equals: "Actioned" },
                sterilisedStatus: { gte: input.startDate, lte: input.endDate },
              }
            : input.typeOfQuery === "No Show"
              ? { sterilisationOutcome: { equals: "No Show" }, sterilisationOutcomeDate: { gte: input.startDate, lte: input.endDate } }
              : {};

      // const sterilisationQuery =
      //   input.typeOfQuery === "Requested"
      //     ? { sterilisedRequested: { gte: input.startDate, lte: input.endDate } }
      //     : input.typeOfQuery === "Actioned"
      //       ? { sterilisedStatus: { gte: input.startDate, lte: input.endDate, gt: new Date("1970-12-31T23:59:59.999Z") } }
      //       : input.typeOfQuery === "No Show"
      //         ? { sterilisationOutcome: { equals: "No Show" }, sterilisationOutcomeDate: { gte: input.startDate, lte: input.endDate } }
      //         : {};

      const data = await ctx.db.pet.findMany({
        where: {
          AND: [sterilisationQuery, { species: { in: input.species } }],
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
  getMembershipInfinite: accessProcedure(["System Administrator", "Data Analyst", "Data Consumer"])
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().default(0),
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        species: z.string().array(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //check what type of query it is and then decide what object will be in the where clause
      const membershipQuery =
        input.typeOfQuery === "Standard Card Holder"
          ? { membership: { equals: "Standard Card Holder" }, membershipDate: { gte: input.startDate, lte: input.endDate } }
          : input.typeOfQuery === "Gold Card Holder"
            ? { membership: { equals: "Gold Card Holder" }, membershipDate: { gte: input.startDate, lte: input.endDate } }
            : {};

      const data = await ctx.db.pet.findMany({
        where: {
          AND: [membershipQuery, { species: { in: input.species } }],
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
              mobile: true,
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
  getClinicInfinite: accessProcedure(["System Administrator", "Data Analyst", "Data Consumer"])
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
  getTreatmentInfinite: accessProcedure(["System Administrator", "Data Analyst", "Data Consumer"])
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
  downloadSterilisation: accessProcedure(["System Administrator", "Data Analyst", "Data Consumer"])
    .input(
      z.object({
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        species: z.string().array(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //check what type of query it is and then decide what object will be in the where clause
      const sterilisationQuery =
        input.typeOfQuery === "Requested"
          ? { sterilisedRequested: { gte: input.startDate, lte: input.endDate } }
          : input.typeOfQuery === "Actioned"
            ? {
                // sterilisationOutcome: { equals: "Actioned" },
                sterilisedStatus: { gte: input.startDate, lte: input.endDate },
              }
            : input.typeOfQuery === "No Show"
              ? { sterilisationOutcome: { equals: "No Show" }, sterilisationOutcomeDate: { gte: input.startDate, lte: input.endDate } }
              : {};

      const rawData = await ctx.db.pet.findMany({
        where: {
          AND: [sterilisationQuery, { species: { in: input.species } }],
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
          vaccination1Type: true,
          vaccination2Type: true,
          vaccination3Type: true,
          lastDeworming: true,
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
        "Owner First name": pet.owner?.firstName ?? "",
        "Owner Surname": pet.owner?.surname ?? "",
        "Greater Area": pet.owner?.addressGreaterArea?.greaterArea ?? "",
        Area: pet.owner?.addressArea?.area ?? "",
        Street: pet.owner?.addressStreet?.street ?? "",
        "Street Code": pet.owner?.addressStreetCode ?? "",
        "Street Number": pet.owner.addressStreetNumber == 0 || pet.owner.addressStreetNumber == null ? "" : pet.owner.addressStreetNumber,
        "Owner Mobile Number": pet.owner?.mobile ?? "",
        "Pet Name": pet.petName,
        Species: pet.species,
        Sex: pet.sex,
        Age: pet.age,
        Breed: pet.breed.join(", "),
        Colour: pet.colour.join(", "),
        Size: pet.size,
        "Sterilisation Requested": pet.sterilisedRequested?.getFullYear() != 1970 ? pet.sterilisedRequested : "",
        "Sterilisation Request Signed At": pet.sterilisedRequestSigned,
        "Last Deworming Date": pet.lastDeworming,
        "Last Deworming Due": Number(pet?.lastDeworming) < Number(new Date().setMonth(new Date().getMonth() - (pet?.species == "Cat" ? 3 : 6))) ? "Yes" : "No",
        "Vaccination Shot 1":
          pet.vaccinationShot1.getFullYear() == 1970 ? "Not yet" : pet.vaccinationShot1.getFullYear() == 1971 ? "Unknown" : pet.vaccinationShot1,
        "Vaccination Shot 1 Type": pet.vaccination1Type,
        "Vaccination Shot 2":
          pet.vaccinationShot2?.getFullYear() == 1970 ? "Not yet" : pet.vaccinationShot2?.getFullYear() == 1971 ? "Unknown" : pet.vaccinationShot2,
        "Vaccination Shot 2 Type": pet.vaccination2Type,
        "Vaccination Shot 3":
          pet.vaccinationShot3?.getFullYear() == 1970 ? "Not yet" : pet.vaccinationShot3?.getFullYear() == 1971 ? "Unknown" : pet.vaccinationShot3,
        "Vaccination Shot 3 Type": pet.vaccination3Type,
      }));

      return {
        data: data,
      };
    }),

  //membership downloads
  downloadMembership: accessProcedure(["System Administrator", "Data Analyst", "Data Consumer"])
    .input(
      z.object({
        typeOfQuery: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        species: z.string().array(),
        //order: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //check what type of query it is and then decide what object will be in the where clause
      const membershipQuery =
        input.typeOfQuery === "Standard Card Holder"
          ? { membership: { equals: "Standard Card Holder" }, membershipDate: { gte: input.startDate, lte: input.endDate } }
          : input.typeOfQuery === "Gold Card Holder"
            ? { membership: { equals: "Gold Card Holder" }, membershipDate: { gte: input.startDate, lte: input.endDate } }
            : {};

      const rawData = await ctx.db.pet.findMany({
        where: {
          AND: [membershipQuery, { species: { in: input.species } }],
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
          status: true,
          membership: true,
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

      //Checks if card status of membership is lapsed or active
      const membershipStatus = (membershipType: string, clinicsAttended: Date[]): string => {
        if (
          membershipType === "Standard Card Holder" ||
          membershipType === "Standard card holder" ||
          membershipType === "Gold Card Holder" ||
          membershipType === "Gold card holder"
        ) {
          const today = new Date();
          // Convert clinicList dates to Date objects
          // const clinicDates = clinicsAttended.map((clinicDate) => {
          //   const [day, month, year] = clinicDate.split("/").map(Number);
          //   return new Date(year ?? 0, (month ?? 0) - 1, day);
          // });
          const clinicDates = clinicsAttended;

          // Sort clinic dates in ascending order
          clinicDates.sort((a, b) => a.getTime() - b.getTime());

          let isLapsed = false;
          let lapseDate = new Date(0);

          // Check for gaps of 3 months or more
          for (let i = 1; i < clinicDates.length; i++) {
            const prevDate = clinicDates[i - 1];
            const currentDate = clinicDates[i];
            // console.log("Prev date: ", prevDate);
            // console.log("Current date: ", currentDate);
            const pastDate = new Date(prevDate!);
            pastDate.setMonth((prevDate?.getMonth() ?? 0) + 3);

            const today_ = new Date(today);
            today_.setMonth(today.getMonth() - 3);
            //console.log("clinicDates[0]: ", clinicDates[0]);
            //console.log("today_", today_);
            const today__ = today_.getTime();
            const latestClinicDate = clinicDates[clinicDates.length - 1]?.getTime() ?? 0;

            if (today__ >= latestClinicDate) {
              //console.log("lapsed by today");
              isLapsed = true;
              lapseDate = today;
              // break;
            }

            if (currentDate! >= pastDate) {
              //console.log("lapsed by: ", currentDate);
              isLapsed = true;
              lapseDate = currentDate ?? new Date(0);
              // break;
            }

            if (isLapsed && lapseDate.getFullYear() != 1970) {
              const sixMonthsAfterLapse = new Date(lapseDate);
              sixMonthsAfterLapse.setMonth(lapseDate.getMonth() + 6);

              //console.log("Lapsed date: ", lapseDate);
              //console.log("Six months after lapse: ", sixMonthsAfterLapse);

              const clinicsInNextSixMonths = clinicDates.filter((date) => date > lapseDate && date <= sixMonthsAfterLapse);

              //console.log("Clinics in next sixe months: ", clinicsInNextSixMonths.length);

              if (clinicsInNextSixMonths.length >= 3) {
                isLapsed = false;
              } else {
                isLapsed = true;
              }
            } else {
              isLapsed = false;
            }
          }

          return isLapsed ? "Lapsed" : "Active";
        } else {
          return "Not Applicable";
        }
      };

      const data = rawData.map((pet) => ({
        "Owner First Name": pet.owner?.firstName ?? "",
        "Owner Surname": pet.owner?.surname ?? "",
        "Owner Mobile Number": pet.owner?.mobile ?? "",
        "Greater Area": pet.owner?.addressGreaterArea?.greaterArea ?? "",
        Area: pet.owner?.addressArea?.area ?? "",
        Street: pet.owner?.addressStreet?.street ?? "",
        "Street Code": pet.owner?.addressStreetCode ?? "",
        "Street Number": pet.owner.addressStreetNumber == 0 || pet.owner.addressStreetNumber == null ? "" : pet.owner.addressStreetNumber,
        "Pet Name": pet.petName ?? "",
        "Pet Status": pet.status ?? "",
        "Membership Status": membershipStatus(
          pet.membership,
          pet.clinicsAttended.map((clinic) => new Date(clinic.clinic.date)),
        ),
        Species: pet.species ?? "",
        Sex: pet.sex ?? "",
        Age: pet.age ?? "",
        Breed: pet.breed.join(", ") ?? "",
        Colour: pet.colour.join(", ") ?? "",
        "Card Status": pet.cardStatus ?? "",
        "Clinics Attended":
          pet.clinicsAttended
            .sort((a, b) => a.clinic.date.getTime() - b.clinic.date.getTime())
            .map((clinic) => formatDateToExcel(new Date(clinic.clinic.date)))
            .join(", ") ?? "",
        "Total Clinics Attended": pet.clinicsAttended.length,
      }));

      return {
        data: data,
      };
    }),

  //clinic downloads
  downloadClinic: accessProcedure(["System Administrator", "Data Analyst", "Data Consumer"])
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
        if (
          membershipType === "Standard Card Holder" ||
          membershipType === "Standard card holder" ||
          membershipType === "Gold Card Holder" ||
          membershipType === "Gold card holder"
        ) {
          const today = new Date();
          // Convert clinicList dates to Date objects
          // const clinicDates = clinicsAttended.map((clinicDate) => {
          //   const [day, month, year] = clinicDate.split("/").map(Number);
          //   return new Date(year ?? 0, (month ?? 0) - 1, day);
          // });
          const clinicDates = clinicsAttended;

          // Sort clinic dates in ascending order
          clinicDates.sort((a, b) => a.getTime() - b.getTime());

          let isLapsed = false;
          let lapseDate = new Date(0);

          // Check for gaps of 3 months or more
          for (let i = 1; i < clinicDates.length; i++) {
            const prevDate = clinicDates[i - 1];
            const currentDate = clinicDates[i];
            // console.log("Prev date: ", prevDate);
            // console.log("Current date: ", currentDate);
            const pastDate = new Date(prevDate!);
            pastDate.setMonth((prevDate?.getMonth() ?? 0) + 3);

            const today_ = new Date(today);
            today_.setMonth(today.getMonth() - 3);
            //console.log("clinicDates[0]: ", clinicDates[0]);
            //console.log("today_", today_);
            const today__ = today_.getTime();
            const latestClinicDate = clinicDates[clinicDates.length - 1]?.getTime() ?? 0;

            if (today__ >= latestClinicDate) {
              //console.log("lapsed by today");
              isLapsed = true;
              lapseDate = today;
              // break;
            }

            if (currentDate! >= pastDate) {
              //console.log("lapsed by: ", currentDate);
              isLapsed = true;
              lapseDate = currentDate ?? new Date(0);
              // break;
            }

            if (isLapsed && lapseDate.getFullYear() != 1970) {
              const sixMonthsAfterLapse = new Date(lapseDate);
              sixMonthsAfterLapse.setMonth(lapseDate.getMonth() + 6);

              //console.log("Lapsed date: ", lapseDate);
              //console.log("Six months after lapse: ", sixMonthsAfterLapse);

              const clinicsInNextSixMonths = clinicDates.filter((date) => date > lapseDate && date <= sixMonthsAfterLapse);

              //console.log("Clinics in next sixe months: ", clinicsInNextSixMonths.length);

              if (clinicsInNextSixMonths.length >= 3) {
                isLapsed = false;
              } else {
                isLapsed = true;
              }
            } else {
              isLapsed = false;
            }
          }

          return isLapsed ? "Lapsed" : "Active";
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
        "Owner First Name": pet.owner?.firstName ?? "",
        "Owner Surname": pet.owner?.surname ?? "",
        "Greater Area": pet.owner?.addressGreaterArea?.greaterArea ?? "",
        Area: pet.owner?.addressArea?.area ?? "",
        Street: pet.owner?.addressStreet?.street ?? "",
        "Street Code": pet.owner?.addressStreetCode ?? "",
        "Street Number": pet.owner.addressStreetNumber == 0 || pet.owner.addressStreetNumber == null ? "" : pet.owner.addressStreetNumber,
        "Owner Mobile Number": pet.owner?.mobile ?? "",
        "Pet Name": pet.petName ?? "",
        Species: pet.species ?? "",
        Sex: pet.sex ?? "",
        Age: pet.age ?? "",
        Breed: pet.breed.join(", ") ?? "",
        Colour: pet.colour.join(", ") ?? "",
        Size: pet.size ?? "",
        Sterilised: pet.sterilisedStatus.getFullYear() != 1970 ? "Yes" : "No",
        "Sterilisation Date": pet.sterilisedStatus.getFullYear() != 1970 ? pet.sterilisedStatus : "",
        "Membership Type": pet.membership ?? "",
        "Membership Status": membershipStatus(
          pet.membership,
          pet.clinicsAttended.map((clinic) => new Date(clinic.clinic.date)),
        ),
        "Card Status": pet.cardStatus ?? "",
        "Clinics Attended":
          pet.clinicsAttended
            .sort((a, b) => a.clinic.date.getTime() - b.clinic.date.getTime())
            .map((clinic) => formatDateToExcel(new Date(clinic.clinic.date)))
            .join(", ") ?? "",
        "Total Clinics Attended": pet.clinicsAttended.length,
        "Last Deworming": formatDateToExcel(new Date(pet?.lastDeworming ?? "")) ?? "",
      }));

      return {
        data: data,
      };
    }),

  //treatment downloads
  //clinic downloads
  downloadTreatment: accessProcedure(["System Administrator", "Data Analyst", "Data Consumer"])
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
        if (
          membershipType === "Standard card holder" ||
          membershipType === "Gold card holder" ||
          membershipType === "Standard Card Holder" ||
          membershipType === "Gold Card Holder"
        ) {
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
        "Owner First Name": pet.owner?.firstName ?? "",
        "Owner Surname": pet.owner?.surname ?? "",
        "Greater Area": pet.owner?.addressGreaterArea?.greaterArea ?? "",
        Area: pet.owner?.addressArea?.area ?? "",
        Street: pet.owner?.addressStreet?.street ?? "",
        "Street Code": pet.owner?.addressStreetCode ?? "",
        "Street Number": pet.owner.addressStreetNumber == 0 || pet.owner.addressStreetNumber == null ? "" : pet.owner.addressStreetNumber,
        "Owner Mobile Number": pet.owner?.mobile ?? "",
        "Pet Name": pet.petName ?? "",
        Species: pet.species ?? "",
        Sex: pet.sex ?? "",
        Age: pet.age ?? "",
        Breed: pet.breed.join(", ") ?? "",
        Colour: pet.colour.join(", ") ?? "",
        Size: pet.size ?? "",
        Sterilised: pet.sterilisedStatus.getFullYear() != 1970 ? "Yes" : "No",
        "Sterilisation Date": pet.sterilisedStatus.getFullYear() != 1970 ? pet.sterilisedStatus : "",
        "Membership Type": pet.membership ?? "",
        "Membership Status": membershipStatus(
          pet.membership,
          pet.clinicsAttended.map((clinic) => new Date(clinic.clinic.date)),
        ),
        "Card Status": pet.cardStatus ?? "",
        // clinicsAttended:
        //   pet.clinicsAttended
        //     .sort((a, b) => a.clinic.date.getTime() - b.clinic.date.getTime())
        //     .map((clinic) => formatDateToExcel(new Date(clinic.clinic.date)))
        //     .join(", ") ?? "",
        "Total Clinics Attended": pet.clinicsAttended.length,
        "Last Deworming": formatDateToExcel(new Date(pet?.lastDeworming ?? "")) ?? "",
        "Treatment Dates":
          pet.petTreatments
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map((treatment) => formatDateToExcel(new Date(treatment.date)))
            .join(", ") ?? "",
        "Treatment Category": pet.petTreatments.map((treatment) => treatment.category).join(". ") ?? "",
        "Treatment Type": pet.petTreatments.map((treatment) => treatment.type.map((type) => type.type.type).join(", ")).join(". ") ?? "",
        "Treatment Comments": pet.petTreatments.map((treatment) => treatment.comments).join(". ") ?? "",
      }));

      return {
        data: data,
      };
    }),

  //download whole database
  downloadDatabase: accessProcedure(["System Administrator", "Data Analyst", "Data Consumer"]).query(async ({ ctx }) => {
    //find user raw data
    const rawUserData = await ctx.db.user.findMany({
      include: {
        addressGreaterArea: { select: { greaterArea: { select: { greaterAreaID: true } } } },
      },
    });

    //find volunteer raw data
    const rawVolunteerData = await ctx.db.volunteer.findMany({
      include: {
        addressGreaterArea: { select: { greaterArea: { select: { greaterAreaID: true } } } },
        clinicsAttended: { select: { clinic: { select: { clinicID: true } } } },
      },
    });

    //find pet owner raw data
    const rawPetOwnerData = await ctx.db.petOwner.findMany({
      include: {
        addressGreaterArea: { select: { greaterAreaID: true } },
        addressArea: { select: { areaID: true } },
        addressStreet: { select: { streetID: true } },
        //pets: { select: { petID: true } },
      },
    });

    //find pet raw data
    const rawPetData = await ctx.db.pet.findMany({
      include: {
        clinicsAttended: { select: { clinic: { select: { clinicID: true } } } },
        petTreatments: { select: { treatmentID: true } },
      },
    });

    //find treatment raw data
    const rawTreatmentData = await ctx.db.petTreatment.findMany({
      include: {
        type: {
          select: {
            type: {
              select: {
                type: true,
              },
            },
          },
        },
      },
    });

    // //find type raw data
    // const rawTypeData = await ctx.db.type.findMany();

    //find clinic raw data
    const rawClinicData = await ctx.db.petClinic.findMany({
      include: {
        conditions: { select: { condition: { select: { condition: true } } } },
      },
    });

    // //find conditions raw data
    // const rawConditionsData = await ctx.db.conditions.findMany();

    // find greater area raw data
    const rawGreaterAreaData = await ctx.db.greaterArea.findMany();

    // find area raw data
    const rawAreaData = await ctx.db.area.findMany();

    // find street raw data
    const rawStreetData = await ctx.db.street.findMany();

    // find message raw data
    const rawMessageData = await ctx.db.communication.findMany({
      include: {
        greaterArea: { select: { greaterArea: { select: { greaterAreaID: true } } } },
        area: { select: { area: { select: { areaID: true } } } },
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

    //user
    const userData = rawUserData.map((user) => ({
      "User ID": user.userID,
      "First Name": user.name,
      Surname: user.surname,
      "South African ID": user.southAfricanID,
      Email: user.email,
      "Mobile Number": user.mobile,
      "Preferred Communication": user.preferredCommunication,
      //"Email Verified": user.emailVerified ? formatDateToExcel(user.emailVerified) : null,
      Image: user.image,
      // Password: user.password
      "Address Greater Area": user.addressGreaterArea.map((area) => area.greaterArea.greaterAreaID).join(", "),
      "Address Street": user.addressStreet,
      "Address Street Code": user.addressStreetCode,
      "Address Street Number": user.addressStreetNumber,
      "Address Suburb": user.addressSuburb,
      "Address Postal Code": user.addressPostalCode,
      "Address Free Form": user.addressFreeForm,
      Role: user.role,
      Status: user.status,
      "Starting Date": formatDateToExcel(user.startingDate),
      Comments: user.comments,
    }));

    //volunteer
    const volunteerData = rawVolunteerData.map((volunteer) => ({
      "Volunteer ID": volunteer.volunteerID,
      "First Name": volunteer.firstName,
      Surname: volunteer.surname,
      "South African ID": volunteer.southAfricanID,
      Email: volunteer.email,
      "Mobile Number": volunteer.mobile,
      "Preferred Communication": volunteer.preferredCommunication,
      //"Email Verified": volunteer.emailVerified ? formatDateToExcel(volunteer.emailVerified) : null,
      Image: volunteer.image,
      //"Password": volunteer.password,
      "Address Greater Area": volunteer.addressGreaterArea.map((area) => area.greaterArea.greaterAreaID).join(", "),
      "Address Street": volunteer.addressStreet,
      "Address Street Code": volunteer.addressStreetCode,
      "Address Street Number": volunteer.addressStreetNumber,
      "Address Suburb": volunteer.addressSuburb,
      "Address Postal Code": volunteer.addressPostalCode,
      "Address Free Form": volunteer.addressFreeForm,
      Role: volunteer.role.join(", "),
      CollaboratorOrganisation: volunteer.collaboratorOrg,
      Status: volunteer.status,
      "Clinic IDs Attended": volunteer.clinicsAttended.map((clinic) => clinic.clinic.clinicID).join(", "),
      "Starting Date": formatDateToExcel(volunteer.startingDate),
      Comments: volunteer.comments,
    }));

    //pet owner
    const petOwnerData = rawPetOwnerData.map((petOwner) => ({
      "Pet Owner ID": petOwner.ownerID,
      "First Name": petOwner.firstName,
      Surname: petOwner.surname,
      "South African ID": petOwner.southAfricanID,
      Email: petOwner.email,
      "Mobile Number": petOwner.mobile,
      "Preferred Communication": petOwner.preferredCommunication,
      //"Email Verified": petOwner.emailVerified ? formatDateToExcel(petOwner.emailVerified) : null,
      Image: petOwner.image,
      "Address Greater Area": petOwner.addressGreaterArea.greaterAreaID,
      "Address Area": petOwner.addressArea?.areaID ?? "",
      "Address Street": petOwner.addressStreet?.streetID ?? "",
      "Address Street Code": petOwner.addressStreetCode,
      "Address Street Number": petOwner.addressStreetNumber,
      //"Address Suburb": petOwner.addressSuburb
      "Address Free Form": petOwner.addressFreeForm,
      Status: petOwner.status,
      Comments: petOwner.comments,
      "Starting Date": formatDateToExcel(petOwner.startingDate),
    }));

    //pet
    const petData = rawPetData.map((pet) => ({
      "Pet ID": pet.petID,
      "Pet Name": pet.petName,
      Image: pet.image,
      "Owner ID": pet.ownerID,
      Species: pet.species,
      Sex: pet.sex,
      Age: pet.age,
      Breed: pet.breed.filter((breed) => breed !== "").join(", "),
      Colour: pet.colour.filter((colour) => colour !== "").join(", "),
      Size: pet.size,
      Markings: pet.markings,
      Status: pet.status,
      "Sterilised Status":
        pet.sterilisedStatus.getFullYear() == 1970
          ? "Not yet"
          : pet.sterilisedStatus.getFullYear() == 1971
            ? "Unknown"
            : formatDateToExcel(pet.sterilisedStatus),
      "Sterilised Requested": pet.sterilisedRequested
        ? pet.sterilisedRequested.getFullYear() == 1970
          ? "Not yet"
          : pet.sterilisedRequested.getFullYear() == 1971
            ? "Unknown"
            : formatDateToExcel(pet.sterilisedRequested)
        : null,
      "Sterilised Request Signed": pet.sterilisedRequestSigned,
      "Sterilisation Outcome": pet.sterilisationOutcome,
      "Sterilisation Outcome Date": pet.sterilisationOutcomeDate
        ? pet.sterilisationOutcomeDate.getFullYear() == 1970
          ? "Not yet"
          : pet.sterilisationOutcomeDate.getFullYear() == 1971
            ? "Unknown"
            : formatDateToExcel(pet.sterilisationOutcomeDate)
        : null,
      "Vaccination Shot 1":
        pet.vaccinationShot1.getFullYear() == 1970 ? "Not yet" : pet.vaccinationShot1.getFullYear() == 1971 ? "Unknown" : pet.vaccinationShot1,
      "Vaccination Shot 2": pet.vaccinationShot2
        ? pet.vaccinationShot2.getFullYear() == 1970
          ? "Not yet"
          : pet.vaccinationShot2.getFullYear() == 1971
            ? "Unknown"
            : formatDateToExcel(pet.vaccinationShot2)
        : null,
      "Vaccination Shot 3": pet.vaccinationShot3
        ? pet.vaccinationShot3.getFullYear() == 1970
          ? "Not yet"
          : pet.vaccinationShot3.getFullYear() == 1971
            ? "Unknown"
            : formatDateToExcel(pet.vaccinationShot3)
        : null,
      "Vaccination 1 Type": pet.vaccination1Type.join(","),
      "Vaccination 2 Type": pet.vaccination2Type.join(","),
      "Vaccination 3 Type": pet.vaccination3Type.join(","),
      "Vaccination 1 Paid": pet.vaccination1Paid,
      "Vaccination 2 Paid": pet.vaccination2Paid,
      "Vaccination 3 Paid": pet.vaccination3Paid,
      "Clinic IDs Attended": pet.clinicsAttended.map((clinic) => clinic.clinic.clinicID).join(", "),
      Programme: pet.programme.filter((programme) => programme !== "").join(", "),
      "Last Deworming": pet.lastDeworming ? pet.lastDeworming : null,
      Membership: pet.membership,
      "Membership Date": pet.membershipDate ? (pet.membershipDate.getFullYear() == 1970 ? "Non-card Holder" : formatDateToExcel(pet.membershipDate)) : null,
      "Card Status": pet.cardStatus,
      "Kennel Received": pet.kennelReceived.filter((kennel) => kennel != "").join(", "),
      Comments: pet.comments,
    }));

    //treatment
    const treatmentData = rawTreatmentData.map((treatment) => ({
      "Treatment ID": treatment.treatmentID,
      // Date: formatDateToExcel(treatment.date),
      Date: formatDateToExcel(treatment.date),
      "Pet ID": treatment.petID,
      Category: treatment.category,
      Type: treatment.type.map((type) => type.type.type).join(", "),
      Comments: treatment.comments,
    }));

    // //type
    // const typeData = rawTypeData.map((type) => ({
    //   "Type ID": type.typeID,
    //   Type: type.type,
    //   //Treatment: type.treatment,
    // }));

    //pet clinic
    const clinicData = rawClinicData.map((clinic) => ({
      "Clinic ID": clinic.clinicID,
      // Pet: clinic.pet,
      // Volunteer: clinic.volunteer,
      Date: formatDateToExcel(clinic.date),
      // Date: clinic.date,
      "Greater Area ID": clinic.greaterAreaID,
      //"Area ID": clinic.areaID,
      Conditions: clinic.conditions.map((condition) => condition.condition.condition).join(", "),
      Comments: clinic.comments,
    }));

    // //conditions
    // const conditionsData = rawConditionsData.map((condition) => ({
    //   "Condition ID": condition.conditionID,
    //   Condition: condition.condition,
    //   //Clinic: condition.clinic,
    // }));

    //greaterArea
    const greaterAreaData = rawGreaterAreaData.map((greaterArea) => ({
      "Greater Area ID": greaterArea.greaterAreaID,
      GreaterArea: greaterArea.greaterArea,
    }));

    //area
    const areaData = rawAreaData.map((area) => ({
      "Area ID": area.areaID,
      Area: area.area,
      "Greater Area ID": area.greaterAreaID,
    }));

    //street
    const streetData = rawStreetData.map((street) => ({
      "Street ID": street.streetID,
      Street: street.street,
      "Area ID": street.areaID,
    }));

    //message
    const messageData = rawMessageData.map((communication) => ({
      "Message ID": communication.communicationID,
      //Date: communication.createdAt,
      Date: formatDateToExcel(communication.createdAt),
      Type: communication.type,
      Message: communication.message,
      Recipients: communication.recipients,
      "Greater Area": communication.greaterArea,
      Area: communication.area,
      Success: communication.success,
    }));

    return {
      userData: userData,
      volunteerData: volunteerData,
      petOwnerData: petOwnerData,
      petData: petData,
      treatmentData: treatmentData,
      // typeData: typeData,
      clinicData: clinicData,
      // conditionsData: conditionsData,
      greaterAreaData: greaterAreaData,
      areaData: areaData,
      streetData: streetData,
      messageData: messageData,
    };
  }),
});
