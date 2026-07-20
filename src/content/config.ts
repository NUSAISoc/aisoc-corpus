import { defineCollection } from "astro:content";
import { topicFrontmatterSchema } from "./topic-schema";

const topics = defineCollection({
  type: "content",
  schema: topicFrontmatterSchema,
});

export const collections = { topics };
