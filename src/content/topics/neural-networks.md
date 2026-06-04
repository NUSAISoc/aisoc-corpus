---
title: Neural Networks
description: Multi-layer parametric function approximators trained via backpropagation.
author: Praneeth-Suresh
difficulty: intermediate
category: deep-learning
domains: ["deep-learning", "representation-learning"]
tags:
  [
    "backpropagation",
    "activation-functions",
    "optimisation",
    "universal-approximation",
  ]
prerequisites: ["gradient-descent"]
citations:
  - title: "Deep Learning – Goodfellow, Bengio, Courville"
    url: "https://www.deeplearningbook.org/"
---
## Overview

The core architecture of modern deep learning is the neural nerwork. Also called Mulit-Layer Perceptrons, they consist of a set of layers. Each layer is matematically represented as a vector. Looking at it this way, one layer is transformed to the next by multiplying by a matrix and adding a _bias_ vector.

In Linear Algebra lingo, this is called an Affine Transformation.

Thus, we say a feedforward neural network computes a composition of affine transformations and non-linear activations:

$$
f(\mathbf{x}) = \sigma_L(\mathbf{W}_L \cdots \sigma_1(\mathbf{W}_1 \mathbf{x} + \mathbf{b}_1) \cdots + \mathbf{b}_L)
$$

## Universal Approximation

This is a key reault about Neural Networks that explains why they are so useful. It goes something like this:

> A single hidden-layer network with sufficient width can approximate any continuous function on a compact set to arbitrary precision (Cybenko, 1989).

In supervised deep learning, we are attempting to find a function mapping from inputs ($x$) to outputs ($y$). According to universal approximation, given enough training time and data, the neural network will eventually be able to learn the underlying function.

## Backpropagation

Gradients are computed efficiently via the chain rule applied layer-by-layer:

$$
\frac{\partial \mathcal{L}}{\partial \mathbf{W}_l} = \frac{\partial \mathcal{L}}{\partial \mathbf{a}_l} \cdot \frac{\partial \mathbf{a}_l}{\partial \mathbf{W}_l}
$$

## Related Topics

Neural networks form the foundation of [[Transformers]] and are optimised using [[Gradient Descent]].
