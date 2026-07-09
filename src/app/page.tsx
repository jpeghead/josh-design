import { ArchiveMount } from "@/components/canvas/mount";
import { PortfolioHome } from "@/components/portfolio-home";

export default function Home() {
  return (
    <>
      {/* Whitehead City — the desk-first experience. On capable devices the
          homepage IS the desktop at Josh's desk in the game world; stepping
          back reveals the city. The DOM below stays for AT, search, no-JS,
          and reduced motion. */}
      <ArchiveMount />

      <div data-dom-walk>
        <PortfolioHome />
      </div>
    </>
  );
}
