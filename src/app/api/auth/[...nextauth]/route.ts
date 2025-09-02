import { GET, POST } from "@/auth";

export { GET, POST };

// Add CORS headers if needed
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Optional: Add CORS headers if your frontend is on a different domain
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
