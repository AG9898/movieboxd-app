import { redirect } from "next/navigation";

type ReviewRedirectPageProps = {
  params: Promise<{ tmdbId?: string | string[] }> | { tmdbId?: string | string[] };
  searchParams?: Promise<{ mediaType?: string | string[] }> | { mediaType?: string | string[] };
};

export default async function ReviewRedirectPage({ params, searchParams }: ReviewRedirectPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const rawId = Array.isArray(resolvedParams.tmdbId) ? resolvedParams.tmdbId[0] : resolvedParams.tmdbId;
  const tmdbId = rawId ?? "";
  const rawMediaType = Array.isArray(resolvedSearchParams.mediaType)
    ? resolvedSearchParams.mediaType[0]
    : resolvedSearchParams.mediaType;
  const mediaType = rawMediaType === "tv" ? "tv" : "movie";

  redirect(`/reviews?tmdbId=${encodeURIComponent(tmdbId)}&mediaType=${mediaType}&autoHydrate=1`);
}
