import { z } from "zod";

export const mediaTypeSchema = z.enum(["book", "movie", "tv"]);
export type MediaType = z.infer<typeof mediaTypeSchema>;

export const externalRefSchema = z.object({
  provider: z.string(),
  id: z.string(),
});
export type ExternalRef = z.infer<typeof externalRefSchema>;

export const normalizedWorkSchema = z.object({
  mediaType: mediaTypeSchema,
  title: z.string(),
  year: z.number().int().nullable(),
  genres: z.array(z.string()),
  synopsis: z.string().nullable(),
  originCountry: z.string().nullable(),
  language: z.string().nullable(),
  ageRating: z.string().nullable(),
  externalRef: externalRefSchema,
  posterOrCoverUrl: z.string().nullable(),
});
export type NormalizedWork = z.infer<typeof normalizedWorkSchema>;

export function normalizedWorkToJson(w: NormalizedWork) {
  return normalizedWorkSchema.parse(w);
}
