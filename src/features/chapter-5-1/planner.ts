"use client";

import { create } from "zustand";

export interface CapstonePlan {
  // Metadata
  studentName: string;
  selectedTrackId: string;
  projectName: string;
  tagline: string;
  targetCity: string;
  targetPersona: string;
  problemSolved: string;

  // Product Spec
  cleanIngredients: string;
  netWeightGrams: number;
  packagingFormat: string;
  shelfLifeMonths: number;

  // Economics & Pricing
  mrp: number;
  ingredientCost: number;
  packagingCost: number;
  logisticsCost: number;
  platformFeePct: number;

  // Distribution Mix (%)
  channelD2C: number;
  channelQCommerce: number;
  channelAmazon: number;
  channelCorporate: number;
  channelRetail: number;

  // Campaign & Marketing
  campaignHook: string;
  socialPlatforms: string;
  creatorStrategy: string;
  monthlyAdBudget: number;

  // Projections
  targetMonthlyUnits: number;
  breakEvenMonths: number;
}

export const DEFAULT_PLAN: CapstonePlan = {
  studentName: "",
  selectedTrackId: "product-expansion",
  projectName: "Eat Better Roasted Quinoa Almond Crunch",
  tagline: "Slow-roasted crunch. 100% clean energy. Zero sugarcoating.",
  targetCity: "Bengaluru & Mumbai",
  targetPersona: "Urban tech & corporate professionals aged 24-38 seeking clean 4 PM snacking.",
  problemSolved:
    "Solves the afternoon energy slump without refined sugars, bad oils, or chemical preservatives found in conventional candy and fried snacks.",

  cleanIngredients: "Rolled oats, roasted almonds, puffed quinoa, Arabian dates, chia seeds, cold-pressed coconut oil, sea salt.",
  netWeightGrams: 50,
  packagingFormat: "Nitrogen-flushed recyclable barrier pouch with matte tactile finish",
  shelfLifeMonths: 6,

  mrp: 65,
  ingredientCost: 16,
  packagingCost: 4.5,
  logisticsCost: 5.5,
  platformFeePct: 20, // Quick-commerce / payment gateway average

  channelD2C: 30,
  channelQCommerce: 40,
  channelAmazon: 15,
  channelCorporate: 10,
  channelRetail: 5,

  campaignHook: "#SnackSmartAt4 — Drop the fried samosa, grab real roasted crunch.",
  socialPlatforms: "Instagram Reels, LinkedIn thought leadership, YouTube Shorts",
  creatorStrategy: "Seed sample packs to 50 certified sports nutritionists, tech office managers, and wellness creators.",
  monthlyAdBudget: 250000,

  targetMonthlyUnits: 15000,
  breakEvenMonths: 4,
};

export function calculatePlanMetrics(plan: CapstonePlan) {
  const cogs = plan.ingredientCost + plan.packagingCost;
  const grossProfit = Math.max(0, plan.mrp - cogs);
  const grossMarginPct = plan.mrp > 0 ? (grossProfit / plan.mrp) * 100 : 0;
  const pricePerGram = plan.netWeightGrams > 0 ? plan.mrp / plan.netWeightGrams : 0;

  const commission = (plan.mrp * plan.platformFeePct) / 100;
  const variableCosts = cogs + plan.logisticsCost + commission;
  const netContributionPerUnit = Math.max(0, plan.mrp - variableCosts);
  const contributionMarginPct = plan.mrp > 0 ? (netContributionPerUnit / plan.mrp) * 100 : 0;

  const monthlyGrossRevenue = plan.targetMonthlyUnits * plan.mrp;
  const monthlyGrossProfit = plan.targetMonthlyUnits * grossProfit;
  const monthlyNetContribution = plan.targetMonthlyUnits * netContributionPerUnit;

  return {
    cogs,
    grossProfit,
    grossMarginPct: Number(grossMarginPct.toFixed(1)),
    pricePerGram: Number(pricePerGram.toFixed(2)),
    commission: Number(commission.toFixed(1)),
    variableCosts: Number(variableCosts.toFixed(1)),
    netContributionPerUnit: Number(netContributionPerUnit.toFixed(1)),
    contributionMarginPct: Number(contributionMarginPct.toFixed(1)),
    monthlyGrossRevenue,
    monthlyGrossProfit,
    monthlyNetContribution,
  };
}

const STORAGE_KEY = "eat-better-capstone-5-1";

export const useCapstoneStore = create<{
  plan: CapstonePlan;
  activeStep: number;
  setField: <K extends keyof CapstonePlan>(key: K, value: CapstonePlan[K]) => void;
  setActiveStep: (step: number) => void;
  resetToDefaults: () => void;
  loadSaved: () => void;
}>((set) => ({
  plan: DEFAULT_PLAN,
  activeStep: 1,
  setField: (key, value) => {
    set((state) => {
      const nextPlan = { ...state.plan, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlan));
      } catch {
        // localStorage restricted
      }
      return { plan: nextPlan };
    });
  },
  setActiveStep: (step) => set({ activeStep: step }),
  resetToDefaults: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      //
    }
    set({ plan: DEFAULT_PLAN, activeStep: 1 });
  },
  loadSaved: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        set((state) => ({ plan: { ...state.plan, ...parsed } }));
      }
    } catch {
      //
    }
  },
}));

export function generateCapstoneMarkdown(plan: CapstonePlan, submissionDate = "November 2026"): string {
  const m = calculatePlanMetrics(plan);

  return `# Eat Better Co — Capstone Project Dossier (Task A)
**Student Name:** ${plan.studentName || "[Intern Name]"}  
**Date:** ${submissionDate}  
**Selected Track:** ${plan.selectedTrackId.toUpperCase()}  
**Module:** Module 5 · Final Capstone Projects (Chapter 5.1)  

---

## 1. Executive Summary & Market Fit
- **Project Initiative:** ${plan.projectName}
- **Core Tagline:** "${plan.tagline}"
- **Target Geography:** ${plan.targetCity}
- **Target Customer Persona:** ${plan.targetPersona}
- **Snacking Problem Solved:**  
  ${plan.problemSolved}

---

## 2. Product Specification & Clean-Label Formulation
- **Clean Ingredient Bill of Materials (BOM):**  
  ${plan.cleanIngredients}
- **Clean Label Commitment:** 100% Free from refined sugars, preservatives, trans fats, and artificial additives. Sweetened naturally.
- **Pack Net Weight:** ${plan.netWeightGrams}g
- **Packaging Format:** ${plan.packagingFormat}
- **Target Shelf Life:** ${plan.shelfLifeMonths} months

---

## 3. Financial Mechanics & Unit Economics
| Metric | Unit Value | Strategic Benchmark |
| :--- | :--- | :--- |
| **Maximum Retail Price (MRP)** | ₹${plan.mrp.toFixed(2)} | Competitive target price point |
| **Price Per Gram (₹/g)** | ₹${m.pricePerGram}/g | Eat Better benchmark: ₹0.67–₹1.55/g |
| **Cost of Goods Sold (BOM + Pack)** | ₹${m.cogs.toFixed(2)} | Raw ingredients: ₹${plan.ingredientCost} + Pouch: ₹${plan.packagingCost} |
| **Gross Margin (%)** | **${m.grossMarginPct}%** | Target >= 55% for healthy brand scale |
| **Est. Channel Commission (${plan.platformFeePct}%)** | ₹${m.commission.toFixed(2)} | Blended quick commerce & payment gateway fees |
| **Primary Logistics & Fulfillment** | ₹${plan.logisticsCost.toFixed(2)} | Regional dispatch from Jaipur facility |
| **Net Contribution Per Unit** | **₹${m.netContributionPerUnit.toFixed(2)}** | Contribution Margin: ${m.contributionMarginPct}% |

---

## 4. Omnichannel Distribution Strategy
- **D2C Website (eatbetterco.com):** ${plan.channelD2C}% of volume (high AOV, subscriber bundles)
- **Quick Commerce (Blinkit, Zepto, Instamart):** ${plan.channelQCommerce}% of volume (10-min impulse purchase in top cities)
- **Amazon & Marketplaces:** ${plan.channelAmazon}% of volume (nationwide search-driven organic discovery)
- **Corporate Gifting & Bulk Orders:** ${plan.channelCorporate}% of volume (high seasonal spikes and enterprise contracts)
- **Modern Trade / High-End Retail:** ${plan.channelRetail}% of volume (experiential sampling kiosks)

---

## 5. 360-Degree Go-To-Market & Launch Campaign
- **Campaign Hook / Big Idea:**  
  "${plan.campaignHook}"
- **Core Social Media Platforms:** ${plan.socialPlatforms}
- **Creator & Influencer Seeding Strategy:**  
  ${plan.creatorStrategy}
- **Monthly Digital Marketing Budget:** ₹${plan.monthlyAdBudget.toLocaleString("en-IN")}
  - *Performance Ads (Meta & Google):* 55%
  - *Creator Seeding & PR Gifting:* 25%
  - *Hyperlocal Quick-Commerce Sampling:* 20%

---

## 6. Financial Forecast & Scalability Milestones
- **Target Monthly Unit Sales:** ${plan.targetMonthlyUnits.toLocaleString("en-IN")} units
- **Projected Monthly Gross Revenue:** ₹${m.monthlyGrossRevenue.toLocaleString("en-IN")}
- **Projected Monthly Gross Profit:** ₹${m.monthlyGrossProfit.toLocaleString("en-IN")}
- **Projected Monthly Net Contribution:** ₹${m.monthlyNetContribution.toLocaleString("en-IN")}
- **Estimated Break-Even Horizon:** Month ${plan.breakEvenMonths} post-launch

---

*Generated via the Eat Better Co × SkilliZee Capstone Studio (Module 5).*
`;
}
