import { opportunitySeed } from "../data/opportunitySeed";
import { getCurrentUser, isRealAuthEnabled } from "./authService";
import { readLocalData, writeLocalData } from "./localDataService";
import { supabase } from "./supabaseClient";

const OPPORTUNITY_STORAGE_KEY = "msr_opportunities_v1";
const OPPORTUNITIES_TABLE = "opportunities";
const OPPORTUNITY_MIGRATION_STATUS =
  "Profiles + Highlights metadata + Opportunities metadata only";
const OPPORTUNITY_VERIFICATION_LABELS = {
  pending_admin_verification: "Pending Admin Verification",
  verified_organisation: "Verified Organisation",
  rejected: "Rejected",
  archived: "Archived",
};
const OPPORTUNITY_STATUS_LABELS = {
  draft: "Draft",
  pending_review: "Pending Review",
  active: "Active",
  closed: "Closed",
  archived: "Archived",
  rejected: "Rejected",
};
const OPPORTUNITY_VISIBILITY_LABELS = {
  private: "Private",
  verified_only: "Verified Only",
  member_visible: "Member Visible",
  public_preview: "Public Preview",
};

let opportunitiesTableCache = {
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

function createOpportunityUuid() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `opportunity-${Date.now()}`;
}

function normalizeVerificationStatusForDatabase(status) {
  const normalized = normalizeText(status);

  if (normalized === "verified organisation") {
    return "verified_organisation";
  }

  if (normalized === "rejected") {
    return "rejected";
  }

  if (normalized === "archived") {
    return "archived";
  }

  return "pending_admin_verification";
}

function normalizeOpportunityStatusForDatabase(status) {
  const normalized = normalizeText(status);

  if (normalized === "pending review") {
    return "pending_review";
  }
  if (normalized === "active") {
    return "active";
  }
  if (normalized === "closed") {
    return "closed";
  }
  if (normalized === "archived") {
    return "archived";
  }
  if (normalized === "rejected") {
    return "rejected";
  }

  return "draft";
}

function normalizeVisibilityStatusForDatabase(status) {
  const normalized = normalizeText(status);

  if (normalized === "verified only") {
    return "verified_only";
  }
  if (normalized === "member visible") {
    return "member_visible";
  }
  if (normalized === "public preview") {
    return "public_preview";
  }

  return "private";
}

function normalizeContactRouteForDatabase(route, isJuniorOpportunity = false) {
  const normalized = normalizeText(route);

  if (isJuniorOpportunity || normalized.includes("parent") || normalized.includes("guardian")) {
    return "parent_guardian_required";
  }

  if (normalized.includes("athlete") && normalized.includes("allow")) {
    return "athlete_allowed";
  }

  if (normalized.includes("routes to the athlete")) {
    return "athlete_allowed";
  }

  return "contact_request_only";
}

function mapVerificationStatusToOpportunity(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return OPPORTUNITY_VERIFICATION_LABELS[normalized] || "Pending Admin Verification";
}

function mapOpportunityStatusToOpportunity(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return OPPORTUNITY_STATUS_LABELS[normalized] || "Draft";
}

function mapVisibilityStatusToOpportunity(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return OPPORTUNITY_VISIBILITY_LABELS[normalized] || "Private";
}

function mapContactRouteToOpportunity(route, isJuniorOpportunity = false) {
  const normalized = String(route || "").trim().toLowerCase();

  if (isJuniorOpportunity || normalized === "parent_guardian_required") {
    return "Under-18 interest routes to parent or guardian";
  }

  if (normalized === "athlete_allowed") {
    return "18+ interest routes to the athlete";
  }

  return "Contact requests only";
}

function readLocalOpportunities() {
  const opportunities = readLocalData(OPPORTUNITY_STORAGE_KEY, opportunitySeed);
  return Array.isArray(opportunities) ? cloneValue(opportunities) : cloneValue(opportunitySeed);
}

function writeLocalOpportunities(opportunities) {
  const nextOpportunities = Array.isArray(opportunities) ? opportunities : [];
  writeLocalData(OPPORTUNITY_STORAGE_KEY, cloneValue(nextOpportunities));
}

function mergeOpportunityCollections(primary = [], secondary = []) {
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

function buildOpportunityStatus({
  mode = "local",
  source = "localStorage",
  tableDetected = null,
  message = "Opportunities are saved on this device only.",
  opportunityCount = 0,
  localOpportunityCount = 0,
  supabaseOpportunityCount = 0,
}) {
  const modeLabel =
    mode === "supabase_active"
      ? "Supabase Opportunities Active"
      : mode === "supabase_fallback"
        ? "Supabase Opportunities Fallback"
        : "Local Demo";

  return {
    mode,
    modeLabel,
    source,
    sourceLabel: source === "supabase" ? "Supabase" : "localStorage",
    tableDetected,
    tableDetectedLabel:
      tableDetected === true ? "yes" : tableDetected === false ? "no" : "unknown",
    backendEnabled: isOpportunityBackendEnabled(),
    message,
    sportsDataMigrationStatus: OPPORTUNITY_MIGRATION_STATUS,
    opportunityCount,
    localOpportunityCount,
    supabaseOpportunityCount,
  };
}

function normalizeManagedOpportunity(opportunity, options = {}) {
  const isJuniorOpportunity = Boolean(opportunity?.isJuniorOpportunity);
  const nextId = isUuidLike(opportunity?.id) ? String(opportunity.id) : createOpportunityUuid();
  const createdAt = opportunity?.createdAt || new Date().toISOString();
  const updatedAt = options.updatedAt || opportunity?.updatedAt || new Date().toISOString();
  const verificationStatus = mapVerificationStatusToOpportunity(
    options.verificationStatus || opportunity?.verificationStatus,
  );
  const opportunityStatus = mapOpportunityStatusToOpportunity(
    options.opportunityStatus || opportunity?.opportunityStatus,
  );
  const visibilityStatus = mapVisibilityStatusToOpportunity(
    options.visibilityStatus || opportunity?.visibilityStatus,
  );

  return {
    ...cloneValue(isObject(opportunity) ? opportunity : {}),
    id: nextId,
    organisation: String(opportunity?.organisation || "Organisation not set").trim(),
    contactRoleTitle: String(opportunity?.contactRoleTitle || "").trim(),
    sportCategory: String(opportunity?.sportCategory || "").trim(),
    sport: String(opportunity?.sport || "").trim(),
    sportId: String(opportunity?.sportId || "").trim(),
    positionRole: String(opportunity?.positionRole || "Role not set").trim(),
    ageGroup: String(opportunity?.ageGroup || "").trim(),
    isJuniorOpportunity,
    juniorSenior:
      String(opportunity?.juniorSenior || "").trim() ||
      (isJuniorOpportunity ? "Junior" : "Senior"),
    state: String(opportunity?.state || "").trim(),
    region: String(opportunity?.region || "").trim(),
    competitionLevel: String(opportunity?.competitionLevel || "Local Club").trim(),
    opportunityType: String(opportunity?.opportunityType || "Club recruitment").trim(),
    title: String(opportunity?.title || "Untitled opportunity").trim(),
    description: String(opportunity?.description || "").trim(),
    requirements: String(opportunity?.requirements || "").trim(),
    closingDate: String(opportunity?.closingDate || "").trim(),
    verificationStatus,
    opportunityStatus,
    contactRoute: mapContactRouteToOpportunity(
      opportunity?.contactRoute,
      isJuniorOpportunity,
    ),
    visibilityStatus,
    ownerUserId: options.ownerUserId || opportunity?.ownerUserId || null,
    createdByRole: String(opportunity?.createdByRole || "club_scout").trim(),
    source: options.source || opportunity?.source || "local-opportunity",
    storageSource: options.storageSource || opportunity?.storageSource || "localStorage",
    createdAt,
    updatedAt,
    opportunityData: isObject(opportunity?.opportunityData)
      ? cloneValue(opportunity.opportunityData)
      : {},
  };
}

function buildOpportunityRow(opportunity, ownerUserId) {
  const normalizedOpportunity = normalizeManagedOpportunity(opportunity, {
    ownerUserId,
    source: "supabase-opportunity",
    storageSource: "supabase",
    updatedAt: new Date().toISOString(),
  });
  const isJuniorOpportunity = Boolean(normalizedOpportunity.isJuniorOpportunity);
  const verificationStatus = normalizeVerificationStatusForDatabase(
    normalizedOpportunity.verificationStatus,
  );
  const opportunityStatus = normalizeOpportunityStatusForDatabase(
    normalizedOpportunity.opportunityStatus,
  );
  const contactRoute = normalizeContactRouteForDatabase(
    normalizedOpportunity.contactRoute,
    isJuniorOpportunity,
  );
  const visibilityStatus = normalizeVisibilityStatusForDatabase(
    normalizedOpportunity.visibilityStatus,
  );

  return {
    id: normalizedOpportunity.id,
    owner_user_id: ownerUserId,
    organisation_name: String(normalizedOpportunity.organisation || "Organisation not set").trim(),
    contact_role: toNullableString(normalizedOpportunity.contactRoleTitle),
    sport_category: toNullableString(normalizedOpportunity.sportCategory),
    sport: toNullableString(normalizedOpportunity.sport),
    sport_id: toNullableString(normalizedOpportunity.sportId),
    position_role: toNullableString(normalizedOpportunity.positionRole),
    age_group: toNullableString(normalizedOpportunity.ageGroup),
    is_junior_opportunity: isJuniorOpportunity,
    junior_or_senior: isJuniorOpportunity ? "Junior" : "Senior",
    state: toNullableString(normalizedOpportunity.state),
    region: toNullableString(normalizedOpportunity.region),
    competition_level: toNullableString(normalizedOpportunity.competitionLevel),
    opportunity_type: toNullableString(normalizedOpportunity.opportunityType),
    title: String(normalizedOpportunity.title || "Untitled opportunity").trim(),
    description: toNullableString(normalizedOpportunity.description),
    requirements: toNullableString(normalizedOpportunity.requirements),
    closing_date: toNullableString(normalizedOpportunity.closingDate),
    verification_status: verificationStatus,
    opportunity_status: opportunityStatus,
    contact_route: contactRoute,
    visibility_status: visibilityStatus,
    opportunity_data: {
      ...normalizedOpportunity,
      id: normalizedOpportunity.id,
      ownerUserId,
      source: "supabase-opportunity",
      storageSource: "supabase",
      verificationStatus: mapVerificationStatusToOpportunity(verificationStatus),
      opportunityStatus: mapOpportunityStatusToOpportunity(opportunityStatus),
      contactRoute: mapContactRouteToOpportunity(contactRoute, isJuniorOpportunity),
      visibilityStatus: mapVisibilityStatusToOpportunity(visibilityStatus),
    },
    updated_at: new Date().toISOString(),
  };
}

function normalizeSupabaseOpportunityRow(row) {
  const rawOpportunity = isObject(row?.opportunity_data) ? cloneValue(row.opportunity_data) : {};
  const isJuniorOpportunity = Boolean(
    typeof row?.is_junior_opportunity === "boolean"
      ? row.is_junior_opportunity
      : rawOpportunity.isJuniorOpportunity,
  );

  return {
    ...rawOpportunity,
    id: String(row?.id || rawOpportunity.id || createOpportunityUuid()),
    ownerUserId: row?.owner_user_id || rawOpportunity.ownerUserId || null,
    organisation: String(
      row?.organisation_name || rawOpportunity.organisation || "Organisation not set",
    ).trim(),
    contactRoleTitle: String(row?.contact_role || rawOpportunity.contactRoleTitle || "").trim(),
    sportCategory: String(row?.sport_category || rawOpportunity.sportCategory || "").trim(),
    sport: String(row?.sport || rawOpportunity.sport || "").trim(),
    sportId: String(row?.sport_id || rawOpportunity.sportId || "").trim(),
    positionRole: String(
      row?.position_role || rawOpportunity.positionRole || "Role not set",
    ).trim(),
    ageGroup: String(row?.age_group || rawOpportunity.ageGroup || "").trim(),
    isJuniorOpportunity,
    juniorSenior:
      String(row?.junior_or_senior || rawOpportunity.juniorSenior || "").trim() ||
      (isJuniorOpportunity ? "Junior" : "Senior"),
    state: String(row?.state || rawOpportunity.state || "").trim(),
    region: String(row?.region || rawOpportunity.region || "").trim(),
    competitionLevel: String(
      row?.competition_level || rawOpportunity.competitionLevel || "Local Club",
    ).trim(),
    opportunityType: String(
      row?.opportunity_type || rawOpportunity.opportunityType || "Club recruitment",
    ).trim(),
    title: String(row?.title || rawOpportunity.title || "Untitled opportunity").trim(),
    description: String(row?.description || rawOpportunity.description || "").trim(),
    requirements: String(row?.requirements || rawOpportunity.requirements || "").trim(),
    closingDate: String(row?.closing_date || rawOpportunity.closingDate || "").trim(),
    verificationStatus: mapVerificationStatusToOpportunity(
      row?.verification_status || rawOpportunity.verificationStatus,
    ),
    opportunityStatus: mapOpportunityStatusToOpportunity(
      row?.opportunity_status || rawOpportunity.opportunityStatus,
    ),
    contactRoute: mapContactRouteToOpportunity(
      row?.contact_route || rawOpportunity.contactRoute,
      isJuniorOpportunity,
    ),
    visibilityStatus: mapVisibilityStatusToOpportunity(
      row?.visibility_status || rawOpportunity.visibilityStatus,
    ),
    source: "supabase-opportunity",
    storageSource: "supabase",
    createdByRole: String(rawOpportunity.createdByRole || "club_scout").trim(),
    opportunityData: cloneValue(rawOpportunity),
    createdAt: row?.created_at || rawOpportunity.createdAt || new Date().toISOString(),
    updatedAt:
      row?.updated_at || rawOpportunity.updatedAt || row?.created_at || new Date().toISOString(),
  };
}

function getOpportunitiesMissingMessage() {
  return "Supabase auth is connected, but opportunities table/policies still need opportunities_phase_1.sql.";
}

function isMissingOpportunitiesTableError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "42P01" ||
    code === "42501" ||
    message.includes(OPPORTUNITIES_TABLE) ||
    message.includes("permission denied") ||
    message.includes("relation")
  );
}

async function detectOpportunitiesTable(force = false) {
  if (!force && opportunitiesTableCache.checked) {
    return opportunitiesTableCache;
  }

  if (!isOpportunityBackendEnabled() || !supabase) {
    opportunitiesTableCache = {
      checked: true,
      detected: null,
      message: "Opportunities are saved on this device only.",
    };
    return opportunitiesTableCache;
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    opportunitiesTableCache = {
      checked: true,
      detected: null,
      message: "Backend is connected. Sign in to save opportunities to your Supabase account.",
    };
    return opportunitiesTableCache;
  }

  try {
    const { error } = await supabase
      .from(OPPORTUNITIES_TABLE)
      .select("id")
      .eq("owner_user_id", user.id)
      .limit(1);

    opportunitiesTableCache = error
      ? {
          checked: true,
          detected: false,
          message: isMissingOpportunitiesTableError(error)
            ? getOpportunitiesMissingMessage()
            : "Supabase opportunities are unavailable right now, so the app will keep using this device for opportunity storage.",
        }
      : {
          checked: true,
          detected: true,
          message: "",
        };

    return opportunitiesTableCache;
  } catch (error) {
    opportunitiesTableCache = {
      checked: true,
      detected: false,
      message: isMissingOpportunitiesTableError(error)
        ? getOpportunitiesMissingMessage()
        : "Supabase opportunities are unavailable right now, so the app will keep using this device for opportunity storage.",
    };
    return opportunitiesTableCache;
  }
}

async function readSupabaseOpportunities(user) {
  if (!supabase || !user?.id) {
    return { opportunities: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from(OPPORTUNITIES_TABLE)
      .select("*")
      .eq("owner_user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return { opportunities: [], error };
    }

    return {
      opportunities: Array.isArray(data) ? data.map(normalizeSupabaseOpportunityRow) : [],
      error: null,
    };
  } catch (error) {
    return { opportunities: [], error };
  }
}

async function loadOpportunityRecords() {
  const localOpportunities = readLocalOpportunities();

  if (!isOpportunityBackendEnabled() || !supabase) {
    return {
      opportunities: localOpportunities,
      status: buildOpportunityStatus({
        mode: "local",
        source: "localStorage",
        tableDetected: null,
        message: "Opportunities are saved on this device only.",
        opportunityCount: localOpportunities.length,
        localOpportunityCount: localOpportunities.length,
        supabaseOpportunityCount: 0,
      }),
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    return {
      opportunities: localOpportunities,
      status: buildOpportunityStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: null,
        message:
          "Backend is connected. Sign in to save opportunities to your Supabase account. Existing local/demo opportunities remain on this device only.",
        opportunityCount: localOpportunities.length,
        localOpportunityCount: localOpportunities.length,
        supabaseOpportunityCount: 0,
      }),
    };
  }

  const tableStatus = await detectOpportunitiesTable(true);
  if (tableStatus.detected !== true) {
    return {
      opportunities: localOpportunities,
      status: buildOpportunityStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: tableStatus.detected,
        message: tableStatus.message || getOpportunitiesMissingMessage(),
        opportunityCount: localOpportunities.length,
        localOpportunityCount: localOpportunities.length,
        supabaseOpportunityCount: 0,
      }),
    };
  }

  const supabaseResult = await readSupabaseOpportunities(user);
  if (supabaseResult.error) {
    return {
      opportunities: localOpportunities,
      status: buildOpportunityStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: true,
        message:
          "Supabase opportunity reads are unavailable right now, so existing local/demo opportunities remain active on this device.",
        opportunityCount: localOpportunities.length,
        localOpportunityCount: localOpportunities.length,
        supabaseOpportunityCount: 0,
      }),
    };
  }

  const supabaseOpportunities = supabaseResult.opportunities;
  const mergedOpportunities = mergeOpportunityCollections(
    supabaseOpportunities,
    localOpportunities,
  );
  const currentSource = supabaseOpportunities.length > 0 ? "supabase" : "localStorage";
  const message =
    supabaseOpportunities.length > 0
      ? "Opportunity metadata is saved to your Supabase account. Local demo opportunities can still render until broader visibility rules are migrated."
      : localOpportunities.length > 0
        ? "Supabase opportunities are ready. Existing local/demo opportunities still render from this device until you save an opportunity to your account."
        : "Opportunity metadata will save to your Supabase account after you add your first opportunity.";

  return {
    opportunities: mergedOpportunities,
    status: buildOpportunityStatus({
      mode: "supabase_active",
      source: currentSource,
      tableDetected: true,
      message,
      opportunityCount: mergedOpportunities.length,
      localOpportunityCount: localOpportunities.length,
      supabaseOpportunityCount: supabaseOpportunities.length,
    }),
  };
}

export function isOpportunityBackendEnabled() {
  return Boolean(isRealAuthEnabled() && supabase);
}

export async function getOpportunityBackendStatus() {
  const result = await loadOpportunityRecords();
  return result.status;
}

export async function getOpportunities() {
  const result = await loadOpportunityRecords();
  return {
    success: true,
    opportunities: result.opportunities,
    ...result.status,
  };
}

export async function getOpportunityById(opportunityId) {
  const result = await loadOpportunityRecords();
  const opportunity =
    result.opportunities.find((item) => item.id === opportunityId) || null;

  return {
    success: Boolean(opportunity),
    opportunity,
    ...result.status,
  };
}

export async function saveOpportunity(opportunity) {
  const localOpportunity = normalizeManagedOpportunity(opportunity, {
    source: "local-opportunity",
    storageSource: "localStorage",
    updatedAt: new Date().toISOString(),
  });

  if (!isOpportunityBackendEnabled() || !supabase) {
    const current = readLocalOpportunities();
    writeLocalOpportunities([
      localOpportunity,
      ...current.filter((item) => item.id !== localOpportunity.id),
    ]);
    return {
      success: true,
      opportunity: localOpportunity,
      source: "localStorage",
      fallback: false,
      opportunityDataExists: Object.keys(localOpportunity || {}).length > 0,
      ownerUserIdExists: Boolean(localOpportunity?.ownerUserId),
      ...(await getOpportunities()),
      message: "Opportunity saved on this device only.",
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    const current = readLocalOpportunities();
    writeLocalOpportunities([
      localOpportunity,
      ...current.filter((item) => item.id !== localOpportunity.id),
    ]);
    return {
      success: true,
      opportunity: localOpportunity,
      source: "localStorage",
      fallback: true,
      opportunityDataExists: Object.keys(localOpportunity || {}).length > 0,
      ownerUserIdExists: Boolean(localOpportunity?.ownerUserId),
      ...(await getOpportunities()),
      message: "No Supabase session detected, so the opportunity was saved on this device only.",
    };
  }

  const tableStatus = await detectOpportunitiesTable(true);
  if (tableStatus.detected !== true) {
    const current = readLocalOpportunities();
    writeLocalOpportunities([
      localOpportunity,
      ...current.filter((item) => item.id !== localOpportunity.id),
    ]);
    return {
      success: true,
      opportunity: localOpportunity,
      source: "localStorage",
      fallback: true,
      opportunityDataExists: Object.keys(localOpportunity || {}).length > 0,
      ownerUserIdExists: Boolean(localOpportunity?.ownerUserId),
      ...(await getOpportunities()),
      message: `${tableStatus.message || getOpportunitiesMissingMessage()} Saved on this device only for now.`,
    };
  }

  try {
    const payload = buildOpportunityRow(opportunity, user.id);
    const { data, error } = await supabase
      .from(OPPORTUNITIES_TABLE)
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      const current = readLocalOpportunities();
      writeLocalOpportunities([
        localOpportunity,
        ...current.filter((item) => item.id !== localOpportunity.id),
      ]);
      return {
        success: true,
        opportunity: localOpportunity,
        source: "localStorage",
        fallback: true,
        opportunityDataExists: Object.keys(localOpportunity || {}).length > 0,
        ownerUserIdExists: Boolean(localOpportunity?.ownerUserId),
        ...(await getOpportunities()),
        message:
          "Supabase opportunity save did not complete, so the opportunity was saved on this device only for now.",
      };
    }

    const savedOpportunity = normalizeSupabaseOpportunityRow(data);
    return {
      success: true,
      opportunity: savedOpportunity,
      source: "supabase",
      fallback: false,
      opportunityDataExists:
        Boolean(data?.opportunity_data) && Object.keys(data.opportunity_data).length > 0,
      ownerUserIdExists: Boolean(data?.owner_user_id),
      ...(await getOpportunities()),
      message: "Opportunity saved to your Supabase account.",
    };
  } catch {
    const current = readLocalOpportunities();
    writeLocalOpportunities([
      localOpportunity,
      ...current.filter((item) => item.id !== localOpportunity.id),
    ]);
    return {
      success: true,
      opportunity: localOpportunity,
      source: "localStorage",
      fallback: true,
      opportunityDataExists: Object.keys(localOpportunity || {}).length > 0,
      ownerUserIdExists: Boolean(localOpportunity?.ownerUserId),
      ...(await getOpportunities()),
      message:
        "Supabase opportunity save did not complete, so the opportunity was saved on this device only for now.",
    };
  }
}

export async function updateOpportunity(opportunityId, updates) {
  const current = await getOpportunities();
  const existingOpportunity =
    current.opportunities.find((item) => item.id === opportunityId) || null;

  if (!existingOpportunity) {
    return {
      success: false,
      opportunity: null,
      message: "Opportunity not found.",
      ...current,
    };
  }

  return saveOpportunity({
    ...existingOpportunity,
    ...cloneValue(isObject(updates) ? updates : {}),
    id: existingOpportunity.id,
  });
}

export async function deleteOpportunity(opportunityId) {
  const localOpportunities = readLocalOpportunities();

  if (!isOpportunityBackendEnabled() || !supabase) {
    writeLocalOpportunities(localOpportunities.filter((item) => item.id !== opportunityId));
    return {
      success: true,
      deletedOpportunityId: opportunityId,
      source: "localStorage",
      ...(await getOpportunities()),
      message: "Opportunity removed from this device.",
    };
  }

  const user = await getCurrentUser();
  const tableStatus = await detectOpportunitiesTable(true);

  if (!user?.id || tableStatus.detected !== true) {
    writeLocalOpportunities(localOpportunities.filter((item) => item.id !== opportunityId));
    return {
      success: true,
      deletedOpportunityId: opportunityId,
      source: "localStorage",
      ...(await getOpportunities()),
      message: "Opportunity removed from this device.",
    };
  }

  try {
    const { error } = await supabase
      .from(OPPORTUNITIES_TABLE)
      .delete()
      .eq("id", opportunityId)
      .eq("owner_user_id", user.id)
      .eq("opportunity_status", "draft")
      .eq("visibility_status", "private");

    if (error) {
      return {
        success: false,
        deletedOpportunityId: null,
        source: "supabase",
        ...(await getOpportunities()),
        message: "Supabase opportunity delete could not be completed.",
      };
    }

    if (localOpportunities.some((item) => item.id === opportunityId)) {
      writeLocalOpportunities(localOpportunities.filter((item) => item.id !== opportunityId));
    }

    return {
      success: true,
      deletedOpportunityId: opportunityId,
      source: "supabase",
      ...(await getOpportunities()),
      message: "Opportunity removed from your Supabase account.",
    };
  } catch {
    return {
      success: false,
      deletedOpportunityId: null,
      source: "supabase",
      ...(await getOpportunities()),
      message: "Supabase opportunity delete could not be completed.",
    };
  }
}
