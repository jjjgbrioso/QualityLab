import { notFound } from "@/lib/api/errors";
import { route } from "@/lib/api/handler";

// Gives unknown API paths the standard JSON error instead of the HTML 404 page.
const handler = route<{ slug: string[] }>(async () => {
  throw notFound("Endpoint");
});

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
