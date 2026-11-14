"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AudId, CategoryId, CreativeId, CtaId, FontId, IngId, MsgId, ObjId, PostImage, PostLayout } from "./data";

export type PackDesign = {
  category: CategoryId | null;
  audience: AudId | null;
  positioning: string;
  name: string;
  variant: string;
  netQty: string;
  primary: string;
  secondary: string;
  accent: string;
  font: FontId;
  layout: "classic" | "band" | "namefirst";
  imgX: number; // -1 left · 0 centre · 1 right
  imgY: number; // -1..1 nudge inside its zone
  imgScale: number; // 0.7..1.3
  description: string;
  claims: string[];
  ingredients: IngId[];
};

export type PostDesign = {
  layout: PostLayout;
  image: PostImage;
  imgX: number;
  imgY: number;
  imgScale: number;
  headline: string;
  body: string;
  cta: CtaId;
  bg: string;
  showLogo: boolean;
  caption: string;
};

export type AdSettings = { audience: AudId; objective: ObjId; daily: number; days: number; creative: CreativeId; message: MsgId };
export type AdSet = { audience: AudId; message: MsgId; daily: number };
export type Launch = { objective: ObjId; creative: CreativeId; days: number; a: AdSet; b: AdSet | null };

type S = {
  stage: number; // 0 discover · 1 brand · 2 packaging · 3 instagram · 4 ads lab · 5 launch · 6 project
  inspected: string[];
  stories: string[];
  colours: string[];
  brandNote: string;
  pack: PackDesign;
  rewrite: string;
  post: PostDesign;
  ad: AdSettings;
  tests: AdSettings[];
  testNote: string;
  launch: Launch;
  launched: boolean;
  justification: string;
  nextTime: string;
  reflection: string;
  setStage: (n: number) => void;
  inspect: (id: string) => void;
  readStory: (id: string) => void;
  seeColour: (id: string) => void;
  setBrandNote: (s: string) => void;
  setPack: (p: Partial<PackDesign>) => void;
  setRewrite: (s: string) => void;
  setPost: (p: Partial<PostDesign>) => void;
  setAd: (p: Partial<AdSettings>) => void;
  addTest: (a: AdSettings) => void;
  setTestNote: (s: string) => void;
  setLaunch: (l: Partial<Launch>) => void;
  setLaunched: (b: boolean) => void;
  setJustification: (s: string) => void;
  setNextTime: (s: string) => void;
  setReflection: (r: string) => void;
  restart: () => void;
};

const fresh = () => ({
  stage: 0,
  inspected: [] as string[],
  stories: [] as string[],
  colours: [] as string[],
  brandNote: "",
  pack: {
    category: null,
    audience: null,
    positioning: "",
    name: "",
    variant: "",
    netQty: "",
    primary: "#FFF5EE",
    secondary: "#2F1C1A",
    accent: "#FF5C00",
    font: "tommy",
    layout: "band",
    imgX: 0,
    imgY: 0,
    imgScale: 1,
    description: "",
    claims: [],
    ingredients: [],
  } as PackDesign,
  rewrite: "",
  post: { layout: "hero", image: "pack", imgX: 0, imgY: 0, imgScale: 1, headline: "", body: "", cta: "shop", bg: "#FF5C00", showLogo: true, caption: "" } as PostDesign,
  ad: { audience: "families", objective: "traffic", daily: 1000, days: 7, creative: "post", message: "taste" } as AdSettings,
  tests: [] as AdSettings[],
  testNote: "",
  launch: { objective: "sales", creative: "post", days: 15, a: { audience: "families", message: "ingredients", daily: 1500 }, b: null } as Launch,
  launched: false,
  justification: "",
  nextTime: "",
  reflection: "",
});

export const useStudio = create<S>()(
  persist(
    (set) => ({
      ...fresh(),
      setStage: (stage) => set({ stage }),
      inspect: (id) => set((s) => (s.inspected.includes(id) ? s : { inspected: [...s.inspected, id] })),
      readStory: (id) => set((s) => (s.stories.includes(id) ? s : { stories: [...s.stories, id] })),
      seeColour: (id) => set((s) => (s.colours.includes(id) ? s : { colours: [...s.colours, id] })),
      setBrandNote: (brandNote) => set({ brandNote }),
      setPack: (p) => set((s) => ({ pack: { ...s.pack, ...p } })),
      setRewrite: (rewrite) => set({ rewrite }),
      setPost: (p) => set((s) => ({ post: { ...s.post, ...p } })),
      setAd: (p) => set((s) => ({ ad: { ...s.ad, ...p } })),
      addTest: (a) => set((s) => ({ tests: [...s.tests, a].slice(-8) })),
      setTestNote: (testNote) => set({ testNote }),
      setLaunch: (l) => set((s) => ({ launch: { ...s.launch, ...l }, launched: false })),
      setLaunched: (launched) => set({ launched }),
      setJustification: (justification) => set({ justification }),
      setNextTime: (nextTime) => set({ nextTime }),
      setReflection: (reflection) => set({ reflection }),
      restart: () => set(fresh()),
    }),
    { name: "eb-exp-2", version: 1 },
  ),
);
