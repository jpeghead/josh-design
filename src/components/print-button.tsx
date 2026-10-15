"use client";
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="text-sm underline decoration-fg-3 underline-offset-4 hover:decoration-fg">
      Print or save as PDF
    </button>
  );
}
