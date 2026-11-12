import type { GlossaryEntry } from "@/components/chapter/Glossary";

/** Chapter 3.4 word help: everyday meaning + how the word is used in this chapter. */
export const GLOSSARY_3_4: GlossaryEntry[] = [
  { term: "Go-to-Market", match: ["GTM", "go-to-market strategy"], general: "A company's plan for how its product reaches the people who buy it.", chapter: "Eat Better uses four channels at once: its website, marketplaces, quick commerce and bulk/corporate." },
  { term: "omnichannel", general: "Selling through many channels at the same time, with the stock and brand kept in sync.", chapter: "The same snack can be bought on the website, on Amazon, on Blinkit, or inside a corporate hamper." },
  { term: "direct-to-consumer", match: ["D2C"], general: "Selling straight to the customer from the brand's own website, with no shop in between.", chapter: "The own website: high-margin orders, first-party data, subscriptions and custom bundles." },
  { term: "first-party data", general: "Information a company collects directly from its own customers, such as what they order and how often.", chapter: "Orders on the own website give Eat Better its own customer data; marketplace orders don't." },
  { term: "fulfillment", match: ["fulfilment", "fulfillment model"], general: "Everything that happens after an order is placed: picking, packing, shipping, delivering.", chapter: "Each channel has its own fulfilment model, from a central warehouse to a dark store." },
  { term: "3PL", match: ["3PL logistics"], general: "Third-party logistics: an outside company that stores, packs and ships for you.", chapter: "Website orders go out through a central warehouse or a 3PL." },
  { term: "dark store", match: ["dark stores", "micro-fulfillment hubs"], general: "A small local warehouse that only serves delivery orders; customers never walk in.", chapter: "Quick-commerce platforms stock Eat Better in urban dark stores to deliver in 10–20 minutes." },
  { term: "quick commerce", match: ["Q-commerce", "Quick Commerce"], general: "Delivery apps that bring groceries and snacks in minutes, such as Blinkit, Zepto and Swiggy Instamart.", chapter: "A key driver of impulse snacking and rapid volume growth." },
  { term: "impulse snacking", match: ["impulse"], general: "Buying a snack on the spur of the moment, not from a planned list.", chapter: "Ten-minute delivery turns a craving into an order." },
  { term: "Tier-1, Tier-2, and Tier-3 cities", match: ["Tier-1", "Tier-2", "Tier-3"], general: "A way of grouping Indian cities by size: the biggest metros are Tier-1, smaller cities Tier-2 and Tier-3.", chapter: "Marketplaces carry Eat Better to all three tiers." },
  { term: "lead time", match: ["lead times", "demand lead times"], general: "The time between placing an order and receiving it.", chapter: "Corporate orders come with predictable lead times, so they can be planned." },
  { term: "clean-label", general: "Made with simple, recognisable ingredients and no artificial additives.", chapter: "No artificial preservatives means freshness depends on packaging and handling." },
  { term: "stockout", match: ["stockouts"], general: "Running out of a product so a customer can't buy it.", chapter: "Too little stock in a dark store means lost sales; too much risks expiry." },
  { term: "shelf life", match: ["shelf-life", "shelf-life expiration"], general: "How long a product stays good to eat.", chapter: "Stock sent to a dark store must sell before it expires." },
  { term: "throughput", general: "How much work gets done in a given time, such as orders packed per day.", chapter: "Festive peaks need more warehouse and packing throughput." },
  { term: "average order value", match: ["AOV", "low-average-order-value"], general: "The average amount a customer spends per order.", chapter: "Shipping a single low-priced pack costs a big share of what the customer paid." },
  { term: "return-to-origin", match: ["RTO"], general: "A parcel that could not be delivered and is sent back to the seller.", chapter: "RTO is common on cash-on-delivery orders, and the brand pays for both journeys." },
  { term: "cash-on-delivery", match: ["COD"], general: "Paying the delivery person in cash when the parcel arrives, instead of paying online.", chapter: "COD orders are more likely to be refused at the door and returned." },
  { term: "last-mile", match: ["last mile"], general: "The final stretch of a delivery, from the local hub to the customer's door.", chapter: "The most expensive part of pan-India shipping." },
];
