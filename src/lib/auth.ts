import type { NextAuthConfig, User, Account, Profile } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";

// Create a custom adapter type that extends the default Adapter
type CustomPrismaAdapter = Omit<ReturnType<typeof PrismaAdapter>, 'createUser'> & {
  createUser: (user: Omit<AdapterUser, 'id'>) => Promise<AdapterUser>;
};

const adapter = PrismaAdapter(prisma) as CustomPrismaAdapter;

// Main auth configuration
export const authConfig: NextAuthConfig = {
  adapter: {
    ...adapter,
    // Custom createUser implementation to handle OAuth users
    async createUser(user: Omit<AdapterUser, 'id'>) {
      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        // If user exists, update their record with OAuth info
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: user.name || existingUser.name,
            email: user.email,
            emailVerified: user.emailVerified || existingUser.emailVerified,
            image: user.image || existingUser.image,
          },
        });
        
        // Ensure we return an object that matches AdapterUser
        return {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          emailVerified: updatedUser.emailVerified,
          image: updatedUser.image,
        } as AdapterUser;
      }

      // If user doesn't exist, create a new one
      const newUser = await prisma.user.create({
        data: {
          name: user.name || user.email.split('@')[0] || 'User',
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          passwordHash: null, // OAuth users won't have a password
        },
      });

      // Ensure we return an object that matches AdapterUser
      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        emailVerified: newUser.emailVerified,
        image: newUser.image,
      } as AdapterUser;
    },
  },
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
      async authorize(credentials?: Partial<Record<string, unknown>>, _req?: Request) {
        try {
          // Type guard to ensure credentials exist and have required fields
          if (!credentials || 
              typeof credentials.email !== 'string' || 
              typeof credentials.password !== 'string') {
            console.error('Invalid credentials format');
            return null;
          }

          console.log('Attempting to authorize:', credentials.email);
          
          const user = await prisma.user.findUnique({
            where: { 
              email: credentials.email.toLowerCase().trim()
            },
          });

          if (!user) {
            console.error('No user found with email:', credentials.email);
            return null;
          }

          // If user has a password, verify it
          if (user.passwordHash) {
            console.log('Verifying password for user:', user.id);
            const isValid = await compare(credentials.password, user.passwordHash);
            if (!isValid) {
              console.error('Invalid password for user:', user.id);
              return null;
            }
          } else {
            console.error('No password set for user, must use OAuth:', user.id);
            return null;
          }

          console.log('Successfully authenticated user:', user.id);
          
          return {
            id: user.id,
            email: user.email,
            name: user.name || '',
            image: user.image || null,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    },
  ],
  callbacks: {
    async signIn({ user: _user, account: _account, profile: _profile, email: _email, credentials: _credentials }) {
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
