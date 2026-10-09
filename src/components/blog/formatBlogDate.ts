import { format } from "date-fns";

export function formatBlogDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return null;
  }
}
