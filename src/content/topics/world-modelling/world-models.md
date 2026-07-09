---
title: World Models
description: Learned environment models that let agents predict, plan, and learn from imagined futures.
author: N00bcak
difficulty: intermediate
category: world-modelling
domains: ["reinforcement-learning", "model-based-rl", "representation-learning"]
tags: ["latent-dynamics", "planning", "imagination", "model-bias"]
prerequisites: ["neural-networks", "q-learning"]
citations:
  - title: "World Models"
    url: "https://arxiv.org/abs/1803.10122"
  - title: "Learning Latent Dynamics for Planning from Pixels"
    url: "https://proceedings.mlr.press/v97/hafner19a.html"
  - title: "Dream to Control: Learning Behaviors by Latent Imagination"
    url: "https://openreview.net/forum?id=S1lOTC4tDS"
  - title: "Mastering Diverse Domains through World Models"
    url: "https://arxiv.org/abs/2301.04104"
  - title: "Mastering Atari, Go, Chess and Shogi by Planning with a Learned Model"
    url: "https://www.nature.com/articles/s41586-020-03051-4"
---

## Overview

In reinforcement learning, an agent repeatedly chooses actions and receives observations and rewards from an environment. The central question is: how can the agent improve its behaviour from that experience?

**Model-free RL** learns the behaviour directly. For example, [[q-learning|Q-Learning]] estimates how good each action is, without first learning a simulator of the environment.

**Model-based RL** learns or uses a model of the environment, then uses that model to plan or train. A **world model** is the learned part of this pipeline: it predicts how the world changes when the agent acts.

Given a current state $s_t$ and action $a_t$, a world model predicts quantities such as the next state, reward, or whether the episode continues:

$$
p_\theta(s_{t+1}, r_t, c_t \mid s_t, a_t)
$$

where $c_t$ is a continuation signal. The agent can then ask counterfactual questions like: "what would happen if I took this action instead?"

The motivation is sample efficiency. If real interaction is expensive, as in robotics or long-horizon games, it is useful to learn from imagined rollouts before spending more real environment steps.

## Latent Dynamics

Modern world models usually avoid predicting raw pixels at every step. They first compress observations into latent states, then learn dynamics in that latent space:

$$
z_t = e_\phi(x_t), \qquad z_{t+1} \sim p_\theta(z_{t+1} \mid z_t, a_t)
$$

This makes planning cheaper because the agent rolls out compact representations rather than full images. [Learning Latent Dynamics for Planning from Pixels](https://proceedings.mlr.press/v97/hafner19a.html) made this idea practical for visual control by learning a recurrent latent dynamics model and planning inside it.

Later systems such as [Dream to Control: Learning Behaviors by Latent Imagination](https://openreview.net/forum?id=S1lOTC4tDS) use the same basic idea differently: instead of searching for actions at every step, they train an actor and critic on imagined latent trajectories.

## Planning and Imagination

World models can be used in two common ways:

- **Planning**: search over possible future action sequences and choose the action with the best predicted return.
- **Imagination**: train a policy or value function on imagined latent rollouts instead of querying the real environment every time.

[Mastering Atari, Go, Chess and Shogi by Planning with a Learned Model](https://www.nature.com/articles/s41586-020-03051-4) shows another design: the model does not try to reconstruct observations. It predicts the quantities needed for tree search, such as reward, policy, and value.

This is why "world model" does not always mean "video generator". In RL, the model only needs to be useful for choosing actions.

## Taxonomy

World models differ mainly in what they model and how they are used.

- **Pixel-space models** predict future images directly. They are visually interpretable, but expensive and unstable over long horizons.
- **Latent models** predict compact hidden states. This is the standard choice in many model-based RL systems because rollouts are fast.
- **Token or transformer models** discretise observations into tokens and learn sequence dynamics, making world modelling closer to language modelling.
- **Diffusion and foundation world models** aim for richer visual fidelity and broader interactive simulation, but are usually heavier than compact latent models.

The key tradeoff is abstraction versus fidelity. A highly compressed latent may drop details that matter for control, while a detailed generative model may be too expensive for fast planning.

## Landmark Methods

| Paper | Year | Idea + Mechanism |
| --- | ---: | --- |
| [World Models](https://arxiv.org/abs/1803.10122) | 2018 | Train a controller inside a compressed latent world built from a VAE and recurrent dynamics. |
| [Learning Latent Dynamics for Planning from Pixels](https://proceedings.mlr.press/v97/hafner19a.html) | 2019 | Plan online in recurrent latent states instead of rolling out full images. |
| [Dream to Control: Learning Behaviors by Latent Imagination](https://openreview.net/forum?id=S1lOTC4tDS) | 2020 | Train an actor and critic from imagined trajectories in a latent world model. |
| [Mastering Atari, Go, Chess and Shogi by Planning with a Learned Model](https://www.nature.com/articles/s41586-020-03051-4) | 2020 | Use tree search over a model that predicts reward, policy, and value. |
| [Mastering Atari with Discrete World Models](https://openreview.net/forum?id=0oabwyZbOu) | 2021 | Use discrete latents to scale Dreamer-style imagination learning to Atari. |
| [Mastering Atari Games with Limited Data](https://openreview.net/forum?id=OKrNPg3xR3T) | 2021 | Improve MuZero-style tree search for low-data Atari learning. |
| [Temporal Difference Learning for Model Predictive Control](https://proceedings.mlr.press/v162/hansen22a.html) | 2022 | Combine short-horizon latent MPC with a learned terminal value. |
| [IRIS: Transforming Auto-regressive Models into World Models](https://arxiv.org/abs/2209.00588) | 2022 | Treat visual dynamics as autoregressive token prediction for synthetic rollouts. |
| [Mastering Diverse Domains through World Models](https://arxiv.org/abs/2301.04104) | 2023 | Use a robust Dreamer-style recipe across many domains with fixed hyperparameters. |
| [DIAMOND: Diffusion as a Model of Environment Dreams](https://arxiv.org/abs/2405.12399) | 2024 | Train agents inside diffusion-generated worlds to preserve visual detail. |

The progression is not just chronological. It shows three recurring choices: whether to model pixels or latents, whether to plan online or train a policy offline, and whether the model should predict the whole observation or only planning-relevant quantities.

## Model-Based vs Model-Free Tradeoffs

Model-based methods often need fewer real environment interactions, because they reuse experience through planning or imagined training. The cost is that they must learn a model, and the policy can fail if the model is wrong.

Model-free methods are usually simpler at decision time. Once a value function or policy has been learned, action selection can be cheap. The cost is that they may require many real interactions, because they do not get extra training signal from imagined futures.

## Limitations

World models are powerful because they trade real environment interaction for model learning. This creates characteristic failure modes:

- **Compounding error**: small prediction mistakes grow over long imagined rollouts.
- **Model exploitation**: the policy may find actions that exploit model errors instead of solving the real task.
- **Representation collapse**: the latent state may omit information needed for reward or control.
- **Planning latency**: online search can be too slow for real-time decisions.

In practice, strong systems use short or moderate rollout horizons, regularised latent spaces, value-aware objectives, or uncertainty estimates to reduce these errors.

## Related Topics

World models are built using [[neural-networks|Neural Networks]] and are part of model-based reinforcement learning. They are often compared with model-free methods like [[q-learning|Q-Learning]], which learn values directly from environment interaction.
