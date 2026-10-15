import { readJson, writeJson, id as newId } from "../store";
import type { Application } from "./types";

export function listApplications(): Application[] {
  return readJson<Application[]>("applications", []);
}
export function getApplication(id: string): Application | undefined {
  return listApplications().find((a) => a.id === id);
}
export function saveApplication(a: Application): Application {
  const all = listApplications().filter((x) => x.id !== a.id);
  writeJson("applications", [a, ...all]);
  return a;
}
export function newApplication(partial: Omit<Application, "id" | "status" | "fields" | "steps" | "startedAt">): Application {
  return saveApplication({ id: newId("app"), status: "starting", fields: [], steps: [], startedAt: new Date().toISOString(), ...partial });
}
