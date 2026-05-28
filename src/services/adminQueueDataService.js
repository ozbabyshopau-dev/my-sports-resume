import { getCurrentUser, isRealAuthEnabled } from "./authService";
import { readLocalData, removeLocalData, writeLocalData } from "./localDataService";
import { supabase } from "./supabaseClient";

const ADMIN_QUEUE_STORAGE_KEY = "msr_admin_queues_v1";
const ADMIN_QUEUE_TABLE = "admin_queue_items";
const ADMIN_QUEUE_MIGRATION_STATUS =
  "Profiles + Highlights metadata + Opportunities metadata + Contact request metadata + Shortlists metadata + Admin queue metadata only";
const ADMIN_QUEUE_DEFAULTS = {
  pendingProfiles: [],
  pendingHighlights: [],
  pendingOpportunities: [],
  verificationRequests: [],
  flaggedContent: [],
};
const QUEUE_TYPE_TO_BUCKET = {
  profile_review: "pendingProfiles",
  highlight_review: "pendingHighlights",
  opportunity_review: "pendingOpportunities",
  club_scout_verification: "verificationRequests",
  contact_request_review: "flaggedContent",
  flagged_content: "flaggedContent",
  safety_review: "flaggedContent",
};
const BUCKET_TO_QUEUE_TYPE = {
  pendingProfiles: "profile_review",
  pendingHighlights: "highlight_review",
  pendingOpportunities: "opportunity_review",
  verificationRequests: "club_scout_verification",
  flaggedContent: "flagged_content",
};
const QUEUE_STATUS_LABELS = {
  pending_review: "Pending",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
  needs_changes: "Needs Changes",
};
const PRIORITY_LABELS = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};
const ADMIN_DECISION_LABELS = {
  approved: "Approved",
  rejected: "Rejected",
  needs_changes: "Needs Changes",
  archived: "Archived",
  no_action: "No Action",
};

let adminQueueTableCache = {
  checked: false,
  detected: null,
  message: "",
};

const ADMIN_QUEUE_ERROR_FALLBACK_MESSAGE =
  "Supabase admin queue backend error. Review the insert/select diagnostics.";

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

function createAdminQueueUuid() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const randomNibble = Math.floor(Math.random() * 16);
    const value = character === "x" ? randomNibble : (randomNibble & 0x3) | 0x8;
    return value.toString(16);
  });
}

function normalizeQueueTypeForDatabase(queueType, bucketName = "") {
  const normalized = normalizeText(queueType || bucketName);

  if (normalized === "highlight review" || normalized === "pending highlights") {
    return "highlight_review";
  }
  if (normalized === "opportunity review" || normalized === "pending opportunities") {
    return "opportunity_review";
  }
  if (
    normalized === "club scout verification" ||
    normalized === "verification requests" ||
    normalized === "club and scout verification requests"
  ) {
    return "club_scout_verification";
  }
  if (normalized === "contact request review") {
    return "contact_request_review";
  }
  if (normalized === "flagged content") {
    return "flagged_content";
  }
  if (normalized === "safety review") {
    return "safety_review";
  }

  return "profile_review";
}

function normalizeQueueStatusForDatabase(status) {
  const normalized = normalizeText(status);

  if (normalized === "in review" || normalized === "mark reviewed" || normalized === "reviewed") {
    return "in_review";
  }
  if (normalized === "approved" || normalized === "approve") {
    return "approved";
  }
  if (normalized === "rejected" || normalized === "reject") {
    return "rejected";
  }
  if (normalized === "archived") {
    return "archived";
  }
  if (normalized === "needs changes" || normalized === "request changes") {
    return "needs_changes";
  }

  return "pending_review";
}

function normalizePriorityForDatabase(priority) {
  const normalized = normalizeText(priority);

  if (normalized === "low") {
    return "low";
  }
  if (normalized === "high") {
    return "high";
  }
  if (normalized === "urgent") {
    return "urgent";
  }

  return "normal";
}

function normalizeAdminDecisionForDatabase(decision) {
  const normalized = normalizeText(decision);

  if (normalized === "approved" || normalized === "approve") {
    return "approved";
  }
  if (normalized === "rejected" || normalized === "reject") {
    return "rejected";
  }
  if (normalized === "needs changes" || normalized === "request changes") {
    return "needs_changes";
  }
  if (normalized === "archived") {
    return "archived";
  }
  if (normalized === "no action" || normalized === "mark reviewed" || normalized === "reviewed") {
    return "no_action";
  }

  return null;
}

function mapQueueStatusToRecord(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return QUEUE_STATUS_LABELS[normalized] || "Pending";
}

function mapPriorityToRecord(priority) {
  const normalized = String(priority || "").trim().toLowerCase();
  return PRIORITY_LABELS[normalized] || "Normal";
}

function mapAdminDecisionToRecord(decision) {
  const normalized = String(decision || "").trim().toLowerCase();
  return ADMIN_DECISION_LABELS[normalized] || "";
}

function mapQueueTypeToBucket(queueType) {
  return QUEUE_TYPE_TO_BUCKET[normalizeQueueTypeForDatabase(queueType)] || "pendingProfiles";
}

function readLocalAdminQueuesRaw() {
  const queues = readLocalData(ADMIN_QUEUE_STORAGE_KEY, ADMIN_QUEUE_DEFAULTS);
  return isObject(queues) ? cloneValue(queues) : cloneValue(ADMIN_QUEUE_DEFAULTS);
}

function normalizeManagedAdminQueueItem(item, options = {}) {
  const queueTypeRaw = normalizeQueueTypeForDatabase(
    options.queueType || item?.queueTypeRaw || item?.queueType,
    options.bucketName || item?.bucketName,
  );
  const queueStatusRaw = normalizeQueueStatusForDatabase(
    options.queueStatus || item?.queueStatusRaw || item?.queueStatus || item?.status,
  );
  const priorityRaw = normalizePriorityForDatabase(options.priority || item?.priority);
  const adminDecisionRaw = normalizeAdminDecisionForDatabase(
    options.adminDecision ?? item?.adminDecision,
  );
  const nextId = String(item?.id || createAdminQueueUuid()).trim();
  const createdAt = item?.createdAt || new Date().toISOString();
  const updatedAt = options.updatedAt || item?.updatedAt || createdAt;
  const queueData =
    isObject(item?.queueData) && Object.keys(item.queueData).length > 0
      ? cloneValue(item.queueData)
      : cloneValue(isObject(item) ? item : {});

  return {
    ...cloneValue(isObject(item) ? item : {}),
    id: nextId,
    ownerUserId: options.ownerUserId || item?.ownerUserId || null,
    relatedUserId: options.relatedUserId || item?.relatedUserId || null,
    relatedAthleteProfileId:
      options.relatedAthleteProfileId ||
      item?.relatedAthleteProfileId ||
      item?.athleteProfileId ||
      item?.athleteId ||
      "",
    relatedHighlightId:
      options.relatedHighlightId || item?.relatedHighlightId || item?.highlightId || "",
    relatedOpportunityId:
      options.relatedOpportunityId || item?.relatedOpportunityId || item?.opportunityId || "",
    relatedContactRequestId:
      options.relatedContactRequestId ||
      item?.relatedContactRequestId ||
      item?.contactRequestId ||
      item?.requestId ||
      "",
    relatedShortlistId:
      options.relatedShortlistId || item?.relatedShortlistId || item?.shortlistId || "",
    title: String(item?.title || "Admin review item").trim(),
    detail: String(item?.detail || "").trim(),
    queueTypeRaw,
    queueType: queueTypeRaw,
    queueStatusRaw,
    queueStatus: mapQueueStatusToRecord(queueStatusRaw),
    status: mapQueueStatusToRecord(queueStatusRaw),
    priorityRaw,
    priority: mapPriorityToRecord(priorityRaw),
    reviewReason: String(item?.reviewReason || item?.review_reason || "").trim(),
    reviewNotes: String(item?.reviewNotes || item?.review_notes || "").trim(),
    sourceContext: String(item?.sourceContext || "manual").trim(),
    adminDecisionRaw,
    adminDecision: mapAdminDecisionToRecord(adminDecisionRaw),
    adminDecisionBy: item?.adminDecisionBy || null,
    adminDecisionAt: item?.adminDecisionAt || null,
    reviewedAt: item?.reviewedAt || item?.adminDecisionAt || null,
    noDirectMessaging:
      typeof item?.noDirectMessaging === "boolean" ? item.noDirectMessaging : true,
    source: options.source || item?.source || "local-admin-queue",
    storageSource: options.storageSource || item?.storageSource || "localStorage",
    queueData,
    createdAt,
    updatedAt,
  };
}

function getAdminQueueDuplicateKey(item) {
  const queueType = normalizeQueueTypeForDatabase(item?.queueTypeRaw || item?.queueType);
  const relatedAthleteProfileId = String(item?.relatedAthleteProfileId || "").trim().toLowerCase();
  const relatedHighlightId = String(item?.relatedHighlightId || "").trim().toLowerCase();
  const relatedOpportunityId = String(item?.relatedOpportunityId || "").trim().toLowerCase();
  const relatedContactRequestId = String(item?.relatedContactRequestId || "").trim().toLowerCase();
  const relatedShortlistId = String(item?.relatedShortlistId || "").trim().toLowerCase();
  const title = String(item?.title || "").trim().toLowerCase();
  const detail = String(item?.detail || "").trim().toLowerCase();

  if (relatedAthleteProfileId) {
    return `${queueType}::athlete::${relatedAthleteProfileId}`;
  }
  if (relatedHighlightId) {
    return `${queueType}::highlight::${relatedHighlightId}`;
  }
  if (relatedOpportunityId) {
    return `${queueType}::opportunity::${relatedOpportunityId}`;
  }
  if (relatedContactRequestId) {
    return `${queueType}::contact_request::${relatedContactRequestId}`;
  }
  if (relatedShortlistId) {
    return `${queueType}::shortlist::${relatedShortlistId}`;
  }

  return `${queueType}::${title}::${detail}`;
}

function normalizeAdminQueueCollection(collection = []) {
  const seen = new Set();

  return (Array.isArray(collection) ? collection : [])
    .map((item) => normalizeManagedAdminQueueItem(item))
    .filter((item) => item.id)
    .filter((item) => {
      const duplicateKey = getAdminQueueDuplicateKey(item);
      if (seen.has(duplicateKey)) {
        return false;
      }

      seen.add(duplicateKey);
      return true;
    })
    .sort(
      (left, right) =>
        new Date(right.updatedAt || right.createdAt || 0).getTime() -
        new Date(left.updatedAt || left.createdAt || 0).getTime(),
    );
}

function flattenLocalAdminQueues(queues) {
  const safeQueues = isObject(queues) ? queues : ADMIN_QUEUE_DEFAULTS;

  return Object.entries(BUCKET_TO_QUEUE_TYPE).flatMap(([bucketName, queueType]) =>
    (Array.isArray(safeQueues[bucketName]) ? safeQueues[bucketName] : []).map((item) =>
      normalizeManagedAdminQueueItem(item, { queueType, bucketName }),
    ),
  );
}

function groupAdminQueueItems(items) {
  const grouped = cloneValue(ADMIN_QUEUE_DEFAULTS);

  normalizeAdminQueueCollection(items).forEach((item) => {
    const bucket = mapQueueTypeToBucket(item.queueTypeRaw || item.queueType);
    grouped[bucket].push({
      ...item,
      status: item.status || mapQueueStatusToRecord(item.queueStatusRaw),
    });
  });

  return grouped;
}

function mergeAdminQueueCollections(primary = [], secondary = []) {
  const merged = [];
  const seen = new Set();

  [primary, secondary].forEach((collection) => {
    normalizeAdminQueueCollection(collection).forEach((item) => {
      const duplicateKey = getAdminQueueDuplicateKey(item);
      if (!item.id || seen.has(duplicateKey)) {
        return;
      }

      seen.add(duplicateKey);
      merged.push(cloneValue(item));
    });
  });

  return normalizeAdminQueueCollection(merged);
}

function writeLocalAdminQueueGroups(groups) {
  const grouped = groupAdminQueueItems(flattenLocalAdminQueues(groups));
  const total = Object.values(grouped).reduce(
    (count, items) => count + (Array.isArray(items) ? items.length : 0),
    0,
  );

  if (total === 0) {
    removeLocalData(ADMIN_QUEUE_STORAGE_KEY);
    return;
  }

  writeLocalData(ADMIN_QUEUE_STORAGE_KEY, grouped);
}

function writeLocalAdminQueueItems(items) {
  writeLocalAdminQueueGroups(groupAdminQueueItems(items));
}

function upsertLocalAdminQueueItem(item) {
  const nextRecord = normalizeManagedAdminQueueItem(item, {
    source: item?.source || "local-admin-queue",
    storageSource: item?.storageSource || "localStorage",
    updatedAt: new Date().toISOString(),
  });
  const nextKey = getAdminQueueDuplicateKey(nextRecord);
  const current = normalizeAdminQueueCollection(flattenLocalAdminQueues(readLocalAdminQueuesRaw()));
  const filtered = current.filter(
    (entry) => entry.id !== nextRecord.id && getAdminQueueDuplicateKey(entry) !== nextKey,
  );
  const nextCollection = normalizeAdminQueueCollection([nextRecord, ...filtered]);
  writeLocalAdminQueueItems(nextCollection);
  return nextRecord;
}

function updateLocalAdminQueueItem(itemId, updates = {}) {
  const current = normalizeAdminQueueCollection(flattenLocalAdminQueues(readLocalAdminQueuesRaw()));
  const existingItem = current.find((item) => item.id === itemId) || null;

  if (!existingItem) {
    return null;
  }

  const nextItem = normalizeManagedAdminQueueItem(
    {
      ...existingItem,
      ...cloneValue(isObject(updates) ? updates : {}),
    },
    {
      updatedAt: new Date().toISOString(),
    },
  );
  const filtered = current.filter((item) => item.id !== itemId);
  const nextCollection = normalizeAdminQueueCollection([nextItem, ...filtered]);
  writeLocalAdminQueueItems(nextCollection);
  return nextItem;
}

function deleteLocalAdminQueueItem(itemId) {
  const current = normalizeAdminQueueCollection(flattenLocalAdminQueues(readLocalAdminQueuesRaw()));
  const nextCollection = current.filter((item) => item.id !== itemId);
  writeLocalAdminQueueItems(nextCollection);
}

function buildAdminQueueStatus({
  mode = "local",
  source = "localStorage",
  tableDetected = null,
  message = "Admin queue records are saved on this device only.",
  adminQueueCount = 0,
  localAdminQueueCount = 0,
  supabaseAdminQueueCount = 0,
}) {
  const modeLabel =
    mode === "supabase_active"
      ? "Supabase Admin Queues Active"
      : mode === "supabase_fallback"
        ? "Supabase Admin Queues Fallback"
        : "Local Demo";

  return {
    mode,
    modeLabel,
    source,
    sourceLabel: source === "supabase" ? "Supabase" : "localStorage",
    tableDetected,
    tableDetectedLabel:
      tableDetected === true ? "yes" : tableDetected === false ? "no" : "unknown",
    backendEnabled: isAdminQueueBackendEnabled(),
    message,
    sportsDataMigrationStatus: ADMIN_QUEUE_MIGRATION_STATUS,
    adminQueueCount,
    localAdminQueueCount,
    supabaseAdminQueueCount,
  };
}

function getAdminQueueMissingMessage() {
  return "Supabase auth is connected, but admin_queue_items table/policies still need admin_queues_phase_1.sql.";
}

function classifyAdminQueueError(error) {
  const code = String(error?.code || "").trim();
  const message = String(error?.message || "").trim();
  const details = String(error?.details || "").trim();
  const hint = String(error?.hint || "").trim();
  const combined = `${message} ${details} ${hint}`.toLowerCase();

  if (
    code === "42P01" ||
    code === "PGRST205" ||
    combined.includes("could not find the table") ||
    (combined.includes("relation") && combined.includes("does not exist"))
  ) {
    return { category: "table_missing", label: "Table missing" };
  }

  if (
    code === "42703" ||
    (combined.includes("column") && combined.includes("does not exist"))
  ) {
    return { category: "column_missing", label: "Column missing" };
  }

  if (
    combined.includes("row-level security") ||
    combined.includes("violates row-level security policy")
  ) {
    return { category: "rls_policy", label: "RLS / policy error" };
  }

  if (
    code === "42501" ||
    combined.includes("permission denied") ||
    combined.includes("insufficient privilege")
  ) {
    return { category: "permission", label: "Permission / grant error" };
  }

  if (
    code === "23514" ||
    code === "23503" ||
    code === "23505" ||
    code === "22P02" ||
    combined.includes("violates check constraint") ||
    combined.includes("violates foreign key constraint") ||
    combined.includes("violates unique constraint") ||
    combined.includes("invalid input syntax")
  ) {
    return { category: "constraint", label: "Constraint / check violation" };
  }

  return { category: "unknown", label: "Unknown backend error" };
}

function formatAdminQueueError(error, phase = "request") {
  if (!error) {
    return "";
  }

  const { label } = classifyAdminQueueError(error);
  const code = String(error?.code || "").trim();
  const message = String(error?.message || "").trim() || "No message returned.";
  const details = String(error?.details || "").trim();
  const hint = String(error?.hint || "").trim();
  const segments = [`Supabase ${phase} error (${label}): ${message}`];

  if (code) {
    segments.push(`Code: ${code}.`);
  }
  if (details) {
    segments.push(`Details: ${details}.`);
  }
  if (hint) {
    segments.push(`Hint: ${hint}.`);
  }

  return segments.join(" ");
}

function buildAdminQueueUnavailableMessage(error) {
  if (!error) {
    return "Supabase admin queues are unavailable right now, so the app will keep using this device for review records.";
  }

  const classified = classifyAdminQueueError(error);

  if (classified.category === "table_missing" || classified.category === "column_missing") {
    return getAdminQueueMissingMessage();
  }

  return formatAdminQueueError(error, "admin queue availability check");
}

function isMissingAdminQueueTableError(error) {
  const classified = classifyAdminQueueError(error);
  return classified.category === "table_missing" || classified.category === "column_missing";
}

async function detectAdminQueueTable(force = false) {
  if (!force && adminQueueTableCache.checked) {
    return adminQueueTableCache;
  }

  if (!isAdminQueueBackendEnabled() || !supabase) {
    adminQueueTableCache = {
      checked: true,
      detected: null,
      message: "Admin queue records are saved on this device only.",
    };
    return adminQueueTableCache;
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    adminQueueTableCache = {
      checked: true,
      detected: null,
      message: "Backend is connected. Sign in to save admin queue records to your Supabase account.",
    };
    return adminQueueTableCache;
  }

  try {
    const { error } = await supabase
      .from(ADMIN_QUEUE_TABLE)
      .select("id")
      .eq("owner_user_id", user.id)
      .limit(1);

    adminQueueTableCache = error
      ? {
          checked: true,
          detected: false,
          message: buildAdminQueueUnavailableMessage(error),
        }
      : {
          checked: true,
          detected: true,
          message: "",
        };

    return adminQueueTableCache;
  } catch (error) {
    adminQueueTableCache = {
      checked: true,
      detected: false,
      message: buildAdminQueueUnavailableMessage(error),
    };
    return adminQueueTableCache;
  }
}

function buildAdminQueueRow(item, ownerUserId) {
  const normalizedItem = normalizeManagedAdminQueueItem(item, {
    ownerUserId,
    source: "supabase-admin-queue",
    storageSource: "supabase",
    updatedAt: new Date().toISOString(),
  });
  const recordId = isUuidLike(normalizedItem.id)
    ? normalizedItem.id
    : createAdminQueueUuid();
  const queueType = normalizeQueueTypeForDatabase(normalizedItem.queueTypeRaw || normalizedItem.queueType);
  const queueStatus = normalizeQueueStatusForDatabase(
    normalizedItem.queueStatusRaw || normalizedItem.queueStatus || normalizedItem.status,
  );
  const priority = normalizePriorityForDatabase(normalizedItem.priorityRaw || normalizedItem.priority);
  const adminDecision = normalizeAdminDecisionForDatabase(
    normalizedItem.adminDecisionRaw ?? normalizedItem.adminDecision,
  );

  return {
    id: recordId,
    owner_user_id: ownerUserId,
    related_user_id: isUuidLike(normalizedItem.relatedUserId) ? normalizedItem.relatedUserId : null,
    related_athlete_profile_id: isUuidLike(normalizedItem.relatedAthleteProfileId)
      ? normalizedItem.relatedAthleteProfileId
      : null,
    related_highlight_id: isUuidLike(normalizedItem.relatedHighlightId)
      ? normalizedItem.relatedHighlightId
      : null,
    related_opportunity_id: isUuidLike(normalizedItem.relatedOpportunityId)
      ? normalizedItem.relatedOpportunityId
      : null,
    related_contact_request_id: isUuidLike(normalizedItem.relatedContactRequestId)
      ? normalizedItem.relatedContactRequestId
      : null,
    related_shortlist_id: isUuidLike(normalizedItem.relatedShortlistId)
      ? normalizedItem.relatedShortlistId
      : null,
    queue_type: queueType,
    queue_status: queueStatus,
    priority,
    review_reason: toNullableString(normalizedItem.reviewReason),
    review_notes: toNullableString(normalizedItem.reviewNotes),
    source_context: toNullableString(normalizedItem.sourceContext),
    admin_decision: adminDecision,
    admin_decision_by: isUuidLike(normalizedItem.adminDecisionBy)
      ? normalizedItem.adminDecisionBy
      : null,
    admin_decision_at: normalizedItem.adminDecisionAt || null,
    no_direct_messaging: true,
    queue_data: {
      ...normalizedItem,
      id: recordId,
      ownerUserId,
      source: "supabase-admin-queue",
      storageSource: "supabase",
      queueTypeRaw: queueType,
      queueType: queueType,
      queueStatusRaw: queueStatus,
      queueStatus: mapQueueStatusToRecord(queueStatus),
      status: mapQueueStatusToRecord(queueStatus),
      priorityRaw: priority,
      priority: mapPriorityToRecord(priority),
      adminDecisionRaw: adminDecision,
      adminDecision: mapAdminDecisionToRecord(adminDecision),
      noDirectMessaging: true,
    },
    updated_at: new Date().toISOString(),
  };
}

function normalizeSupabaseAdminQueueRow(row) {
  const rawRecord = isObject(row?.queue_data) ? cloneValue(row.queue_data) : {};
  const queueType = normalizeQueueTypeForDatabase(
    row?.queue_type || rawRecord.queueTypeRaw || rawRecord.queueType,
  );
  const queueStatus = normalizeQueueStatusForDatabase(
    row?.queue_status || rawRecord.queueStatusRaw || rawRecord.queueStatus || rawRecord.status,
  );
  const priority = normalizePriorityForDatabase(row?.priority || rawRecord.priorityRaw || rawRecord.priority);
  const adminDecision = normalizeAdminDecisionForDatabase(
    row?.admin_decision ?? rawRecord.adminDecisionRaw ?? rawRecord.adminDecision,
  );

  return {
    ...rawRecord,
    id: String(row?.id || rawRecord.id || createAdminQueueUuid()),
    ownerUserId: row?.owner_user_id || rawRecord.ownerUserId || null,
    relatedUserId: row?.related_user_id || rawRecord.relatedUserId || null,
    relatedAthleteProfileId: String(
      row?.related_athlete_profile_id ||
        rawRecord.relatedAthleteProfileId ||
        rawRecord.athleteId ||
        rawRecord.athleteProfileId ||
        "",
    ).trim(),
    relatedHighlightId: String(
      row?.related_highlight_id || rawRecord.relatedHighlightId || rawRecord.highlightId || "",
    ).trim(),
    relatedOpportunityId: String(
      row?.related_opportunity_id ||
        rawRecord.relatedOpportunityId ||
        rawRecord.opportunityId ||
        "",
    ).trim(),
    relatedContactRequestId: String(
      row?.related_contact_request_id ||
        rawRecord.relatedContactRequestId ||
        rawRecord.contactRequestId ||
        rawRecord.requestId ||
        "",
    ).trim(),
    relatedShortlistId: String(
      row?.related_shortlist_id || rawRecord.relatedShortlistId || rawRecord.shortlistId || "",
    ).trim(),
    title: String(rawRecord.title || "Admin review item").trim(),
    detail: String(rawRecord.detail || "").trim(),
    queueTypeRaw: queueType,
    queueType: queueType,
    queueStatusRaw: queueStatus,
    queueStatus: mapQueueStatusToRecord(queueStatus),
    status: mapQueueStatusToRecord(queueStatus),
    priorityRaw: priority,
    priority: mapPriorityToRecord(priority),
    reviewReason: String(row?.review_reason || rawRecord.reviewReason || "").trim(),
    reviewNotes: String(row?.review_notes || rawRecord.reviewNotes || "").trim(),
    sourceContext: String(row?.source_context || rawRecord.sourceContext || "manual").trim(),
    adminDecisionRaw: adminDecision,
    adminDecision: mapAdminDecisionToRecord(adminDecision),
    adminDecisionBy: row?.admin_decision_by || rawRecord.adminDecisionBy || null,
    adminDecisionAt: row?.admin_decision_at || rawRecord.adminDecisionAt || null,
    reviewedAt: rawRecord.reviewedAt || row?.admin_decision_at || null,
    noDirectMessaging:
      typeof row?.no_direct_messaging === "boolean"
        ? row.no_direct_messaging
        : rawRecord.noDirectMessaging !== false,
    source: "supabase-admin-queue",
    storageSource: "supabase",
    queueData: cloneValue(rawRecord),
    createdAt: row?.created_at || rawRecord.createdAt || new Date().toISOString(),
    updatedAt: row?.updated_at || rawRecord.updatedAt || row?.created_at || new Date().toISOString(),
  };
}

async function readSupabaseAdminQueueItems(user) {
  if (!supabase || !user?.id) {
    return { queueItems: [], error: null, errorMessage: "", errorCategory: "" };
  }

  try {
    const { data, error } = await supabase
      .from(ADMIN_QUEUE_TABLE)
      .select("*")
      .eq("owner_user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return {
        queueItems: [],
        error,
        errorMessage: formatAdminQueueError(error, "admin queue reload"),
        errorCategory: classifyAdminQueueError(error).category,
      };
    }

    return {
      queueItems: Array.isArray(data) ? data.map(normalizeSupabaseAdminQueueRow) : [],
      error: null,
      errorMessage: "",
      errorCategory: "",
    };
  } catch (error) {
    return {
      queueItems: [],
      error,
      errorMessage: formatAdminQueueError(error, "admin queue reload"),
      errorCategory: classifyAdminQueueError(error).category,
    };
  }
}

function findExistingAdminQueueRecord(items, record) {
  const duplicateKey = getAdminQueueDuplicateKey(record);

  return normalizeAdminQueueCollection(items).find(
    (item) => item.id === record.id || getAdminQueueDuplicateKey(item) === duplicateKey,
  );
}

async function loadAdminQueueItems() {
  const localQueueItems = normalizeAdminQueueCollection(flattenLocalAdminQueues(readLocalAdminQueuesRaw()));

  if (!isAdminQueueBackendEnabled() || !supabase) {
    return {
      queues: groupAdminQueueItems(localQueueItems),
      queueItems: localQueueItems,
      ...buildAdminQueueStatus({
        mode: "local",
        source: "localStorage",
        tableDetected: null,
        message: "Admin queue records are saved on this device only.",
        adminQueueCount: localQueueItems.length,
        localAdminQueueCount: localQueueItems.length,
        supabaseAdminQueueCount: 0,
      }),
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    return {
      queues: groupAdminQueueItems(localQueueItems),
      queueItems: localQueueItems,
      ...buildAdminQueueStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: null,
        message:
          "Backend is connected. Sign in to save admin queue records to your Supabase account. Existing local admin queues remain on this device only.",
        adminQueueCount: localQueueItems.length,
        localAdminQueueCount: localQueueItems.length,
        supabaseAdminQueueCount: 0,
      }),
    };
  }

  const tableStatus = await detectAdminQueueTable();
  if (tableStatus.detected !== true) {
    return {
      queues: groupAdminQueueItems(localQueueItems),
      queueItems: localQueueItems,
      ...buildAdminQueueStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: tableStatus.detected,
        message:
          tableStatus.message ||
          "Supabase admin queues are unavailable right now, so the app will keep using this device for review records.",
        adminQueueCount: localQueueItems.length,
        localAdminQueueCount: localQueueItems.length,
        supabaseAdminQueueCount: 0,
      }),
    };
  }

  const { queueItems: supabaseQueueItems, error } = await readSupabaseAdminQueueItems(user);
  if (error) {
    const errorMessage = formatAdminQueueError(error, "admin queue reload");
    return {
      queues: groupAdminQueueItems(localQueueItems),
      queueItems: localQueueItems,
      readErrorMessage: errorMessage,
      readErrorCategory: classifyAdminQueueError(error).category,
      ...buildAdminQueueStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: false,
        message: errorMessage || buildAdminQueueUnavailableMessage(error),
        adminQueueCount: localQueueItems.length,
        localAdminQueueCount: localQueueItems.length,
        supabaseAdminQueueCount: 0,
      }),
    };
  }

  const mergedQueueItems = mergeAdminQueueCollections(supabaseQueueItems, localQueueItems);
  const groupedQueues = groupAdminQueueItems(mergedQueueItems);
  const source = supabaseQueueItems.length > 0 ? "supabase" : "localStorage";
  const message =
    supabaseQueueItems.length > 0
      ? "Admin queue records are saved to your Supabase account. Local demo queue items can still render in this phase."
      : "Supabase admin queues are ready. Existing local demo queue items can still render in this phase.";

  return {
    queues: groupedQueues,
    queueItems: mergedQueueItems,
    readErrorMessage: "",
    readErrorCategory: "",
    ...buildAdminQueueStatus({
      mode: "supabase_active",
      source,
      tableDetected: true,
      message,
      adminQueueCount: mergedQueueItems.length,
      localAdminQueueCount: localQueueItems.length,
      supabaseAdminQueueCount: supabaseQueueItems.length,
    }),
  };
}

export function isAdminQueueBackendEnabled() {
  return isRealAuthEnabled();
}

export async function getAdminQueueBackendStatus() {
  const result = await loadAdminQueueItems();
  return buildAdminQueueStatus(result);
}

export async function getAdminQueueItems() {
  return loadAdminQueueItems();
}

export async function getAdminQueueItemsByType(queueType) {
  const result = await loadAdminQueueItems();
  const normalizedQueueType = normalizeQueueTypeForDatabase(queueType);

  return {
    ...result,
    queueItems: result.queueItems.filter(
      (item) => normalizeQueueTypeForDatabase(item.queueTypeRaw || item.queueType) === normalizedQueueType,
    ),
  };
}

export async function getAdminQueueItemsByStatus(queueStatus) {
  const result = await loadAdminQueueItems();
  const normalizedQueueStatus = normalizeQueueStatusForDatabase(queueStatus);

  return {
    ...result,
    queueItems: result.queueItems.filter(
      (item) =>
        normalizeQueueStatusForDatabase(item.queueStatusRaw || item.queueStatus || item.status) ===
        normalizedQueueStatus,
    ),
  };
}

export async function saveAdminQueueItem(item) {
  const nextRecord = normalizeManagedAdminQueueItem(item, {
    updatedAt: new Date().toISOString(),
  });

  if (!isAdminQueueBackendEnabled() || !supabase) {
    const savedLocalRecord = upsertLocalAdminQueueItem(nextRecord);

    return {
      success: true,
      source: "localStorage",
      fallback: false,
      queueItem: savedLocalRecord,
      insertErrorMessage: "",
      insertErrorCategory: "",
      queueDataExists: Object.keys(savedLocalRecord?.queueData || {}).length > 0,
      ownerUserIdExists: Boolean(savedLocalRecord?.ownerUserId),
      ...(await getAdminQueueItems()),
      message: "Admin queue record saved on this device only.",
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    const savedLocalRecord = upsertLocalAdminQueueItem(nextRecord);

    return {
      success: true,
      source: "localStorage",
      fallback: true,
      queueItem: savedLocalRecord,
      insertErrorMessage: "No Supabase session detected for admin queue insert.",
      insertErrorCategory: "no_session",
      queueDataExists: Object.keys(savedLocalRecord?.queueData || {}).length > 0,
      ownerUserIdExists: Boolean(savedLocalRecord?.ownerUserId),
      ...(await getAdminQueueItems()),
      message:
        "No Supabase session detected, so the admin queue record was saved on this device only.",
    };
  }

  const tableStatus = await detectAdminQueueTable(true);
  if (tableStatus.detected !== true) {
    const savedLocalRecord = upsertLocalAdminQueueItem(nextRecord);

    return {
      success: true,
      source: "localStorage",
      fallback: true,
      queueItem: savedLocalRecord,
      insertErrorMessage:
        tableStatus.message || "Supabase admin queue insert could not start because the table is unavailable.",
      insertErrorCategory:
        tableStatus.detected === false ? "table_or_policy_unavailable" : "unknown",
      queueDataExists: Object.keys(savedLocalRecord?.queueData || {}).length > 0,
      ownerUserIdExists: Boolean(savedLocalRecord?.ownerUserId),
      ...(await getAdminQueueItems()),
      message:
        tableStatus.message ||
        "Supabase auth is connected, but admin queue records could only be saved on this device for now.",
    };
  }

  const current = await getAdminQueueItems();
  const existingRecord = findExistingAdminQueueRecord(current.queueItems, nextRecord);
  const adminQueueRow = buildAdminQueueRow(
    existingRecord && existingRecord.storageSource === "supabase"
      ? { ...nextRecord, id: existingRecord.id }
      : nextRecord,
    user.id,
  );

  try {
    const { data, error } = await supabase
      .from(ADMIN_QUEUE_TABLE)
      .upsert(adminQueueRow, { onConflict: "id" })
      .select("*")
      .maybeSingle();

    if (error || !data) {
      const formattedInsertError = formatAdminQueueError(error, "admin queue insert");
      const savedLocalRecord = upsertLocalAdminQueueItem(nextRecord);

      return {
        success: true,
        source: "localStorage",
        fallback: true,
        queueItem: savedLocalRecord,
        insertErrorMessage:
          formattedInsertError || ADMIN_QUEUE_ERROR_FALLBACK_MESSAGE,
        insertErrorCategory: classifyAdminQueueError(error).category,
        queueDataExists: Object.keys(savedLocalRecord?.queueData || {}).length > 0,
        ownerUserIdExists: Boolean(savedLocalRecord?.ownerUserId),
        ...(await getAdminQueueItems()),
        message:
          formattedInsertError ||
          "Supabase admin queue save did not complete, so the review record was saved on this device only for now.",
      };
    }

    const savedQueueItem = normalizeSupabaseAdminQueueRow(data);

    return {
      success: true,
      source: "supabase",
      fallback: false,
      queueItem: savedQueueItem,
      insertErrorMessage: "",
      insertErrorCategory: "",
      queueDataExists: Boolean(data?.queue_data) && Object.keys(data.queue_data).length > 0,
      ownerUserIdExists: Boolean(data?.owner_user_id),
      ...(await getAdminQueueItems()),
      message: "Admin queue record saved to your Supabase account.",
    };
  } catch (error) {
    const formattedInsertError = formatAdminQueueError(error, "admin queue insert");
    const savedLocalRecord = upsertLocalAdminQueueItem(nextRecord);

    return {
      success: true,
      source: "localStorage",
      fallback: true,
      queueItem: savedLocalRecord,
      insertErrorMessage:
        formattedInsertError || ADMIN_QUEUE_ERROR_FALLBACK_MESSAGE,
      insertErrorCategory: classifyAdminQueueError(error).category,
      queueDataExists: Object.keys(savedLocalRecord?.queueData || {}).length > 0,
      ownerUserIdExists: Boolean(savedLocalRecord?.ownerUserId),
      ...(await getAdminQueueItems()),
      message:
        formattedInsertError ||
        "Supabase admin queue save did not complete, so the review record was saved on this device only for now.",
    };
  }
}

export async function updateAdminQueueItem(itemId, updates = {}) {
  const current = await getAdminQueueItems();
  const existingQueueItem = current.queueItems.find((item) => item.id === itemId) || null;

  if (!existingQueueItem) {
    return {
      success: false,
      queueItem: null,
      message: "Admin queue item not found.",
      ...(await getAdminQueueItems()),
    };
  }

  const nextRecord = normalizeManagedAdminQueueItem(
    {
      ...existingQueueItem,
      ...cloneValue(isObject(updates) ? updates : {}),
    },
    {
      updatedAt: new Date().toISOString(),
    },
  );

  if (
    !isAdminQueueBackendEnabled() ||
    !supabase ||
    existingQueueItem.storageSource !== "supabase"
  ) {
    if (isAdminQueueBackendEnabled() && supabase) {
      return saveAdminQueueItem(nextRecord);
    }

    const updatedLocalRecord = updateLocalAdminQueueItem(itemId, nextRecord);

    return {
      success: Boolean(updatedLocalRecord),
      source: "localStorage",
      fallback: false,
      queueItem: updatedLocalRecord,
      queueDataExists: Object.keys(updatedLocalRecord?.queueData || {}).length > 0,
      ownerUserIdExists: Boolean(updatedLocalRecord?.ownerUserId),
      ...(await getAdminQueueItems()),
      message: updatedLocalRecord
        ? "Admin queue record updated on this device only."
        : "Admin queue item not found.",
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    const updatedLocalRecord = updateLocalAdminQueueItem(itemId, nextRecord);

    return {
      success: Boolean(updatedLocalRecord),
      source: "localStorage",
      fallback: true,
      queueItem: updatedLocalRecord,
      queueDataExists: Object.keys(updatedLocalRecord?.queueData || {}).length > 0,
      ownerUserIdExists: Boolean(updatedLocalRecord?.ownerUserId),
      ...(await getAdminQueueItems()),
      message:
        "No Supabase session detected, so the admin queue record was updated on this device only.",
    };
  }

  const tableStatus = await detectAdminQueueTable(true);
  if (tableStatus.detected !== true) {
    const updatedLocalRecord = updateLocalAdminQueueItem(itemId, nextRecord);

    return {
      success: Boolean(updatedLocalRecord),
      source: "localStorage",
      fallback: true,
      queueItem: updatedLocalRecord,
      queueDataExists: Object.keys(updatedLocalRecord?.queueData || {}).length > 0,
      ownerUserIdExists: Boolean(updatedLocalRecord?.ownerUserId),
      ...(await getAdminQueueItems()),
      message:
        tableStatus.message ||
        "Supabase admin queues are unavailable right now, so the review record stayed on this device only.",
    };
  }

  const adminQueueRow = buildAdminQueueRow({ ...nextRecord, id: existingQueueItem.id }, user.id);

  try {
    const { data, error } = await supabase
      .from(ADMIN_QUEUE_TABLE)
      .update(adminQueueRow)
      .eq("id", existingQueueItem.id)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      const updatedLocalRecord = updateLocalAdminQueueItem(itemId, nextRecord);

      return {
        success: Boolean(updatedLocalRecord),
        source: "localStorage",
        fallback: true,
        queueItem: updatedLocalRecord,
        queueDataExists: Object.keys(updatedLocalRecord?.queueData || {}).length > 0,
        ownerUserIdExists: Boolean(updatedLocalRecord?.ownerUserId),
        ...(await getAdminQueueItems()),
        message: isMissingAdminQueueTableError(error)
          ? getAdminQueueMissingMessage()
          : "Supabase admin queue update did not complete, so the review record was updated on this device only for now.",
      };
    }

    const updatedQueueItem = normalizeSupabaseAdminQueueRow(data);

    return {
      success: true,
      source: "supabase",
      fallback: false,
      queueItem: updatedQueueItem,
      queueDataExists: Boolean(data?.queue_data) && Object.keys(data.queue_data).length > 0,
      ownerUserIdExists: Boolean(data?.owner_user_id),
      ...(await getAdminQueueItems()),
      message: "Admin queue record updated in your Supabase account.",
    };
  } catch (error) {
    const updatedLocalRecord = updateLocalAdminQueueItem(itemId, nextRecord);

    return {
      success: Boolean(updatedLocalRecord),
      source: "localStorage",
      fallback: true,
      queueItem: updatedLocalRecord,
      queueDataExists: Object.keys(updatedLocalRecord?.queueData || {}).length > 0,
      ownerUserIdExists: Boolean(updatedLocalRecord?.ownerUserId),
      ...(await getAdminQueueItems()),
      message: isMissingAdminQueueTableError(error)
        ? getAdminQueueMissingMessage()
        : "Supabase admin queue update did not complete, so the review record was updated on this device only for now.",
    };
  }
}

export async function deleteAdminQueueItem(itemId) {
  const current = await getAdminQueueItems();
  const existingQueueItem = current.queueItems.find((item) => item.id === itemId) || null;

  if (!existingQueueItem) {
    return {
      success: false,
      deletedAdminQueueItemId: null,
      ...(await getAdminQueueItems()),
      message: "Admin queue item not found.",
    };
  }

  if (
    !isAdminQueueBackendEnabled() ||
    !supabase ||
    existingQueueItem.storageSource !== "supabase"
  ) {
    deleteLocalAdminQueueItem(itemId);

    return {
      success: true,
      source: "localStorage",
      fallback: false,
      deletedAdminQueueItemId: itemId,
      ...(await getAdminQueueItems()),
      message: "Admin queue item removed from this device.",
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    deleteLocalAdminQueueItem(itemId);

    return {
      success: true,
      source: "localStorage",
      fallback: true,
      deletedAdminQueueItemId: itemId,
      ...(await getAdminQueueItems()),
      message: "No Supabase session detected, so the admin queue item was removed from this device only.",
    };
  }

  const tableStatus = await detectAdminQueueTable(true);
  if (tableStatus.detected !== true) {
    deleteLocalAdminQueueItem(itemId);

    return {
      success: true,
      source: "localStorage",
      fallback: true,
      deletedAdminQueueItemId: itemId,
      ...(await getAdminQueueItems()),
      message:
        tableStatus.message ||
        "Supabase admin queues are unavailable right now, so the review record was removed from this device only.",
    };
  }

  try {
    const { error } = await supabase.from(ADMIN_QUEUE_TABLE).delete().eq("id", itemId);

    if (error) {
      return {
        success: false,
        deletedAdminQueueItemId: null,
        ...(await getAdminQueueItems()),
        message: isMissingAdminQueueTableError(error)
          ? getAdminQueueMissingMessage()
          : "Supabase admin queue delete could not be completed.",
      };
    }

    deleteLocalAdminQueueItem(itemId);

    return {
      success: true,
      source: "supabase",
      fallback: false,
      deletedAdminQueueItemId: itemId,
      ...(await getAdminQueueItems()),
      message: "Admin queue item removed from your Supabase account.",
    };
  } catch (error) {
    return {
      success: false,
      deletedAdminQueueItemId: null,
      ...(await getAdminQueueItems()),
      message: isMissingAdminQueueTableError(error)
        ? getAdminQueueMissingMessage()
        : "Supabase admin queue delete could not be completed.",
    };
  }
}
