import type { GlossaryEntry } from "@/components/chapter/Glossary";

/** Chapter 4.1 word help: everyday meaning + how the word is used in this chapter. */
export const GLOSSARY_4_1: GlossaryEntry[] = [
  { term: "price per gram", match: ["price-per-gram", "per gram"], general: "The price divided by the weight: how much you pay for one gram. It lets you compare packs of different sizes fairly.", chapter: "A 240 g box at ₹349 costs about ₹1.45 for every gram." },
  { term: "SKU", match: ["SKUs"], general: "Stock Keeping Unit: one exact product in one exact pack size, tracked as its own item.", chapter: "The 24-laddoo box and the 42-laddoo box are two different SKUs." },
  { term: "BOM", match: ["Bill of Materials"], general: "Bill of Materials: the list of every ingredient and material that goes into one product, with its cost.", chapter: "Dates, almonds and cashews make Eat Better's BOM costlier than a maida-and-palm-oil snack." },
  { term: "gross margin", match: ["gross margins"], general: "What is left from the selling price after the direct cost of making the product, shown as a percentage of the price: (price - cost) / price.", chapter: "A pack that costs ₹50 to make and sells for ₹100 has a gross margin of 50%." },
  { term: "AOV", match: ["Average Order Value"], general: "Average Order Value: total revenue divided by the number of orders.", chapter: "Combos and bundles lift AOV because each order is bigger." },
  { term: "clean-label", match: ["clean label"], general: "A food made with short, simple, honest ingredients and without artificial additives.", chapter: "No artificial preservatives, bad fats or refined sugars: this promise earns a price premium." },
  { term: "value-based pricing", general: "Setting a price by how much the customer values the product, not only by what it cost to make.", chapter: "Health-conscious shoppers pay more for a clean-label snack." },
  { term: "multi-pack", match: ["multi-pack discounting", "combo boxes", "bundled purchases"], general: "Several packs sold together in one box or bundle.", chapter: "The Ultimate Snack Box holds 12 packs and costs less per gram than most single packs." },
  { term: "top-line", match: ["top-line revenue", "top line"], general: "A company's total sales revenue: it is the top line of an income statement.", chapter: "FY24 top-line revenue was ₹14.47 crore; FY25 reached ₹23.90 crore." },
  { term: "net loss", general: "What remains negative when all costs are subtracted from revenue: the company spent more than it earned.", chapter: "Net loss for FY24 was ₹62.96 lakh, down from ₹1.18 crore in FY23." },
  { term: "operational leverage", match: ["operating leverage"], general: "When sales grow faster than fixed costs such as salaries and rent, each extra rupee of sales leaves a bigger share as profit.", chapter: "Top-line scale outpacing fixed overheads narrows the loss." },
  { term: "YoY", match: ["year-on-year", "year on year"], general: "Year over year: comparing one year with the year before it.", chapter: "About 171.5% YoY growth means FY24 revenue is about 2.7 times FY23's; FY25 grew a reported 63%." },
  { term: "FY", match: ["FY23", "FY24", "financial year"], general: "Financial year: the 12-month period a company uses for its accounts. In India it runs April to March.", chapter: "FY24 is the financial year ending March 2024." },
  { term: "order velocity", match: ["fulfilled orders"], general: "How fast orders are coming in and being delivered.", chapter: "About 2 lakh fulfilled orders per month across web, marketplace and quick-commerce." },
  { term: "lakh", match: ["lakhs"], general: "An Indian unit: 1 lakh = 100,000.", chapter: "₹62.96 lakh is ₹6,296,000; 2 lakh orders is 200,000 orders." },
  { term: "crore", match: ["crores"], general: "An Indian unit: 1 crore = 10,000,000 (100 lakh).", chapter: "₹14.47 crore is ₹144,700,000." },
];
