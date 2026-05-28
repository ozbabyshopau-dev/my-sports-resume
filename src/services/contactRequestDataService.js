import { getCurrentUser, isRealAuthEnabled } from "./authService";
import { readLocalData, writeLocalData } from "./localDataService";
import { supabase } from "./supabaseClient";

const CONTACT_REQUEST_STORAGE_KEY = "msr_contact_requests_v1";
const CONTACT_REQUESTS_TABLE = "contact_requests";
const CONTACT_REQUEST_MIGRATION_STATUS =
  "Profiles + Highlights metadata + Opportunities metadata + Contact request metadata only";
const REQUEST_STATUS_LABELS = {
  pending_review: "Pending Review",
  pending_parent_guardian: "Pending Parent/Guardian",
  approved_to_contact: "Approved to Contact",
  rejected: "Rejected",
  archived: "Archived",
};
const SAFETY_STATUS_LABELS = {
  safe_pending: "Safe Pending",
  needs_admin_review: "Needs Admin Review",
  blocked: "Blocked",
  approved: "Approved",
};

let contactRequestsTableCache = {
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

function createContactRequestUuid() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `contact-request-${Date.now()}`;
}

function normalizeContactRouteForDatabase(route, isJunior = false) {
  const normalized = normalizeText(route);

  if (isJunior || normalized.includes("parent") || normalized.includes("guardian")) {
    return "parent_guardian_required";
  }

  if (normalized.includes("athlete")) {
    return "athlete_allowed";
  }

  return "contact_request_only";
}

function mapContactRouteToRequest(route, isJunior = false) {
  const normalized = String(route || "").trim().toLowerCase();

  if (isJunior || normalized === "parent_guardian_required") {
    return "Under-18 interest routes to parent or guardian";
  }

  if (normalized === "athlete_allowed") {
    return "Contact requests route to the athlete";
  }

  return "Contact requests only";
}

function getRouteOwner(route, isJunior = false) {
  const normalized = String(route || "").trim().toLowerCase();
  if (isJunior || normalized === "parent_guardian_required") {
    return "parent_guardian";
  }

  return "athlete";
}

function normalizeRequestTypeForDatabase(requestType) {
  const normalized = normalizeText(requestType);

  if (normalized === "opportunity interest") {
    return "opportunity_interest";
  }
  if (normalized === "scout interest") {
    return "scout_interest";
  }
  if (normalized === "club trial interest") {
    return "club_trial_interest";
  }
  if (normalized === "verification followup") {
    return "verification_followup";
  }

  return "general_contact_request";
}

function mapRequestTypeToRequest(requestType) {
  const normalized = String(requestType || "").trim().toLowerCase();

  if (normalized === "opportunity_interest") {
    return "opportunity_interest";
  }
  if (normalized === "scout_interest") {
    return "scout_interest";
  }
  if (normalized === "club_trial_interest") {
    return "club_trial_interest";
  }
  if (normalized === "verification_followup") {
    return "verification_followup";
  }

  return "contact_request";
}

function normalizeRequestStatusForDatabase(status, isJunior = false, route = "") {
  const normalized = normalizeText(status);
  const routeValue = normalizeContactRouteForDatabase(route, isJunior);

  if (normalized === "pending parent guardian" || normalized === "pending parent/guardian") {
    return "pending_parent_guardian";
  }
  if (normalized === "approved to contact") {
    return "approved_to_contact";
  }
  if (normalized === "rejected") {
    return "rejected";
  }
  if (normalized === "archived") {
    return "archived";
  }

  if (isJunior || routeValue === "parent_guardian_required") {
    return "pending_parent_guardian";
  }

  return "pending_review";
}

function mapRequestStatusToRequest(status, isJunior = false, route = "") {
  const normalized = String(status || "").trim().toLowerCase();

  if (!normalized) {
    return isJunior || normalizeContactRouteForDatabase(route, isJunior) === "parent_guardian_required"
      ? "Pending Parent/Guardian"
      : "Pending Review";
  }

  return REQUEST_STATUS_LABELS[normalized] || "Pending Review";
}

function normalizeSafetyStatusForDatabase(status) {
  const normalized = normalizeText(status);

  if (normalized === "needs admin review") {
    return "needs_admin_review";
  }
  if (normalized === "blocked") {
    return "blocked";
  }
  if (normalized === "approved") {
    return "approved";
  }

  return "safe_pending";
}

function mapSafetyStatusToRequest(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return SAFETY_STATUS_LABELS[normalized] || "Safe Pending";
}

function readLocalContactRequests() {
  const requests = readLocalData(CONTACT_REQUEST_STORAGE_KEY, []);
  return Array.isArray(requests) ? cloneValue(requests) : [];
}

function writeLocalContactRequests(requests) {
  const nextRequests = Array.isArray(requests) ? requests : [];
  writeLocalData(CONTACT_REQUEST_STORAGE_KEY, cloneValue(nextRequests));
}

function mergeContactRequestCollections(primary = [], secondary = []) {
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

function buildContactRequestStatus({
  mode = "local",
  source = "localStorage",
  tableDetected = null,
  message = "Contact requests are saved on this device only.",
  requestCount = 0,
  localRequestCount = 0,
  supabaseRequestCount = 0,
}) {
  const modeLabel =
    mode === "supabase_active"
      ? "Supabase Contact Requests Active"
      : mode === "supabase_fallback"
        ? "Supabase Contact Requests Fallback"
        : "Local Demo";

  return {
    mode,
    modeLabel,
    source,
    sourceLabel: source === "supabase" ? "Supabase" : "localStorage",
    tableDetected,
    tableDetectedLabel:
      tableDetected === true ? "yes" : tableDetected === false ? "no" : "unknown",
    backendEnabled: isContactRequestBackendEnabled(),
    message,
    sportsDataMigrationStatus: CONTACT_REQUEST_MIGRATION_STATUS,
    requestCount,
    localRequestCount,
    supabaseRequestCount,
  };
}

function normalizeManagedContactRequest(request, options = {}) {
  const athleteIsJunior = Boolean(request?.athleteIsJunior);
  const nextId = isUuidLike(request?.id) ? String(request.id) : createContactRequestUuid();
  const createdAt = request?.createdAt || new Date().toISOString();
  const updatedAt = options.updatedAt || request?.updatedAt || new Date().toISOString();
  const contactRoute = mapContactRouteToRequest(
    options.contactRoute || request?.contactRoute,
    athleteIsJunior,
  );
  const to = options.to || request?.to || getRouteOwner(contactRoute, athleteIsJunior);
  const requestStatus = mapRequestStatusToRequest(
    options.requestStatus || request?.status,
    athleteIsJunior,
    contactRoute,
  );
  const safetyStatus = mapSafetyStatusToRequest(
    options.safetyStatus || request?.safetyStatus,
  );
  const requestType = mapRequestTypeToRequest(
    options.requestType || request?.requestType,
  );
  const createdByRole = String(request?.createdByRole || "club_scout").trim();
  const createdByLabel = String(
    request?.createdByLabel || request?.requesterRole || createdByRole,
  ).trim();
  const baseHistory = Array.isArray(request?.history) ? request.history : [];
  const history =
    baseHistory.length > 0
      ? baseHistory.map((entry) => ({
          id: entry?.id || `request-event-${Date.now()}`,
          actorRole: entry?.actorRole || createdByRole,
          actorLabel: entry?.actorLabel || createdByLabel,
          createdAt: entry?.createdAt || createdAt,
        }))
      : [
          {
            id: `request-event-${Date.now()}`,
            actorRole: createdByRole,
            actorLabel: createdByLabel,
            createdAt,
          },
        ];

  return {
    ...cloneValue(isObject(request) ? request : {}),
    id: nextId,
    requesterUserId: options.requesterUserId || request?.requesterUserId || null,
    athleteOwnerUserId: options.athleteOwnerUserId || request?.athleteOwnerUserId || null,
    athleteId: String(request?.athleteId || "").trim(),
    athleteProfileId: String(request?.athleteProfileId || request?.athleteId || "").trim(),
    opportunityId: String(request?.opportunityId || "").trim(),
    requesterName: String(request?.requesterName || "").trim(),
    requesterEmail: String(request?.requesterEmail || "").trim(),
    requesterRole: String(request?.requesterRole || createdByLabel).trim(),
    requesterOrganisation: String(request?.requesterOrganisation || request?.organisation || "").trim(),
    athleteDisplayName: String(request?.athleteDisplayName || "").trim(),
    athleteIsJunior,
    contactRoute,
    to,
    requestType,
    requestTypeRaw: String(request?.requestTypeRaw || requestType).trim(),
    status: requestStatus,
    safetyStatus,
    parentGuardianRequired:
      typeof request?.parentGuardianRequired === "boolean"
        ? request.parentGuardianRequired
        : to === "parent_guardian",
    adminReviewRequired:
      typeof request?.adminReviewRequired === "boolean" ? request.adminReviewRequired : true,
    noDirectMessaging:
      typeof request?.noDirectMessaging === "boolean" ? request.noDirectMessaging : true,
    requestReason: String(request?.requestReason || "").trim(),
    opportunityTitle: String(request?.opportunityTitle || "").trim(),
    organisation: String(request?.organisation || request?.requesterOrganisation || "").trim(),
    count: Number.isFinite(Number(request?.count)) ? Number(request.count) : 1,
    createdByRole,
    createdByLabel,
    history,
    source: options.source || request?.source || "local-contact-request",
    storageSource: options.storageSource || request?.storageSource || "localStorage",
    requestContext: isObject(request?.requestContext) ? cloneValue(request.requestContext) : {},
    createdAt,
    updatedAt,
  };
}

function buildContactRequestRow(request, requesterUserId) {
  const normalizedRequest = normalizeManagedContactRequest(request, {
    requesterUserId,
    source: "supabase-contact-request",
    storageSource: "supabase",
    updatedAt: new Date().toISOString(),
  });
  const athleteIsJunior = Boolean(normalizedRequest.athleteIsJunior);
  const contactRoute = normalizeContactRouteForDatabase(
    normalizedRequest.contactRoute,
    athleteIsJunior,
  );
  const requestStatus = normalizeRequestStatusForDatabase(
    normalizedRequest.status,
    athleteIsJunior,
    normalizedRequest.contactRoute,
  );
  const requestType = normalizeRequestTypeForDatabase(normalizedRequest.requestTypeRaw || normalizedRequest.requestType);
  const safetyStatus = normalizeSafetyStatusForDatabase(normalizedRequest.safetyStatus);

  return {
    id: normalizedRequest.id,
    requester_user_id: requesterUserId,
    athlete_owner_user_id: isUuidLike(normalizedRequest.athleteOwnerUserId)
      ? normalizedRequest.athleteOwnerUserId
      : null,
    athlete_profile_id: isUuidLike(normalizedRequest.athleteProfileId)
      ? normalizedRequest.athleteProfileId
      : null,
    opportunity_id: isUuidLike(normalizedRequest.opportunityId)
      ? normalizedRequest.opportunityId
      : null,
    requester_name: toNullableString(normalizedRequest.requesterName),
    requester_email: toNullableString(normalizedRequest.requesterEmail),
    requester_role: toNullableString(normalizedRequest.requesterRole),
    requester_organisation: toNullableString(normalizedRequest.requesterOrganisation),
    athlete_display_name: toNullableString(normalizedRequest.athleteDisplayName),
    athlete_is_junior: athleteIsJunior,
    contact_route: contactRoute,
    request_type: requestType,
    request_status: requestStatus,
    safety_status: safetyStatus,
    parent_guardian_required: Boolean(normalizedRequest.parentGuardianRequired || contactRoute === "parent_guardian_required"),
    admin_review_required:
      typeof normalizedRequest.adminReviewRequired === "boolean"
        ? normalizedRequest.adminReviewRequired
        : true,
    no_direct_messaging: true,
    request_reason: toNullableString(normalizedRequest.requestReason),
    request_context: {
      ...normalizedRequest,
      id: normalizedRequest.id,
      requesterUserId,
      source: "supabase-contact-request",
      storageSource: "supabase",
      contactRoute: mapContactRouteToRequest(contactRoute, athleteIsJunior),
      to: getRouteOwner(contactRoute, athleteIsJunior),
      status: mapRequestStatusToRequest(requestStatus, athleteIsJunior, contactRoute),
      requestType: mapRequestTypeToRequest(requestType),
      requestTypeRaw: requestType,
      safetyStatus: mapSafetyStatusToRequest(safetyStatus),
      noDirectMessaging: true,
    },
    updated_at: new Date().toISOString(),
  };
}

function normalizeSupabaseContactRequestRow(row) {
  const rawRequest = isObject(row?.request_context) ? cloneValue(row.request_context) : {};
  const athleteIsJunior = Boolean(
    typeof row?.athlete_is_junior === "boolean"
      ? row.athlete_is_junior
      : rawRequest.athleteIsJunior,
  );
  const contactRoute = mapContactRouteToRequest(
    row?.contact_route || rawRequest.contactRoute,
    athleteIsJunior,
  );
  const requestTypeRaw = String(row?.request_type || rawRequest.requestTypeRaw || "").trim();
  const requestType = mapRequestTypeToRequest(
    row?.request_type || rawRequest.requestType || "general_contact_request",
  );

  return {
    ...rawRequest,
    id: String(row?.id || rawRequest.id || createContactRequestUuid()),
    requesterUserId: row?.requester_user_id || rawRequest.requesterUserId || null,
    athleteOwnerUserId: row?.athlete_owner_user_id || rawRequest.athleteOwnerUserId || null,
    athleteId: String(
      row?.athlete_profile_id ||
        rawRequest.athleteProfileId ||
        rawRequest.athleteId ||
        "",
    ).trim(),
    athleteProfileId: String(
      row?.athlete_profile_id || rawRequest.athleteProfileId || rawRequest.athleteId || "",
    ).trim(),
    opportunityId: String(
      row?.opportunity_id || rawRequest.opportunityId || "",
    ).trim(),
    requesterName: String(row?.requester_name || rawRequest.requesterName || "").trim(),
    requesterEmail: String(row?.requester_email || rawRequest.requesterEmail || "").trim(),
    requesterRole: String(row?.requester_role || rawRequest.requesterRole || "").trim(),
    requesterOrganisation: String(
      row?.requester_organisation || rawRequest.requesterOrganisation || rawRequest.organisation || "",
    ).trim(),
    athleteDisplayName: String(
      row?.athlete_display_name || rawRequest.athleteDisplayName || "",
    ).trim(),
    athleteIsJunior,
    contactRoute,
    to: rawRequest.to || getRouteOwner(row?.contact_route || contactRoute, athleteIsJunior),
    requestType,
    requestTypeRaw: requestTypeRaw || requestType,
    status: mapRequestStatusToRequest(
      row?.request_status || rawRequest.status,
      athleteIsJunior,
      contactRoute,
    ),
    safetyStatus: mapSafetyStatusToRequest(
      row?.safety_status || rawRequest.safetyStatus,
    ),
    parentGuardianRequired:
      typeof row?.parent_guardian_required === "boolean"
        ? row.parent_guardian_required
        : Boolean(rawRequest.parentGuardianRequired),
    adminReviewRequired:
      typeof row?.admin_review_required === "boolean"
        ? row.admin_review_required
        : rawRequest.adminReviewRequired !== false,
    noDirectMessaging:
      typeof row?.no_direct_messaging === "boolean"
        ? row.no_direct_messaging
        : rawRequest.noDirectMessaging !== false,
    requestReason: String(row?.request_reason || rawRequest.requestReason || "").trim(),
    opportunityTitle: String(rawRequest.opportunityTitle || "").trim(),
    organisation: String(
      rawRequest.organisation || row?.requester_organisation || "",
    ).trim(),
    count: Number.isFinite(Number(rawRequest.count)) ? Number(rawRequest.count) : 1,
    createdByRole: String(rawRequest.createdByRole || "club_scout").trim(),
    createdByLabel: String(
      rawRequest.createdByLabel || row?.requester_role || rawRequest.requesterRole || "Demo role",
    ).trim(),
    history: Array.isArray(rawRequest.history) && rawRequest.history.length > 0
      ? rawRequest.history
      : [
          {
            id: `request-event-${Date.now()}`,
            actorRole: rawRequest.createdByRole || "club_scout",
            actorLabel:
              rawRequest.createdByLabel || row?.requester_role || rawRequest.requesterRole || "Demo role",
            createdAt: row?.created_at || rawRequest.createdAt || new Date().toISOString(),
          },
        ],
    source: "supabase-contact-request",
    storageSource: "supabase",
    requestContext: cloneValue(rawRequest),
    createdAt: row?.created_at || rawRequest.createdAt || new Date().toISOString(),
    updatedAt:
      row?.updated_at || rawRequest.updatedAt || row?.created_at || new Date().toISOString(),
  };
}

function getContactRequestsMissingMessage() {
  return "Supabase auth is connected, but contact_requests table/policies still need contact_requests_phase_1.sql.";
}

function isMissingContactRequestsTableError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "42P01" ||
    code === "42501" ||
    message.includes(CONTACT_REQUESTS_TABLE) ||
    message.includes("permission denied") ||
    message.includes("relation")
  );
}

async function detectContactRequestsTable(force = false) {
  if (!force && contactRequestsTableCache.checked) {
    return contactRequestsTableCache;
  }

  if (!isContactRequestBackendEnabled() || !supabase) {
    contactRequestsTableCache = {
      checked: true,
      detected: null,
      message: "Contact requests are saved on this device only.",
    };
    return contactRequestsTableCache;
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    contactRequestsTableCache = {
      checked: true,
      detected: null,
      message: "Backend is connected. Sign in to save contact requests to your Supabase account.",
    };
    return contactRequestsTableCache;
  }

  try {
    const { error } = await supabase
      .from(CONTACT_REQUESTS_TABLE)
      .select("id")
      .eq("requester_user_id", user.id)
      .limit(1);

    contactRequestsTableCache = error
      ? {
          checked: true,
          detected: false,
          message: isMissingContactRequestsTableError(error)
            ? getContactRequestsMissingMessage()
            : "Supabase contact requests are unavailable right now, so the app will keep using this device for request storage.",
        }
      : {
          checked: true,
          detected: true,
          message: "",
        };

    return contactRequestsTableCache;
  } catch (error) {
    contactRequestsTableCache = {
      checked: true,
      detected: false,
      message: isMissingContactRequestsTableError(error)
        ? getContactRequestsMissingMessage()
        : "Supabase contact requests are unavailable right now, so the app will keep using this device for request storage.",
    };
    return contactRequestsTableCache;
  }
}

async function readSupabaseContactRequests(user) {
  if (!supabase || !user?.id) {
    return { contactRequests: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from(CONTACT_REQUESTS_TABLE)
      .select("*")
      .or(`requester_user_id.eq.${user.id},athlete_owner_user_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      return { contactRequests: [], error };
    }

    return {
      contactRequests: Array.isArray(data) ? data.map(normalizeSupabaseContactRequestRow) : [],
      error: null,
    };
  } catch (error) {
    return { contactRequests: [], error };
  }
}

async function loadContactRequestRecords() {
  const localRequests = readLocalContactRequests();

  if (!isContactRequestBackendEnabled() || !supabase) {
    return {
      contactRequests: localRequests,
      status: buildContactRequestStatus({
        mode: "local",
        source: "localStorage",
        tableDetected: null,
        message: "Contact requests are saved on this device only.",
        requestCount: localRequests.length,
        localRequestCount: localRequests.length,
        supabaseRequestCount: 0,
      }),
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    return {
      contactRequests: localRequests,
      status: buildContactRequestStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: null,
        message:
          "Backend is connected. Sign in to save contact requests to your Supabase account. Existing local request records remain on this device only.",
        requestCount: localRequests.length,
        localRequestCount: localRequests.length,
        supabaseRequestCount: 0,
      }),
    };
  }

  const tableStatus = await detectContactRequestsTable(true);
  if (tableStatus.detected !== true) {
    return {
      contactRequests: localRequests,
      status: buildContactRequestStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: tableStatus.detected,
        message: tableStatus.message || getContactRequestsMissingMessage(),
        requestCount: localRequests.length,
        localRequestCount: localRequests.length,
        supabaseRequestCount: 0,
      }),
    };
  }

  const supabaseResult = await readSupabaseContactRequests(user);
  if (supabaseResult.error) {
    return {
      contactRequests: localRequests,
      status: buildContactRequestStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: true,
        message:
          "Supabase contact request reads are unavailable right now, so existing local request records remain active on this device.",
        requestCount: localRequests.length,
        localRequestCount: localRequests.length,
        supabaseRequestCount: 0,
      }),
    };
  }

  const supabaseRequests = supabaseResult.contactRequests;
  const mergedRequests = mergeContactRequestCollections(supabaseRequests, localRequests);
  const currentSource = supabaseRequests.length > 0 ? "supabase" : "localStorage";
  const message =
    supabaseRequests.length > 0
      ? "Contact request records are saved to your Supabase account. They remain structured request records only, with no messaging."
      : localRequests.length > 0
        ? "Supabase contact requests are ready. Existing local request records still render from this device until you create or resave them through your account."
        : "Contact request records will save to your Supabase account after you create your first request.";

  return {
    contactRequests: mergedRequests,
    status: buildContactRequestStatus({
      mode: "supabase_active",
      source: currentSource,
      tableDetected: true,
      message,
      requestCount: mergedRequests.length,
      localRequestCount: localRequests.length,
      supabaseRequestCount: supabaseRequests.length,
    }),
  };
}

export function isContactRequestBackendEnabled() {
  return Boolean(isRealAuthEnabled() && supabase);
}

export async function getContactRequestBackendStatus() {
  const result = await loadContactRequestRecords();
  return result.status;
}

export async function getContactRequests() {
  const result = await loadContactRequestRecords();
  return {
    success: true,
    contactRequests: result.contactRequests,
    ...result.status,
  };
}

export async function getContactRequestsByAthleteId(athleteProfileId) {
  const result = await loadContactRequestRecords();
  const contactRequests = result.contactRequests.filter(
    (item) => item.athleteId === athleteProfileId || item.athleteProfileId === athleteProfileId,
  );

  return {
    success: true,
    contactRequests,
    ...result.status,
  };
}

export async function getContactRequestsByOpportunityId(opportunityId) {
  const result = await loadContactRequestRecords();
  const contactRequests = result.contactRequests.filter(
    (item) => item.opportunityId === opportunityId,
  );

  return {
    success: true,
    contactRequests,
    ...result.status,
  };
}

export async function saveContactRequest(request) {
  const localRequest = normalizeManagedContactRequest(request, {
    source: "local-contact-request",
    storageSource: "localStorage",
    updatedAt: new Date().toISOString(),
  });

  if (!isContactRequestBackendEnabled() || !supabase) {
    const current = readLocalContactRequests();
    writeLocalContactRequests([
      localRequest,
      ...current.filter((item) => item.id !== localRequest.id),
    ]);
    return {
      success: true,
      contactRequest: localRequest,
      source: "localStorage",
      fallback: false,
      requestContextExists: Object.keys(localRequest || {}).length > 0,
      requesterUserIdExists: Boolean(localRequest?.requesterUserId),
      athleteOwnerUserIdExists: Boolean(localRequest?.athleteOwnerUserId),
      ...(await getContactRequests()),
      message: "Contact request saved on this device only.",
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    const current = readLocalContactRequests();
    writeLocalContactRequests([
      localRequest,
      ...current.filter((item) => item.id !== localRequest.id),
    ]);
    return {
      success: true,
      contactRequest: localRequest,
      source: "localStorage",
      fallback: true,
      requestContextExists: Object.keys(localRequest || {}).length > 0,
      requesterUserIdExists: Boolean(localRequest?.requesterUserId),
      athleteOwnerUserIdExists: Boolean(localRequest?.athleteOwnerUserId),
      ...(await getContactRequests()),
      message: "No Supabase session detected, so the contact request was saved on this device only.",
    };
  }

  const tableStatus = await detectContactRequestsTable(true);
  if (tableStatus.detected !== true) {
    const current = readLocalContactRequests();
    writeLocalContactRequests([
      localRequest,
      ...current.filter((item) => item.id !== localRequest.id),
    ]);
    return {
      success: true,
      contactRequest: localRequest,
      source: "localStorage",
      fallback: true,
      requestContextExists: Object.keys(localRequest || {}).length > 0,
      requesterUserIdExists: Boolean(localRequest?.requesterUserId),
      athleteOwnerUserIdExists: Boolean(localRequest?.athleteOwnerUserId),
      ...(await getContactRequests()),
      message: `${tableStatus.message || getContactRequestsMissingMessage()} Saved on this device only for now.`,
    };
  }

  try {
    const payload = buildContactRequestRow(request, user.id);
    const { data, error } = await supabase
      .from(CONTACT_REQUESTS_TABLE)
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      const current = readLocalContactRequests();
      writeLocalContactRequests([
        localRequest,
        ...current.filter((item) => item.id !== localRequest.id),
      ]);
      return {
        success: true,
        contactRequest: localRequest,
        source: "localStorage",
        fallback: true,
        requestContextExists: Object.keys(localRequest || {}).length > 0,
        requesterUserIdExists: Boolean(localRequest?.requesterUserId),
        athleteOwnerUserIdExists: Boolean(localRequest?.athleteOwnerUserId),
        ...(await getContactRequests()),
        message:
          "Supabase contact request save did not complete, so the request was saved on this device only for now.",
      };
    }

    const savedContactRequest = normalizeSupabaseContactRequestRow(data);
    return {
      success: true,
      contactRequest: savedContactRequest,
      source: "supabase",
      fallback: false,
      requestContextExists:
        Boolean(data?.request_context) && Object.keys(data.request_context).length > 0,
      requesterUserIdExists: Boolean(data?.requester_user_id),
      athleteOwnerUserIdExists: Boolean(data?.athlete_owner_user_id),
      ...(await getContactRequests()),
      message: "Contact request saved for review.",
    };
  } catch {
    const current = readLocalContactRequests();
    writeLocalContactRequests([
      localRequest,
      ...current.filter((item) => item.id !== localRequest.id),
    ]);
    return {
      success: true,
      contactRequest: localRequest,
      source: "localStorage",
      fallback: true,
      requestContextExists: Object.keys(localRequest || {}).length > 0,
      requesterUserIdExists: Boolean(localRequest?.requesterUserId),
      athleteOwnerUserIdExists: Boolean(localRequest?.athleteOwnerUserId),
      ...(await getContactRequests()),
      message:
        "Supabase contact request save did not complete, so the request was saved on this device only for now.",
    };
  }
}

export async function updateContactRequest(requestId, updates) {
  const current = await getContactRequests();
  const existingRequest =
    current.contactRequests.find((item) => item.id === requestId) || null;

  if (!existingRequest) {
    return {
      success: false,
      contactRequest: null,
      message: "Contact request not found.",
      ...current,
    };
  }

  return saveContactRequest({
    ...existingRequest,
    ...cloneValue(isObject(updates) ? updates : {}),
    id: existingRequest.id,
  });
}

export async function deleteContactRequest(requestId) {
  const localRequests = readLocalContactRequests();

  if (!isContactRequestBackendEnabled() || !supabase) {
    writeLocalContactRequests(localRequests.filter((item) => item.id !== requestId));
    return {
      success: true,
      deletedContactRequestId: requestId,
      source: "localStorage",
      ...(await getContactRequests()),
      message: "Contact request removed from this device.",
    };
  }

  const user = await getCurrentUser();
  const tableStatus = await detectContactRequestsTable(true);

  if (!user?.id || tableStatus.detected !== true) {
    writeLocalContactRequests(localRequests.filter((item) => item.id !== requestId));
    return {
      success: true,
      deletedContactRequestId: requestId,
      source: "localStorage",
      ...(await getContactRequests()),
      message: "Contact request removed from this device.",
    };
  }

  try {
    const { error } = await supabase
      .from(CONTACT_REQUESTS_TABLE)
      .delete()
      .eq("id", requestId)
      .eq("requester_user_id", user.id)
      .in("request_status", ["pending_review", "pending_parent_guardian"]);

    if (error) {
      return {
        success: false,
        deletedContactRequestId: null,
        source: "supabase",
        ...(await getContactRequests()),
        message: "Supabase contact request delete could not be completed.",
      };
    }

    if (localRequests.some((item) => item.id === requestId)) {
      writeLocalContactRequests(localRequests.filter((item) => item.id !== requestId));
    }

    return {
      success: true,
      deletedContactRequestId: requestId,
      source: "supabase",
      ...(await getContactRequests()),
      message: "Contact request removed from your Supabase account.",
    };
  } catch {
    return {
      success: false,
      deletedContactRequestId: null,
      source: "supabase",
      ...(await getContactRequests()),
      message: "Supabase contact request delete could not be completed.",
    };
  }
}
