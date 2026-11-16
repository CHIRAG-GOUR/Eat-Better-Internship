/**
 * Chapter 5.2 — Task B: Video Pitch / Review.
 * Short Video Pitch, Teleprompter Script, and Production Guide for Eat Better Co.
 */

export const CHAPTER = {
  module: "Module 5 · Final Capstone Projects",
  number: "5.2",
  title: ["Capstone Task B:", "Video Pitch / Review"] as [string, string],
  subtitle:
    "Create a compelling 60 to 90-second video pitch or product review that positively showcases what you learned about Eat Better Co.",
  objective:
    "Create a short video pitch or product review that positively presents what the intern learned about Eat Better.",
};

export const LIB = "/brand/library";

export interface PitchFormat {
  id: string;
  title: string;
  targetAudience: string;
  idealFor: string;
  badge: string;
  description: string;
  suggestedProps: string[];
  sampleScript: {
    hook: string;
    insight: string;
    solution: string;
    cta: string;
  };
}

export const PITCH_FORMATS: PitchFormat[] = [
  {
    id: "founder-pitch",
    title: "Founder / GTM Strategy Pitch",
    targetAudience: "Eat Better Leadership, Product Heads, or Angel Investors",
    idealFor: "Interns who designed a new product variant, hamper, or GTM expansion in Task A.",
    badge: "Business & Pitch",
    description:
      "Pitch your Task A initiative as an entrepreneur or associate brand manager presenting to the leadership team. Emphasize consumer demand, clean formulation, and strong unit economics.",
    suggestedProps: ["Product mock-up or packaging sketch", "Laptop/tablet showing margin chart", "Professional business attire"],
    sampleScript: {
      hook: "Did you know that 82% of urban snackers want to eat healthier at 4 PM, but the market only gives them fake 'diet' snacks stuffed with hidden sugars and palm oil?",
      insight: "During my internship at Eat Better Co, I realized why this brand broke out to ₹14.7 crore revenue: they refuse to compromise. 100% clean ingredients, zero refined sugar, made fresh in Jaipur.",
      solution: "Building on this foundation, my Capstone project introduces our new initiative: a high-margin clean snack engineered for quick-commerce delivery in under 10 minutes, generating a 62% gross margin.",
      cta: "Eat Better has already delivered over 2 lakh orders a month. With this strategy, we take clean Indian snacking to the next frontier. Thank you!",
    },
  },
  {
    id: "product-review",
    title: "Clean-Label Taste & Brand Review",
    targetAudience: "Everyday Consumers, Snackers, and Health-Conscious Shoppers",
    idealFor: "Interns passionate about content creation, authentic tasting reviews, and consumer advocacy.",
    badge: "Consumer & Creator",
    description:
      "Deliver an energetic, honest consumer review comparing standard supermarket snacks to Eat Better's wholesome ingredients. Highlight taste, texture, and the relief of eating snacks with zero refined sugar.",
    suggestedProps: ["Eat Better Laddoo or Namkeen pack", "Plate with whole almonds/dates", "Casual, vibrant setup"],
    sampleScript: {
      hook: "Flip over almost any 'healthy' snack in your pantry, and you'll find maltodextrin, artificial flavours, or 60% refined sugar disguised as health food.",
      insight: "That's why studying Eat Better Co was eye-opening. When you look at their Assorted Laddoos, the first ingredients are actual dates, cashews, almonds, and watermelon seeds. That's it. Nothing hidden.",
      solution: "And the taste? Rich, fudgy, and naturally sweet without that sickening sugar crash. It satisfies your sweet tooth while keeping your energy steady through a long workday.",
      cta: "If you're tired of being lied to by snack labels, do your body a favour and switch to Eat Better Co. Better ingredients, better snacking!",
    },
  },
  {
    id: "internship-reflection",
    title: "Executive Case Study & Learning Reflection",
    targetAudience: "Hiring Managers, University Mentors, and Professional Network",
    idealFor: "Interns looking to showcase full-stack business acumen, analytical rigor, and systems thinking.",
    badge: "Career & Portfolio",
    description:
      "Synthesize your full 5-module learning journey: from clean-label formulation and supply chains to unit economics and scaling up. Present key strategic takeaways with authority.",
    suggestedProps: ["Notebook or tablet with internship notes", "Clean minimalist backdrop", "Smart-casual presentation setup"],
    sampleScript: {
      hook: "How does a bootstrapped Indian food brand achieve 165% revenue growth while maintaining zero preservatives and zero refined sugar?",
      insight: "Throughout my internship with Eat Better Co and SkilliZee, I analyzed the real mechanics: from their 50,000 sq. ft. Jaipur kitchen facility to achieving positive unit contribution margins across quick-commerce.",
      solution: "I learned that pricing tells a story: a premium price per gram must be justified by authentic raw materials and relentless operational discipline across both D2C and dark stores.",
      cta: "This internship bridged the gap between classroom theory and high-velocity consumer brand execution. Check out my full Capstone dossier linked below!",
    },
  },
];

export const FOUR_BEATS = [
  {
    beat: 1,
    name: "The Hook",
    timing: "0 – 15 seconds",
    wordCount: "~25 – 35 words",
    goal: "Stop the scroll immediately. State a surprising statistic, a relatable snack struggle, or a provocative question.",
    tip: "Never start with 'Hello, my name is...' Start with the problem!",
  },
  {
    beat: 2,
    name: "The Insight & Discovery",
    timing: "15 – 35 seconds",
    wordCount: "~40 – 50 words",
    goal: "Introduce what makes Eat Better Co special: clean label, authentic Jaipur facility, and zero refined sugar.",
    tip: "Contrast conventional mass-market junk snacks with Eat Better's transparent ingredients.",
  },
  {
    beat: 3,
    name: "The Solution / Your Initiative",
    timing: "35 – 65 seconds",
    wordCount: "~60 – 75 words",
    goal: "Showcase your specific Task A strategy or review the product experience, highlighting unit economics or taste.",
    tip: "Be specific with numbers (e.g. 62% gross margin, ₹1.45/g, 2 lakh orders/month).",
  },
  {
    beat: 4,
    name: "The Climax & Call to Action",
    timing: "65 – 90 seconds",
    wordCount: "~25 – 35 words",
    goal: "Leave a lasting positive impression. Guide the audience on what to do next (try Eat Better, approve the GTM plan).",
    tip: "End with high energy and a memorable closing sentence.",
  },
];

export interface VideoToolCategory {
  category: string;
  badge: string;
  description: string;
  tools: {
    name: string;
    description: string;
    highlight: string;
    badge?: string;
  }[];
}

export const RECOMMENDED_TOOLS_TASK_B: VideoToolCategory[] = [
  {
    category: "Screen & Camera Recorders",
    badge: "Recommended for Quick Recording",
    description: "Record your webcam and presentation slides simultaneously with instant cloud links.",
    tools: [
      {
        name: "Loom",
        description: "Free, seamless browser extension or desktop app. Records webcam + screen simultaneously with an instant shareable link.",
        highlight: "Easiest tool: no file export or uploading required. Just copy the Loom URL.",
        badge: "Top Recommendation",
      },
      {
        name: "Tella.tv",
        description: "Creator-friendly screen and camera recorder with beautiful backgrounds, camera zooms, and instant link generation.",
        highlight: "Best for sleek, polished pitch presentations with side-by-side slides.",
      },
      {
        name: "OBS Studio",
        description: "Free, open-source recording studio software with full control over camera framing, audio filters, and scenes.",
        highlight: "Best for students who want high-definition local MP4 capture.",
      },
      {
        name: "Zoom Cloud Recording",
        description: "Start a solo Zoom meeting, share your pitch deck, and record directly to the cloud or local computer.",
        highlight: "Familiar tool available on every laptop.",
      },
    ],
  },
  {
    category: "Smartphone Camera & Mobile Teleprompters",
    badge: "Mobile Creator Setup",
    description: "Use your phone's high-definition camera with a rolling script near the camera lens.",
    tools: [
      {
        name: "CapCut Mobile Teleprompter",
        description: "Free built-in teleprompter feature inside the CapCut app. Scrolls your script on-screen directly next to the camera lens.",
        highlight: "Maintains 100% natural eye contact with the viewer while reciting your script.",
        badge: "Best Free Mobile App",
      },
      {
        name: "PromptSmart Pro",
        description: "Voice-tracking teleprompter app for iOS and Android that automatically scrolls as you speak at your natural pace.",
        highlight: "Speech-recognition scrolling prevents awkward pauses.",
      },
      {
        name: "Native Phone Camera (1080p/4K)",
        description: "Mount your phone on a tripod or books at eye level. Record using the primary rear camera for crisp quality.",
        highlight: "Superior image quality compared to most built-in laptop webcams.",
      },
      {
        name: "Elegant Teleprompter (Android) / BigVu (iOS)",
        description: "Lightweight floating teleprompter overlays that sit on top of any camera application.",
        highlight: "Simple floating text widget with adjustable speed.",
      },
    ],
  },
  {
    category: "Video Editing & Polish (Optional)",
    badge: "Optional Post-Production",
    description: "Trim pauses, add automatic captions, or overlay b-roll product photos.",
    tools: [
      {
        name: "CapCut (Desktop & Mobile)",
        description: "Free video editor with 1-click auto-captions, jump-cut trimming, and clean sound enhancements.",
        highlight: "Auto-generate engaging animated subtitles in 30 seconds.",
        badge: "Recommended Editor",
      },
      {
        name: "Descript",
        description: "Revolutionary text-based video editor. Edit your video by simply deleting words in the transcript.",
        highlight: "Automatically removes filler words ('um', 'ah') with one click.",
      },
      {
        name: "Canva Video / InShot",
        description: "Quick mobile and web video trimming, aspect ratio adjustment (9:16 vertical or 16:9 widescreen), and text titles.",
        highlight: "Fastest way to add a title card and call to action.",
      },
    ],
  },
  {
    category: "Cloud Video Hosting & Sharing",
    badge: "Submission Formats",
    description: "Host your video on a cloud platform and submit the public link into the LMS portal.",
    tools: [
      {
        name: "Loom Link",
        description: "Submit your public Loom video link directly. Evaluators can watch instantly at 1x or 1.25x speed.",
        highlight: "Instant submission with zero upload friction.",
        badge: "Fastest",
      },
      {
        name: "YouTube (Unlisted)",
        description: "Upload your video to YouTube and select 'Unlisted'. Anyone with the URL can watch, but it remains private from search.",
        highlight: "Universal playback compatibility on any phone or browser.",
        badge: "Universal",
      },
      {
        name: "Google Drive Public Link",
        description: "Upload your video MP4 to Google Drive and set sharing permissions to 'Anyone with the link can view'.",
        highlight: "Reliable cloud storage option.",
      },
    ],
  },
];

export const PRODUCTION_TIPS = [
  {
    title: "Audio Clarity is 60% of Quality",
    desc: "Record in a furnished room with minimal echo. Use a lavalier mic or phone earphones held close to your chest. Keep ambient background noise to zero.",
  },
  {
    title: "Face the Natural Light",
    desc: "Position yourself facing a window or soft ring light. Avoid backlight behind you. Keep the camera at eye level so you look straight at the viewer.",
  },
  {
    title: "Hold Props at Chest Level",
    desc: "If holding an Eat Better pack or prop, bring it up to chest level so it stays inside the camera frame while maintaining natural eye contact.",
  },
  {
    title: "Pacing & Speaking Speed",
    desc: "Aim for a conversational 130 to 150 words per minute. Pause for half a second after key numbers to let the insight sink in.",
  },
];

export const VIDEO_SUBMISSION_CHECKLIST = [
  "Duration is strictly between 60 and 90 seconds (not too rushed, not dragging)",
  "Positively and accurately presents Eat Better Co's clean-label brand ethos",
  "Clearly references specific learnings (clean ingredients, unit economics, or Task A GTM strategy)",
  "Audio is crisp, loud, and free of distracting echoes",
  "Lighting is bright and camera is stable at eye level",
  "Uploaded to a shareable link (Unlisted YouTube, Loom, or public Google Drive)",
];

export const TAKEAWAY_5_2 =
  "Great business leaders don't just build strategies; they communicate them with passion, clarity, and conviction. A great pitch makes people care about the mission as much as the numbers.";
