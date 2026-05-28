import { getCurrentUser, isRealAuthEnabled } from "./authService";
import { readLocalData, removeLocalData, writeLocalData } from "./localDataService";
import { supabase } from "./supabaseClient";

const PROFILE_STORAGE_KEY = "msr_profiles_v1";
const ATHLETE_PROFILES_TABLE = "athlete_profiles";
const PROFILE_MIGRATION_STATUS = "Profiles only";
const LOCAL_PROFILE_SOURCES = new Set(["local-draft", "local-fallback"]);
const PROFILE_STATUS_LABELS = {
  draft: "Draft",
  pending_parent_approval: "Pending Parent Approval",
  pending_verification: "Pending Verification",
  approved: "Showcase Approved",
  rejected: "Rejected",
};
const VISIBILITY_STATUS_LABELS = {
  private: "Private",
  club_verified: "Club Verified",
  scout_visible: "Scout Visible",
  showcase_approved: "Showcase Approved",
};

let athleteProfilesTableCache = {
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

function toNullableString(value) {
  const trimmed = String(value || "").trim();
  return trimmed ? trimmed : null;
}

function toTitleCase(value) {
  return String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function clampCompletenessScore(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim(),
  );
}

function createProfileUuid() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `profile-${Date.now()}`;
}

function normalizeContactRoute(profile = {}) {
  return profile.isJunior ? "parent_guardian" : "athlete";
}

function normalizeProfileStatusForDatabase(status) {
  const normalized = normalizeText(status);

  if (
    normalized === "pending parent approval" ||
    normalized === "private awaiting parent approval"
  ) {
    return "pending_parent_approval";
  }

  if (
    normalized === "pending verification" ||
    normalized === "profile approved by parent" ||
    normalized === "admin reviewed"
  ) {
    return "pending_verification";
  }

  if (normalized === "showcase approved" || normalized === "approved") {
    return "approved";
  }

  if (normalized === "rejected") {
    return "rejected";
  }

  return "draft";
}

function normalizeVisibilityForDatabase(status) {
  const normalized = normalizeText(status);

  if (normalized === "club verified") {
    return "club_verified";
  }

  if (normalized === "scout visible") {
    return "scout_visible";
  }

  if (normalized === "showcase approved") {
    return "showcase_approved";
  }

  return "private";
}

function mapDatabaseStatusToProfile(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return PROFILE_STATUS_LABELS[normalized] || toTitleCase(normalized) || "Draft";
}

function mapDatabaseVisibilityToProfile(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return VISIBILITY_STATUS_LABELS[normalized] || toTitleCase(normalized) || "Private";
}

function isManagedLocalProfile(profile) {
  if (!isObject(profile)) {
    return false;
  }

  const source = String(profile.source || "").trim();
  const storageSource = String(profile.storageSource || "").trim();

  return LOCAL_PROFILE_SOURCES.has(source) || storageSource === "localStorage";
}

function readManagedLocalProfiles() {
  const profiles = readLocalData(PROFILE_STORAGE_KEY, []);

  if (!Array.isArray(profiles)) {
    return [];
  }

  return cloneValue(profiles.filter(isManagedLocalProfile));
}

function mergeProfileCollections(primary = [], secondary = []) {
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

function writeManagedLocalProfiles(nextProfiles) {
  const existingProfiles = readLocalData(PROFILE_STORAGE_KEY, []);
  const safeExisting = Array.isArray(existingProfiles) ? existingProfiles : [];
  const managedIds = new Set(
    (Array.isArray(nextProfiles) ? nextProfiles : [])
      .filter((item) => isObject(item) && item.id)
      .map((item) => item.id),
  );
  const preservedProfiles = safeExisting.filter(
    (item) => !isManagedLocalProfile(item) || !managedIds.has(item.id),
  );

  writeLocalData(PROFILE_STORAGE_KEY, [
    ...cloneValue(Array.isArray(nextProfiles) ? nextProfiles : []),
    ...cloneValue(preservedProfiles),
  ]);
}

function persistManagedLocalProfile(profile) {
  const current = readManagedLocalProfiles();
  const next = [profile, ...current.filter((item) => item.id !== profile.id)];
  writeManagedLocalProfiles(next);
  return next;
}

function removeManagedLocalProfile(profileId) {
  const current = readManagedLocalProfiles();
  const next = current.filter((item) => item.id !== profileId);

  if (next.length === 0) {
    const existingProfiles = readLocalData(PROFILE_STORAGE_KEY, []);
    const safeExisting = Array.isArray(existingProfiles) ? existingProfiles : [];
    const preservedProfiles = safeExisting.filter(
      (item) => !isManagedLocalProfile(item) || item.id !== profileId,
    );

    if (preservedProfiles.length > 0) {
      writeLocalData(PROFILE_STORAGE_KEY, preservedProfiles);
    } else {
      removeLocalData(PROFILE_STORAGE_KEY);
    }

    return next;
  }

  writeManagedLocalProfiles(next);
  return next;
}

function buildProfileStatus({
  mode = "local",
  source = "localStorage",
  tableDetected = null,
  message = "Athlete profiles are saved on this device only.",
  profileCount = 0,
  localProfileCount = 0,
  supabaseProfileCount = 0,
}) {
  const modeLabel =
    mode === "supabase_active"
      ? "Supabase Profiles Active"
      : mode === "supabase_fallback"
        ? "Supabase Profiles Fallback"
        : "Local Demo";

  return {
    mode,
    modeLabel,
    source,
    sourceLabel: source === "supabase" ? "Supabase" : "localStorage",
    tableDetected,
    tableDetectedLabel:
      tableDetected === true ? "yes" : tableDetected === false ? "no" : "unknown",
    backendEnabled: isProfileBackendEnabled(),
    message,
    sportsDataMigrationStatus: PROFILE_MIGRATION_STATUS,
    profileCount,
    localProfileCount,
    supabaseProfileCount,
  };
}

function normalizeManagedProfile(profile, options = {}) {
  const isJunior = Boolean(profile?.isJunior);
  const nextId = isUuidLike(profile?.id) ? String(profile.id) : createProfileUuid();

  return {
    ...cloneValue(isObject(profile) ? profile : {}),
    id: nextId,
    isJunior,
    contactRoute: isJunior ? "parent_guardian" : "athlete",
    ownerUserId: options.ownerUserId || profile?.ownerUserId || null,
    source: options.source || profile?.source || "local-draft",
    storageSource: options.storageSource || profile?.storageSource || "localStorage",
    createdAt: profile?.createdAt || new Date().toISOString(),
    updatedAt: options.updatedAt || new Date().toISOString(),
    completenessScore: clampCompletenessScore(
      options.completenessScore ?? profile?.completenessScore,
    ),
  };
}

function buildAthleteProfileRow(profile, ownerUserId) {
  const normalizedProfile = normalizeManagedProfile(profile, {
    ownerUserId,
    source: "supabase-profile",
    storageSource: "supabase",
    updatedAt: new Date().toISOString(),
  });

  return {
    id: normalizedProfile.id,
    owner_user_id: ownerUserId,
    display_name: String(
      normalizedProfile.displayName || normalizedProfile.name || "Untitled Athlete",
    ).trim(),
    is_junior: Boolean(normalizedProfile.isJunior),
    age_group: toNullableString(normalizedProfile.ageGroup),
    sport_category: toNullableString(normalizedProfile.sportCategory),
    sport: toNullableString(normalizedProfile.sport),
    sport_id: toNullableString(normalizedProfile.sportId),
    position_role: toNullableString(
      normalizedProfile.position || normalizedProfile.positionRole,
    ),
    secondary_position_role: toNullableString(
      normalizedProfile.secondaryPosition || normalizedProfile.secondaryPositionRole,
    ),
    state: toNullableString(normalizedProfile.state),
    region: toNullableString(normalizedProfile.region),
    team_club: toNullableString(normalizedProfile.club || normalizedProfile.teamClub),
    team_club_status: normalizedProfile.isVerifiedClubEntry
      ? "directory_verified"
      : "custom_unverified",
    competition_level: toNullableString(normalizedProfile.competitionLevel),
    profile_status: normalizeProfileStatusForDatabase(normalizedProfile.profileStatus),
    visibility_status: normalizeVisibilityForDatabase(normalizedProfile.visibilityStatus),
    contact_route: normalizeContactRoute(normalizedProfile),
    completeness_score: clampCompletenessScore(normalizedProfile.completenessScore),
    profile_data: {
      ...normalizedProfile,
      id: normalizedProfile.id,
      ownerUserId,
      source: "supabase-profile",
      storageSource: "supabase",
      contactRoute: normalizeContactRoute(normalizedProfile),
      completenessScore: clampCompletenessScore(normalizedProfile.completenessScore),
    },
    updated_at: new Date().toISOString(),
  };
}

function normalizeSupabaseProfileRow(row) {
  const rawProfile = isObject(row?.profile_data) ? cloneValue(row.profile_data) : {};
  const isJunior = typeof row?.is_junior === "boolean" ? row.is_junior : Boolean(rawProfile.isJunior);

  return {
    ...rawProfile,
    id: String(row?.id || rawProfile.id || createProfileUuid()),
    ownerUserId: row?.owner_user_id || rawProfile.ownerUserId || null,
    displayName: String(
      row?.display_name || rawProfile.displayName || rawProfile.name || "Untitled Athlete",
    ).trim(),
    isJunior,
    ageGroup: String(row?.age_group || rawProfile.ageGroup || "").trim(),
    sportCategory: String(row?.sport_category || rawProfile.sportCategory || "").trim(),
    sport: String(row?.sport || rawProfile.sport || "").trim(),
    sportId: String(row?.sport_id || rawProfile.sportId || "").trim(),
    position: String(
      row?.position_role || rawProfile.position || rawProfile.positionRole || "",
    ).trim(),
    secondaryPosition: String(
      row?.secondary_position_role ||
        rawProfile.secondaryPosition ||
        rawProfile.secondaryPositionRole ||
        "",
    ).trim(),
    state: String(row?.state || rawProfile.state || "").trim(),
    region: String(row?.region || rawProfile.region || "").trim(),
    club: String(row?.team_club || rawProfile.club || rawProfile.teamClub || "").trim(),
    competitionLevel: String(
      row?.competition_level || rawProfile.competitionLevel || "",
    ).trim(),
    profileStatus: mapDatabaseStatusToProfile(row?.profile_status || rawProfile.profileStatus),
    visibilityStatus: mapDatabaseVisibilityToProfile(
      row?.visibility_status || rawProfile.visibilityStatus,
    ),
    contactRoute: isJunior
      ? "parent_guardian"
      : String(row?.contact_route || rawProfile.contactRoute || "athlete"),
    completenessScore: clampCompletenessScore(
      row?.completeness_score ?? rawProfile.completenessScore,
    ),
    source: "supabase-profile",
    storageSource: "supabase",
    createdAt: row?.created_at || rawProfile.createdAt || new Date().toISOString(),
    updatedAt: row?.updated_at || rawProfile.updatedAt || row?.created_at || new Date().toISOString(),
  };
}

function getAthleteProfilesMissingMessage() {
  return "Supabase auth is connected, but athlete_profiles table/policies still need athlete_profiles_phase_1.sql.";
}

function isMissingAthleteProfilesTableError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "42P01" ||
    code === "42501" ||
    message.includes(ATHLETE_PROFILES_TABLE) ||
    message.includes("relation") ||
    message.includes("permission denied")
  );
}

async function detectAthleteProfilesTable(force = false) {
  if (!force && athleteProfilesTableCache.checked) {
    return athleteProfilesTableCache;
  }

  if (!isProfileBackendEnabled() || !supabase) {
    athleteProfilesTableCache = {
      checked: true,
      detected: null,
      message: "Athlete profiles are saved on this device only.",
    };
    return athleteProfilesTableCache;
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    athleteProfilesTableCache = {
      checked: true,
      detected: null,
      message: "Backend is connected. Sign in to save athlete profiles to your Supabase account.",
    };
    return athleteProfilesTableCache;
  }

  try {
    const { error } = await supabase
      .from(ATHLETE_PROFILES_TABLE)
      .select("id")
      .eq("owner_user_id", user.id)
      .limit(1);

    athleteProfilesTableCache = error
      ? {
          checked: true,
          detected: false,
          message: isMissingAthleteProfilesTableError(error)
            ? getAthleteProfilesMissingMessage()
            : "Supabase athlete profiles are unavailable right now, so the app will keep using this device for profile storage.",
        }
      : {
          checked: true,
          detected: true,
          message: "",
        };

    return athleteProfilesTableCache;
  } catch (error) {
    athleteProfilesTableCache = {
      checked: true,
      detected: false,
      message: isMissingAthleteProfilesTableError(error)
        ? getAthleteProfilesMissingMessage()
        : "Supabase athlete profiles are unavailable right now, so the app will keep using this device for profile storage.",
    };
    return athleteProfilesTableCache;
  }
}

async function readSupabaseProfiles(user) {
  if (!supabase || !user?.id) {
    return { profiles: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from(ATHLETE_PROFILES_TABLE)
      .select("*")
      .eq("owner_user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return { profiles: [], error };
    }

    return {
      profiles: Array.isArray(data) ? data.map(normalizeSupabaseProfileRow) : [],
      error: null,
    };
  } catch (error) {
    return { profiles: [], error };
  }
}

async function loadProfileRecords() {
  const localProfiles = readManagedLocalProfiles();

  if (!isProfileBackendEnabled() || !supabase) {
    return {
      profiles: localProfiles,
      status: buildProfileStatus({
        mode: "local",
        source: "localStorage",
        tableDetected: null,
        message: "Athlete profiles are saved on this device only.",
        profileCount: localProfiles.length,
        localProfileCount: localProfiles.length,
        supabaseProfileCount: 0,
      }),
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    return {
      profiles: localProfiles,
      status: buildProfileStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: null,
        message:
          "Backend is connected. Sign in to save athlete profiles to your Supabase account. Existing local athlete profiles remain on this device only.",
        profileCount: localProfiles.length,
        localProfileCount: localProfiles.length,
        supabaseProfileCount: 0,
      }),
    };
  }

  const tableStatus = await detectAthleteProfilesTable(true);
  if (tableStatus.detected !== true) {
    return {
      profiles: localProfiles,
      status: buildProfileStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: tableStatus.detected,
        message: tableStatus.message || getAthleteProfilesMissingMessage(),
        profileCount: localProfiles.length,
        localProfileCount: localProfiles.length,
        supabaseProfileCount: 0,
      }),
    };
  }

  const supabaseResult = await readSupabaseProfiles(user);
  if (supabaseResult.error) {
    return {
      profiles: localProfiles,
      status: buildProfileStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: true,
        message:
          "Supabase athlete profile reads are unavailable right now, so existing local athlete profiles remain active on this device.",
        profileCount: localProfiles.length,
        localProfileCount: localProfiles.length,
        supabaseProfileCount: 0,
      }),
    };
  }

  const supabaseProfiles = supabaseResult.profiles;
  const mergedProfiles = mergeProfileCollections(supabaseProfiles, localProfiles);
  const currentSource = supabaseProfiles.length > 0 ? "supabase" : "localStorage";
  const message =
    supabaseProfiles.length > 0
      ? "Athlete profiles are saved to your Supabase account."
      : localProfiles.length > 0
        ? "Supabase athlete profiles are ready. Existing local athlete profiles still render from this device until you resave them to your account."
        : "Athlete profiles will save to your Supabase account after you create one.";

  return {
    profiles: mergedProfiles,
    status: buildProfileStatus({
      mode: "supabase_active",
      source: currentSource,
      tableDetected: true,
      message,
      profileCount: mergedProfiles.length,
      localProfileCount: localProfiles.length,
      supabaseProfileCount: supabaseProfiles.length,
    }),
  };
}

export function isProfileBackendEnabled() {
  return Boolean(isRealAuthEnabled() && supabase);
}

export async function getProfileBackendStatus() {
  const result = await loadProfileRecords();
  return result.status;
}

export async function getProfiles() {
  const result = await loadProfileRecords();
  return {
    success: true,
    profiles: result.profiles,
    ...result.status,
  };
}

export async function getProfileById(profileId) {
  const result = await loadProfileRecords();
  const profile = result.profiles.find((item) => item.id === profileId) || null;

  return {
    success: Boolean(profile),
    profile,
    profiles: result.profiles,
    ...result.status,
  };
}

export async function saveProfile(profile) {
  const localProfile = normalizeManagedProfile(profile, {
    source: "local-draft",
    storageSource: "localStorage",
    updatedAt: new Date().toISOString(),
  });

  if (!isProfileBackendEnabled() || !supabase) {
    persistManagedLocalProfile(localProfile);
    return {
      success: true,
      profile: localProfile,
      source: "localStorage",
      fallback: false,
      profileDataExists: Object.keys(localProfile || {}).length > 0,
      ownerUserIdExists: Boolean(localProfile?.ownerUserId),
      ...(await getProfiles()),
      message: "Athlete profile saved on this device only.",
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    persistManagedLocalProfile(localProfile);
    return {
      success: true,
      profile: localProfile,
      source: "localStorage",
      fallback: true,
      profileDataExists: Object.keys(localProfile || {}).length > 0,
      ownerUserIdExists: Boolean(localProfile?.ownerUserId),
      ...(await getProfiles()),
      message:
        "No Supabase session detected, so the athlete profile was saved on this device only.",
    };
  }

  const tableStatus = await detectAthleteProfilesTable(true);
  if (tableStatus.detected !== true) {
    persistManagedLocalProfile(localProfile);
    return {
      success: true,
      profile: localProfile,
      source: "localStorage",
      fallback: true,
      profileDataExists: Object.keys(localProfile || {}).length > 0,
      ownerUserIdExists: Boolean(localProfile?.ownerUserId),
      ...(await getProfiles()),
      message: `${tableStatus.message || getAthleteProfilesMissingMessage()} Saved on this device only for now.`,
    };
  }

  try {
    const payload = buildAthleteProfileRow(profile, user.id);
    const { data, error } = await supabase
      .from(ATHLETE_PROFILES_TABLE)
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      persistManagedLocalProfile(localProfile);
      return {
        success: true,
        profile: localProfile,
        source: "localStorage",
        fallback: true,
        profileDataExists: Object.keys(localProfile || {}).length > 0,
        ownerUserIdExists: Boolean(localProfile?.ownerUserId),
        ...(await getProfiles()),
        message:
          "Supabase athlete profile save did not complete, so the profile was saved on this device only for now.",
      };
    }

    const savedProfile = normalizeSupabaseProfileRow(data);
    return {
      success: true,
      profile: savedProfile,
      source: "supabase",
      fallback: false,
      profileDataExists: Boolean(data?.profile_data) && Object.keys(data.profile_data).length > 0,
      ownerUserIdExists: Boolean(data?.owner_user_id),
      ...(await getProfiles()),
      message: "Athlete profile saved to your Supabase account.",
    };
  } catch {
    persistManagedLocalProfile(localProfile);
    return {
      success: true,
      profile: localProfile,
      source: "localStorage",
      fallback: true,
      profileDataExists: Object.keys(localProfile || {}).length > 0,
      ownerUserIdExists: Boolean(localProfile?.ownerUserId),
      ...(await getProfiles()),
      message:
        "Supabase athlete profile save did not complete, so the profile was saved on this device only for now.",
    };
  }
}

export async function updateProfile(profileId, updates) {
  const current = await getProfileById(profileId);

  if (!current.profile) {
    return {
      success: false,
      profile: null,
      message: "Athlete profile not found.",
      ...current,
    };
  }

  return saveProfile({
    ...current.profile,
    ...cloneValue(isObject(updates) ? updates : {}),
    id: current.profile.id,
  });
}

export async function deleteProfile(profileId) {
  const localProfiles = readManagedLocalProfiles();

  if (!isProfileBackendEnabled() || !supabase) {
    removeManagedLocalProfile(profileId);
    return {
      success: true,
      deletedProfileId: profileId,
      source: "localStorage",
      ...(await getProfiles()),
      message: "Athlete profile removed from this device.",
    };
  }

  const user = await getCurrentUser();
  const tableStatus = await detectAthleteProfilesTable(true);

  if (!user?.id || tableStatus.detected !== true) {
    removeManagedLocalProfile(profileId);
    return {
      success: true,
      deletedProfileId: profileId,
      source: "localStorage",
      ...(await getProfiles()),
      message: "Athlete profile removed from this device.",
    };
  }

  try {
    const { error } = await supabase
      .from(ATHLETE_PROFILES_TABLE)
      .delete()
      .eq("id", profileId)
      .eq("owner_user_id", user.id);

    if (error) {
      return {
        success: false,
        deletedProfileId: null,
        source: "supabase",
        ...(await getProfiles()),
        message: "Supabase athlete profile delete could not be completed.",
      };
    }

    if (localProfiles.some((item) => item.id === profileId)) {
      removeManagedLocalProfile(profileId);
    }

    return {
      success: true,
      deletedProfileId: profileId,
      source: "supabase",
      ...(await getProfiles()),
      message: "Athlete profile removed from your Supabase account.",
    };
  } catch {
    return {
      success: false,
      deletedProfileId: null,
      source: "supabase",
      ...(await getProfiles()),
      message: "Supabase athlete profile delete could not be completed.",
    };
  }
}
