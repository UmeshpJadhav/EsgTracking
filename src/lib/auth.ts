import type { NextAuthConfig, Session, User, Account, Profile } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  }
}

// Create a custom adapter with proper typing
const adapter = PrismaAdapter(prisma);

// Main auth configuration
export const authConfig: NextAuthConfig = {
  adapter: {
    ...adapter,
    // Custom createUser implementation to handle OAuth users
    async createUser(user) {
      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        // If user exists, update their record with OAuth info
        return prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: user.name || existingUser.name,
            email: user.email,
            emailVerified: user.emailVerified || existingUser.emailVerified,
            image: user.image || existingUser.image,
          },
        });
      }

      // If user doesn't exist, create a new one
      return prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          passwordHash: null, // OAuth users won't have a password
        },
      });
    },
  } as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Allow login if user exists (even if they signed up with OAuth)
        if (!user) {
          return null;
        }

        // If user has a password, verify it
        if (user.passwordHash) {
          const isValid = await compare(credentials.password, user.passwordHash);
          if (!isValid) {
            return null;
          }
        } else {
          // If user doesn't have a password, they must sign in with OAuth
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Allow OAuth and credentials sign in
      return true;
    },
    session: ({ session, token }) => {
      if (token) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub,
          },
        };
      }
      return session;
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  events: {
    async linkAccount({ user, account, profile }) {
      // This event is triggered when an account is linked
      console.log('Account linked:', { userId: user.id, provider: account.provider });
    },
    signIn: (message) => {
      console.log('User signed in:', message.user?.email);
    },
    signOut: (message) => {
      console.log('User signed out:', message.session?.user?.email);
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};

export default authConfig;
