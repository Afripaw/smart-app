import { postRouter } from "~/server/api/routers/post";
import { petRouter } from "~/server/api/routers/pet";
import { petOwnerRouter } from "~/server/api/routers/petOwner";
import { petClinicRouter } from "~/server/api/routers/petClinic";
import { petTreatmentRouter } from "~/server/api/routers/petTreatment";
import { UserRouter } from "./routers/user";
import { volunteerRouter } from "./routers/volunteer";
import { communicationRouter } from "./routers/communication";
import { welcomePageRouter } from "./routers/welcomePage";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  pet: petRouter,
  petOwner: petOwnerRouter,
  petClinic: petClinicRouter,
  petTreatment: petTreatmentRouter,
  user: UserRouter,
  volunteer: volunteerRouter,
  communication: communicationRouter,
  welcomePage: welcomePageRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
