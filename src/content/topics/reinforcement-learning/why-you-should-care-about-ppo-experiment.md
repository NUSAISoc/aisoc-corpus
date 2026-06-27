---
title: Why you should care about PPO
description: why did ppo become the goat
author: checkpoint214159
difficulty: intermediate
category: reinforcement-learning
domains: ["reinforcement-learning", "policy-gradients"]
tags: ["trust-region", "policy-optimization", "exploration-exploitation", "actor-critic", "clipped-surrogate"]
prerequisites: ["policy-gradients", "gradient-descent", "q-learning"]
---

## What is Proximal about my Policy? Optimization

*(that title makes no sense — i just wanted to have a funny question in the title but also have PPO. but then i couldnt fit optimization in there so i just threw it outside of the question mark)*

Welcome to the PPO entry. If you've already been through the standard RL tutorial pipeline — MDPs, Q-tables, Q-learning, vanilla policy gradients — welcome to the other side. If you skipped straight here, also fine. We won't rebuild that foundation.

What we will do is go deeper than the standard "here's the clipping formula, here's a MuJoCo ant doing a backflip" explanation. The goal is two things: understand why the algorithm is formulated the way it is (not just what it does), and understand what happens when you actually try to use it — because PPO in a textbook benchmark and PPO in production are meaningfully different problems.

Two sections. Section 1 is the theory: the equation first, then the reasoning behind each piece. Section 2 is applications: what changes when you take PPO into LLMs, robotics, and competitive game AI, because the challenges are different in each domain and most tutorials don't touch any of them.

---

## Section 1: How PPO Works

### The Problem It's Solving

Policy gradient methods are appealing because they're direct: parameterize a policy $\pi_\theta$, collect trajectories by running it in the environment, compute which actions led to good outcomes, and nudge $\theta$ toward those actions. The update for vanilla policy gradient (REINFORCE) looks like:

$$\nabla_\theta J(\theta) = \hat{\mathbb{E}}_t \left[ \nabla_\theta \log \pi_\theta(a_t | s_t) \cdot \hat{A}_t \right]$$

The problem is the step size. Take too small a step and training is painfully slow. Take too large a step and you can catastrophically destroy a policy that was working — and unlike supervised learning where you can just re-run on the same fixed dataset, you can't recover easily. The next batch of training data comes from your newly broken policy, which means you get worse data, which means your updates get worse, and you spiral. Gradient descent on a fixed dataset is forgiving. Policy gradient on a live environment is not.

**TRPO** (Trust Region Policy Optimization) solved this properly in 2015: formally constrain the policy update so that the KL divergence between the old and new policy stays below some threshold $\delta$. The constraint guarantees you don't take a step you can't recover from. It works well. It also requires computing the Fisher information matrix and running conjugate gradient optimization at every update step, which is expensive enough that most practitioners found it unusable at scale.

PPO replaces the constraint with a clip. Same intuition, much cheaper math.

### The Equation

$$\boxed{L^{\text{CLIP}}(\theta) = \hat{\mathbb{E}}_t\!\left[\min\!\left(r_t(\theta)\,\hat{A}_t,\;\text{clip}\!\left(r_t(\theta),\,1-\varepsilon,\,1+\varepsilon\right)\hat{A}_t\right)\right]}$$

That's PPO-Clip. That's the core of it. Everything else — the value function loss, the entropy bonus, the 37 implementation details that actually make it work in practice — is scaffolding around this objective. Let's understand what it's doing before worrying about the scaffolding.

### Tracing Through a Concrete Example

Forget the labels for a second. Your agent just took an action that turned out to be **30% better than average**. So $\hat{A}_t = +0.3$. At the start of the update step, old and new policy are the same, so the ratio $r_t(\theta) = 1.0$. As gradient ascent runs, the new policy increases the probability of this action, so $r_t(\theta)$ climbs above $1.0$. Take $\varepsilon = 0.2$.

At $r_t(\theta) = 1.15$:
- First term: $1.15 \times 0.3 = 0.345$
- Clipped term: $\text{clip}(1.15,\, 0.8,\, 1.2) \times 0.3 = 1.15 \times 0.3 = 0.345$
- $\min(0.345,\, 0.345) = 0.345$ — we're inside the trust region, both terms agree, gradient is active.

At $r_t(\theta) = 1.4$ (we've pushed the probability up 40% relative to old policy):
- First term: $1.4 \times 0.3 = 0.42$
- Clipped term: $\text{clip}(1.4,\, 0.8,\, 1.2) \times 0.3 = 1.2 \times 0.3 = 0.36$
- $\min(0.42,\, 0.36) = 0.36$ — the clipped term wins. The objective is flat here; the gradient is zero.

The policy has already moved enough. Pushing harder doesn't improve the objective. PPO stops caring.

Now the opposite: your agent took an action that was **30% worse than average**. $\hat{A}_t = -0.3$. The new policy wants to decrease the probability, so $r_t(\theta)$ falls below $1.0$.

At $r_t(\theta) = 0.75$ (we've reduced the probability 25% relative to old policy):
- First term: $0.75 \times (-0.3) = -0.225$
- Clipped term: $\text{clip}(0.75,\, 0.8,\, 1.2) \times (-0.3) = 0.8 \times (-0.3) = -0.24$
- $\min(-0.225,\, -0.24) = -0.24$ — the clipped term is more negative, so it wins. We still update.

At $r_t(\theta) = 0.5$:
- First term: $0.5 \times (-0.3) = -0.15$
- Clipped term: $0.8 \times (-0.3) = -0.24$
- $\min(-0.15,\, -0.24) = -0.24$ — the unclipped term would say "we've reduced probability enough, ease off." The clipped term overrules it: we keep applying the full gradient.

The $\min$ always selects the more conservative estimate of the objective. This is the mechanism: **PPO is pessimistic about its own updates**. It never claims more credit than the trust region allows, and never reduces penalties for moving in the wrong direction.

### Breaking Down the Pieces

**The ratio $r_t(\theta)$**

$$r_t(\theta) = \frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_\text{old}}(a_t \mid s_t)}$$

You collected a batch of experience using $\pi_{\theta_\text{old}}$. You now want to update $\theta$ using that data. But the data was generated under the old policy — if you run gradient ascent directly, you're implicitly assuming the old and new policies experience the same distribution of states and actions. That assumption breaks the moment $\theta$ moves.

The ratio $r_t(\theta)$ is the correction factor. It asks: *how much more (or less) likely is the new policy to take this action than the old one?* When $r_t(\theta) = 1$, they agree. When it drifts far from 1 in either direction, your importance weights are unreliable — you're estimating the new policy's behavior using data that looks increasingly unlike what the new policy would generate. The clip enforces that you don't trust those estimates past $[1-\varepsilon, 1+\varepsilon]$.

*(This is importance sampling, if you want the formal name for it. We skipped the name on purpose — the intuition lands better first.)*

**The advantage $\hat{A}_t$**

The advantage answers: *how much better was this specific action than the average action the policy would have taken in this state?*

$$\hat{A}_t = Q(s_t, a_t) - V(s_t)$$

$Q(s_t, a_t)$ is the expected return from taking action $a_t$ in state $s_t$. $V(s_t)$ is the expected return from state $s_t$ under the current policy, regardless of action. A positive advantage means this action outperformed the average; negative means it underperformed. The policy gradient uses this signal to push probabilities in the right direction.

In practice, $\hat{A}_t$ is estimated using **Generalized Advantage Estimation (GAE)** — a weighted sum of TD errors that trades off variance and bias via a parameter $\lambda$. The short version: a single TD error $r_t + \gamma V(s_{t+1}) - V(s_t)$ is low-variance but biased; a full Monte Carlo return is unbiased but high-variance; GAE interpolates between them. The derivation isn't important here — what matters is that GAE is how you get a usable advantage estimate without running infinitely long rollouts.

**The clip**

$\text{clip}(r_t(\theta),\, 1-\varepsilon,\, 1+\varepsilon)$ bounds the ratio to the interval $[1-\varepsilon,\, 1+\varepsilon]$, with $\varepsilon$ typically set to $0.1$ or $0.2$.

The $\min$ of the two terms creates an important asymmetry:

- **Good action, policy moving toward it** ($A_t > 0$, $r_t > 1$): allowed up to $1 + \varepsilon$, then the gradient goes to zero. You've already taken credit for this update.
- **Good action, policy moving away from it** ($A_t > 0$, $r_t < 1$): always penalized. No clipping on the downside of a good action.
- **Bad action, policy moving away from it** ($A_t < 0$, $r_t < 1$): allowed down to $1 - \varepsilon$, gradient goes to zero. You've already penalized this action enough.
- **Bad action, policy moving toward it** ($A_t < 0$, $r_t > 1$): always penalized.

The clip limits how much *credit* you can claim for a good update. It never limits how much *damage* is registered for moving in the wrong direction. This one-sidedness is what makes the trust region work in practice rather than just in theory.

### The Actor-Critic Structure

PPO is an actor-critic algorithm. The **actor** is $\pi_\theta$ — the policy that chooses actions. The **critic** is a value function $V_\phi(s)$ — a learned estimate of how good a state is in expectation. 

The critic's job is to make $\hat{A}_t$ computable without waiting for the full episode to end. It provides the baseline $V(s_t)$ that the advantage subtracts out. A more accurate critic produces lower-variance advantage estimates, which produces more reliable policy gradients. The critic and actor train simultaneously; the full PPO objective combines three terms:

$$L^{\text{total}}(\theta, \phi) = L^{\text{CLIP}}(\theta) - c_1 L^{\text{VF}}(\phi) + c_2\, H[\pi_\theta]$$

where $L^{\text{VF}}$ is the value function loss (mean squared error between predicted and actual returns) and $H[\pi_\theta]$ is an entropy bonus that discourages the policy from collapsing to deterministic behavior too early.

The clipped objective $L^{\text{CLIP}}$ is the heart of it. The value function and entropy terms are important but secondary.

> **What we're not covering here**: GAE derivation, orthogonal weight initialization, observation normalization, learning rate annealing, and 33 other implementation details that turn "PPO that makes sense" into "PPO that actually works." If you're implementing this, the ICLR blog post [The 37 Implementation Details of PPO](https://iclr-blog-track.github.io/2022/03/25/ppo-implementation-details/) is required reading. The gap between the algorithm on paper and the algorithm that trains reliably is large, and that post maps the gap.

---

## Section 2: PPO in the Wild

Understanding PPO on paper is one thing. The more interesting question is what happens when you apply it to a real domain — because every domain has constraints that change what "using PPO" actually means. The RL abstraction (state, action, reward, policy) sounds universal, but the moment you map it onto a specific problem you inherit that problem's physics, its compute costs, its safety requirements, and its definition of reward.

Three domains. For each: how the vocabulary maps, and what goes wrong in ways the standard tutorial doesn't mention.

---

### LLMs

Most PPO tutorials were written before InstructGPT (2022). That's a problem, because the most widely deployed use of PPO in the world is RLHF — the training stage that aligns language models to human preferences. If you've used ChatGPT, you've interacted with a model trained using PPO.

The RL vocabulary maps as follows:

| RL concept | LLM equivalent |
|---|---|
| Policy $\pi_\theta$ | The language model being trained |
| State $s_t$ | Prompt + all tokens generated so far |
| Action $a_t$ | Next token |
| Episode | Full response (prompt → EOS token) |
| Reward | Score from reward model or verifier |

This looks clean on a table. In practice it surfaces three non-obvious problems.

**The credit assignment problem is brutal**

A response might be 300–500 tokens long. One reward scalar arrives at the end of the episode. Which of those tokens actually earned the score?

PPO's answer via GAE is to propagate the advantage backward through the episode. This works well enough empirically, but it has no principled ability to identify *which part* of the response was responsible for the reward. A response that was excellent through token 480 and then said something factually wrong will have uniformly high advantage estimates across all tokens — including the ones that caused the problem. The algorithm can't localize the failure.

This is one of the deeper unsolved problems in RLHF, not just a PPO limitation. But it's worth naming, because most treatments of PPO don't acknowledge it.

**The memory footprint killed the critic**

Running PPO on an LLM simultaneously requires four large models in GPU memory: the actor (the model being trained), a frozen reference copy of the actor (for the KL penalty discussed below), the critic (a value network — typically another LLM-scale model), and the reward model. At 7B+ parameters each, this is a severe memory constraint.

GRPO (Group Relative Policy Optimization), used in DeepSeek-R1, eliminates the critic entirely. Instead of a learned value function, GRPO samples $k$ responses to the same prompt, scores all of them, and computes advantages by normalizing within the group:

$$\hat{A}_i = \frac{r_i - \text{mean}(r_1, \ldots, r_k)}{\text{std}(r_1, \ldots, r_k)}$$

No separate value network needed. The advantage estimate is relative rather than absolute — "this response was better than average among the $k$ samples" rather than "this response was $x$ units above the state value." The memory footprint drops substantially, which at LLM scale means you can run larger models or train on cheaper hardware.

**The KL penalty is doing a different job than the clip**

In vanilla PPO, the clip provides the trust region. In RLHF, there's also an explicit KL penalty added to the reward:

$$r_{\text{total}}(x, y) = r_{\text{RM}}(x, y) - \beta\,\text{KL}\!\left[\pi_\theta(\cdot \mid x) \;\|\; \pi_{\text{ref}}(\cdot \mid x)\right]$$

This is not redundant with the clip. The clip prevents unstable policy updates. The KL penalty prevents something different: the LLM from finding reward hacks in the reward model.

Reward models are imperfect. A capable LLM will discover that certain response patterns — confidently-stated wrong answers, sycophantic preambles, unusual formatting — score highly on the reward model even if they're actually low-quality outputs. This is **reward hacking**, and it's amplified at scale. The KL term keeps the policy close enough to the pre-RLHF reference model that it can't drift far enough to exploit these patterns.

Remove the KL term and reward scores climb while actual quality degrades. The clip and the KL penalty solve different problems. You need both.

---

### Robotics

Robotics is where PPO's on-policy nature is simultaneously its clearest advantage and its clearest limitation.

The vocabulary maps naturally: state is the robot's sensory input (joint angles, IMU readings, camera), action is joint torques or velocity targets, reward is some combination of task progress and constraint satisfaction. The complications come from the physics.

**Sim-to-real isn't a gap, it's a distribution shift you have to engineer for**

PPO trains in simulation because simulation is cheap, safe, and trivially parallelizable across many instances. Real-world physics differs from simulated physics in friction coefficients, actuator latency, contact dynamics, and sensor noise. A policy optimized for one specific simulator will often fail immediately on hardware — not because the task is too hard, but because the distribution it was optimized for doesn't exist in the real world.

The standard approach is **domain randomization**: during training, randomly vary the simulation parameters (mass, friction, damping, motor strength) across a wide range for each episode. The policy learns to succeed across that entire range; if the range is calibrated correctly, the real world falls inside it somewhere.

PPO's on-policy nature helps here specifically. When you change the environment distribution — add more randomization, adjust parameter ranges — you need fresh data from the current policy to learn from the new distribution. Off-policy methods like SAC accumulate a replay buffer of old trajectories. If the environment distribution changes, old buffer entries represent a distribution that no longer exists, and training on them pulls the policy in the wrong direction. On-policy PPO sidesteps this: every rollout is freshly collected from the current policy in the current environment.

**Continuous action spaces and entropy collapse**

Discrete action spaces (Atari, text) have a natural floor on how deterministic a policy can be — there are still $n$ tokens or buttons to choose among. Continuous action spaces don't. Robotics policies output Gaussian distributions over joint commands: mean and standard deviation per joint. Over training, the standard deviation tends to shrink toward zero as the policy converges on what it thinks is the optimal mean. The policy becomes near-deterministic.

This sounds like convergence. It often isn't. A deterministic policy can't recover from states it hasn't seen before — it will confidently execute the learned action even when that action is wrong for the new configuration. Exploration requires maintaining some spread.

The entropy bonus $c_2 H[\pi_\theta]$ in the PPO objective directly counters this by rewarding high-entropy policies. But the coefficient $c_2$ is one of the most sensitive hyperparameters in robotics PPO. Too high: the policy stays noisy indefinitely and never commits to effective strategies. Too low: entropy collapses early and the policy gets stuck in a local optimum it can't explore out of. In grid-world benchmarks and Atari this parameter barely matters; in continuous robot control it can be the deciding factor between a policy that works and one that doesn't.

**Parallel environments don't scale the way you'd expect**

The intuition: run $N$ parallel environment instances → variance in gradient estimates drops by $\sqrt{N}$ → faster, more reliable training. Scale up $N$ and everything improves proportionally.

The reality in robotics is more frustrating. Parallel physics simulations are correlated — they use the same physics engine, start from similar initial state distributions, and tend to encounter similar contact configurations if the task structure is similar. The effective number of independent gradient samples is considerably smaller than $N$.

**SAPG** (Split and Aggregate Policy Gradients) addresses this by splitting the $N$ environments into $M$ independent groups, computing policy gradients separately within each group, then combining them with variance-aware weighting. The variance estimator can now detect and down-weight gradient estimates from correlated groups. The result is empirical gradient variance much closer to what $N$ truly independent environments would give you. This is a niche paper that doesn't appear in most PPO writeups, but it's addressing a real scaling failure that anyone running large-scale robotics RL will encounter.

---

### Game AI

Game AI is where PPO first became publicly famous, and it's also the domain where its properties — good and bad — are most visible. The OpenAI Five (Dota 2) and AlphaStar (StarCraft II) projects from 2019 remain the clearest large-scale demonstrations of what PPO can do at extreme scale.

**Reward shaping is the actual engineering problem**

OpenAI Five received one real signal from the Dota 2 environment: $+1$ for win, $-1$ for loss, at the end of a game lasting 30–45 minutes of game time. PPO cannot learn from this directly. The temporal gap between action and reward is far too long for any credit assignment mechanism to bridge — you'd need to correctly assign credit to tens of thousands of individual action steps based on a single terminal signal.

The actual engineering work was the reward function: 17 manually designed dense intermediate rewards covering last-hits, tower damage, hero kills, net worth changes, and other in-game events that proxy for winning. On top of this, a **team spirit** hyperparameter $\in [0, 1]$ blended individual and team reward signals, annealed from 0 (fully individual) → 1 (fully cooperative) over the course of training. The intuition was to first teach agents to be competent at the individual level before training them to cooperate.

The papers about OpenAI Five focus on the training infrastructure and scale. The reward engineering is mentioned in passing. This is backwards in terms of practical importance — a well-designed reward function with vanilla PPO is usually more effective than a novel algorithm with a poorly designed one.

**Self-play breaks PPO's stationarity assumption**

PPO's trust region mechanism assumes that the environment distribution doesn't shift dramatically between policy updates. In self-play, this assumption is violated at the environment level: every time you update one agent's policy, the environment changes for all other agents, because their opponents just changed.

AlphaStar addressed this with **league training**: rather than updating agents against their current opponent directly, a diverse population of historical agent snapshots is maintained as permanent opponents. The current agent trains against this fixed population, which doesn't shift between updates. New snapshots are added to the league periodically as the current policy improves.

Running PPO agents naively in head-to-head self-play tends to cycle rather than converge: agent A learns to beat agent B, agent B updates to beat A, and the cycle repeats. Neither agent consistently improves. The league's stable population provides the fixed training distribution that PPO's trust region requires.

**The scale was the finding, not the algorithm**

OpenAI Five used 256 GPUs and 128,000 CPU cores across simultaneous environment instances. AlphaStar used approximately 600 TPUv3s over a period of two weeks. Neither project introduced fundamentally new algorithms. Both used PPO (or a close variant) as a component rather than as a novel contribution. The algorithmic work was years old by the time of deployment.

What was novel was the scale. At sufficient compute and sufficient parallel environments, PPO discovers strategies that competitive human players had not previously found — not because it's smarter, but because it has explored more of the game's strategy space than any human team ever could.

This is PPO's most practically important property: it parallelizes almost trivially over many environment rollouts, making compute the primary bottleneck rather than algorithmic sophistication. Double the environments, double the throughput of training data. Triple it. The on-policy nature means you never have to worry about staleness — every batch of data is fresh.

The consequence is that the resulting policies are fully opaque. Both OpenAI Five and AlphaStar played at superhuman levels with no ability to explain their decisions. The same property that made PPO scale — run more environments, trust the gradient, let it find what works — also means the outcome is a black box. You get performance without understanding.

---

*Further reading for both sections: [The 37 Implementation Details of PPO](https://iclr-blog-track.github.io/2022/03/25/ppo-implementation-details/) (ICLR Blog Track) for the gap between theory and working implementation; [Policy Gradient Algorithms](https://lilianweng.github.io/posts/2018-04-08-policy-gradient/) (Lil'Log) for the full derivation chain from REINFORCE through TRPO to PPO; [PPO for LLMs: A Guide for Normal People](https://cameronrwolfe.substack.com/p/ppo-llm) (Cameron Wolfe) for the RLHF mapping in detail.*
