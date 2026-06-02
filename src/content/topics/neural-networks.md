---
title: Neural Networks
description: Multi-layer parametric function approximators trained via backpropagation.
difficulty: intermediate
category: deep-learning
domains: ["deep-learning", "representation-learning"]
tags: ["backpropagation", "activation-functions", "optimisation", "universal-approximation"]
prerequisites: ["gradient-descent"]
citations:
  - title: "Deep Learning – Goodfellow, Bengio, Courville"
    url: "https://www.deeplearningbook.org/"
---

## Overview

A feedforward neural network computes a composition of affine transformations and non-linear activations:

$$f(\mathbf{x}) = \sigma_L(\mathbf{W}_L \cdots \sigma_1(\mathbf{W}_1 \mathbf{x} + \mathbf{b}_1) \cdots + \mathbf{b}_L)$$

## Universal Approximation

A single hidden-layer network with sufficient width can approximate any continuous function on a compact set to arbitrary precision (Cybenko, 1989).

## Backpropagation

Gradients are computed efficiently via the chain rule applied layer-by-layer:

$$\frac{\partial \mathcal{L}}{\partial \mathbf{W}_l} = \frac{\partial \mathcal{L}}{\partial \mathbf{a}_l} \cdot \frac{\partial \mathbf{a}_l}{\partial \mathbf{W}_l}$$

## Related Topics

Neural networks form the foundation of [[Transformers]] and are optimised using [[Gradient Descent]].
