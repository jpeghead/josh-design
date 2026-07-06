"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/settings-store";
import { setSoundEnabled } from "@/lib/ui-sound";

/**
 * Thin client-side bridge: keeps the sound module's `enabled` flag in sync
 * with the user's `Sound` preference. Sound calls happen from anywhere in
 * the app via `playSound(name)`.
 */
export function SoundBridge() {
  const { settings } = useSettings();
  useEffect(() => {
    setSoundEnabled(settings.sound);
  }, [settings.sound]);
  return null;
}
