export const TOPIC_CATEGORIES = [
  {
    id: "classical-ml",
    label: "Classical ML",
    color: "#ccff00",
    description:
      "Foundational supervised learning, optimisation, interpretability, and statistical machine learning topics.",
  },
  {
    id: "deep-learning",
    label: "Deep Learning",
    color: "#6366f1",
    description:
      "Neural network concepts, representation learning, backpropagation, and modern deep learning foundations.",
  },
  {
    id: "generative",
    label: "Generative",
    color: "#8b5cf6",
    description:
      "Generative AI concepts including transformers, attention mechanisms, and sequence modelling foundations.",
  },
  {
    id: "reinforcement-learning",
    label: "Reinforcement Learning",
    color: "#f59e0b",
    description:
      "Learning systems that improve decisions through rewards, exploration, and sequential control.",
  },
  {
    id: "world-modelling",
    label: "World Modelling",
    color: "#06b6d4",
    description:
      "Models that learn environment dynamics, latent state, and predictive representations for agents.",
  },
] as const;

export type TopicCategoryId = (typeof TOPIC_CATEGORIES)[number]["id"];

export const CATEGORY_LABELS = Object.fromEntries(
  TOPIC_CATEGORIES.map((category) => [category.id, category.label]),
) as Record<TopicCategoryId, string>;

export const CATEGORY_COLORS = Object.fromEntries(
  TOPIC_CATEGORIES.map((category) => [category.id, category.color]),
) as Record<string, string>;

export const CATEGORY_DESCRIPTIONS = Object.fromEntries(
  TOPIC_CATEGORIES.map((category) => [category.id, category.description]),
) as Record<TopicCategoryId, string>;
