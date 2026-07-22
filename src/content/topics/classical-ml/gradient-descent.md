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

In the most general sense, training a model usually means choosing **parameters** that make a **loss function** small. In [[linear-regression|Linear Regression]], for example, we choose weights and a bias to minimise the mean-squared error between predictions and labels.

There are, of course, many ways to minimise said loss, as exemplified by [[linear-regression|Linear Regression]]:
- We could solve the normal equation with a **least-squares** method, which yields a closed-form solution, assuming the data has full column rank (i.e. there are enough data points to determine the parameters, and the features are independent).
- We could also use **gradient descent**, which is the topic of this article.

## How do we do Gradient Descent?

For Gradient Descent, the name of the game is to start with arbitrary parameters and iteratively improve them by **moving opposite to the gradient** of our loss function (thus, roughly speaking, the loss function is assumed **differentiable with respect to the parameters**).

### An Analogy for Gradient Descent  

We can intuitively understand this process by likening it to [hikers descending a mountain](https://en.wikipedia.org/wiki/Gradient_descent#An_analogy_for_understanding_gradient_descent) in fog so thick they can only see a few steps ahead.

So the story goes:
> The hikers cannot see the bottom of the mountain, so they can only rely on their immediate surroundings to feel their way down. They can feel the slope of the ground, or measure it with instruments, and determine the locally steepest downhill direction. They then discuss how far to move before stopping to measure the slope again. As the fog is too thick, they cannot know whether they have reached the lowest point of the mountain. They might instead stop in a local valley, make very slow progress across a nearly flat region, or repeatedly overshoot a narrow valley by taking steps that are too large.

This analogy captures a few key recurring themes of Gradient Descent that are worth highlighting:
| Gradient Descent | Hiker Analogy |
| --- | --- | 
| Global optimum is unknown | Hikers cannot see the bottom of the mountain |
| Slope at current point is known | Hikers can feel or measure how the ground slopes where they are standing |
| Loss function is differentiable | Hikers can feel/measure the slope of the ground |
| Best-effort updates based on local information | Hikers move in their perceived direction of steepest descent |
| Step size is chosen by the learning rate | Hikers discuss how far to move before measuring again |
| Convergence to global optima not guaranteed | Hikers may never reach the bottom of the mountain |

and it should also reveal that Gradient Descent is actually **a pretty crass algorithm** (after all, real-life hikers would be quite cooked if they actually encountered such a scenario).

Yet, gradient descent is one of the most widely used optimisation algorithms in machine learning. We will explore how it works, and why this is the case in the next few sections.

### Algorithm

To go into further details, let's assume we are dealing with a regression task, and write some (extremely sloppy) math down:

- Suppose we had a model $f(\mathbf{x};\theta)$, accepting $\mathbf{x}$ as its **input** and being parameterised by $\theta$. 
- We wish to train the model on an indeterminate dataset $\mathcal{D} = \{(\mathbf{x}_i, \mathbf{y}_i)\}_{i=1}^n$, where we are trying to discover $\theta$ such that $f(\mathbf{x}_i; \theta) \approx \mathbf{y}_i$ for all $i$ (i.e. we are "fitting" $f$ to $\mathcal{D}$).

In Gradient Descent (for regression tasks):
- We start by defining a **loss function** $\mathcal{L}(f(\mathbf{x}; \theta), \mathbf{y})$, which measures how far off our model's predictions are from the true labels.
  - Aside from being **differentiable w.r.t. $\theta$**, it is mandatory for $\mathcal{L}$ to be **minimized** whenever $f(\mathbf{x}; \theta) = \mathbf{y}$.
- We then arbitrarily select $\theta_0$ as our initial parameters, and a learning rate $\eta$
- For every timestep $t \geq 0$ (repeating until we are satisfied):
  - We compute $$\mathbf{g}_t = \nabla_{\theta_t} \mathcal{L}$$, the **gradient of the loss function w.r.t. the parameters** 
    - Indeed, $\mathbf{g}_t$ is a vector of partial derivatives of $\mathcal{L}$ w.r.t. each parameter in $\theta_t$.
  - We then collectively update our parameters using the update rule $$\theta_{t+1} \leftarrow \theta_t - \eta \mathbf{g}_t$$.
    - In calculus, this is a [**first-order approximation**](https://en.wikipedia.org/wiki/Linear_approximation) of our loss function, as $$ \mathcal{L}(\theta_{t} - \eta \mathbf{g}_t) \approx \mathcal{L}(\theta_t) - \eta \mathbf{g}_t^\top \mathbf{g}_t$$.
    - Notice how it always reduces our **approximated loss** whenever $\mathbf{g}_t \neq \mathbf{0}$ (i.e. whenever we are not at a stationary point), but **is not guaranteed to reduce the true loss**.

## Worked Example

Consider a toy loss $\mathcal{L}(f(\mathbf{x}; \theta), \mathbf{y}) = \frac{1}{2}(\theta - \mathbf{y})^2$ where $\theta, \mathbf{x}, \mathbf{y} \in \mathbb{R}$ and $f(\mathbf{x}; \theta) = \theta$. 
- This loss function satisfies $\nabla_\theta^2 \mathcal{L} = 1 > 0$, so it is **special** and has a unique global minimum at $\theta = \mathbf{y}$. More on that later.

With $\theta = 0$, $\mathbf{y} = 3$, and $\eta = 0.5$, the update rule becomes

$$
\theta_{t+1}=\theta_t-0.5(\theta_t-3) \quad \forall t\ge 0
$$

You can trace out the first few updates and check against the table below.

| Iteration $t$ | Current $\theta_t$ | Gradient $\nabla\mathcal{L}(\theta_t)$ | Update $-\eta\nabla\mathcal{L}(\theta_t)$ | Next $\theta_{t+1}$ |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 0 | -3 | 1.5 | 1.5 |
| 1 | 1.5 | -1.5 | 0.75 | 2.25 |
| 2 | 2.25 | -0.75 | 0.375 | 2.625 |

### Baby's First Training Dynamics Analysis

Mechanically tracing how updates evolve can familiarize us with the **procedure** of gradient descent, but it is arguably more useful to study **how** the updates change as training goes on ("training dynamics").

Continuing with our toy example, we can observe from the above that every update moves $\theta_t$ (ever more slowly) towards 3. In fact, rearranging gives

$$
\theta_{t+1}-3=(1-\eta)(\theta_t-3),
$$

so (at least when we have a nice loss like this), the multiplier $1-\eta$ completely determines **HOW** the weights evolve, as summarized below:

| Learning rate | Behaviour on this example |
| --- | --- |
| $0 \lt \eta \lt 1$ | Approaches 3 from the same side; very small values make slow progress. |
| $\eta=1$ | Reaches 3 in one step. |
| $1 \lt \eta \lt 2$ | Oscillates back and forth around 3, but eventually settles down. |
| $\eta=2$ | Oscillates around 3 without getting closer. |
| $\eta \gt 2$ | Overcorrects and diverges to $\pm\infty$. |

This shows something treated as quite obvious by ML practitioners: that learning rate is a hyperparameter that must be carefully tuned.

## Convergence, Convexity, and Polyak-Lojasiewicz

Typically, we do not run gradient descent indefinitely. We stop when we are **satisfied** with the solution, and we then call the model "converged" (onto a set of parameters $\theta^\dag$).

What "satisfied" means varies quite wildly depending on who you ask:
- [(From Boyd and Vandenberghe)](https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf) It could be $\lim_{t\to\infty}\theta_t=\theta^*$, where $\theta^*$ is a true global minimizer of the loss function.
- [(From Polyak)](https://www.researchgate.net/profile/Boris-Polyak-2/publication/243648552_Gradient_methods_for_the_minimisation_of_functionals/links/5a608e09aca272328103d55e/Gradient-methods-for-the-minimisation-of-functionals.pdf) It could also be $\lim_{t\to\infty}\mathcal{L}(\theta_t)=\mathcal{L}(\theta^*)$, where $\mathcal{L}(\theta^*)$ is a true global minimum of the loss function.
- [(From Nocedal and Wright)](https://www.math.kent.edu/~reichel/courses/optimization/Numerical_Optimization.pdf) It could be $\lim_{t\to\infty}\lVert\nabla\mathcal{L}(\theta_t)\rVert=0$; that is, we reach a stationary point of the loss function, **NOT** even a local minimum.
- "satisfied" can also mean that the model performs "well enough" on some (optionally) held-out validation data.

However, if we are willing to put up some strong assumptions on the loss function and assume it is **convex**, we can guarantee every **local minimum** must be a **global minimum**.

Unfortunately, many loss functions are **non-convex**, so most practitioners default to the last option, and use convergence as a vague conceptual tool to guide their training process instead.

<details class="advanced-note">
<summary>Advanced: Links to Proofs of Convergence</summary>

Note: All three results below assume the objective is **$L$-smooth** on the region being analysed, meaning its gradient is $L$-Lipschitz continuous:

$$
\lVert\nabla\mathcal{L}(\theta_1)-\nabla\mathcal{L}(\theta_2)\rVert \leq L\lVert\theta_1-\theta_2\rVert
\quad \text{for all } \theta_1,\theta_2 \text{ in that region.}
$$

For their strongly convex result, Boyd and Vandenberghe assume $mI \preceq \nabla^2\mathcal{L}(\theta) \preceq MI$ on the initial sublevel set, so $M$ plays the role of the smoothness constant. Karimi, Nutini, and Schmidt state the PL result using an $L$-Lipschitz continuous gradient.

Convex Functions
- Without assuming strong convexity or PL, [Theorem L12.6 in MIT's gradient descent notes](https://ocw.mit.edu/courses/6-7220j-nonlinear-optimization-spring-2025/mit6_7220_s25_lec12.pdf#page=6) proves that gradient descent on a convex, $L$-smooth objective with a minimizer has a **sublinear** objective-gap rate of $O(1/t)$ when $0 \lt \eta \leq 1/L$.

Strongly Convex Functions
- [Boyd and Vandenberghe prove in section 9.3.1](https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf#page=480) that the objective gap under gradient descent converges **linearly** when the objective is strongly convex and its Hessian is bounded above, provided the learning rate is chosen appropriately. Strong convexity is stronger than ordinary convexity and guarantees a unique global minimizer.

Polyak-Lojasiewicz Functions
- A differentiable objective satisfies the **Polyak-Lojasiewicz (PL) condition** if there is some $\mu \gt 0$ such that $\frac{1}{2}\lVert\nabla\mathcal{L}(\theta)\rVert^2 \geq \mu(\mathcal{L}(\theta)-\mathcal{L}^*)$. Strong convexity implies the PL condition, but the PL condition does not require convexity. For an objective that is both PL and smooth and has a minimizer, [Karimi, Nutini, and Schmidt](https://arxiv.org/abs/1608.04636) show that gradient descent with an appropriate learning rate makes the objective gap converge **linearly** to zero.

</details>

## Batch, Stochastic, and Mini-Batch Gradients

Up to this point, we've discussed gradient descent (GD) as if we had access to the true gradient of the loss function at every step.

In this regime, we typically break up the loss function into an aggregate of per-example losses (such as "average"), then compute the gradient of this aggregate loss at every step. This is called **batch GD**:

$$
\mathcal{L}(f(\mathbf{x}; \theta), \mathbf{y}) = \frac{1}{n}\sum_{i=1}^{|\mathcal{D}|} \ell(f(\mathbf{x}_i; \theta), \mathbf{y}_i) 
\quad \quad
\nabla_\theta \mathcal{L} = \frac{1}{n}\sum_{i=1}^{|\mathcal{D}|} \nabla_\theta \ell(f(\mathbf{x}_i; \theta), \mathbf{y}_i)
$$

This is rarely the case in practice, and with finite (or even small) datasets (relative to a presumed infinite population), we are forced to work with **noisy estimates** of our loss (and therefore, its gradient) at every step. We often express the gradient as

$$
\nabla_\theta \mathcal{L} = \frac{1}{n}\sum_{i=1}^n \nabla_\theta \ell(f(\mathbf{x}_i; \theta), \mathbf{y}_i) + \epsilon_i(\mu; \sigma^2)
$$

where $\epsilon_i$ is a random variable with mean $\mu$ and variance $\sigma^2$ (and, if the batch size is big enough, $\epsilon = \frac{1}{n}\sum_{i=1}^n \epsilon_i$ is approximately Gaussian by the Central Limit Theorem).

Using a single, **truly-randomly selected** sample (i.e. n = 1) gives us **stochastic GD** (SGD, not to be confused with [the optimizer](https://pytorch.org/docs/stable/generated/torch.optim.SGD.html) of the same name), while using a small, truly-randomly selected subset of samples (i.e. $n < |\mathcal{D}|$) gives us **mini-batch GD**.

In the vaguest of senses, here are some considerations when using these three variants of GD (which essentially vary $n$):
- Increasing $n$ reduces the mean noise variance $\epsilon = \frac{1}{n}\sum_{i=1}^n \epsilon_i$ (with variance $\sigma^2/n$) but makes each update susceptible to overfitting
- Decreasing $n$ and increasing the noise of the gradient update **can** help in common non-convex loss landscapes (in escaping local minima, and saddle points, and high-loss basins), but can also hurt convergence.
- However, on modern hardware (especially GPUs) where parallelism is cheap, increasing $n$ can reduce wall-clock time per step, and speed up convergence in practice.

## Related Topics

[[linear-regression|Linear Regression]] provides a concrete convex loss on which the update and convergence ideas are easiest to see. In [[neural-networks|Neural Networks]], backpropagation computes the gradient and a gradient-based optimiser applies the parameter update. [[transformers|Transformers]] inherit this training loop from neural networks, usually with mini-batches and an extension of plain gradient descent.
