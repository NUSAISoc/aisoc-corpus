---
title: Bayesian View on Regularization
description: Understanding ridge and lasso regularization through Bayesian priors and maximum a posteriori estimation.
authors: ["CJBuzz"]
updatedDate: "2026-10-19"
difficulty: beginner
category: classical-ml
domains: ["supervised-learning", "regression", "statistics"]
tags: ["regularization", "bayesian-inference", "ridge", "lasso", "map-estimation"]
prerequisites: ["linear-regression", "probability-and-bayesian-inference"]
furtherReading:
  - title: "Pattern Recognition and Machine Learning (Chapter 3)"
    url: "https://www.microsoft.com/en-us/research/publication/pattern-recognition-machine-learning/"
---

## Regularization

Regularization is a technique in machine learning used to prevent overfitting. In regression, this is done by adding penalty term to the loss function that makes large weights costly.  Thus, the combined loss function is given by:
$$
L(\beta;X,\mathbf y)+\lambda R(\beta)
$$
where 
- $L(\beta; X, \mathbf y)$ is the regression loss function, often as a negative log-likelihood of the underlying distribution of the error terms.
- $R(B)$ is the regularization penalty.
- $\lambda$ is a parameter that controls how much the regularization penalty should be applied. Stronger regularisation usually increases bias but reduces variance. It discourages overfitting by preventing the weights vector from being too large.


The optimal weights in regularised regression, $\hat \beta$, is given by: 

$$
\hat\beta
=\arg\min_\beta
\left[
L(\beta;X,\mathbf y)
+\lambda R(\beta)
\right].
$$
## Lasso ($L_1$) and Ridge ($L_2$) 

Two common regularization types are **Lasso**, or $L_1$ and **Ridge**, or $L_2$ regularization.

For a weight vector $\beta$:

$$
R_{L_2}(\beta)=\lVert \beta\rVert_2^2=\sum_j\beta_j^2,
\qquad
R_{L_1}(\beta)=\lVert \beta\rVert_1=\sum_j|\beta_j|.
$$

- **$L_2$ / ridge** regularization penalises the weight vector by the square of its $L_2$ norm, so large coefficients are pulled back strongly and coefficients shrink smoothly.
- **$L_1$ / lasso** regularization penalises the weight vector by its $L_1$ norm. Small coefficients are favoured but not to the extent as ridge regularization. However, Lasso regularization is able to produce sparse models by setting weights of weak features to exactly zero. 
- **Elastic net** combines both penalties.
## Statistical Interpretation

The choice of $L_1$ and $L_2$ regularization may seem arbitrary. To penalise large weights even more strongly, why not use the cube of the $L_3$ norm, $\lVert \beta\rVert_3^3$ instead? Or how about something like $\sum_j |\beta_j|^{1.5}$?

As it turns out, statistics provides a good reason for why $L_1$, and especially $L_2$ regularization are often considered the *normal* choice. To understand why, it helps to view regression some a statistical standpoint as well.

#### Regression as the Maximisation of Likelihood

Regression can be viewed as the maximisation of likelihood. That is, for observed data $\mathbf y$, we want a weight vector $\beta$ such that $p(\mathbf y \mid \beta)$ is maximised:
$$
\hat\beta = \arg\max_\beta p(\mathbf y \mid \beta).
$$
This is the same as minimising the negative log-likelihood. Thus, 
$$
\hat\beta = \arg\min_\beta L(\beta; X,\mathbf y).
$$
##### Demonstration with Ordinary Least Squares

This view is useful in demonstrating why **Mean Squared Error** is a common loss function for **linear regression**. In linear regression, we have
$$
y_i=\mathbf x_i^T\beta+\varepsilon_i,
$$
where error term $\varepsilon_i\sim \mathcal N(0, \sigma^2)$ is assumed to follow the normal distribution. Thus, given the independent variables $\mathbf x_i$, the dependent variable $y_i$ is also assumed to be normally distributed:
$$
y_i \mid \mathbf x_i\sim \mathcal N(\mathbf x_i^T\beta , \sigma^2).
$$
With $n$ data points, the likelihood function would thus be:
$$
\prod^n_{i=1}f(y_i\mid \mathbf x_i^T;\beta,\sigma^2)= \prod^n_{i=1} \left[ \frac 1{\sqrt{2\pi}\sigma}\exp\left(-\frac{(y_i-\mathbf x_i^T\beta)^2}{2\sigma^2}\right)\right].
$$
And the negative log-likelihood gives:
$$
L(\beta; X,\mathbf y)= n\log \sqrt{2\pi}\sigma +\frac 1{2\sigma^2} \sum^n_{i=1}(y_i-x_i^T\beta)^2.
$$
As can be seen, minimising the negative log-likelihood is equivalent to minimising MSE loss. 
#### Frequentist and Bayesian Interpretations

The maximisation of likelihood (or Maximum Likelihood Estimation) is the primary concern of *Frequentist Statistics*. In Frequentist Statistics, data is random while parameters are fixed. The opposing paradigm is *Bayesian Statistics*. Bayesian Statistics takes the view that data is observed (fixed) while parameters are unknown (thus random). Here, the primary concern would be the maximisation of **posterior** $p(\beta \mid \mathbf y$) (or Maximum *a posteriori* Estimation). Bayesian Statistics can provide an understanding on the necessity of the addition of the regularization term, and why the specific $L_1$ and $L_2$ regularization terms are chosen. 

To maximise the posterior, we can use Bayes' Theorem,

$$
\underbrace{p(\beta\mid \mathbf y)}_{\text{posterior}}
\propto 
\underbrace{p(\mathbf y \mid\beta)}_{\text{likelihood}} \;
\underbrace{p(\beta)}_{\text{prior}}.
$$
The prior probability represents what we knew about $\beta$ initially, before the data is observed. Taking logs,

$$
-\log p(\beta\mid \mathbf y)
=-\log p(\mathbf y \mid\beta)-\log p(\beta)+\text{constant}.
$$

Therefore, maximising $p(\beta\mid \mathbf y)$ is the equivalent of minimising $-\log p(\mathbf y \mid\beta)-\log p(\beta)$. Thus, 
$$
\hat\beta
=\arg\min_\beta
\left[
L(\beta;X,\mathbf y)
-\log p(\beta)
\right].
$$
The regularization term of $\lambda R(\beta)$ thus emerges as $\log p(\beta)$. How Ridge and Lasso derive their respective complexity penalty depends on the prior distribution of $\beta$. The prior distribution of $\beta$ can be set based on our goals. To prevent overfitting, smaller weights are preferred. This preference can be encoded by setting the mean of the prior distribution to be 0 (i.e. we have prior information that the weights are not going to be very large).
#### Gaussian Prior
If we assume that the values of $\beta$ follow independent normal distributions with mean 0, that is $\beta_i \sim \mathcal N(0, \tau^2)$, then 

$$
\log p(\beta)= -\frac{\lVert \beta\rVert_2^2}{2\tau^2} + c
$$
where $c$ is a constant. By comparing this to $\lambda R(\beta)$, we can see that it results in an $L_2$ penalty with $\lambda = \frac 1{2\tau^2}.$

As the normality assumption is often used, ridge regression becomes a natural choice.  
#### Laplacian Prior

If we instead assume that the values of $\beta$ follow independent Laplace distributions with mean 0, that is $\beta_i \sim \mathcal L(0, b)$, then 

$$
\log p(\beta)\propto-\frac{\lVert \beta\rVert_1}{b}
$$

where $c$ is a constant. By comparing this to $\lambda R(\beta)$, we can see that it results in an $L_1$ penalty with $\lambda = \frac 1b$.

#### In Layman Terms

The statistical interpretation of regularization can be thought of as:

> Assume the expected value of weight is 0 (or that the features $\mathbf{x}$ are independent of the target $y$), with the weights following a continuous distribution.
> 
> Given **both** the above assumption and the data, what is the value of the weights that that maximises the likelihood of observing the given outputs, from the given inputs?

## On the Importance of Scaling

With regularization penalising large weights, input features must be on **comparable scales**. If not, $L_1$ and $L_2$ regularization will unfairly penalise features with a smaller range, as since they apply the cost uniformly across all features. Features with smaller range would need larger weight coefficients to have the same impact on the model's output, and will thus be penalised more. Meanwhile, features with larger range will tend to have smaller coefficients and will be penalised less. As a result, regularization would result in models more strongly impacted by features with a larger range.
