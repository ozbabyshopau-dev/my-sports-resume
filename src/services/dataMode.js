import { isSupabaseConfigured } from "./supabaseClient";

function isBackendToggleEnabled() {
  return String(import.meta.env.VITE_ENABLE_BACKEND || "")
    .trim()
    .toLowerCase() === "true";
}

export function isBackendEnabled() {
  return isBackendToggleEnabled() && isSupabaseConfigured;
}

export function getDataMode() {
  return isBackendEnabled() ? "supabase" : "local";
}

export function getBackendReadinessMessage() {
  if (isBackendEnabled()) {
    return "Supabase auth can run in this phase while athlete, highlight, and opportunity data remain local on this device.";
  }

  if (isSupabaseConfigured) {
    return "Supabase keys detected, but backend writes are not enabled yet.";
  }

  return "Local V1 demo is active. Data is saved on this device only.";
}
