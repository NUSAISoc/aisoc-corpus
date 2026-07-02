---
title: Autoencoders
description: "From deterministic autoencoders to variational and vector-quantised models, and the gradient-estimation tricks (reparameterisation, Gumbel-Softmax, REINFORCE) that make them trainable."
author: Zak-T
updatedDate: "2026-06-25"
difficulty: intermediate
category: deep-learning
domains: ["unsupervised-learning", "generative-models", "representation-learning"]
tags: ["autoencoders", "variational-inference", "vae", "vq-vae", "reparameterisation", "gumbel-softmax", "reinforce", "elbo", "kl-divergence"]
prerequisites: ["gradient-descent"]
citations:
  - title: "Auto-Encoding Variational Bayes (Kingma & Welling, 2013)"
    url: "https://arxiv.org/abs/1312.6114"
  - title: "Neural Discrete Representation Learning (van den Oord et al., 2017)"
    url: "https://arxiv.org/abs/1711.00937"
  - title: "Categorical Reparameterization with Gumbel-Softmax (Jang et al., 2016)"
    url: "https://arxiv.org/abs/1611.01144"
---

## Overview

An **autoencoder** is a neural network trained to copy its input back to its output, but through a deliberate bottleneck. We compress an input $x$ with an **encoder** into a compact **latent code** $z$, and then hand that code to a **decoder** that tries to reconstruct the input as $x'$. The whole network is trained so that $x'$ resembles $x$ as closely as possible.

The bottleneck is the point. If the code $z$ is lower-dimensional (or otherwise constrained) than the input, the network cannot simply memorise and pass the input through unchanged. It is forced to discard noise and keep only the structure that matters for reconstruction. A good latent is therefore one that has *learned and stored the important features of the input*. Because we never need labels — the input is its own target — autoencoders are an **unsupervised** (or self-supervised) method.

> **Notation.** Throughout the variational sections we follow the convention of the original VAE paper: $\phi$ are the **encoder** parameters (the recognition / inference network $q_\phi$), and $\theta$ are the **decoder** parameters (the generative network $p_\theta$). Some texts swap these letters, so watch for it when reading other sources.

---

## The Standard (Vanilla) Autoencoder

### Encoder

Each layer of the encoder is an ordinary neural-network layer. For weights $W$, bias $b$, and an activation function $g$ (e.g. ReLU or sigmoid), a layer's output is:

$$
z = g(Wx + b)
$$

Stacking several such layers maps the input $x$ down to the latent code $z$.

### Decoder

The decoder mirrors this, mapping the code back up to a reconstruction. With its own weights $W'$, bias $b'$, and activation $g'$:

$$
x' = g'(W'z + b')
$$

### Loss function

We want $x'$ to match $x$, so we penalise their squared distance (the reconstruction error):

$$
\mathcal{L}(x, x') = \lVert x - x' \rVert^2
$$

Substituting the decoder, and then the encoder, makes the full composition explicit:

$$
\mathcal{L}(x, x') = \lVert x - g'(W'z + b') \rVert^2 = \lVert x - g'\big(W'\, g(Wx + b) + b'\big) \rVert^2
$$

This is fully deterministic and differentiable, so it trains by ordinary gradient descent.

### Why the latent space is a problem

A standard autoencoder is trained on a finite, discrete set of data points, so it only ever learns to place those points somewhere in latent space. This creates two issues:

- **Gaps.** The latent space ends up as a scatter of isolated points with empty regions in between. If you pick a point from one of those gaps and decode it, the decoder has never been trained there and tends to produce nonsense.
- **Crowding.** Points that are unrelated can land very close together, which makes it hard for the decoder to reconstruct them distinctly.

Both problems stem from the same root cause: the encoder maps each input to **a single point**, with no pressure to organise the space smoothly. This is exactly what the variational autoencoder fixes.

---

## From a Point to a Distribution: the Variational Autoencoder

### Deterministic vs variational encoders

A **deterministic** encoder takes an input $x$ and returns one latent vector $z$ — same $x$ in, same $z$ out, every time.

A **variational** encoder does *not* output a code directly. Instead it outputs the **parameters of a probability distribution over $z$**. For a Gaussian latent, the encoder reads $x$ and produces a mean vector $\mu(x)$ and a variance $\sigma^2(x)$. The actual code is then a *sample* from the distribution those parameters define:

$$
z \sim \mathcal{N}\!\big(\mu(x),\, \sigma^2(x)\big)
$$

### Why is $z$ a random variable?

Because we built it to be one. The encoder produces a distribution, and $z$ is a draw from it.

### Why design $z$ to be random?

There are two complementary reasons.

**The Bayesian reason.** Given an observed $x$, which latent codes $z$ could have produced it? Rarely a single one. Many codes could plausibly have generated the same image, and some are more likely than others. The spread of plausible explanations *is* a distribution — the **posterior** $p(z \mid x)$. The posterior is inherently a distribution because it encodes our *uncertainty* about the hidden cause. The encoder $q_\phi(z \mid x)$ is our learned approximation to that posterior, so it has to be a distribution too, and a sample $z$ from it has to be random.

**The practical reason.** Because $z$ is sampled with genuine noise around $\mu(x)$, *and* because a regularising term (the KL term, below) continually pulls $q_\phi(z\mid x)$ toward a smooth prior $p(z)$, the latent space gets organised into a continuous, well-behaved region. Nearby points decode to similar outputs, and there are no "dead" regions that decode to nonsense. This is what lets us **sample a fresh $z$ from the prior and decode a brand-new plausible data point**, or **smoothly interpolate** between two encodings. A deterministic autoencoder gives no such guarantee.

---

## Bayesian Foundations

The encoder is learning to infer the latent $z$ from an observation $x$ — exactly the situation Bayes' theorem describes:

$$
p(z \mid x) = \frac{p(x \mid z)\, p(z)}{p(x)}
$$

Each piece has a name and a role:

- $p(z \mid x)$ — the **posterior**: the distribution over latents *after* seeing the data. This is what we want.
- $p(x \mid z)$ — the **likelihood**: how likely the data is given a latent. This is what the decoder models.
- $p(z)$ — the **prior**: our belief about latents before seeing any data (we will choose $p(z)=\mathcal{N}(0, I)$).
- $p(x)$ — the **evidence** (or marginal likelihood): how probable the data is overall.

Writing the denominator out shows where the trouble starts:

$$
p(z \mid x) = \frac{p(x \mid z)\, p(z)}{\sum_{z} p(x \mid z)\, p(z)}
$$

To compute $p(x)$ we would have to sum (or integrate) over **every possible value of $z$**. For any realistic latent space this is **intractable**. Since we cannot compute the exact posterior, we approximate it — and the tool for that is variational inference, leading to the ELBO.

---

## Variational Inference and the ELBO

### A family of approximate posteriors

We pick a family of tractable distributions $\mathcal{Q}$ and search within it for the member that best approximates the true posterior. We index a member by a **variational parameter** $\lambda$:

$$
q_\lambda(z \mid x)
$$

If the family is Gaussian, then $\lambda$ is just the mean and variance: knowing those pins down the exact distribution. For the $i$-th data point $x_i$:

$$
\lambda_{x_i} = \big(\mu_{x_i},\, \sigma^2_{x_i}\big)
$$

Because $\lambda$ is chosen per data point, $q_\lambda(z) = q_\lambda(z \mid x)$.

### Measuring the approximation with KL divergence

The **Kullback–Leibler (KL) divergence** measures how far one distribution is from another. It is the expected log-ratio of the two densities; it is always $\ge 0$ and equals $0$ only when the distributions are identical. We use it to ask: how well does $q_\lambda(z)$ approximate $p(z\mid x)$?

$$
D_{\mathrm{KL}}\big(q_\lambda(z) \,\|\, p(z \mid x)\big) = \sum_z q_\lambda(z) \log \frac{q_\lambda(z)}{p(z \mid x)} = \mathbb{E}_{z \sim q}\!\left[ \log \frac{q_\lambda(z)}{p(z \mid x)} \right]
$$

Now we expand it, one step at a time. Split the log of a ratio into a difference of logs:

$$
= \mathbb{E}_{z \sim q}\!\left[\log q_\lambda(z)\right] - \mathbb{E}_{z \sim q}\!\left[\log p(z \mid x)\right]
$$

Rewrite the posterior using $p(z \mid x) = \tfrac{p(z, x)}{p(x)}$:

$$
= \mathbb{E}_{z \sim q}\!\left[\log q_\lambda(z)\right] - \mathbb{E}_{z \sim q}\!\left[\log \frac{p(z, x)}{p(x)}\right]
$$

Split that second log too, and note $\log p(x)$ does not depend on $z$, so its expectation is just $\log p(x)$:

$$
= \mathbb{E}_{z \sim q}\!\left[\log q_\lambda(z)\right] - \mathbb{E}_{z \sim q}\!\left[\log p(z, x)\right] + \log p(x)
$$

### Defining the ELBO

The first two terms are exactly the negative of what we call the **Evidence Lower BOund (ELBO)**:

$$
-\mathrm{ELBO}(\lambda) = \mathbb{E}_{z \sim q}\!\left[\log q_\lambda(z)\right] - \mathbb{E}_{z \sim q}\!\left[\log p(z, x)\right]
$$

Substituting that name back in gives the central identity of variational inference:

$$
\log p(x) = \mathrm{ELBO}(\lambda) + D_{\mathrm{KL}}\big(q_\lambda(z) \,\|\, p(z \mid x)\big)
$$

Rearranged (this is the correct direction of the rearrangement):

$$
D_{\mathrm{KL}}\big(q_\lambda(z) \,\|\, p(z \mid x)\big) = \log p(x) - \mathrm{ELBO}(\lambda)
$$

### Why this is the whole point

Look at the identity carefully:

- $\log p(x)$ is a **fixed constant** with respect to $\lambda$ — changing our approximation cannot change how probable the data actually is.
- $D_{\mathrm{KL}} \ge 0$ always.

So $\mathrm{ELBO}(\lambda) \le \log p(x)$ — it is genuinely a *lower bound on the evidence*, hence the name. And because $\log p(x)$ is constant, **maximising the ELBO is exactly the same as minimising the KL divergence** between our approximation and the true posterior. The optimal approximation is:

$$
q^*_\lambda(z) = \operatorname*{arg\,min}_{q \in \mathcal{Q}} D_{\mathrm{KL}}\big(q_\lambda(z) \,\|\, p(z \mid x)\big) = \operatorname*{arg\,max}_{q \in \mathcal{Q}} \mathrm{ELBO}(\lambda)
$$

The intractable $p(x)$ has dropped out of anything we need to optimise. We can differentiate the ELBO and run gradient descent. That is the breakthrough that makes the VAE trainable.

### The per-data-point ELBO: reconstruction + regulariser

We assume **local latent variables**: each data point $x$ has its own latent $z$, shared with no other point. The ELBO then splits into a sum over data points, and using $p(z, x) = p(x \mid z)\,p(z)$ we can rewrite each term as:

$$
\mathrm{ELBO}_i(\lambda) = \mathbb{E}_{z \sim q_\lambda(z \mid x_i)}\!\big[\log p(x_i \mid z)\big] - D_{\mathrm{KL}}\big(q_\lambda(z \mid x_i) \,\|\, p(z)\big)
$$

(The derivation: $\mathbb{E}_q[\log p(x\mid z) + \log p(z)] - \mathbb{E}_q[\log q] = \mathbb{E}_q[\log p(x\mid z)] - D_{\mathrm{KL}}(q\|p(z))$.)

Since the encoder is the network $q_\phi$ and the decoder is $p_\theta$, training **minimises the negative ELBO**, which is the VAE loss:

$$
\mathcal{L}_i(\theta, \phi) = -\underbrace{\mathbb{E}_{z \sim q_\phi(z \mid x_i)}\!\big[\log p_\theta(x_i \mid z)\big]}_{\text{reconstruction term}} + \underbrace{D_{\mathrm{KL}}\big(q_\phi(z \mid x_i) \,\|\, p(z)\big)}_{\text{regulariser}}
$$

Both $\theta$ and $\phi$ appear, so a single gradient step on this loss updates *both* networks at once.

- **Reconstruction term.** This encourages the decoder to reconstruct the data accurately. If reconstruction is poor, $\log p_\theta(x_i \mid z)$ is very negative — the model is saying the observed $x_i$ was unlikely under the decoder. The expectation over $z \sim q_\phi$ is **stochastic with respect to $z$**: the quantity inside depends on a random draw. In practice we do not integrate it analytically — we draw a few samples of $z$ from $q_\phi(z\mid x)$ and average $\log p_\theta(x\mid z)$ over them (a Monte-Carlo estimate, i.e. approximating an expectation by an average over samples).
- **Regulariser.** We want $z$ to follow a standard normal, $p(z) = \mathcal{N}(0, I)$, and the encoder is learning $q_\phi(z\mid x)$ to approximate it. This KL term penalises the encoder whenever it chooses a $q_\phi$ far from the prior. That is what prevents the autoencoder from collapsing the data onto isolated points and instead keeps the latent space continuous.

### Computing the Gaussian loss in closed form

For diagonal-Gaussian $q_\phi = \mathcal{N}(\mu, \sigma^2)$ (dimension $J$) against the standard-normal prior $p(z) = \mathcal{N}(0, I)$, the KL term has a clean closed form — no sampling needed:

$$
D_{\mathrm{KL}}\big(\mathcal{N}(\mu, \sigma^2) \,\|\, \mathcal{N}(0, I)\big) = \frac{1}{2}\sum_{j=1}^{J}\Big(\mu_j^2 + \sigma_j^2 - \log \sigma_j^2 - 1\Big)
$$

Reading the terms: $\mu_j^2$ pulls the mean toward $0$; $\sigma_j^2 - \log\sigma_j^2 - 1$ is minimised at $\sigma_j^2 = 1$, pulling the variance toward $1$. Together they pull each latent dimension toward the unit Gaussian.

The reconstruction term depends on the decoder's chosen output distribution:

- **Gaussian decoder** $p_\theta(x\mid z) = \mathcal{N}\big(x;\, \hat{x}_\theta(z),\, I\big)$: then $-\log p_\theta(x\mid z) = \tfrac{1}{2}\lVert x - \hat{x}_\theta(z)\rVert^2 + \text{const}$, so reconstruction reduces to **mean-squared error**.
- **Bernoulli decoder** (binary pixels): $-\log p_\theta(x\mid z)$ becomes **binary cross-entropy**.

> [TODO] Full derivation of the reconstruction term from $-\log p_\theta(x\mid z)$ for the Gaussian and Bernoulli cases, including the role of the (often fixed) decoder variance.

### Connection to Expectation–Maximisation

The ELBO is not unique to VAEs — it is the same object that powers the **EM algorithm**. EM maximises the marginal likelihood $\log p_\theta(X)$, where the latent variables $Z$ have been **marginalised out** ($p_\theta(X) = \int p_\theta(X, Z)\,dZ$; note it is $Z$, not $\theta$, that is integrated away). For any distribution $q(Z)$ over the latents:

$$
\log p_\theta(X) = \underbrace{\mathbb{E}_q\!\big[\log p_\theta(X, Z)\big] + H(q)}_{F(q, \theta)\ =\ \text{ELBO}} + D_{\mathrm{KL}}\big(q(Z) \,\|\, p_\theta(Z \mid X)\big)
$$

where $H(q) = -\mathbb{E}_q[\log q(Z)]$ is the entropy of $q$. The two parts are the ELBO $F(q,\theta)$ and the KL gap between $q$ and the true posterior. EM alternates:

- **E-step.** Set $q$ to maximise $F(q, \theta)$ by choosing $q = p_\theta(Z \mid X)$. This drives the KL gap to $0$, so the lower bound *touches* the true objective $\log p_\theta(X)$.
- **M-step.** Holding $q$ fixed, improve $\theta$ to increase $F(q, \theta)$.

A VAE is essentially **amortised** variational EM: instead of solving for the optimal $q$ exactly for every data point (a per-point E-step), an encoder network $q_\phi$ *predicts* the variational parameters in one forward pass, and both $\phi$ and $\theta$ are improved together by gradient ascent on the ELBO.

---

## Computing the Gradients: Why Backprop Breaks

Training is gradient ascent on the ELBO (equivalently, descent on the negative-ELBO loss above). The decoder $\theta$ is no trouble: once a value of $z$ is given, the gradient flows straight through $\log p_\theta(x\mid z)$. The encoder $\phi$ is the problem, because $\phi$ lives **inside the distribution we sample from**, $z \sim q_\phi(z\mid x)$.

### Two conditions backprop requires

For gradients to flow, every node from inputs to loss must be:

1. a **deterministic** function of its inputs, and
2. **differentiable**.

**A deterministic node, e.g. $y = 3\mu$.** Ask: if I nudge $\mu$ up by $\delta$, how does $y$ change? Answer: $y$ goes up by exactly $3\delta$, every single time. The map $\mu \mapsto y$ is a genuine function with a well-defined derivative $\tfrac{\partial y}{\partial \mu} = 3$.

**A sampling node, e.g. $z \sim \mathcal{N}(\mu, \sigma^2)$.** Ask the same question: if I nudge $\mu$ up by $\delta$, how does $z$ change? There is no answer. For a fixed $\mu$, $z$ is not a single number — it is a freshly drawn random value that could land anywhere under the bell curve. The map $\mu \mapsto z$ is **one-to-many**: one input, infinitely many possible outputs. No derivative exists.

### Why not just differentiate the expectation directly?

The loss is an expectation, which we can write as an integral. (Using a generic $\phi$ for the parameters of the sampling distribution and $f(z) = \log p_\theta(x\mid z)$ for the thing inside.)

$$
L(\phi) = \mathbb{E}_{z \sim q_\phi(z\mid x)}\!\big[f(z)\big] = \int q_\phi(z \mid x)\, f(z)\, dz
$$

Push the gradient inside and apply the product rule:

$$
\nabla_\phi L = \int \nabla_\phi\big[q_\phi(z \mid x)\, f(z)\big]\, dz = \int \Big(\big[\nabla_\phi q_\phi(z\mid x)\big] f(z) + q_\phi(z\mid x)\big[\nabla_\phi f(z)\big]\Big)\, dz
$$

Here is the key observation: $f(z) = \log p_\theta(x \mid z)$ depends only on the decoder $\theta$ and the value $z$. The **encoder $\phi$ does not appear in $f$ at all**, so:

$$
\nabla_\phi f(z) = 0
$$

and the whole expression collapses to:

$$
\nabla_\phi L = \int \big[\nabla_\phi q_\phi(z \mid x)\big]\, f(z)\, dz
$$

> 💡 **This is why backprop breaks.** The encoder $\phi$ exerts its influence entirely through the *shape of the distribution* $q_\phi$ that we sample from. The gradient therefore lives inside the $q_\phi$ object — a density that measures how the parameters reshape the latent space — while $f(z)$ only answers "how well do we reconstruct if the latent happens to be $z$?". If we replace "the distribution" with "one concrete sample $z$", we throw away every trace of $\phi$: the sampled $z$ is just a number, and $\phi$ has vanished from the computation graph. The autograd engine, seeing only the graph *after* $z$ was sampled, faithfully reports a zero gradient — because in the graph it can see, there is no path from $\phi$ to the loss.

The differentiation graph can only begin *after* $z$ has been sampled, and from there it differentiates $f$, which doesn't depend on $\phi$. $\phi$'s influence is locked inside the sampling step, where backprop can't reach.

---

## The Reparameterisation Trick

The fix is to **relocate $\phi$'s influence out of the sampling step and into a deterministic node**. Instead of drawing $z \sim \mathcal{N}(\mu_\phi(x), \sigma_\phi^2(x))$ directly, we write:

$$
z = \mu_\phi(x) + \sigma_\phi(x) \odot \epsilon, \qquad \epsilon \sim \mathcal{N}(0, I)
$$

Now the randomness lives entirely in $\epsilon$, an external input with **no parameters**. Given $\epsilon$, the latent $z$ is a *deterministic, differentiable* function of $\phi$ (through $\mu_\phi$ and $\sigma_\phi$). The graph now has a clean path $\phi \to z \to f \to \text{loss}$, and $\nabla_\phi$ flows through it normally.

### Why this is valid: the location–scale property

This works because of a specific property of the Gaussian, the **location–scale property**. The distribution

$$
z \sim \mathcal{N}(\mu, \sigma^2)
$$

is *identical* to

$$
z = \mu + \sigma \cdot \epsilon, \qquad \epsilon \sim \mathcal{N}(0, 1)
$$

A standard normal can be shifted by $\mu$ (location) and scaled by $\sigma$ (scale) to produce any Gaussian. So the reparameterised samples follow exactly the same distribution as before — we have changed *how* we draw the sample, not *what* we are drawing — but the new form is differentiable in the parameters.

The resulting gradient is itself an expectation we can Monte-Carlo estimate by drawing a few $\epsilon$:

$$
\nabla_\phi\, \mathbb{E}_{z \sim q_\phi}\!\big[f(z)\big] = \mathbb{E}_{\epsilon \sim \mathcal{N}(0, I)}\!\big[\nabla_\phi f(\mu_\phi + \sigma_\phi \odot \epsilon)\big]
$$

This estimator tends to have **low variance**, which is one reason it works so well in practice (contrast with the score-function estimator below).

---

## Discrete Latents: the VQ-VAE

A vanilla VAE assumes the prior and posterior are continuous Gaussians. But sometimes a *discrete* latent is the better model.

**Motivation.** Images may belong to categories like "cat" and "car", and it makes little sense to interpolate between such categories — a half-cat-half-car is not a meaningful image. Discrete codes are also easier to model: each category is a single value. The **VQ-VAE** (Vector-Quantised VAE) therefore replaces the continuous normal latent with a discrete one:

1. the encoder produces continuous vectors which are matched to a **categorical** codebook,
2. sampling returns an **integer index** into a dictionary of embedding vectors,
3. the indexed embedding is passed to the decoder.

### Dimensions

$n$ = batch size, $h$ = image height, $w$ = image width, $c$ = input channels, $d$ = hidden channels, $k$ = number of codebook entries.

### The Vector-Quantisation layer

This layer takes the encoder's continuous embeddings $z_e(x)$, snaps each to its nearest codebook entry, and outputs the quantised tensor $z_q$. The decoder then consumes $z_q$ and outputs $x'$.

1. **Reshape.** Combine all dimensions except the last, giving $n\cdot h\cdot w$ vectors, each of dimensionality $d$.
2. **Compute distances.** For each of the $n\cdot h\cdot w$ vectors, measure its distance to each of the $k$ codebook embeddings, producing a matrix of shape $(n\cdot h\cdot w,\, k)$.
3. **Argmin.** For each vector, find the index of the nearest of the $k$ codebook vectors.
4. **Index.** Replace each vector with its nearest codebook vector, giving $z_q$.
5. **Reshape back** to $(n, h, w, d)$.
6. **Copy gradients.** The $\operatorname*{arg\,min}$ step has zero gradient almost everywhere, so backprop cannot flow through it. We approximate by *copying* the gradients arriving at $z_q$ back onto $z_e$, so some training signal still reaches the encoder.

### The straight-through estimator

How do we "copy the gradients" and pretend the VQ layer isn't there during backprop? Note that $z_e$ and $z_q$ are vectors of the same dimensionality $d$, and $z_q$ is the codebook entry *nearest* to $z_e$, so geometrically they sit close together in the same space. The **straight-through estimator** says: only in the backward pass, pretend the quantisation step was the identity function, and pass whatever gradient arrives at $z_q$ straight through to $z_e$.

The justification is that the copied gradient points in a sensible direction — "produce outputs that make the decoder happier". The forward pass uses the true (discrete) quantisation; the backward pass uses the identity. It is an approximation, but it works well in practice.

### The VQ-VAE loss (three components)

Here $\text{sg}[\cdot]$ is the **stop-gradient** operator: it is the identity in the forward pass but lets *no gradient* flow through whatever it wraps in the backward pass.

$$
\mathcal{L} = \underbrace{-\log p(x \mid z_q)}_{\text{reconstruction}} \;+\; \underbrace{\big\lVert \text{sg}[z_e(x)] - e \big\rVert^2}_{\text{codebook (VQ) loss}} \;+\; \underbrace{\beta \big\lVert z_e(x) - \text{sg}[e] \big\rVert^2}_{\text{commitment loss}}
$$

- **Reconstruction loss** $-\log p(x\mid z_q)$ optimises the decoder, and the encoder via the straight-through gradient.
- **Codebook (VQ) loss.** Because the straight-through path gives the codebook entries *no* gradient, they would never learn on their own. This term — a dictionary-learning / k-means-style update — uses an $L_2$ error to pull each chosen codebook vector $e$ toward the encoder output it was matched with. With $\text{sg}$ on $z_e$, only the codebook moves. **This is what actually trains the embedding table.**
- **Commitment loss.** The embedding space is dimensionless, so its volume could grow arbitrarily if the embeddings train slower than the encoder. With $\text{sg}$ on $e$, this term pulls the *encoder output* toward its chosen code, discouraging the encoder from drifting between codebook entries and keeping $z_e$ and $z_q$ close. The hyperparameter $\beta$ weights it against the other terms.

---

## Reparameterising a Discrete Distribution

We just saw how the reparameterisation trick relocates randomness so we can differentiate through continuous latents. The **Gumbel-Max trick** is the analogue for a *categorical* distribution.

The core difficulty: the map from continuous parameters (class probabilities / logits) to a discrete outcome is a **step function**. Nudging the class probabilities by a tiny amount produces a *discontinuous* jump in the (one-hot) output — there is no smooth response to differentiate. For a continuous distribution the output can move continuously with the parameters; a discrete random variable cannot, because its output lives in a finite set.

### The Gumbel-Max trick

Suppose the categorical is specified by **logits** $\alpha_1, \dots, \alpha_k$ (unnormalised log-probabilities). The trick gives a routine to draw a sample:

1. Draw independent **Gumbel noise** $g_1, \dots, g_k$, where each $g_i = -\log(-\log u_i)$ with $u_i \sim \text{Uniform}(0, 1)$.
2. Output the index $\operatorname*{arg\,max}_i (\alpha_i + g_i)$.

This produces an exact draw from the softmax categorical. But $\operatorname*{arg\,max}$ is still a non-differentiable step function — so this alone doesn't solve our gradient problem; it just isolates the non-differentiability into a single clean operation.

#### What is the Gumbel distribution?

It comes from **extreme value theory**. If you take the maximum of many independent random variables and rescale it appropriately, the result converges to one of three limiting shapes. When the underlying distribution has a **light tail** (decaying exponentially or faster) — like the normal, the exponential, or the logistic — the maximum converges to the **Gumbel** distribution. Since the trick is built around an $\operatorname*{arg\,max}$ over (noised) logits, the Gumbel is the natural noise to inject.

#### Why are there two logs?

This is **inverse-transform sampling**: a way to turn plain uniform randomness into a sample from any target distribution. If $U \sim \text{Uniform}(0,1)$ and $F$ is the **CDF** (cumulative distribution function) of the target, then $X = F^{-1}(U)$ has exactly that distribution. The proof is short:

$$
P(X \le x) = P\big(F^{-1}(U) \le x\big) = P\big(U \le F(x)\big) = F(x)
$$

The last step holds because $U$ is uniform, so $P(U \le t) = t$. The Gumbel's CDF is $F(x) = \exp(-\exp(-x))$. Inverting it (set $u = \exp(-\exp(-x))$ and solve for $x$) gives:

$$
F^{-1}(u) = -\log(-\log u)
$$

— hence the two nested logs.

> [TODO] Proof of the Gumbel-Max identity: that $\;P\big(\operatorname*{arg\,max}_i (\alpha_i + g_i) = j\big) = \dfrac{e^{\alpha_j}}{\sum_k e^{\alpha_k}}\;$, i.e. the routine really does sample from the intended categorical.

### The Gumbel-Softmax (Concrete) trick

To make the sample differentiable, replace the hard $\operatorname*{arg\,max}$ with a temperature-controlled **softmax**:

$$
y_i = \operatorname{softmax}\!\left(\frac{\alpha_i + g_i}{\tau}\right) = \frac{\exp\!\big((\alpha_i + g_i)/\tau\big)}{\sum_{j} \exp\!\big((\alpha_j + g_j)/\tau\big)}
$$

This produces a **soft** vector — a point in the probability simplex (the set of non-negative vectors summing to $1$), rather than a hard one-hot. Crucially, the softmax is **smooth**, so gradients flow back to the logits $\alpha$.

The **temperature** $\tau$ controls how peaky the output is, and sets a trade-off:

- As $\tau \to 0$, $y$ approaches an honest one-hot — samples are nearly discrete and faithful — **but** the function approaches a step again, so the gradients become **high-variance and spiky**.
- At **high** $\tau$, the gradients are smooth and well-behaved, but the samples only loosely resemble the discrete distribution we actually want.

In practice $\tau$ is often **annealed** (started high and decreased during training) to balance faithful samples against usable gradients.

---

## The Score-Function Estimator (REINFORCE)

### Motivation

The recurring problem is optimising an objective that is an expectation over a distribution that **itself depends on the parameters**:

$$
J(\theta) = \mathbb{E}_{x \sim p_\theta(x)}\!\big[f(x)\big]
$$

where $f(x)$ scores a sample $x$, and $x$ is drawn through the very parameters $\theta$ we want to optimise. If we naively move the gradient inside the integral:

$$
\nabla_\theta J(\theta) = \int \nabla_\theta p_\theta(x)\, f(x)\, dx
$$

we hit a snag: $\nabla_\theta p_\theta(x)$ is **not** a probability distribution — it doesn't integrate to $1$ and can be negative. So this integral is *not* an expectation under $p_\theta$, and we cannot directly approximate it by Monte-Carlo sampling (Monte Carlo requires a genuine expectation). Both REINFORCE and the reparameterisation trick are ways of rewriting this quantity as a proper expectation we *can* sample.

### The log-derivative (score-function) trick

Start from the derivative of a log:

$$
\nabla_\theta \log p_\theta(x) = \frac{1}{p_\theta(x)} \nabla_\theta p_\theta(x)
$$

Rearranging gives an identity that reintroduces the density $p_\theta(x)$ as a multiplicative factor:

$$
\nabla_\theta p_\theta(x) = p_\theta(x)\, \nabla_\theta \log p_\theta(x)
$$

The term $\nabla_\theta \log p_\theta(x)$ is called the **score**.

Now the derivation. Write the objective as an integral, push in the gradient, and use that $f$ does not depend on $\theta$ (so $\nabla_\theta f = 0$, eliminating one product-rule term):

$$
\nabla_\theta \mathbb{E}_{x \sim p_\theta(x)}\!\big[f(x)\big] = \nabla_\theta \int f(x)\, p_\theta(x)\, dx = \int f(x)\, \nabla_\theta p_\theta(x)\, dx
$$

Substitute the log-derivative identity:

$$
= \int f(x)\, p_\theta(x)\, \nabla_\theta \log p_\theta(x)\, dx = \mathbb{E}_{x \sim p_\theta(x)}\!\big[f(x)\, \nabla_\theta \log p_\theta(x)\big]
$$

This *is* a proper expectation under $p_\theta$, so we can estimate it by Monte-Carlo sampling:

$$
\nabla_\theta J(\theta) \approx \frac{1}{N} \sum_{i=1}^{N} f(x_i)\, \nabla_\theta \log p_\theta(x_i)
$$

Notice the estimator only ever *evaluates* $f$ — it never differentiates it. So $f$ and $x$ need not be differentiable in $\theta$, which is exactly why this estimator works for **discrete** distributions where reparameterisation does not apply.

### REINFORCE vs the Reparameterisation Trick

Same objective $J(\theta) = \mathbb{E}_{x \sim p_\theta}[f(x)]$, two different rewrites.

The reparameterisation trick applies a transformation $x = g_\theta(\epsilon) = \mu + \sigma\epsilon$ with $\epsilon \sim p(\epsilon)$, turning the objective into an expectation over the **parameter-free** noise $\epsilon$:

$$
J(\theta) = \mathbb{E}_{\epsilon \sim p(\epsilon)}\!\big[f(g_\theta(\epsilon))\big]
$$

Now the gradient can move inside and be computed by the chain rule:

$$
\nabla_\theta J = \mathbb{E}_{\epsilon}\!\big[\nabla_\theta f(g_\theta(\epsilon))\big] = \mathbb{E}_{\epsilon}\!\big[f'(g_\theta(\epsilon))\, \nabla_\theta g_\theta(\epsilon)\big]
$$

The contrast:

- **Score function (REINFORCE)** differentiates the *distribution* (via the score) and only *evaluates* $f$. It works for discrete and non-differentiable $f$, but is typically **high-variance**.
- **Reparameterisation** differentiates *through* $f$ and the sample path (it needs $f'$ and a differentiable $g_\theta$, i.e. a continuous, reparameterisable distribution), and is typically **lower-variance**.

This is precisely why **continuous Gaussian latents (the VAE)** use reparameterisation, while **discrete latents (the VQ-VAE)** must fall back on the straight-through estimator, Gumbel-Softmax, or REINFORCE.

> [TODO] Variance reduction for REINFORCE — baselines and control variates. The estimator's high variance is its main practical drawback, and baselines are the standard remedy.
