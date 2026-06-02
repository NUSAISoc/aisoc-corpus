import { defineCollection, z } from "astro:content";

const topics = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    category: z.enum([
      "classical-ml",
      "deep-learning",
      "generative",
      "reinforcement-learning",
      "world-modelling",
    ]),
    domains: z.array(z.string()),
    tags: z.array(z.string()),
    prerequisites: z.array(z.string()).optional().default([]),
    citations: z
      .array(z.object({ title: z.string(), url: z.string().url() }))
      .optional()
      .default([]),
  }),
});

export const collections = { topics };
