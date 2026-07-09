---
title: Q-Learning
description: Model-free reinforcement learning algorithm that learns optimal action-value functions.
author: Praneeth-Suresh
updatedDate: "2026-06-24"
difficulty: intermediate
category: reinforcement-learning
domains: ["reinforcement-learning", "control"]
tags: ["bellman-equation", "temporal-difference", "exploration", "optimisation"]
prerequisites: ["gradient-descent"]
citations:
  - title: "Reinforcement Learning: An Introduction – Sutton & Barto"
    url: "http://incompleteideas.net/book/the-book-2nd.html"
---

## Overview

Q-Learning iteratively estimates the optimal action-value function via the Bellman update:

$$Q(s, a) \leftarrow Q(s, a) + \alpha\left[r + \gamma \max_{a'} Q(s', a') - Q(s, a)\right]$$

## Exploration vs Exploitation

$\epsilon$-greedy balances exploration with exploitation: take a random action with probability $\epsilon$, otherwise act greedily.

## Related Topics

Q-Learning is optimised using ideas from [[Gradient Descent]] and extended by deep Q-networks built on [[Neural Networks]].
