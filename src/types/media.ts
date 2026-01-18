export type MediaType = "movie" | "tv";

export function toMediaType(value: string | null | undefined): MediaType | null {
  if (value === "movie" || value === "tv") {
    return value;
  }
  return null;
}
