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
  - title: High-Dimensional Continuous Control Using Generalized Advantage Estimation
    url: https://arxiv.org/abs/1506.02438
  - title: Training language models to follow instructions with human feedback
    url: https://arxiv.org/abs/2203.02155
  - title: "DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models"
    url: https://arxiv.org/abs/2402.03300
  - title: "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning"
    url: https://arxiv.org/abs/2501.12948
  - title: Let's Verify Step by Step
    url: https://arxiv.org/abs/2305.20050
  - title: "SAPG: Split and Aggregate Policy Gradients"
    url: https://arxiv.org/abs/2407.20230
  - title: Asymmetric Actor Critic for Image-Based Robot Learning
    url: https://arxiv.org/abs/1710.06542
  - title: "Isaac Gym: High Performance GPU-Based Physics Simulation For Robot Learning"
    url: https://arxiv.org/abs/2108.10470
  - title: Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World
    url: https://arxiv.org/abs/1703.06907
  - title: "Open X-Embodiment: Robotic Learning Datasets and RT-X Models"
    url: https://arxiv.org/abs/2310.08864
  - title: Learning by Cheating
    url: https://arxiv.org/abs/1912.12294
  - title: Emerging Properties in Self-Supervised Vision Transformers (DINO)
    url: https://arxiv.org/abs/2104.14294
  - title: "PPO for LLMs: A Guide for Normal People"
    url: https://cameronrwolfe.substack.com/p/ppo-llm
  - title: Sisyphus by Titian (via Wikimedia Commons)
    url: https://commons.wikimedia.org/wiki/File:Titian_-_Sisyphus_-_Madrid_-_Prado.jpg
---


Welcome to the corpus entry for PPO! As a general rule, I will be glossing over a decent amount of foundation you typically see in many of those 'intros to RL' that you see plenty of. Those usually build up to PPO by starting with MDP/POMDP problem formulations, then going into Q tables and Q learning, then onto the RL and policy side of things. We will do less of such steps here since, yknow, those already exist in other corpus entries, or if they dont, you can always refer to those youtube videos. 

What we will do instead, is take a deeper dive into PPO, why its formulated the way it is, why it works well in industry, and what are some problems with it. Expect us to snipe at other general concepts too (that may have already been described in the corpus); understanding the mechanics of PPO is nice, but zooming out is its own thing entirely. I mean, if you're reading about PPO, you've likely covered or abstracted away most of the theory, and are ready to start implementing some flavour of RL solution to your problem, right? So here you go, problems and RL and a little bit of PPO!

## Proximal Policy Optimization

### The problem with policy gradients

Once again, we assume you know the prerequisites: namely, the Policy Gradient theorem, Bellman Optimality Equation. Then you probably also know about the general problem Policy Gradients in general face. In a dynamic, noisy environment that changes both in and not in accordance with the system we're controlling, if we're learning based off sampled trajectories that generate our estimated gradients. And, if these are noisy, one unlucky large parameter update may move the policy into a poor region.

"Poor" being that since RL has that *neatly annoying quirk* where the data we train on is what the policy collects, a bad, nasty, degraded policy collects worse trajectories, producing worse gradient estimates, degrading the policy further. That's, like, bad! Thus, we aim to control "step size", that is, how far we move in parameter space per gradient step. This motivates TRPO and its spiritual successor, PPO.

### TRPO

First, denote the probability ratio between old and new policies as: 

$$
\Large 
r_\theta = \frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_\text{old}}(a_t|s_t)}
$$

This ratio is the **surrogate objective**: the thing both TRPO and PPO actually maximize. Without it, you'd need to run the candidate policy $\pi_\theta$ in the environment to collect fresh trajectories every single gradient step, since $J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}[R(\tau)]$ requires on-policy samples. Instead, $r_\theta$ is an importance sampling correction. It reweights trajectories already collected under $\pi_{\theta_\text{old}}$ to estimate how $\pi_\theta$ would have performed, letting you take multiple gradient steps on the same batch of data. (catch is that importance sampling is only reliable when the two distributions are close. drift too far and the reweighting becomes inaccurate. This is exactly the constraint both algorithms enforce, just in different ways)

For TRPO in particular, the paper is dense with many different formulations and theories about *monotonic improvement guarantees* and *Fisher information matrices as the metric for measuring constraint curvature*. Thats a whole lotta words! You should go read it yourself if you are a supreme math nerd, but to keep it (much) simpler, for both, they tackle the above fundemental problem: catastrophic policy updates. Fundementally, TRPO uses a Kullback-Leibler (KL) Divergence to constrain the size of updates to the policy:

$$
\Large
\text{maximize}_\theta \quad \hat{\mathbb{E}}_t
\left[r_\theta\hat{A}_t\right]
\quad \text{subject to} \quad D_{KL}\!\left(\pi_{\theta_\text{old}} \,\|\, \pi_\theta\right) \leq \delta
$$


(just in case you need a recap: KL divergence is a measure of two distribution's dissimilarity. The abstracted understanding you need without math is just: how different is the old vs new policy)

However, we're currently abstracting a whole lot of complicated math around computing the Fisher information matrix (curature of KL constraint in parameter space) then running the conjugate gradient to find the update direction, then a line search to verify the constraint is satisfied before commiting the step.

...what?

Okay, all of this is pretty much second-order computation that aims to guarantee monotonic improvement. That's very nice and mathemdatically sound, but:

- **a.** it's hard to understand (which is why we're placing TRPO in a separate corpus document (or maybe not at all)), and
- **b.** the update step isn't parallelizable. And you know that's a cardinal sin in deep learning.

### PPO

PPO takes the less mathematically rigorous but far more scalable approach of standard backprop on the clipped objective. Its updates are only first order, like pretty much all neural network training that has worked well empirically!

The "Proximal" term in PPO comes from optimization theory: proximal methods are optimization techniques that handle constraints by staying close to a reference point. That pretty much motivates what comes next: instead of the hard KL constraint from TRPO, PPO imposes an $\varepsilon$-band around the ratio, clipping it to stay within $[1-\varepsilon, 1+\varepsilon]$: 

$$
\Large
L^{\text{CLIP}}(\theta) = \hat{\mathbb{E}}_t\!\left[\min\!\left(r_\theta\hat{A}_t,\; \text{clip}(r_\theta,\, 1-\varepsilon,\, 1+\varepsilon)\,\hat{A}_t\right)\right]
$$

...wow! That is a lot simpler! And, as Spiderman once said, with great simplicity comes less responsibility, or something like that. Simplicity over Supreme Mathematical Niceness (as in TRPO) here actually has many real practical consequences. Let's unpack what the clip is doing, then why the simplicity matters at scale.

The objective is **pessimistic by construction**. Tracing through the two cases:

- **Good action** ($\hat{A}_t > 0$): if the new policy is already $1+\varepsilon$ times more likely to take this action than the old one, the clipped term caps the objective, and the gradient goes to zero. This makes sense: the policy has taken enough credit for this update, and pushing the ratio higher doesn't improve the objective.
- **Bad action** ($\hat{A}_t < 0$): if the ratio has already fallen to $1-\varepsilon$, the action was penalised enough, and the gradient cuts out.

In both cases the clip stops rewarding further movement once the policy has drifted far enough. The difference from TRPO is that this is a soft barrier: there is no formal guarantee that $r_\theta$ won't exceed those bounds, just that there's no incentive to. So yeah, not as much mathematical rigour, but that's Good Enough™

<figure style="text-align: center; display: flex; flex-direction: column; align-items: center">
  <img src="/images/ppo-clip-behavior.png" alt="Two plots of the clipped objective: for a positive advantage the objective flattens once the probability ratio passes 1+epsilon; for a negative advantage it flattens once the ratio drops below 1-epsilon">
  <figcaption>
  leave the ε-band and the gradient dies for both good action (positive advantage) or bad (negative) alike.
  </figcaption>
</figure>

So, is this simpler 'clipping' idea all that made PPO successful? Not necessarily: there are other factors too.

#### Parallelism and scale

A key shift that has significantly accelerated RL is the GPU boom of the 2010s: it became feasible to run thousands of environment instances simultaneously, each collecting trajectories in parallel. This is something that favours PPO's on-policy nature. Briefly, "on-policy" refers to an approach that only trains the *current* policy on data that it collected, whilst "off-policy" is the counterpart that trains it on data gathered in the past too. We formally call the storage of such data a "replay buffer". The argument for the latter is simple: Again, because RL's *neatly annoying quirk* of only training on the data the system gathers, anything gathered can only be used once (a datapoint is kind of a 'snapshot' of a particular state, action and policy that enacted that action). So unlike a static dataset in traditional ML/DL practice, we have poor sample efficiency

Off-policy methods (SAC, DQN) use replay buffers good for sample efficiency, but old data becomes increasingly misrepresentative as the policy updates. Managing that staleness requires extra machinery and complexity: prioritized replay, age-based eviction, careful buffer sizing, all whilst we try to optimize for parallelism. 

To be precise about why off-policy can't keep pace here: maintaining a healthy UTD ratio with thousands of parallel environments means thousands of gradient updates per step, each pulling a fresh minibatch from the replay buffer. Within each of those batches, only roughly $1/D$ of transitions are freshly collected, where $D$ is the buffer depth in episodes, the rest are aging samples from past policies. Increasing batch size doesn't fix this since a larger uniform sample still contains the same stale fraction. Beyond a certain scale, replay buffers also breach RAM limits, and random-access patterns (especially with prioritized replay) introduce per-update CPU to GPU transfer latency that GPU-simulated on-policy rollouts simply don't pay.

With PPO, there's no such overhead or complexity in buffer choice. Every parallel environment is running the current policy, so every trajectory is immediately usable training data. More environments leads to more diverse state coverage and better gradient estimates (a thought here: what happens if we have so many environments until our sampling becomes incredibly comprehensive and covers the whole distribution of state trajectories under our *current* policy? [SAPG](#when-more-environments-stop-helping) down in the robotics section has a proposal, but more on that later)

A key idea here that I learnt from my Odyssey mentor: Sample efficiency is one thing, but Wall-Clock efficency is another. In applied research and production, you almost always have a fixed time budget, but (thanks to the amazing advancements in parallelism) not so much a fixed sample budget! Even ignoring the stale data problem and assuming SAC and TD3 (other off-policy methods) can reach the same goal in, say, 10 million samples, where PPO needs 100 million, if the overhead for off-policy is much higher e.g 2 hours versus PPO e.g 10 minutes, its clear which is better.


#### Hyperparameter tuning (or the relative lack thereof)

Classic RL has a reputation for being a nightmare to tune. DQN needs careful choices of replay buffer size, target network update frequency, and learning rate. SAC has a temperature parameter $\alpha$ for entropy. DDPG is famously brittle in continuous control.

PPO is relatively robust by comparison. The clip ratio $\varepsilon = 0.1$ or $0.2$ works well across a huge range of tasks without much search. The clip itself acts as implicit learning rate regulation, so gradient steps that would push the policy too far get pruned by the objective, so the effective update size is bounded regardless of what your optimizer does.

The other parameters that typically matter in practice:

- **Epochs per rollout** (typically 4–10): too many and you violate the importance sampling assumptions the surrogate relies on, but too few and collected data is wasted.
- **Entropy coefficient**: directly controls how much the policy is encouraged to stay stochastic. This needs domain tuning, since what works for Atari is wrong for continuous robotics control.
- **GAE $\lambda$** ([generalized advantage estimation](https://arxiv.org/abs/1506.02438)): affects the bias-variance tradeoff in advantage estimation. Usually left at 0.95 but can matter on long-horizon tasks.

These are the reasons [INSERT TITLE CARD HERE] (haha, i did it): it works well, it scales well, and it has a nice sounding name! Now, there are nuances in its application across various domains, which we will subsequently cover. Note that these will not necessarily be about PPO, perhaps more so some applied RL nuances as I described at the start of the article.

## PPO in LLMs

"Making language models bigger does not inherently make them better at following a user’s intent. For example, large language models can generate outputs that are untruthful, toxic, or simply not helpful to the user. In other words, these models are not aligned with their users." - Ouyang et al. (2022), in [InstructGPT](https://arxiv.org/abs/2203.02155), considered the landmark paper of RLHF. We should have a corpus article on RLHF, but in case we don't here are some shallow details.

Reinforcement Learning from Human Feedback is the training stage that turns a pretrained LLM into something arguably far more helpful (next-token prediction on internet text may not necessarily to helpful to humans specifically after all, given... its **the internet**). Whilst Supervised Fine-Tuning (SFT) improves things, its fundementally bounded by behaviours you can record and write down, and the model may simply learn to imitate them without any feedback signal about whether it's achieving the underlying goal. A better framing instead would be to imagine an environment or playgorund, where the model should maximize some metric of "helpfulness" or "safety" in a sequential decision process. Thats pretty MDP pilled, so we can use RL for that! 

Note the abuse of language you typically observe in Deep Learning literature: the same applies here where the same fundemental concept is called something far different depending on the domain, oh what fun. "Policy" is the language model, the "State" is the prompt plus all tokens generated so far, the "Action" corresponds with the LLM's output: whether that is the individual token or the entire completion is a specific semantic (MDP vs Bandit formulation). As for rewards, in the RL toy examples you play with in a Youtube or Huggingface tutorial, you'd imagine a task-sepcific reward function. In RLHF, it's a model trained on human preferences (creating a handcrafted reward function for human preferences is rather challenging of course). termed the Reward model (RM).

<figure style="text-align: center; display: flex; flex-direction: column; align-items: center">
  <img src="/images/rl-llm-terminology-mapping.png" alt="Diagram mapping reinforcement learning terms to their LLM equivalents: policy to LLM, initial state to prompt, action to token, state to prompt plus generated tokens, trajectory to full completion, reward to reward-model score">
  <figcaption>
  abuse of language
  </figcaption>
</figure>

Okay hm since this isn't an RLHF corpus entry I won't go into too much detail, but there are some helpful notes here to think about. Perhaps you can see these points and maybe generalize it to whatever you're building, if you are applying PPO somewhere. Or maybe not IDK, since frankly the subsequent sections are even more general beyond a specific RL architecture. What can you really comment about PPO if it just works well a lot of the time?

###  Clipping

Generating completions from an LLM is expensive, since each token requires a full autoregressive forward pass. In plain policy gradient (REINFORCE), you'd need fresh completions every gradient step, since using old data without correction gives biased gradients. By bounding how far the policy can drift from where it was when the batch was collected, PPO can safely run several epochs of gradient updates on the same set of completions. In LLM training this matters, since a single rollout of 512+ tokens from a large model takes real wall-clock time. It all comes back to that again I suppose :D

### The idea of a critic

In toy RL cases, the critic need only be a small model mapping state to a value scalar. But in RLHF, that's... has to be another LLM, which essentially doubles your memory footprint during training. Not good! Additionally, the critic can overfit or diverge independently of the actor, destabilizing training; if the backbone is shared the gradients from value loss and policy loss compete; and you're essentially tuning two models simultaneously.

<figure style="text-align: center; display: flex; flex-direction: column; align-items: center">
  <img src="/images/value-vs-reward-model.png" alt="Comparison: the value model (critic) predicts a value at every token on partial sequences, while the reward model outputs a single score only for the complete sequence">
  <figcaption>
  The critic (value model) scores every partial sequence token-by-token; the reward model only judges the finished one — the per-token second LLM GRPO decides to skip.
  </figcaption>
</figure>

So what the amazing folks at DeepSeek did, in [the landmark paper in Jan 2025](https://arxiv.org/abs/2501.12948) that sent waves across the AI field and alo the stock market, was the idea of GRPO (well technically the [idea itself first showed up a year earlier in DeepSeekMath](https://arxiv.org/abs/2402.03300), but R1 is what made the world actually care). They brought back the bandit formulation under it, with one reward $R(x, y)$ at the end, no value function (critic), no per-step signal, and no GAE. The Advantage is instead a scalar at the sequence level, applied uniformly across every token:

$$\nabla_\theta J = \hat{\mathbb{E}}_t\!\left[\hat{A}(x, y) \cdot \sum_{t=1}^T \nabla_\theta \log \pi_\theta(a_t \mid s_t)\right]$$

GRPO computes this scalar via group-relative normalization: sample $G$ completions per prompt, score each with the RM, normalize within the group:

$$\hat{A}^i = \frac{r^i - \mu_\mathbf{r}}{\sigma_\mathbf{r}}$$

so group's own reward distribution is the baseline, with no critic required! The PPO-Clip objective still applies token-by-token, but every token in completion $i$ carries the same advantage $\hat{A}^i$, regardless of where in the sequence it appeared.

Whilst the MDP formulation is theoretically more powerful, in that per-token advantages may let the model identify _where_ in a sequence things went right or wrong, this is harder to realize that it sounds. If you think about it, the RM only runs per response, so rewards are scarce and you have to pray [GAE](https://arxiv.org/abs/1506.02438) does its thing well. The only per-step signal is the KL-penalty (used to regularize our current policy against a pretrained baseline) which is small by design. Thus, you really are trying to predict "how good the remaining trajectory is, given what's been said so far". So yeah, the value function will be noisy, meaningfully limitting the credit assignment they actually provide. What GRPO does is a pretty reasonable substitute that comes with a pretty sweet discount!

### How to reward conversations?

Because yeah, sometimes trying should be well rewarded! And since our chatbots try so hard when doing their reasoning/thinking for even more complex reasoning tasks, it opens a bigger question of process rewards vs outcome rewards. A process reward model (PRM), explored by OpenAI in ["Let's Verify Step by Step"](https://arxiv.org/abs/2305.20050) (2023), while requiring much more expensive labelling, did move closer to the MDP ideal of reasoning tasks.

Credit assignment in school: If you answer a 10 mark math question wrongly, but 8 of 10 of your steps are correct, you'd expect to be dispensed 8 working marks. If we penalized only by outcome, you'd get zero sadly. The same idea applies for reasoning tasks we throw at LLMs. Thankfully, verifiable domains like code execution or math proofs are the greatest successes here, so you can thank PRMs for threatening your chances of getting a job in software!


## PPO in Robotics

The robotics application has a different flavor, since the physical hardware is slow and expensive to obtain and mutate, and likely will break (remember: robots hate you). For the tasks PPO still owns outright, legged locomotion and whole-body control most of all, the dominant pipeline is: train entirely in simulation, then deploy on real hardware. This is termed **sim2real**, since, yknow, simulation to real world is how we're doing things. Is this the actual overall paradigm still? [Now thats a question for later.](#is-sim-to-real-even-still-the-paradigm).

### First, sim2real

The challenge is that simulated physics never perfectly matches the real world: friction coefficients are off, motor models are simplified, sensors are cleaner than in practice. A policy that exploits specific simulated dynamics is not going to properly generalize to the real world.As you might then anticipate, the standard fix is **[domain randomization](https://arxiv.org/abs/1703.06907)**: each episode, physics parameters (mass, friction, motor gain, actuator delay) are randomly sampled from a range wider than the expected real-world variation. 

Without one single set of dynamics, the policy must learn behavior robust across the distribution. You might then reasonably imagine that this works best with fresh data, since you want the current policy parameters to be evaluated and learning across the current randomized dynamics, not stored transitions from past policies with past randomization parameters. Being on-policy is nice and cool now, since replay buffers would mix trajectories from different physics configurations in ways that are hard to correct for.

### When more environments stop helping

Remember that thought in [Parallelism and scale](#parallelism-and-scale)? "What if we crank the environment count so high that our samples basically cover the whole state distribution under the current policy?"

Past a certain point, increasing environments fail to scale perf. [SAPG (Singla, Agarwal & Pathak, 2024)](https://arxiv.org/abs/2407.20230) shows PPO's performance flat-lining even with **24,576** parallel environments, roughly two orders of magnitude past where most people develop. I mean think about it: at each step, actions are drawn from a single Gaussian $\mathcal{N}(\mu_\theta(s), \sigma_\theta(s))$. Sample from one unimodal blob 24,000 times over and the overwhelming majority of draws land near the mean. 

So past some point our comprehensive coverage starts becoming *redundant* coverage: thousands of environments re-running near-identical actions and handing back near-duplicate transitions. Fix a state and look at the $N$ actions your environments propose, $a_i \sim \mathcal{N}(\mu_\theta, \sigma_\theta^2)$, one per environment. Two things scale with $N$, at wildly different rates. Gradient noise, the thing more samples is supposed to buy down, shrinks proportional to inverse sqrt of $N$:

$$\operatorname{std}(\hat{g}_N) \;\propto\; \frac{1}{\sqrt{N}},$$

the usual Monte-Carlo rate. But how far you actually *reach* into the action space, the most extreme action you're ever likely to even try, grows like the extreme value of a Gaussian sample:

$$\mathbb{E}\!\left[\max_i a_i\right] \;\approx\; \mu_\theta + \sigma_\theta\sqrt{2\ln N}.$$

That $\sqrt{2\ln N}$ is the whole tragedy. Exploration reach scales with the square root of the *log* of the environment count — which is to say, basically not at all. Going from $24{,}576$ environments to $100{,}000$ nudges the frontier from about $4.5\sigma$ to $4.8\sigma$: you 4×'d the compute for $0.3\sigma$ of new ground. Want to double the reach to $9\sigma$? You'd need on the order of $10^{17}$ environments. Everything in between is just more density piling into the same central bump (which does grow linearly in $N$ — hence redundant, not comprehensive). So once you have enough environments to kill the gradient noise, exploration is the binding constraint, and $N$ is powerless against it.



Note this is kind of the flip side of the on-policy story from earlier: on-policy is great because every trajectory is fresh and immediately usable, but "fresh" aint the same as "diverse". One policy following only one Gaussian only explores so many ways at once. One must consider sisyphus happy.

<figure style="text-align: center; display: flex; flex-direction: column; align-items: center">
  <img src="/images/sisyphus.jpg" alt="Titian's painting of Sisyphus straining to carry an enormous boulder up a dark mountain" style="max-width: 420px; width: 100%">
  <figcaption>
  me when trying more only makes me converge to the norm
  </figcaption>
</figure>

SAPG's fix is to manufacture the diversity the single Gaussian won't. Split the 24,576 environments into $M = 6$ chunks of 4,096, and let each chunk run a slightly different **follower** policy (a shared backbone plus a small per-chunk parameter vector, with a dash of entropy regularisation to stop the followers collapsing onto each other). Now you've got six genuinely distinct explorers. A single **leader** then learns from all of them at once: its own on-policy batch, *plus* the followers' trajectories folded in as off-policy data. And how do you reweight data one policy collected to train a different one? The importance-sampling ratio $r = \pi_{\text{leader}} / \pi_{\text{follower}}$: the exact same trick from the [surrogate objective](#trpo) at the very top of this article, just applied across sibling policies instead of across time.

Which is a fun bit of irony to sit with. PPO's pitch was kind of "on-policy, no replay buffer, no staleness to babysit". The way you scale it *past* saturation turns out to be carefully letting a controlled amount of off-policy data back in through the side door. But like, PPO's still ma goat yknow

### Letting the critic cheat?

Recall that in the typical implementation of Actor-Critic, the critic is a training-time-only object: it estimates the value function so you can compute advantages $\hat{A}_t$, and then it gets thrown away, and we ship the robot with the actor alone. Poor critic!

Anyways so why feed it the same impoverished, noisy sensor stream the actor is stuck with? In simulation you have the ground truth sitting right there for free, with exact object poses, contact forces, the true base velocity, and the actual friction, mass, and motor-gain values that domain randomization just sampled this episode. **Asymmetric actor-critic** (Pinto et al., 2017) does exactly this: the actor gets the deployable observation (noisy, partial, on-board), while the critic drinks straight from the full simulator state. This is one face of a much more general idea — and if the phrase *teacher-student* is ringing bells, that's exactly the connection.

The recipe even has a name: **learning with privileged information** — give one network an easier job during training, then throw that advantage away at deployment. Robotics usually spells it out as an explicit teacher-student pipeline: train a privileged *teacher* on the full ground-truth state (the CARLA driving classic is literally called *[Learning by Cheating](https://arxiv.org/abs/1912.12294)*), then distill it into a *student* that only sees deployable sensors. Asymmetric actor-critic is the leaner, single-phase cousin — no separate teacher, no distillation stage; you just privilege the *critic* inside the one training run and let the actor learn directly. The parallel I find neatest, though, is in self-supervised learning: [DINO](https://arxiv.org/abs/2104.14294) and friends run a teacher and a student on *different views* of the same image — the teacher fed only the large global crops, the student mostly small local ones — and train the student to match the teacher's fuller representation. Same shape each time: a partner with better access, used purely to manufacture a training signal. Where it *doesn't* carry over is LLM distillation — that's teacher-student too, but there the teacher's edge is raw **capacity** (a big model handing soft labels to a small one), not privileged information. Different axis of asymmetry entirely, so don't conflate the two.

Why it helps: the critic's job is to act as a proxy for the unobtainable reward model, and analyse "how good is this state, really?", and is enormously easier with ground truth than with noisy, partial observations. Force a critic to value a state through the same foggy sensors the actor uses and it's partly guessing at a state it can't fully see; that noise flows straight into the advantage estimates and jitters every PPO update. A sharp, privileged critic gives you low-variance advantages, so the actor learns faster and more stably — all without making the actor one bit less deployable. And it composes beautifully with the domain-randomization story from earlier: the actor is forced to become robust to physics it *can't observe*, while the critic is quietly allowed to observe exactly that physics to keep its value estimates honest. (OpenAI's in-hand Rubik's-cube work leaned on this, and it's close to standard in serious sim-to-real setups now.)

That's the flavour of "PPO-specific" worth having: it isn't a hyperparameter, it's a structural affordance. The critic being disposable is precisely what makes cheating with it free.

### Entropy collapse

The other continuous-control-specific issue worth calling out. As we just saw, actions here are continuous (joint torques, end-effector velocities), so the policy is that same Gaussian $\pi_\theta(a|s) = \mathcal{N}(\mu_\theta(s), \sigma_\theta(s))$ — and it has one more way to bite you. PPO's clipped objective can cause the standard deviation $\sigma_\theta$ to shrink too aggressively, so the policy becomes deterministic faster than it should, killing exploration before the task is learned. The entropy coefficient in the loss directly penalizes low entropy, but the right value is task-dependent. Too high and the policy never commits to anything; too low and it collapses prematurely to a degenerate solution.

### The KL constraint sneaks back in

One loose thread from the [tuning section](#hyperparameter-tuning-or-the-relative-lack-thereof): I claimed the clip acts as "implicit learning rate regulation" and that PPO mostly frees you from babysitting the optimizer. Mostly. The one knob the standard robotics stack (Isaac Gym with rl_games, and now Isaac Lab) *does* adapt online is — of all things — the learning rate, and it adapts it off the measured KL between the old and new policy. Each update you check $D_{KL}(\pi_{\theta_\text{old}} \,\|\, \pi_\theta)$ against a target (around $0.01$): if the policy moved too far (KL above roughly $2\times$ target), shrink the learning rate by ~1.5×; if it barely budged, grow it by the same factor.

Sit with what that is for a second. We opened this whole article with TRPO enforcing a hard KL constraint, called it mathematically lovely but unscalable, and watched PPO throw it out for a cheap first-order clip. And here, at the largest scale anyone actually runs PPO, the KL constraint quietly climbs back in through the window — not as a trust region this time, just as a thermostat on the learning rate. The clip handles per-sample drift; the KL-scheduled learning rate handles aggregate drift across the whole batch. Turns out you *did* want to bound how far the policy moves per step after all — PPO just took the scenic route back to admitting it. 🙂


### Is sim-to-real even still the paradigm?

Since the intro promised we'd snipe at adjacent stuff: the honest answer is that it depends hard on the task, and the split is the interesting bit. For **locomotion** — legged robots, humanoids, whole-body control — sim-to-real RL is still the undisputed champ, and PPO sits right at the center of it. Ground contact is cheap to simulate, the reward is easy to write ("don't fall over, go that way"), and you can burn billions of simulated steps overnight. This is PPO's home turf and it isn't going anywhere.

For **general manipulation** (grabbing arbitrary objects, contact-rich dexterity in the messy real world) the story flipped around 2023. Contact and deformables are brutal to simulate faithfully, and it turns out you can just... collect human teleoperation demos and do plain supervised **behavioural cloning** — imitate the demonstrator, no reward function required. A decent policy from 50–500 demos gathered in an afternoon beats millions of environment steps, and that's what powers the modern wave of Diffusion Policy, ACT, and Vision-Language-Action models ([Open X-Embodiment / RT-X](https://arxiv.org/abs/2310.08864) being the flagship "just pool everyone's robot data" effort). The bottleneck moved from *compute* to *data* — which is exactly what NVIDIA's Jim Fan is pointing at with his "[data pyramid](https://inferencebysequoia.substack.com/p/the-physical-turing-test-jim-fan)": scarce, precious real teleop data at the apex ("human fuel"), a fat middle layer of simulation, and a broad base of internet human video for physical common sense.

But this isn't a PPO obituary, for two reasons. First, most of that manipulation wave is *supervised* BC, not RL at all — so it isn't really competing with PPO so much as living in a different box. Second, pure cloning has a nasty failure mode: it only ever saw expert states, so the moment it drifts off the demonstrated distribution the errors compound and it has no idea how to recover. The increasingly standard fix is to bolt an RL post-training stage (often PPO-flavoured) on top, letting the policy actually explore and self-correct past the demos — the same move RLHF pulls on a pretrained LLM, funnily enough. So PPO is less "left behind" than "moving up the stack": from training the whole policy to polishing the one imitation handed you. Anyway — for the sim-to-real slice PPO *does* own, the scaling behaviour is where it gets genuinely interesting, so let's get back to that.