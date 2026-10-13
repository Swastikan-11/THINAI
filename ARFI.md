# ARFI: Agricultural Recommendation Fragility Index

## 1. Overview & Theoretical Motivation
Machine learning models in agriculture frequently deliver confident predictions based on static correlations that fail when climate or market parameters deviate from the mean.

The **Agricultural Recommendation Fragility Index (ARFI)** is a composite metric engineered by THINAI to quantify the *vulnerability* or *fragility* of an agricultural prescription before a farmer executes it.

A low ARFI indicates a prescription that remains optimal and safe across wide environmental fluctuations, whereas a high ARFI alerts the farmer that the recommendation rests on delicate assumptions.

---

## 2. Mathematical Formulation

$$ARFI = w_{1} \cdot R_{data} + w_{2} \cdot C_{model} + w_{3} \cdot U_{pred} + w_{4} \cdot S_{sens} + w_{5} \cdot R_{stress} + w_{6} \cdot D_{risk}$$

Where weights satisfy:
$$\sum_{i=1}^{6} w_{i} = 1.00$$

### Sub-Score Definitions and Standardized Weights

| Component | Symbol | Weight ($w_i$) | Scale | Polarity | Description |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Data Reliability** | $R_{data}$ | $0.20$ | $[0, 1]$ | Inverted ($1 - \text{score}$) | Assesses recency, completeness, and sensor fidelity of soil, rainfall, and weather feeds. |
| **Model Consensus** | $C_{model}$ | $0.20$ | $[0, 1]$ | Inverted ($1 - \text{score}$) | Quantifies agreement between the Random Forest and Gradient Boosting crop models. |
| **Prediction Uncertainty** | $U_{pred}$ | $0.15$ | $[0, 1]$ | Direct | Normalized Shannon entropy across top candidate crop probability distributions. |
| **Scenario Sensitivity** | $S_{sens}$ | $0.15$ | $[0, 1]$ | Direct | Sensitivity gradient of the recommendation under marginal input parameter perturbations. |
| **Stress Robustness** | $R_{stress}$ | $0.15$ | $[0, 1]$ | Inverted ($1 - \text{score}$) | Rate of rank preservation across 6 severe stress testing benchmark shocks. |
| **Decision Risk** | $D_{risk}$ | $0.15$ | $[0, 1]$ | Direct | Projected downside economic loss under adverse farmgate price volatility. |

---

## 3. Fragility Classification Thresholds

The aggregate ARFI score ranges from $0.00$ to $1.00$:

$$\text{Fragility Status} = \begin{cases} 
\text{"Stable / Low Fragility"} & \text{if } ARFI < 0.35 \\
\text{"Moderate Fragility"} & \text{if } 0.35 \le ARFI \le 0.65 \\
\text{"Highly Fragile"} & \text{if } ARFI > 0.65
\end{cases}$$

### Operational Interpretation for Farmers
- **$< 0.35$ (Stable - Leaf Green):** Farmer can proceed immediately with high certainty. The intervention has strong agronomic buffers.
- **$0.35 - 0.65$ (Moderate - Amber):** Proceed with cautionary safeguards (e.g. check soil moisture before spraying, keep alternate nursery beds).
- **$> 0.65$ (Highly Fragile - Crimson):** Do not proceed without secondary verification. Significant risk of yield penalty or capital erosion under adverse weather.

---

## 4. 6-Scenario Stress Testing Matrix

During every recommendation evaluation, the backend runs 6 synthetic perturbation shocks against the farm state:

1. **Severe Drought:** Rainfall $-30\%$, Temperature $+2.5^\circ\text{C}$, Input Cost $+10\%$.
2. **Monsoon Surge:** Rainfall $+35\%$, Temperature $-1.0^\circ\text{C}$, Mandi Price $-5\%$.
3. **Extreme Heatwave:** Rainfall $-10\%$, Temperature $+3.5^\circ\text{C}$, Input Cost $+15\%$.
4. **Market Crash:** Farmgate price $-25\%$, Normal weather.
5. **Input Inflation:** Fertilizer/Seed cost $+20\%$, Normal weather.
6. **Multi-Stress Shock:** Rainfall $-20\%$, Temperature $+2.0^\circ\text{C}$, Mandi Price $-15\%$, Cost $+15\%$.

If the recommended action or crop rank flip occurs in more than 2 scenarios, $R_{stress}$ is penalized and the system displays a clear warning in the ARFI Explainability Drawer.
