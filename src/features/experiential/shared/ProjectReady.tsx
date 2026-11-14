"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Download, FileText, Image as ImageIcon, Info, Upload } from "lucide-react";
import type { Student } from "./pdf";

/**
 * The closing screen of every experiential activity: student details (stored only on this device), reflection,
 * real downloads, and the reminder to upload the files in the next submission chapter on the SkilliZee portal.
 * Nothing is submitted automatically.
 */

const KEY = "eb-exp-student";

export function useStudent() {
  const [student, setStudent] = useState<Student>({ name: "", id: "", grade: "" });
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from this device
      if (s) setStudent(s);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const update = (s: Student) => {
    setStudent(s);
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  };
  return [student, update] as const;
}

export type Download = { label: string; sub: string; kind: "pdf" | "png" | "csv"; run: () => Promise<void> | void };

export function ProjectReady({
  student,
  setStudent,
  reflection,
  setReflection,
  reflectionPrompt,
  downloads,
  submitWhat,
  files,
}: {
  student: Student;
  setStudent: (s: Student) => void;
  reflection: string;
  setReflection: (s: string) => void;
  reflectionPrompt: string;
  downloads: Download[];
  submitWhat: string;
  /** exact file names the student will upload, shown as a checklist */
  files?: string[];
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [made, setMade] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState<string | null>(null);
  const ready = student.name.trim().length >= 2 && reflection.trim().split(/\s+/).filter(Boolean).length >= 25;

  const run = async (d: Download) => {
    setErr(null);
    setBusy(d.label);
    try {
      await d.run();
      setMade((m) => ({ ...m, [d.label]: true }));
    } catch (e) {
      setErr(`Could not create “${d.label}”. ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const Icon = (k: Download["kind"]) => (k === "png" ? ImageIcon : FileText);

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
          <span className="text-[0.82rem] text-cocoa-2">{reflection.trim().split(/\s+/).filter(Boolean).length} words</span>
        </label>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 rounded-[22px] bg-cocoa p-5 text-cream">
        <div className="flex items-center gap-2 font-display text-[1.6rem] font-semibold">
          <CheckCircle2 className="size-7 text-haldi" /> Your Project Is Ready!
        </div>
        <p className="mt-2 text-[1rem] leading-relaxed text-cream/90">Congratulations! You have completed your experiential activity. Download your project report and submit it in the designated submission chapter on your SkilliZee learning portal.</p>
        <div className="mt-4 grid gap-2">
          {downloads.map((d) => {
            const I = Icon(d.kind);
            return (
              <button key={d.label} disabled={!ready || !!busy} onClick={() => run(d)} className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-left text-cocoa transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange text-white">{busy === d.label ? <Download className="size-5 animate-bounce" /> : <I className="size-5" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[1.05rem] font-semibold">{d.label}</span>
                  <span className="block text-[0.85rem] text-cocoa-2">{d.sub}</span>
                </span>
                {made[d.label] && <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Downloaded" />}
              </button>
            );
          })}
        </div>
        {!ready && (
          <p className="mt-3 flex items-start gap-2 text-[0.9rem] text-haldi">
            <Info className="mt-0.5 size-4 shrink-0" /> Add your name and a reflection of at least 25 words to unlock your downloads.
          </p>
        )}
        {Object.keys(made).length > 0 && <p className="mt-3 text-[0.92rem] text-cream/90">File created. Check your downloads folder.</p>}
        {err && <p className="mt-3 text-[0.92rem] text-[#ffb4a8]">{err}</p>}
        <div className="mt-4 rounded-2xl border-2 border-haldi/70 bg-cream/5 p-4">
          <div className="flex items-center gap-2 font-display text-[1.15rem] font-semibold text-haldi">
            <Upload className="size-5" /> Submit it on the SkilliZee portal
          </div>
          <p className="mt-1 text-[0.95rem] leading-snug text-cream/90">{submitWhat}</p>
          <ol className="mt-3 grid gap-2 text-[0.95rem] leading-snug text-cream">
            {[
              `Download ${downloads.length > 1 ? "every file above" : "the file above"} and keep ${downloads.length > 1 ? "them" : "it"} on your device.`,
              "Open your SkilliZee learning portal and go to the next chapter: the submission chapter for this activity.",
              `Upload ${downloads.length > 1 ? `all ${downloads.length} files` : "the file"} there and press submit.`,
            ].map((t, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-haldi text-[0.8rem] font-extrabold text-cocoa">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          {files && files.length > 0 && (
            <ul className="mt-3 grid gap-1 rounded-xl bg-black/20 p-3 text-[0.82rem] text-cream/85">
              {files.map((f) => (
                <li key={f} className="flex items-center gap-2 break-all">
                  <FileText className="size-3.5 shrink-0 text-haldi" /> {f}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[0.85rem] text-cream/70">This page does not submit anything for you. Your work is only submitted when you upload it on the portal.</p>
        </div>
      </motion.div>
    </div>
  );
}
