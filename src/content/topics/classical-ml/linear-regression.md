---
title: Linear Regression
description: Fitting a linear model to data using least squares optimisation.
author: Praneeth-Suresh
updatedDate: "2026-06-24"
difficulty: beginner
category: classical-ml
domains: ["supervised-learning", "regression"]
tags: ["linear-algebra", "optimisation", "statistics", "least-squares"]
prerequisites: []
citations:
  - title: "An Introduction to Statistical Learning"
    url: "https://www.statlearning.com/"
---

## Overview

Linear regression models the relationship between a dependent variable $y$ and one or more independent variables $\mathbf{x}$ using a linear function:

$$\hat{y} = \mathbf{w}^\top \mathbf{x} + b$$

## Objective Function

We minimise the **Mean Squared Error** (MSE):

$$\mathcal{L}(\mathbf{w}, b) = \frac{1}{n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2$$

## Closed-Form Solution

When the design matrix $\mathbf{X}$ has full column rank, the optimal weights are:

$$\mathbf{w}^* = (\mathbf{X}^\top \mathbf{X})^{-1}\mathbf{X}^\top \mathbf{y}$$

## Connection to Other Topics

Linear regression forms the basis for [[Gradient Descent]] optimisation techniques and extends naturally to [[Support Vector Machines]] for classification.
