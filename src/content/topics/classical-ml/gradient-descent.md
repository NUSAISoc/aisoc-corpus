---
title: Gradient Descent
description: Iterative first-order optimisation algorithm for minimising differentiable functions.
authors: ["Praneeth-Suresh", "N00bcak"]
updatedDate: "2026-06-24"
difficulty: beginner
category: classical-ml
domains: ["optimisation", "calculus"]
tags: ["optimisation", "calculus", "learning-rate", "convergence"]
prerequisites: ["linear-regression"]
furtherReading:
  - title: "Convex Optimization – Boyd & Vandenberghe"
    url: "https://web.stanford.edu/~boyd/cvxbook/"
---

## Overview

Gradient descent is the core technique used to train neural networks, which form the core of modern AI. The goal is to find the set of parameters (weights and biases) that lead to the minimum value of the loss function. To do this, we updates parameters iteratively in the direction of steepest descent:

$$
\mathbf{w}_{t+1} = \mathbf{w}_t - \eta \nabla_{\mathbf{w}} \mathcal{L}(\mathbf{w}_t)
$$

In this recursive definition off the process, the weight $\mathbf{w}$ gets updated as we go along. The variable $\eta$ is the **learning rate**. 

Variables such as the learning rate are called **hyperparameters**. They do not influence the outputs of a model when the model is run but they influence the dynamics of the training process.

## Variants

There are 3 key types of gradient descent (GD) that you need to know how to distinguish. The difference comes from the proportion of the dataset that is used at each turn to compute the value of the loss function $\mathcal{L}(\mathbf{w}_t)$:

- **Batch GD**: Uses the full dataset per step.
- **Stochastic GD (SGD)**: Uses a single sample per step.
- **Mini-batch GD**: In the middle, uses a subset of the sample per step.

## Convergence

How do we know that gradient descent will work? Do we have any guarantee that we will actually find the global minima in a loss landscape that might be full of local minima. It turns out that we are helped out by a mathematical property that we will meet soon. 

Not all mathematics results can be applied to Deep Learning however, because we do not have knowledge of what we are dealing with. Here, to make out life easy we make the assumption that the objective function has bounded smoothness (gradients don’t change infinitely fast). It is under this assumption that the following holds.

For convex functions with limits on curvature (more specifically, functions with $L$-Lipschitz gradients) and learning rate $\eta \le \frac{1}{L}$, we can place a guarantee on the convergence of the weights after $T$ time steps, $\mathbf{w}_T$ to the optimal set of weights $\mathbf{w}^*$:

$$
\mathcal{L}(\mathbf{w}_T) - \mathcal{L}(\mathbf{w}^*) \le \frac{\|\mathbf{w}_0 - \mathbf{w}^*\|^2}{2\eta T}
$$

There is a standard proof for this convergence guarantee that can be obtained from. This indicates that the error decreases at rate proportional to $1 / T$. Eventual convergence happens!

## Related Topics

Gradient descent is used to train [[Neural Networks]] and is extended by [[Transformers|attention-based architectures]].