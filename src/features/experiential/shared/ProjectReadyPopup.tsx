"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Download as DownloadIcon, FileText, Image as ImageIcon, Info, PartyPopper, Upload, X } from "lucide-react";
import type { Student } from "./pdf";

/**
 * The closing screen of every experiential activity: student details (stored only on this device), reflection and
 * real downloads. The moment the student downloads any file, the activity is complete: a pop-up says so, offers
 * every file again, and tells them to submit the files in the next chapter on the SkilliZee portal. It is a note,
 * not a checklist — this page can't know whether anything was uploaded to the LMS, so it never tracks that.
 */

import type { Download } from "./ProjectReady";
export { useStudent } from "./ProjectReady";

export function ProjectReadyPopup({
  student,
  setStudent,
  reflection,
  setReflection,
  reflectionPrompt,
  downloads,
  submitWhat,
  files,
  activity = "this experiential activity",
  onComplete,
}: {
  student: Student;
  setStudent: (s: Student) => void;
  reflection: string;
  setReflection: (s: string) => void;
  reflectionPrompt: string;
  downloads: Download[];
  submitWhat: string;
  /** the file names the student will submit */
  files?: string[];
  /** e.g. "Experiential Activity 2 · Eat Better Brand Studio" */
  activity?: string;
  /** called once, on the first successful download */
  onComplete?: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [made, setMade] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState<string | null>(null);
  const [popup, setPopup] = useState(false);
  const [completed, setCompleted] = useState(false);
  const words = reflection.trim().split(/\s+/).filter(Boolean).length;
  const ready = student.name.trim().length >= 2 && words >= 25;

  const run = async (d: Download) => {
    setErr(null);
    setBusy(d.label);
    try {
      await d.run();
      setMade((m) => ({ ...m, [d.label]: true }));
      if (!completed) {
        setCompleted(true);
        setPopup(true);
        onComplete?.();
      }
    } catch (e) {
      setErr(`Could not create “${d.label}”. ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const Icon = (k: Download["kind"]) => (k === "png" ? ImageIcon : FileText);
  const buttons = (dark: boolean) => (
    <div className="grid gap-2">
      {downloads.map((d) => {
        const I = Icon(d.kind);
        return (
          <button key={d.label} disabled={!ready || !!busy} onClick={() => run(d)} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${dark ? "bg-cream text-cocoa hover:bg-white" : "border border-cocoa/15 bg-white text-cocoa hover:border-orange"}`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange text-white">{busy === d.label ? <DownloadIcon className="size-5 animate-bounce" /> : <I className="size-5" />}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[1.05rem] font-semibold">{d.label}</span>
              <span className="block text-[0.85rem] text-cocoa-2">{d.sub}</span>
            </span>
            {made[d.label] ? <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Downloaded" /> : <DownloadIcon className="size-4 shrink-0 text-cocoa-2" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 rounded-[22px] border border-cocoa/15 bg-white p-5">
        <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.12em] text-orange">Your details</div>
        <p className="mt-1 text-[0.95rem] text-cocoa-2">These go on the cover of your report. They are saved only on this device.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["name", "Full name", true],
              ["id", "Student ID (if you have one)", false],
              ["grade", "Class / grade (if any)", false],
            ] as const
          ).map(([k, label, req]) => (
            <label key={k} className={`flex flex-col gap-1 ${k === "name" ? "sm:col-span-3" : ""}`}>
              <span className="text-[0.85rem] font-bold text-cocoa">
                {label}
                {req && <span className="text-orange"> *</span>}
              </span>
              <input value={student[k] ?? ""} onChange={(e) => setStudent({ ...student, [k]: e.target.value })} className="rounded-xl border border-cocoa/20 px-3 py-2 text-[1rem] text-cocoa outline-none focus:border-orange" />
            </label>
          ))}
        </div>
        <label className="mt-4 flex flex-col gap-1">
          <span className="text-[0.85rem] font-bold text-cocoa">
            Reflection: {reflectionPrompt} <span className="text-orange">*</span>
          </span>
          <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} rows={5} className="rounded-xl border border-cocoa/20 p-3 text-[1rem] text-cocoa outline-none focus:border-orange" placeholder="At least 25 words, in your own words." />
          <span className="text-[0.82rem] text-cocoa-2">{words} words</span>
        </label>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 rounded-[22px] bg-cocoa p-5 text-cream">
        <div className="flex items-center gap-2 font-display text-[1.6rem] font-semibold">
          <CheckCircle2 className="size-7 text-haldi" /> Your Project Is Ready!
        </div>
        <p className="mt-2 text-[1rem] leading-relaxed text-cream/90">Download your project files. {submitWhat}</p>
        <div className="mt-4">{buttons(true)}</div>
        {!ready && (
          <p className="mt-3 flex items-start gap-2 text-[0.9rem] text-haldi">
            <Info className="mt-0.5 size-4 shrink-0" /> Add your name and a reflection of at least 25 words to unlock your downloads.
          </p>
        )}
        {err && <p className="mt-3 text-[0.92rem] text-[#ffb4a8]">{err}</p>}
        {completed && (
          <button onClick={() => setPopup(true)} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-haldi/60 px-3 py-1.5 text-[0.9rem] font-bold text-haldi hover:bg-haldi/10">
            <CheckCircle2 className="size-4" /> Activity complete · how to submit
          </button>
        )}
        <p className="mt-4 flex items-start gap-2 text-[0.88rem] leading-snug text-cream/75">
          <Upload className="mt-0.5 size-4 shrink-0 text-haldi" /> Submit your downloaded files in the next chapter on your SkilliZee learning portal. This page does not upload anything for you.
        </p>
      </motion.div>

      <AnimatePresence>
        {popup && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center bg-cocoa/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="exp-done-title">
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[26px] bg-white p-6 text-cocoa shadow-[0_30px_80px_-30px_rgba(47,28,26,0.8)]">
              <button onClick={() => setPopup(false)} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-cocoa-2 hover:bg-cream">
                <X className="size-5" />
              </button>
              <span className="grid size-14 place-items-center rounded-2xl bg-success/12 text-success">
                <PartyPopper className="size-7" />
              </span>
              <h2 id="exp-done-title" className="mt-3 font-display text-[1.7rem] font-semibold leading-tight">Activity complete!</h2>
              <p className="mt-1 text-[1rem] leading-relaxed text-cocoa-2">
                Well done{student.name.trim() ? `, ${student.name.trim().split(" ")[0]}` : ""}. You have finished {activity}. Download your files from here and submit them in the next chapter on your SkilliZee portal.
              </p>
              <div className="mt-4">{buttons(false)}</div>
              {files && files.length > 0 && (
                <div className="mt-4 rounded-2xl bg-cream p-3">
                  <div className="text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-cocoa-2">Files to submit</div>
                  <ul className="mt-1.5 grid gap-1 text-[0.85rem]">
                    {files.map((f) => (
                      <li key={f} className="flex items-center gap-2 break-all">
                        <FileText className="size-3.5 shrink-0 text-orange" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-3 text-[0.85rem] text-cocoa-2">The files are saved in your device&apos;s downloads folder. Upload them in the next chapter on your SkilliZee portal.</p>
              <button onClick={() => setPopup(false)} className="mt-4 w-full rounded-xl bg-orange px-4 py-2.5 font-bold text-white hover:bg-cocoa">
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
