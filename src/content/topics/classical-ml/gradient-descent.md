---
title: Gradient Descent
description: Iterative first-order optimisation algorithm for differentiable loss functions.
authors: ["Praneeth-Suresh", "N00bcak"]
updatedDate: "2026-07-20"
difficulty: beginner
category: classical-ml
domains: ["optimisation", "calculus"]
tags: ["optimisation", "calculus", "learning-rate", "convergence"]
prerequisites: ["linear-regression"]
furtherReading:
  - title: "Convex Optimization – Boyd & Vandenberghe"
    url: "https://web.stanford.edu/~boyd/cvxbook/"
  - title: "Optimization Methods for Large-Scale Machine Learning – Bottou, Curtis & Nocedal"
    url: "https://bottou.org/papers/bottou-curtis-nocedal-2018"
  - title: "A Stochastic Approximation Method – Robbins & Monro"
    url: "https://projecteuclid.org/journals/annals-of-mathematical-statistics/volume-22/issue-3/A-Stochastic-Approximation-Method/10.1214/aoms/1177729586.full"
  - title: "Some Methods of Speeding Up the Convergence of Iteration Methods – Polyak"
    url: "https://www.mathnet.ru/eng/zvmmf7713"
  - title: "Gradient Descent and Descent Lemmas – MIT 6.7220/15.084"
    url: "https://ocw.mit.edu/courses/6-7220j-nonlinear-optimization-spring-2025/mit6_7220_s25_lec12.pdf"
---

## Overview

Training a model usually means choosing parameters that make a **loss function** small. In [[linear-regression|Linear Regression]], for example, we choose weights and a bias to minimise the mean-squared error between predictions and labels.

There are, of course, many ways to minimise said loss, as exemplified by [[linear-regression|Linear Regression]]:
- We could solve the normal equation with a **least-squares** method, which yields a closed-form solution, assuming the data has full column rank (i.e. there are enough data points to determine the parameters, and the features are independent).
- We could also use **gradient descent**, which is the topic of this article.

## The Idea Behind Gradient Descent

The most common (accurate) analogy of gradient descent is that of [hikers descending a mountain](https://en.wikipedia.org/wiki/Gradient_descent#An_analogy_for_understanding_gradient_descent), which is so heavily fogged as to obscure visibility beyond a few steps. So the story goes:
> As the hikers cannot see the bottom of the mountain, they can only rely on their surroundings to feel their way down the mountain. They can feel the slope of the ground (or even measure it with instruments) and hike in the direction of steepest descent. They can do so as often as they like but it would slow their pace down, so they discuss which direction to go in and how far before measuring again. As the fog is too thick, they won't know if they've really reached the bottom of the mountain, or if they've just gone into a valley.

| Gradient Descent | Hiker Analogy |
| --- | --- | 
| Global optimum is unknown | Hikers cannot see the bottom of the mountain |
| Local geometry is known | Hikers can see their surroundings, but not far away |
| Loss function is differentiable | Hikers can feel/measure the slope of the ground |
| Best-effort updates based on local information | Hikers take steps in the direction of steepest descent |
| Step size is chosen by the learning rate | Hikers discuss how far to hike before measuring again |
| Convergence to global optima not guaranteed | Hikers may end up in a valley and never reach the bottom of the mountain |


Let $\mathbf{w}_t$ be the parameter vector at iteration $t$, and let $\mathcal{L}(\mathbf{w})$ be a differentiable loss. The gradient

$$
\mathbf{g}_t = \nabla_{\mathbf{w}}\mathcal{L}(\mathbf{w}_t)
$$

collects the partial derivative of the loss with respect to every parameter. Under ordinary Euclidean distance, it points in the direction of steepest local increase, so its negative points towards steepest local decrease. Gradient descent takes the update

$$
\mathbf{w}_{t+1} = \mathbf{w}_t - \eta_t \mathbf{g}_t,
$$

where $\eta_t \gt 0$ is the **learning rate** or step size. The gradient chooses the direction; the learning rate chooses how far to travel.

> **Notation.** A subscript $t$ marks an iteration, not a training example. Bold symbols are vectors. When the learning rate is constant, we write $\eta_t=\eta$.

This update is local. A first-order approximation near $\mathbf{w}_t$ gives

$$
\mathcal{L}(\mathbf{w}_t + \boldsymbol{\Delta}) \approx \mathcal{L}(\mathbf{w}_t) + \mathbf{g}_t^\top \boldsymbol{\Delta}.
$$

Choosing $\boldsymbol{\Delta}=-\eta_t\mathbf{g}_t$ lowers this approximation whenever the gradient is nonzero. It does not promise that every step will lower the true loss: the approximation is reliable only close to the current point, so an oversized step can overshoot. [Boyd and Vandenberghe](https://web.stanford.edu/~boyd/cvxbook/) develop this descent-method view in Sections 9.2 through 9.4.

## Following One Descent

Consider a one-parameter loss whose minimum is at $w^*=3$:

$$
\mathcal{L}(w)=\frac{1}{2}(w-3)^2, \qquad \mathcal{L}'(w)=w-3.
$$

Starting from $w_0=0$ with learning rate $\eta=0.5$, each update is

$$
w_{t+1}=w_t-0.5(w_t-3).
$$

| Iteration $t$ | Current $w_t$ | Gradient $\mathcal{L}'(w_t)$ | Loss $\mathcal{L}(w_t)$ | Next $w_{t+1}$ |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 0 | -3 | 4.5 | 1.5 |
| 1 | 1.5 | -1.5 | 1.125 | 2.25 |
| 2 | 2.25 | -0.75 | 0.28125 | 2.625 |

The negative gradient is positive here, so every update moves $w_t$ towards 3. In fact,

$$
w_{t+1}-3=(1-\eta)(w_t-3),
$$

so $\eta=0.5$ halves the remaining distance on every step. This simple recurrence also exposes why the learning rate matters.

## Choosing the Learning Rate

For this quadratic example, the multiplier $1-\eta$ completely determines the behaviour.

| Learning rate | Behaviour on this example |
| --- | --- |
| $0 \lt \eta \lt 1$ | Approaches 3 from the same side; very small values make slow progress. |
| $\eta=1$ | Reaches 3 in one step. |
| $1 \lt \eta \lt 2$ | Crosses back and forth over 3, but the oscillations shrink. |
| $\eta=2$ | Oscillates without getting closer. |
| $\eta \gt 2$ | Oscillations grow and the iterates diverge. |

These thresholds belong to this particular loss, not to gradient descent in general. Real objectives have different curvature in different regions and directions. A useful learning rate must be small enough for the local gradient to remain informative, yet large enough to make worthwhile progress. Training systems often reduce the learning rate over time or choose it using a schedule; deterministic optimisation can also use a line search to select a step from the current point.

## Full, Stochastic, and Mini-Batch Gradients

For a dataset with $n$ examples, an empirical loss is commonly an average of per-example losses:

$$
\mathcal{L}(\mathbf{w})=\frac{1}{n}\sum_{i=1}^{n}\ell_i(\mathbf{w}).
$$

The variants differ in how much of this sum they use to estimate the next direction.

| Variant | Gradient used at one step | Main tradeoff |
| --- | --- | --- |
| **Batch gradient descent** | All $n$ examples | Exact gradient of the empirical loss, but each update can be expensive. |
| **Stochastic gradient descent** | One sampled example | Cheap, frequent updates, but the direction is noisy. |
| **Mini-batch gradient descent** | A sampled subset $B$ | Reduces noise while keeping computation efficient on parallel hardware. |

For a uniformly sampled example $i_t$, the stochastic direction is an unbiased estimate of the batch gradient:

$$
\mathbb{E}_{i_t}\!\left[\nabla \ell_{i_t}(\mathbf{w}_t)\right]=\nabla \mathcal{L}(\mathbf{w}_t).
$$

Unbiased does not mean accurate on every step. An individual stochastic or mini-batch update can increase the full loss even when the average direction is useful. The batch-versus-stochastic computational tradeoff and the resulting convergence conditions are treated in Sections 3 and 4 of [Bottou, Curtis, and Nocedal](https://bottou.org/papers/bottou-curtis-nocedal-2018). Modern stochastic-gradient analysis builds on the stochastic approximation framework introduced by [Robbins and Monro](https://projecteuclid.org/journals/annals-of-mathematical-statistics/volume-22/issue-3/A-Stochastic-Approximation-Method/10.1214/aoms/1177729586.full).

## What Convergence Means

There is more than one way for an optimisation run to converge. The loss values may stop changing, the parameters may stop moving, or the gradient norm $\lVert\nabla\mathcal{L}(\mathbf{w}_t)\rVert$ may approach zero. These statements are related under suitable assumptions, but they are not interchangeable for every objective.

For a differentiable **convex** loss, every local minimum is global. With a smooth gradient and a suitable learning rate, gradient descent can therefore approach a global minimiser. Stronger curvature assumptions lead to faster guarantees. Neural-network losses are generally non-convex, so a small gradient only identifies an approximate **stationary point**. It does not by itself distinguish a global minimum from a local minimum, saddle point, or flat region.

In practice, training may stop when one or more of these conditions hold:

- the gradient norm or parameter change is sufficiently small;
- the training loss improves by less than a chosen tolerance;
- performance on held-out validation data stops improving;
- a time or iteration budget is exhausted.

The stopping rule should match the goal. Minimising training loss is an optimisation objective; performance on unseen data is a generalisation objective, and further optimisation need not improve it. Section 2.3 of [Bottou, Curtis, and Nocedal](https://bottou.org/papers/bottou-curtis-nocedal-2018) separates empirical-risk optimisation on training data from model selection using validation performance.

<details class="advanced-note">
<summary>Advanced: What the convergence guarantee assumes</summary>

Suppose $\mathcal{L}$ is differentiable and convex, has a minimiser $\mathbf{w}^*$, and has an $L_s$-Lipschitz gradient:

$$
\lVert\nabla\mathcal{L}(\mathbf{x})-\nabla\mathcal{L}(\mathbf{y})\rVert \le L_s\lVert\mathbf{x}-\mathbf{y}\rVert.
$$

For fixed-step gradient descent with $0 \lt \eta \le 1/L_s$, the iterates satisfy the sublinear bound

$$
\mathcal{L}(\mathbf{w}_T)-\mathcal{L}(\mathbf{w}^*)
\le
\frac{\lVert\mathbf{w}_0-\mathbf{w}^*\rVert^2}{2\eta T}.
$$

The $1/T$ term says that obtaining another factor of ten in this worst-case error bound requires ten times as many iterations. Convexity is what turns low objective value into a global guarantee.

Without convexity, smoothness can still guarantee progress towards stationarity. If $\mathcal{L}$ is bounded below by $\mathcal{L}_{\inf}$ and $\eta=1/L_s$, then

$$
\min_{0\le t\lt T}\lVert\nabla\mathcal{L}(\mathbf{w}_t)\rVert^2
\le
\frac{2L_s\left(\mathcal{L}(\mathbf{w}_0)-\mathcal{L}_{\inf}\right)}{T}.
$$

This weaker statement guarantees that at least one iterate has a small gradient. It does not say that the iterate is globally optimal. The assumptions, descent inequality, non-convex stationarity result, and convex last-iterate bound appear as Theorems L12.3, L12.4, and L12.6 in MIT's [Gradient Descent and Descent Lemmas](https://ocw.mit.edu/courses/6-7220j-nonlinear-optimization-spring-2025/mit6_7220_s25_lec12.pdf).

</details>

## Failure Modes and Diagnostics

Gradient descent is simple, but its behaviour depends on the loss geometry and the quality of the gradient estimate.

| Symptom | Likely cause | Typical response |
| --- | --- | --- |
| Loss explodes or alternates sharply | Learning rate is too large | Reduce the step size or use a decaying schedule. |
| Loss decreases extremely slowly | Learning rate is too small or the loss is poorly conditioned | Rescale features, use momentum, or use a preconditioned method. |
| Mini-batch loss is highly erratic | Gradient estimate has high variance | Increase the batch size, lower the learning rate, or average updates. |
| Gradient is tiny but loss remains high | Flat region, saddle point, or saturated model | Inspect the model and initialisation; a small gradient alone is not proof of a good solution. |
| Training improves while validation worsens | The model is fitting the training data without improving generalisation | Use validation-based stopping or appropriate regularisation. |

Feature scaling matters even for a convex objective. If one direction curves much more sharply than another, a step size safe for the sharp direction can make progress along the shallow direction painfully slow. This is the core difficulty behind **ill-conditioning**.

<details class="advanced-note">
<summary>Advanced: Conditioning, momentum, and adaptive steps</summary>

For a positive-definite quadratic

$$
\mathcal{L}(\mathbf{w})=\frac{1}{2}\mathbf{w}^\top H\mathbf{w},
$$

the eigenvalues of $H$ measure curvature along its principal directions. If they range from $\mu$ to $L_s$, the condition number is $\kappa=L_s/\mu$. A fixed learning rate must remain stable in the direction with curvature $L_s$, while progress is slow in the direction with curvature $\mu$. In the original coordinates, this often appears as a zig-zag path across a long, narrow valley.

**Momentum** carries part of the previous direction into the next update. One common form is

$$
\mathbf{v}_{t+1}=\beta\mathbf{v}_t+\mathbf{g}_t,
\qquad
\mathbf{w}_{t+1}=\mathbf{w}_t-\eta\mathbf{v}_{t+1},
$$

where $0\le\beta\lt 1$ controls how much direction is retained. This can damp alternating motion across a valley while accumulating motion along a consistent direction. The heavy-ball method is developed in [Polyak's original paper](https://www.mathnet.ru/eng/zvmmf7713).

**Preconditioned** methods instead multiply the gradient by a positive-definite scaling matrix, changing the effective geometry of a step. Adaptive gradient methods use a changing, often diagonal, scale derived from gradient history. Section 6.5 of [Bottou, Curtis, and Nocedal](https://bottou.org/papers/bottou-curtis-nocedal-2018) describes diagonal rescaling methods and their computational tradeoffs. These changes can make difficult directions easier to traverse, but they introduce additional state and tuning choices; they do not remove the need to inspect optimisation behaviour.

</details>

## Related Topics

[[linear-regression|Linear Regression]] provides a concrete convex loss on which the update and convergence ideas are easiest to see. In [[neural-networks|Neural Networks]], backpropagation computes the gradient and a gradient-based optimiser applies the parameter update. [[transformers|Transformers]] inherit this training loop from neural networks, usually with mini-batches and an extension of plain gradient descent.
