import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The site's faces, embedded into the résumé HTML as data URIs so the PDF
 * carries them (Chromium subsets and embeds @font-face fonts). Both are OFL;
 * licenses sit beside the files in src/app/fonts.
 */
let cached: string | null = null;
export function resumeFontCss(): string {
  if (cached) return cached;
  const dir = join(process.cwd(), "src", "app", "fonts");
  const face = (family: string, file: string, weight: number) =>
    `@font-face{font-family:"${family}";font-weight:${weight};font-style:normal;src:url(data:font/ttf;base64,${readFileSync(join(dir, file)).toString("base64")}) format("truetype");}`;
  cached = [face("Instrument Serif", "InstrumentSerif-Regular.ttf", 400), face("Geist", "Geist-Regular.ttf", 400), face("Geist", "Geist-Medium.ttf", 500), face("Geist", "Geist-SemiBold.ttf", 600)].join("\n");
  return cached;
}
