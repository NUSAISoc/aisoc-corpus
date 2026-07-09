---
title: LIME (Local Interpretable Model-agnostic Explanations)
description: Local surrogate explanations that approximate a black-box model around a specific input.
author: Praneeth-Suresh
updatedDate: "2026-06-24"
difficulty: beginner
category: classical-ml
domains: ["interpretability", "model-agnostic", "explainability"]
tags:
  [
    "local-explanations",
    "surrogate-models",
    "perturbation",
    "feature-importance",
  ]
prerequisites: ["linear-regression"]
citations:
  - title: "Why Should I Trust You? Explaining the Predictions of Any Classifier — Ribeiro, Singh, Guestrin (2016)"
    url: "https://arxiv.org/abs/1602.04938"
---

## Overview

LIME explains a single prediction by fitting a simple, interpretable model that behaves like the black-box model in a small neighborhood around the input.

## Core Idea

Given an input $x$, LIME generates many perturbed samples near $x$, queries the black-box model for their predictions, and fits a lightweight surrogate (often a sparse linear model) that is weighted by proximity to $x$. The surrogate coefficients are the explanation.

## Algorithm Steps

1. Sample perturbed inputs around the original example.
2. Get the black-box model predictions for each sample.
3. Weight samples by similarity to the original input.
4. Fit an interpretable model (e.g., linear regression) on the weighted samples.
5. Use the surrogate weights as the local explanation.

## Strengths

- Works with any classifier or regressor without accessing internal weights.
- Produces local, instance-specific explanations that are easy to inspect.
- Supports different data types with appropriate interpretable representations.

## Limitations

- Explanations can be unstable if sampling or kernel settings change.
- Local fidelity does not guarantee global faithfulness.
- Correlated features can lead to misleading attributions.

## Practical Tips

- Choose an interpretable representation that matches the data (e.g., superpixels for images, bag-of-words for text).
- Increase the number of perturbations for more stable explanations.
- Audit explanation stability by rerunning LIME with different random seeds.

## Related Topics

LIME relies on local surrogate models like [[linear-regression|Linear Regression]] and is commonly used to interpret [[neural-networks|Neural Networks]] and [[support-vector-machines|Support Vector Machines]]. It is often paired with optimisation concepts such as [[gradient-descent|Gradient Descent]].
