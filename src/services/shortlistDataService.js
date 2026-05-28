import { getCurrentUser, isRealAuthEnabled } from "./authService";
import { readLocalData, writeLocalData } from "./localDataService";
import { supabase } from "./supabaseClient";

const SHORTLIST_STORAGE_KEY = "msr_shortlist_v1";
const SHORTLISTS_TABLE = "shortlists";
const SHORTLIST_MIGRATION_STATUS =
  "Profiles + Highlights metadata + Opportunities metadata + Contact request metadata + Shortlists metadata only";
const SHORTLIST_TYPE_LABELS = {
  athlete_shortlist: "Athlete Shortlist",
  opportunity_match: "Opportunity Match",
  scout_watchlist: "Scout Watchlist",
  club_review: "Club Review",
};
const SHORTLIST_STATUS_LABELS = {
  active: "Active",
  archived: "Archived",
  removed: "Removed",
};

let shortlistsTableCache = {
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

function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim(),
  );
}

function createShortlistUuid() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const randomNibble = Math.floor(Math.random() * 16);
    const value = character === "x" ? randomNibble : (randomNibble & 0x3) | 0x8;
    return value.toString(16);
  });
}

function normalizeShortlistTypeForDatabase(type) {
  const normalized = normalizeText(type);

  if (normalized === "opportunity match") {
    return "opportunity_match";
  }
  if (normalized === "scout watchlist") {
    return "scout_watchlist";
  }
  if (normalized === "club review") {
    return "club_review";
  }

  return "athlete_shortlist";
}

function mapShortlistTypeToRecord(type) {
  const normalized = String(type || "").trim().toLowerCase();
  return SHORTLIST_TYPE_LABELS[normalized] || "Athlete Shortlist";
}

function normalizeShortlistStatusForDatabase(status) {
  const normalized = normalizeText(status);

  if (normalized === "archived") {
    return "archived";
  }
  if (normalized === "removed") {
    return "removed";
  }

  return "active";
}

function mapShortlistStatusToRecord(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return SHORTLIST_STATUS_LABELS[normalized] || "Active";
}

function readLocalShortlist() {
  const shortlist = readLocalData(SHORTLIST_STORAGE_KEY, []);
  return Array.isArray(shortlist) ? cloneValue(shortlist) : [];
}

function writeLocalShortlist(shortlist) {
  const nextShortlist = Array.isArray(shortlist) ? shortlist : [];
  writeLocalData(SHORTLIST_STORAGE_KEY, cloneValue(nextShortlist));
}

function mergeShortlistCollections(primary = [], secondary = []) {
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

function getShortlistDuplicateKey(record) {
  return `${String(record?.athleteId || record?.athleteProfileId || "").trim().toLowerCase()}::${normalizeShortlistTypeForDatabase(
    record?.shortlistTypeRaw || record?.shortlistType,
  )}`;
}

function buildShortlistStatus({
  mode = "local",
  source = "localStorage",
  tableDetected = null,
  message = "Shortlist records are saved on this device only.",
  shortlistCount = 0,
  localShortlistCount = 0,
  supabaseShortlistCount = 0,
}) {
  const modeLabel =
    mode === "supabase_active"
      ? "Supabase Shortlists Active"
      : mode === "supabase_fallback"
        ? "Supabase Shortlists Fallback"
        : "Local Demo";

  return {
    mode,
    modeLabel,
    source,
    sourceLabel: source === "supabase" ? "Supabase" : "localStorage",
    tableDetected,
    tableDetectedLabel:
      tableDetected === true ? "yes" : tableDetected === false ? "no" : "unknown",
    backendEnabled: isShortlistBackendEnabled(),
    message,
    sportsDataMigrationStatus: SHORTLIST_MIGRATION_STATUS,
    shortlistCount,
    localShortlistCount,
    supabaseShortlistCount,
  };
}

function normalizeManagedShortlist(record, options = {}) {
  const shortlistStatus = mapShortlistStatusToRecord(
    options.shortlistStatus || record?.shortlistStatus,
  );

  return {
    ...cloneValue(isObject(record) ? record : {}),
    id: isUuidLike(record?.id) ? String(record.id) : String(record?.id || createShortlistUuid()),
    ownerUserId: options.ownerUserId || record?.ownerUserId || null,
    athleteId: String(record?.athleteId || record?.athleteProfileId || "").trim(),
    athleteProfileId: String(record?.athleteProfileId || record?.athleteId || "").trim(),
    athleteOwnerUserId: options.athleteOwnerUserId || record?.athleteOwnerUserId || null,
    athleteDisplayName: String(record?.athleteDisplayName || "").trim(),
    athleteSport: String(record?.athleteSport || record?.sport || "").trim(),
    athleteSportId: String(record?.athleteSportId || record?.sportId || "").trim(),
    athletePositionRole: String(
      record?.athletePositionRole || record?.positionRole || record?.position || "",
    ).trim(),
    athleteAgeGroup: String(record?.athleteAgeGroup || record?.ageGroup || "").trim(),
    athleteState: String(record?.athleteState || record?.state || "").trim(),
    athleteRegion: String(record?.athleteRegion || record?.region || "").trim(),
    shortlistType: mapShortlistTypeToRecord(
      options.shortlistType || record?.shortlistTypeRaw || record?.shortlistType,
    ),
    shortlistTypeRaw: String(
      options.shortlistType || record?.shortlistTypeRaw || record?.shortlistType || "athlete_shortlist",
    ).trim(),
    shortlistStatus,
    sourceContext: String(record?.sourceContext || "manual").trim(),
    notes: String(record?.notes || "").trim(),
    noDirectMessaging:
      typeof record?.noDirectMessaging === "boolean" ? record.noDirectMessaging : true,
    createdByRole: String(record?.createdByRole || "club_scout").trim(),
    source: options.source || record?.source || "local-shortlist",
    storageSource: options.storageSource || record?.storageSource || "localStorage",
    shortlistData: isObject(record?.shortlistData) ? cloneValue(record.shortlistData) : {},
    createdAt: record?.createdAt || new Date().toISOString(),
    updatedAt: options.updatedAt || record?.updatedAt || new Date().toISOString(),
  };
}

function normalizeShortlistCollection(collection = []) {
  const seenActiveKeys = new Set();

  return (Array.isArray(collection) ? collection : [])
    .map((item) => normalizeManagedShortlist(item))
    .filter((item) => item.athleteId)
    .filter((item) => normalizeShortlistStatusForDatabase(item.shortlistStatus) === "active")
    .filter((item) => {
      const duplicateKey = getShortlistDuplicateKey(item);
      if (seenActiveKeys.has(duplicateKey)) {
        return false;
      }

      seenActiveKeys.add(duplicateKey);
      return true;
    });
}

function upsertLocalShortlistRecord(record) {
  const nextRecord = normalizeManagedShortlist(record, {
    source: record?.source || "local-shortlist",
    storageSource: record?.storageSource || "localStorage",
    updatedAt: new Date().toISOString(),
  });
  const nextKey = getShortlistDuplicateKey(nextRecord);
  const current = normalizeShortlistCollection(readLocalShortlist());
  const filtered = current.filter(
    (item) => item.id !== nextRecord.id && getShortlistDuplicateKey(item) !== nextKey,
  );
  const nextCollection = normalizeShortlistCollection([nextRecord, ...filtered]);
  writeLocalShortlist(nextCollection);
  return nextRecord;
}

function buildShortlistRow(record, ownerUserId) {
  const normalizedRecord = normalizeManagedShortlist(record, {
    ownerUserId,
    source: "supabase-shortlist",
    storageSource: "supabase",
    updatedAt: new Date().toISOString(),
  });
  const recordId = isUuidLike(normalizedRecord.id)
    ? normalizedRecord.id
    : createShortlistUuid();
  const shortlistType = normalizeShortlistTypeForDatabase(
    normalizedRecord.shortlistTypeRaw || normalizedRecord.shortlistType,
  );
  const shortlistStatus = normalizeShortlistStatusForDatabase(normalizedRecord.shortlistStatus);

  return {
    id: recordId,
    owner_user_id: ownerUserId,
    athlete_profile_id: isUuidLike(normalizedRecord.athleteProfileId)
      ? normalizedRecord.athleteProfileId
      : null,
    athlete_owner_user_id: isUuidLike(normalizedRecord.athleteOwnerUserId)
      ? normalizedRecord.athleteOwnerUserId
      : null,
    athlete_display_name: toNullableString(normalizedRecord.athleteDisplayName),
    athlete_sport: toNullableString(normalizedRecord.athleteSport),
    athlete_sport_id: toNullableString(normalizedRecord.athleteSportId),
    athlete_position_role: toNullableString(normalizedRecord.athletePositionRole),
    athlete_age_group: toNullableString(normalizedRecord.athleteAgeGroup),
    athlete_state: toNullableString(normalizedRecord.athleteState),
    athlete_region: toNullableString(normalizedRecord.athleteRegion),
    shortlist_type: shortlistType,
    shortlist_status: shortlistStatus,
    source_context: toNullableString(normalizedRecord.sourceContext) || "manual",
    notes: toNullableString(normalizedRecord.notes),
    no_direct_messaging: true,
    shortlist_data: {
      ...normalizedRecord,
      id: recordId,
      ownerUserId,
      source: "supabase-shortlist",
      storageSource: "supabase",
      shortlistType: mapShortlistTypeToRecord(shortlistType),
      shortlistTypeRaw: shortlistType,
      shortlistStatus: mapShortlistStatusToRecord(shortlistStatus),
      noDirectMessaging: true,
    },
    updated_at: new Date().toISOString(),
  };
}

function normalizeSupabaseShortlistRow(row) {
  const rawRecord = isObject(row?.shortlist_data) ? cloneValue(row.shortlist_data) : {};

  return {
    ...rawRecord,
    id: String(row?.id || rawRecord.id || createShortlistUuid()),
    ownerUserId: row?.owner_user_id || rawRecord.ownerUserId || null,
    athleteId: String(
      row?.athlete_profile_id || rawRecord.athleteProfileId || rawRecord.athleteId || "",
    ).trim(),
    athleteProfileId: String(
      row?.athlete_profile_id || rawRecord.athleteProfileId || rawRecord.athleteId || "",
    ).trim(),
    athleteOwnerUserId: row?.athlete_owner_user_id || rawRecord.athleteOwnerUserId || null,
    athleteDisplayName: String(
      row?.athlete_display_name || rawRecord.athleteDisplayName || "",
    ).trim(),
    athleteSport: String(row?.athlete_sport || rawRecord.athleteSport || rawRecord.sport || "").trim(),
    athleteSportId: String(
      row?.athlete_sport_id || rawRecord.athleteSportId || rawRecord.sportId || "",
    ).trim(),
    athletePositionRole: String(
      row?.athlete_position_role ||
        rawRecord.athletePositionRole ||
        rawRecord.positionRole ||
        rawRecord.position ||
        "",
    ).trim(),
    athleteAgeGroup: String(row?.athlete_age_group || rawRecord.athleteAgeGroup || rawRecord.ageGroup || "").trim(),
    athleteState: String(row?.athlete_state || rawRecord.athleteState || rawRecord.state || "").trim(),
    athleteRegion: String(row?.athlete_region || rawRecord.athleteRegion || rawRecord.region || "").trim(),
    shortlistType: mapShortlistTypeToRecord(
      row?.shortlist_type || rawRecord.shortlistTypeRaw || rawRecord.shortlistType,
    ),
    shortlistTypeRaw: String(
      row?.shortlist_type || rawRecord.shortlistTypeRaw || rawRecord.shortlistType || "athlete_shortlist",
    ).trim(),
    shortlistStatus: mapShortlistStatusToRecord(
      row?.shortlist_status || rawRecord.shortlistStatus,
    ),
    sourceContext: String(row?.source_context || rawRecord.sourceContext || "manual").trim(),
    notes: String(row?.notes || rawRecord.notes || "").trim(),
    noDirectMessaging:
      typeof row?.no_direct_messaging === "boolean"
        ? row.no_direct_messaging
        : rawRecord.noDirectMessaging !== false,
    createdByRole: String(rawRecord.createdByRole || "club_scout").trim(),
    source: "supabase-shortlist",
    storageSource: "supabase",
    shortlistData: cloneValue(rawRecord),
    createdAt: row?.created_at || rawRecord.createdAt || new Date().toISOString(),
    updatedAt: row?.updated_at || rawRecord.updatedAt || row?.created_at || new Date().toISOString(),
  };
}

function getShortlistsMissingMessage() {
  return "Supabase auth is connected, but shortlists table/policies still need shortlists_phase_1.sql.";
}

function isMissingShortlistsTableError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "42P01" ||
    code === "42501" ||
    message.includes(SHORTLISTS_TABLE) ||
    message.includes("permission denied") ||
    message.includes("relation")
  );
}

async function detectShortlistsTable(force = false) {
  if (!force && shortlistsTableCache.checked) {
    return shortlistsTableCache;
  }

  if (!isShortlistBackendEnabled() || !supabase) {
    shortlistsTableCache = {
      checked: true,
      detected: null,
      message: "Shortlist records are saved on this device only.",
    };
    return shortlistsTableCache;
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    shortlistsTableCache = {
      checked: true,
      detected: null,
      message: "Backend is connected. Sign in to save shortlist records to your Supabase account.",
    };
    return shortlistsTableCache;
  }

  try {
    const { error } = await supabase
      .from(SHORTLISTS_TABLE)
      .select("id")
      .eq("owner_user_id", user.id)
      .limit(1);

    shortlistsTableCache = error
      ? {
          checked: true,
          detected: false,
          message: isMissingShortlistsTableError(error)
            ? getShortlistsMissingMessage()
            : "Supabase shortlists are unavailable right now, so the app will keep using this device for shortlist storage.",
        }
      : {
          checked: true,
          detected: true,
          message: "",
        };

    return shortlistsTableCache;
  } catch (error) {
    shortlistsTableCache = {
      checked: true,
      detected: false,
      message: isMissingShortlistsTableError(error)
        ? getShortlistsMissingMessage()
        : "Supabase shortlists are unavailable right now, so the app will keep using this device for shortlist storage.",
    };
    return shortlistsTableCache;
  }
}

async function readSupabaseShortlist(user) {
  if (!supabase || !user?.id) {
    return { shortlist: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from(SHORTLISTS_TABLE)
      .select("*")
      .eq("owner_user_id", user.id)
      .eq("shortlist_status", "active")
      .order("updated_at", { ascending: false });

    if (error) {
      return { shortlist: [], error };
    }

    return {
      shortlist: Array.isArray(data) ? data.map(normalizeSupabaseShortlistRow) : [],
      error: null,
    };
  } catch (error) {
    return { shortlist: [], error };
  }
}

async function loadShortlistRecords() {
  const localShortlist = normalizeShortlistCollection(readLocalShortlist());

  if (!isShortlistBackendEnabled() || !supabase) {
    return {
      shortlist: localShortlist,
      status: buildShortlistStatus({
        mode: "local",
        source: "localStorage",
        tableDetected: null,
        message: "Shortlist records are saved on this device only.",
        shortlistCount: localShortlist.length,
        localShortlistCount: localShortlist.length,
        supabaseShortlistCount: 0,
      }),
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    return {
      shortlist: localShortlist,
      status: buildShortlistStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: null,
        message:
          "Backend is connected. Sign in to save shortlist records to your Supabase account. Existing local shortlist records remain on this device only.",
        shortlistCount: localShortlist.length,
        localShortlistCount: localShortlist.length,
        supabaseShortlistCount: 0,
      }),
    };
  }

  const tableStatus = await detectShortlistsTable(true);
  if (tableStatus.detected !== true) {
    return {
      shortlist: localShortlist,
      status: buildShortlistStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: tableStatus.detected,
        message: tableStatus.message || getShortlistsMissingMessage(),
        shortlistCount: localShortlist.length,
        localShortlistCount: localShortlist.length,
        supabaseShortlistCount: 0,
      }),
    };
  }

  const supabaseResult = await readSupabaseShortlist(user);
  if (supabaseResult.error) {
    return {
      shortlist: localShortlist,
      status: buildShortlistStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: true,
        message:
          "Supabase shortlist reads are unavailable right now, so existing local shortlist records remain active on this device.",
        shortlistCount: localShortlist.length,
        localShortlistCount: localShortlist.length,
        supabaseShortlistCount: 0,
      }),
    };
  }

  const supabaseShortlist = normalizeShortlistCollection(supabaseResult.shortlist);
  const mergedShortlist = normalizeShortlistCollection(
    mergeShortlistCollections(supabaseShortlist, localShortlist),
  );
  const currentSource = supabaseShortlist.length > 0 ? "supabase" : "localStorage";
  const message =
    supabaseShortlist.length > 0
      ? "Shortlist records are saved to your Supabase account. They remain private workflow records only, with no follow or messaging behaviour."
      : localShortlist.length > 0
        ? "Supabase shortlists are ready. Existing local shortlist records still render from this device until you recreate or resave them through your account."
        : "Shortlist records will save to your Supabase account after you shortlist your first athlete.";

  return {
    shortlist: mergedShortlist,
    status: buildShortlistStatus({
      mode: "supabase_active",
      source: currentSource,
      tableDetected: true,
      message,
      shortlistCount: mergedShortlist.length,
      localShortlistCount: localShortlist.length,
      supabaseShortlistCount: supabaseShortlist.length,
    }),
  };
}

function findExistingShortlistRecord(records, shortlistRecord) {
  const duplicateKey = getShortlistDuplicateKey(shortlistRecord);
  return (
    (Array.isArray(records) ? records : []).find(
      (item) =>
        getShortlistDuplicateKey(item) === duplicateKey ||
        (shortlistRecord.id && item.id === shortlistRecord.id),
    ) || null
  );
}

export function isShortlistBackendEnabled() {
  return Boolean(isRealAuthEnabled() && supabase);
}

export async function getShortlistBackendStatus() {
  const result = await loadShortlistRecords();
  return result.status;
}

export async function getShortlist() {
  const result = await loadShortlistRecords();
  return {
    success: true,
    shortlist: result.shortlist,
    ...result.status,
  };
}

export async function getShortlistByAthleteId(athleteProfileId) {
  const result = await loadShortlistRecords();
  const shortlist = result.shortlist.filter(
    (item) => item.athleteId === athleteProfileId || item.athleteProfileId === athleteProfileId,
  );

  return {
    success: true,
    shortlist,
    ...result.status,
  };
}

export async function isAthleteShortlisted(athleteProfileId) {
  const result = await getShortlistByAthleteId(athleteProfileId);
  return {
    success: true,
    shortlisted: result.shortlist.length > 0,
    ...result,
  };
}

export async function saveShortlistRecord(record) {
  const localRecord = normalizeManagedShortlist(record, {
    source: "local-shortlist",
    storageSource: "localStorage",
    updatedAt: new Date().toISOString(),
  });
  const currentShortlist = await getShortlist();
  const existingRecord = findExistingShortlistRecord(currentShortlist.shortlist, localRecord);
  const nextRecord = existingRecord
    ? normalizeManagedShortlist({
        ...existingRecord,
        ...localRecord,
        id: existingRecord.id,
        createdAt: existingRecord.createdAt,
      })
    : localRecord;

  if (!isShortlistBackendEnabled() || !supabase) {
    const savedLocalRecord = upsertLocalShortlistRecord(nextRecord);
    return {
      success: true,
      shortlistRecord: savedLocalRecord,
      source: "localStorage",
      fallback: false,
      shortlistDataExists: Object.keys(savedLocalRecord?.shortlistData || {}).length > 0,
      ownerUserIdExists: Boolean(savedLocalRecord?.ownerUserId),
      athleteProfileIdExists: Boolean(savedLocalRecord?.athleteProfileId),
      ...(await getShortlist()),
      message: "Athlete shortlisted on this device only.",
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    const savedLocalRecord = upsertLocalShortlistRecord(nextRecord);
    return {
      success: true,
      shortlistRecord: savedLocalRecord,
      source: "localStorage",
      fallback: true,
      shortlistDataExists: Object.keys(savedLocalRecord?.shortlistData || {}).length > 0,
      ownerUserIdExists: Boolean(savedLocalRecord?.ownerUserId),
      athleteProfileIdExists: Boolean(savedLocalRecord?.athleteProfileId),
      ...(await getShortlist()),
      message: "No Supabase session detected, so the athlete was shortlisted on this device only.",
    };
  }

  const tableStatus = await detectShortlistsTable(true);
  if (tableStatus.detected !== true) {
    const savedLocalRecord = upsertLocalShortlistRecord(nextRecord);
    return {
      success: true,
      shortlistRecord: savedLocalRecord,
      source: "localStorage",
      fallback: true,
      shortlistDataExists: Object.keys(savedLocalRecord?.shortlistData || {}).length > 0,
      ownerUserIdExists: Boolean(savedLocalRecord?.ownerUserId),
      athleteProfileIdExists: Boolean(savedLocalRecord?.athleteProfileId),
      ...(await getShortlist()),
      message: `${tableStatus.message || getShortlistsMissingMessage()} Saved on this device only for now.`,
    };
  }

  try {
    const payload = buildShortlistRow(
      existingRecord
        ? {
            ...nextRecord,
            id: existingRecord.id,
            createdAt: existingRecord.createdAt,
          }
        : nextRecord,
      user.id,
    );
    const { data, error } = await supabase
      .from(SHORTLISTS_TABLE)
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      const savedLocalRecord = upsertLocalShortlistRecord(nextRecord);
      return {
        success: true,
        shortlistRecord: savedLocalRecord,
        source: "localStorage",
        fallback: true,
        shortlistDataExists: Object.keys(savedLocalRecord?.shortlistData || {}).length > 0,
        ownerUserIdExists: Boolean(savedLocalRecord?.ownerUserId),
        athleteProfileIdExists: Boolean(savedLocalRecord?.athleteProfileId),
        ...(await getShortlist()),
        message:
          "Supabase shortlist save did not complete, so the athlete was shortlisted on this device only for now.",
      };
    }

    const savedShortlistRecord = normalizeSupabaseShortlistRow(data);
    return {
      success: true,
      shortlistRecord: savedShortlistRecord,
      source: "supabase",
      fallback: false,
      shortlistDataExists:
        Boolean(data?.shortlist_data) && Object.keys(data.shortlist_data).length > 0,
      ownerUserIdExists: Boolean(data?.owner_user_id),
      athleteProfileIdExists: Boolean(data?.athlete_profile_id),
      ...(await getShortlist()),
      message: "Athlete added to your Supabase shortlist.",
    };
  } catch {
    const savedLocalRecord = upsertLocalShortlistRecord(nextRecord);
    return {
      success: true,
      shortlistRecord: savedLocalRecord,
      source: "localStorage",
      fallback: true,
      shortlistDataExists: Object.keys(savedLocalRecord?.shortlistData || {}).length > 0,
      ownerUserIdExists: Boolean(savedLocalRecord?.ownerUserId),
      athleteProfileIdExists: Boolean(savedLocalRecord?.athleteProfileId),
      ...(await getShortlist()),
      message:
        "Supabase shortlist save did not complete, so the athlete was shortlisted on this device only for now.",
    };
  }
}

export async function archiveShortlistRecord(recordId) {
  const current = await getShortlist();
  const existingRecord = current.shortlist.find((item) => item.id === recordId) || null;

  if (!existingRecord) {
    return {
      success: false,
      shortlistRecord: null,
      message: "Shortlist record not found.",
      ...current,
    };
  }

  if (!isShortlistBackendEnabled() || !supabase) {
    writeLocalShortlist(current.shortlist.filter((item) => item.id !== recordId));
    return {
      success: true,
      archivedShortlistId: recordId,
      source: "localStorage",
      ...(await getShortlist()),
      message: "Athlete removed from shortlist on this device.",
    };
  }

  const user = await getCurrentUser();
  const tableStatus = await detectShortlistsTable(true);

  if (!user?.id || tableStatus.detected !== true) {
    writeLocalShortlist(current.shortlist.filter((item) => item.id !== recordId));
    return {
      success: true,
      archivedShortlistId: recordId,
      source: "localStorage",
      ...(await getShortlist()),
      message: "Athlete removed from shortlist on this device.",
    };
  }

  try {
    const { data, error } = await supabase
      .from(SHORTLISTS_TABLE)
      .update({
        shortlist_status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordId)
      .eq("owner_user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return {
        success: false,
        archivedShortlistId: null,
        source: "supabase",
        ...(await getShortlist()),
        message: "Supabase shortlist archive could not be completed.",
      };
    }

    if (readLocalShortlist().some((item) => item.id === recordId)) {
      writeLocalShortlist(normalizeShortlistCollection(readLocalShortlist().filter((item) => item.id !== recordId)));
    }

    return {
      success: true,
      archivedShortlistId: data?.id || recordId,
      source: "supabase",
      ...(await getShortlist()),
      message: "Athlete removed from your Supabase shortlist.",
    };
  } catch {
    return {
      success: false,
      archivedShortlistId: null,
      source: "supabase",
      ...(await getShortlist()),
      message: "Supabase shortlist archive could not be completed.",
    };
  }
}

export async function removeShortlistRecord(recordId) {
  const localShortlist = normalizeShortlistCollection(readLocalShortlist());

  if (!isShortlistBackendEnabled() || !supabase) {
    writeLocalShortlist(localShortlist.filter((item) => item.id !== recordId));
    return {
      success: true,
      deletedShortlistId: recordId,
      source: "localStorage",
      ...(await getShortlist()),
      message: "Shortlist record removed from this device.",
    };
  }

  const user = await getCurrentUser();
  const tableStatus = await detectShortlistsTable(true);

  if (!user?.id || tableStatus.detected !== true) {
    writeLocalShortlist(localShortlist.filter((item) => item.id !== recordId));
    return {
      success: true,
      deletedShortlistId: recordId,
      source: "localStorage",
      ...(await getShortlist()),
      message: "Shortlist record removed from this device.",
    };
  }

  try {
    const { error } = await supabase
      .from(SHORTLISTS_TABLE)
      .delete()
      .eq("id", recordId)
      .eq("owner_user_id", user.id);

    if (error) {
      return {
        success: false,
        deletedShortlistId: null,
        source: "supabase",
        ...(await getShortlist()),
        message: "Supabase shortlist delete could not be completed.",
      };
    }

    if (localShortlist.some((item) => item.id === recordId)) {
      writeLocalShortlist(localShortlist.filter((item) => item.id !== recordId));
    }

    return {
      success: true,
      deletedShortlistId: recordId,
      source: "supabase",
      ...(await getShortlist()),
      message: "Shortlist record removed from your Supabase account.",
    };
  } catch {
    return {
      success: false,
      deletedShortlistId: null,
      source: "supabase",
      ...(await getShortlist()),
      message: "Supabase shortlist delete could not be completed.",
    };
  }
}
