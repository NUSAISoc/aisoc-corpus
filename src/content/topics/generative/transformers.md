---
title: Transformers
description: Self-attention-based sequence models that power modern LLMs and vision models.
author: Praneeth-Suresh
updatedDate: "2026-06-24"
difficulty: advanced
category: generative
domains: ["deep-learning", "nlp", "attention"]
tags:
  [
    "self-attention",
    "positional-encoding",
    "optimisation",
    "sequence-modelling",
  ]
prerequisites: ["neural-networks"]
citations:
  - title: "Attention Is All You Need – Vaswani et al."
    url: "https://arxiv.org/abs/1706.03762"
---

## Overview

The Transformer architecture replaces recurrence with **multi-head self-attention**:

$$\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V$$

## Multi-Head Attention

Multiple attention heads capture different relationship patterns:

$$\text{MultiHead}(Q,K,V) = \text{Concat}(\text{head}_1, \ldots, \text{head}_h)\mathbf{W}^O$$

## Positional Encoding

Since self-attention is permutation-equivariant, positional information is injected:

$$PE_{(pos, 2i)} = \sin\!\left(\frac{pos}{10000^{2i/d}}\right)$$

## Related Topics

Transformers build on [[Neural Networks]] and use [[Gradient Descent]] for training. They extend to generative models like VAEs and diffusion models.
