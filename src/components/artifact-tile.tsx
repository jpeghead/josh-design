import Link from "next/link";
import type { Artifact } from "@/content/archive";

/**
 * An artifact in the archive. Renders a real image when one exists, otherwise a
 * clearly-labeled placeholder at the correct aspect ratio. Never a fake image.
 */
export function ArtifactTile({ artifact }: { artifact: Artifact }) {
  const ratio = artifact.aspect.replace("/", " / ");

  const media = artifact.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={artifact.image}
      alt={`${artifact.title} — ${artifact.caption}`}
      loading="lazy"
      decoding="async"
      className="block h-full w-full object-cover"
    />
  ) : (
    <div className="awaiting-scan h-full w-full flex-col gap-2 p-4">
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-60">
        Awaiting scan
      </span>
      <span className="font-display text-lg italic opacity-80">
        {artifact.title}
      </span>
    </div>
  );

  const frame = (
    <div
      className="w-full overflow-hidden border border-current/10 bg-current/[0.03] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1"
      style={{ aspectRatio: ratio }}
    >
      {media}
    </div>
  );

  return (
    <figure className="group">
      {artifact.href ? (
        <Link href={artifact.href} aria-label={`${artifact.title} — ${artifact.caption}`}>
          {frame}
        </Link>
      ) : (
        frame
      )}
      <figcaption className="mt-2 flex items-baseline justify-between gap-3">
        <span className="text-sm">{artifact.title}</span>
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-55">
          {artifact.caption}
        </span>
      </figcaption>
    </figure>
  );
}
