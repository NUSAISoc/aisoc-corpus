import { defineCollection, z } from "astro:content";

const topics = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().regex(/^[A-Za-z0-9-]+$/, "Use a GitHub username"),
    updatedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
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
