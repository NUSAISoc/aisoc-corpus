---
title: Support Vector Machines
description: Maximum-margin classifiers using kernel methods for non-linear decision boundaries.
author: Praneeth-Suresh
updatedDate: "2026-06-24"
difficulty: intermediate
category: classical-ml
domains: ["supervised-learning", "classification"]
tags:
  ["kernel-methods", "optimisation", "margin", "classification", "statistics"]
prerequisites: ["linear-regression"]
citations:
  - title: "A Tutorial on Support Vector Machines – Burges"
    url: "https://www.microsoft.com/en-us/research/publication/a-tutorial-on-support-vector-machines-for-pattern-recognition/"
---

## Overview

SVMs find the hyperplane that maximises the margin between classes:

$$\max_{\mathbf{w}, b} \frac{2}{\|\mathbf{w}\|}  \quad \text{s.t.} \quad y_i(\mathbf{w}^\top \mathbf{x}_i + b) \ge 1$$

## Kernel Trick

Non-linear boundaries are achieved by mapping inputs to a high-dimensional feature space implicitly via a kernel $K(\mathbf{x}_i, \mathbf{x}_j) = \phi(\mathbf{x}_i)^\top \phi(\mathbf{x}_j)$.

## Related Topics

SVMs extend [[Linear Regression]] to classification and share optimisation foundations with [[Gradient Descent]].
