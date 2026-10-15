import { runScan } from "@/lib/admin/scan";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  const run = await runScan();
  return Response.json(run);
}
