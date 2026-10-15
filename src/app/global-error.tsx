"use client";

/** Last resort when the root layout itself fails: no fonts, no components, just a way out. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0a0a", color: "#f5f5f3", fontFamily: "system-ui, sans-serif", padding: "20vh 24px" }}>
        <p style={{ color: "#a3a3a0", fontSize: 14 }}>Something broke</p>
        <h1 style={{ fontSize: 40, fontWeight: 500, margin: "12px 0 16px", lineHeight: 1.05 }}>The site didn&rsquo;t load.</h1>
        <p style={{ color: "#a3a3a0", maxWidth: 560, lineHeight: 1.4 }}>
          {error.digest ? `Reference ${error.digest}. ` : ""}Reloading usually fixes it. If not, email josh@josh.design and say what you were opening.
        </p>
        <button type="button" onClick={reset} style={{ marginTop: 24, background: "#f5f5f3", color: "#0a0a0a", border: 0, borderRadius: 999, padding: "10px 18px", fontSize: 15, cursor: "pointer" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
