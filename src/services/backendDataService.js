const BACKEND_DISABLED_REASON = "backend_not_enabled";
const BACKEND_DISABLED_MESSAGE =
  "Supabase backend scaffold is present, but the local demo remains the active data path.";

function createDisabledReadResult(data = []) {
  return {
    ok: false,
    enabled: false,
    reason: BACKEND_DISABLED_REASON,
    message: BACKEND_DISABLED_MESSAGE,
    data,
  };
}

function createDisabledWriteResult(data = null) {
  return {
    ok: false,
    enabled: false,
    reason: BACKEND_DISABLED_REASON,
    message: BACKEND_DISABLED_MESSAGE,
    data,
  };
}

export async function getProfiles() {
  return createDisabledReadResult([]);
}

export async function saveProfile() {
  return createDisabledWriteResult(null);
}

export async function getHighlights() {
  return createDisabledReadResult([]);
}

export async function saveHighlight() {
  return createDisabledWriteResult(null);
}

export async function getOpportunities() {
  return createDisabledReadResult([]);
}

export async function saveOpportunity() {
  return createDisabledWriteResult(null);
}

export async function getContactRequests() {
  return createDisabledReadResult([]);
}

export async function saveContactRequest() {
  return createDisabledWriteResult(null);
}

export async function getShortlist() {
  return createDisabledReadResult([]);
}

export async function saveShortlist() {
  return createDisabledWriteResult(null);
}
