"use client";

import React from "react";

export function ToolIcon({ id, className = "size-7" }: { id: string; className?: string }) {
  switch (id) {
    // ── Task A: Presentation & Decks ─────────────────────────────
    case "google-slides":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <path d="M38 42H10a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4Z" fill="#FFBA00" />
          <path d="M31 16H17a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V18a2 2 0 0 0-2-2Z" fill="#FFF" />
          <path d="M19 20h10v8H19z" fill="#FFA000" />
        </svg>
      );

    case "canva":
      return (
        <svg viewBox="0 0 48 48" className={className}>
          <circle cx="24" cy="24" r="22" fill="url(#canvaGrad)" />
          <defs>
            <linearGradient id="canvaGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00C4CC" />
              <stop offset="0.5" stopColor="#7D2AE8" />
              <stop offset="1" stopColor="#FF007A" />
            </linearGradient>
          </defs>
          <path
            d="M27.5 16.5c-4 0-7.2 3.8-7.2 8.5 0 3.8 2 6.5 5.5 6.5 2.8 0 4.8-1.8 5.6-3.2l-2.2-1.5c-.6.9-1.8 2-3.4 2-1.8 0-3-1.4-3-3.8h9c.2-.7.3-1.6.3-2.3 0-3.8-2.2-6.2-4.6-6.2Zm-4.5 6.5c.3-2.5 1.8-4 3.8-4 1.8 0 3 1.3 3.2 4h-7Z"
            fill="#FFF"
          />
        </svg>
      );

    case "gamma":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="12" fill="#6C47FF" />
          <path
            d="M32 16H16a2 2 0 0 0-2 2v8a6 6 0 0 0 6 6h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H22a2 2 0 0 1-2-2v-4h12a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z"
            fill="#FFF"
          />
        </svg>
      );

    case "powerpoint":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#D24726" />
          <path d="M12 14h14a8 8 0 0 1 8 8c0 4.4-3.6 8-8 8H18v6h-6V14Z" fill="#FFF" />
          <path d="M18 20h8a3 3 0 0 1 0 6h-8v-6Z" fill="#D24726" />
        </svg>
      );

    // ── Task A: Financial & Spreadsheets ──────────────────────────
    case "google-sheets":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <path d="M38 42H10a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4Z" fill="#0F9D58" />
          <path d="M32 16H16a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V18a2 2 0 0 0-2-2Z" fill="#FFF" />
          <path d="M14 22h20M14 26h20M22 16v16" stroke="#0F9D58" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "excel":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#107C41" />
          <path d="M16 14h16v20H16z" fill="#FFF" opacity="0.25" />
          <path
            d="M20.5 17h4.8l2.7 5.4 2.8-5.4h4.7l-5 8 5.3 8.6h-4.8l-3-5.7-3.1 5.7h-4.8l5.3-8.6-4.9-8Z"
            fill="#FFF"
          />
        </svg>
      );

    // ── Task A: Strategy & Docs ──────────────────────────────────
    case "notion":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#000" />
          <path
            d="M13 14.5l5.5-1.5L34 16v19.5l-6 2.5-15-1.5V14.5Zm7 3.5v15.5l9 1V19l-9-1Z"
            fill="#FFF"
          />
          <path d="M22.5 19.5l5.5 10v-9h2.5v11.5l-5.5-10v9h-2.5v-11.5Z" fill="#000" />
        </svg>
      );

    case "google-docs":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <path d="M34 6H14a4 4 0 0 0-4 4v28a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4V14l-8-8Z" fill="#4285F4" />
          <path d="M30 6v8h8" fill="#A1C2FA" />
          <path d="M18 20h12M18 25h12M18 30h8" stroke="#FFF" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    // ── Task A: Design & Mockups ─────────────────────────────────
    case "figma":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#1E1E1E" />
          <path d="M18 10h6v8h-6a4 4 0 0 1 0-8Z" fill="#F24E1E" />
          <path d="M24 10h6a4 4 0 0 1 0 8h-6v-8Z" fill="#FF7262" />
          <path d="M18 18h6v8h-6a4 4 0 0 1 0-8Z" fill="#A259FF" />
          <path d="M24 18h6a4 4 0 0 1 0 8h-6v-8Z" fill="#1ABCFE" />
          <path d="M18 26h6v4a4 4 0 0 1-4 4 4 4 0 0 1-2-4v-4Z" fill="#0ACF83" />
        </svg>
      );

    case "adobe-express":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#EB1000" />
          <path
            d="M21 13h6l9 22h-5.5l-2.5-6h-8l-2.5 6H12l9-22Zm1.8 12h4.4L25 19.5 22.8 25Z"
            fill="#FFF"
          />
        </svg>
      );

    // ── Task A: Surveys & Research ───────────────────────────────
    case "google-forms":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <path d="M34 6H14a4 4 0 0 0-4 4v28a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4V14l-8-8Z" fill="#7248B9" />
          <path d="M30 6v8h8" fill="#B39DDB" />
          <circle cx="18" cy="22" r="2" fill="#FFF" />
          <path d="M23 22h7" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
          <circle cx="18" cy="28" r="2" fill="#FFF" />
          <path d="M23 28h7" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "typeform":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#262627" />
          <path d="M16 16h16v5H26v13h-4V21h-6v-5Z" fill="#FFF" />
        </svg>
      );

    case "tally":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#000" />
          <path d="M15 15h4v18h-4zM22 15h4v18h-4zM29 15h4v18h-4zM12 28l24-8v4l-24 8z" fill="#FFF" />
        </svg>
      );

    // ── Task B: Screen & Cam Recorders ───────────────────────────
    case "loom":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#625DF5" />
          <circle cx="24" cy="24" r="5" fill="#FFF" />
          <path
            d="M24 10v6M24 32v6M10 24h6M32 24h6M14 14l4.5 4.5M29.5 29.5L34 34M14 34l4.5-4.5M29.5 18.5L34 14"
            stroke="#FFF"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "tella":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#FF5E62" />
          <circle cx="24" cy="24" r="9" fill="#FFF" />
          <circle cx="24" cy="24" r="4.5" fill="#FF5E62" />
        </svg>
      );

    case "obs":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#1F2326" />
          <circle cx="24" cy="18" r="6" stroke="#FFF" strokeWidth="2.5" />
          <circle cx="18" cy="28" r="6" stroke="#FFF" strokeWidth="2.5" />
          <circle cx="30" cy="28" r="6" stroke="#FFF" strokeWidth="2.5" />
        </svg>
      );

    case "zoom":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#2D8CFF" />
          <path d="M12 18a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V18Z" fill="#FFF" />
          <path d="M30 21l6-4v14l-6-4v-6Z" fill="#FFF" />
        </svg>
      );

    // ── Task B: Smartphone & Teleprompters ────────────────────────
    case "capcut":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#000" />
          <path d="M12 15l10 9-10 9h6l7-6.3L32 33h6l-10-9 10-9h-6l-7 6.3L18 15h-6Z" fill="#FFF" />
        </svg>
      );

    case "promptsmart":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#007AFF" />
          <path
            d="M14 18h20v12a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V18Z"
            stroke="#FFF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M18 22h12M18 26h8" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "phone-camera":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#2C2C2E" />
          <rect x="15" y="10" width="18" height="28" rx="4" stroke="#FFF" strokeWidth="2.2" />
          <circle cx="24" cy="22" r="4" fill="#FF5C00" />
          <circle cx="24" cy="33" r="1.5" fill="#FFF" />
        </svg>
      );

    case "descript":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#1C1F2B" />
          <path d="M16 14h8a10 10 0 0 1 10 10 10 10 0 0 1-10 10h-8V14Z" fill="#00D2B4" />
          <circle cx="24" cy="24" r="4" fill="#1C1F2B" />
        </svg>
      );

    case "inshot":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#FF3355" />
          <rect x="14" y="14" width="20" height="20" rx="4" stroke="#FFF" strokeWidth="2.5" />
          <circle cx="24" cy="24" r="5" fill="#FFF" />
        </svg>
      );

    // ── Task B: E-Commerce Storefront Builders ────────────────────
    case "shopify":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#95BF47" />
          <path
            d="M32.5 13.5c-.3 0-.6.2-.8.4l-3.2 3.1-.2-.2c-1.8-1.7-4.4-2.8-7.3-2.8-5.8 0-10 4.6-10 10.8 0 8.8 8.8 13.2 12.5 13.2.4 0 .7-.1 1-.2l7.2-2.3c.6-.2 1-.7 1-1.3v-20c0-.4-.3-.7-.7-.7Zm-9 20.3c-2.8 0-7.8-3.4-7.8-9.5 0-4.6 3.1-7.8 7.3-7.8 2.3 0 4.3.9 5.8 2.4l-5.3 14.9Z"
            fill="#FFF"
          />
          <path
            d="M34 18l-3.5 3.5 4.5 12.5h2.5V18.5c0-.3-.2-.5-.5-.5H34Z"
            fill="#5E8E3E"
            opacity="0.8"
          />
        </svg>
      );

    case "framer":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#0055FF" />
          <path d="M14 12h20v12H24l-10-12Z" fill="#FFF" />
          <path d="M14 24h10l10 12H14V24Z" fill="#FFF" opacity="0.85" />
          <path d="M14 36l10-12v12H14Z" fill="#FFF" opacity="0.6" />
        </svg>
      );

    case "webflow":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#146EF5" />
          <path
            d="M35 15.5l-4.5 17-5.5-17h-4.5l-3.5 10.5L14 15.5H8l6 17h5l3.5-10 3.5 10h5l6-17H35Z"
            fill="#FFF"
          />
        </svg>
      );

    case "wix":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#0C0C0D" />
          <path
            d="M10 17l3.8 14h3.6l3.2-9 3.2 9h3.6L31 17h-3.6l-2.4 9.5L22.6 17h-3.2l-2.4 9.5L14.6 17H10Zm25 0v3.6h2.5V31H41V20.6h2.5V17H35Z"
            fill="#FFF"
          />
        </svg>
      );

    case "squarespace":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#111" />
          <path
            d="M31.2 16.8a6.5 6.5 0 0 0-9.2 0l-7.2 7.2a6.5 6.5 0 0 0 0 9.2 6.5 6.5 0 0 0 9.2 0l2.3-2.3-3.2-3.2-2.3 2.3a2 2 0 0 1-2.8 0 2 2 0 0 1 0-2.8l7.2-7.2a2 2 0 0 1 2.8 0 2 2 0 0 1 0 2.8l-2.3 2.3 3.2 3.2 2.3-2.3a6.5 6.5 0 0 0 0-9.2Z"
            fill="#FFF"
          />
        </svg>
      );

    case "photoshop":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#001E36" />
          <path d="M15 16h6.5a6 6 0 0 1 0 12H18v6h-3V16Zm3 3v6h3.5a3 3 0 1 0 0-6H18Z" fill="#31A8FF" />
          <path
            d="M26.5 29.5a5 5 0 0 0 3.2 1.3c1.4 0 2.2-.6 2.2-1.6 0-2.4-5.3-1.6-5.3-5.5 0-2.5 2-4.2 5-4.2a6 6 0 0 1 3.5 1.1l-.8 2a5 5 0 0 0-2.7-.9c-1.3 0-2 .6-2 1.5 0 2.3 5.3 1.5 5.3 5.4 0 2.6-2 4.3-5.2 4.3a6.8 6.8 0 0 1-4-1.3l.8-2.1Z"
            fill="#31A8FF"
          />
        </svg>
      );

    case "illustrator":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#330000" />
          <path d="M14 34l6.5-18h3.2L30 34h-3.3l-1.8-5h-6.2l-1.8 5H14Zm5.7-7.7h4.4L22 20.8l-2.3 5.5Z" fill="#FF9A00" />
          <path d="M32.5 20h3v14h-3V20Zm0-4h3v2.8h-3V16Z" fill="#FF9A00" />
        </svg>
      );

    case "placeit":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#2E1C4D" />
          <path
            d="M16 16h16a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V19a3 3 0 0 1 3-3Z"
            stroke="#FFD300"
            strokeWidth="2.5"
          />
          <path d="M21 21v6l5-3-5-3Z" fill="#FF5C00" />
        </svg>
      );

    case "live-url":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#FF5C00" />
          <circle cx="24" cy="24" r="11" stroke="#FFF" strokeWidth="2.5" />
          <ellipse cx="24" cy="24" rx="5" ry="11" stroke="#FFF" strokeWidth="2" />
          <path d="M13 24h22" stroke="#FFF" strokeWidth="2" />
        </svg>
      );

    // ── Task B: Cloud Hosting & Submission ────────────────────────
    case "youtube":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#FF0000" />
          <path d="M21 18l10 6-10 6V18Z" fill="#FFF" />
        </svg>
      );

    case "google-drive":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect width="48" height="48" rx="10" fill="#FFF" />
          <path d="M19 12l-7 12 7 12h7l-7-12 7-12h-7Z" fill="#0066DA" />
          <path d="M19 12h14l7 12h-14l-7-12Z" fill="#FFBA00" />
          <path d="M19 36h14l7-12-3.5-6h-14l-3.5 6 7 12Z" fill="#00AC47" />
        </svg>
      );

    default:
      return (
        <div className={`grid place-items-center rounded-xl bg-orange text-white ${className}`}>
          <span className="text-[0.75rem] font-bold">App</span>
        </div>
      );
  }
}
