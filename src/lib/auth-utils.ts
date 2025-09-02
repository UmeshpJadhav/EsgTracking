import { auth } from "@/auth";
import type { Session } from "next-auth";

/**
 * Get the current server session
 * @returns Promise<Session | null>
 */
export const getServerSession = async (): Promise<Session | null> => {
  const session = await auth();
  return session;
};

/**
 * Get the current authenticated user's session
 * @returns Promise<Session['user'] | null>
 */
export const getCurrentUser = async (): Promise<Session['user'] | null> => {
  const session = await getServerSession();
  return session?.user || null;
};

/**
 * Require authentication for server components/pages
 * @returns Promise<{ user: Session['user'] }>
 * @throws {Error} If user is not authenticated
 */
export const requireAuth = async (): Promise<{ user: NonNullable<Session['user']> }> => {
  const session = await getServerSession();
  
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  return { user: session.user };
};
