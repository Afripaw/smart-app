import { getServerAuthSession } from "~/server/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";
import { db } from "./db";
import { z } from "zod";

const f = createUploadthing();

export const fileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .input(z.object({ userId: z.string().min(1), user: z.string().min(1) }))
    .middleware(async ({ req, res, input }) => {
      const session = await getServerAuthSession({ req, res });
      if (!session) throw new Error("Unauthorized");

      return { userId: input.userId, user: input.user };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);

      if (metadata.user === "user") {
        await db.user.update({
          where: {
            id: metadata.userId,
          },
          data: {
            image: file.url,
          },
        });
      } else if (metadata.user === "volunteer") {
        await db.volunteer.update({
          where: {
            volunteerID: Number(metadata.userId),
          },
          data: {
            image: file.url,
          },
        });
      } else if (metadata.user === "owner") {
        await db.petOwner.update({
          where: {
            ownerID: Number(metadata.userId),
          },
          data: {
            image: file.url,
          },
        });
      } else if (metadata.user === "pet") {
        await db.pet.update({
          where: {
            petID: Number(metadata.userId),
          },
          data: {
            image: file.url,
          },
        });
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof fileRouter;
