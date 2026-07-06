"use client";

import dynamic from "next/dynamic";
import type { OpenWindow } from "@/lib/window-store";

// Lazy-load each content component so heavy windows (case studies, etc.)
// only ship when first opened. The OS shell stays small.
const WorkContent = dynamic(() => import("./content/work-content").then((m) => m.WorkContent));
const ProjectContent = dynamic(() => import("./content/project-content").then((m) => m.ProjectContent));
const JournalContent = dynamic(() => import("./content/journal-content").then((m) => m.JournalContent));
const EntryContent = dynamic(() => import("./content/entry-content").then((m) => m.EntryContent));
const AboutContent = dynamic(() => import("./content/about-content").then((m) => m.AboutContent));
const ContactContent = dynamic(() => import("./content/contact-content").then((m) => m.ContactContent));
const ReadmeContent = dynamic(() => import("./content/readme-content").then((m) => m.ReadmeContent));
const InfoContent = dynamic(() => import("./content/info-content").then((m) => m.InfoContent));
const PrefsContent = dynamic(() => import("./content/prefs-content").then((m) => m.PrefsContent));

export function WindowContent({ w }: { w: OpenWindow }) {
  switch (w.app) {
    case "work":
      return <WorkContent />;
    case "project":
      return w.param ? <ProjectContent slug={w.param} /> : null;
    case "journal":
      return <JournalContent />;
    case "entry":
      return w.param ? <EntryContent slug={w.param} /> : null;
    case "about":
      return <AboutContent />;
    case "contact":
      return <ContactContent />;
    case "readme":
      return <ReadmeContent />;
    case "info":
      return w.param ? <InfoContent param={w.param} /> : null;
    case "prefs":
      return <PrefsContent />;
    default:
      return null;
  }
}
