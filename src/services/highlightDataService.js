import { getCurrentUser, isRealAuthEnabled } from "./authService";
import { readLocalData, writeLocalData } from "./localDataService";
import { supabase } from "./supabaseClient";

const HIGHLIGHT_STORAGE_KEY = "msr_highlights_v1";
const HIGHLIGHTS_TABLE = "highlights";
const HIGHLIGHT_MIGRATION_STATUS = "Profiles + Highlights metadata only";
const HIGHLIGHT_APPROVAL_LABELS = {
  pending_parent_approval: "Pending Parent Approval",
  pending_review: "Pending Admin Review",
  parent_approved: "Parent Approved",
  coach_verified: "Coach Verified",
  club_verified: "Club Verified",
  admin_approved: "Admin Approved",
  rejected: "Rejected",
};
const HIGHLIGHT_SHOWCASE_LABELS = {
  private: "Private",
  profile_only: "Profile Only",
  showcase_requested: "Showcase Requested",
  showcase_approved: "Showcase Approved",
};

let highlightsTableCache = {
  checked: false,
  detected: null,
  message: "",
};

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function toNullableString(value) {
  const trimmed = String(value || "").trim();
  return trimmed ? trimmed : null;
}

function clampBoostCount(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.round(numeric));
}

function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim(),
  );
}

function createHighlightUuid() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `highlight-${Date.now()}`;
}

function normalizeApprovalStatusForDatabase(status, isJunior = false, verificationSource = "") {
  const normalized = normalizeText(status);
  const source = normalizeText(verificationSource);

  if (normalized === "pending parent approval") {
    return "pending_parent_approval";
  }

  if (normalized === "parent approved") {
    return "parent_approved";
  }

  if (normalized === "coach verified" || source === "coach") {
    return "coach_verified";
  }

  if (normalized === "club verified" || source === "club") {
    return "club_verified";
  }

  if (
    normalized === "admin approved" ||
    normalized === "admin reviewed" ||
    source === "admin"
  ) {
    return "admin_approved";
  }

  if (normalized === "rejected" || normalized === "request changes") {
    return "rejected";
  }

  return isJunior ? "pending_parent_approval" : "pending_review";
}

function normalizeShowcaseStatusForDatabase(status, isJunior = false, approvalStatus = "") {
  const normalized = normalizeText(status);
  const approval = normalizeText(approvalStatus);

  if (normalized === "showcase approved") {
    if (
      isJunior &&
      !["parent approved", "coach verified", "club verified", "admin approved"].includes(approval)
    ) {
      return "showcase_requested";
    }

    return "showcase_approved";
  }

  if (normalized === "showcase requested") {
    return "showcase_requested";
  }

  if (normalized === "profile only") {
    return "profile_only";
  }

  return "private";
}

function mapApprovalStatusToHighlight(status, isJunior = false) {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) {
    return isJunior ? "Pending Parent Approval" : "Pending Admin Review";
  }

  return HIGHLIGHT_APPROVAL_LABELS[normalized] || "Pending Admin Review";
}

function mapShowcaseStatusToHighlight(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return HIGHLIGHT_SHOWCASE_LABELS[normalized] || "Private";
}

function normalizeVerificationSource(value, isJunior = false) {
  const normalized = normalizeText(value);

  if (normalized === "parent") {
    return "Parent";
  }

  if (normalized === "coach") {
    return "Coach";
  }

  if (normalized === "club") {
    return "Club";
  }

  if (normalized === "admin") {
    return "Admin";
  }

  return isJunior ? "Parent" : "Unverified";
}

function readLocalHighlights() {
  const highlights = readLocalData(HIGHLIGHT_STORAGE_KEY, []);
  return Array.isArray(highlights) ? cloneValue(highlights) : [];
}

function writeLocalHighlights(highlights) {
  writeLocalData(HIGHLIGHT_STORAGE_KEY, cloneValue(Array.isArray(highlights) ? highlights : []));
}

function mergeHighlightCollections(primary = [], secondary = []) {
  const merged = [];
  const seen = new Set();

  [primary, secondary].forEach((collection) => {
    (Array.isArray(collection) ? collection : []).forEach((item) => {
      if (!isObject(item) || !item.id || seen.has(item.id)) {
        return;
      }

      seen.add(item.id);
      merged.push(cloneValue(item));
    });
  });

  return merged;
}

function buildHighlightStatus({
  mode = "local",
  source = "localStorage",
  tableDetected = null,
  message = "Highlight metadata is saved on this device only.",
  highlightCount = 0,
  localHighlightCount = 0,
  supabaseHighlightCount = 0,
}) {
  const modeLabel =
    mode === "supabase_active"
      ? "Supabase Highlights Active"
      : mode === "supabase_fallback"
        ? "Supabase Highlights Fallback"
        : "Local Demo";

  return {
    mode,
    modeLabel,
    source,
    sourceLabel: source === "supabase" ? "Supabase" : "localStorage",
    tableDetected,
    tableDetectedLabel:
      tableDetected === true ? "yes" : tableDetected === false ? "no" : "unknown",
    backendEnabled: isHighlightBackendEnabled(),
    message,
    sportsDataMigrationStatus: HIGHLIGHT_MIGRATION_STATUS,
    highlightCount,
    localHighlightCount,
    supabaseHighlightCount,
  };
}

function normalizeManagedHighlight(highlight, options = {}) {
  const isJunior = Boolean(highlight?.isJunior);
  const nextId = isUuidLike(highlight?.id) ? String(highlight.id) : createHighlightUuid();
  const createdAt = highlight?.createdAt || new Date().toISOString();
  const updatedAt = options.updatedAt || new Date().toISOString();
  const approvalStatus = mapApprovalStatusToHighlight(
    options.approvalStatus || highlight?.approvalStatus,
    isJunior,
  );
  const showcaseStatus = mapShowcaseStatusToHighlight(
    options.showcaseStatus || highlight?.showcaseStatus,
  );
  const verificationSource = normalizeVerificationSource(
    options.verificationSource || highlight?.verificationSource,
    isJunior,
  );

  return {
    ...cloneValue(isObject(highlight) ? highlight : {}),
    id: nextId,
    athleteId: String(highlight?.athleteId || "").trim(),
    title: String(highlight?.title || "Untitled highlight").trim(),
    sport: String(highlight?.sport || "").trim(),
    sportId: String(highlight?.sportId || "").trim(),
    highlightType: String(highlight?.highlightType || highlight?.tag || "Match highlight").trim(),
    matchEvent: String(highlight?.matchEvent || highlight?.eventName || "").trim(),
    eventName: String(highlight?.eventName || highlight?.matchEvent || "").trim(),
    competition: String(highlight?.competition || "").trim(),
    eventDate: String(highlight?.eventDate || highlight?.date || "").trim(),
    date: String(highlight?.date || highlight?.eventDate || "").trim(),
    opponent: String(highlight?.opponent || "").trim(),
    positionPlayed: String(highlight?.positionPlayed || highlight?.position || "").trim(),
    description: String(highlight?.description || "").trim(),
    videoUrl: String(highlight?.videoUrl || "").trim(),
    thumbnailUrl: String(highlight?.thumbnailUrl || "").trim(),
    verificationSource,
    approvalStatus,
    showcaseStatus,
    isFeatured: Boolean(highlight?.isFeatured),
    boostCount: clampBoostCount(highlight?.boostCount),
    isBoosted: Boolean(highlight?.isBoosted),
    isJunior,
    ownerUserId: options.ownerUserId || highlight?.ownerUserId || null,
    source: options.source || highlight?.source || "local-highlight",
    storageSource: options.storageSource || highlight?.storageSource || "localStorage",
    createdAt,
    updatedAt,
  };
}

function buildHighlightRow(highlight, ownerUserId) {
  const normalizedHighlight = normalizeManagedHighlight(highlight, {
    ownerUserId,
    source: "supabase-highlight",
    storageSource: "supabase",
    updatedAt: new Date().toISOString(),
  });
  const approvalStatus = normalizeApprovalStatusForDatabase(
    normalizedHighlight.approvalStatus,
    normalizedHighlight.isJunior,
    normalizedHighlight.verificationSource,
  );
  const showcaseStatus = normalizeShowcaseStatusForDatabase(
    normalizedHighlight.showcaseStatus,
    normalizedHighlight.isJunior,
    normalizedHighlight.approvalStatus,
  );

  return {
    id: normalizedHighlight.id,
    owner_user_id: ownerUserId,
    athlete_profile_id: toNullableString(normalizedHighlight.athleteId),
    title: String(normalizedHighlight.title || "Untitled highlight").trim(),
    sport: toNullableString(normalizedHighlight.sport),
    sport_id: toNullableString(normalizedHighlight.sportId),
    highlight_type: toNullableString(normalizedHighlight.highlightType),
    match_event: toNullableString(normalizedHighlight.matchEvent || normalizedHighlight.eventName),
    competition: toNullableString(normalizedHighlight.competition),
    event_date: toNullableString(normalizedHighlight.eventDate || normalizedHighlight.date),
    opponent: toNullableString(normalizedHighlight.opponent),
    position_played: toNullableString(normalizedHighlight.positionPlayed),
    description: toNullableString(normalizedHighlight.description),
    video_url: toNullableString(normalizedHighlight.videoUrl),
    thumbnail_url: toNullableString(normalizedHighlight.thumbnailUrl),
    verification_source: normalizeText(normalizedHighlight.verificationSource || "unverified").replace(
      /\s+/g,
      "_",
    ),
    approval_status: approvalStatus,
    showcase_status: showcaseStatus,
    is_featured: Boolean(normalizedHighlight.isFeatured),
    boost_count: clampBoostCount(normalizedHighlight.boostCount),
    highlight_data: {
      ...normalizedHighlight,
      id: normalizedHighlight.id,
      ownerUserId,
      athleteId: normalizedHighlight.athleteId,
      source: "supabase-highlight",
      storageSource: "supabase",
      approvalStatus: mapApprovalStatusToHighlight(approvalStatus, normalizedHighlight.isJunior),
      showcaseStatus: mapShowcaseStatusToHighlight(showcaseStatus),
    },
    updated_at: new Date().toISOString(),
  };
}

function normalizeSupabaseHighlightRow(row) {
  const rawHighlight = isObject(row?.highlight_data) ? cloneValue(row.highlight_data) : {};
  const isJunior = Boolean(rawHighlight.isJunior);

  return {
    ...rawHighlight,
    id: String(row?.id || rawHighlight.id || createHighlightUuid()),
    ownerUserId: row?.owner_user_id || rawHighlight.ownerUserId || null,
    athleteId: String(row?.athlete_profile_id || rawHighlight.athleteId || "").trim(),
    title: String(row?.title || rawHighlight.title || "Untitled highlight").trim(),
    sport: String(row?.sport || rawHighlight.sport || "").trim(),
    sportId: String(row?.sport_id || rawHighlight.sportId || "").trim(),
    highlightType: String(
      row?.highlight_type || rawHighlight.highlightType || rawHighlight.tag || "Match highlight",
    ).trim(),
    tag: String(
      rawHighlight.tag || row?.highlight_type || rawHighlight.highlightType || "Match highlight",
    ).trim(),
    matchEvent: String(
      row?.match_event || rawHighlight.matchEvent || rawHighlight.eventName || "",
    ).trim(),
    eventName: String(
      rawHighlight.eventName || row?.match_event || rawHighlight.matchEvent || "",
    ).trim(),
    competition: String(row?.competition || rawHighlight.competition || "").trim(),
    eventDate: String(row?.event_date || rawHighlight.eventDate || rawHighlight.date || "").trim(),
    date: String(rawHighlight.date || row?.event_date || rawHighlight.eventDate || "").trim(),
    opponent: String(row?.opponent || rawHighlight.opponent || "").trim(),
    positionPlayed: String(
      row?.position_played || rawHighlight.positionPlayed || rawHighlight.position || "",
    ).trim(),
    description: String(row?.description || rawHighlight.description || "").trim(),
    videoUrl: String(row?.video_url || rawHighlight.videoUrl || "").trim(),
    thumbnailUrl: String(row?.thumbnail_url || rawHighlight.thumbnailUrl || "").trim(),
    verificationSource: normalizeVerificationSource(
      row?.verification_source || rawHighlight.verificationSource,
      isJunior,
    ),
    approvalStatus: mapApprovalStatusToHighlight(
      row?.approval_status || rawHighlight.approvalStatus,
      isJunior,
    ),
    showcaseStatus: mapShowcaseStatusToHighlight(
      row?.showcase_status || rawHighlight.showcaseStatus,
    ),
    isFeatured: Boolean(
      typeof row?.is_featured === "boolean" ? row.is_featured : rawHighlight.isFeatured,
    ),
    boostCount: clampBoostCount(row?.boost_count ?? rawHighlight.boostCount),
    isJunior,
    source: "supabase-highlight",
    storageSource: "supabase",
    createdAt: row?.created_at || rawHighlight.createdAt || new Date().toISOString(),
    updatedAt:
      row?.updated_at || rawHighlight.updatedAt || row?.created_at || new Date().toISOString(),
  };
}

function getHighlightsMissingMessage() {
  return "Supabase auth is connected, but highlights table/policies still need highlights_phase_1.sql.";
}

function isMissingHighlightsTableError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "42P01" ||
    code === "42501" ||
    code === "23503" ||
    message.includes(HIGHLIGHTS_TABLE) ||
    message.includes("permission denied") ||
    message.includes("foreign key") ||
    message.includes("relation")
  );
}

async function detectHighlightsTable(force = false) {
  if (!force && highlightsTableCache.checked) {
    return highlightsTableCache;
  }

  if (!isHighlightBackendEnabled() || !supabase) {
    highlightsTableCache = {
      checked: true,
      detected: null,
      message: "Highlight metadata is saved on this device only.",
    };
    return highlightsTableCache;
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    highlightsTableCache = {
      checked: true,
      detected: null,
      message: "Backend is connected. Sign in to save highlight metadata to your Supabase account.",
    };
    return highlightsTableCache;
  }

  try {
    const { error } = await supabase
      .from(HIGHLIGHTS_TABLE)
      .select("id")
      .eq("owner_user_id", user.id)
      .limit(1);

    highlightsTableCache = error
      ? {
          checked: true,
          detected: false,
          message: isMissingHighlightsTableError(error)
            ? getHighlightsMissingMessage()
            : "Supabase highlight metadata is unavailable right now, so the app will keep using this device for highlight storage.",
        }
      : {
          checked: true,
          detected: true,
          message: "",
        };

    return highlightsTableCache;
  } catch (error) {
    highlightsTableCache = {
      checked: true,
      detected: false,
      message: isMissingHighlightsTableError(error)
        ? getHighlightsMissingMessage()
        : "Supabase highlight metadata is unavailable right now, so the app will keep using this device for highlight storage.",
    };
    return highlightsTableCache;
  }
}

async function readSupabaseHighlights(user) {
  if (!supabase || !user?.id) {
    return { highlights: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from(HIGHLIGHTS_TABLE)
      .select("*")
      .eq("owner_user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return { highlights: [], error };
    }

    return {
      highlights: Array.isArray(data) ? data.map(normalizeSupabaseHighlightRow) : [],
      error: null,
    };
  } catch (error) {
    return { highlights: [], error };
  }
}

async function loadHighlightRecords() {
  const localHighlights = readLocalHighlights();

  if (!isHighlightBackendEnabled() || !supabase) {
    return {
      highlights: localHighlights,
      status: buildHighlightStatus({
        mode: "local",
        source: "localStorage",
        tableDetected: null,
        message: "Highlight metadata is saved on this device only.",
        highlightCount: localHighlights.length,
        localHighlightCount: localHighlights.length,
        supabaseHighlightCount: 0,
      }),
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    return {
      highlights: localHighlights,
      status: buildHighlightStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: null,
        message:
          "Backend is connected. Sign in to save highlight metadata to your Supabase account. Existing local highlights remain on this device only.",
        highlightCount: localHighlights.length,
        localHighlightCount: localHighlights.length,
        supabaseHighlightCount: 0,
      }),
    };
  }

  const tableStatus = await detectHighlightsTable(true);
  if (tableStatus.detected !== true) {
    return {
      highlights: localHighlights,
      status: buildHighlightStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: tableStatus.detected,
        message: tableStatus.message || getHighlightsMissingMessage(),
        highlightCount: localHighlights.length,
        localHighlightCount: localHighlights.length,
        supabaseHighlightCount: 0,
      }),
    };
  }

  const supabaseResult = await readSupabaseHighlights(user);
  if (supabaseResult.error) {
    return {
      highlights: localHighlights,
      status: buildHighlightStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: true,
        message:
          "Supabase highlight reads are unavailable right now, so existing local highlights remain active on this device.",
        highlightCount: localHighlights.length,
        localHighlightCount: localHighlights.length,
        supabaseHighlightCount: 0,
      }),
    };
  }

  const supabaseHighlights = supabaseResult.highlights;
  const mergedHighlights = mergeHighlightCollections(supabaseHighlights, localHighlights);
  const currentSource = supabaseHighlights.length > 0 ? "supabase" : "localStorage";
  const message =
    supabaseHighlights.length > 0
      ? "Highlight metadata is saved to your Supabase account."
      : localHighlights.length > 0
        ? "Supabase highlights are ready. Existing local highlights still render from this device until you resave them to your account."
        : "Highlight metadata will save to your Supabase account after you add your first highlight.";

  return {
    highlights: mergedHighlights,
    status: buildHighlightStatus({
      mode: "supabase_active",
      source: currentSource,
      tableDetected: true,
      message,
      highlightCount: mergedHighlights.length,
      localHighlightCount: localHighlights.length,
      supabaseHighlightCount: supabaseHighlights.length,
    }),
  };
}

export function isHighlightBackendEnabled() {
  return Boolean(isRealAuthEnabled() && supabase);
}

export async function getHighlightBackendStatus() {
  const result = await loadHighlightRecords();
  return result.status;
}

export async function getHighlights() {
  const result = await loadHighlightRecords();
  return {
    success: true,
    highlights: result.highlights,
    ...result.status,
  };
}

export async function getHighlightsByAthleteId(athleteId) {
  const result = await loadHighlightRecords();
  const highlights = result.highlights.filter((item) => item.athleteId === athleteId);

  return {
    success: true,
    highlights,
    ...result.status,
  };
}

export async function saveHighlight(highlight) {
  const localHighlight = normalizeManagedHighlight(highlight, {
    source: "local-highlight",
    storageSource: "localStorage",
    updatedAt: new Date().toISOString(),
  });

  if (!isHighlightBackendEnabled() || !supabase) {
    const current = readLocalHighlights();
    writeLocalHighlights([localHighlight, ...current.filter((item) => item.id !== localHighlight.id)]);
    return {
      success: true,
      highlight: localHighlight,
      source: "localStorage",
      fallback: false,
      highlightDataExists: Object.keys(localHighlight || {}).length > 0,
      ownerUserIdExists: Boolean(localHighlight?.ownerUserId),
      athleteProfileIdExists: Boolean(localHighlight?.athleteId),
      ...(await getHighlights()),
      message: "Highlight saved on this device only.",
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    const current = readLocalHighlights();
    writeLocalHighlights([localHighlight, ...current.filter((item) => item.id !== localHighlight.id)]);
    return {
      success: true,
      highlight: localHighlight,
      source: "localStorage",
      fallback: true,
      highlightDataExists: Object.keys(localHighlight || {}).length > 0,
      ownerUserIdExists: Boolean(localHighlight?.ownerUserId),
      athleteProfileIdExists: Boolean(localHighlight?.athleteId),
      ...(await getHighlights()),
      message: "No Supabase session detected, so the highlight was saved on this device only.",
    };
  }

  const tableStatus = await detectHighlightsTable(true);
  if (tableStatus.detected !== true) {
    const current = readLocalHighlights();
    writeLocalHighlights([localHighlight, ...current.filter((item) => item.id !== localHighlight.id)]);
    return {
      success: true,
      highlight: localHighlight,
      source: "localStorage",
      fallback: true,
      highlightDataExists: Object.keys(localHighlight || {}).length > 0,
      ownerUserIdExists: Boolean(localHighlight?.ownerUserId),
      athleteProfileIdExists: Boolean(localHighlight?.athleteId),
      ...(await getHighlights()),
      message: `${tableStatus.message || getHighlightsMissingMessage()} Saved on this device only for now.`,
    };
  }

  try {
    const payload = buildHighlightRow(highlight, user.id);
    const { data, error } = await supabase
      .from(HIGHLIGHTS_TABLE)
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      const current = readLocalHighlights();
      writeLocalHighlights([localHighlight, ...current.filter((item) => item.id !== localHighlight.id)]);
      return {
        success: true,
        highlight: localHighlight,
        source: "localStorage",
        fallback: true,
        highlightDataExists: Object.keys(localHighlight || {}).length > 0,
        ownerUserIdExists: Boolean(localHighlight?.ownerUserId),
        athleteProfileIdExists: Boolean(localHighlight?.athleteId),
        ...(await getHighlights()),
        message:
          "Supabase highlight save did not complete, so the highlight was saved on this device only for now.",
      };
    }

    const savedHighlight = normalizeSupabaseHighlightRow(data);
    return {
      success: true,
      highlight: savedHighlight,
      source: "supabase",
      fallback: false,
      highlightDataExists:
        Boolean(data?.highlight_data) && Object.keys(data.highlight_data).length > 0,
      ownerUserIdExists: Boolean(data?.owner_user_id),
      athleteProfileIdExists: Boolean(data?.athlete_profile_id),
      ...(await getHighlights()),
      message: "Highlight saved to your Supabase account.",
    };
  } catch {
    const current = readLocalHighlights();
    writeLocalHighlights([localHighlight, ...current.filter((item) => item.id !== localHighlight.id)]);
    return {
      success: true,
      highlight: localHighlight,
      source: "localStorage",
      fallback: true,
      highlightDataExists: Object.keys(localHighlight || {}).length > 0,
      ownerUserIdExists: Boolean(localHighlight?.ownerUserId),
      athleteProfileIdExists: Boolean(localHighlight?.athleteId),
      ...(await getHighlights()),
      message:
        "Supabase highlight save did not complete, so the highlight was saved on this device only for now.",
    };
  }
}

export async function updateHighlight(highlightId, updates) {
  const current = await getHighlights();
  const existingHighlight = current.highlights.find((item) => item.id === highlightId) || null;

  if (!existingHighlight) {
    return {
      success: false,
      highlight: null,
      message: "Highlight not found.",
      ...current,
    };
  }

  return saveHighlight({
    ...existingHighlight,
    ...cloneValue(isObject(updates) ? updates : {}),
    id: existingHighlight.id,
  });
}

export async function deleteHighlight(highlightId) {
  const localHighlights = readLocalHighlights();

  if (!isHighlightBackendEnabled() || !supabase) {
    writeLocalHighlights(localHighlights.filter((item) => item.id !== highlightId));
    return {
      success: true,
      deletedHighlightId: highlightId,
      source: "localStorage",
      ...(await getHighlights()),
      message: "Highlight removed from this device.",
    };
  }

  const user = await getCurrentUser();
  const tableStatus = await detectHighlightsTable(true);

  if (!user?.id || tableStatus.detected !== true) {
    writeLocalHighlights(localHighlights.filter((item) => item.id !== highlightId));
    return {
      success: true,
      deletedHighlightId: highlightId,
      source: "localStorage",
      ...(await getHighlights()),
      message: "Highlight removed from this device.",
    };
  }

  try {
    const { error } = await supabase
      .from(HIGHLIGHTS_TABLE)
      .delete()
      .eq("id", highlightId)
      .eq("owner_user_id", user.id);

    if (error) {
      return {
        success: false,
        deletedHighlightId: null,
        source: "supabase",
        ...(await getHighlights()),
        message: "Supabase highlight delete could not be completed.",
      };
    }

    if (localHighlights.some((item) => item.id === highlightId)) {
      writeLocalHighlights(localHighlights.filter((item) => item.id !== highlightId));
    }

    return {
      success: true,
      deletedHighlightId: highlightId,
      source: "supabase",
      ...(await getHighlights()),
      message: "Highlight removed from your Supabase account.",
    };
  } catch {
    return {
      success: false,
      deletedHighlightId: null,
      source: "supabase",
      ...(await getHighlights()),
      message: "Supabase highlight delete could not be completed.",
    };
  }
}
