/**
 * Chrome DevTools requests this URL; returning 200 with empty JSON
 * prevents "Failed to load resource: 404" in the console.
 */
export function GET() {
  return Response.json({}, { status: 200 });
}
