import { getServerAuthSession } from "~/server/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";
import { db } from "./db";
import { z } from "zod";

const f = createUploadthing();

export const fileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .input(z.object({ userId: z.string().min(1) }))
    .middleware(async ({ req, res, input }) => {
      const session = await getServerAuthSession({ req, res });
      if (!session) throw new Error("Unauthorized");

      return { userId: input.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);

      await db.user.update({
        where: {
          id: metadata.userId,
        },
        data: {
          image: file.url,
        },
      });

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof fileRouter;
