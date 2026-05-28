import { isBackendEnabled } from "./dataMode";
import { readLocalData, removeLocalData, writeLocalData } from "./localDataService";
import { supabase } from "./supabaseClient";

const DEMO_ACCOUNT_STORAGE_KEY = "msr_demo_account_v1";
const SELECTED_ROLE_STORAGE_KEY = "msr_selected_role_v1";
const APP_USER_PROFILES_TABLE = "app_user_profiles";
const DEFAULT_ROLE = "junior_athlete";
const VALID_ROLES = new Set([
  "junior_athlete",
  "parent_guardian",
  "adult_athlete",
  "club_scout",
  "admin",
]);

function normalizeRole(role) {
  return VALID_ROLES.has(role) ? role : DEFAULT_ROLE;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function readStoredRole() {
  const storedRole = readLocalData(SELECTED_ROLE_STORAGE_KEY, "");
  return VALID_ROLES.has(storedRole) ? storedRole : DEFAULT_ROLE;
}

function normalizeDemoAccount(account) {
  if (!account || typeof account !== "object") {
    return null;
  }

  const createdAt = account.createdAt || new Date().toISOString();
  const updatedAt = account.updatedAt || createdAt;

  return {
    id: String(account.id || `demo-account-${normalizeRole(account.role)}`),
    fullName: String(account.fullName || account.name || "Local Demo Account").trim(),
    email: String(account.email || "").trim(),
    role: normalizeRole(account.role),
    organisationName: String(account.organisationName || "").trim(),
    state: String(account.state || "").trim(),
    region: String(account.region || "").trim(),
    accountStatus: String(account.accountStatus || "active"),
    authMode: "local_demo",
    createdAt,
    updatedAt,
  };
}

function normalizeAppUserProfile(profile, user, options = {}) {
  const metadata = user?.user_metadata || {};
  const createdAt =
    profile?.created_at || metadata.created_at || metadata.createdAt || new Date().toISOString();
  const updatedAt = profile?.updated_at || createdAt;

  return {
    id: String(profile?.id || user?.id || `account-${Date.now()}`),
    fullName: String(
      profile?.full_name ||
        metadata.full_name ||
        metadata.fullName ||
        user?.email?.split("@")[0] ||
        "My Sports Resume Account",
    ).trim(),
    email: String(profile?.email || user?.email || "").trim(),
    role: normalizeRole(profile?.role || metadata.role || readStoredRole()),
    organisationName: String(
      profile?.organisation_name ||
        metadata.organisation_name ||
        metadata.organisationName ||
        "",
    ).trim(),
    state: String(profile?.state || metadata.state || "").trim(),
    region: String(profile?.region || metadata.region || "").trim(),
    accountStatus: String(profile?.account_status || "active"),
    authMode: user ? "supabase" : "local_demo",
    profileSyncState: options.profileSyncState || "synced",
    profileSyncWarning: String(options.profileSyncWarning || "").trim(),
    createdAt,
    updatedAt,
  };
}

function getAuthMetadataFromInput(payload = {}) {
  const metadata = {};

  if (payload.fullName) {
    metadata.full_name = String(payload.fullName).trim();
  }
  if (payload.role) {
    metadata.role = normalizeRole(payload.role);
  }
  if (payload.organisationName) {
    metadata.organisation_name = String(payload.organisationName).trim();
  }
  if (payload.state) {
    metadata.state = String(payload.state).trim();
  }
  if (payload.region) {
    metadata.region = String(payload.region).trim();
  }

  return metadata;
}

function buildAppUserProfilePayload(user, overrides = {}) {
  const metadata = {
    ...(user?.user_metadata || {}),
    ...getAuthMetadataFromInput(overrides),
  };

  return {
    id: user.id,
    email: String(overrides.email || user.email || "").trim(),
    full_name: String(
      overrides.fullName || metadata.full_name || metadata.fullName || user.email || "My Sports Resume Account",
    ).trim(),
    role: normalizeRole(overrides.role || metadata.role),
    account_status: String(overrides.accountStatus || "active"),
    organisation_name: String(
      overrides.organisationName || metadata.organisation_name || metadata.organisationName || "",
    ).trim() || null,
    state: String(overrides.state || metadata.state || "").trim() || null,
    region: String(overrides.region || metadata.region || "").trim() || null,
    updated_at: new Date().toISOString(),
  };
}

function getProfileFallbackWarning(error) {
  const message = String(error?.message || "");
  const code = String(error?.code || "");

  if (!message && !code) {
    return "";
  }

  if (
    code === "42501" ||
    message.toLowerCase().includes("permission denied")
  ) {
    return "Auth works, but app_user_profiles table/policies still need the latest auth_phase_1.sql.";
  }

  if (message.includes(APP_USER_PROFILES_TABLE)) {
    return "Auth works, but app_user_profiles table/policies still need the latest auth_phase_1.sql.";
  }

  return "Supabase auth is active, but account profile sync is temporarily using auth metadata fallback.";
}

function isSupabaseEmailRateLimit(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();
  return code === "over_email_send_rate_limit" || message.includes("rate limit");
}

function getSupabaseSignUpMessage(error) {
  const message = String(error?.message || "");
  const normalized = message.toLowerCase();

  if (isSupabaseEmailRateLimit(error)) {
    return "Supabase has temporarily rate-limited signup emails. For testing, create the user manually in Supabase Authentication -> Users, confirm the user, then return here and use Login.";
  }

  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "This email is already registered in this Supabase project. Try Login first. If Login still fails, confirm the email or reset the password before trying again.";
  }

  return message || "Supabase sign up could not be completed.";
}

function getSupabaseSignInMessage(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");
  const normalized = message.toLowerCase();

  if (code === "email_not_confirmed" || normalized.includes("email not confirmed")) {
    return "Email confirmation is still required for this account. Open the Supabase confirmation email, finish confirmation, then return to Login. If you no longer have the email, reset the password or recreate the account through Create Account.";
  }

  if (code === "invalid_credentials" || normalized.includes("invalid login credentials")) {
    return "Invalid login credentials. Check that this user exists in Supabase Authentication -> Users, is confirmed, and that the password is correct. If the email was not created through this My Sports Resume Supabase project, use Create Account first.";
  }

  return message || "Supabase login could not be completed.";
}

async function readAppUserProfileRow(user) {
  if (!isRealAuthEnabled() || !supabase || !user?.id) {
    return { row: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from(APP_USER_PROFILES_TABLE)
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return { row: null, error };
    }

    return { row: data, error: null };
  } catch (error) {
    return { row: null, error };
  }
}

async function upsertAppUserProfileRow(user, overrides = {}) {
  if (!isRealAuthEnabled() || !supabase || !user?.id) {
    return { row: null, error: null };
  }

  try {
    const payload = buildAppUserProfilePayload(user, overrides);
    const { data, error } = await supabase
      .from(APP_USER_PROFILES_TABLE)
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      return { row: null, error };
    }

    return { row: data, error: null };
  } catch (error) {
    return { row: null, error };
  }
}

async function updateAuthUserMetadata(overrides = {}) {
  if (!isRealAuthEnabled() || !supabase) {
    return { success: false, error: null };
  }

  const metadata = getAuthMetadataFromInput(overrides);
  if (Object.keys(metadata).length === 0) {
    return { success: true, error: null };
  }

  try {
    const { data, error } = await supabase.auth.updateUser({ data: metadata });
    return {
      success: !error,
      user: data?.user || null,
      error: error || null,
    };
  } catch (error) {
    return { success: false, user: null, error };
  }
}

async function resolveSupabaseAccount(user, options = {}) {
  if (!user) {
    return {
      success: false,
      account: null,
      message: "No Supabase user session is active yet.",
    };
  }

  const readResult = await readAppUserProfileRow(user);
  if (readResult.row) {
    const account = normalizeAppUserProfile(readResult.row, user, {
      profileSyncState: "supabase_table",
    });
    writeLocalData(SELECTED_ROLE_STORAGE_KEY, account.role);
    return { success: true, account, message: "" };
  }

  const fallbackWarning = getProfileFallbackWarning(readResult.error);
  const needsUpsert =
    options.upsertIfMissing ||
    Boolean(options.fullName || options.role || options.organisationName || options.state || options.region);

  if (needsUpsert) {
    const upsertResult = await upsertAppUserProfileRow(user, options);
    if (upsertResult.row) {
      const account = normalizeAppUserProfile(upsertResult.row, user, {
        profileSyncState: "supabase_table",
      });
      writeLocalData(SELECTED_ROLE_STORAGE_KEY, account.role);
      return { success: true, account, message: fallbackWarning };
    }
  }

  const account = normalizeAppUserProfile(
    buildAppUserProfilePayload(user, options),
    user,
    {
      profileSyncState: fallbackWarning ? "auth_metadata_fallback" : "auth_metadata_only",
      profileSyncWarning: fallbackWarning,
    },
  );
  writeLocalData(SELECTED_ROLE_STORAGE_KEY, account.role);

  return {
    success: true,
    account,
    message: fallbackWarning,
  };
}

export function getDemoAccount() {
  return normalizeDemoAccount(readLocalData(DEMO_ACCOUNT_STORAGE_KEY, null));
}

export function saveDemoAccount(account) {
  const normalized = normalizeDemoAccount({
    ...account,
    updatedAt: new Date().toISOString(),
  });

  if (!normalized) {
    return null;
  }

  writeLocalData(DEMO_ACCOUNT_STORAGE_KEY, normalized);
  writeLocalData(SELECTED_ROLE_STORAGE_KEY, normalized.role);

  return normalized;
}

export function clearDemoAccount() {
  removeLocalData(DEMO_ACCOUNT_STORAGE_KEY);
}

export function getCurrentRole() {
  const storedRole = readStoredRole();
  const demoRole = getDemoAccount()?.role;

  return demoRole && !isRealAuthEnabled() ? demoRole : storedRole;
}

export function setCurrentRole(role) {
  const normalizedRole = normalizeRole(role);
  writeLocalData(SELECTED_ROLE_STORAGE_KEY, normalizedRole);

  const currentAccount = getDemoAccount();
  if (
    !isRealAuthEnabled() &&
    currentAccount?.authMode === "local_demo" &&
    currentAccount.role !== normalizedRole
  ) {
    writeLocalData(DEMO_ACCOUNT_STORAGE_KEY, {
      ...currentAccount,
      role: normalizedRole,
      updatedAt: new Date().toISOString(),
    });
  }

  return normalizedRole;
}

export function isRealAuthEnabled() {
  return Boolean(isBackendEnabled() && supabase);
}

export async function getCurrentSession() {
  if (!isRealAuthEnabled() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return null;
    }

    return data?.session || null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  if (!isRealAuthEnabled() || !supabase) {
    return null;
  }

  const session = await getCurrentSession();
  if (session?.user) {
    return session.user;
  }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }

    return data?.user || null;
  } catch {
    return null;
  }
}

export async function signUpWithEmail({
  email,
  password,
  fullName,
  role,
  organisationName = "",
  state = "",
  region = "",
}) {
  const normalizedRole = normalizeRole(role);
  const trimmedEmail = String(email || "").trim();
  const trimmedName = String(fullName || "").trim();

  if (!trimmedName) {
    return {
      success: false,
      account: null,
      message: "Add your full name before creating the account.",
    };
  }

  if (!isValidEmail(trimmedEmail)) {
    return {
      success: false,
      account: null,
      message: "Add a valid-looking email before creating the account.",
    };
  }

  if (!VALID_ROLES.has(normalizedRole)) {
    return {
      success: false,
      account: null,
      message: "Choose the account role before creating the account.",
    };
  }

  if (!isRealAuthEnabled()) {
    const timestamp = new Date().toISOString();
    const account = saveDemoAccount({
      id: `demo-account-${Date.now()}`,
      fullName: trimmedName,
      email: trimmedEmail,
      role: normalizedRole,
      organisationName,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (!account) {
      return {
        success: false,
        account: null,
        message: "The local demo account could not be created.",
      };
    }

    return {
      success: true,
      account,
      message: "Local demo account created. Continue to account setup.",
      session: null,
      user: null,
      isRateLimited: false,
    };
  }

  if (!String(password || "").trim()) {
    return {
      success: false,
      account: null,
      message: "Add a password before creating the Supabase account.",
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: getAuthMetadataFromInput({
          fullName: trimmedName,
          role: normalizedRole,
          organisationName,
          state,
          region,
        }),
      },
    });

    if (error) {
      return {
        success: false,
        account: null,
        message: getSupabaseSignUpMessage(error),
        isRateLimited: isSupabaseEmailRateLimit(error),
      };
    }

    const user = data?.user || null;
    const session = data?.session || null;

    if (!user) {
      setCurrentRole(normalizedRole);
      return {
        success: true,
        account: null,
        session,
        user: null,
        requiresEmailConfirmation: true,
        isRateLimited: false,
        message:
          "Supabase signup was submitted. Check your email to confirm the account, then return here and use Login. If confirmation is already handled in Supabase, use Login instead of repeating Create Account.",
      };
    }

    const profileResult = await resolveSupabaseAccount(user, {
      fullName: trimmedName,
      email: trimmedEmail,
      role: normalizedRole,
      organisationName,
      state,
      region,
      upsertIfMissing: true,
    });

    setCurrentRole(normalizedRole);

    const warning = profileResult.message ? ` ${profileResult.message}` : "";
    const requiresEmailConfirmation = !session;
    const baseMessage = session
      ? "Supabase account created. Continue to account setup."
      : "Supabase account created. Check your email to confirm the account, then return to Login.";

    return {
      success: true,
      account: profileResult.account,
      session,
      user,
      requiresEmailConfirmation,
      isRateLimited: false,
      message: `${baseMessage}${warning}`.trim(),
    };
  } catch (error) {
    return {
      success: false,
      account: null,
      message: getSupabaseSignUpMessage(error),
      isRateLimited: isSupabaseEmailRateLimit(error),
    };
  }
}

export async function signInWithEmail({ email, password }) {
  if (!isRealAuthEnabled()) {
    const demoAccount = getDemoAccount();
    if (!demoAccount) {
      return {
        success: false,
        account: null,
        message: "No local demo account exists on this device yet. Create one to continue.",
      };
    }

    const submittedEmail = String(email || "").trim().toLowerCase();
    const storedEmail = String(demoAccount.email || "").trim().toLowerCase();

    if (!submittedEmail) {
      return {
        success: false,
        account: null,
        message: "Enter the saved demo email to open the local demo account.",
      };
    }

    if (storedEmail && submittedEmail !== storedEmail) {
      return {
        success: false,
        account: null,
        message: "That email does not match the saved local demo account on this device.",
      };
    }

    setCurrentRole(demoAccount.role);
    return {
      success: true,
      account: demoAccount,
      session: null,
      user: null,
      message: "Local demo account opened. Supabase auth is not connected yet.",
    };
  }

  const trimmedEmail = String(email || "").trim();
  if (!isValidEmail(trimmedEmail)) {
    return {
      success: false,
      account: null,
      message: "Enter a valid-looking email to sign in.",
    };
  }

  if (!String(password || "").trim()) {
    return {
      success: false,
      account: null,
      message: "Enter your password to sign in.",
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      return {
        success: false,
        account: null,
        message: getSupabaseSignInMessage(error),
      };
    }

    const user = data?.user || null;
    const session = data?.session || null;
    const profileResult = await resolveSupabaseAccount(user, { upsertIfMissing: true });
    const nextRole = profileResult.account?.role || readStoredRole();
    setCurrentRole(nextRole);

    return {
      success: true,
      account: profileResult.account,
      session,
      user,
      message: profileResult.message
        ? `Supabase account signed in.${profileResult.message ? ` ${profileResult.message}` : ""}`
        : "Supabase account signed in.",
    };
  } catch (error) {
    return {
      success: false,
      account: null,
      message: getSupabaseSignInMessage(error),
    };
  }
}

export async function signOut() {
  if (!isRealAuthEnabled()) {
    clearDemoAccount();
    return {
      success: true,
      message: "Local demo account cleared. Demo role reset to Junior athlete.",
    };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return {
        success: false,
        message: error.message || "Supabase logout could not be completed.",
      };
    }

    return {
      success: true,
      message: "Supabase account signed out. Local athlete and opportunity demo data remain on this device.",
    };
  } catch (error) {
    return {
      success: false,
      message: error?.message || "Supabase logout could not be completed.",
    };
  }
}

export async function getAccountProfile(userOverride = null) {
  if (!isRealAuthEnabled()) {
    return getDemoAccount();
  }

  const user = userOverride || (await getCurrentUser());
  if (!user) {
    return null;
  }

  const result = await resolveSupabaseAccount(user, { upsertIfMissing: true });
  return result.account;
}

export async function saveAccountRole(role) {
  const normalizedRole = setCurrentRole(role);

  if (!isRealAuthEnabled()) {
    const demoAccount = getDemoAccount();
    if (!demoAccount) {
      return {
        success: true,
        account: null,
        message: "Local role selection updated.",
      };
    }

    const syncedAccount = saveDemoAccount({
      ...demoAccount,
      role: normalizedRole,
    });

    return {
      success: true,
      account: syncedAccount,
      message: "Local demo account role updated.",
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      account: null,
      message: "Sign in to save the Supabase account role.",
    };
  }

  const metadataResult = await updateAuthUserMetadata({ role: normalizedRole });
  const effectiveUser = metadataResult.user || user;
  const profileResult = await resolveSupabaseAccount(effectiveUser, {
    role: normalizedRole,
    upsertIfMissing: true,
  });

  return {
    success: true,
    account: profileResult.account,
    message: profileResult.message || "Supabase account role updated.",
  };
}
