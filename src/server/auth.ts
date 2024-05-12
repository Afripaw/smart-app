import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import { getServerSession, type DefaultSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { env } from "~/env";
import { db } from "~/server/db";

//user details
import { User } from "@prisma/client";
import { api } from "~/utils/api";

import CredentialsProvider from "next-auth/providers/credentials";
import { hash } from "~/utils/security";
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
      role: string;
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
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          //role: token.role,
        },
      };
    },

    // async jwt({ token, account, user }) {
    //   if (account && user) {
    //     // fetch user role
    //     //const userData = api.user.getUserData.useQuery({ id: user.id });
    //     //token.role = userData.data?.role; // Save the role into the JWT

    //     token.id = user.id;
    //     token.role = user.role;
    //   }
    //   return token;
    // },

    /* async redirect({ }) {
      return "/dashboard"; // Redirect to dashboard after sign-in
    }, */
  },
  pages: {
    signIn: "/",
  },
  adapter: PrismaAdapter(db),
  providers: [
    /*   GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }), */
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: {
          label: "Username / User ID",
          type: "text",
          placeholder: "jsmith",
        },
        // role: {
        //   label: "Role",
        //   type: "text",
        //   placeholder: "System Administrator",
        // },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        // 1. Check user credentials
        const users = await db.user.findMany({
          where: {
            OR: [
              {
                email: credentials.username,
              },
              {
                userID: parseInt(credentials.username) || -1,
              },
            ],
          },
        });

        // 2. Check Data
        if (users.length > 1) {
          console.error("Multiple users found for credentials:", credentials);
          return null;
        }

        if (users.length === 0) {
          console.error("No users found for credentials:", credentials);
          return null;
        }

        const user = users[0]!;

        // 3. Check password
        if (hash(credentials.password) !== user.password) {
          console.error("Password does not match for credentials:", credentials);
          return null;
        }
        // credentials.role = user.role;

        console.log("User logged in with credentials:", credentials, user);

        // 4. Return user
        return user;
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
  session: {
    strategy: "jwt",
  },
};

// //fetch user details
// async function fetchUserDetails() {
//   // Fetch from your database
//   const userData = await api.user.getUserDetails();
//   return userData; // Assuming userData contains a 'role' property
// }

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: { req: GetServerSidePropsContext["req"]; res: GetServerSidePropsContext["res"] }) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
