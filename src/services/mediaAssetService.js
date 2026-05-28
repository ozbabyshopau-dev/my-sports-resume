import { getCurrentUser, isRealAuthEnabled } from "./authService";
import { readLocalData, removeLocalData, writeLocalData } from "./localDataService";
import { supabase } from "./supabaseClient";

const MEDIA_ASSET_STORAGE_KEY = "msr_media_assets_v1";
const MEDIA_ASSETS_TABLE = "media_assets";
const ATHLETE_PROFILES_TABLE = "athlete_profiles";
const HIGHLIGHTS_TABLE = "highlights";
const MEDIA_MIGRATION_STATUS =
  "Profiles + Highlights metadata + Opportunities metadata + Contact request metadata + Shortlists metadata + Admin queue metadata + Media metadata + Private storage phase 1 + Approval-safe media workflow phase 1 + Private highlight video phase 1";
const PROFILE_PHOTO_BUCKET = "msr-profile-photos";
const HIGHLIGHT_THUMBNAIL_BUCKET = "msr-highlight-thumbnails";
const HIGHLIGHT_VIDEO_BUCKET = "msr-highlight-videos";
const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const HIGHLIGHT_THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;
const HIGHLIGHT_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 60 * 10;
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_VIDEO_MIME_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const EXTENSION_BY_MIME_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const VIDEO_EXTENSION_BY_MIME_TYPE = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

const MEDIA_TYPE_LABELS = {
  profile_photo: "Profile Photo",
  highlight_video: "Highlight Video",
  highlight_thumbnail: "Highlight Thumbnail",
  verification_document: "Verification Document",
};

const APPROVAL_STATUS_LABELS = {
  pending_parent_approval: "Pending Parent Approval",
  pending_review: "Pending Review",
  parent_approved: "Parent Approved",
  admin_approved: "Admin Approved",
  rejected: "Rejected",
  archived: "Archived",
};

const VISIBILITY_STATUS_LABELS = {
  private: "Private",
  owner_only: "Owner Only",
  profile_only: "Profile Only",
  showcase_approved: "Showcase Approved",
  public_approved: "Public Approved",
};

let mediaAssetsTableCache = {
  checked: false,
  detected: null,
  message: "",
};

let mediaStorageBucketsCache = {
  checked: false,
  userId: "",
  profilePhotoDetected: null,
  highlightThumbnailDetected: null,
  highlightVideoDetected: null,
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

function createMediaAssetUuid() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `media-asset-${Date.now()}`;
}

function normalizeMediaTypeForDatabase(mediaType) {
  const normalized = normalizeText(mediaType);

  if (normalized === "highlight video") {
    return "highlight_video";
  }
  if (normalized === "highlight thumbnail") {
    return "highlight_thumbnail";
  }
  if (normalized === "verification document") {
    return "verification_document";
  }

  return "profile_photo";
}

function normalizeApprovalStatusForDatabase(status, parentGuardianRequired = false) {
  const normalized = normalizeText(status);

  if (normalized === "pending parent approval") {
    return "pending_parent_approval";
  }
  if (normalized === "parent approved") {
    return "parent_approved";
  }
  if (normalized === "admin approved") {
    return "admin_approved";
  }
  if (normalized === "rejected") {
    return "rejected";
  }
  if (normalized === "archived") {
    return "archived";
  }

  return parentGuardianRequired ? "pending_parent_approval" : "pending_review";
}

function normalizeVisibilityStatusForDatabase(status) {
  const normalized = normalizeText(status);

  if (normalized === "owner only") {
    return "owner_only";
  }
  if (normalized === "profile only") {
    return "profile_only";
  }
  if (normalized === "showcase approved") {
    return "showcase_approved";
  }
  if (normalized === "public approved") {
    return "public_approved";
  }

  return "private";
}

function mapApprovalStatusToRecord(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return APPROVAL_STATUS_LABELS[normalized] || "Pending Review";
}

function mapVisibilityStatusToRecord(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return VISIBILITY_STATUS_LABELS[normalized] || "Private";
}

function mapMediaTypeToRecord(mediaType) {
  const normalized = String(mediaType || "").trim().toLowerCase();
  return MEDIA_TYPE_LABELS[normalized] || "Profile Photo";
}

export function getMediaApprovalLabel(statusOrAsset) {
  if (isObject(statusOrAsset)) {
    return mapApprovalStatusToRecord(
      normalizeApprovalStatusForDatabase(
        statusOrAsset.approvalStatusRaw || statusOrAsset.approvalStatus,
        Boolean(statusOrAsset.parentGuardianRequired || statusOrAsset.isJuniorMedia),
      ),
    );
  }

  return mapApprovalStatusToRecord(
    normalizeApprovalStatusForDatabase(statusOrAsset, normalizeText(statusOrAsset) === "pending parent approval"),
  );
}

export function canOwnerViewMedia(asset, currentUserId = "") {
  if (!isObject(asset) || asset.storageSource !== "supabase") {
    return false;
  }

  if (
    currentUserId &&
    String(asset.ownerUserId || "").trim() !== String(currentUserId || "").trim()
  ) {
    return false;
  }

  return Boolean(String(asset.bucketName || "").trim() && String(asset.storagePath || "").trim());
}

export function canSignedInPreviewMedia(asset, currentUserId = "") {
  if (!canOwnerViewMedia(asset, currentUserId)) {
    return false;
  }

  const approvalStatus = normalizeText(asset.approvalStatusRaw || asset.approvalStatus);
  const visibilityStatus = normalizeText(asset.visibilityStatusRaw || asset.visibilityStatus);

  return (
    (approvalStatus === "parent approved" || approvalStatus === "admin approved") &&
    (visibilityStatus === "private" ||
      visibilityStatus === "profile only" ||
      visibilityStatus === "showcase approved")
  );
}

export function canPublicViewMedia() {
  return false;
}

function readLocalMediaAssets() {
  const mediaAssets = readLocalData(MEDIA_ASSET_STORAGE_KEY, []);
  return Array.isArray(mediaAssets) ? cloneValue(mediaAssets) : [];
}

function writeLocalMediaAssets(mediaAssets) {
  const nextAssets = Array.isArray(mediaAssets) ? mediaAssets : [];
  if (nextAssets.length === 0) {
    removeLocalData(MEDIA_ASSET_STORAGE_KEY);
    return;
  }

  writeLocalData(MEDIA_ASSET_STORAGE_KEY, cloneValue(nextAssets));
}

function normalizeManagedMediaAsset(asset, options = {}) {
  const nextAsset = isObject(asset) ? asset : {};
  const parentGuardianRequired =
    typeof options.parentGuardianRequired === "boolean"
      ? options.parentGuardianRequired
      : typeof nextAsset.parentGuardianRequired === "boolean"
        ? nextAsset.parentGuardianRequired
        : Boolean(nextAsset.isJuniorMedia);
  const mediaTypeRaw = normalizeMediaTypeForDatabase(
    options.mediaType || nextAsset.mediaTypeRaw || nextAsset.mediaType,
  );
  const approvalStatusRaw = normalizeApprovalStatusForDatabase(
    options.approvalStatus || nextAsset.approvalStatusRaw || nextAsset.approvalStatus,
    parentGuardianRequired,
  );
  const visibilityStatusRaw = normalizeVisibilityStatusForDatabase(
    options.visibilityStatus || nextAsset.visibilityStatusRaw || nextAsset.visibilityStatus,
  );
  const fileSizeBytes = Number(nextAsset.fileSizeBytes);
  const createdAt = nextAsset.createdAt || new Date().toISOString();
  const updatedAt = options.updatedAt || nextAsset.updatedAt || createdAt;
  const mediaData =
    isObject(nextAsset.mediaData) && Object.keys(nextAsset.mediaData).length > 0
      ? cloneValue(nextAsset.mediaData)
      : cloneValue(nextAsset);

  return {
    ...cloneValue(nextAsset),
    id: isUuidLike(nextAsset.id) ? String(nextAsset.id).trim() : createMediaAssetUuid(),
    ownerUserId: options.ownerUserId || nextAsset.ownerUserId || null,
    athleteProfileId: String(nextAsset.athleteProfileId || "").trim(),
    highlightId: String(nextAsset.highlightId || "").trim(),
    relatedQueueItemId: String(nextAsset.relatedQueueItemId || "").trim(),
    mediaTypeRaw,
    mediaType: mapMediaTypeToRecord(mediaTypeRaw),
    bucketName: String(nextAsset.bucketName || "").trim(),
    storagePath: String(nextAsset.storagePath || "").trim(),
    originalFilename: String(nextAsset.originalFilename || "").trim(),
    mimeType: String(nextAsset.mimeType || "").trim(),
    fileSizeBytes: Number.isFinite(fileSizeBytes) ? Math.max(0, fileSizeBytes) : 0,
    publicUrl: String(nextAsset.publicUrl || "").trim(),
    signedUrlExpiresAt: nextAsset.signedUrlExpiresAt || "",
    approvalStatusRaw,
    approvalStatus: mapApprovalStatusToRecord(approvalStatusRaw),
    visibilityStatusRaw,
    visibilityStatus: mapVisibilityStatusToRecord(visibilityStatusRaw),
    parentGuardianRequired,
    adminReviewRequired:
      typeof nextAsset.adminReviewRequired === "boolean" ? nextAsset.adminReviewRequired : true,
    isJuniorMedia: typeof nextAsset.isJuniorMedia === "boolean" ? nextAsset.isJuniorMedia : false,
    source: options.source || nextAsset.source || "local-media-asset",
    storageSource: options.storageSource || nextAsset.storageSource || "localStorage",
    mediaData,
    createdAt,
    updatedAt,
  };
}

function mergeMediaAssetCollections(primary = [], secondary = []) {
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

function getLatestSupabaseHighlightVideoAsset(mediaAssets, highlightId) {
  const nextHighlightId = String(highlightId || "").trim();

  return (Array.isArray(mediaAssets) ? mediaAssets : [])
    .filter(
      (asset) =>
        asset?.mediaTypeRaw === "highlight_video" &&
        asset?.storageSource === "supabase" &&
        String(asset?.highlightId || "").trim() === nextHighlightId,
    )
    .sort(
      (left, right) =>
        new Date(right?.updatedAt || right?.createdAt || 0).getTime() -
        new Date(left?.updatedAt || left?.createdAt || 0).getTime(),
    )[0] || null;
}

function getPrivateStorageMissingMessage() {
  return "Supabase private media storage is connected, but the storage buckets/policies still need storage_private_phase_1.sql.";
}

function getPrivateVideoStorageMissingMessage() {
  return "Supabase private highlight video storage is connected, but the video bucket/policies still need video_storage_private_phase_1.sql.";
}

function buildMediaStatus({
  mode = "planning",
  source = "localStorage",
  tableDetected = null,
  message = "Media metadata is available, but private uploads are not enabled yet.",
  assetCount = 0,
  localAssetCount = 0,
  supabaseAssetCount = 0,
  storageMode = "not_enabled",
  profilePhotoBucketDetected = null,
  highlightThumbnailBucketDetected = null,
  highlightVideoBucketDetected = null,
  videoStorageMode = "not_enabled",
  storageMessage = "Private media storage is not enabled yet.",
  uploadsEnabled = false,
  publicMediaAccess = false,
  videoUploadsEnabled = false,
}) {
  const modeLabel =
    mode === "supabase_active"
      ? "Supabase Media Metadata Active"
      : mode === "supabase_fallback"
        ? "Fallback"
        : mode === "local_disabled"
          ? "Local Disabled"
          : "Planning";
  const storageModeLabel =
    storageMode === "active"
      ? "Private Storage Active"
      : storageMode === "fallback"
        ? "Storage Fallback"
        : "Not Enabled";
  const videoStorageModeLabel =
    videoStorageMode === "active"
      ? "Private Video Active"
      : videoStorageMode === "fallback"
        ? "Video Fallback"
        : "Not enabled";

  return {
    mode,
    modeLabel,
    source,
    sourceLabel:
      source === "supabase" ? "Supabase" : source === "localStorage" ? "localStorage" : "not enabled yet",
    tableDetected,
    tableDetectedLabel:
      tableDetected === true ? "yes" : tableDetected === false ? "no" : "unknown",
    backendEnabled: isMediaBackendEnabled(),
    storageMode,
    storageModeLabel,
    profilePhotoBucketDetected,
    profilePhotoBucketDetectedLabel:
      profilePhotoBucketDetected === true
        ? "yes"
        : profilePhotoBucketDetected === false
          ? "no"
          : "unknown",
    highlightThumbnailBucketDetected,
    highlightThumbnailBucketDetectedLabel:
      highlightThumbnailBucketDetected === true
        ? "yes"
        : highlightThumbnailBucketDetected === false
          ? "no"
          : "unknown",
    highlightVideoBucketDetected,
    highlightVideoBucketDetectedLabel:
      highlightVideoBucketDetected === true
        ? "yes"
        : highlightVideoBucketDetected === false
          ? "no"
          : "unknown",
    bucketStatus:
      storageMode === "active"
        ? highlightVideoBucketDetected === true
          ? "private image + video buckets ready"
          : "private image buckets ready"
        : storageMode === "fallback"
          ? "check storage_private_phase_1.sql"
          : "not enabled yet",
    videoStorageMode,
    videoStorageModeLabel,
    uploadsEnabled: Boolean(uploadsEnabled),
    publicMediaAccess: Boolean(publicMediaAccess),
    videoUploadsEnabled: Boolean(videoUploadsEnabled),
    videoUploadsLabel: videoUploadsEnabled ? "Private owner test only" : "Disabled",
    message,
    storageMessage,
    sportsDataMigrationStatus: MEDIA_MIGRATION_STATUS,
    assetCount,
    localAssetCount,
    supabaseAssetCount,
  };
}

function getMediaMissingMessage() {
  return "Supabase auth is connected, but media_assets table/policies still need media_assets_phase_1.sql.";
}

function isMissingMediaTableError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "42P01" ||
    code === "42703" ||
    code === "42501" ||
    code === "PGRST205" ||
    message.includes(MEDIA_ASSETS_TABLE) ||
    message.includes("permission denied") ||
    message.includes("could not find the table") ||
    message.includes("relation")
  );
}

function isMissingStorageBucketError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("bucket") && (message.includes("not found") || message.includes("does not exist"));
}

function isObjectNotFoundStorageError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("object not found") || message.includes("not found");
}

async function detectMediaAssetsTable(force = false) {
  if (!force && mediaAssetsTableCache.checked) {
    return mediaAssetsTableCache;
  }

  if (!isMediaBackendEnabled() || !supabase) {
    mediaAssetsTableCache = {
      checked: true,
      detected: null,
      message:
        "Media metadata planning is in place, but private storage is not enabled yet and approval-safe uploads cannot run.",
    };
    return mediaAssetsTableCache;
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    mediaAssetsTableCache = {
      checked: true,
      detected: null,
      message:
        "Backend is connected. Sign in to save media metadata and run approval-safe private uploads in your Supabase account. Signed-out users cannot access private uploads.",
    };
    return mediaAssetsTableCache;
  }

  try {
    const { error } = await supabase
      .from(MEDIA_ASSETS_TABLE)
      .select("id")
      .eq("owner_user_id", user.id)
      .limit(1);

    mediaAssetsTableCache = error
      ? {
          checked: true,
          detected: false,
          message: isMissingMediaTableError(error)
            ? getMediaMissingMessage()
            : "Supabase media metadata is unavailable right now, so approval-safe private uploads remain disabled and the app will keep metadata local.",
        }
      : {
          checked: true,
          detected: true,
          message: "",
        };

    return mediaAssetsTableCache;
  } catch (error) {
    mediaAssetsTableCache = {
      checked: true,
      detected: false,
      message: isMissingMediaTableError(error)
        ? getMediaMissingMessage()
        : "Supabase media metadata is unavailable right now, so approval-safe private uploads remain disabled and the app will keep metadata local.",
    };
    return mediaAssetsTableCache;
  }
}

async function probeBucket(bucketName, userId) {
  try {
    const { error } = await supabase.storage.from(bucketName).list(`user/${userId}`, { limit: 1 });
    return error ? { detected: false, error } : { detected: true, error: null };
  } catch (error) {
    return { detected: false, error };
  }
}

async function detectPrivateStorageBuckets(force = false, userOverride = null) {
  const user = userOverride || (await getCurrentUser());

  if (!force && mediaStorageBucketsCache.checked && mediaStorageBucketsCache.userId === String(user?.id || "")) {
    return mediaStorageBucketsCache;
  }

  if (!isMediaBackendEnabled() || !supabase) {
    mediaStorageBucketsCache = {
      checked: true,
      userId: "",
      profilePhotoDetected: null,
      highlightThumbnailDetected: null,
      highlightVideoDetected: null,
      message: "Private storage is not enabled yet.",
    };
    return mediaStorageBucketsCache;
  }

  if (!user?.id) {
    mediaStorageBucketsCache = {
      checked: true,
      userId: "",
      profilePhotoDetected: null,
      highlightThumbnailDetected: null,
      highlightVideoDetected: null,
      message: "Sign in to check private media bucket access.",
    };
    return mediaStorageBucketsCache;
  }

  const [profileBucketResult, thumbnailBucketResult, videoBucketResult] = await Promise.all([
    probeBucket(PROFILE_PHOTO_BUCKET, user.id),
    probeBucket(HIGHLIGHT_THUMBNAIL_BUCKET, user.id),
    probeBucket(HIGHLIGHT_VIDEO_BUCKET, user.id),
  ]);

  const profilePhotoDetected = profileBucketResult.detected;
  const highlightThumbnailDetected = thumbnailBucketResult.detected;
  const highlightVideoDetected = videoBucketResult.detected;
  const bucketsReady = profilePhotoDetected && highlightThumbnailDetected;
  const videoReady = highlightVideoDetected === true;
  const fallbackMessage =
    profileBucketResult.error || thumbnailBucketResult.error
      ? getPrivateStorageMissingMessage()
      : "Private storage buckets are not fully ready yet.";
  const message = bucketsReady
    ? videoReady
      ? "Private profile photo, highlight thumbnail, and private highlight video storage are active. Public media access remains disabled."
      : "Private image storage is active. Run video_storage_private_phase_1.sql to enable private highlight video owner testing."
    : fallbackMessage;

  mediaStorageBucketsCache = {
    checked: true,
    userId: String(user.id),
    profilePhotoDetected,
    highlightThumbnailDetected,
    highlightVideoDetected,
    message,
  };

  return mediaStorageBucketsCache;
}

function buildMediaAssetRow(asset, ownerUserId) {
  const normalizedAsset = normalizeManagedMediaAsset(asset, {
    ownerUserId,
    source: "supabase-media-asset",
    storageSource: "supabase",
    updatedAt: new Date().toISOString(),
  });

  return {
    id: isUuidLike(normalizedAsset.id) ? normalizedAsset.id : createMediaAssetUuid(),
    owner_user_id: ownerUserId,
    athlete_profile_id: isUuidLike(normalizedAsset.athleteProfileId)
      ? normalizedAsset.athleteProfileId
      : null,
    highlight_id: isUuidLike(normalizedAsset.highlightId) ? normalizedAsset.highlightId : null,
    related_queue_item_id: isUuidLike(normalizedAsset.relatedQueueItemId)
      ? normalizedAsset.relatedQueueItemId
      : null,
    media_type: normalizeMediaTypeForDatabase(normalizedAsset.mediaTypeRaw || normalizedAsset.mediaType),
    bucket_name: toNullableString(normalizedAsset.bucketName),
    storage_path: toNullableString(normalizedAsset.storagePath),
    original_filename: toNullableString(normalizedAsset.originalFilename),
    mime_type: toNullableString(normalizedAsset.mimeType),
    file_size_bytes: Number.isFinite(Number(normalizedAsset.fileSizeBytes))
      ? Math.max(0, Number(normalizedAsset.fileSizeBytes))
      : 0,
    public_url: null,
    signed_url_expires_at: normalizedAsset.signedUrlExpiresAt || null,
    approval_status: normalizeApprovalStatusForDatabase(
      normalizedAsset.approvalStatusRaw || normalizedAsset.approvalStatus,
      normalizedAsset.parentGuardianRequired,
    ),
    visibility_status: normalizeVisibilityStatusForDatabase(
      normalizedAsset.visibilityStatusRaw || normalizedAsset.visibilityStatus,
    ),
    parent_guardian_required: Boolean(normalizedAsset.parentGuardianRequired),
    admin_review_required:
      typeof normalizedAsset.adminReviewRequired === "boolean"
        ? normalizedAsset.adminReviewRequired
        : true,
    is_junior_media: Boolean(normalizedAsset.isJuniorMedia),
    media_data: {
      ...normalizedAsset.mediaData,
      id: normalizedAsset.id,
      mediaTypeRaw: normalizeMediaTypeForDatabase(
        normalizedAsset.mediaTypeRaw || normalizedAsset.mediaType,
      ),
      approvalStatusRaw: normalizeApprovalStatusForDatabase(
        normalizedAsset.approvalStatusRaw || normalizedAsset.approvalStatus,
        normalizedAsset.parentGuardianRequired,
      ),
      visibilityStatusRaw: normalizeVisibilityStatusForDatabase(
        normalizedAsset.visibilityStatusRaw || normalizedAsset.visibilityStatus,
      ),
      source: "supabase-media-asset",
      storageSource: "supabase",
      privateStoragePhase: "phase_1",
    },
    updated_at: new Date().toISOString(),
  };
}

function normalizeSupabaseMediaAssetRow(row) {
  const rawAsset = isObject(row?.media_data) ? cloneValue(row.media_data) : {};
  const mediaTypeRaw = normalizeMediaTypeForDatabase(row?.media_type || rawAsset.mediaTypeRaw);
  const approvalStatusRaw = normalizeApprovalStatusForDatabase(
    row?.approval_status || rawAsset.approvalStatusRaw,
    Boolean(row?.parent_guardian_required ?? rawAsset.parentGuardianRequired),
  );
  const visibilityStatusRaw = normalizeVisibilityStatusForDatabase(
    row?.visibility_status || rawAsset.visibilityStatusRaw,
  );

  return {
    ...rawAsset,
    id: String(row?.id || rawAsset.id || createMediaAssetUuid()),
    ownerUserId: row?.owner_user_id || rawAsset.ownerUserId || null,
    athleteProfileId: String(row?.athlete_profile_id || rawAsset.athleteProfileId || "").trim(),
    highlightId: String(row?.highlight_id || rawAsset.highlightId || "").trim(),
    relatedQueueItemId: String(
      row?.related_queue_item_id || rawAsset.relatedQueueItemId || "",
    ).trim(),
    mediaTypeRaw,
    mediaType: mapMediaTypeToRecord(mediaTypeRaw),
    bucketName: String(row?.bucket_name || rawAsset.bucketName || "").trim(),
    storagePath: String(row?.storage_path || rawAsset.storagePath || "").trim(),
    originalFilename: String(row?.original_filename || rawAsset.originalFilename || "").trim(),
    mimeType: String(row?.mime_type || rawAsset.mimeType || "").trim(),
    fileSizeBytes: Number(row?.file_size_bytes || rawAsset.fileSizeBytes || 0),
    publicUrl: "",
    signedUrlExpiresAt: row?.signed_url_expires_at || rawAsset.signedUrlExpiresAt || "",
    approvalStatusRaw,
    approvalStatus: mapApprovalStatusToRecord(approvalStatusRaw),
    visibilityStatusRaw,
    visibilityStatus: mapVisibilityStatusToRecord(visibilityStatusRaw),
    parentGuardianRequired: Boolean(
      row?.parent_guardian_required ?? rawAsset.parentGuardianRequired,
    ),
    adminReviewRequired:
      typeof row?.admin_review_required === "boolean"
        ? row.admin_review_required
        : rawAsset.adminReviewRequired !== false,
    isJuniorMedia: Boolean(row?.is_junior_media ?? rawAsset.isJuniorMedia),
    source: "supabase-media-asset",
    storageSource: "supabase",
    mediaData: cloneValue(rawAsset),
    createdAt: row?.created_at || rawAsset.createdAt || new Date().toISOString(),
    updatedAt: row?.updated_at || rawAsset.updatedAt || row?.created_at || new Date().toISOString(),
  };
}

async function readSupabaseMediaAssets(user) {
  if (!supabase || !user?.id) {
    return { mediaAssets: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from(MEDIA_ASSETS_TABLE)
      .select("*")
      .eq("owner_user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return { mediaAssets: [], error };
    }

    return {
      mediaAssets: Array.isArray(data) ? data.map(normalizeSupabaseMediaAssetRow) : [],
      error: null,
    };
  } catch (error) {
    return { mediaAssets: [], error };
  }
}

async function loadMediaAssets() {
  const localMediaAssets = readLocalMediaAssets().map((item) =>
    normalizeManagedMediaAsset(item, {
      source: item?.source || "local-media-asset",
      storageSource: item?.storageSource || "localStorage",
    }),
  );

  if (!isMediaBackendEnabled() || !supabase) {
    return {
      mediaAssets: localMediaAssets,
      ...buildMediaStatus({
        mode: "planning",
        source: "localStorage",
        tableDetected: null,
        message:
          "Media metadata planning is in place. Approval-safe private uploads stay disabled until the current account, media_assets table, and private buckets are ready.",
        storageMode: "not_enabled",
        storageMessage: "Private Supabase Storage is not enabled yet.",
        assetCount: localMediaAssets.length,
        localAssetCount: localMediaAssets.length,
        supabaseAssetCount: 0,
      }),
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    return {
      mediaAssets: localMediaAssets,
      ...buildMediaStatus({
        mode: "local_disabled",
        source: "localStorage",
        tableDetected: null,
        message:
          "Backend is connected. Sign in to save media metadata to your Supabase account and use approval-safe private uploads.",
        storageMode: "not_enabled",
        storageMessage: "Sign in to use private profile photo and highlight thumbnail uploads.",
        assetCount: localMediaAssets.length,
        localAssetCount: localMediaAssets.length,
        supabaseAssetCount: 0,
      }),
    };
  }

  const tableStatus = await detectMediaAssetsTable();
  const bucketStatus = await detectPrivateStorageBuckets(false, user);
  const storageMode =
    tableStatus.detected === true &&
    bucketStatus.profilePhotoDetected === true &&
    bucketStatus.highlightThumbnailDetected === true
      ? "active"
      : tableStatus.detected === true || bucketStatus.profilePhotoDetected === true || bucketStatus.highlightThumbnailDetected === true
        ? "fallback"
        : "not_enabled";
  const videoStorageMode =
    tableStatus.detected === true && bucketStatus.highlightVideoDetected === true
      ? "active"
      : tableStatus.detected === true || bucketStatus.highlightVideoDetected === true
        ? "fallback"
        : "not_enabled";

  if (tableStatus.detected !== true) {
    return {
      mediaAssets: localMediaAssets,
      ...buildMediaStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: tableStatus.detected,
        message:
          tableStatus.message ||
          "Supabase media metadata is unavailable right now, so approval-safe private uploads remain disabled and metadata stays local.",
        storageMode,
        profilePhotoBucketDetected: bucketStatus.profilePhotoDetected,
        highlightThumbnailBucketDetected: bucketStatus.highlightThumbnailDetected,
        highlightVideoBucketDetected: bucketStatus.highlightVideoDetected,
        videoStorageMode,
        storageMessage:
          bucketStatus.message ||
          "Private storage buckets are not ready yet. Run storage_private_phase_1.sql.",
        uploadsEnabled: false,
        assetCount: localMediaAssets.length,
        localAssetCount: localMediaAssets.length,
        supabaseAssetCount: 0,
      }),
    };
  }

  const { mediaAssets: supabaseMediaAssets, error } = await readSupabaseMediaAssets(user);
  if (error) {
    return {
      mediaAssets: localMediaAssets,
      ...buildMediaStatus({
        mode: "supabase_fallback",
        source: "localStorage",
        tableDetected: true,
        message: isMissingMediaTableError(error)
          ? getMediaMissingMessage()
          : "Supabase media metadata is unavailable right now, so approval-safe private uploads remain disabled and metadata stays local.",
        storageMode,
        profilePhotoBucketDetected: bucketStatus.profilePhotoDetected,
        highlightThumbnailBucketDetected: bucketStatus.highlightThumbnailDetected,
        highlightVideoBucketDetected: bucketStatus.highlightVideoDetected,
        videoStorageMode,
        storageMessage:
          bucketStatus.message ||
          "Private storage buckets are not ready yet. Run storage_private_phase_1.sql.",
        uploadsEnabled: false,
        assetCount: localMediaAssets.length,
        localAssetCount: localMediaAssets.length,
        supabaseAssetCount: 0,
      }),
    };
  }

  const mergedMediaAssets = mergeMediaAssetCollections(supabaseMediaAssets, localMediaAssets);
  const source = supabaseMediaAssets.length > 0 ? "supabase" : "localStorage";
  const message =
    supabaseMediaAssets.length > 0
      ? "Media metadata is saved to your Supabase account."
      : "Supabase media metadata is ready. Existing local metadata can still render until resaved.";
  const storageMessage =
    storageMode === "active"
      ? videoStorageMode === "active"
        ? "Private image uploads and private highlight video owner testing are active. Public media access remains disabled."
        : "Private profile photo and highlight thumbnail uploads are active. Run video_storage_private_phase_1.sql to enable private highlight video owner testing."
      : bucketStatus.message || "Private storage buckets are not ready yet. Run storage_private_phase_1.sql.";

  return {
    mediaAssets: mergedMediaAssets,
    ...buildMediaStatus({
      mode: "supabase_active",
      source,
      tableDetected: true,
      message,
      storageMode,
      profilePhotoBucketDetected: bucketStatus.profilePhotoDetected,
      highlightThumbnailBucketDetected: bucketStatus.highlightThumbnailDetected,
      highlightVideoBucketDetected: bucketStatus.highlightVideoDetected,
      videoStorageMode,
      storageMessage,
      uploadsEnabled: storageMode === "active",
      publicMediaAccess: false,
      videoUploadsEnabled: videoStorageMode === "active",
      assetCount: mergedMediaAssets.length,
      localAssetCount: localMediaAssets.length,
      supabaseAssetCount: supabaseMediaAssets.length,
    }),
  };
}

function sanitizeFileName(fileName, fallbackExtension = "png") {
  const trimmed = String(fileName || "").trim().toLowerCase();
  const cleaned = trimmed.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
  const extensionMatch = cleaned.match(/\.([a-z0-9]+)$/i);
  const extension = extensionMatch ? extensionMatch[1] : fallbackExtension;
  const baseName = cleaned.replace(/\.[a-z0-9]+$/i, "").replace(/^[-_.]+|[-_.]+$/g, "") || "upload";
  return `${baseName}.${extension}`;
}

function inferMimeTypeFromFile(file) {
  const explicitType = String(file?.type || "").trim().toLowerCase();
  if (ALLOWED_IMAGE_MIME_TYPES.has(explicitType)) {
    return explicitType;
  }

  const fileName = String(file?.name || "").trim().toLowerCase();
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (fileName.endsWith(".png")) {
    return "image/png";
  }
  if (fileName.endsWith(".webp")) {
    return "image/webp";
  }

  return explicitType;
}

function inferVideoMimeTypeFromFile(file) {
  const explicitType = String(file?.type || "").toLowerCase();
  const fileName = String(file?.name || "").trim().toLowerCase();

  if (ALLOWED_VIDEO_MIME_TYPES.has(explicitType)) {
    return explicitType;
  }

  if (fileName.endsWith(".mp4")) {
    return "video/mp4";
  }
  if (fileName.endsWith(".mov") || fileName.endsWith(".qt")) {
    return "video/quicktime";
  }
  if (fileName.endsWith(".webm")) {
    return "video/webm";
  }

  return explicitType;
}

function validatePrivateImageFile(file, maxBytes) {
  if (!file || typeof file !== "object") {
    return {
      valid: false,
      message: "Choose an image file first.",
    };
  }

  const detectedMimeType = inferMimeTypeFromFile(file);

  if (String(file?.type || "").toLowerCase().startsWith("video/")) {
    return {
      valid: false,
      message: "Video upload is not enabled yet.",
    };
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(detectedMimeType)) {
    return {
      valid: false,
      message: "Only JPG, PNG, and WEBP images are supported in this phase.",
    };
  }

  const fileSizeBytes = Number(file?.size || 0);
  if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) {
    return {
      valid: false,
      message: "The selected image file is empty or invalid.",
    };
  }

  if (fileSizeBytes > maxBytes) {
    return {
      valid: false,
      message: `Image files must be 5MB or smaller in this phase.`,
    };
  }

  const safeFileName = sanitizeFileName(
    file?.name,
    EXTENSION_BY_MIME_TYPE[detectedMimeType] || "png",
  );

  return {
    valid: true,
    mimeType: detectedMimeType,
    safeFileName,
    fileSizeBytes,
  };
}

export function validateHighlightVideoFile(file) {
  if (!file || typeof file !== "object") {
    return {
      valid: false,
      errorCategory: "file_missing_error",
      message: "Choose an MP4, MOV, or WEBM highlight video under 100MB.",
    };
  }

  const detectedMimeType = inferVideoMimeTypeFromFile(file);
  if (!ALLOWED_VIDEO_MIME_TYPES.has(detectedMimeType)) {
    return {
      valid: false,
      errorCategory: "file_type_error",
      message: "Only MP4, MOV, and WEBM highlight videos are planned for this phase.",
    };
  }

  const fileSizeBytes = Number(file?.size || 0);
  if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) {
    return {
      valid: false,
      errorCategory: "file_size_error",
      message: "The selected highlight video file is empty or invalid.",
    };
  }

  if (fileSizeBytes > HIGHLIGHT_VIDEO_MAX_BYTES) {
    return {
      valid: false,
      errorCategory: "file_size_error",
      message: "Highlight videos must be 100MB or smaller during the initial private-testing phase.",
    };
  }

  return {
    valid: true,
    errorCategory: "",
    mimeType: detectedMimeType,
    safeFileName: sanitizeFileName(
      file?.name,
      VIDEO_EXTENSION_BY_MIME_TYPE[detectedMimeType] || "mp4",
    ),
    fileSizeBytes,
  };
}

function buildThumbnailUploadFailure({
  message,
  errorCategory = "unknown_error",
  errorStage = "upload",
  source = "supabase",
  fallback = false,
  mediaAsset = null,
  canRetry = true,
  requiresFileReselect = false,
  fileUploaded = false,
}) {
  return {
    success: false,
    source,
    fallback,
    message,
    mediaAsset,
    fileUploaded,
    errorCategory,
    errorStage,
    canRetry,
    requiresFileReselect,
  };
}

function buildLabelledThumbnailError(label, message, fallbackMessage) {
  const nextMessage = String(message || fallbackMessage || "").trim();
  if (!nextMessage) {
    return label;
  }

  return normalizeText(nextMessage).startsWith(normalizeText(label))
    ? nextMessage
    : `${label}: ${nextMessage}`;
}

function buildThumbnailValidationFailure(validation) {
  const message = String(validation?.message || "").trim();
  const normalized = normalizeText(message);

  if (normalized.includes("video upload is not enabled yet")) {
    return buildThumbnailUploadFailure({
      source: "localStorage",
      fallback: true,
      errorCategory: "file_type_error",
      errorStage: "validation",
      requiresFileReselect: true,
      canRetry: false,
      message:
        "File type error: video upload is not enabled yet. Please choose a JPG, PNG, or WEBP thumbnail under 5MB.",
    });
  }

  if (normalized.includes("jpg") || normalized.includes("png") || normalized.includes("webp")) {
    return buildThumbnailUploadFailure({
      source: "localStorage",
      fallback: true,
      errorCategory: "file_type_error",
      errorStage: "validation",
      requiresFileReselect: true,
      canRetry: false,
      message:
        "File type error: only JPG, PNG, and WEBP thumbnails are supported in this phase.",
    });
  }

  if (normalized.includes("5mb")) {
    return buildThumbnailUploadFailure({
      source: "localStorage",
      fallback: true,
      errorCategory: "file_size_error",
      errorStage: "validation",
      requiresFileReselect: true,
      canRetry: false,
      message: "File size error: thumbnails must be 5MB or smaller in this phase.",
    });
  }

  if (normalized.includes("choose an image file")) {
    return buildThumbnailUploadFailure({
      source: "localStorage",
      fallback: true,
      errorCategory: "file_missing_error",
      errorStage: "validation",
      requiresFileReselect: true,
      canRetry: false,
      message: "Please choose the thumbnail image again, then click Upload Selected Thumbnail.",
    });
  }

  if (normalized.includes("empty or invalid")) {
    return buildThumbnailUploadFailure({
      source: "localStorage",
      fallback: true,
      errorCategory: "file_invalid_error",
      errorStage: "validation",
      requiresFileReselect: true,
      canRetry: false,
      message: "Unknown error: the selected thumbnail image is empty or invalid. Please choose it again.",
    });
  }

  return buildThumbnailUploadFailure({
    source: "localStorage",
    fallback: true,
    errorCategory: "unknown_error",
    errorStage: "validation",
    requiresFileReselect: true,
    canRetry: false,
    message:
      buildLabelledThumbnailError(
        "Unknown error",
        message,
        "Private thumbnail upload could not be validated.",
      ),
  });
}

function buildThumbnailReadinessFailure(readiness) {
  const message = String(readiness?.message || "").trim();
  const normalized = normalizeText(message);

  if (normalized.includes("sign in")) {
    return buildThumbnailUploadFailure({
      source: readiness?.source || "localStorage",
      fallback: readiness?.fallback !== false,
      errorCategory: "auth_session_error",
      errorStage: "readiness",
      message:
        "Auth/session error: sign in with your Supabase account again before uploading a private thumbnail.",
    });
  }

  if (normalized.includes("bucket") || normalized.includes("storage_private_phase_1.sql")) {
    return buildThumbnailUploadFailure({
      source: readiness?.source || "localStorage",
      fallback: readiness?.fallback !== false,
      errorCategory: "bucket_error",
      errorStage: "readiness",
      message:
        `Bucket error: ${HIGHLIGHT_THUMBNAIL_BUCKET} is not ready yet for private highlight thumbnail uploads.`,
    });
  }

  if (normalized.includes("media_assets") || normalized.includes("table")) {
    return buildThumbnailUploadFailure({
      source: readiness?.source || "localStorage",
      fallback: readiness?.fallback !== false,
      errorCategory: "media_assets_insert_update_error",
      errorStage: "readiness",
      message:
        buildLabelledThumbnailError(
          "media_assets insert/update error",
          message,
          "Private thumbnail uploads need the media_assets metadata table before they can run.",
        ),
    });
  }

  return buildThumbnailUploadFailure({
    source: readiness?.source || "localStorage",
    fallback: readiness?.fallback !== false,
    errorCategory: "unknown_error",
    errorStage: "readiness",
    message:
      buildLabelledThumbnailError(
        "Unknown error",
        message,
        "Private highlight thumbnail upload is not ready yet.",
      ),
  });
}

function buildThumbnailStorageUploadFailure(error) {
  const message = String(error?.message || "").trim();
  const normalized = normalizeText(message);

  if (isMissingStorageBucketError(error)) {
    return buildThumbnailUploadFailure({
      errorCategory: "bucket_error",
      errorStage: "storage_upload",
      message:
        `Bucket error: ${HIGHLIGHT_THUMBNAIL_BUCKET} is not available for private thumbnail uploads yet.`,
    });
  }

  if (
    normalized.includes("row level security") ||
    normalized.includes("policy") ||
    normalized.includes("permission denied") ||
    normalized.includes("not allowed")
  ) {
    return buildThumbnailUploadFailure({
      errorCategory: "storage_policy_error",
      errorStage: "storage_upload",
      message:
        "Storage policy error: your signed-in account cannot write to this private thumbnail path yet.",
    });
  }

  if (
    normalized.includes("jwt") ||
    normalized.includes("token") ||
    normalized.includes("session") ||
    normalized.includes("auth") ||
    normalized.includes("unauthorized")
  ) {
    return buildThumbnailUploadFailure({
      errorCategory: "auth_session_error",
      errorStage: "storage_upload",
      message:
        "Auth/session error: sign in with your Supabase account again before uploading a private thumbnail.",
    });
  }

  return buildThumbnailUploadFailure({
    errorCategory: "unknown_error",
    errorStage: "storage_upload",
    message:
      buildLabelledThumbnailError(
        "Unknown error",
        message,
        "Private highlight thumbnail upload could not be completed.",
      ),
  });
}

function buildThumbnailMetadataFailure(saveResult) {
  return buildThumbnailUploadFailure({
    source: saveResult?.source || "localStorage",
    fallback: saveResult?.fallback !== false,
    errorCategory: "media_assets_insert_update_error",
    errorStage: "metadata_save",
    message:
      buildLabelledThumbnailError(
        "media_assets insert/update error",
        saveResult?.message,
        "The thumbnail file uploaded, but the media metadata row could not be saved to Supabase.",
      ),
  });
}

async function getOwnedAthleteProfileContext(userId, athleteProfileId) {
  if (!supabase || !userId) {
    return { success: false, message: "Sign in with a Supabase account first." };
  }

  if (!isUuidLike(athleteProfileId)) {
    return {
      success: false,
      message: "Create or resave a Supabase-backed athlete profile first.",
    };
  }

  try {
    const { data, error } = await supabase
      .from(ATHLETE_PROFILES_TABLE)
      .select("id, owner_user_id, display_name, is_junior")
      .eq("id", athleteProfileId)
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return {
        success: false,
        message: "Create or resave a Supabase-backed athlete profile first.",
        error,
      };
    }

    return {
      success: true,
      profile: {
        id: data.id,
        ownerUserId: data.owner_user_id,
        displayName: String(data.display_name || "").trim(),
        isJunior: Boolean(data.is_junior),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Create or resave a Supabase-backed athlete profile first.",
      error,
    };
  }
}

async function getOwnedHighlightContext(userId, highlightId) {
  if (!supabase || !userId) {
    return { success: false, message: "Sign in with a Supabase account first." };
  }

  if (!isUuidLike(highlightId)) {
    return {
      success: false,
      message: "Save this highlight to your Supabase account first.",
    };
  }

  try {
    const { data, error } = await supabase
      .from(HIGHLIGHTS_TABLE)
      .select("id, owner_user_id, athlete_profile_id, title")
      .eq("id", highlightId)
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return {
        success: false,
        message: "Save this highlight to your Supabase account first.",
        error,
      };
    }

    return {
      success: true,
      highlight: {
        id: data.id,
        ownerUserId: data.owner_user_id,
        athleteProfileId: data.athlete_profile_id || "",
        title: String(data.title || "").trim(),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Save this highlight to your Supabase account first.",
      error,
    };
  }
}

function buildProfilePhotoPath({ userId, athleteProfileId, mediaAssetId, safeFileName }) {
  return `user/${userId}/profiles/${athleteProfileId}/${mediaAssetId}-${safeFileName}`;
}

function buildHighlightThumbnailPath({ userId, highlightId, mediaAssetId, safeFileName }) {
  return `user/${userId}/highlights/${highlightId}/${mediaAssetId}-${safeFileName}`;
}

function buildHighlightVideoPath({ userId, highlightId, mediaAssetId, safeFileName }) {
  return `user/${userId}/highlights/${highlightId}/${mediaAssetId}-${safeFileName}`;
}

async function ensurePrivateStorageReady(requiredBucket) {
  if (!isMediaBackendEnabled() || !supabase) {
    return {
      success: false,
      message: "Private Supabase Storage is not enabled in this app yet.",
      fallback: true,
      source: "localStorage",
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    return {
      success: false,
      message: "Sign in with a Supabase account first.",
      fallback: true,
      source: "localStorage",
    };
  }

  const tableStatus = await detectMediaAssetsTable(true);
  if (tableStatus.detected !== true) {
    return {
      success: false,
      message: tableStatus.message || getMediaMissingMessage(),
      fallback: true,
      source: "localStorage",
    };
  }

  const bucketStatus = await detectPrivateStorageBuckets(true, user);
  const bucketDetected =
    requiredBucket === PROFILE_PHOTO_BUCKET
      ? bucketStatus.profilePhotoDetected
      : requiredBucket === HIGHLIGHT_VIDEO_BUCKET
        ? bucketStatus.highlightVideoDetected
        : bucketStatus.highlightThumbnailDetected;

  if (bucketDetected !== true) {
    return {
      success: false,
      message:
        bucketStatus.message ||
        (requiredBucket === HIGHLIGHT_VIDEO_BUCKET
          ? getPrivateVideoStorageMissingMessage()
          : getPrivateStorageMissingMessage()),
      fallback: true,
      source: "localStorage",
    };
  }

  return {
    success: true,
    user,
    tableStatus,
    bucketStatus,
  };
}

async function createSignedUrlForAsset(asset, user, options = {}) {
  if (!supabase || !user?.id) {
    return {
      success: false,
      signedUrl: "",
      expiresAt: "",
      message: "Sign in with a Supabase account first.",
    };
  }

  if (!asset?.bucketName || !asset?.storagePath) {
    return {
      success: false,
      signedUrl: "",
      expiresAt: "",
      message: "No private storage object is linked to this media asset yet.",
    };
  }

  try {
    const { data, error } = await supabase
      .storage
      .from(asset.bucketName)
      .createSignedUrl(asset.storagePath, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      return {
        success: false,
        signedUrl: "",
        expiresAt: "",
        message: String(error?.message || "Signed media preview could not be created."),
      };
    }

    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();

    if (options.persistExpiry !== false) {
      try {
        await supabase
          .from(MEDIA_ASSETS_TABLE)
          .update({
            signed_url_expires_at: expiresAt,
            public_url: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", asset.id)
          .eq("owner_user_id", user.id);
      } catch {
        // The signed URL itself still works; expiry persistence is best-effort only.
      }
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
      expiresAt,
      message: "Signed owner preview created.",
    };
  } catch (error) {
    return {
      success: false,
      signedUrl: "",
      expiresAt: "",
      message: String(error?.message || "Signed media preview could not be created."),
    };
  }
}

export function isMediaBackendEnabled() {
  return Boolean(isRealAuthEnabled() && supabase);
}

export async function getMediaBackendStatus() {
  const result = await loadMediaAssets();
  const { mediaAssets, ...status } = result;
  return status;
}

export async function getMediaAssets() {
  return loadMediaAssets();
}

export async function getMediaAssetsByAthleteId(athleteProfileId) {
  const result = await loadMediaAssets();
  const nextId = String(athleteProfileId || "").trim();

  return {
    ...result,
    mediaAssets: result.mediaAssets.filter(
      (asset) => String(asset.athleteProfileId || "").trim() === nextId,
    ),
  };
}

export async function getMediaAssetsByHighlightId(highlightId) {
  const result = await loadMediaAssets();
  const nextId = String(highlightId || "").trim();

  return {
    ...result,
    mediaAssets: result.mediaAssets.filter(
      (asset) => String(asset.highlightId || "").trim() === nextId,
    ),
  };
}

export async function saveMediaAsset(asset) {
  const nextAsset = normalizeManagedMediaAsset(asset, {
    updatedAt: new Date().toISOString(),
  });

  if (!isMediaBackendEnabled() || !supabase) {
    const current = readLocalMediaAssets().filter((item) => item.id !== nextAsset.id);
    const savedLocalAsset = normalizeManagedMediaAsset(nextAsset, {
      source: "local-media-asset",
      storageSource: "localStorage",
    });
    writeLocalMediaAssets([savedLocalAsset, ...current]);

    return {
      success: true,
      source: "localStorage",
      fallback: false,
      mediaAsset: savedLocalAsset,
      mediaDataExists: Object.keys(savedLocalAsset.mediaData || {}).length > 0,
      ownerUserIdExists: Boolean(savedLocalAsset.ownerUserId),
      ...(await getMediaAssets()),
      message: "Media metadata saved on this device only. Private uploads require Supabase Storage.",
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    const current = readLocalMediaAssets().filter((item) => item.id !== nextAsset.id);
    const savedLocalAsset = normalizeManagedMediaAsset(nextAsset, {
      source: "local-media-asset",
      storageSource: "localStorage",
    });
    writeLocalMediaAssets([savedLocalAsset, ...current]);

    return {
      success: true,
      source: "localStorage",
      fallback: true,
      mediaAsset: savedLocalAsset,
      mediaDataExists: Object.keys(savedLocalAsset.mediaData || {}).length > 0,
      ownerUserIdExists: Boolean(savedLocalAsset.ownerUserId),
      ...(await getMediaAssets()),
      message:
        "No Supabase session detected, so media metadata was saved on this device only. Private uploads are unavailable while signed out.",
    };
  }

  const tableStatus = await detectMediaAssetsTable(true);
  if (tableStatus.detected !== true) {
    const current = readLocalMediaAssets().filter((item) => item.id !== nextAsset.id);
    const savedLocalAsset = normalizeManagedMediaAsset(nextAsset, {
      source: "local-media-asset",
      storageSource: "localStorage",
    });
    writeLocalMediaAssets([savedLocalAsset, ...current]);

    return {
      success: true,
      source: "localStorage",
      fallback: true,
      mediaAsset: savedLocalAsset,
      mediaDataExists: Object.keys(savedLocalAsset.mediaData || {}).length > 0,
      ownerUserIdExists: Boolean(savedLocalAsset.ownerUserId),
      ...(await getMediaAssets()),
      message:
        tableStatus.message ||
        "Supabase media metadata is unavailable right now, so the record was saved on this device only.",
    };
  }

  const mediaAssetRow = buildMediaAssetRow(nextAsset, user.id);

  try {
    const { data, error } = await supabase
      .from(MEDIA_ASSETS_TABLE)
      .upsert(mediaAssetRow, { onConflict: "id" })
      .select("*")
      .maybeSingle();

    if (error || !data) {
      const current = readLocalMediaAssets().filter((item) => item.id !== nextAsset.id);
      const savedLocalAsset = normalizeManagedMediaAsset(nextAsset, {
        source: "local-media-asset",
        storageSource: "localStorage",
      });
      writeLocalMediaAssets([savedLocalAsset, ...current]);

      return {
        success: true,
        source: "localStorage",
        fallback: true,
        mediaAsset: savedLocalAsset,
        mediaDataExists: Object.keys(savedLocalAsset.mediaData || {}).length > 0,
        ownerUserIdExists: Boolean(savedLocalAsset.ownerUserId),
        ...(await getMediaAssets()),
        message: isMissingMediaTableError(error)
          ? getMediaMissingMessage()
          : "Supabase media metadata save did not complete, so the record was saved on this device only for now.",
      };
    }

    const savedMediaAsset = normalizeSupabaseMediaAssetRow(data);

    return {
      success: true,
      source: "supabase",
      fallback: false,
      mediaAsset: savedMediaAsset,
      mediaDataExists: Boolean(data?.media_data) && Object.keys(data.media_data).length > 0,
      ownerUserIdExists: Boolean(data?.owner_user_id),
      ...(await getMediaAssets()),
      message: "Media metadata saved to your Supabase account.",
    };
  } catch (error) {
    const current = readLocalMediaAssets().filter((item) => item.id !== nextAsset.id);
    const savedLocalAsset = normalizeManagedMediaAsset(nextAsset, {
      source: "local-media-asset",
      storageSource: "localStorage",
    });
    writeLocalMediaAssets([savedLocalAsset, ...current]);

    return {
      success: true,
      source: "localStorage",
      fallback: true,
      mediaAsset: savedLocalAsset,
      mediaDataExists: Object.keys(savedLocalAsset.mediaData || {}).length > 0,
      ownerUserIdExists: Boolean(savedLocalAsset.ownerUserId),
      ...(await getMediaAssets()),
      message: isMissingMediaTableError(error)
        ? getMediaMissingMessage()
        : "Supabase media metadata save did not complete, so the record was saved on this device only for now.",
    };
  }
}

export async function updateMediaAsset(assetId, updates = {}) {
  const current = await getMediaAssets();
  const existingAsset = current.mediaAssets.find((asset) => asset.id === assetId) || null;

  if (!existingAsset) {
    return {
      success: false,
      mediaAsset: null,
      ...(await getMediaAssets()),
      message: "Media metadata record not found.",
    };
  }

  const nextAsset = normalizeManagedMediaAsset(
    {
      ...existingAsset,
      ...cloneValue(isObject(updates) ? updates : {}),
    },
    {
      updatedAt: new Date().toISOString(),
    },
  );

  return saveMediaAsset({ ...nextAsset, id: assetId });
}

export async function approveMediaAsset(assetId, options = {}) {
  const nextVisibilityStatus = String(options.visibilityStatusRaw || "profile_only").trim() || "profile_only";
  return updateMediaAsset(assetId, {
    approvalStatusRaw: "admin_approved",
    visibilityStatusRaw: nextVisibilityStatus,
    adminReviewRequired: false,
    ...(typeof options.parentGuardianRequired === "boolean"
      ? { parentGuardianRequired: options.parentGuardianRequired }
      : {}),
  });
}

export async function rejectMediaAsset(assetId) {
  return updateMediaAsset(assetId, {
    approvalStatusRaw: "rejected",
    visibilityStatusRaw: "private",
    adminReviewRequired: false,
  });
}

export async function archiveMediaAsset(assetId) {
  return updateMediaAsset(assetId, {
    approvalStatusRaw: "archived",
    visibilityStatusRaw: "private",
    adminReviewRequired: false,
  });
}

export async function markMediaProfileOnly(assetId) {
  return approveMediaAsset(assetId, { visibilityStatusRaw: "profile_only" });
}

export async function deleteMediaAsset(assetId) {
  const current = await getMediaAssets();
  const existingAsset = current.mediaAssets.find((asset) => asset.id === assetId) || null;

  if (!existingAsset) {
    return {
      success: false,
      deletedMediaAssetId: null,
      ...(await getMediaAssets()),
      message: "Media metadata record not found.",
    };
  }

  if (!isMediaBackendEnabled() || !supabase || existingAsset.storageSource !== "supabase") {
    const nextAssets = readLocalMediaAssets().filter((asset) => asset.id !== assetId);
    writeLocalMediaAssets(nextAssets);

    return {
      success: true,
      source: "localStorage",
      fallback: false,
      deletedMediaAssetId: assetId,
      ...(await getMediaAssets()),
      message: "Media metadata removed from this device.",
    };
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    const nextAssets = readLocalMediaAssets().filter((asset) => asset.id !== assetId);
    writeLocalMediaAssets(nextAssets);

    return {
      success: true,
      source: "localStorage",
      fallback: true,
      deletedMediaAssetId: assetId,
      ...(await getMediaAssets()),
      message: "No Supabase session detected, so the media metadata record was removed from this device only.",
    };
  }

  const tableStatus = await detectMediaAssetsTable(true);
  if (tableStatus.detected !== true) {
    const nextAssets = readLocalMediaAssets().filter((asset) => asset.id !== assetId);
    writeLocalMediaAssets(nextAssets);

    return {
      success: true,
      source: "localStorage",
      fallback: true,
      deletedMediaAssetId: assetId,
      ...(await getMediaAssets()),
      message:
        tableStatus.message ||
        "Supabase media metadata is unavailable right now, so the record was removed from this device only.",
    };
  }

  try {
    const { error } = await supabase.from(MEDIA_ASSETS_TABLE).delete().eq("id", assetId);

    if (error) {
      return {
        success: false,
        deletedMediaAssetId: null,
        ...(await getMediaAssets()),
        message: isMissingMediaTableError(error)
          ? getMediaMissingMessage()
          : "Supabase media metadata delete could not be completed.",
      };
    }

    const nextAssets = readLocalMediaAssets().filter((asset) => asset.id !== assetId);
    writeLocalMediaAssets(nextAssets);

    return {
      success: true,
      source: "supabase",
      fallback: false,
      deletedMediaAssetId: assetId,
      ...(await getMediaAssets()),
      message: "Media metadata removed from your Supabase account.",
    };
  } catch (error) {
    return {
      success: false,
      deletedMediaAssetId: null,
      ...(await getMediaAssets()),
      message: isMissingMediaTableError(error)
        ? getMediaMissingMessage()
        : "Supabase media metadata delete could not be completed.",
    };
  }
}

export async function createSignedMediaUrl(mediaAssetId) {
  const current = await getMediaAssets();
  const asset = current.mediaAssets.find((item) => item.id === mediaAssetId) || null;

  if (!asset) {
    return {
      success: false,
      signedUrl: "",
      expiresAt: "",
      message: "Media asset not found.",
    };
  }

  const readiness = await ensurePrivateStorageReady(asset.bucketName);
  if (!readiness.success) {
    return {
      success: false,
      signedUrl: "",
      expiresAt: "",
      message: readiness.message,
      source: readiness.source || "localStorage",
      fallback: readiness.fallback !== false,
    };
  }

  if (asset.ownerUserId && asset.ownerUserId !== readiness.user.id) {
    return {
      success: false,
      signedUrl: "",
      expiresAt: "",
      message: "This private media asset belongs to a different account.",
    };
  }

  return createSignedUrlForAsset(asset, readiness.user);
}

export async function getSignedMediaPreview(mediaAssetId) {
  const current = await getMediaAssets();
  const asset = current.mediaAssets.find((item) => item.id === mediaAssetId) || null;

  if (!asset) {
    return {
      success: false,
      signedUrl: "",
      expiresAt: "",
      message: "Media asset not found.",
    };
  }

  if (asset.mediaTypeRaw === "highlight_video") {
    return createSignedVideoUrl(mediaAssetId);
  }

  return createSignedMediaUrl(mediaAssetId);
}

export async function deleteStoredMediaAsset(mediaAssetId) {
  const current = await getMediaAssets();
  const asset = current.mediaAssets.find((item) => item.id === mediaAssetId) || null;

  if (!asset) {
    return {
      success: false,
      message: "Media asset not found.",
      deletedMediaAssetId: null,
    };
  }

  if (asset.storageSource !== "supabase" || !asset.bucketName || !asset.storagePath) {
    return deleteMediaAsset(mediaAssetId);
  }

  const readiness = await ensurePrivateStorageReady(asset.bucketName);
  if (!readiness.success) {
    return {
      success: false,
      message: readiness.message,
      deletedMediaAssetId: null,
      fallback: readiness.fallback !== false,
      source: readiness.source || "localStorage",
    };
  }

  try {
    const { error } = await supabase.storage.from(asset.bucketName).remove([asset.storagePath]);
    if (error && !isObjectNotFoundStorageError(error)) {
      return {
        success: false,
        message: String(error?.message || "Private media file delete could not be completed."),
        deletedMediaAssetId: null,
      };
    }
  } catch (error) {
    if (!isObjectNotFoundStorageError(error)) {
      return {
        success: false,
        message: String(error?.message || "Private media file delete could not be completed."),
        deletedMediaAssetId: null,
      };
    }
  }

  const metadataDeleteResult = await deleteMediaAsset(mediaAssetId);
  return {
    ...metadataDeleteResult,
    deletedObjectPath: asset.storagePath,
  };
}

export async function uploadProfilePhoto({ file, athleteProfileId }) {
  const validation = validatePrivateImageFile(file, PROFILE_PHOTO_MAX_BYTES);
  if (!validation.valid) {
    return {
      success: false,
      source: "localStorage",
      fallback: true,
      message: validation.message,
      mediaAsset: null,
    };
  }

  const readiness = await ensurePrivateStorageReady(PROFILE_PHOTO_BUCKET);
  if (!readiness.success) {
    return {
      success: false,
      source: readiness.source || "localStorage",
      fallback: readiness.fallback !== false,
      message: readiness.message,
      mediaAsset: null,
    };
  }

  const profileContext = await getOwnedAthleteProfileContext(readiness.user.id, athleteProfileId);
  if (!profileContext.success) {
    return {
      success: false,
      source: "localStorage",
      fallback: true,
      message: profileContext.message,
      mediaAsset: null,
    };
  }

  const mediaAssetId = createMediaAssetUuid();
  const storagePath = buildProfilePhotoPath({
    userId: readiness.user.id,
    athleteProfileId: profileContext.profile.id,
    mediaAssetId,
    safeFileName: validation.safeFileName,
  });

  try {
    const { error } = await supabase.storage.from(PROFILE_PHOTO_BUCKET).upload(storagePath, file, {
      cacheControl: "3600",
      contentType: validation.mimeType,
      upsert: false,
    });

    if (error) {
      return {
        success: false,
        source: "supabase",
        fallback: false,
        message: String(error?.message || "Private profile photo upload could not be completed."),
        mediaAsset: null,
      };
    }

    const saveResult = await saveMediaAsset({
      id: mediaAssetId,
      ownerUserId: readiness.user.id,
      athleteProfileId: profileContext.profile.id,
      highlightId: "",
      mediaTypeRaw: "profile_photo",
      bucketName: PROFILE_PHOTO_BUCKET,
      storagePath,
      originalFilename: String(file?.name || validation.safeFileName).trim(),
      mimeType: validation.mimeType,
      fileSizeBytes: validation.fileSizeBytes,
      publicUrl: "",
      signedUrlExpiresAt: "",
      approvalStatusRaw: profileContext.profile.isJunior
        ? "pending_parent_approval"
        : "pending_review",
      visibilityStatusRaw: "private",
      parentGuardianRequired: Boolean(profileContext.profile.isJunior),
      adminReviewRequired: true,
      isJuniorMedia: Boolean(profileContext.profile.isJunior),
      mediaData: {
        uploadKind: "profile_photo",
        uploadPhase: "private_storage_phase_1",
        note: "Private profile photo upload",
      },
    });

    if (!saveResult?.success || saveResult?.source !== "supabase" || saveResult?.fallback === true) {
      await supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([storagePath]);
      return {
        success: false,
        source: saveResult?.source || "localStorage",
        fallback: saveResult?.fallback !== false,
        message:
          saveResult?.message ||
          "The private profile photo upload could not save its media metadata record.",
        mediaAsset: saveResult?.mediaAsset || null,
      };
    }

    const signedResult = await createSignedUrlForAsset(saveResult.mediaAsset, readiness.user);

    return {
      success: true,
      source: "supabase",
      fallback: false,
      mediaAsset: saveResult.mediaAsset,
      signedUrl: signedResult.signedUrl || "",
      signedUrlExpiresAt: signedResult.expiresAt || "",
      fileUploaded: true,
      message: signedResult.success
        ? "Private profile photo uploaded to your Supabase account. The image stays private while parent/guardian or admin approval is pending."
        : "Private profile photo uploaded to your Supabase account. Signed owner preview could not be created right now.",
      ...(await getMediaAssets()),
    };
  } catch (error) {
    return {
      success: false,
      source: "supabase",
      fallback: false,
      message: String(error?.message || "Private profile photo upload could not be completed."),
      mediaAsset: null,
    };
  }
}

export async function uploadHighlightThumbnail({ file, highlightId }) {
  const validation = validatePrivateImageFile(file, HIGHLIGHT_THUMBNAIL_MAX_BYTES);
  if (!validation.valid) {
    return buildThumbnailValidationFailure(validation);
  }

  const readiness = await ensurePrivateStorageReady(HIGHLIGHT_THUMBNAIL_BUCKET);
  if (!readiness.success) {
    return buildThumbnailReadinessFailure(readiness);
  }

  const highlightContext = await getOwnedHighlightContext(readiness.user.id, highlightId);
  if (!highlightContext.success) {
    return buildThumbnailUploadFailure({
      source: "localStorage",
      fallback: true,
      errorCategory: "highlight_not_saved_error",
      errorStage: "highlight_lookup",
      message:
        "Highlight save error: save or resave this highlight to your Supabase account first before uploading a private thumbnail.",
    });
  }

  const profileContext = await getOwnedAthleteProfileContext(
    readiness.user.id,
    highlightContext.highlight.athleteProfileId,
  );
  if (!profileContext.success) {
    return buildThumbnailUploadFailure({
      source: "localStorage",
      fallback: true,
      errorCategory: "athlete_profile_error",
      errorStage: "profile_lookup",
      message:
        "Athlete profile error: create or resave a Supabase-backed athlete profile first before uploading a private thumbnail.",
    });
  }

  const mediaAssetId = createMediaAssetUuid();
  const storagePath = buildHighlightThumbnailPath({
    userId: readiness.user.id,
    highlightId: highlightContext.highlight.id,
    mediaAssetId,
    safeFileName: validation.safeFileName,
  });

  try {
    const { error } = await supabase.storage.from(HIGHLIGHT_THUMBNAIL_BUCKET).upload(storagePath, file, {
      cacheControl: "3600",
      contentType: validation.mimeType,
      upsert: false,
    });

    if (error) {
      return buildThumbnailStorageUploadFailure(error);
    }

    const saveResult = await saveMediaAsset({
      id: mediaAssetId,
      ownerUserId: readiness.user.id,
      athleteProfileId: profileContext.profile.id,
      highlightId: highlightContext.highlight.id,
      mediaTypeRaw: "highlight_thumbnail",
      bucketName: HIGHLIGHT_THUMBNAIL_BUCKET,
      storagePath,
      originalFilename: String(file?.name || validation.safeFileName).trim(),
      mimeType: validation.mimeType,
      fileSizeBytes: validation.fileSizeBytes,
      publicUrl: "",
      signedUrlExpiresAt: "",
      approvalStatusRaw: profileContext.profile.isJunior
        ? "pending_parent_approval"
        : "pending_review",
      visibilityStatusRaw: "private",
      parentGuardianRequired: Boolean(profileContext.profile.isJunior),
      adminReviewRequired: true,
      isJuniorMedia: Boolean(profileContext.profile.isJunior),
      mediaData: {
        uploadKind: "highlight_thumbnail",
        uploadPhase: "private_storage_phase_1",
        note: "Private highlight thumbnail upload",
      },
    });

    if (!saveResult?.success || saveResult?.source !== "supabase" || saveResult?.fallback === true) {
      await supabase.storage.from(HIGHLIGHT_THUMBNAIL_BUCKET).remove([storagePath]);
      return buildThumbnailMetadataFailure(saveResult);
    }

    const signedResult = await createSignedUrlForAsset(saveResult.mediaAsset, readiness.user);

    return {
      success: true,
      source: "supabase",
      fallback: false,
      mediaAsset: saveResult.mediaAsset,
      signedUrl: signedResult.signedUrl || "",
      signedUrlExpiresAt: signedResult.expiresAt || "",
      fileUploaded: true,
      message: signedResult.success
        ? "Private highlight thumbnail uploaded to your Supabase account. The thumbnail stays private while parent/guardian or admin approval is pending, and video upload comes later."
        : "Private highlight thumbnail uploaded to your Supabase account. Signed owner preview could not be created right now.",
      ...(await getMediaAssets()),
    };
  } catch (error) {
    return buildThumbnailStorageUploadFailure(error);
  }
}

function buildUploadPreparationResponse(mediaType) {
  return {
    success: false,
    enabled: false,
    mediaType,
    message: "Video upload is not enabled yet.",
  };
}

export async function prepareProfilePhotoUpload() {
  return {
    success: true,
    enabled: true,
    mediaType: "profile_photo",
    bucketName: PROFILE_PHOTO_BUCKET,
    allowedMimeTypes: [...ALLOWED_IMAGE_MIME_TYPES],
    maxFileSizeBytes: PROFILE_PHOTO_MAX_BYTES,
    message:
      "Private profile photo upload is available when storage_private_phase_1.sql is active and the approval-safe image workflow is enabled.",
  };
}

export async function getVideoUploadReadiness() {
  const backendEnabled = isMediaBackendEnabled() && Boolean(supabase);
  const user = backendEnabled ? await getCurrentUser() : null;
  const tableStatus = await detectMediaAssetsTable();
  const bucketStatus =
    backendEnabled && user?.id
      ? await detectPrivateStorageBuckets(true, user)
      : { highlightVideoDetected: null, message: "" };
  const bucketDetected =
    typeof bucketStatus.highlightVideoDetected === "boolean"
      ? bucketStatus.highlightVideoDetected
      : null;
  const bucketDetectedLabel =
    bucketDetected === true ? "yes" : bucketDetected === false ? "no" : "unknown";
  const uploadEnabled = Boolean(
    backendEnabled && user?.id && tableStatus?.detected === true && bucketDetected === true,
  );

  let message =
    "Video upload is planned but not enabled yet. For now, add highlight metadata and upload a private thumbnail.";
  if (!backendEnabled) {
    message =
      "Video upload planning is in place, but the Supabase media backend is not enabled yet. Public video access stays disabled.";
  } else if (!user?.id) {
    message =
      "Sign in with a Supabase account to prepare for private highlight video uploads later. Public video access stays disabled.";
  } else if (!tableStatus?.detected) {
    message =
      tableStatus?.message ||
      "Run media_assets_phase_1.sql before private highlight video uploads can be enabled later.";
  } else if (bucketDetected) {
    message =
      "Private highlight video owner testing is active. Uploads stay private, approval-gated, and signed-preview only.";
  } else {
    message =
      bucketStatus?.message ||
      "Run video_storage_private_phase_1.sql to enable private highlight video owner testing.";
  }

  return {
    success: true,
    enabled: uploadEnabled,
    uploadEnabled,
    mediaType: "highlight_video",
    bucketName: HIGHLIGHT_VIDEO_BUCKET,
    bucketDetected,
    bucketDetectedLabel,
    allowedMimeTypes: [...ALLOWED_VIDEO_MIME_TYPES],
    allowedTypesLabel: "MP4, MOV, WEBM",
    maxFileSizeBytes: HIGHLIGHT_VIDEO_MAX_BYTES,
    maxFileSizeLabel: "100MB",
    backendEnabled,
    signedIn: Boolean(user?.id),
    mediaAssetsReady: Boolean(tableStatus?.detected),
    publicMediaAccess: false,
    publicUrlsEnabled: false,
    signedPreviewOnly: true,
    videoUploadsEnabled: uploadEnabled,
    videoUploadsLabel: uploadEnabled ? "Private owner test only" : "Disabled",
    juniorApprovalRequired: true,
    adminReviewRequired: true,
    noPublicBrowsing: true,
    bucketErrorMessage: "",
    message,
  };
}

export async function prepareHighlightVideoUpload() {
  const readiness = await getVideoUploadReadiness();
  return {
    ...readiness,
    success: true,
    enabled: readiness.enabled,
    message:
      readiness.message ||
      "Private highlight video upload is ready for owner testing only.",
  };
}

export async function prepareThumbnailUpload() {
  return {
    success: true,
    enabled: true,
    mediaType: "highlight_thumbnail",
    bucketName: HIGHLIGHT_THUMBNAIL_BUCKET,
    allowedMimeTypes: [...ALLOWED_IMAGE_MIME_TYPES],
    maxFileSizeBytes: HIGHLIGHT_THUMBNAIL_MAX_BYTES,
    message:
      "Private highlight thumbnail upload is available when storage_private_phase_1.sql is active and the approval-safe image workflow is enabled.",
    };
}

function buildVideoUploadFailure({
  message,
  errorCategory = "unknown_error",
  errorStage = "upload",
  source = "supabase",
  fallback = false,
  mediaAsset = null,
  canRetry = true,
  fileUploaded = false,
}) {
  return {
    success: false,
    source,
    fallback,
    message,
    mediaAsset,
    fileUploaded,
    errorCategory,
    errorStage,
    canRetry,
  };
}

function buildLabelledVideoError(label, message, fallbackMessage) {
  const nextMessage = String(message || fallbackMessage || "").trim();
  if (!nextMessage) {
    return label;
  }

  return normalizeText(nextMessage).startsWith(normalizeText(label))
    ? nextMessage
    : `${label}: ${nextMessage}`;
}

function buildVideoValidationFailure(validation) {
  const message = String(validation?.message || "").trim();
  const normalized = normalizeText(message);

  if (normalized.includes("mp4") || normalized.includes("mov") || normalized.includes("webm")) {
    return buildVideoUploadFailure({
      source: "localStorage",
      fallback: true,
      errorCategory: "file_type_error",
      errorStage: "validation",
      canRetry: false,
      message: "File type error: only MP4, MOV, and WEBM private highlight videos are supported in this phase.",
    });
  }

  if (normalized.includes("100mb")) {
    return buildVideoUploadFailure({
      source: "localStorage",
      fallback: true,
      errorCategory: "file_size_error",
      errorStage: "validation",
      canRetry: false,
      message: "File size error: private highlight videos must be 100MB or smaller in this phase.",
    });
  }

  if (normalized.includes("choose")) {
    return buildVideoUploadFailure({
      source: "localStorage",
      fallback: true,
      errorCategory: "file_missing_error",
      errorStage: "validation",
      canRetry: false,
      message: "Choose a private MP4, MOV, or WEBM highlight video first.",
    });
  }

  return buildVideoUploadFailure({
    source: "localStorage",
    fallback: true,
    errorCategory: validation?.errorCategory || "validation_error",
    errorStage: "validation",
    canRetry: false,
    message: buildLabelledVideoError("Unknown error", message, "Private highlight video validation failed."),
  });
}

function buildVideoReadinessFailure(readiness) {
  const message = String(readiness?.message || "").trim();
  const normalized = normalizeText(message);

  if (normalized.includes("sign in")) {
    return buildVideoUploadFailure({
      source: readiness?.source || "localStorage",
      fallback: readiness?.fallback !== false,
      errorCategory: "auth_session_error",
      errorStage: "readiness",
      message: "Auth/session error: sign in with your Supabase account first before uploading a private highlight video.",
    });
  }

  if (normalized.includes("video_storage_private_phase_1.sql") || normalized.includes("video owner testing")) {
    return buildVideoUploadFailure({
      source: readiness?.source || "localStorage",
      fallback: readiness?.fallback !== false,
      errorCategory: "bucket_error",
      errorStage: "readiness",
      message: `Storage bucket error: ${HIGHLIGHT_VIDEO_BUCKET} is not ready yet. Run video_storage_private_phase_1.sql first.`,
    });
  }

  if (normalized.includes("media_assets")) {
    return buildVideoUploadFailure({
      source: readiness?.source || "localStorage",
      fallback: readiness?.fallback !== false,
      errorCategory: "media_assets_insert_update_error",
      errorStage: "readiness",
      message:
        "media_assets error: media_assets metadata is not ready yet. Run media_assets_phase_1.sql before private highlight video uploads.",
    });
  }

  return buildVideoUploadFailure({
    source: readiness?.source || "localStorage",
    fallback: readiness?.fallback !== false,
    errorCategory: "unknown_error",
    errorStage: "readiness",
    message:
      buildLabelledVideoError(
        "Unknown error",
        message,
        "Private highlight video upload is not ready yet.",
      ),
  });
}

function buildVideoStorageUploadFailure(error) {
  const message = String(error?.message || "").trim();
  const normalized = normalizeText(message);

  if (isMissingStorageBucketError(error)) {
    return buildVideoUploadFailure({
      errorCategory: "bucket_error",
      errorStage: "storage_upload",
      message: `Storage bucket error: ${HIGHLIGHT_VIDEO_BUCKET} is not available for private highlight video uploads yet.`,
    });
  }

  if (
    normalized.includes("row level security") ||
    normalized.includes("policy") ||
    normalized.includes("permission denied") ||
    normalized.includes("not allowed")
  ) {
    return buildVideoUploadFailure({
      errorCategory: "storage_policy_error",
      errorStage: "storage_upload",
      message:
        "Storage policy error: your signed-in account cannot write to this private highlight video path yet.",
    });
  }

  if (
    normalized.includes("jwt") ||
    normalized.includes("token") ||
    normalized.includes("session") ||
    normalized.includes("auth") ||
    normalized.includes("unauthorized")
  ) {
    return buildVideoUploadFailure({
      errorCategory: "auth_session_error",
      errorStage: "storage_upload",
      message:
        "Auth/session error: sign in with your Supabase account again before uploading a private highlight video.",
    });
  }

  return buildVideoUploadFailure({
    errorCategory: "unknown_error",
    errorStage: "storage_upload",
    message:
      buildLabelledVideoError(
        "Unknown error",
        message,
        "Private highlight video upload could not be completed.",
      ),
  });
}

function buildVideoMetadataFailure(saveResult) {
  return buildVideoUploadFailure({
    source: saveResult?.source || "localStorage",
    fallback: saveResult?.fallback !== false,
    errorCategory: "media_assets_insert_update_error",
    errorStage: "metadata_save",
    message:
      buildLabelledVideoError(
        "media_assets insert/update error",
        saveResult?.message,
        "The video file uploaded, but the media metadata row could not be saved to Supabase.",
      ),
  });
}

export async function uploadHighlightVideoPlaceholder({
  highlightId = "",
  athleteProfileId = "",
} = {}) {
  const readiness = await getVideoUploadReadiness();
  if (!readiness.enabled) {
    return {
      success: false,
      enabled: false,
      fallback: true,
      source: readiness.signedIn ? "supabase" : "localStorage",
      errorCategory: "video_upload_disabled",
      message:
        readiness.message ||
        "Private highlight video owner testing is not ready yet.",
      ...readiness,
    };
  }

  const user = await getCurrentUser();
  const highlightContext = await getOwnedHighlightContext(user?.id, highlightId);
  if (!highlightContext.success) {
    return buildVideoUploadFailure({
      source: "localStorage",
      fallback: true,
      errorCategory: "highlight_not_saved_error",
      errorStage: "highlight_lookup",
      message:
        "Highlight save error: save or resave this highlight to your Supabase account first before running the private video QA test.",
    });
  }

  const profileContext = await getOwnedAthleteProfileContext(
    user?.id,
    athleteProfileId || highlightContext.highlight.athleteProfileId,
  );
  if (!profileContext.success) {
    return buildVideoUploadFailure({
      source: "localStorage",
      fallback: true,
      errorCategory: "athlete_profile_error",
      errorStage: "profile_lookup",
      message:
        "Athlete profile error: create or resave a Supabase-backed athlete profile first before running the private video QA test.",
    });
  }

  const mediaAssetId = createMediaAssetUuid();
  const saveResult = await saveMediaAsset({
    id: mediaAssetId,
    ownerUserId: user.id,
    athleteProfileId: profileContext.profile.id,
    highlightId: highlightContext.highlight.id,
    mediaTypeRaw: "highlight_video",
    bucketName: HIGHLIGHT_VIDEO_BUCKET,
    storagePath: `user/${user.id}/highlights/${highlightContext.highlight.id}/qa-not-uploaded-placeholder.webm`,
    originalFilename: "msr-video-test-placeholder.webm",
    mimeType: "video/webm",
    fileSizeBytes: 0,
    publicUrl: "",
    signedUrlExpiresAt: "",
    approvalStatusRaw: profileContext.profile.isJunior ? "pending_parent_approval" : "pending_review",
    visibilityStatusRaw: "private",
    parentGuardianRequired: Boolean(profileContext.profile.isJunior),
    adminReviewRequired: true,
    isJuniorMedia: Boolean(profileContext.profile.isJunior),
    mediaData: {
      uploadKind: "highlight_video",
      uploadPhase: "private_video_phase_1_metadata_only_test",
      note: "Temporary QA private highlight video metadata record. No real video file uploaded.",
    },
  });

  if (!saveResult?.success || saveResult?.source !== "supabase" || saveResult?.fallback === true) {
    return buildVideoMetadataFailure(saveResult);
  }

  return {
    success: true,
    source: "supabase",
    fallback: false,
    fileUploaded: false,
    mediaAsset: saveResult.mediaAsset,
    message:
      "Private highlight video bucket and media_assets metadata are ready. No real video file was uploaded by this QA test, so manual private video upload is still required.",
    ...(await getMediaAssets()),
  };
}

export async function uploadHighlightVideo({ file, highlightId }) {
  const validation = validateHighlightVideoFile(file);
  if (!validation.valid) {
    return buildVideoValidationFailure(validation);
  }

  const readiness = await ensurePrivateStorageReady(HIGHLIGHT_VIDEO_BUCKET);
  if (!readiness.success) {
    return buildVideoReadinessFailure(readiness);
  }

  const highlightContext = await getOwnedHighlightContext(readiness.user.id, highlightId);
  if (!highlightContext.success) {
    return buildVideoUploadFailure({
      source: "localStorage",
      fallback: true,
      errorCategory: "highlight_not_saved_error",
      errorStage: "highlight_lookup",
      message:
        "Highlight save error: save or resave this highlight to your Supabase account first before uploading a private highlight video.",
    });
  }

  const profileContext = await getOwnedAthleteProfileContext(
    readiness.user.id,
    highlightContext.highlight.athleteProfileId,
  );
  if (!profileContext.success) {
    return buildVideoUploadFailure({
      source: "localStorage",
      fallback: true,
      errorCategory: "athlete_profile_error",
      errorStage: "profile_lookup",
      message:
        "Athlete profile error: create or resave a Supabase-backed athlete profile first before uploading a private highlight video.",
    });
  }

  const currentHighlightMediaResult = await getMediaAssetsByHighlightId(highlightContext.highlight.id);
  const existingVideoAsset = getLatestSupabaseHighlightVideoAsset(
    currentHighlightMediaResult?.mediaAssets,
    highlightContext.highlight.id,
  );

  const mediaAssetId = createMediaAssetUuid();
  const storagePath = buildHighlightVideoPath({
    userId: readiness.user.id,
    highlightId: highlightContext.highlight.id,
    mediaAssetId,
    safeFileName: validation.safeFileName,
  });

  try {
    const { error } = await supabase.storage.from(HIGHLIGHT_VIDEO_BUCKET).upload(storagePath, file, {
      cacheControl: "3600",
      contentType: validation.mimeType,
      upsert: false,
    });

    if (error) {
      return buildVideoStorageUploadFailure(error);
    }

    const saveResult = await saveMediaAsset({
      id: mediaAssetId,
      ownerUserId: readiness.user.id,
      athleteProfileId: profileContext.profile.id,
      highlightId: highlightContext.highlight.id,
      mediaTypeRaw: "highlight_video",
      bucketName: HIGHLIGHT_VIDEO_BUCKET,
      storagePath,
      originalFilename: String(file?.name || validation.safeFileName).trim(),
      mimeType: validation.mimeType,
      fileSizeBytes: validation.fileSizeBytes,
      publicUrl: "",
      signedUrlExpiresAt: "",
      approvalStatusRaw: profileContext.profile.isJunior ? "pending_parent_approval" : "pending_review",
      visibilityStatusRaw: "private",
      parentGuardianRequired: Boolean(profileContext.profile.isJunior),
      adminReviewRequired: true,
      isJuniorMedia: Boolean(profileContext.profile.isJunior),
      mediaData: {
        uploadKind: "highlight_video",
        uploadPhase: "private_video_phase_1",
        note: "Private highlight video upload",
      },
    });

    if (!saveResult?.success || saveResult?.source !== "supabase" || saveResult?.fallback === true) {
      await supabase.storage.from(HIGHLIGHT_VIDEO_BUCKET).remove([storagePath]);
      return buildVideoMetadataFailure(saveResult);
    }

    const signedResult = await createSignedUrlForAsset(saveResult.mediaAsset, readiness.user);
    let replacedMediaAssetId = "";
    let replacedMediaAssetDeleted = null;
    let replacedDeletedObjectPath = "";
    let replaceMessage = "";

    if (existingVideoAsset?.id && existingVideoAsset.id !== saveResult.mediaAsset.id) {
      const replaceCleanupResult = await deleteStoredMediaAsset(existingVideoAsset.id);
      replacedMediaAssetId = existingVideoAsset.id;
      replacedMediaAssetDeleted = Boolean(replaceCleanupResult?.success);
      replacedDeletedObjectPath =
        replaceCleanupResult?.deletedObjectPath || existingVideoAsset.storagePath || "";
      replaceMessage = replaceCleanupResult?.success
        ? "Replace complete: the previous private highlight video was deleted after the new private upload succeeded."
        : `Replace note: the new private highlight video uploaded, but the previous private video could not be deleted automatically yet. ${
            replaceCleanupResult?.message || "Delete it manually from the panel if needed."
          }`;
    }

    const baseMessage = signedResult.success
      ? "Private highlight video uploaded to your Supabase account. It stays private, approval-gated, and visible through signed owner preview only."
      : "Private highlight video uploaded to your Supabase account. Signed owner preview could not be created right now.";

    return {
      success: true,
      source: "supabase",
      fallback: false,
      mediaAsset: saveResult.mediaAsset,
      signedUrl: signedResult.signedUrl || "",
      signedUrlExpiresAt: signedResult.expiresAt || "",
      fileUploaded: true,
      replacedMediaAssetId,
      replacedMediaAssetDeleted,
      replacedDeletedObjectPath,
      replaceMessage,
      message: replaceMessage ? `${baseMessage} ${replaceMessage}` : baseMessage,
      ...(await getMediaAssets()),
    };
  } catch (error) {
    return buildVideoStorageUploadFailure(error);
  }
}

export async function createSignedVideoUrl(mediaAssetId) {
  const current = await getMediaAssets();
  const asset = current.mediaAssets.find((item) => item.id === mediaAssetId) || null;

  if (!asset) {
    return {
      success: false,
      signedUrl: "",
      expiresAt: "",
      message: "Private highlight video asset not found.",
    };
  }

  if (asset.mediaTypeRaw !== "highlight_video") {
    return {
      success: false,
      signedUrl: "",
      expiresAt: "",
      message: "This media asset is not a private highlight video.",
    };
  }

  return createSignedMediaUrl(mediaAssetId);
}

export async function deleteStoredHighlightVideo(mediaAssetId) {
  const current = await getMediaAssets();
  const asset = current.mediaAssets.find((item) => item.id === mediaAssetId) || null;

  if (!asset) {
    return {
      success: false,
      message: "Private highlight video asset not found.",
      deletedMediaAssetId: null,
    };
  }

  if (asset.mediaTypeRaw !== "highlight_video") {
    return {
      success: false,
      message: "This media asset is not a private highlight video.",
      deletedMediaAssetId: null,
    };
  }

  return deleteStoredMediaAsset(mediaAssetId);
}
