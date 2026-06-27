---
title: Why you should care about PPO
description: why did ppo become the goat
author: checkpoint214159
difficulty: intermediate
category: reinforcement-learning
domains: ["reinforcement-learning", "policy-gradients"]
tags: ["trust-region", "policy-optimization", "exploration-exploitation", "actor-critic", "clipped-surrogate"]
prerequisites: ["policy-gradients", "gradient-descent", "q-learning"]
citations:
  - title: Trust Region Policy Optimization
    url: https://arxiv.org/pdf/1502.05477
  - title: Proximal Policy Optimization Algorithms
    url: https://arxiv.org/pdf/1707.06347
---

## What is Proximal about my Policy? Optimization

$$\tiny
that title makes no sense i just wanted to have a funny question in the title but also have PPO. but then i couldnt fit optimization in there so i just threw it outside of the question mark
$$

Welcome to the corpus entry for PPO! As a general rule, I will be glossing over a decent amount of foundation you typically see in many of those 'intros to RL' that you see plenty of. Those usually build up to PPO by starting with MDP/POMDP problem formulations, then going into Q tables and Q learning, then onto the RL and policy side of things. We will do less of such steps here since, yknow, those already exist in other corpus entries, or if they dont, you can always refer to those youtube videos. 

What we will do instead, is take a deeper dive into PPO, why its formulated the way it is, why it works well in industry, and what are some problems with it. Except us to snipe at other general concepts too (that may have already been described in the corpus); understanding the mechanics of PPO is nice, but zooming out is its own thing entirely.

## Proximal Policy Optimization

### The problem with policy gradients

Once again, we assume you know the prerequisites: namely, the Policy Gradient theorem, Bellman Optimality Equation. Then you probably also know about the general problem Policy Gradients in general face. In a dynamic, noisy environment that changes both in and not in accordance with the system we're controlling, if we're learning based off sampled trajectories that generate our estimated gradients. And, if these are noisy, one unlucky large parameter update may move the policy into a poor region.

"Poor" being that since RL has that *neatly annoying quirk* where the data we train on is what the policy collects, a bad, nasty, degraded policy collects worse trajectories, producing worse gradient estimates, degrading the policy further. That's, like, bad! Thus, we aim to control "step size", that is, how far we move in parameter space per gradient step. This motivates TRPO and its spiritual successor, PPO.

### TRPO

First, denote the probability ratio between old and new policies as: 

$$\Large 
r_\theta = \frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_\text{old}}(a_t|s_t)}
$$

This ratio is the **surrogate objective**: the thing both TRPO and PPO actually maximize. Without it, you'd need to run the candidate policy $\pi_\theta$ in the environment to collect fresh trajectories every single gradient step, since $J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}[R(\tau)]$ requires on-policy samples. Instead, $r_\theta$ is an importance sampling correction. It reweights trajectories already collected under $\pi_{\theta_\text{old}}$ to estimate how $\pi_\theta$ would have performed, letting you take multiple gradient steps on the same batch of data. (catch is that importance sampling is only reliable when the two distributions are close. drift too far and the reweighting becomes inaccurate. This is exactly the constraint both algorithms enforce, just in different ways)

For TRPO in particular, the paper is dense with many different formulations and theories about *monotonic improvement guarantees* and *Fisher information matrices as the metric for measuring constraint curvature*. Thats a whole lotta words! You should go read it yourself if you are a supreme math nerd, but to keep it (much) simpler, for both, they tackle the above fundemental problem: catastrophic policy updates. Fundementally, TRPO uses a Kullback-Leibler (KL) Divergence to constrain the size of updates to the policy:

$$\Large
\text{maximize}_\theta \quad \hat{\mathbb{E}}_t
\left[r_\theta\hat{A}_t\right]
\quad \text{subject to} \quad D_{KL}\!\left(\pi_{\theta_\text{old}} \,\|\, \pi_\theta\right) \leq \delta
$$


(just in case you need a recap: KL divergence is a measure of two distribution's dissimilarity. The abstracted understanding you need without math is just: how different is the old vs new policy)

However, we're currently abstracting a whole lot of complicated math around computing the Fisher information matrix (curature of KL constraint in parameter space) then running the conjugate gradient to find the update direction, then a line search to verify the constraint is satisfied before commiting the step.

...what?

Okay, all of this is pretty much second-order computation that aims to guarantee monotonic improvement. That's very nice and mathemdatically sound, but:

- **a.** it's hard to understand (which is why we're placing TRPO in a separate corpus document — or maybe not at all), and
- **b.** the update step isn't parallelizable. And you know that's a cardinal sin in deep learning.

### PPO

PPO takes the less mathematically rigorous but far more scalable approach of standard backprop on the clipped objective. Its updates are only first order, like pretty much all neural network training that has worked well empirically!

The "Proximal" term in PPO comes from optimization theory: proximal methods are optimization techniques that handle constraints by staying close to a reference point. That pretty much motivates what comes next: instead of the hard KL constraint from TRPO, PPO imposes an $\varepsilon$-band around the ratio, clipping it to stay within $[1-\varepsilon, 1+\varepsilon]$: 

$$\Large
L^{\text{CLIP}}(\theta) = \hat{\mathbb{E}}_t\!\left[\min\!\left(r_\theta\hat{A}_t,\; \text{clip}(r_\theta,\, 1-\varepsilon,\, 1+\varepsilon)\,\hat{A}_t\right)\right]
$$

...wow! That is a lot simpler! And, as Spiderman once said, with great simplicity comes less responsibility, or something like that. Simplicity over Supreme Mathematical Niceness (as in TRPO) here actually has many real practical consequences. Let's unpack what the clip is doing, then why the simplicity matters at scale.

The objective is **pessimistic by construction**. Tracing through the two cases:

- **Good action** ($\hat{A}_t > 0$): if the new policy is already $1+\varepsilon$ times more likely to take this action than the old one, the clipped term caps the objective, and the gradient goes to zero. This makes sense: the policy has taken enough credit for this update, and pushing the ratio higher doesn't improve the objective.
- **Bad action** ($\hat{A}_t < 0$): if the ratio has already fallen to $1-\varepsilon$, the action was penalised enough, and the gradient cuts out.

In both cases the clip stops rewarding further movement once the policy has drifted far enough. The difference from TRPO is that this is a soft barrier: there is no formal guarantee that $r_\theta$ won't exceed those bounds, just that there's no incentive to. So yeah, not as much mathematical rigour, but that's Good Enough™

So, is this simpler 'clipping' idea all that made PPO successful? Not necessarily: there are other factors too.

#### Parallelism and scale

A key shift that has significantly accelerated RL is the GPU boom of the 2010s: it became feasible to run thousands of environment instances simultaneously, each collecting trajectories in parallel. This is something that favours PPO's on-policy nature. Briefly, "on-policy" refers to an approach that only trains the *current* policy on data that it collected, whilst "off-policy" is the counterpart that trains it on data gathered in the past too. We formally call the storage of such data a "replay buffer". The argument for the latter is simple: Again, because RL's *neatly annoying quirk* of only training on the data the system gathers, anything gathered can only be used once (a datapoint is kind of a 'snapshot' of a particular state, action and policy that enacted that action). So unlike a static dataset in traditional ML/DL practice, we have poor sample efficiency

Off-policy methods (SAC, DQN) use replay buffers good for sample efficiency, but old data becomes increasingly misrepresentative as the policy updates. Managing that staleness requires extra machinery and complexity: prioritized replay, age-based eviction, careful buffer sizing, all whilst we try to optimize for parallelism. 

To be precise about why off-policy can't keep pace here: maintaining a healthy UTD ratio with thousands of parallel environments means thousands of gradient updates per step, each pulling a fresh minibatch from the replay buffer. Within each of those batches, only roughly $1/D$ of transitions are freshly collected, where $D$ is the buffer depth in episodes, the rest are aging samples from past policies. Increasing batch size doesn't fix this since a larger uniform sample still contains the same stale fraction. Beyond a certain scale, replay buffers also breach RAM limits, and random-access patterns (especially with prioritized replay) introduce per-update CPU to GPU transfer latency that GPU-simulated on-policy rollouts simply don't pay.

With PPO, there's no such overhead or complexity in buffer choice. Every parallel environment is running the current policy, so every trajectory is immediately usable training data. More environments leads to more diverse state coverage and better gradient estimates (a thought here: what happens if we have so many environments until our sampling becomes incredibly comprehensive and covers the whole distribution of state trajectories under our *current* policy?)

A key idea here that I learnt from my Odyssey mentor: Sample efficiency is one thing, but Wall-Clock efficency is another. In applied research and production, you almost always have a fixed time budget, but (thanks to the amazing advancements in parallelism) not so much a fixed sample budget! Even ignoring the stale data problem and assuming SAC and TD3 (other off-policy methods) can reach the same goal in, say, 10 million samples, where PPO needs 100 million, if the overhead for off-policy is much higher e.g 2 hours versus PPO e.g 10 minutes, its clear which is better.


#### Hyperparameter tuning (or the relative lack thereof)

Classic RL has a reputation for being a nightmare to tune. DQN needs careful choices of replay buffer size, target network update frequency, and learning rate. SAC has a temperature parameter $\alpha$ for entropy. DDPG is famously brittle in continuous control.

PPO is relatively robust by comparison. The clip ratio $\varepsilon = 0.1$ or $0.2$ works well across a huge range of tasks without much search. The clip itself acts as implicit learning rate regulation, so gradient steps that would push the policy too far get pruned by the objective, so the effective update size is bounded regardless of what your optimizer does.

The other parameters that typically matter in practice:

- **Epochs per rollout** (typically 4–10): too many and you violate the importance sampling assumptions the surrogate relies on, but too few and collected data is wasted.
- **Entropy coefficient**: directly controls how much the policy is encouraged to stay stochastic. This needs domain tuning, since what works for Atari is wrong for continuous robotics control.
- **GAE $\lambda$**: affects the bias-variance tradeoff in advantage estimation. Usually left at 0.95 but can matter on long-horizon tasks.


Now, is PPO perfect? Absolutely not, and we'll cover some limitations in subsequent sections. Next we

## PPO in LLMs

The application that put PPO on the map in NLP is RLHF — Reinforcement Learning from Human Feedback — the training stage that turns a pretrained LLM into something you'd actually want to talk to. The key insight (which sounds obvious in hindsight but wasn't for a while) is that text generation *is* a sequential decision process: the policy is the language model, the state is the prompt plus all tokens generated so far, the action is the next token chosen from the vocabulary (~50k–100k options), and the episode terminates when the model outputs an EOS token or hits a length limit.

The reward signal here is interesting. You don't get a reward after every token — a reward model (RM), trained separately on human preference data, scores the entire completed response as a single scalar. Credit has to propagate backward across hundreds of tokens to tell the model which early choices contributed to a good or bad response. GAE handles this, but it's a much harder credit assignment problem than Atari where reward comes every few frames.

There's a subtlety worth dwelling on: **the clip and the KL penalty are doing different jobs in RLHF.** The PPO clip prevents the policy from drifting too far from the reference policy *within* each update batch — the usual optimization stability role. The KL penalty (between the current LLM and a frozen reference model, typically the SFT checkpoint) is a separate *training-time regularizer* that prevents reward hacking. The RM is an imperfect proxy for human preferences, and a smart enough policy will find responses that score well on the RM without being helpful — or worse. The KL penalty keeps the LLM anchored near the SFT distribution as a prior against this. Two separate mechanisms, two separate problems.

One practical pain point with standard PPO in LLMs: you need a critic (value network) to estimate advantages. For LLMs, the critic needs to be approximately the same size as the policy to produce useful estimates — which roughly doubles your memory footprint. DeepSeek's **GRPO (Group Relative Policy Optimization)** sidesteps this entirely. Sample $G$ completions per prompt, score each with the RM, then normalize within the group:

$$
\hat{A}_i = \frac{r_i - \text{mean}(\mathbf{r})}{\text{std}(\mathbf{r})}
$$

No critic, no value function, no second model. The group's reward distribution serves as its own baseline. This is the approach behind DeepSeek-R1, and part of why reasoning-focused RLHF has become so computationally tractable recently.

## PPO in Robotics

The robotics application has a different flavor. Physical hardware is slow, expensive, and breaks. The dominant pipeline is: train entirely in simulation, then deploy on real hardware — **sim-to-real**. The challenge is that simulated physics never perfectly matches the real world: friction coefficients are off, motor models are simplified, sensors are cleaner than in practice. A policy that exploits specific simulated dynamics fails the moment it touches real metal.

The standard fix is **domain randomization**: each episode, physics parameters (mass, friction, motor gain, actuator delay) are randomly sampled from a range wider than the expected real-world variation. The policy can't overfit to any single set of dynamics, so it learns behavior robust across the distribution. This works best with fresh data — you want the current policy evaluated across the current randomized dynamics, not stored transitions from past policies with past randomization parameters. PPO's on-policy collection is a natural fit; replay buffers would mix trajectories from different physics configurations in ways that are hard to correct for.

The scale numbers here are significant. NVIDIA Isaac Gym runs thousands of robot simulations simultaneously on a single GPU, collecting rollouts at ~100,000 timesteps per second. PPO aggregates all of this into one batch per rollout, treats it as a single on-policy dataset, runs $K$ epochs of minibatch updates, then discards it. The result is wall-clock training times for dexterous manipulation tasks measured in hours, not weeks.

One continuous-control-specific issue worth calling out: **entropy collapse**. In robotics, actions are continuous (joint torques, end-effector velocities), so the policy is typically parameterized as a Gaussian: $\pi_\theta(a|s) = \mathcal{N}(\mu_\theta(s), \sigma_\theta(s))$. PPO's clipped objective can cause the standard deviation to shrink too aggressively — the policy becomes deterministic faster than it should, killing exploration before the task is learned. The entropy coefficient in the loss directly penalizes low entropy, but the right value is task-dependent. Too high and the policy never commits to anything; too low and it collapses prematurely to a degenerate solution.
