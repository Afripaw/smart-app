import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { env } from "~/env";
import { db } from "~/server/db";

import CredentialsProvider from "next-auth/providers/credentials";
//import bcrypt from "bcrypt";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;

      // ...other properties
      // role: UserRole;
    };
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
    async redirect() {
      return "/dashboard"; // Redirect to dashboard after sign-in
    },
  },
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Add logic here to look up the user from the credentials supplied
        // You can also use the `redirect` function to redirect the user to a URL to retrieve their credentials
        // You can use either use a RegEx to test the redirect URL against, or simply check if the redirect URL starts with a known value
        // if (regex.test(redirectUrl)) { return redirectUrl }
        // if (redirectUrl.startsWith("/")) { return redirectUrl }
        // return Promise.resolve(null)
        // const user = await db.user.findFirst({
        //   where: {
        //     email: credentials.username,
        //   },
        // });
        // if (user && bcrypt.compareSync(credentials.password, user.password)) {
        //   return user;
        // }
        // return null;
        //   const user = await db.user.findFirst({
        //     where: {
        //       email: credentials?.username,
        //     },
        //   });
        //   if (user) {
        //     return user;
        //   }
        //   return null;
        // },
        // Here you would fetch user from your database
        const user = await db.user.findUnique({
          where: { email: credentials?.username },
        });

        // Verify the password
        //if (user && bcrypt.compareSync(credentials?.password, user.password)) {
        if (user && credentials?.password === user.password) {
          return { id: user.id, name: user.name, email: user.email };
        }

        // Return null if user data is not valid
        return null;
      },
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
