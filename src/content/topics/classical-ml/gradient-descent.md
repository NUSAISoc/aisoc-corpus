---
title: Gradient Descent
description: Iterative first-order optimisation algorithm for minimising differentiable functions.
author: Praneeth-Suresh
updatedDate: "2026-06-24"
difficulty: beginner
category: classical-ml
domains: ["optimisation", "calculus"]
tags: ["optimisation", "calculus", "learning-rate", "convergence"]
prerequisites: ["linear-regression"]
citations:
  - title: "Convex Optimization – Boyd & Vandenberghe"
    url: "https://web.stanford.edu/~boyd/cvxbook/"
---

## Overview

Gradient descent updates parameters iteratively in the direction of steepest descent:

$$\mathbf{w}_{t+1} = \mathbf{w}_t - \eta \nabla_{\mathbf{w}} \mathcal{L}(\mathbf{w}_t)$$

where $\eta$ is the **learning rate**.

## Variants

- **Batch GD**: Uses the full dataset per step.
- **Stochastic GD (SGD)**: Uses a single sample per step.
- **Mini-batch GD**: Compromise using a small batch.

## Convergence

For convex functions with $L$-Lipschitz gradients and learning rate $\eta \le \frac{1}{L}$:

$$\mathcal{L}(\mathbf{w}_T) - \mathcal{L}(\mathbf{w}^*) \le \frac{\|\mathbf{w}_0 - \mathbf{w}^*\|^2}{2\eta T}$$

## Related Topics

Gradient descent is used to train [[Neural Networks]] and is extended by [[Transformers|attention-based architectures]].
