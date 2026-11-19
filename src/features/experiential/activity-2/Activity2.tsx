"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Check, Download, FileText, Image as ImageIcon, Maximize, Minimize, MonitorPlay, RotateCcw } from "lucide-react";
import { useStudio } from "./store";
import { AUD, CAT, LAUNCH_BUDGET, rupees } from "./data";
import { CTA } from "./ads";
import { checkClaims } from "./claims";
import { drawArtboard, drawCreativeScreen, drawDashboard, drawMockup, drawMoodBoard, drawPackBack, drawPackFront, drawPost, loadAssets, packFormat, type Assets } from "./art";
import { buildKit, launchResults, missingForKit, runAd, shrink } from "./report";
import type { Focus } from "./Studio3D";
import { AdsPanel, BrandPanel, CanvasView, DiscoverPanel, Kicker, LaunchPanel, PackagingPanel, PostPanel, secondary, type BrandTab } from "./Panels";
import { downloadDataUrl } from "../shared/pdf";
import { ProjectReadyPopup as ProjectReady, useStudent } from "../shared/ProjectReadyPopup";
import { detectWebGL } from "@/lib/useClient";

const Studio3D = dynamic(() => import("./Studio3D"), { ssr: false, loading: () => <div className="grid h-full place-items-center text-cocoa-2">Setting up the studio…</div> });

const STAGES = ["Discover", "The brand", "Packaging", "Instagram post", "Ads lab", "Launch", "Project"];

const fileName = (s: string) => (s.trim() || "student").replace(/[^\w-]+/g, "-");


export default function Activity2() {
  const s = useStudio();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- wait for the saved attempt to load from this device
    setHydrated(true);
  }, []);
  const [student, setStudent] = useStudent();
  const [full, setFull] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [tab, setTab] = useState<BrandTab>("products");
  const [sel, setSel] = useState<string | null>(null);
  const [packView, setPackView] = useState<"desk" | "photo">("desk");
  const [assets, setAssets] = useState<Assets | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time capability check
    setWebgl(detectWebGL());
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    loadAssets()
      .then(setAssets)
      .catch(() => undefined);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  /* ── live canvases drawn from the student's work ─────────────────────────────────────────────────── */
  const [cv, setCv] = useState<{ front: HTMLCanvasElement | null; back: HTMLCanvasElement | null; art: HTMLCanvasElement | null; board: HTMLCanvasElement | null }>({ front: null, back: null, art: null, board: null });
  useEffect(() => {
    if (!assets) return;
    const t = setTimeout(() => {
      const front = drawPackFront(s.pack, assets);
      setCv({ front, back: drawPackBack(s.pack, assets), art: drawArtboard(front, s.pack), board: drawMoodBoard(s.pack, assets) });
    }, 90);
    return () => clearTimeout(t);
  }, [assets, s.pack]);
  const [postCv, setPostCv] = useState<{ post: HTMLCanvasElement | null; screen: HTMLCanvasElement | null }>({ post: null, screen: null });
  useEffect(() => {
    if (!assets) return;
    const t = setTimeout(() => {
      const post = drawPost(s.post, s.pack, assets, cv.front);
      const flags = checkClaims(`${s.post.headline}\n${s.post.body}\n${s.post.caption}`).flags;
      const status = { ok: !flags.some((f) => f.severity === "block"), text: flags.length ? flags.map((f) => `${f.label}: “${f.match}”`).join(" · ") : "No unsupported health claims. Benefits are told with supported facts." };
      setPostCv({ post, screen: drawCreativeScreen(post, s.post.caption, status, CTA[s.post.cta].text) });
    }, 120);
    return () => clearTimeout(t);
  }, [assets, s.post, s.pack, cv.front]);
  const dashboard = useMemo(() => {
    if (typeof document === "undefined") return null;
    if (s.stage >= 5 && s.launched) {
      const L = launchResults(s.launch, s.pack, s.post);
      return drawDashboard(
        L.sets.map((x) => ({ label: `${x.name} · ${AUD[x.set.audience].name}`, m: x.m })),
        `Launch · ${rupees(L.total.spend)} of ${rupees(LAUNCH_BUDGET)}`,
      );
    }
    return drawDashboard(
      s.tests.map((t, i) => ({ label: `T${i + 1} · ${AUD[t.audience].name}`, m: runAd(t, s.pack, s.post) })),
      "Meta Ads · campaign dashboard",
    );
  }, [s.stage, s.launched, s.launch, s.tests, s.pack, s.post]);

  const focus: Focus = s.stage === 0 ? "overview" : s.stage === 1 ? (tab === "story" ? "story" : tab === "colour" ? "board" : "shelf") : s.stage === 2 ? packView : s.stage === 3 ? "screens" : s.stage === 4 || s.stage === 5 ? "dashboard" : "photo";

  const go = (n: number) => {
    s.setStage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* not allowed in this view */
    }
  };

  /* ── downloads ───────────────────────────────────────────────────────────────────────────────────── */
  const need = async () => {
    const miss = missingForKit({ ...s, student });
    if (miss.length) throw new Error(`Complete these first: ${miss.join(", ")}.`);
    const a = assets ?? (await loadAssets());
    return a;
  };
  const mockupUrl = (a: Assets) => drawMockup(s.pack, a, student.name).toDataURL("image/png");
  const postUrl = (a: Assets) => drawPost(s.post, s.pack, a, drawPackFront(s.pack, a, 2), 1080).toDataURL("image/png");
  const downloads = [
    {
      label: "Download Campaign Kit (PDF)",
      sub: "Brand Identity & Marketing Campaign Kit · all sections",
      kind: "pdf" as const,
      run: async () => {
        const a = await need();
        const [mockupPng, postPng] = await Promise.all([shrink(mockupUrl(a), 900), shrink(postUrl(a), 820)]);
        await buildKit({ ...s, student, mockupPng, postPng });
      },
    },
    {
      label: "Download Packaging Mockup (PNG)",
      sub: "1600 × 2000 · your pack design",
      kind: "png" as const,
      run: async () => {
        const a = await need();
        downloadDataUrl(mockupUrl(a), `EatBetter-SkilliZee-Packaging-Mockup-${fileName(student.name)}.png`);
      },
    },
    {
      label: "Download Instagram Creative (PNG)",
      sub: "1080 × 1080 · your post",
      kind: "png" as const,
      run: async () => {
        const a = await need();
        downloadDataUrl(postUrl(a), `EatBetter-SkilliZee-Instagram-Creative-${fileName(student.name)}.png`);
      },
    },
  ];

  if (!hydrated) return <div className="grid min-h-screen place-items-center bg-cream text-cocoa-2">Opening the studio…</div>;
  const stage = s.stage;
  const cat = s.pack.category ? CAT[s.pack.category] : null;

  const overlay =
    stage === 0
      ? "Eat Better Brand Studio"
      : stage === 1
        ? tab === "story"
          ? "Our story wall: tap a frame"
          : tab === "colour"
            ? "Colour & typography board"
            : "Product shelf: tap a pack to inspect it"
        : stage === 2
          ? packView === "desk"
            ? "Packaging desk: your pack on the turntable (student concept)"
            : "Photo set: your pack under the softboxes"
          : stage === 3
            ? "Creative review screen: your post"
            : stage === 6
              ? "Your pack on the photo set"
              : "Campaign dashboard (simulated)";

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#EFE6DC] text-cocoa">
      <header className="sticky top-0 z-30 border-b border-cocoa/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-3 py-2 sm:px-5">
          <Image src="/brand/eat-better-x-skillizee-600x400.png" alt="Eat Better Co × SkilliZee" width={90} height={60} className="h-10 w-auto" />
          <div className="min-w-0 flex-1">
            <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-orange">Experiential Activity 2 · Module 2</div>
            <div className="truncate font-display text-[1.15rem] font-semibold leading-tight">Eat Better Brand Studio</div>
          </div>
          <button onClick={() => (s.restart(), setTab("products"), setSel(null), setPackView("desk"))} className={`${secondary} !px-3 !py-1.5 text-[0.85rem]`}>
            <RotateCcw className="size-4" /> Restart
          </button>
          <button onClick={toggleFull} aria-label={full ? "Exit fullscreen" : "Fullscreen"} className={`${secondary} !px-2.5 !py-1.5`}>
            {full ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </button>
        </div>
        <ol className="no-scrollbar mx-auto flex max-w-[1600px] gap-1.5 overflow-x-auto px-3 pb-2 sm:px-5">
          {STAGES.map((t, i) => (
            <li key={t} className="shrink-0">
              <button disabled={i > stage} onClick={() => go(i)} aria-current={i === stage ? "step" : undefined} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.82rem] font-bold ${i === stage ? "bg-orange text-white" : i < stage ? "bg-success/15 text-success hover:bg-success/25" : "bg-white text-cocoa-2/70"}`}>
                {i < stage ? <Check className="size-3.5" strokeWidth={3} /> : <span>{i + 1}</span>}
                {t}
              </button>
            </li>
          ))}
        </ol>
      </header>

      {/* 3D studio: the full-screen background of the whole activity */}
      {/* phones and tablets: the 3D scene gets its own box above the panel, so the whole scene is in view (also inside an LMS iframe of any height); desktop keeps the full-screen scene behind the panel */}
      <div className="relative z-0 mx-3 mt-3 h-[clamp(280px,52svh,480px)] overflow-hidden rounded-[22px] border border-cocoa/15 shadow-[0_18px_40px_-28px_rgba(47,28,26,0.6)] sm:mx-4 lg:fixed lg:inset-0 lg:m-0 lg:h-auto lg:rounded-none lg:border-0 lg:shadow-none">
        {webgl ? (
          <Studio3D
            focus={focus}
            interactive={stage > 0}
            packFront={cv.front}
            packBack={cv.back}
            packFmt={packFormat(s.pack)}
            packColor={s.pack.secondary}
            paper={s.post.bg}
            artboard={cv.art}
            creative={postCv.screen}
            dashboard={dashboard}
            board={cv.board}
            laptop={postCv.post}
            inspected={s.inspected}
            selected={stage === 1 ? sel : null}
            stories={s.stories}
            onShelf={(id) => {
              if (stage !== 1) return;
              setTab("products");
              setSel(id);
              s.inspect(id);
            }}
            onStory={(id) => {
              if (stage !== 1) return;
              setTab("story");
              s.readStory(id);
            }}
          />
        ) : (
          <div className="relative h-full">
            <Image src="/brand/library/site/story-team-preparing.webp" alt="Eat Better team at work" fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-x-3 bottom-3 rounded-xl bg-cream/95 p-3 text-[0.9rem]">3D isn&apos;t available on this device, so the studio is shown as a photo. Every task still works in the panel.</div>
          </div>
        )}
        <div className="pointer-events-none absolute left-3 top-[118px] flex items-center gap-1.5 rounded-full bg-cocoa/85 px-3 py-1 text-[0.8rem] font-bold text-cream">
          <MonitorPlay className="size-3.5" /> {overlay}
        </div>
      </div>

      <div className={`pointer-events-none relative z-10 mx-auto grid w-full max-w-[1600px] flex-1 gap-3 p-3 sm:p-4 ${stage === 6 ? "lg:grid-cols-[minmax(0,0.55fr)_minmax(620px,1.45fr)]" : "lg:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.9fr)]"}`}>
        <div className="hidden lg:block" aria-hidden />
        <section className="pointer-events-auto min-w-0 self-start rounded-[22px] border border-cocoa/15 bg-white/95 p-4 shadow-[0_24px_60px_-30px_rgba(47,28,26,0.55)] backdrop-blur sm:p-5 lg:max-h-[calc(100dvh-130px)] lg:overflow-y-auto">
          {stage === 0 && <DiscoverPanel onStart={() => go(1)} />}
          {stage === 1 && <BrandPanel tab={tab} setTab={setTab} sel={sel} setSel={setSel} onBack={() => go(0)} onNext={() => (setPackView("desk"), go(2))} />}
          {stage === 2 && <PackagingPanel front={cv.front} view={packView} setView={setPackView} onBack={() => go(1)} onNext={() => go(3)} />}
          {stage === 3 && <PostPanel preview={postCv.post} onBack={() => go(2)} onNext={() => go(4)} />}
          {stage === 4 && <AdsPanel onBack={() => go(3)} onNext={() => go(5)} />}
          {stage === 5 && <LaunchPanel onBack={() => go(4)} onNext={() => go(6)} />}
          {stage === 6 && (
            <div>
              <Kicker>Create & submit · your campaign kit</Kicker>
              <h2 className="mt-1 font-display text-[1.5rem] font-semibold">Brand Identity & Marketing Campaign Kit</h2>
              <p className="mt-1 text-[0.95rem] text-cocoa-2">Everything below is generated from your own work: your pack, your post, your tests and your launch.</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <figure className="rounded-2xl bg-cream p-2">
                  <CanvasView src={cv.front} label="Your pack front" className="mx-auto max-h-[200px] w-auto max-w-full rounded-md shadow" />
                  <figcaption className="mt-1.5 text-center text-[0.8rem] font-bold">
                    <ImageIcon className="mr-1 inline size-3.5" />
                    {s.pack.name} · {cat?.name}
                  </figcaption>
                </figure>
                <figure className="rounded-2xl bg-cream p-2">
                  <CanvasView src={postCv.post} label="Your Instagram post" className="mx-auto aspect-square w-full max-w-[200px] rounded-md shadow" />
                  <figcaption className="mt-1.5 text-center text-[0.8rem] font-bold">
                    <FileText className="mr-1 inline size-3.5" />
                    {s.post.headline}
                  </figcaption>
                </figure>
              </div>
              <div className="mt-4">
                <ProjectReady
                  student={student}
                  setStudent={setStudent}
                  reflection={s.reflection}
                  setReflection={s.setReflection}
                  reflectionPrompt="What did you learn about building a brand and marketing it honestly?"
                  downloads={downloads}
                  submitWhat="Submit all three: the PDF campaign kit, the packaging mockup PNG and the Instagram creative PNG."
                  activity="Experiential Activity 2 · Eat Better Brand Studio"
                />
              </div>
              <p className="mt-3 flex items-center gap-2 text-[0.82rem] text-cocoa-2">
                <Download className="size-4" /> Files download to this device. Student details stay on this device.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
