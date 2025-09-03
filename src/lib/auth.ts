import type { NextAuthConfig, Session, User, Account, Profile } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";
import type { JWT } from "next-auth/jwt";

// Create a custom adapter with proper typing
const adapter = PrismaAdapter(prisma);

// Main auth configuration
export const authConfig: NextAuthConfig = {
  adapter: {
    ...adapter,
    // Custom createUser implementation to handle OAuth users
    async createUser(user: {
      name?: string | null;
      email: string;
      image?: string | null;
      emailVerified?: Date | null;
    }) {
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
          name: user.name || user.email.split('@')[0] || 'User', // Fallback to email prefix or 'User' if name is not provided
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
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials?: Partial<Record<string, unknown>>, req?: Request) {
        // Type guard to ensure credentials exist and have required fields
        if (!credentials || 
            typeof credentials.email !== 'string' || 
            typeof credentials.password !== 'string') {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { 
            email: credentials.email
          },
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
          name: user.name || '',
          image: user.image || null,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Allow OAuth and credentials sign in
      return true;
    },
    session: ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  events: {
    async linkAccount(message: { user: User | AdapterUser; account: Account; profile: User | AdapterUser }) {
      console.log('Account linked:', { 
        userId: message.user.id, 
        provider: message.account.provider 
      });
    },
    signIn: (message: { user: User; account?: Account | null; profile?: Profile; isNewUser?: boolean }) => {
      console.log('User signed in:', message.user?.email);
      if (message.account) {
        console.log('Provider:', message.account.provider);
      }
    },
    signOut: () => {
      console.log('User signed out');
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};

export default authConfig;
