import NextAuth from "next-auth";
import { authConfig } from "./lib/auth";

// Initialize NextAuth with the configuration
const handler = NextAuth({
  ...authConfig,
  // Add any additional NextAuth configuration here
});

// Export the handlers for the API routes
export const { 
  auth,
  signIn,
  signOut,
  handlers: { GET, POST }
} = handler;

// Re-export types for convenience
export type { Session } from "next-auth";

// Export the auth configuration
export { authConfig };
