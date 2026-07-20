---
title: "PEFT"
description: Parameter-efficient fine-tuning — adapt large models on a single GPU by freezing the base weights and training a small delta.
author: Marcus-Wee
updatedDate: "2026-07-09"
difficulty: intermediate
category: generative
domains: ["llm", "fine-tuning", "quantization"]
tags:
  [
    "peft",
    "lora",
    "qlora",
    "low-rank-adaptation",
    "quantization",
    "optimisation",
  ]
prerequisites: ["neural-networks", "transformers", "gradient-descent"]
furtherReading:
  - title: "LoRA: Low-Rank Adaptation of Large Language Models — Hu et al. (2021)"
    url: "https://arxiv.org/abs/2106.09685"
  - title: "QLoRA: Efficient Finetuning of Quantized LLMs — Dettmers et al. (2023)"
    url: "https://arxiv.org/abs/2305.14314"
  - title: "DoRA: Weight-Decomposed Low-Rank Adaptation — Liu et al. (2024)"
    url: "https://arxiv.org/abs/2402.09353"
  - title: "Parameter-Efficient Transfer Learning for NLP — Houlsby et al. (2019)"
    url: "https://arxiv.org/abs/1902.00751"
  - title: "Few-Shot Parameter-Efficient Fine-Tuning is Better and Cheaper than In-Context Learning (IA³) — Liu et al. (2022)"
    url: "https://arxiv.org/abs/2205.05638"
---

## Overview

Fine-tuning adjusts the parameters $\theta$ of a pretrained network to minimise a task loss $\mathcal{L}$. For a model with $|\theta| = d$ parameters, full fine-tuning optimises all $d$ of them via [[gradient-descent|Gradient Descent]]. **PEFT** (Parameter-Efficient Fine-Tuning) instead freezes $\theta$ and learns a much smaller set $\phi$ with $|\phi| \ll d$, so the update is $\theta \mapsto \theta + \Delta\theta(\phi)$. This collapses the memory cost of training a 7B model from ~112GB to a few GB.

## Why It Works

A pretrained model already encodes language, reasoning, and world knowledge. Specialising it to a task is a *small* adjustment, not a rewrite — empirically the useful update $\Delta\theta$ lives in a low-dimensional subspace. So you don't need to move all $d$ parameters; a tiny trainable set $\phi$ can express the adjustment, often matching full fine-tuning quality while training **under 1%** of the weights.

## Memory Savings

The weights are the small cost; the optimiser state around them dominates. With Adam in full precision, each trainable scalar carries the weight, its gradient, and two moment estimates. Total training memory $M$ (in **bytes**) scales as

$$M \approx \underbrace{4d}_{\text{fp32 weights}} + \underbrace{(4 + 4 + 4)\,d_{\text{train}}}_{\text{grad} + m + v} + M_{\text{act}}$$

The key term is $d_{\text{train}}$, the number of **trainable** parameters. A frozen weight contributes to neither the gradient nor the moments — only its forward-pass storage. 

PEFT saves incredible amounts of memory by driving $d_{\text{train}} \to \epsilon d$, where oftentimes $\epsilon < 0.01$, which practically zeroes the dominant $12\,d_{\text{train}}$ term and the per-step optimiser cost.


## The PEFT Family

| Method | Mechanism | $d_{\text{train}}$ |
|--------|-----------|--------------------|
| **LoRA** | additive low-rank $\mathbf{B}\mathbf{A}$ | $r(m+n)$ |
| **Prefix/Prompt tuning** | learn virtual tokens prepended to input; weights frozen | $\sim$ embeddings only |
| **Adapters (2019)** | bottleneck layers inserted between frozen blocks | small, not mergeable |
| **IA³** | learned vectors rescaling activations $\mathbf{h}\odot\mathbf{l}$ | one vector per target |
| **DoRA (2024)** | decompose $\mathbf{W}=m\frac{\mathbf{V}}{\lVert\mathbf{V}\rVert}$, LoRA the direction | LoRA + magnitude |

All share the PEFT invariant: **freeze the base, learn a small $\Delta\theta$.** They differ only in the parametrisation of that delta.

## LoRA, in Brief

**LoRA** (Low-Rank Adaptation) is the dominant PEFT method. It freezes each weight matrix $\mathbf{W}_0$ and learns a low-rank update $\Delta\mathbf{W} = \mathbf{B}\mathbf{A}$ alongside it, where $\mathbf{B}, \mathbf{A}$ hold a fraction of the parameters. The resulting adapter is tiny (megabytes), swappable across tasks on one base model, and mergeable back into $\mathbf{W}_0$ for zero added inference cost. The full low-rank derivation is a future post.

## QLoRA, in Brief

**QLoRA** (Quantized LoRA) goes further: store the frozen base in **4-bit**, train fp16 LoRA adapters on top. Quantization shrinks the base ~8×; LoRA keeps the optimiser overhead near zero. Together they put 65B-scale fine-tuning on a single GPU — trading some speed (on-the-fly dequantization) for the ability to run at all. NF4, double quantization, and paged optimizers are a future post.

## Choosing a Method

| Situation | Use |
|-----------|-----|
| fp16 base fits the GPU | **LoRA** — no dequant tax |
| base too big for 16-bit | **QLoRA** — 4-bit makes it fit at all |
| max quality, spare compute | **DoRA** |
| many cheap swappable tasks | **prompt/prefix tuning** |

2026 default: LoRA if it fits, QLoRA if it doesn't. Start $r=16,\ \alpha=32$, target attention + MLP projections, escalate only if the task demands it.

## Limitations

- A small $\Delta\theta$ caps how far you can move the model; tasks needing deep behavioural change may still favour full fine-tuning.
- Adapter capacity and placement are a tuning burden: too little underfits, too much overfits small datasets.
- A caveat rather than a limitation: PEFT cuts only the *training* memory, not the base model's *inference* footprint — you still load all $d$ weights to serve it.

## Related Topics

PEFT adapts the affine projections inside [[transformers|Transformers]] and the [[neural-networks|Neural Networks]] beneath them, training the small delta with [[gradient-descent|Gradient Descent]]. The low-rank factorisation behind LoRA echoes the surrogate-modelling intuition of [[linear-regression|Linear Regression]] and the implicit feature maps of [[support-vector-machines|Support Vector Machines]].

