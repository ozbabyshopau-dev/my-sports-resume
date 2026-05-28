import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

function isValidUrl(value) {
  if (!value) {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const hasUrl = supabaseUrl.length > 0;
const hasAnonKey = supabaseAnonKey.length > 0;
const hasValidUrl = isValidUrl(supabaseUrl);

export const isSupabaseConfigured = hasValidUrl && hasAnonKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabaseStatus() {
  let message = "Supabase env keys are not configured yet.";

  if (hasUrl && !hasValidUrl) {
    message = "Supabase URL is present but invalid.";
  } else if (!hasUrl && hasAnonKey) {
    message = "Supabase anon key detected, but the URL is missing.";
  } else if (hasValidUrl && !hasAnonKey) {
    message = "Supabase URL detected, but the anon key is missing.";
  } else if (isSupabaseConfigured) {
    message = "Supabase keys detected.";
  }

  return {
    configured: isSupabaseConfigured,
    hasUrl,
    hasAnonKey,
    message,
  };
}
