---
title: Linear Regression
description: Fitting a linear model to data using least squares optimisation.
authors: ["Praneeth-Suresh"]
updatedDate: "2026-06-24"
difficulty: beginner
category: classical-ml
domains: ["supervised-learning", "regression"]
tags: ["linear-algebra", "optimisation", "statistics", "least-squares"]
prerequisites: []
furtherReading:
  - title: "An Introduction to Statistical Learning"
    url: "https://www.statlearning.com/"
---

## Overview

Linear Regression is perhaps the simplest Machine Learning (ML) model out there. Classical Machine Learning tasks are generally categorized into:

1. Classification: Predict which discrete class label the set of feature values correspond to.
2. Regression: Predict a continuous numerical value corresponding to the set of feature values.

Linear Regression is the simplest approach to perform the latter.

Linear regression models the relationship between a dependent variable $y$ and one or more independent variables $x_i$ using a linear function. In an ML context, we define the prediction of the linear regression model ($\hat{y}$) on the basis of a vector of independent variables $\mathbf{x}$ as follows:

$$
\hat{y} = \mathbf{w}^\top \mathbf{x} + b
$$

**Note**: By convention, the hat notation (carat symbol placed over the variable) is used to denote the estimated or predicted value.

## Model Training

We train a linear regression model by minimizing the **Mean Squared Error** (MSE) loss function defined as follows:

$$
\mathcal{L}(\mathbf{w}, b) = \frac{1}{n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2
$$

To train the model, we seek to minimize $\mathcal{L}(\mathbf{w}, b)$ with respect to $\mathbf{w}$ and $b$. This objective minimizes the large errors heavier (because of the squared term), leading to a line that is balanced across the dataset.

It can be proven mathematically that this leads to the **line of best fit** through the set of data-points. In other words, the set of weights and biases that minimize the loss function gives the parameters for the line of best fit.

### Closed-Form Solution

If we define the matrix $\mathbf{X}$ with columns being the features $\mathbf{x}$, then we can give a precise set of weights for the **line of best fit** using the following equation:

$$
\mathbf{w}^* = (\mathbf{X}^\top \mathbf{X})^{-1}\mathbf{X}^\top \mathbf{y}
$$

This is sometimes referred to in the literature as the Normal Equation. Although this gives the precise solution directly, it is important to remember that computing a matrix inverse is a $O(N^3)$ operation so with very large sets of features, this becomes computationall intractible.

Note that to account for the bias, the first column of $\mathbf{X}$ must be filled with 1s. 

## Limitations

Linear regression is a simple technique to model straight-linear relationships but this makes it very restrictive. In classical machine learning, linear regression is extremely limited because of:

1. The strict linearity assumption
2. High sensitivity to outliers (because we deal with squared errors, one large error can significantly skew the line)
3. Vulnerability to multi-collinearity (when features have correlation, the coefficients become unstable)

This is why vanilla linear regression (the basic version we have seen) is rarely used in working with real world data. It is more a tool that is used to lay the theoretical foundation for more advanced techniques.

## Connection to Other Topics

Linear regression forms the basis for [[Gradient Descent]] optimisation techniques. Linear regression is a highly interpretable technique, and helps us reason about Explainable AI techniques such as [[lime|LIME (Local Interpretable Model-agnostic Explanations)]].
