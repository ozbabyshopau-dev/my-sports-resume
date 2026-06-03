import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  sampleAdminQueue as adminSeed,
  sampleAthletes,
  sampleHighlights,
  sampleParentAccounts,
  sampleVerifiedAccounts,
} from "./data/sampleData";
import mySportsResumeApprovedLogo from "./assets/my-sports-resume-approved-logo.png";
import msrHeroBanner from "./assets/msr-hero-banner.png";
import {
  AUSTRALIAN_AGE_GROUPS,
  COMPETITION_LEVELS,
  SPORT_CATEGORIES,
  sportsCatalog,
} from "./data/sportsCatalog";
import {
  AUSTRALIAN_CUSTOM_CLUB_VALUE,
  getAgeGroupsForClub,
  getAgeGroupsForSport as getDirectoryAgeGroupsForSport,
  getClubByName,
  getClubSuggestionsByPostcode,
  getClubSuggestionsBySuburb,
  getHighlightTypesForSport as getDirectoryHighlightTypesForSport,
  getMainSportsList,
  getNearbySportsDirectory,
  getNearbyClubSuggestions,
  getPositionsForSport as getDirectoryPositionsForSport,
} from "./data/australianSportsClubDirectory";
import { opportunitySeed } from "./data/opportunitySeed";
import {
  getAccountProfile,
  getCurrentSession,
  getCurrentRole,
  getDemoAccount,
  isRealAuthEnabled,
  saveAccountRole,
  setCurrentRole,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from "./services/authService";
import {
  getBackendReadinessMessage,
  getDataMode,
  isBackendEnabled,
} from "./services/dataMode";
import {
  deleteProfile as deleteManagedProfile,
  getProfiles as getManagedProfiles,
  saveProfile as saveManagedProfile,
} from "./services/profileDataService";
import {
  deleteHighlight as deleteManagedHighlight,
  getHighlights as getManagedHighlights,
  saveHighlight as saveManagedHighlight,
} from "./services/highlightDataService";
import {
  deleteOpportunity as deleteManagedOpportunity,
  getOpportunities as getManagedOpportunities,
  saveOpportunity as saveManagedOpportunity,
} from "./services/opportunityDataService";
import {
  deleteContactRequest as deleteManagedContactRequest,
  getContactRequests as getManagedContactRequests,
  saveContactRequest as saveManagedContactRequest,
} from "./services/contactRequestDataService";
import {
  deleteAdminQueueItem as deleteManagedAdminQueueItem,
  getAdminQueueItems as getManagedAdminQueueItems,
  saveAdminQueueItem as saveManagedAdminQueueItem,
  updateAdminQueueItem as updateManagedAdminQueueItem,
} from "./services/adminQueueDataService";
import {
  approveMediaAsset as approveManagedMediaAsset,
  archiveMediaAsset as archiveManagedMediaAsset,
  canOwnerViewMedia as canManagedOwnerViewMedia,
  canSignedInPreviewMedia as canManagedSignedInPreviewMedia,
  getSignedMediaPreview as getManagedSignedMediaPreview,
  createSignedVideoUrl as createManagedSignedVideoUrl,
  createSignedMediaUrl as createManagedSignedMediaUrl,
  deleteMediaAsset as deleteManagedMediaAsset,
  deleteStoredHighlightVideo as deleteManagedStoredHighlightVideo,
  deleteStoredMediaAsset as deleteManagedStoredMediaAsset,
  getMediaAssets as getManagedMediaAssets,
  getVideoUploadReadiness as getManagedVideoUploadReadiness,
  markMediaProfileOnly as markManagedMediaProfileOnly,
  rejectMediaAsset as rejectManagedMediaAsset,
  saveMediaAsset as saveManagedMediaAsset,
  updateMediaAsset as updateManagedMediaAsset,
  uploadHighlightVideo as uploadManagedHighlightVideo,
  uploadHighlightThumbnail as uploadManagedHighlightThumbnail,
  uploadHighlightVideoPlaceholder as uploadManagedHighlightVideoPlaceholder,
  uploadProfilePhoto as uploadManagedProfilePhoto,
} from "./services/mediaAssetService";
import {
  archiveShortlistRecord as archiveManagedShortlistRecord,
  getShortlist as getManagedShortlist,
  removeShortlistRecord as deleteManagedShortlistRecord,
  saveShortlistRecord as saveManagedShortlistRecord,
} from "./services/shortlistDataService";
import { APP_ADMIN_EMAIL, APP_SUPPORT_EMAIL } from "./config/appConfig";
import { readLocalData, removeLocalData, writeLocalData } from "./services/localDataService";
import { getSupabaseStatus } from "./services/supabaseClient";
import { teamDirectorySeed } from "./data/teamDirectorySeed";
import {
  getNswRugbyLeagueClubsByGroup,
  getNswRugbyLeagueCompetitionLevelOptions,
  getNswRugbyLeagueCompetitionOptions,
  getNswRugbyLeagueDefaultCompetition,
  getNswRugbyLeagueDefaultCompetitionLevel,
  getNswRugbyLeagueGroupOptions,
  isNswRugbyLeagueSportState,
  NSW_RUGBY_LEAGUE_AGE_GROUP_OPTIONS,
  NSW_RUGBY_LEAGUE_CUSTOM_CLUB_VALUE,
  NSW_RUGBY_LEAGUE_DIRECTORY_LABEL,
  NSW_RUGBY_LEAGUE_FILTER_AGE_GROUP_OPTIONS,
  NSW_RUGBY_LEAGUE_HIGHLIGHT_TYPE_OPTIONS,
  NSW_RUGBY_LEAGUE_OTHER_OPTION,
  NSW_RUGBY_LEAGUE_OTHER_REGION_VALUE,
  NSW_RUGBY_LEAGUE_POSITION_OPTIONS,
} from "./data/nswRugbyLeagueDirectory";

const DEFAULT_SELECTED_ROLE = "junior_athlete";

const STORAGE_KEYS = {
  athletes: "msr_profiles_v1",
  highlights: "msr_highlights_v1",
  requests: "msr_contact_requests_v1",
  adminQueues: "msr_admin_queues_v1",
  mediaAssets: "msr_media_assets_v1",
  opportunities: "msr_opportunities_v1",
  shortlist: "msr_shortlist_v1",
  selectedRole: "msr_selected_role_v1",
};

const VISIBILITY_OPTIONS = [
  "Private",
  "Club Verified",
  "Scout Visible",
  "Showcase Approved",
];

const RUGBY_LEAGUE_MATCH_TYPE_OPTIONS = [
  "Club game",
  "Trial",
  "Training",
  "Carnival",
  "Representative game",
  "Final",
  "Grand final",
  "School game",
  "Academy session",
  "Other",
];

const RUGBY_LEAGUE_ROUND_OPTIONS = [
  "Not sure",
  "Round 1",
  "Round 2",
  "Round 3",
  "Round 4",
  "Round 5",
  "Round 6",
  "Round 7",
  "Round 8",
  "Round 9",
  "Round 10",
  "Round 11",
  "Round 12",
  "Round 13",
  "Round 14",
  "Round 15",
  "Round 16",
  "Semi-final",
  "Preliminary final",
  "Grand final",
  "Other",
];

const DEFAULT_PHYSICAL_DETAILS = {
  height: "",
  weight: "",
  dominantSide: "",
  preferredSide: "",
  fitnessNotes: "",
  speedMetrics: "",
};

const DEFAULT_PLAYING_HISTORY = {
  currentTeam: "",
  previousTeams: [],
  yearsPlayed: "",
  mainCompetition: "",
  representativeHistory: [],
  schoolHistory: [],
  academyHistory: [],
};

const QUICK_PROFILE_SETUP_STEPS = [
  "Who is the athlete?",
  "Choose sport and location",
  "Club, age group and position",
  "Save profile",
];

const SPORT_FIRST_PATHWAY_OPTIONS = [
  "Rugby League",
  "Soccer",
  "Netball",
  "Basketball",
  "AFL",
  "Cricket",
  "Rugby Union",
  "Boxing",
  "Athletics",
  "Swimming",
  "Tennis",
  "Other",
];

const SPORT_PATHWAY_SUMMARIES = {
  "Rugby League": {
    description: "Find your local club by postcode, choose your age group, then build a clean player resume.",
    pathway: "Under 6 to Under 18, then senior grades and representative pathways.",
  },
  Soccer: {
    description: "Set up a football resume with your club, position, and best game moments in a few steps.",
    pathway: "Junior age groups, school and academy pathways, then open and senior club football.",
  },
  Netball: {
    description: "Show your position, club, and key playmaking or defensive highlights in one tidy profile.",
    pathway: "Junior netball pathways through to open divisions, representative squads, and women's pathways.",
  },
  Basketball: {
    description: "Build a player card with your club, role, and scoring or defensive highlight clips.",
    pathway: "Junior reps, club basketball, academy pathways, then open and senior grades.",
  },
  AFL: {
    description: "Create an AFL profile around club, role, and match-impact highlights.",
    pathway: "Junior football, school and academy pathways, then open-age and senior club opportunities.",
  },
  Cricket: {
    description: "Build a cricket resume with your club, role, and batting, bowling, or fielding highlights.",
    pathway: "Junior grades, school and representative cricket, then open and senior club pathways.",
  },
  "Rugby Union": {
    description: "Show where you play, what role you cover, and the clips that prove your game impact.",
    pathway: "Junior rugby, school and representative pathways, then colts, grade, and senior opportunities.",
  },
  Boxing: {
    description: "Create a combat-sport profile with your club, pathway, and technical or competition clips.",
    pathway: "Junior and youth development, then open divisions and masters where relevant.",
  },
  Athletics: {
    description: "Build an athletics profile with event focus, PB context, and race or technique clips.",
    pathway: "Age-group track and field, school pathways, then open and masters competition.",
  },
  Swimming: {
    description: "Show stroke focus, age pathway, and race or technique footage in a clean profile.",
    pathway: "Junior squad pathways, school and club meets, then open and masters competition.",
  },
  Tennis: {
    description: "Build a tennis resume with your program, pathway, and match or technique highlights.",
    pathway: "Junior development, school and club events, then open and masters competition.",
  },
  Other: {
    description: "Start with the sport, postcode, and club, then shape the profile with roles and highlights later.",
    pathway: "Use the standard age pathway first, then add more detail as the sport space expands.",
  },
};

const PROFILE_YEARS_PLAYED_OPTIONS = [
  "First season",
  "1-2 seasons",
  "3-5 seasons",
  "6+ seasons",
  "Not sure",
];

const RUGBY_LEAGUE_PROFILE_STAT_CHIPS = [
  "Tries",
  "Try assists",
  "Line breaks",
  "Tackles",
  "Tackle efficiency",
  "Run metres",
  "Goal kicks",
  "Other",
];

const PROFILE_ACHIEVEMENT_QUICK_CHIPS = [
  { label: "Team award", field: "awards" },
  { label: "Best and fairest", field: "bestAndFairest" },
  { label: "Player of the match", field: "mvpAwards" },
  { label: "Representative selection", field: "representativeSelections" },
  { label: "Grand final", field: "finalsHistory" },
  { label: "Carnival / tournament", field: "carnivalResults" },
  { label: "Captain / leadership", field: "otherAchievements" },
  { label: "Other", field: "otherAchievements" },
];

const DEFAULT_ACHIEVEMENT_SECTIONS = {
  awards: [],
  representativeSelections: [],
  finalsHistory: [],
  mvpAwards: [],
  bestAndFairest: [],
  carnivalResults: [],
  otherAchievements: [],
};

const DEFAULT_REFERENCES = {
  coachName: "",
  coachRole: "",
};

const ACHIEVEMENT_SECTION_LABELS = {
  awards: "Awards",
  representativeSelections: "Representative selections",
  finalsHistory: "Premierships / finals",
  mvpAwards: "MVP / player awards",
  bestAndFairest: "Best and fairest",
  carnivalResults: "Carnival / tournament results",
  otherAchievements: "Other achievements",
};

const HIGHLIGHT_SHOWCASE_OPTIONS = [
  "Private",
  "Profile Only",
  "Showcase Requested",
  "Showcase Approved",
];

const HIGHLIGHT_VERIFICATION_SOURCES = ["Parent", "Coach", "Club", "Admin", "Unverified"];

const HIGHLIGHT_APPROVAL_OPTIONS = [
  "Pending Parent Approval",
  "Pending Admin Review",
  "Parent Approved",
  "Coach Verified",
  "Club Verified",
  "Admin Approved",
  "Admin Reviewed",
  "Request Changes",
  "Rejected",
];

const OPPORTUNITY_TYPE_OPTIONS = [
  "Club recruitment",
  "First grade signing",
  "Reserve grade signing",
  "Academy trial",
  "School sport opportunity",
  "Representative trial",
  "Development squad",
  "Training invite",
  "Coach review",
];

const OPPORTUNITY_VERIFICATION_OPTIONS = [
  "Verified organisation",
  "Pending Admin Verification",
  "Admin Reviewed",
  "Rejected",
];

const HIGHLIGHT_TAGS_BY_SPORT = {
  "rugby-league": NSW_RUGBY_LEAGUE_HIGHLIGHT_TYPE_OPTIONS.filter(
    (item) => item !== NSW_RUGBY_LEAGUE_OTHER_OPTION,
  ),
  afl: [
    "Goal",
    "Mark",
    "Tackle",
    "Clearance",
    "Inside 50",
    "Intercept",
    "Ruck contest",
    "Running carry",
  ],
  "soccer-football": [
    "Goal",
    "Assist",
    "Save",
    "Tackle",
    "Pass",
    "Dribble",
    "Pressing",
    "Set piece",
  ],
  cricket: ["Batting", "Bowling", "Catch", "Run out", "Wicket", "Fielding", "Innings highlight"],
  netball: [
    "Goal",
    "Intercept",
    "Feed",
    "Defensive pressure",
    "Rebound",
    "Centre pass",
    "Movement",
  ],
  basketball: ["Shot", "Assist", "Rebound", "Block", "Steal", "Defence", "Fast break"],
  swimming: ["Race", "Personal best", "Start", "Finish", "Technique", "Carnival", "Final"],
  athletics: ["Race", "Personal best", "Start", "Finish", "Technique", "Carnival", "Final"],
};

const PROFILE_DEFAULTS = {
  id: "",
  displayName: "",
  ageGroup: "",
  sportId: "rugby-league",
  sportCategory: "Football codes",
  isJunior: true,
  sport: "Rugby League",
  position: "",
  secondaryPosition: "",
  region: "",
  state: "",
  postcode: "",
  suburb: "",
  club: "",
  teamDirectoryId: "",
  clubEntryType: "custom",
  isVerifiedClubEntry: false,
  profileSummary: "",
  competition: "",
  competitionLevel: "Local Club",
  verificationBadges: [],
  achievements: [],
  achievementSections: DEFAULT_ACHIEVEMENT_SECTIONS,
  stats: [],
  physicalDetails: DEFAULT_PHYSICAL_DETAILS,
  playingHistory: DEFAULT_PLAYING_HISTORY,
  references: DEFAULT_REFERENCES,
  availability: {
    openToTrials: false,
    openToAcademy: false,
    openToSchoolSport: false,
    openToRepresentativePathways: false,
    openToSeniorSigning: false,
    openToFirstGrade: false,
    openToReserveGrade: false,
    willingToRelocate: false,
    preferredLocations: "",
  },
  profileStatus: "Draft",
  visibilityStatus: "Private",
  highlights: [],
  contactRoute: "parent_guardian",
};

const HIGHLIGHT_DEFAULTS = {
  id: "",
  athleteId: "",
  title: "",
  description: "",
  statusLabel: "Rising Highlight",
  sportId: "",
  sportCategory: "",
  sport: "",
  ageGroup: "",
  position: "",
  positionPlayed: "",
  region: "",
  state: "",
  competition: "",
  competitionLevel: "",
  isJunior: true,
  highlightType: "Match highlight",
  matchEvent: "",
  eventName: "",
  date: "",
  eventDate: "",
  opponent: "",
  videoUrl: "",
  thumbnailUrl: "",
  verificationSource: "Unverified",
  approvalStatus: "Pending Admin Review",
  showcaseStatus: "Profile Only",
  verificationStatus: "Pending review",
  tag: "Rising Highlight",
  boostCount: 0,
  isBoosted: false,
  isFeatured: false,
  visibilityStatus: "Pending Verification",
  createdAt: "",
  updatedAt: "",
};

const OPPORTUNITY_DEFAULTS = {
  id: "",
  title: "",
  organisation: "",
  contactRoleTitle: "",
  sport: "",
  sportCategory: "",
  sportId: "",
  positionRole: "",
  ageGroup: "",
  isJuniorOpportunity: false,
  juniorSenior: "Senior",
  state: "",
  region: "",
  postcode: "",
  suburb: "",
  competitionLevel: "",
  opportunityType: "Club recruitment",
  description: "",
  requirements: "",
  verificationStatus: "Pending Admin Verification",
  opportunityStatus: "Draft",
  contactRoute: "Contact requests only",
  visibilityStatus: "Private",
  closingDate: "",
  createdAt: "",
  updatedAt: "",
  createdByRole: "club_scout",
  source: "seed",
  storageSource: "localStorage",
  opportunityData: {},
};

const SHORTLIST_DEFAULTS = {
  id: "",
  athleteId: "",
  athleteProfileId: "",
  athleteOwnerUserId: null,
  athleteDisplayName: "",
  athleteSport: "",
  athleteSportId: "",
  athletePositionRole: "",
  athleteAgeGroup: "",
  athleteState: "",
  athleteRegion: "",
  shortlistType: "Athlete Shortlist",
  shortlistTypeRaw: "athlete_shortlist",
  shortlistStatus: "Active",
  sourceContext: "manual",
  notes: "",
  noDirectMessaging: true,
  createdAt: "",
  updatedAt: "",
  createdByRole: "club_scout",
  source: "local-shortlist",
  storageSource: "localStorage",
  shortlistData: {},
};

const ADMIN_QUEUE_DEFAULTS = {
  pendingProfiles: [],
  pendingHighlights: [],
  pendingOpportunities: [],
  verificationRequests: [],
  flaggedContent: [],
};

const SAFETY_COPY =
  "Verified sports profiles, highlights, and safe contact pathways built for serious athlete visibility.";

const SPORTS_BY_ID = Object.fromEntries(sportsCatalog.map((sport) => [sport.id, sport]));
const TEAMS_BY_ID = Object.fromEntries(teamDirectorySeed.map((team) => [team.id, team]));
const STATE_OPTIONS = [
  "NSW",
  "VIC",
  "QLD",
  "WA",
  "SA",
  "TAS",
  "ACT",
  "NT",
];
const SIGNUP_RATE_LIMIT_COOLDOWN_SECONDS = 90;
const MANUAL_SUPABASE_USER_STEPS = [
  "Supabase -> Authentication -> Users",
  "Add user",
  "Use your test email",
  "Set password",
  "Auto-confirm or manually confirm user",
  "Return to this app",
  "Use Login",
];

const ROLE_DEFINITIONS = {
  junior_athlete: {
    id: "junior_athlete",
    label: "Junior athlete",
    eyebrow: "Junior athlete pathway",
    description: "Create a sports resume with parent or guardian approval.",
    nextPath: "/create-profile",
    navItems: [
      { label: "Home", to: "/" },
      { label: "Profile", to: "/my-profile" },
      { label: "Highlights", to: "/highlights" },
      { label: "Opportunities", to: "/opportunities" },
      { label: "More", to: "/more" },
    ],
    ctaLabel: "Create Resume",
    ctaTo: "/create-profile",
    secondaryLabel: "Switch Role",
    secondaryTo: "/start",
  },
  parent_guardian: {
    id: "parent_guardian",
    label: "Parent / guardian",
    eyebrow: "Guardian oversight",
    description: "Approve and manage your child's sports resume safely.",
    nextPath: "/my-profile",
    navItems: [
      { label: "Home", to: "/" },
      { label: "Child", to: "/my-profile" },
      { label: "Approvals", to: "/parent" },
      { label: "Requests", to: "/requests" },
      { label: "More", to: "/more" },
    ],
    ctaLabel: "Open Approvals",
    ctaTo: "/parent",
    secondaryLabel: "Switch Role",
    secondaryTo: "/start",
  },
  adult_athlete: {
    id: "adult_athlete",
    label: "18+ athlete",
    eyebrow: "Senior athlete pathway",
    description: "Build a sports resume for clubs, first-grade teams, and opportunities.",
    nextPath: "/create-profile",
    navItems: [
      { label: "Home", to: "/" },
      { label: "Profile", to: "/my-profile" },
      { label: "Opportunities", to: "/opportunities" },
      { label: "Search", to: "/search" },
      { label: "More", to: "/more" },
    ],
    ctaLabel: "Create Resume",
    ctaTo: "/create-profile",
    secondaryLabel: "Switch Role",
    secondaryTo: "/start",
  },
  club_scout: {
    id: "club_scout",
    label: "Club / scout / coach",
    eyebrow: "Recruitment and discovery",
    description: "Search verified athletes and request contact safely.",
    nextPath: "/my-profile",
    navItems: [
      { label: "Search", to: "/search" },
      { label: "Opportunities", to: "/opportunities" },
      { label: "Shortlist", to: "/shortlist" },
      { label: "Verification", to: "/verification-request" },
      { label: "More", to: "/more" },
    ],
    ctaLabel: "Search Athletes",
    ctaTo: "/search",
    secondaryLabel: "Switch Role",
    secondaryTo: "/start",
  },
  admin: {
    id: "admin",
    label: "Admin reviewer",
    eyebrow: "Trust and review console",
    description: "Review pending profiles, highlights, and verification requests.",
    nextPath: "/my-profile",
    navItems: [
      { label: "Home", to: "/" },
      { label: "Admin", to: "/admin" },
      { label: "Opportunities", to: "/opportunities" },
      { label: "Directory", to: "/directory" },
      { label: "More", to: "/more" },
    ],
    ctaLabel: "Open Reviews",
    ctaTo: "/admin",
    secondaryLabel: "Switch Role",
    secondaryTo: "/start",
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function createStableAthleteProfileId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return createId("athlete");
}

function mergeProfileCollections(primary = [], secondary = []) {
  const merged = [];
  const seen = new Set();

  [primary, secondary].forEach((collection) => {
    (Array.isArray(collection) ? collection : []).forEach((profile) => {
      if (!profile?.id || seen.has(profile.id)) {
        return;
      }

      seen.add(profile.id);
      merged.push(profile);
    });
  });

  return merged;
}

function upsertProfileRecord(collection, profile) {
  return [profile, ...(Array.isArray(collection) ? collection : []).filter((item) => item.id !== profile.id)];
}

function getRoleConfig(role) {
  return ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS[DEFAULT_SELECTED_ROLE];
}

function getRoleLabel(role) {
  return getRoleConfig(role).label;
}

function getPrimaryNavItemsForRole(role, hasDemoAccount = false) {
  const accountItem = hasDemoAccount
    ? { label: "Account", to: "/account" }
    : { label: "Login", to: "/login" };

  return getRoleConfig(role).navItems.map((item) => (item.to === "/more" ? accountItem : item));
}

function getDesktopNavItems(hasDemoAccount = false) {
  return [
    { label: "Dashboard", to: "/" },
    { label: "Athletes", to: "/search" },
    { label: "Opportunities", to: "/opportunities" },
    { label: "Scouts & Clubs", to: "/verification-request" },
    { label: "Resources", to: "/more" },
    { label: "Pricing", to: hasDemoAccount ? "/account" : "/create-account" },
  ];
}

function getHeaderRoleLabel(role) {
  switch (role) {
    case "junior_athlete":
      return "Junior";
    case "parent_guardian":
      return "Parent";
    case "adult_athlete":
      return "18+";
    case "club_scout":
      return "Scout";
    case "admin":
      return "Admin";
    default:
      return getRoleLabel(role);
  }
}

function getMoreLinksForRole(role, hasDemoAccount = false) {
  const roleConfig = getRoleConfig(role);

  return [
    {
      label: hasDemoAccount ? "Account" : "Create Account",
      to: hasDemoAccount ? "/account" : "/create-account",
      description: hasDemoAccount
        ? "Review your account, backend status, and role settings."
        : "Create a local-first account without enabling backend data migration.",
    },
    {
      label: "Switch Role",
      to: "/start",
      description: `Current role: ${roleConfig.label}. Change the demo pathway at any time.`,
    },
    {
      label: "Create Profile",
      to: "/create-profile",
      description: "Build a new player card and route it through the platform trust flow.",
    },
    {
      label: "Contact Requests",
      to: "/requests",
      description: "Review safe contact history and route visibility by role.",
    },
    {
      label: "Opportunities",
      to: "/opportunities",
      description: "Browse or post structured sports opportunities without adding direct messaging.",
    },
    {
      label: "Shortlist",
      to: "/shortlist",
      description: "Save athlete resumes to a clean recruitment shortlist for later review.",
    },
    {
      label: "Highlight Manager",
      to: "/highlight-manager",
      description: "Add, edit, feature, and attach resume highlights inside a clean sports resume workflow.",
    },
    {
      label: "Club Verification Request",
      to: "/verification-request",
      description:
        "Submit a structured verification request for a club, school, academy, or scout account.",
    },
    {
      label: "Sports Directory",
      to: "/directory",
      description: "Review the Australian sports catalogue and starter team directory.",
    },
    {
      label: "Parent Dashboard",
      to: "/parent",
      description: "Manage junior visibility, approvals, and safe request pathways.",
    },
    {
      label: "Admin Dashboard",
      to: "/admin",
      description: "Review trust queues, profile checks, showcase approvals, and opportunities.",
    },
    {
      label: "Club and Scout Search",
      to: "/search",
      description: "Browse premium athlete resumes with verified discovery filters.",
    },
  ];
}

function getAccountSetupCards(role) {
  if (role === "parent_guardian") {
    return [
      {
        title: "Link and manage child profile",
        copy: "Review the child profile route, keep junior visibility controlled, and stay ready for safe contact review.",
        to: "/my-profile",
        cta: "Open Child Profile",
      },
      {
        title: "Manage approvals and requests",
        copy: "Handle junior profile approvals, highlight approvals, visibility settings, and incoming contact requests from the guardian side.",
        to: "/parent",
        cta: "Open Parent Dashboard",
      },
    ];
  }

  if (role === "adult_athlete") {
    return [
      {
        title: "Create sports resume",
        copy: "Build the athlete resume that clubs, first-grade teams, and scouts can review safely.",
        to: "/create-profile",
        cta: "Create Sports Resume",
      },
      {
        title: "Set availability",
        copy: "Use your resume builder and profile settings to surface signing, trials, and relocation preferences.",
        to: "/my-profile",
        cta: "Open My Profile",
      },
    ];
  }

  if (role === "club_scout") {
    return [
      {
        title: "Request organisation verification",
        copy:
          "Submit a structured verification request before broader trust and discovery access is granted later.",
        to: "/verification-request",
        cta: "Request Verification",
      },
      {
        title: "Search athletes",
        copy: "Explore scout-visible resumes, safe contact routes, and strong profile completeness signals.",
        to: "/search",
        cta: "Open Scout Search",
      },
      {
        title: "Post opportunities",
        copy: "Create structured recruitment, academy, or school opportunity posts without messaging workflows.",
        to: "/opportunities",
        cta: "Open Opportunities",
      },
    ];
  }

  if (role === "admin") {
    return [
      {
        title: "Review trust queues",
        copy: "Handle pending profiles, highlights, and verification requests from the premium admin console.",
        to: "/admin",
        cta: "Open Admin Dashboard",
      },
      {
        title: "Review platform opportunities",
        copy: "Check the current recruitment board, demo status, and opportunity review queue.",
        to: "/opportunities",
        cta: "Open Opportunities",
      },
      {
        title: "View backend status",
        copy: "Monitor local demo mode, Supabase readiness, and the current backend-disabled-by-default setup.",
        to: "/admin",
        cta: "View Backend Status",
      },
    ];
  }

  return [
    {
      title: "Create sports resume",
      copy: "Build your player-card style sports resume with safe junior visibility and structured sports information.",
      to: "/create-profile",
      cta: "Create Sports Resume",
    },
    {
      title: "Parent approval required",
      copy: "Under-18 profiles and highlights stay inside the parent or guardian approval pathway before wider visibility or contact routing.",
      to: "/parent",
      cta: "Review Junior Safety Flow",
    },
  ];
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

const PILOT_HIDDEN_QA_PATTERNS = [
  "msr supabase test profile",
  "msr supabase thumbnail test athlete",
  "msr supabase thumbnail test highlight",
  "msr delete video qa",
  "msr replace video qa",
  "msr live upload confirm",
  "msr debug video",
  "temporary qa",
  "backend qa",
  "admin qa",
  "supabase qa",
  "supabase-profile-test",
  "supabase-highlight-test",
  "supabase-opportunity-test",
  "supabase-shortlist-test",
  "supabase-contact-request-test",
  "supabase-admin-queue-test",
  "supabase-media-metadata-test",
  "supabase-media-approval-test",
  "supabase-thumbnail-full-test",
  "supabase full private thumbnail qa flow",
  "full supabase highlight thumbnail test",
  "private video qa",
  "built-in private video test",
  "test video",
  "qa athlete profile",
  "qa highlight",
  "qa media",
];

function isPilotHiddenQaRecord(record) {
  if (!record) {
    return false;
  }

  const searchable = [
    record.id,
    record.displayName,
    record.title,
    record.name,
    record.organisation,
    record.club,
    record.description,
    record.notes,
    record.note,
    record.source,
    record.storageSource,
    record.eventName,
    record.matchEvent,
    record.opponent,
    record.originalFilename,
    record.storagePath,
    record.requestReason,
    record.createdByLabel,
    record.requesterRole,
    record.testMetadata?.kind,
    record.testMetadata?.note,
    record.profileData?.testMetadata?.kind,
    record.highlightData?.testMetadata?.kind,
    record.opportunityData?.testMetadata?.kind,
    record.mediaData?.testMetadata?.kind,
    record.media_data?.testMetadata?.kind,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return PILOT_HIDDEN_QA_PATTERNS.some((pattern) => searchable.includes(pattern));
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isJuniorAgeGroup(ageGroup) {
  return normalizeText(ageGroup).startsWith("under");
}

function getRoleDefaultAgeCategory(role) {
  return role === "adult_athlete" ? "Senior" : "Junior";
}

function findSportDefinition(value) {
  if (!value) {
    return null;
  }

  const normalizedValue = normalizeText(value);

  return (
    sportsCatalog.find((sport) => sport.id === normalizedValue) ||
    sportsCatalog.find((sport) => normalizeText(sport.name) === normalizedValue) ||
    sportsCatalog.find((sport) =>
      Array.isArray(sport.aliases)
        ? sport.aliases.some((alias) => normalizeText(alias) === normalizedValue)
        : false,
    ) ||
    null
  );
}

function getDefaultSportDefinition() {
  return findSportDefinition(PROFILE_DEFAULTS.sportId) || sportsCatalog[0];
}

function getSportOptionsByCategory(category) {
  if (!category || category === "All") {
    return sportsCatalog;
  }

  return sportsCatalog.filter((sport) => sport.category === category);
}

function getSimpleSportOptions() {
  return getMainSportsList();
}

function sportFilterMatches(selectedSport, candidateSport) {
  if (!selectedSport || selectedSport === "All") {
    return true;
  }

  const selectedDefinition = findSportDefinition(selectedSport);
  const candidateDefinition = findSportDefinition(candidateSport);

  if (selectedDefinition && candidateDefinition) {
    return selectedDefinition.id === candidateDefinition.id;
  }

  return normalizeText(selectedSport) === normalizeText(candidateSport);
}

function getSportDefinitionForProfile(profile) {
  return findSportDefinition(profile?.sportId || profile?.sport) || getDefaultSportDefinition();
}

function getPositionOptionsForSport(sportDefinition) {
  return Array.isArray(sportDefinition?.commonPositions) ? sportDefinition.commonPositions : [];
}

function getAgeGroupOptionsForSport(sportDefinition) {
  return Array.isArray(sportDefinition?.ageGroups) ? sportDefinition.ageGroups : AUSTRALIAN_AGE_GROUPS;
}

function getCompetitionLevelOptionsForSport(sportDefinition) {
  return Array.isArray(sportDefinition?.competitionLevels)
    ? sportDefinition.competitionLevels
    : COMPETITION_LEVELS;
}

function getTeamFieldLabel(sportDefinition) {
  if (sportDefinition?.supportsIndividual && !sportDefinition?.supportsTeamClub) {
    return "Club / Program / Squad / Coach";
  }

  if (sportDefinition?.supportsIndividual && sportDefinition?.supportsTeamClub) {
    return "Team / Club / Program";
  }

  return "Team / Club";
}

function getCompetitionFieldLabel(sportDefinition) {
  if (sportDefinition?.supportsIndividual && !sportDefinition?.supportsTeamClub) {
    return "Program / Meet / Competition";
  }

  return "Competition";
}

function getSportStatsPlaceholder(sportDefinition) {
  const stats = Array.isArray(sportDefinition?.commonStats) ? sportDefinition.commonStats : [];

  if (stats.length === 0) {
    return "Example: Best result: State finalist";
  }

  return stats.slice(0, 3).map((item) => `${item}:`).join("\n");
}

function getSportStatSuggestions(sportId) {
  return findSportDefinition(sportId)?.commonStats || [];
}

function getSportPositionOptions(sportId) {
  return getPositionOptionsForSport(findSportDefinition(sportId) || getDefaultSportDefinition());
}

function getHighlightTagSuggestions(sportId) {
  const sportDefinition = findSportDefinition(sportId);
  const sportName = sportDefinition?.name || sportId;
  const directoryTypes = getDirectoryHighlightTypesForSport(sportName);
  if (directoryTypes.length > 0) {
    return directoryTypes.filter((item) => item !== NSW_RUGBY_LEAGUE_OTHER_OPTION);
  }

  return HIGHLIGHT_TAGS_BY_SPORT[sportId] || [];
}

function resolveSelectableValue(value, customValue, otherValue = NSW_RUGBY_LEAGUE_OTHER_OPTION) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) {
    return "";
  }
  if (normalizedValue === otherValue) {
    return String(customValue || "").trim();
  }
  return normalizedValue;
}

function isStructuredNswRugbyLeagueMode(sportDefinition, state) {
  return isNswRugbyLeagueSportState({
    state,
    sport: sportDefinition?.name,
    sportId: sportDefinition?.id,
  });
}

function getHighlightTypeSelectionValue(value, sportId) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) {
    return "";
  }

  const options = getHighlightTagSuggestions(sportId);
  return options.includes(normalizedValue) ? normalizedValue : NSW_RUGBY_LEAGUE_OTHER_OPTION;
}

function getResolvedProfileFormValues(formPayload) {
  const sportDefinition = findSportDefinition(formPayload?.sportId || formPayload?.sport);
  const usesStructuredDirectory = isStructuredNswRugbyLeagueMode(
    sportDefinition,
    formPayload?.state,
  );
  const resolvedAgeGroup = usesStructuredDirectory
    ? resolveSelectableValue(formPayload?.ageGroup, formPayload?.customAgeGroup)
    : String(formPayload?.ageGroup || "").trim();
  const resolvedPosition = usesStructuredDirectory
    ? resolveSelectableValue(formPayload?.position, formPayload?.customPosition)
    : String(formPayload?.position || "").trim();
  const resolvedSecondaryPosition = usesStructuredDirectory
    ? resolveSelectableValue(
        formPayload?.secondaryPosition,
        formPayload?.customSecondaryPosition,
      )
    : String(formPayload?.secondaryPosition || "").trim();
  const rawResolvedRegion = usesStructuredDirectory
    ? resolveSelectableValue(
        formPayload?.region,
        formPayload?.customGroupRegion,
        NSW_RUGBY_LEAGUE_OTHER_REGION_VALUE,
      )
    : String(formPayload?.region || "").trim();
  const clubValue = String(formPayload?.club || "").trim();
  const usesCustomClubValue =
    clubValue === NSW_RUGBY_LEAGUE_CUSTOM_CLUB_VALUE ||
    clubValue === AUSTRALIAN_CUSTOM_CLUB_VALUE;
  const resolvedClub = usesCustomClubValue
    ? String(formPayload?.customClubName || formPayload?.currentTeam || "").trim()
    : String(formPayload?.club || formPayload?.currentTeam || "").trim();
  const matchedTeam =
    (formPayload?.teamDirectoryId && TEAMS_BY_ID[formPayload.teamDirectoryId]) ||
    findTeamDirectoryEntry({
      name: resolvedClub,
      sportDefinition,
      state: formPayload?.state,
      region: rawResolvedRegion,
    }) ||
    findStarterClubDirectoryEntry({
      name: resolvedClub,
      sportDefinition,
      state: formPayload?.state,
    });
  const resolvedRegion = String(
    rawResolvedRegion ||
      matchedTeam?.region ||
      matchedTeam?.groupOrAssociation ||
      formPayload?.suburb ||
      formPayload?.postcode ||
      formPayload?.state ||
      "",
  ).trim();
  const resolvedCompetition = String(
    formPayload?.customCompetitionGroup ||
      formPayload?.mainCompetition ||
      formPayload?.competition ||
      matchedTeam?.competition ||
      (usesStructuredDirectory ? getNswRugbyLeagueDefaultCompetition(resolvedRegion) : ""),
  ).trim();
  const resolvedCompetitionLevel = String(
    formPayload?.competitionLevel ||
      matchedTeam?.level ||
      (usesStructuredDirectory ? getNswRugbyLeagueDefaultCompetitionLevel(resolvedRegion) : ""),
  ).trim();
  const resolvedHighlightType = resolveSelectableValue(
    formPayload?.highlightType,
    formPayload?.customHighlightType,
  );
  const usesCustomClub =
    usesStructuredDirectory &&
    (String(formPayload?.club || "").trim() === NSW_RUGBY_LEAGUE_CUSTOM_CLUB_VALUE ||
      !matchedTeam);

  return {
    sportDefinition,
    usesStructuredDirectory,
    resolvedAgeGroup,
    resolvedPosition,
    resolvedSecondaryPosition,
    resolvedRegion,
    resolvedClub,
    resolvedCompetition,
    resolvedCompetitionLevel,
    resolvedHighlightType,
    matchedTeam,
    usesCustomClub,
  };
}

function formatDisplayDate(value) {
  if (!value) {
    return "Date not added";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString();
}

function getHighlightDisplayEvent(highlight) {
  return (
    highlight?.matchEvent ||
    highlight?.eventName ||
    highlight?.roundLabel ||
    highlight?.competition ||
    highlight?.matchType ||
    "Match / event not added"
  );
}

function getHighlightVerificationLabel(highlight) {
  return highlight?.verificationStatus || highlight?.approvalStatus || "Pending review";
}

function getHighlightShowcaseLabel(highlight) {
  return highlight?.showcaseStatus || highlight?.visibilityStatus || "Private";
}

function buildAutoHighlightTitle({
  highlightType,
  customHighlightType,
  positionPlayed,
  matchType,
  existingTitle,
}) {
  const explicitTitle = String(existingTitle || "").trim();
  if (explicitTitle) {
    return explicitTitle;
  }

  const resolvedHighlightType = resolveSelectableValue(highlightType, customHighlightType);
  const baseLabel =
    resolvedHighlightType || String(positionPlayed || "").trim() || String(matchType || "").trim();

  if (!baseLabel) {
    return "Untitled highlight";
  }

  const normalizedBaseLabel = String(baseLabel).trim();
  const normalizedComparison = normalizeText(normalizedBaseLabel);
  if (normalizedComparison.endsWith("highlight") || normalizedComparison.endsWith("clip")) {
    return normalizedBaseLabel;
  }

  return `${normalizedBaseLabel} highlight`;
}

function buildManagedHighlightRecord({
  athlete,
  formPayload,
  existingHighlight,
  overrideFields = {},
}) {
  const now = new Date().toISOString();
  const resolvedHighlightType =
    resolveSelectableValue(formPayload?.highlightType, formPayload?.customHighlightType) ||
    existingHighlight?.highlightType ||
    existingHighlight?.tag ||
    "Match highlight";
  const sourceValue =
    overrideFields.verificationSource ||
    formPayload?.verificationSource ||
    existingHighlight?.verificationSource ||
    mapLegacyHighlightVerificationStatus(formPayload?.highlightVerificationStatus) ||
    (athlete?.isJunior ? "Parent" : "Unverified");

  let approvalStatus =
    overrideFields.approvalStatus ||
    existingHighlight?.approvalStatus ||
    (athlete?.isJunior ? "Pending Parent Approval" : "Pending Admin Review");

  if (athlete?.isJunior) {
    if (!isHighlightParentApproved({ ...existingHighlight, isJunior: true, approvalStatus })) {
      approvalStatus = "Pending Parent Approval";
    }
  } else if (!overrideFields.approvalStatus) {
    if (sourceValue === "Coach") {
      approvalStatus = "Coach Verified";
    } else if (sourceValue === "Club") {
      approvalStatus = "Club Verified";
    } else if (sourceValue === "Admin") {
      approvalStatus = "Admin Approved";
    } else {
      approvalStatus = "Pending Admin Review";
    }
  }

  let showcaseStatus =
    overrideFields.showcaseStatus ||
    formPayload?.showcaseStatus ||
    existingHighlight?.showcaseStatus ||
    (athlete?.isJunior ? "Private" : "Profile Only");

  if (
    athlete?.isJunior &&
    showcaseStatus === "Showcase Approved" &&
    !isHighlightParentApproved({ ...existingHighlight, isJunior: true, approvalStatus })
  ) {
    showcaseStatus = "Showcase Requested";
  }

  return normalizeHighlights([
    {
      ...HIGHLIGHT_DEFAULTS,
      ...existingHighlight,
      id: existingHighlight?.id || createId("local-highlight"),
      athleteId: athlete?.id || existingHighlight?.athleteId || "",
      title: buildAutoHighlightTitle({
        highlightType: formPayload?.highlightType,
        customHighlightType: formPayload?.customHighlightType,
        positionPlayed:
          formPayload?.positionPlayed || existingHighlight?.positionPlayed || athlete?.position || "",
        matchType: formPayload?.matchType || existingHighlight?.matchType || "",
        existingTitle:
          formPayload?.title ||
          formPayload?.highlightTitle ||
          existingHighlight?.title ||
          "",
      }),
      description: formPayload?.description || existingHighlight?.description || "",
      sportId: athlete?.sportId || existingHighlight?.sportId || "",
      sportCategory: athlete?.sportCategory || existingHighlight?.sportCategory || "",
      sport: formPayload?.sport || athlete?.sport || existingHighlight?.sport || "",
      ageGroup: athlete?.ageGroup || existingHighlight?.ageGroup || "",
      position: athlete?.position || existingHighlight?.position || "",
      positionPlayed:
        formPayload?.positionPlayed ||
        existingHighlight?.positionPlayed ||
        athlete?.position ||
        "",
      region: athlete?.region || existingHighlight?.region || "",
      state: athlete?.state || existingHighlight?.state || "",
      competition:
        formPayload?.competition || athlete?.competition || existingHighlight?.competition || "",
      competitionLevel:
        athlete?.competitionLevel || existingHighlight?.competitionLevel || "",
      isJunior: Boolean(athlete?.isJunior ?? existingHighlight?.isJunior),
      highlightType: resolvedHighlightType,
      tag: resolvedHighlightType,
      matchEvent:
        formPayload?.matchEvent ||
        formPayload?.highlightEvent ||
        existingHighlight?.matchEvent ||
        existingHighlight?.eventName ||
        "",
      matchType: formPayload?.matchType || existingHighlight?.matchType || "",
      roundLabel: formPayload?.roundLabel || existingHighlight?.roundLabel || "",
      date:
        formPayload?.date ||
        formPayload?.highlightDate ||
        existingHighlight?.date ||
        existingHighlight?.eventDate ||
        "",
      opponent: formPayload?.opponent || existingHighlight?.opponent || "",
      videoUrl:
        formPayload?.videoUrl ||
        formPayload?.highlightVideoUrl ||
        existingHighlight?.videoUrl ||
        "",
      thumbnailUrl: formPayload?.thumbnailUrl || existingHighlight?.thumbnailUrl || "",
      verificationSource: sourceValue,
      approvalStatus,
      showcaseStatus,
      isFeatured: Boolean(
        overrideFields.isFeatured ?? existingHighlight?.isFeatured ?? false,
      ),
      boostCount: Number(existingHighlight?.boostCount || 0),
      createdAt: existingHighlight?.createdAt || now,
      updatedAt: now,
    },
  ])[0];
}

function shouldQueueHighlightForAdmin(highlight) {
  if (!highlight) {
    return false;
  }

  if (highlight.showcaseStatus === "Showcase Requested") {
    return true;
  }

  if (!highlight.isJunior && normalizeText(highlight.approvalStatus) === "pending admin review") {
    return true;
  }

  return false;
}

function buildAdminHighlightQueueEntry(highlight, athlete, existingItem) {
  return {
    id: existingItem?.id || createId("admin-highlight"),
    highlightId: highlight.id,
    athleteId: athlete?.id || highlight.athleteId,
    title: `${athlete?.displayName || "Athlete"} highlight review`,
    detail: [
      highlight.title || "Untitled highlight",
      highlight.highlightType || "Highlight type not added",
      getHighlightDisplayEvent(highlight),
      athlete?.sport || highlight.sport || "Sport not provided",
      athlete?.ageGroup || highlight.ageGroup || "Age group not provided",
      getHighlightShowcaseLabel(highlight),
    ].join(" / "),
    status: existingItem?.status || "Pending",
    createdAt: existingItem?.createdAt || highlight.createdAt || new Date().toISOString(),
    updatedAt: highlight.updatedAt || existingItem?.updatedAt || highlight.createdAt || new Date().toISOString(),
  };
}

function getOpportunityVerificationLabel(opportunity) {
  const status = String(opportunity?.verificationStatus || "").trim().toLowerCase();

  if (status === "verified_organisation") {
    return "Verified Organisation";
  }
  if (status === "pending_admin_verification") {
    return "Pending Admin Verification";
  }
  if (status === "rejected") {
    return "Rejected";
  }
  if (status === "archived") {
    return "Archived";
  }

  return opportunity?.verificationStatus || "Pending Admin Verification";
}

function isOpportunityVerified(opportunity) {
  return /verified|approved/i.test(String(opportunity?.verificationStatus || ""));
}

function getOpportunityContactNote(opportunity) {
  const route = normalizeText(opportunity?.contactRoute);

  if (
    opportunity?.isJuniorOpportunity ||
    route.includes("parent") ||
    route.includes("guardian")
  ) {
    return "Under-18 interest routes to parent or guardian. No direct messaging.";
  }

  if (route.includes("athlete")) {
    return "18+ interest routes to the athlete. No direct messaging.";
  }

  return "Contact requests only. No direct messaging.";
}

function getOpportunitySourceLabel(opportunity) {
  const source = normalizeText(opportunity?.source || opportunity?.storageSource || "");

  if (source.includes("supabase")) {
    return "Supabase";
  }

  if (source.includes("seed") || source.includes("local")) {
    return "Local Demo";
  }

  return "Local Demo";
}

function getContactRequestSourceLabel(request) {
  const source = normalizeText(request?.source || request?.storageSource || "");

  if (source.includes("supabase")) {
    return "Supabase";
  }

  return "Local Demo";
}

function getShortlistSourceLabel(record) {
  const source = normalizeText(record?.source || record?.storageSource || "");

  if (source.includes("supabase")) {
    return "Supabase";
  }

  return "Local Demo";
}

function getAdminQueueSourceLabel(record) {
  const source = normalizeText(record?.source || record?.storageSource || "");

  if (source.includes("supabase")) {
    return "Supabase";
  }

  return "Local Demo";
}

function buildManagedShortlistRecord({
  athlete,
  actorRole = "club_scout",
  sourceContext = "manual",
  notes = "",
  existingRecord,
  overrideFields = {},
}) {
  const createdAt = existingRecord?.createdAt || new Date().toISOString();
  const shortlistTypeRaw = overrideFields.shortlistTypeRaw || "athlete_shortlist";
  const shortlistType =
    shortlistTypeRaw === "opportunity_match"
      ? "Opportunity Match"
      : shortlistTypeRaw === "scout_watchlist"
        ? "Scout Watchlist"
        : shortlistTypeRaw === "club_review"
          ? "Club Review"
          : "Athlete Shortlist";

  return normalizeShortlist([
    {
      ...SHORTLIST_DEFAULTS,
      ...existingRecord,
      ...overrideFields,
      id: existingRecord?.id || overrideFields.id || createId("shortlist"),
      athleteId: athlete?.id || existingRecord?.athleteId || "",
      athleteProfileId: athlete?.id || existingRecord?.athleteProfileId || "",
      athleteOwnerUserId: athlete?.ownerUserId || existingRecord?.athleteOwnerUserId || null,
      athleteDisplayName:
        overrideFields.athleteDisplayName ||
        athlete?.displayName ||
        existingRecord?.athleteDisplayName ||
        "Unnamed athlete",
      athleteSport:
        overrideFields.athleteSport || athlete?.sport || existingRecord?.athleteSport || "",
      athleteSportId:
        overrideFields.athleteSportId || athlete?.sportId || existingRecord?.athleteSportId || "",
      athletePositionRole:
        overrideFields.athletePositionRole ||
        athlete?.position ||
        existingRecord?.athletePositionRole ||
        "",
      athleteAgeGroup:
        overrideFields.athleteAgeGroup || athlete?.ageGroup || existingRecord?.athleteAgeGroup || "",
      athleteState: overrideFields.athleteState || athlete?.state || existingRecord?.athleteState || "",
      athleteRegion:
        overrideFields.athleteRegion || athlete?.region || existingRecord?.athleteRegion || "",
      shortlistType,
      shortlistTypeRaw,
      shortlistStatus: overrideFields.shortlistStatus || existingRecord?.shortlistStatus || "Active",
      sourceContext: overrideFields.sourceContext || sourceContext,
      notes: overrideFields.notes || notes || existingRecord?.notes || "",
      noDirectMessaging:
        typeof overrideFields.noDirectMessaging === "boolean"
          ? overrideFields.noDirectMessaging
          : existingRecord?.noDirectMessaging !== false,
      createdAt,
      updatedAt: new Date().toISOString(),
      createdByRole: overrideFields.createdByRole || existingRecord?.createdByRole || actorRole,
      source: overrideFields.source || existingRecord?.source || "local-shortlist",
      storageSource:
        overrideFields.storageSource || existingRecord?.storageSource || "localStorage",
      shortlistData:
        overrideFields.shortlistData ||
        existingRecord?.shortlistData || {
          athleteSportCategory: athlete?.sportCategory || "",
          athleteCompetitionLevel: athlete?.competitionLevel || "",
        },
    },
  ])[0];
}

function buildManagedAdminQueueRecord({
  queueType = "profile_review",
  title = "Admin review item",
  detail = "",
  existingItem,
  overrideFields = {},
}) {
  const createdAt = existingItem?.createdAt || overrideFields.createdAt || new Date().toISOString();

  return {
    ...(clone(isObject(existingItem) ? existingItem : {})),
    id: existingItem?.id || overrideFields.id || createId("admin-queue"),
    title: overrideFields.title || title || existingItem?.title || "Admin review item",
    detail: overrideFields.detail || detail || existingItem?.detail || "",
    status: overrideFields.status || existingItem?.status || "Pending",
    queueStatus: overrideFields.queueStatus || existingItem?.queueStatus || "Pending",
    queueType: overrideFields.queueType || existingItem?.queueType || queueType,
    queueTypeRaw: overrideFields.queueTypeRaw || existingItem?.queueTypeRaw || queueType,
    priority: overrideFields.priority || existingItem?.priority || "Normal",
    reviewReason: overrideFields.reviewReason || existingItem?.reviewReason || "",
    reviewNotes: overrideFields.reviewNotes || existingItem?.reviewNotes || "",
    sourceContext: overrideFields.sourceContext || existingItem?.sourceContext || "manual",
    adminDecision: overrideFields.adminDecision || existingItem?.adminDecision || "",
    adminDecisionBy: overrideFields.adminDecisionBy || existingItem?.adminDecisionBy || null,
    adminDecisionAt: overrideFields.adminDecisionAt || existingItem?.adminDecisionAt || null,
    reviewedAt: overrideFields.reviewedAt || existingItem?.reviewedAt || null,
    ownerUserId: overrideFields.ownerUserId || existingItem?.ownerUserId || null,
    relatedUserId: overrideFields.relatedUserId || existingItem?.relatedUserId || null,
    relatedAthleteProfileId:
      overrideFields.relatedAthleteProfileId ||
      existingItem?.relatedAthleteProfileId ||
      existingItem?.athleteId ||
      "",
    relatedHighlightId:
      overrideFields.relatedHighlightId ||
      existingItem?.relatedHighlightId ||
      existingItem?.highlightId ||
      "",
    relatedOpportunityId:
      overrideFields.relatedOpportunityId ||
      existingItem?.relatedOpportunityId ||
      existingItem?.opportunityId ||
      "",
    relatedContactRequestId:
      overrideFields.relatedContactRequestId ||
      existingItem?.relatedContactRequestId ||
      existingItem?.contactRequestId ||
      existingItem?.requestId ||
      "",
    relatedShortlistId:
      overrideFields.relatedShortlistId ||
      existingItem?.relatedShortlistId ||
      existingItem?.shortlistId ||
      "",
    noDirectMessaging:
      typeof overrideFields.noDirectMessaging === "boolean"
        ? overrideFields.noDirectMessaging
        : typeof existingItem?.noDirectMessaging === "boolean"
          ? existingItem.noDirectMessaging
          : true,
    source: overrideFields.source || existingItem?.source || "local-admin-queue",
    storageSource:
      overrideFields.storageSource || existingItem?.storageSource || "localStorage",
    queueData:
      overrideFields.queueData ||
      existingItem?.queueData || {
        queueType,
        createdAt,
      },
    createdAt,
    updatedAt: overrideFields.updatedAt || new Date().toISOString(),
  };
}

function getAdminQueueStatusFromAction(action) {
  if (action === "Reject") {
    return "Rejected";
  }
  if (action === "Mark Reviewed") {
    return "In Review";
  }

  return "Approved";
}

function getAdminQueueDecisionFromAction(action) {
  if (action === "Reject") {
    return "Rejected";
  }
  if (action === "Mark Reviewed" || action === "Keep Profile Only") {
    return "No Action";
  }

  return "Approved";
}

function getAdminQueueTypeFromQueueName(queueName) {
  if (queueName === "pendingHighlights") {
    return "highlight_review";
  }
  if (queueName === "pendingOpportunities") {
    return "opportunity_review";
  }
  if (queueName === "verificationRequests") {
    return "club_scout_verification";
  }
  if (queueName === "flaggedContent") {
    return "flagged_content";
  }

  return "profile_review";
}

function buildOpportunityRecord(formPayload, createdByRole = "club_scout", existingOpportunity) {
  const now = new Date().toISOString();
  const sportDefinition =
    findSportDefinition(formPayload?.sportId || formPayload?.sport) || getDefaultSportDefinition();
  const isJuniorOpportunity =
    typeof formPayload?.isJuniorOpportunity === "boolean"
      ? formPayload.isJuniorOpportunity
      : String(formPayload?.juniorSenior || "").toLowerCase() === "junior";

  return normalizeOpportunities([
    {
      ...OPPORTUNITY_DEFAULTS,
      ...existingOpportunity,
      id: existingOpportunity?.id || createId("opportunity"),
      title: formPayload?.title || existingOpportunity?.title || "Untitled opportunity",
      organisation:
        formPayload?.organisation || existingOpportunity?.organisation || "Organisation not set",
      contactRoleTitle:
        formPayload?.contactRoleTitle ||
        existingOpportunity?.contactRoleTitle ||
        "",
      sport: sportDefinition.name,
      sportCategory: sportDefinition.category,
      sportId: sportDefinition.id,
      positionRole:
        formPayload?.positionRole || existingOpportunity?.positionRole || "Role not set",
      ageGroup: formPayload?.ageGroup || existingOpportunity?.ageGroup || getDefaultAgeGroup(isJuniorOpportunity),
      isJuniorOpportunity,
      juniorSenior: isJuniorOpportunity ? "Junior" : "Senior",
      state: formPayload?.state || existingOpportunity?.state || "",
      region: formPayload?.region || existingOpportunity?.region || "",
      postcode: formPayload?.postcode || existingOpportunity?.postcode || "",
      suburb: formPayload?.suburb || existingOpportunity?.suburb || "",
      competitionLevel:
        formPayload?.competitionLevel || existingOpportunity?.competitionLevel || "Local Club",
      opportunityType:
        formPayload?.opportunityType ||
        existingOpportunity?.opportunityType ||
        "Club recruitment",
      description: formPayload?.description || existingOpportunity?.description || "",
      requirements: formPayload?.requirements || existingOpportunity?.requirements || "",
      verificationStatus:
        formPayload?.verificationStatus ||
        existingOpportunity?.verificationStatus ||
        "Pending Admin Verification",
      opportunityStatus:
        formPayload?.opportunityStatus || existingOpportunity?.opportunityStatus || "Draft",
      contactRoute: isJuniorOpportunity
        ? "Under-18 interest routes to parent or guardian"
        : "Contact requests only",
      visibilityStatus:
        formPayload?.visibilityStatus || existingOpportunity?.visibilityStatus || "Private",
      closingDate: formPayload?.closingDate || existingOpportunity?.closingDate || "",
      createdAt: existingOpportunity?.createdAt || now,
      updatedAt: now,
      createdByRole: existingOpportunity?.createdByRole || createdByRole,
      source: existingOpportunity?.source || "local-demo",
      storageSource: existingOpportunity?.storageSource || "localStorage",
    },
  ])[0];
}

function shouldQueueOpportunityForAdmin(opportunity) {
  return normalizeText(opportunity?.verificationStatus) === "pending admin verification";
}

function buildAdminOpportunityQueueEntry(opportunity, existingItem) {
  return {
    id: existingItem?.id || createId("admin-opportunity"),
    opportunityId: opportunity.id,
    title: `${opportunity.organisation || "Organisation"} opportunity review`,
    detail: [
      opportunity.title || "Untitled opportunity",
      opportunity.sport || "Sport not set",
      opportunity.positionRole || "Role not set",
      joinMeta([opportunity.region, opportunity.state]) || "Location not set",
      opportunity.opportunityType || "Opportunity type not set",
    ].join(" / "),
    status: existingItem?.status || "Pending",
    createdAt: existingItem?.createdAt || opportunity.createdAt || new Date().toISOString(),
    updatedAt:
      existingItem?.updatedAt || opportunity.createdAt || new Date().toISOString(),
  };
}

function getOpportunityAvailabilityMatch(opportunity, athlete) {
  if (!opportunity || !athlete) {
    return false;
  }

  if (opportunity.isJuniorOpportunity) {
    if (opportunity.opportunityType === "Academy trial") {
      return athlete.availability?.openToAcademy;
    }
    if (opportunity.opportunityType === "School sport opportunity") {
      return athlete.availability?.openToSchoolSport;
    }
    if (opportunity.opportunityType === "Representative trial") {
      return athlete.availability?.openToRepresentativePathways || athlete.availability?.openToTrials;
    }
    return athlete.availability?.openToTrials || athlete.availability?.openToRepresentativePathways;
  }

  if (opportunity.opportunityType === "First grade signing") {
    return athlete.availability?.openToFirstGrade || athlete.availability?.openToSeniorSigning;
  }
  if (opportunity.opportunityType === "Reserve grade signing") {
    return athlete.availability?.openToReserveGrade || athlete.availability?.openToSeniorSigning;
  }

  return athlete.availability?.openToSeniorSigning || athlete.availability?.openToTrials;
}

function getMatchingAthletesForOpportunity(opportunity, athletes) {
  return (athletes || [])
    .filter((athlete) => {
      if (!athlete) {
        return false;
      }

      if (normalizeText(athlete.sport) !== normalizeText(opportunity.sport)) {
        return false;
      }

      if (athlete.isJunior !== Boolean(opportunity.isJuniorOpportunity)) {
        return false;
      }

      if (
        opportunity.positionRole &&
        athlete.position &&
        !normalizeText(opportunity.positionRole).includes(normalizeText(athlete.position)) &&
        !normalizeText(athlete.position).includes(normalizeText(opportunity.positionRole))
      ) {
        return false;
      }

      if (
        opportunity.ageGroup &&
        athlete.ageGroup &&
        normalizeText(opportunity.ageGroup) !== normalizeText(athlete.ageGroup) &&
        normalizeText(opportunity.ageGroup) !== "open" &&
        normalizeText(opportunity.ageGroup) !== "senior"
      ) {
        return false;
      }

      if (opportunity.state && athlete.state && opportunity.state !== athlete.state) {
        return false;
      }

      if (
        opportunity.region &&
        athlete.region &&
        normalizeText(opportunity.region) !== normalizeText(athlete.region)
      ) {
        return false;
      }

      if (
        opportunity.competitionLevel &&
        athlete.competitionLevel &&
        normalizeText(opportunity.competitionLevel) !== normalizeText(athlete.competitionLevel) &&
        !["academy", "representative"].includes(normalizeText(opportunity.competitionLevel))
      ) {
        return false;
      }

      return getOpportunityAvailabilityMatch(opportunity, athlete);
    })
    .sort((left, right) => {
      const completionDelta =
        calculateProfileCompleteness(right) - calculateProfileCompleteness(left);
      if (completionDelta !== 0) {
        return completionDelta;
      }
      return Number(isVerifiedProfile(right)) - Number(isVerifiedProfile(left));
    });
}

function normalizeListField(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return splitLines(value);
  }

  return [];
}

function normalizeAchievementSections(item) {
  const sections = {
    awards: normalizeListField(item?.achievementSections?.awards || item?.awards),
    representativeSelections: normalizeListField(
      item?.achievementSections?.representativeSelections || item?.representativeSelections,
    ),
    finalsHistory: normalizeListField(
      item?.achievementSections?.finalsHistory || item?.finalsHistory,
    ),
    mvpAwards: normalizeListField(item?.achievementSections?.mvpAwards || item?.mvpAwards),
    bestAndFairest: normalizeListField(
      item?.achievementSections?.bestAndFairest || item?.bestAndFairest,
    ),
    carnivalResults: normalizeListField(
      item?.achievementSections?.carnivalResults || item?.carnivalResults,
    ),
    otherAchievements: normalizeListField(
      item?.achievementSections?.otherAchievements || item?.otherAchievements || item?.achievements,
    ),
  };

  return sections;
}

function flattenAchievementSections(sections) {
  return Object.values(sections || {}).flat().filter(Boolean);
}

function mapLegacyHighlightVerificationStatus(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "Unverified";
  }
  if (normalized.includes("parent")) {
    return "Parent";
  }
  if (normalized.includes("coach")) {
    return "Coach";
  }
  if (normalized.includes("club")) {
    return "Club";
  }
  if (normalized.includes("admin")) {
    return "Admin";
  }

  return "Unverified";
}

function mapLegacyHighlightApprovalStatus(item) {
  if (item?.approvalStatus) {
    return item.approvalStatus;
  }

  const visibility = item?.visibilityStatus || "";
  const verification = item?.verificationStatus || "";

  if (visibility === "Pending Parent Approval") {
    return "Pending Parent Approval";
  }
  if (visibility === "Showcase Approved") {
    if (normalizeText(verification).includes("parent")) {
      return "Parent Approved";
    }
    if (normalizeText(verification).includes("coach")) {
      return "Coach Verified";
    }
    if (normalizeText(verification).includes("club")) {
      return "Club Verified";
    }
    return "Admin Approved";
  }
  if (normalizeText(verification).includes("parent")) {
    return "Parent Approved";
  }
  if (normalizeText(verification).includes("coach")) {
    return "Coach Verified";
  }
  if (normalizeText(verification).includes("club")) {
    return "Club Verified";
  }
  if (normalizeText(verification).includes("admin")) {
    return "Admin Approved";
  }

  return item?.isJunior ? "Pending Parent Approval" : "Pending Admin Review";
}

function mapLegacyHighlightShowcaseStatus(item) {
  if (item?.showcaseStatus) {
    return item.showcaseStatus;
  }

  if (item?.visibilityStatus === "Showcase Approved") {
    return "Showcase Approved";
  }
  if (item?.visibilityStatus === "Private" || item?.visibilityStatus === "Pending Parent Approval") {
    return "Private";
  }
  if (item?.visibilityStatus === "Pending Verification") {
    return "Profile Only";
  }

  return item?.isJunior ? "Private" : "Profile Only";
}

function getHighlightStatusLabel(highlight) {
  if (highlight?.showcaseStatus === "Showcase Approved" && highlight?.boostCount > 0) {
    return highlight.boostCount > 5 ? "Highly Boosted" : "Featured Talent";
  }
  if (highlight?.showcaseStatus === "Showcase Approved") {
    return "Featured Talent";
  }
  if (highlight?.showcaseStatus === "Showcase Requested") {
    return "Showcase Requested";
  }
  if (highlight?.showcaseStatus === "Profile Only") {
    return "Profile Highlight";
  }
  if (highlight?.approvalStatus === "Pending Parent Approval") {
    return "Awaiting Parent Approval";
  }

  return "Rising Highlight";
}

function isHighlightApproved(highlight) {
  return [
    "approved",
    "parent approved",
    "coach verified",
    "club verified",
    "admin approved",
  ].includes(normalizeText(highlight?.approvalStatus));
}

function isHighlightParentApproved(highlight) {
  if (!highlight?.isJunior) {
    return true;
  }

  return [
    "parent approved",
    "coach verified",
    "club verified",
    "admin approved",
  ].includes(normalizeText(highlight?.approvalStatus));
}

function isHighlightProfileVisible(highlight) {
  if (!highlight) {
    return false;
  }

  if (highlight.showcaseStatus === "Private") {
    return false;
  }

  if (highlight.isJunior && !isHighlightParentApproved(highlight)) {
    return false;
  }

  return ["Profile Only", "Showcase Approved"].includes(highlight.showcaseStatus);
}

function isHighlightShowcaseReady(highlight) {
  if (!highlight || highlight.showcaseStatus !== "Showcase Approved") {
    return false;
  }

  if (!isHighlightApproved(highlight)) {
    return false;
  }

  if (highlight.isJunior && !isHighlightParentApproved(highlight)) {
    return false;
  }

  return true;
}

function getProfileVisibleHighlightCount(profile) {
  if (typeof profile?.profileVisibleHighlightCount === "number") {
    return profile.profileVisibleHighlightCount;
  }

  return 0;
}

function getProfileShowcaseReadyHighlightCount(profile) {
  if (typeof profile?.showcaseReadyHighlightCount === "number") {
    return profile.showcaseReadyHighlightCount;
  }

  return 0;
}

function sortHighlightsByPriority(items) {
  return [...items].sort((left, right) => {
    if (left.isFeatured !== right.isFeatured) {
      return left.isFeatured ? -1 : 1;
    }

    return new Date(right.updatedAt || right.createdAt || 0).getTime() -
      new Date(left.updatedAt || left.createdAt || 0).getTime();
  });
}

function getHighlightsForAthlete(highlights, athleteId, options = {}) {
  const filtered = (highlights || []).filter((item) => item.athleteId === athleteId);
  const visible = options.publicOnly ? filtered.filter(isHighlightProfileVisible) : filtered;
  return sortHighlightsByPriority(visible);
}

function normalizePhysicalDetails(item) {
  return {
    ...DEFAULT_PHYSICAL_DETAILS,
    ...(item?.physicalDetails || {}),
    height: item?.physicalDetails?.height || item?.height || "",
    weight: item?.physicalDetails?.weight || item?.weight || "",
    dominantSide:
      item?.physicalDetails?.dominantSide || item?.dominantSide || item?.dominantHandFoot || "",
    preferredSide: item?.physicalDetails?.preferredSide || item?.preferredSide || "",
    fitnessNotes: item?.physicalDetails?.fitnessNotes || item?.fitnessNotes || "",
    speedMetrics: item?.physicalDetails?.speedMetrics || item?.speedMetrics || "",
  };
}

function normalizePlayingHistory(item) {
  const currentTeam =
    item?.playingHistory?.currentTeam || item?.currentTeam || item?.club || "";
  const mainCompetition =
    item?.playingHistory?.mainCompetition || item?.mainCompetition || item?.competition || "";

  return {
    ...DEFAULT_PLAYING_HISTORY,
    ...(item?.playingHistory || {}),
    currentTeam,
    previousTeams: normalizeListField(
      item?.playingHistory?.previousTeams || item?.previousTeams,
    ),
    yearsPlayed: item?.playingHistory?.yearsPlayed || item?.yearsPlayed || "",
    mainCompetition,
    representativeHistory: normalizeListField(
      item?.playingHistory?.representativeHistory || item?.representativeHistory,
    ),
    schoolHistory: normalizeListField(item?.playingHistory?.schoolHistory || item?.schoolHistory),
    academyHistory: normalizeListField(
      item?.playingHistory?.academyHistory || item?.academyHistory,
    ),
  };
}

function normalizeReferences(item) {
  return {
    ...DEFAULT_REFERENCES,
    ...(item?.references || {}),
    coachName: item?.references?.coachName || item?.coachReferenceName || "",
    coachRole: item?.references?.coachRole || item?.coachReferenceRole || "",
  };
}

function getDirectoryTeamsForSport(sportDefinition, state, region = "") {
  return teamDirectorySeed.filter((entry) => {
    const sportMatches = !sportDefinition || entry.sport === sportDefinition.name;
    const stateMatches = !state || entry.state === state;
    const regionMatches =
      !region || region === NSW_RUGBY_LEAGUE_OTHER_REGION_VALUE || entry.region === region;
    return sportMatches && stateMatches && regionMatches;
  });
}

function findTeamDirectoryEntry({ name, sportDefinition, state, region }) {
  const normalizedName = normalizeText(name);
  if (!normalizedName) {
    return null;
  }

  const exactMatches = teamDirectorySeed.filter(
    (entry) => normalizeText(entry.name) === normalizedName,
  );

  if (exactMatches.length === 0) {
    return null;
  }

  return (
    exactMatches.find((entry) => {
      const sportMatches = !sportDefinition || entry.sport === sportDefinition.name;
      const stateMatches = !state || entry.state === state;
      const regionMatches =
        !region || region === NSW_RUGBY_LEAGUE_OTHER_REGION_VALUE || entry.region === region;
      return sportMatches && stateMatches && regionMatches;
    }) ||
    exactMatches.find((entry) => !sportDefinition || entry.sport === sportDefinition.name) ||
    exactMatches[0]
  );
}

function mapStarterClubToDirectoryTeam(club) {
  if (!club) {
    return null;
  }

  return {
    id: club.id,
    name: club.clubName || club.club_name,
    sport: club.sport,
    state: club.state,
    region: club.groupOrAssociation || club.group_or_association || club.region,
    suburb: club.suburb || "",
    postcode: club.postcode || "",
    competition: club.groupOrAssociation || club.group_or_association || club.region,
    level: "Regional",
    clubEntryType: club.verifiedStatus || club.verified_status || "starter_seed",
    isVerifiedDirectoryEntry: false,
  };
}

function findStarterClubDirectoryEntry({ name, sportDefinition, state }) {
  const club = getClubByName(name);
  if (!club) {
    return null;
  }

  const sportMatches = !sportDefinition || sportFilterMatches(sportDefinition.name, club.sport);
  const stateMatches = !state || club.state === state;

  return sportMatches && stateMatches ? mapStarterClubToDirectoryTeam(club) : null;
}

function deriveJuniorFlag(item) {
  if (typeof item?.isJunior === "boolean") {
    return item.isJunior;
  }

  if (isJuniorAgeGroup(item?.ageGroup)) {
    return true;
  }

  return item?.contactRoute !== "athlete";
}

function enrichProfileRecord(item) {
  const defaultSport = getDefaultSportDefinition();
  const sportDefinition =
    findSportDefinition(item?.sportId || item?.sport || item?.sportCategory) || defaultSport;
  const matchedTeam =
    (item?.teamDirectoryId && TEAMS_BY_ID[item.teamDirectoryId]) ||
    findTeamDirectoryEntry({
      name: item?.club,
      sportDefinition,
      state: item?.state,
    }) ||
    findStarterClubDirectoryEntry({
      name: item?.club,
      sportDefinition,
      state: item?.state,
    });
  const isJunior = deriveJuniorFlag(item);
  const achievementSections = normalizeAchievementSections(item);
  const playingHistory = normalizePlayingHistory(item);
  const references = normalizeReferences(item);
  const physicalDetails = normalizePhysicalDetails(item);
  const achievements = flattenAchievementSections(achievementSections);

  return {
    ...PROFILE_DEFAULTS,
    ...item,
    profileSummary: String(item?.profileSummary || "").trim(),
    sportId: sportDefinition.id,
    sportCategory: item?.sportCategory || sportDefinition.category,
    sport: sportDefinition.name,
    ageGroup: item?.ageGroup || "",
    isJunior,
    position: item?.position || getPositionOptionsForSport(sportDefinition)[0] || "",
    secondaryPosition: item?.secondaryPosition || "",
    region: item?.region || matchedTeam?.region || "",
    state: item?.state || matchedTeam?.state || "",
    postcode: item?.postcode || matchedTeam?.postcode || "",
    suburb: item?.suburb || matchedTeam?.suburb || "",
    club: item?.club || playingHistory.currentTeam || matchedTeam?.name || "",
    teamDirectoryId: matchedTeam?.id || "",
    clubEntryType: item?.clubEntryType || matchedTeam?.clubEntryType || (matchedTeam ? "directory" : "custom"),
    isVerifiedClubEntry:
      typeof item?.isVerifiedClubEntry === "boolean"
        ? item.isVerifiedClubEntry
        : Boolean(matchedTeam?.isVerifiedDirectoryEntry),
    competition: item?.competition || playingHistory.mainCompetition || matchedTeam?.competition || "",
    competitionLevel: item?.competitionLevel || matchedTeam?.level || "Local Club",
    physicalDetails,
    playingHistory,
    references,
    availability: {
      ...PROFILE_DEFAULTS.availability,
      ...(item?.availability || {}),
    },
    verificationBadges: Array.isArray(item?.verificationBadges) ? item.verificationBadges : [],
    achievementSections,
    achievements,
    stats: Array.isArray(item?.stats) ? item.stats : [],
    highlights: Array.isArray(item?.highlights) ? item.highlights : [],
    contactRoute: item?.contactRoute || (isJunior ? "parent_guardian" : "athlete"),
    profileStatus: item?.profileStatus || "Draft",
    visibilityStatus: item?.visibilityStatus || "Private",
  };
}

function normalizeProfile(item) {
  return enrichProfileRecord(item);
}

function normalizeProfiles(seed) {
  if (!Array.isArray(seed)) {
    return clone(sampleAthletes);
  }

  const source = seed.map((item) => normalizeProfile(item));

  return source.length > 0 ? source : clone(sampleAthletes);
}

function normalizeHighlights(seed) {
  if (!Array.isArray(seed)) {
    return clone(sampleHighlights);
  }

  const normalized = seed.map((item) => {
    const boostCount = Number(item?.boostCount);
    const createdAt = item?.createdAt || new Date().toISOString();
    const showcaseStatus = mapLegacyHighlightShowcaseStatus(item);
    const approvalStatus = mapLegacyHighlightApprovalStatus(item);
    const verificationSource =
      item?.verificationSource || mapLegacyHighlightVerificationStatus(item?.verificationStatus);

    return {
      ...HIGHLIGHT_DEFAULTS,
      ...item,
      sportId:
        item?.sportId ||
        findSportDefinition(item?.sport)?.id ||
        "",
      sportCategory:
        item?.sportCategory ||
        findSportDefinition(item?.sportId || item?.sport)?.category ||
        "",
      id: item?.id || `highlight-${createId("fallback")}`,
      athleteId: item?.athleteId || "",
      boostCount: Number.isNaN(boostCount) ? 0 : boostCount,
      isBoosted: Boolean(item?.isBoosted),
      isJunior: Boolean(item?.isJunior),
      state: item?.state || "",
      positionPlayed: item?.positionPlayed || item?.position || "",
      competition: item?.competition || "",
      competitionLevel: item?.competitionLevel || "",
      highlightType: item?.highlightType || item?.tag || "Match highlight",
      matchEvent: item?.matchEvent || item?.eventName || item?.match || "",
      eventName: item?.eventName || item?.matchEvent || "",
      date: item?.date || item?.eventDate || "",
      eventDate: item?.eventDate || item?.date || "",
      opponent: item?.opponent || "",
      videoUrl: item?.videoUrl || "",
      thumbnailUrl: item?.thumbnailUrl || "",
      verificationSource,
      approvalStatus,
      showcaseStatus,
      verificationStatus:
        item?.verificationStatus ||
        (approvalStatus === "Parent Approved"
          ? "Parent approved"
          : approvalStatus === "Coach Verified"
            ? "Coach verified"
            : approvalStatus === "Club Verified"
              ? "Club verified"
              : approvalStatus === "Admin Approved"
                ? "Admin approved"
                : item?.isJunior
                  ? "Parent approval needed"
                  : "Pending review"),
      visibilityStatus:
        showcaseStatus === "Showcase Approved"
          ? "Showcase Approved"
          : showcaseStatus === "Private"
            ? item?.isJunior && approvalStatus === "Pending Parent Approval"
              ? "Pending Parent Approval"
              : "Private"
            : showcaseStatus === "Profile Only"
              ? "Profile Only"
              : "Pending Verification",
      statusLabel: item?.statusLabel || getHighlightStatusLabel({ ...item, showcaseStatus, approvalStatus, boostCount }),
      isFeatured: Boolean(item?.isFeatured),
      createdAt,
      updatedAt: item?.updatedAt || createdAt,
    };
  });

  return normalized.length > 0 ? normalized : clone(sampleHighlights);
}

function normalizeAdminQueues(seed) {
  if (!seed || typeof seed !== "object") {
    return {
      ...clone(adminSeed),
      pendingOpportunities: [],
    };
  }

  return {
    ...ADMIN_QUEUE_DEFAULTS,
    ...seed,
    pendingProfiles: Array.isArray(seed.pendingProfiles)
      ? seed.pendingProfiles.map((item) => ({ ...item, status: item?.status || "Pending" }))
      : [],
    pendingHighlights: Array.isArray(seed.pendingHighlights)
      ? seed.pendingHighlights.map((item) => ({ ...item, status: item?.status || "Pending" }))
      : [],
    pendingOpportunities: Array.isArray(seed.pendingOpportunities)
      ? seed.pendingOpportunities.map((item) => ({ ...item, status: item?.status || "Pending" }))
      : [],
    verificationRequests: Array.isArray(seed.verificationRequests)
      ? seed.verificationRequests.map((item) => ({ ...item, status: item?.status || "Pending" }))
      : [],
    flaggedContent: Array.isArray(seed.flaggedContent)
      ? seed.flaggedContent.map((item) => ({ ...item, status: item?.status || "Pending" }))
      : [],
  };
}

function normalizeOpportunities(seed) {
  if (!Array.isArray(seed)) {
    return clone(opportunitySeed);
  }

  const normalized = seed.map((item) => {
    const sportDefinition =
      findSportDefinition(item?.sportId || item?.sport || item?.sportCategory) || getDefaultSportDefinition();
    const isJuniorOpportunity =
      typeof item?.isJuniorOpportunity === "boolean"
        ? item.isJuniorOpportunity
        : isJuniorAgeGroup(item?.ageGroup);

    return {
      ...OPPORTUNITY_DEFAULTS,
      ...item,
      id: item?.id || createId("opportunity"),
      sportId: item?.sportId || sportDefinition.id,
      sport: sportDefinition.name,
      sportCategory: item?.sportCategory || sportDefinition.category,
      ageGroup: item?.ageGroup || getDefaultAgeGroup(isJuniorOpportunity),
      isJuniorOpportunity,
      juniorSenior: item?.juniorSenior || (isJuniorOpportunity ? "Junior" : "Senior"),
      competitionLevel: item?.competitionLevel || "Local Club",
      opportunityType: item?.opportunityType || "Club recruitment",
      verificationStatus:
        item?.verificationStatus || "Pending Admin Verification",
      opportunityStatus: item?.opportunityStatus || "Draft",
      contactRoute:
        item?.contactRoute ||
        (isJuniorOpportunity
          ? "Under-18 interest routes to parent or guardian"
          : "Contact requests only"),
      visibilityStatus: item?.visibilityStatus || "Private",
      closingDate: item?.closingDate || "",
      createdAt: item?.createdAt || new Date().toISOString(),
      updatedAt: item?.updatedAt || item?.createdAt || new Date().toISOString(),
      createdByRole: item?.createdByRole || "club_scout",
      source: item?.source || "seed",
      storageSource: item?.storageSource || "localStorage",
      opportunityData: item?.opportunityData || {},
    };
  });

  return normalized.length > 0 ? normalized : clone(opportunitySeed);
}

function normalizeShortlist(seed) {
  if (!Array.isArray(seed)) {
    return [];
  }

  const seenShortlists = new Set();

  return seed
    .map((item) => ({
      ...SHORTLIST_DEFAULTS,
      ...item,
      id: item?.id || createId("shortlist"),
      athleteId: item?.athleteId || "",
      athleteProfileId: item?.athleteProfileId || item?.athleteId || "",
      athleteOwnerUserId: item?.athleteOwnerUserId || null,
      athleteDisplayName: item?.athleteDisplayName || "",
      athleteSport: item?.athleteSport || item?.sport || "",
      athleteSportId: item?.athleteSportId || item?.sportId || "",
      athletePositionRole: item?.athletePositionRole || item?.positionRole || item?.position || "",
      athleteAgeGroup: item?.athleteAgeGroup || item?.ageGroup || "",
      athleteState: item?.athleteState || item?.state || "",
      athleteRegion: item?.athleteRegion || item?.region || "",
      shortlistType: item?.shortlistType || "Athlete Shortlist",
      shortlistTypeRaw: item?.shortlistTypeRaw || item?.shortlistType || "athlete_shortlist",
      shortlistStatus: item?.shortlistStatus || "Active",
      sourceContext: item?.sourceContext || "manual",
      notes: item?.notes || "",
      noDirectMessaging:
        typeof item?.noDirectMessaging === "boolean" ? item.noDirectMessaging : true,
      createdAt: item?.createdAt || new Date().toISOString(),
      updatedAt: item?.updatedAt || item?.createdAt || new Date().toISOString(),
      createdByRole: item?.createdByRole || "club_scout",
      source: item?.source || "local-shortlist",
      storageSource: item?.storageSource || "localStorage",
      shortlistData:
        item?.shortlistData && typeof item.shortlistData === "object" && !Array.isArray(item.shortlistData)
          ? item.shortlistData
          : {},
    }))
    .filter((item) => {
      const shortlistStatus = normalizeText(item.shortlistStatus || "Active");
      const shortlistType = normalizeText(item.shortlistTypeRaw || item.shortlistType || "athlete shortlist");
      const duplicateKey = `${String(item.athleteId || "").trim().toLowerCase()}::${shortlistType}`;

      if (
        !item.athleteId ||
        shortlistStatus === "archived" ||
        shortlistStatus === "removed" ||
        seenShortlists.has(duplicateKey)
      ) {
        return false;
      }

      seenShortlists.add(duplicateKey);
      return true;
    });
}

function normalizeContactRequests(seed) {
  if (!Array.isArray(seed)) {
    return [];
  }

  return seed.map((item) => {
    const count = Number(item?.count);
    const createdAt = item?.createdAt || new Date().toISOString();
    const createdByRole = item?.createdByRole || "club_scout";
    const createdByLabel = item?.createdByLabel || getRoleLabel(createdByRole);
    const athleteIsJunior =
      typeof item?.athleteIsJunior === "boolean" ? item.athleteIsJunior : item?.to === "parent_guardian";
    const routeOwner = item?.to || (athleteIsJunior ? "parent_guardian" : "athlete");
    const history = Array.isArray(item?.history) && item.history.length > 0
      ? item.history.map((entry) => ({
          id: entry?.id || createId("request-event"),
          actorRole: entry?.actorRole || createdByRole,
          actorLabel: entry?.actorLabel || getRoleLabel(entry?.actorRole || createdByRole),
          createdAt: entry?.createdAt || createdAt,
        }))
      : [
          {
            id: createId("request-event"),
            actorRole: createdByRole,
            actorLabel: createdByLabel,
            createdAt,
          },
        ];

    return {
      id: item?.id || createId("request"),
      requesterUserId: item?.requesterUserId || null,
      athleteOwnerUserId: item?.athleteOwnerUserId || null,
      athleteId: item?.athleteId || "",
      athleteProfileId: item?.athleteProfileId || item?.athleteId || "",
      opportunityId: item?.opportunityId || "",
      opportunityTitle: item?.opportunityTitle || "",
      organisation: item?.organisation || "",
      requesterName: item?.requesterName || "",
      requesterEmail: item?.requesterEmail || "",
      requesterRole: item?.requesterRole || createdByLabel,
      requesterOrganisation: item?.requesterOrganisation || item?.organisation || "",
      athleteDisplayName: item?.athleteDisplayName || "",
      athleteIsJunior,
      contactRoute:
        item?.contactRoute ||
        (routeOwner === "parent_guardian"
          ? "Under-18 interest routes to parent or guardian"
          : "Contact requests only"),
      requestType: item?.requestType || "contact_request",
      requestTypeRaw: item?.requestTypeRaw || item?.requestType || "contact_request",
      status: item?.status || "Pending Review",
      safetyStatus: item?.safetyStatus || "Safe Pending",
      to: routeOwner,
      parentGuardianRequired:
        typeof item?.parentGuardianRequired === "boolean"
          ? item.parentGuardianRequired
          : routeOwner === "parent_guardian",
      adminReviewRequired:
        typeof item?.adminReviewRequired === "boolean" ? item.adminReviewRequired : true,
      noDirectMessaging:
        typeof item?.noDirectMessaging === "boolean" ? item.noDirectMessaging : true,
      requestReason: item?.requestReason || "",
      createdAt,
      updatedAt: item?.updatedAt || createdAt,
      count: Number.isNaN(count) ? history.length : count,
      createdByRole,
      createdByLabel,
      history,
      source: item?.source || "local-contact-request",
      storageSource: item?.storageSource || "localStorage",
      requestContext: item?.requestContext || {},
    };
  });
}

function syncAthleteHighlightRefs(athletes, highlights) {
  if (!Array.isArray(athletes)) {
    return [];
  }

  const highlightMap = (highlights || []).reduce((acc, highlight) => {
    if (!acc[highlight.athleteId]) {
      acc[highlight.athleteId] = [];
    }
    acc[highlight.athleteId].push(highlight);
    return acc;
  }, {});

  let changed = false;

  const next = athletes.map((athlete) => {
    const athleteHighlights = sortHighlightsByPriority(highlightMap[athlete.id] || []);
    const highlightIds = athleteHighlights.map((item) => item.id);
    const profileVisibleHighlightCount = athleteHighlights.filter(isHighlightProfileVisible).length;
    const showcaseReadyHighlightCount = athleteHighlights.filter(isHighlightShowcaseReady).length;
    const featuredHighlightId = athleteHighlights.find((item) => item.isFeatured)?.id || "";
    const previousIds = Array.isArray(athlete.highlights) ? athlete.highlights : [];

    const sameIds =
      previousIds.length === highlightIds.length &&
      previousIds.every((value, index) => value === highlightIds[index]);

    if (
      sameIds &&
      athlete.profileVisibleHighlightCount === profileVisibleHighlightCount &&
      athlete.showcaseReadyHighlightCount === showcaseReadyHighlightCount &&
      athlete.featuredHighlightId === featuredHighlightId
    ) {
      return athlete;
    }

    changed = true;

    return {
      ...athlete,
      highlights: highlightIds,
      profileVisibleHighlightCount,
      showcaseReadyHighlightCount,
      featuredHighlightId,
    };
  });

  return changed ? next : athletes;
}

function syncAdminHighlightQueue(queue, highlights, athletes) {
  const currentQueue = Array.isArray(queue) ? queue : [];
  const existingByHighlightId = Object.fromEntries(
    currentQueue
      .filter((item) => item?.highlightId)
      .map((item) => [item.highlightId, item]),
  );

  const next = sortHighlightsByPriority(highlights || [])
    .filter(shouldQueueHighlightForAdmin)
    .map((highlight) => {
      const athlete = (athletes || []).find((item) => item.id === highlight.athleteId) || null;
      return buildAdminHighlightQueueEntry(highlight, athlete, existingByHighlightId[highlight.id]);
    });

  const isSame =
    next.length === currentQueue.length &&
    next.every((item, index) => {
      const current = currentQueue[index];
      return (
        current &&
        current.id === item.id &&
        current.highlightId === item.highlightId &&
        current.title === item.title &&
        current.detail === item.detail &&
        current.status === item.status &&
        current.updatedAt === item.updatedAt
      );
    });

  return isSame ? currentQueue : next;
}

function syncAdminOpportunityQueue(queue, opportunities) {
  const currentQueue = Array.isArray(queue) ? queue : [];
  const existingByOpportunityId = Object.fromEntries(
    currentQueue
      .filter((item) => item?.opportunityId)
      .map((item) => [item.opportunityId, item]),
  );

  const next = (opportunities || [])
    .filter(shouldQueueOpportunityForAdmin)
    .map((opportunity) =>
      buildAdminOpportunityQueueEntry(opportunity, existingByOpportunityId[opportunity.id]),
    );

  const isSame =
    next.length === currentQueue.length &&
    next.every((item, index) => {
      const current = currentQueue[index];
      return (
        current &&
        current.id === item.id &&
        current.opportunityId === item.opportunityId &&
        current.title === item.title &&
        current.detail === item.detail &&
        current.status === item.status
      );
    });

  return isSame ? currentQueue : next;
}

function buildRequestMap(requests) {
  return (requests || []).reduce((acc, request) => {
    if (!request?.athleteId) {
      return acc;
    }

    if (!acc[request.athleteId]) {
      acc[request.athleteId] = {
        athleteId: request.athleteId,
        to: request.to,
        count: 0,
        contactRequestCount: 0,
        createdByRole: request.createdByRole,
        createdByLabel: request.createdByLabel,
        history: [],
        updatedAt: request.updatedAt || request.createdAt,
        requestType: request.requestType || "contact_request",
        opportunityInterestCount: 0,
      };
    }

    acc[request.athleteId] = {
      ...acc[request.athleteId],
      count:
        acc[request.athleteId].count +
        ((request.requestType || "contact_request") === "contact_request"
          ? Number(request.count || 1)
          : 0),
      contactRequestCount:
        acc[request.athleteId].contactRequestCount +
        ((request.requestType || "contact_request") === "contact_request"
          ? Number(request.count || 1)
          : 0),
      to: request.to || acc[request.athleteId].to,
      createdByRole: request.createdByRole || acc[request.athleteId].createdByRole,
      createdByLabel: request.createdByLabel || acc[request.athleteId].createdByLabel,
      updatedAt:
        new Date(request.updatedAt || request.createdAt || 0).getTime() >
        new Date(acc[request.athleteId].updatedAt || 0).getTime()
          ? request.updatedAt || request.createdAt
          : acc[request.athleteId].updatedAt,
      requestType: request.requestType || acc[request.athleteId].requestType,
      opportunityInterestCount:
        acc[request.athleteId].opportunityInterestCount +
        (request.requestType === "opportunity_interest" ? 1 : 0),
      history: [...(request.history || []), ...acc[request.athleteId].history].sort(
        (left, right) =>
          new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime(),
      ),
    };

    return acc;
  }, {});
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
}

function splitLines(text) {
  if (typeof text !== "string") {
    return [];
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseStats(text) {
  return splitLines(text).map((line, index) => {
    const colon = line.indexOf(":");
    if (colon === -1) {
      return { label: line, value: "--" };
    }

    return {
      label: line.slice(0, colon).trim() || `Stat ${index + 1}`,
      value: line.slice(colon + 1).trim() || "--",
    };
  });
}

function getInitials(name) {
  const words = String(name || "Athlete")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function joinMeta(parts) {
  return parts.filter(Boolean).join(" / ");
}

function getContactRouteLabel(route) {
  return route === "parent_guardian" ? "parent or guardian" : "athlete";
}

function getContactRoute(profile) {
  return profile?.contactRoute || (profile?.isJunior ? "parent_guardian" : "athlete");
}

function getLocationSummary(profile) {
  return joinMeta([profile?.suburb || profile?.postcode, profile?.region, profile?.state]);
}

function getTeamVerificationLabel(profile) {
  return profile?.isVerifiedClubEntry
    ? "Verified club entry"
    : "Added manually - pending verification";
}

function getJuniorSeniorLabel(profileOrFlag) {
  if (typeof profileOrFlag === "boolean") {
    return profileOrFlag ? "Junior" : "Senior";
  }

  return profileOrFlag?.isJunior ? "Junior" : "Senior";
}

function getDefaultAgeGroup(isJunior) {
  return isJunior ? "Under 18" : "Open";
}

function createProfileFormDefaults(selectedRole = DEFAULT_SELECTED_ROLE) {
  const defaultSport = getDefaultSportDefinition();
  const ageCategory = getRoleDefaultAgeCategory(selectedRole);

  return {
    displayName: "",
    ageGroup: "",
    customAgeGroup: "",
    ageCategory,
    sportCategory: defaultSport.category,
    sportId: defaultSport.id,
    sport: defaultSport.name,
    position: "",
    customPosition: "",
    secondaryPosition: "",
    customSecondaryPosition: "",
    region: "",
    customGroupRegion: "",
    state: "",
    postcode: "",
    suburb: "",
    club: "",
    customClubName: "",
    currentTeam: "",
    profileSummary: "",
    teamDirectoryId: "",
    clubEntryType: "custom",
    isVerifiedClubEntry: false,
    competition: "",
    mainCompetition: "",
    customCompetitionGroup: "",
    competitionLevel: "Local Club",
    height: "",
    weight: "",
    dominantSide: "",
    preferredSide: "",
    fitnessNotes: "",
    speedMetrics: "",
    previousTeams: "",
    yearsPlayed: "",
    representativeHistory: "",
    schoolHistory: "",
    academyHistory: "",
    awards: "",
    representativeSelections: "",
    finalsHistory: "",
    mvpAwards: "",
    bestAndFairest: "",
    carnivalResults: "",
    otherAchievements: "",
    stats: "",
    highlightTitle: "",
    highlightType: "Match highlight",
    customHighlightType: "",
    highlightEvent: "",
    highlightDate: "",
    highlightVideoUrl: "",
    highlightVerificationStatus:
      ageCategory === "Junior" ? "Parent approval needed" : "Pending review",
    coachReferenceName: "",
    coachReferenceRole: "",
    availability: {
      ...PROFILE_DEFAULTS.availability,
    },
    profileVisibility: "Private",
  };
}

function profileMatchesRole(profile, role) {
  if (!profile) {
    return false;
  }

  if (role === "junior_athlete" || role === "parent_guardian") {
    return profile.isJunior;
  }

  if (role === "adult_athlete") {
    return !profile.isJunior;
  }

  return true;
}

function getLatestRoleProfile(athletes, role, localOnly = false) {
  return (
    athletes.find(
      (profile) =>
        profileMatchesRole(profile, role) &&
        (!localOnly || profile.source === "local-draft"),
    ) || null
  );
}

function deriveStatusMessage(item) {
  if (item?.profileStatus === "Showcase Approved") {
    return "Profile visible in showcase discovery.";
  }
  if (item?.profileStatus === "Pending Parent Approval") {
    return "Awaiting parent or guardian approval.";
  }
  if (item?.profileStatus === "Pending Verification") {
    return "Waiting for trust and verification review.";
  }
  if (item?.profileStatus === "Profile Approved by Parent") {
    return "Approved by parent or guardian and ready for verification review.";
  }
  return item?.profileStatus || "Draft";
}

function hasReferenceInfo(profile) {
  return Boolean(
    profile?.references?.coachName ||
      profile?.references?.coachRole ||
      profile?.verificationBadges?.length > 0 ||
      profile?.isVerifiedClubEntry,
  );
}

function hasAvailabilityInfo(profile) {
  const availability = profile?.availability || {};
  return Object.entries(availability).some(([key, value]) =>
    key === "preferredLocations" ? Boolean(String(value || "").trim()) : Boolean(value),
  );
}

function calculateProfileCompleteness(profile) {
  const checks = [
    Boolean(
      profile?.displayName &&
        profile?.ageGroup &&
        profile?.state &&
        profile?.region &&
        (profile?.sportId || profile?.sport),
    ),
    Boolean(profile?.position && profile?.club && profile?.competitionLevel),
    profile?.achievements?.length > 0,
    profile?.stats?.length > 0,
    getProfileVisibleHighlightCount(profile) > 0,
    hasReferenceInfo(profile),
    hasAvailabilityInfo(profile),
    profile?.isJunior ? profile?.profileStatus !== "Pending Parent Approval" : true,
  ];

  const score = checks.filter(Boolean).length;
  return Math.round((score / checks.length) * 100);
}

function getProfileCompletenessLabel(score, profile) {
  if (score >= 90 && isVerifiedProfile(profile)) {
    return "Verified Resume";
  }
  if (score >= 70) {
    return "Scout Ready";
  }
  if (score >= 35) {
    return "Building";
  }
  return "Draft";
}

function calculateCompletion(profile) {
  return calculateProfileCompleteness(profile);
}

function getProfileStrengthLabel(score, profile) {
  return getProfileCompletenessLabel(score, profile);
}

function buildChecklist(profile) {
  return [
    {
      label: "Complete athlete identity details",
      complete: Boolean(
        profile?.displayName &&
          profile?.ageGroup &&
          profile?.state &&
          profile?.region &&
          profile?.position,
      ),
    },
    {
      label: "Confirm sport, role, team, and competition context",
      complete: Boolean(profile?.sportId && profile?.club && profile?.competitionLevel),
    },
    {
      label: "Add at least one highlight",
      complete: getProfileVisibleHighlightCount(profile) > 0,
    },
    {
      label: "Add key achievements",
      complete: profile?.achievements?.length > 0,
    },
    {
      label: "Add sport-aware stats",
      complete: profile?.stats?.length > 0,
    },
    {
      label: "Add coach reference",
      complete: Boolean(profile?.references?.coachName || profile?.references?.coachRole),
    },
    {
      label: "Complete availability",
      complete: hasAvailabilityInfo(profile),
    },
    {
      label: profile?.isJunior ? "Get parent approval" : "Get coach or club verification",
      complete: profile?.isJunior
        ? profile?.profileStatus !== "Pending Parent Approval"
        : Boolean(
            profile?.isVerifiedClubEntry ||
              profile?.verificationBadges?.some((badge) =>
                /verified|approved/i.test(String(badge)),
              ),
          ),
    },
  ];
}

function calculateBuilderCompletion(form) {
  const resolved = getResolvedProfileFormValues(form);
  const checks = [
    Boolean(
      form?.displayName &&
        resolved.resolvedAgeGroup &&
        form?.state &&
        resolved.resolvedRegion &&
        (form?.sportId || form?.sport),
    ),
    Boolean(
      resolved.resolvedPosition &&
        resolved.resolvedClub &&
        resolved.resolvedCompetitionLevel,
    ),
    Boolean(
      form?.previousTeams?.trim() ||
        form?.yearsPlayed?.trim() ||
        form?.representativeHistory?.trim(),
    ),
    Boolean(
      form?.awards?.trim() ||
        form?.representativeSelections?.trim() ||
        form?.finalsHistory?.trim() ||
        form?.otherAchievements?.trim(),
    ),
    Boolean(form?.stats?.trim()),
    Boolean(form?.highlightTitle?.trim()),
    Boolean(form?.coachReferenceName?.trim() || form?.coachReferenceRole?.trim()),
    hasAvailabilityInfo({ availability: form?.availability }),
  ];

  const score = checks.filter(Boolean).length;
  return Math.round((score / checks.length) * 100);
}

function buildBuilderChecklist(form) {
  const resolved = getResolvedProfileFormValues(form);
  return [
    {
      label: "Basic identity added",
      complete: Boolean(form?.displayName && resolved.resolvedAgeGroup && form?.state),
    },
    {
      label: "Sport, position, and team added",
      complete: Boolean(
        form?.sportCategory &&
          (form?.sportId || form?.sport) &&
          resolved.resolvedPosition &&
          resolved.resolvedClub,
      ),
    },
    {
      label: "Playing history added",
      complete: Boolean(
        form?.currentTeam?.trim() || form?.previousTeams?.trim() || form?.representativeHistory?.trim(),
      ),
    },
    {
      label: "Achievements added",
      complete: Boolean(
        form?.awards?.trim() ||
          form?.representativeSelections?.trim() ||
          form?.finalsHistory?.trim() ||
          form?.otherAchievements?.trim(),
      ),
    },
    {
      label: "Stats added",
      complete: Boolean(form?.stats?.trim()),
    },
    {
      label: "Highlight placeholder added",
      complete: Boolean(form?.highlightTitle?.trim()),
    },
    {
      label: "Reference and availability added",
      complete: Boolean(form?.coachReferenceName?.trim() || form?.coachReferenceRole?.trim()) &&
        hasAvailabilityInfo({ availability: form?.availability }),
    },
  ];
}

function getAvailabilityBadges(profile) {
  if (!profile?.availability) {
    return [];
  }

  return [
    profile.availability.openToTrials ? "Open to trials" : null,
    profile.availability.openToAcademy ? "Open to academy opportunities" : null,
    profile.availability.openToSchoolSport ? "Open to school sport opportunities" : null,
    profile.availability.openToRepresentativePathways ? "Open to representative pathways" : null,
    profile.availability.openToSeniorSigning ? "Open to senior signing" : null,
    profile.availability.openToFirstGrade ? "Open to first grade opportunities" : null,
    profile.availability.openToReserveGrade ? "Open to reserve grade opportunities" : null,
    profile.availability.willingToRelocate ? "Willing to relocate" : null,
    profile.availability.preferredLocations
      ? `Preferred locations: ${profile.availability.preferredLocations}`
      : null,
  ].filter(Boolean);
}

function formatAvailability(profile) {
  const items = getAvailabilityBadges(profile);
  return items.length > 0 ? items.join(" / ") : "Opportunity preferences not set.";
}

function playingHistoryFromProfile(profile) {
  const sportDefinition = getSportDefinitionForProfile(profile);
  const teamLabel = getTeamFieldLabel(sportDefinition);
  const history = profile?.playingHistory || DEFAULT_PLAYING_HISTORY;
  const base = [];

  if (history.currentTeam || history.mainCompetition || profile?.club || profile?.competition) {
    base.push({
      year: profile?.competitionLevel || "Current season",
      title: `${history.currentTeam || profile?.club || teamLabel} / ${profile.sport || "Sport not set"}`,
      details: `Competing in ${profile.competition || "local competition"} from ${
        getLocationSummary(profile) || "their region"
      }.`,
    });
  }

  if (history.yearsPlayed) {
    base.push({
      year: "Years played",
      title: history.yearsPlayed,
      details: `Main competition: ${history.mainCompetition || profile?.competition || "Not provided"}.`,
    });
  }

  if (history.previousTeams?.[0]) {
    base.push({
      year: "Previous teams",
      title: history.previousTeams[0],
      details: history.previousTeams.slice(1).join(" / ") || "Previous team history added.",
    });
  }

  if (history.representativeHistory?.[0]) {
    base.push({
      year: "Representative pathway",
      title: history.representativeHistory[0],
      details: history.representativeHistory.slice(1).join(" / ") || "Representative history added.",
    });
  }

  if (history.schoolHistory?.[0]) {
    base.push({
      year: "School sport",
      title: history.schoolHistory[0],
      details: history.schoolHistory.slice(1).join(" / ") || "School sport history added.",
    });
  }

  if (history.academyHistory?.[0]) {
    base.push({
      year: "Academy pathway",
      title: history.academyHistory[0],
      details: history.academyHistory.slice(1).join(" / ") || "Academy history added.",
    });
  }

  if (profile?.isJunior) {
    base.push({
      year: "Development pathway",
      title: "Junior progression",
      details:
        "Growth is tracked through verified coaches, guardian approvals, and controlled visibility.",
    });
  }

  if (!profile?.isJunior) {
    base.push({
      year: "Recruitment pathway",
      title: "Senior readiness",
      details: `Opportunity status: ${formatAvailability(profile)}.`,
    });
  }

  return base;
}

function isVerifiedProfile(profile) {
  return (
    (profile?.verificationBadges?.length || 0) > 0 ||
    profile?.profileStatus === "Showcase Approved" ||
    profile?.visibilityStatus === "Showcase Approved"
  );
}

function getVerificationSummary(profile) {
  if (!profile) {
    return "Verification not started.";
  }

  if (profile.profileStatus === "Showcase Approved") {
    return "Verified and approved for premium showcase visibility.";
  }

  if (profile.profileStatus === "Pending Parent Approval") {
    return "Waiting for parent or guardian approval before wider visibility.";
  }

  if (profile.profileStatus === "Pending Verification") {
    return "Submitted and awaiting trust review before profile visibility expands.";
  }

  if (profile.profileStatus === "Profile Approved by Parent") {
    return "Guardian approval completed. The profile is ready for the next trust step.";
  }

  return `Current status: ${profile.profileStatus || "Draft"}.`;
}

function getProfileAbout(profile) {
  if (!profile) {
    return "";
  }

  const profileSummary = String(profile.profileSummary || "").trim();
  if (profileSummary) {
    return profileSummary;
  }

  const achievement = profile.achievements?.[0];
  const opportunitySummary = formatAvailability(profile);
  const sportDefinition = getSportDefinitionForProfile(profile);
  const teamLabel = getTeamFieldLabel(sportDefinition);
  const history = profile.playingHistory || DEFAULT_PLAYING_HISTORY;
  const referenceName = profile.references?.coachName;

  return `${profile.displayName} is a ${profile.position || "player"} in ${
    profile.sport || "their sport"
  } based in ${getLocationSummary(profile) || "their region"}, currently representing ${
    profile.club || `their ${teamLabel.toLowerCase()}`
  } at ${profile.competitionLevel || "their competition level"} in ${
    profile.competition || "their competition"
  }. ${
    achievement ? `Recent note: ${achievement}. ` : ""
  }${
    history.representativeHistory?.[0]
      ? `Representative note: ${history.representativeHistory[0]}. `
      : ""
  }${
    referenceName ? `Reference: ${referenceName}. ` : ""
  }Opportunity status: ${opportunitySummary}`;
}

function getCoachReference(profile) {
  const badges =
    profile?.verificationBadges?.length > 0
      ? profile.verificationBadges.join(", ")
      : "Verification still pending";
  const clubStatus = getTeamVerificationLabel(profile);
  const referenceName = profile?.references?.coachName || "Coach reference not added yet";
  const referenceRole = profile?.references?.coachRole || "Coach / reference role not set";

  return `Trust note: this athlete is presented through a controlled sports resume workflow. Reference on file: ${referenceName} (${referenceRole}). Verified signals recorded so far: ${badges}. Club directory status: ${clubStatus}. Requests are routed to the ${getContactRouteLabel(
    getContactRoute(profile),
  )}.`;
}

function getJerseyNumber(profile) {
  const match = String(profile?.ageGroup || "").match(/\d+/);
  if (match) {
    return match[0].padStart(2, "0").slice(-2);
  }

  return String((profile?.displayName || "A").length).padStart(2, "0").slice(-2);
}

function getRecruitingLevel(profile) {
  return `${getJuniorSeniorLabel(profile)} pathway`;
}

function getPrimaryHighlight(highlights, athleteId) {
  return getHighlightsForAthlete(highlights, athleteId)[0] || null;
}

function getOpportunityCount(profile) {
  return getAvailabilityBadges(profile).length;
}

function getSafeRequestMessage(request, route) {
  if (!request || (request.contactRequestCount || 0) === 0) {
    return `No request sent yet. Safe contact routes to the ${getContactRouteLabel(route)}.`;
  }

  return `Request sent to the ${getContactRouteLabel(route)}. Total requests: ${
    request.contactRequestCount || request.count || 1
  }.`;
}

function getKeyAchievement(profile) {
  return profile?.achievements?.[0] || "Achievement details not added yet.";
}

function getAchievementSectionEntries(profile) {
  const sections = profile?.achievementSections || DEFAULT_ACHIEVEMENT_SECTIONS;

  return Object.entries(ACHIEVEMENT_SECTION_LABELS)
    .map(([key, label]) => ({
      key,
      label,
      items: Array.isArray(sections?.[key]) ? sections[key] : [],
    }))
    .filter((entry) => entry.items.length > 0);
}

function getPhysicalDetailRows(profile) {
  const details = profile?.physicalDetails || DEFAULT_PHYSICAL_DETAILS;

  return [
    { label: "Height", value: details.height },
    { label: "Weight", value: details.weight },
    { label: "Dominant foot / hand", value: details.dominantSide },
    { label: "Preferred side", value: details.preferredSide },
    { label: "Fitness notes", value: details.fitnessNotes },
    { label: "Speed / fitness metrics", value: details.speedMetrics },
  ].filter((item) => Boolean(String(item.value || "").trim()));
}

function getResumeVisibilityWarnings(profile) {
  if (!profile) {
    return [];
  }

  const warnings = [];

  if ((profile.visibilityStatus || "Private") === "Private") {
    warnings.push("This resume is private and not visible to scouts yet.");
  }

  if (profile.isJunior && profile.profileStatus === "Pending Parent Approval") {
    warnings.push("Parent/guardian approval required before this resume can be shared.");
  }

  if (profile.profileStatus === "Pending Verification") {
    warnings.push("Pending verification - preview only.");
  }

  return warnings;
}

function getDemoSharePath(athleteId, options = {}) {
  const query = options.print ? "?print=1" : "";
  return `/resume/${athleteId}${query}`;
}

function getDemoShareUrl(athleteId, options = {}) {
  const path = getDemoSharePath(athleteId, options);

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }

  return `https://demo.mysportsresume.local${path}`;
}

async function copyTextToClipboard(text) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function requestWasCreatedByRole(request, role) {
  if (!request) {
    return false;
  }

  if (request.createdByRole === role) {
    return true;
  }

  return Array.isArray(request.history)
    ? request.history.some((entry) => entry.actorRole === role)
    : false;
}

function getMissingProfileFields(formPayload, mode) {
  const missing = [];
  const resolved = getResolvedProfileFormValues(formPayload);

  if (!String(formPayload?.displayName || "").trim()) {
    missing.push("Display name");
  }

  if (mode !== "submit") {
    return missing;
  }

  if (!String(resolved.resolvedAgeGroup || "").trim()) {
    missing.push("Age group");
  }
  if (!String(formPayload?.state || "").trim()) {
    missing.push("State");
  }
  if (!String(resolved.resolvedRegion || "").trim()) {
    missing.push("Group / region");
  }
  if (!String(resolved.resolvedPosition || "").trim()) {
    missing.push("Position / role");
  }
  if (!String(resolved.resolvedClub || "").trim()) {
    missing.push("Team / club / program");
  }
  if (!String(resolved.resolvedCompetitionLevel || "").trim()) {
    missing.push("Competition level");
  }

  return missing;
}

function getRoleRequestRows(contactRequests, athletes, opportunities, role) {
  return contactRequests
    .map((request) => {
      const athlete = athletes.find((item) => item.id === request.athleteId);
      if (!athlete) {
        return null;
      }

      if ((role === "junior_athlete" || role === "parent_guardian") && request.to !== "parent_guardian") {
        return null;
      }

      if (role === "adult_athlete" && request.to !== "athlete") {
        return null;
      }

      if (role === "club_scout" && !requestWasCreatedByRole(request, "club_scout")) {
        return null;
      }

      const opportunity = request.opportunityId
        ? opportunities.find((item) => item.id === request.opportunityId) || null
        : null;

      return {
        athlete,
        request,
        opportunity,
      };
    })
    .filter(Boolean);
}

function getPrimaryStat(profile) {
  if (profile?.stats?.length > 0) {
    return profile.stats[0];
  }

  if (getProfileVisibleHighlightCount(profile) > 0) {
    return {
      label: "Visible highlights",
      value: String(getProfileVisibleHighlightCount(profile)),
    };
  }

  return {
    label: "Status",
    value: profile?.profileStatus || "Draft",
  };
}

const SUPABASE_PROFILE_TEST_NAME = "MSR Supabase Test Profile";

function createProfileBackendTestState(overrides = {}) {
  return {
    status: "idle",
    label: "Not run yet",
    message: "Run the profile backend test to verify athlete_profiles save/load through the current signed-in session.",
    savedProfileId: "",
    sourceUsed: "",
    profileDataExists: null,
    ownerUserIdExists: null,
    foundOnReload: null,
    lastRanAt: "",
    deleteMessage: "",
    ...overrides,
  };
}

function buildSupabaseProfileBackendTestRecord() {
  const createdAt = new Date().toISOString();

  return enrichProfileRecord({
    ...PROFILE_DEFAULTS,
    id: createStableAthleteProfileId(),
    displayName: SUPABASE_PROFILE_TEST_NAME,
    isJunior: false,
    ageGroup: "First Grade",
    sportCategory: "Football Codes",
    sport: "Rugby League",
    sportId: "rugby-league",
    position: "Hooker",
    secondaryPosition: "",
    state: "NSW",
    region: "Hunter",
    club: "Maitland Maroons",
    teamDirectoryId: "team-rugby-league-maitland-maroons",
    clubEntryType: "directory",
    isVerifiedClubEntry: true,
    competition: "Newcastle Rugby League",
    competitionLevel: "First Grade",
    profileStatus: "Draft",
    visibilityStatus: "Private",
    contactRoute: "athlete",
    achievements: ["Supabase athlete profile backend QA record"],
    achievementSections: {
      ...DEFAULT_ACHIEVEMENT_SECTIONS,
      otherAchievements: ["Supabase athlete profile backend QA record"],
    },
    stats: [
      { label: "Tries", value: "2" },
      { label: "Tackles", value: "34" },
    ],
    references: {
      coachName: "Backend QA Coach",
      coachRole: "Test reference",
    },
    availability: {
      ...PROFILE_DEFAULTS.availability,
      openToSeniorSigning: true,
      openToFirstGrade: true,
    },
    physicalDetails: {
      ...DEFAULT_PHYSICAL_DETAILS,
      dominantSide: "Right",
    },
    playingHistory: {
      ...DEFAULT_PLAYING_HISTORY,
      currentTeam: "Maitland Maroons",
      mainCompetition: "Newcastle Rugby League",
      yearsPlayed: "2026",
    },
    completenessScore: 72,
    createdAt,
    updatedAt: createdAt,
    source: "supabase-profile-test",
    testMetadata: {
      kind: "supabase_profile_backend_test",
      createdAt,
      note: "Temporary QA record created from the in-app Supabase Profile Test panel.",
    },
  });
}

const SUPABASE_HIGHLIGHT_TEST_NAME = "MSR Supabase Test Highlight";
const SUPABASE_THUMBNAIL_TEST_PROFILE_NAME = "MSR Supabase Thumbnail Test Athlete";
const SUPABASE_THUMBNAIL_TEST_HIGHLIGHT_NAME = "MSR Supabase Thumbnail Test Highlight";

function createHighlightBackendTestState(overrides = {}) {
  return {
    status: "idle",
    label: "Not run yet",
    message:
      "Run the highlight backend test to verify highlights save/load through the current signed-in session.",
    savedHighlightId: "",
    sourceUsed: "",
    highlightDataExists: null,
    ownerUserIdExists: null,
    athleteProfileIdExists: null,
    foundOnReload: null,
    lastRanAt: "",
    deleteMessage: "",
    ...overrides,
  };
}

function buildSupabaseHighlightBackendTestRecord(athlete) {
  const createdAt = new Date().toISOString();

  return buildManagedHighlightRecord({
    athlete,
    formPayload: {
      title: SUPABASE_HIGHLIGHT_TEST_NAME,
      sport: athlete?.sport || "Rugby League",
      highlightType: "Match highlight",
      matchEvent: "Supabase QA save/load check",
      competition: athlete?.competition || "Newcastle Rugby League",
      date: createdAt.slice(0, 10),
      opponent: "Backend QA Opponent",
      positionPlayed: athlete?.position || "Hooker",
      description:
        "Temporary QA highlight metadata record created from the in-app Supabase Highlight Test panel.",
      videoUrl: "https://example.com/highlights/supabase-highlight-test",
      thumbnailUrl: "https://example.com/highlights/supabase-highlight-test-thumb.jpg",
      verificationSource: athlete?.isJunior ? "Parent" : "Admin",
      showcaseStatus: athlete?.isJunior ? "Private" : "Profile Only",
    },
    overrideFields: {
      isFeatured: false,
      approvalStatus: athlete?.isJunior ? "Pending Parent Approval" : "Admin Approved",
      showcaseStatus: athlete?.isJunior ? "Private" : "Profile Only",
    },
  });
}

function buildSupabaseFullThumbnailTestProfileRecord() {
  const createdAt = new Date().toISOString();
  const baseProfile = buildSupabaseProfileBackendTestRecord();

  return enrichProfileRecord({
    ...baseProfile,
    id: createStableAthleteProfileId(),
    displayName: SUPABASE_THUMBNAIL_TEST_PROFILE_NAME,
    sport: "Rugby League",
    sportId: "rugby-league",
    sportCategory: "Football Codes",
    position: "Hooker",
    state: "NSW",
    region: "Hunter",
    profileStatus: "Draft",
    visibilityStatus: "Private",
    contactRoute: "athlete",
    source: "supabase-thumbnail-full-test",
    createdAt,
    updatedAt: createdAt,
    testMetadata: {
      kind: "supabase_full_thumbnail_test_profile",
      createdAt,
      note: "Temporary QA athlete profile created or reused by the full Supabase highlight thumbnail test.",
    },
  });
}

function buildSupabaseFullThumbnailTestHighlightRecord(athlete) {
  const createdAt = new Date().toISOString();
  const baseHighlight = buildSupabaseHighlightBackendTestRecord(athlete);

  return normalizeHighlights([
    {
      ...baseHighlight,
      title: SUPABASE_THUMBNAIL_TEST_HIGHLIGHT_NAME,
      highlightType: "Match clip",
      matchEvent: "Supabase full private thumbnail QA flow",
      competition: athlete?.competition || "Newcastle Rugby League",
      date: createdAt.slice(0, 10),
      description:
        "Temporary QA highlight created by the full Supabase highlight thumbnail test so private thumbnail upload can be proven without the file picker.",
      videoUrl: "",
      thumbnailUrl: "",
      approvalStatus: athlete?.isJunior ? "Pending Parent Approval" : "Pending Admin Review",
      showcaseStatus: "Private",
      source: "supabase-thumbnail-full-test",
      storageSource: "localStorage",
      testMetadata: {
        kind: "supabase_full_thumbnail_test_highlight",
        createdAt,
        note: "Temporary QA highlight created or reused by the full Supabase highlight thumbnail test.",
      },
    },
  ])[0];
}

const SUPABASE_OPPORTUNITY_TEST_NAME = "MSR Supabase Test Opportunity";

function createOpportunityBackendTestState(overrides = {}) {
  return {
    status: "idle",
    label: "Not run yet",
    message:
      "Run the opportunity backend test to verify opportunities save/load through the current signed-in session.",
    savedOpportunityId: "",
    sourceUsed: "",
    opportunityDataExists: null,
    ownerUserIdExists: null,
    foundOnReload: null,
    lastRanAt: "",
    deleteMessage: "",
    ...overrides,
  };
}

function buildSupabaseOpportunityBackendTestRecord() {
  const createdAt = new Date().toISOString();

  return normalizeOpportunities([
    {
      ...OPPORTUNITY_DEFAULTS,
      id: createId("opportunity"),
      title: SUPABASE_OPPORTUNITY_TEST_NAME,
      organisation: "My Sports Resume Test Club",
      contactRoleTitle: "Recruitment coordinator",
      sport: "Rugby League",
      sportCategory: "Football Codes",
      sportId: "rugby-league",
      positionRole: "Hooker",
      ageGroup: "First Grade",
      isJuniorOpportunity: false,
      juniorSenior: "Senior",
      state: "NSW",
      region: "Hunter",
      competitionLevel: "First Grade",
      opportunityType: "Club recruitment",
      description:
        "Temporary QA opportunity metadata record created from the in-app Supabase Opportunity Test panel.",
      requirements:
        "Supabase opportunity backend QA record. Keep this as metadata only with no direct messaging.",
      verificationStatus: "Pending Admin Verification",
      opportunityStatus: "Draft",
      contactRoute: "Contact requests only",
      visibilityStatus: "Private",
      closingDate: createdAt.slice(0, 10),
      createdAt,
      updatedAt: createdAt,
      createdByRole: "club_scout",
      source: "supabase-opportunity-test",
      storageSource: "localStorage",
      opportunityData: {
        testMetadata: {
          kind: "supabase_opportunity_backend_test",
          createdAt,
          note: "Temporary QA opportunity metadata record created from the in-app Supabase Opportunity Test panel.",
        },
      },
    },
  ])[0];
}

const SUPABASE_CONTACT_REQUEST_TEST_NAME = "MSR Contact Test";

function createContactRequestBackendTestState(overrides = {}) {
  return {
    status: "idle",
    label: "Not run yet",
    message:
      "Run the contact request backend test to verify contact_requests save/load through the current signed-in session.",
    savedContactRequestId: "",
    sourceUsed: "",
    requestContextExists: null,
    requesterUserIdExists: null,
    athleteOwnerUserIdExists: null,
    foundOnReload: null,
    lastRanAt: "",
    deleteMessage: "",
    ...overrides,
  };
}

function buildSupabaseContactRequestBackendTestRecord(athlete) {
  const createdAt = new Date().toISOString();
  const isJunior = Boolean(athlete?.isJunior);

  return normalizeContactRequests([
    {
      id: createId("request"),
      requesterName: SUPABASE_CONTACT_REQUEST_TEST_NAME,
      requesterEmail: APP_SUPPORT_EMAIL,
      requesterRole: "Admin QA",
      requesterOrganisation: "My Sports Resume",
      athleteOwnerUserId: athlete?.ownerUserId || null,
      athleteId: athlete?.id || "",
      athleteProfileId: athlete?.id || "",
      athleteDisplayName: athlete?.displayName || "Owned athlete profile",
      athleteIsJunior: isJunior,
      contactRoute: isJunior
        ? "Under-18 interest routes to parent or guardian"
        : "Contact requests only",
      to: isJunior ? "parent_guardian" : "athlete",
      requestType: "contact_request",
      requestTypeRaw: "general_contact_request",
      status: isJunior ? "Pending Parent/Guardian" : "Pending Review",
      safetyStatus: "Safe Pending",
      parentGuardianRequired: isJunior,
      adminReviewRequired: true,
      noDirectMessaging: true,
      requestReason: "Automated QA contact request metadata test.",
      count: 1,
      createdByRole: "admin",
      createdByLabel: "Admin QA",
      history: [
        {
          id: createId("request-event"),
          actorRole: "admin",
          actorLabel: "Admin QA",
          createdAt,
        },
      ],
      source: "supabase-contact-request-test",
      storageSource: "localStorage",
      requestContext: {
        testMetadata: {
          kind: "supabase_contact_request_backend_test",
          createdAt,
          note: "Temporary QA contact request metadata record created from the in-app Supabase Contact Request Test panel.",
        },
      },
      createdAt,
      updatedAt: createdAt,
    },
  ])[0];
}

const SUPABASE_SHORTLIST_TEST_NAME = "MSR Supabase Test Profile";

function createShortlistBackendTestState(overrides = {}) {
  return {
    status: "idle",
    label: "Not run yet",
    message:
      "Run the shortlist backend test to verify shortlists save/load through the current signed-in session.",
    savedShortlistId: "",
    sourceUsed: "",
    shortlistDataExists: null,
    ownerUserIdExists: null,
    athleteProfileIdExists: null,
    foundOnReload: null,
    lastRanAt: "",
    deleteMessage: "",
    ...overrides,
  };
}

function buildSupabaseShortlistBackendTestRecord(athlete) {
  const createdAt = new Date().toISOString();

  return buildManagedShortlistRecord({
    athlete,
    actorRole: "club_scout",
    sourceContext: "qa_panel",
    notes: "Temporary QA shortlist record created from the in-app Supabase Shortlist Test panel.",
    overrideFields: {
      athleteDisplayName: athlete?.displayName || SUPABASE_SHORTLIST_TEST_NAME,
      athleteSport: athlete?.sport || "Rugby League",
      athleteSportId: athlete?.sportId || "rugby-league",
      athletePositionRole: athlete?.position || "Hooker",
      athleteAgeGroup: athlete?.ageGroup || "Open",
      athleteState: athlete?.state || "NSW",
      athleteRegion: athlete?.region || "Hunter",
      shortlistType: "Athlete Shortlist",
      shortlistTypeRaw: "athlete_shortlist",
      shortlistStatus: "Active",
      noDirectMessaging: true,
      source: "supabase-shortlist-test",
      storageSource: "localStorage",
      shortlistData: {
        testMetadata: {
          kind: "supabase_shortlist_backend_test",
          createdAt,
          note: "Temporary QA shortlist metadata record created from the in-app Supabase Shortlist Test panel.",
        },
      },
    },
  });
}

const SUPABASE_ADMIN_QUEUE_TEST_TITLE = "MSR Supabase Admin Queue Test";

function createAdminQueueBackendTestState(overrides = {}) {
  return {
    status: "idle",
    label: "Not run yet",
    message:
      "Run the admin queue backend test to verify admin queue records save/load through the current signed-in session.",
    savedAdminQueueItemId: "",
    sourceUsed: "",
    queueDataExists: null,
    ownerUserIdExists: null,
    foundOnReload: null,
    insertErrorMessage: "",
    reloadErrorMessage: "",
    diagnosticLabel: "",
    lastRanAt: "",
    deleteMessage: "",
    ...overrides,
  };
}

function getAdminQueueDiagnosticLabel(category = "") {
  switch (String(category || "").trim().toLowerCase()) {
    case "rls_policy":
      return "RLS / policy error";
    case "permission":
      return "Permission / grant error";
    case "constraint":
      return "Constraint / check violation";
    case "table_missing":
      return "Table missing";
    case "column_missing":
      return "Column missing";
    case "no_session":
      return "No active Supabase session";
    case "table_or_policy_unavailable":
      return "Table or policy not ready";
    case "unknown":
      return "Unknown backend error";
    default:
      return "";
  }
}

function buildSupabaseAdminQueueBackendTestRecord() {
  const createdAt = new Date().toISOString();

  return buildManagedAdminQueueRecord({
    queueType: "profile_review",
    title: SUPABASE_ADMIN_QUEUE_TEST_TITLE,
    detail: "Temporary QA admin queue metadata record created from the in-app Supabase Admin Queue Test panel.",
    overrideFields: {
      status: "Pending",
      queueStatus: "Pending",
      priority: "Normal",
      reviewReason: "Automated QA admin queue metadata test",
      sourceContext: "qa_panel",
      noDirectMessaging: true,
      source: "supabase-admin-queue-test",
      storageSource: "localStorage",
      queueData: {
        testMetadata: {
          kind: "supabase_admin_queue_backend_test",
          createdAt,
          note: "Temporary QA admin queue metadata record created from the in-app Supabase Admin Queue Test panel.",
        },
      },
      createdAt,
      updatedAt: createdAt,
    },
  });
}

function createMediaMetadataBackendTestState(overrides = {}) {
  return {
    status: "idle",
    label: "Not run yet",
    message:
      "Run the media metadata backend test to verify media_assets save/load through the current signed-in session.",
    savedMediaAssetId: "",
    sourceUsed: "",
    mediaDataExists: null,
    ownerUserIdExists: null,
    foundOnReload: null,
    lastRanAt: "",
    deleteMessage: "",
    ...overrides,
  };
}

function createStorageBackendTestState(overrides = {}) {
  return {
    status: "idle",
    label: "Not run yet",
    message:
      "Run the private storage test to verify owner-only bucket access, media_assets linkage, signed preview creation, and cleanup.",
    savedMediaAssetId: "",
    sourceUsed: "",
    uploadedObjectPath: "",
    signedUrlCreated: null,
    fileUploaded: null,
    deletedCleanly: null,
    uploadErrorMessage: "",
    signedUrlErrorMessage: "",
    deleteErrorMessage: "",
    lastRanAt: "",
    deleteMessage: "",
    ...overrides,
  };
}

function createPrivateVideoStorageTestState(overrides = {}) {
  return {
    status: "idle",
    label: "Not run yet",
    message:
      "Run the private video storage test to verify the private video bucket and media_assets linkage. This QA path does not fake a real video upload.",
    savedHighlightId: "",
    savedMediaAssetId: "",
    sourceUsed: "",
    videoBucketDetected: null,
    metadataSaved: null,
    foundOnReload: null,
    realFileUploaded: false,
    uploadErrorMessage: "",
    deleteMessage: "",
    lastRanAt: "",
    ...overrides,
  };
}

function createFullHighlightThumbnailTestState(overrides = {}) {
  return {
    status: "idle",
    label: "Not run yet",
    message:
      "Run the full Supabase highlight thumbnail test to create or find a Supabase-backed athlete profile, create or find a Supabase-backed highlight, upload a built-in private PNG thumbnail, link media_assets, and load a signed private preview.",
    savedProfileId: "",
    savedHighlightId: "",
    savedMediaAssetId: "",
    sourceUsed: "",
    athleteProfileReady: null,
    athleteProfileAction: "",
    highlightReady: null,
    highlightAction: "",
    thumbnailUploaded: null,
    mediaAssetLinked: null,
    signedPreviewLoaded: null,
    currentPrivateThumbnail: "",
    approvalStatus: "",
    visibilityStatus: "",
    uploadErrorMessage: "",
    signedUrlErrorMessage: "",
    lastRanAt: "",
    ...overrides,
  };
}

async function createBuiltInPrivateVideoTestFile({
  athleteDisplayName = "Athlete profile",
  highlightTitle = "Saved highlight",
} = {}) {
  if (
    typeof document === "undefined" ||
    typeof window === "undefined" ||
    typeof MediaRecorder === "undefined"
  ) {
    return {
      success: false,
      message: "Built-in browser video generation not supported. Use a real MP4/MOV/WEBM file.",
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const context = canvas.getContext("2d");

  if (!context || typeof canvas.captureStream !== "function") {
    return {
      success: false,
      message: "Built-in browser video generation not supported. Use a real MP4/MOV/WEBM file.",
    };
  }

  const supportedMimeType =
    (typeof MediaRecorder.isTypeSupported === "function" &&
      (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "")) ||
    "video/webm";

  let stream = null;
  try {
    stream = canvas.captureStream(8);
  } catch (error) {
    return {
      success: false,
      message:
        error?.message || "Built-in browser video generation not supported. Use a real MP4/MOV/WEBM file.",
    };
  }

  const drawFrame = (frame = 0) => {
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#0b1a15");
    gradient.addColorStop(0.55, "#0f3427");
    gradient.addColorStop(1, "#1c6a45");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "rgba(255, 255, 255, 0.08)";
    context.fillRect(26, 26, canvas.width - 52, canvas.height - 52);

    context.fillStyle = "#d7f6e8";
    context.font = "700 28px Georgia, serif";
    context.fillText("MY SPORTS RESUME", 44, 76);

    context.fillStyle = "#ffffff";
    context.font = "700 32px Georgia, serif";
    context.fillText("Private Video Test", 44, 136);

    context.fillStyle = "#bedfce";
    context.font = "500 18px Arial, sans-serif";
    context.fillText(String(athleteDisplayName || "Athlete profile"), 46, 188);
    context.fillText(String(highlightTitle || "Saved highlight"), 46, 220);
    context.fillText("Owner-only preview · No public URL · Approval-gated", 46, 264);

    const barWidth = canvas.width - 92;
    const progress = ((frame % 8) + 1) / 8;
    context.fillStyle = "rgba(255, 255, 255, 0.14)";
    context.fillRect(46, 300, barWidth, 16);
    context.fillStyle = "#8df0bd";
    context.fillRect(46, 300, Math.max(24, Math.round(barWidth * progress)), 16);
  };

  drawFrame(0);

  return await new Promise((resolve) => {
    const chunks = [];
    let frame = 0;
    let intervalId = 0;

    const cleanup = () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      const tracks = typeof stream?.getTracks === "function" ? stream.getTracks() : [];
      tracks.forEach((track) => {
        try {
          track.stop();
        } catch (_error) {
          // ignore track cleanup issues
        }
      });
    };

    let recorder;
    try {
      recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType, videoBitsPerSecond: 350000 })
        : new MediaRecorder(stream);
    } catch (error) {
      cleanup();
      resolve({
        success: false,
        message:
          error?.message || "Built-in browser video generation not supported. Use a real MP4/MOV/WEBM file.",
      });
      return;
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onerror = () => {
      cleanup();
      resolve({
        success: false,
        message: "Built-in browser video generation not supported. Use a real MP4/MOV/WEBM file.",
      });
    };

    recorder.onstop = () => {
      cleanup();
      const blob = chunks.length
        ? new Blob(chunks, { type: supportedMimeType || "video/webm" })
        : null;

      if (!blob || blob.size === 0) {
        resolve({
          success: false,
          message: "Built-in browser video generation not supported. Use a real MP4/MOV/WEBM file.",
        });
        return;
      }

      resolve({
        success: true,
        file: new File([blob], `msr-test-video-${Date.now()}.webm`, {
          type: blob.type || "video/webm",
        }),
      });
    };

    try {
      recorder.start(250);
    } catch (error) {
      cleanup();
      resolve({
        success: false,
        message:
          error?.message || "Built-in browser video generation not supported. Use a real MP4/MOV/WEBM file.",
      });
      return;
    }

    intervalId = window.setInterval(() => {
      frame += 1;
      drawFrame(frame);
    }, 125);

    window.setTimeout(() => {
      drawFrame(frame + 1);
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    }, 1200);
  });
}

function createMediaApprovalBackendTestState(overrides = {}) {
  return {
    status: "idle",
    label: "Not run yet",
    message:
      "Run the media approval display test to verify approval-state updates, signed-owner preview rules, and the no-public-URL posture through the current signed-in media workflow.",
    savedMediaAssetId: "",
    sourceUsed: "",
    initialApprovalStatus: "",
    approvedStatus: "",
    rejectedStatus: "",
    publicUrlCreated: null,
    signedPreviewAvailable: null,
    publicAccessEnabled: null,
    metadataOnly: null,
    updateErrorMessage: "",
    cleanupMessage: "",
    lastRanAt: "",
    ...overrides,
  };
}

function buildSupabaseMediaMetadataTestRecord(athleteProfileId = "") {
  const createdAt = new Date().toISOString();

  return {
    id: createId("media-asset"),
    athleteProfileId,
    highlightId: "",
    relatedQueueItemId: "",
    mediaType: "Profile Photo",
    mediaTypeRaw: "profile_photo",
    bucketName: "msr-profile-photos",
    storagePath: "qa/not-uploaded-placeholder.png",
    originalFilename: "msr-test-placeholder.png",
    mimeType: "image/png",
    fileSizeBytes: 0,
    publicUrl: "",
    signedUrlExpiresAt: "",
    approvalStatus: "Pending Review",
    approvalStatusRaw: "pending_review",
    visibilityStatus: "Private",
    visibilityStatusRaw: "private",
    parentGuardianRequired: false,
    adminReviewRequired: true,
    isJuniorMedia: false,
    source: "supabase-media-metadata-test",
    storageSource: "localStorage",
    mediaData: {
      testMetadata: {
        kind: "supabase_media_metadata_backend_test",
        createdAt,
        note: "Temporary QA media metadata record created from the in-app Supabase Media Metadata Test panel.",
      },
    },
    createdAt,
    updatedAt: createdAt,
  };
}

function buildSupabaseMediaApprovalTestRecord(athleteProfileId = "") {
  const createdAt = new Date().toISOString();

  return {
    id: createId("media-approval"),
    athleteProfileId,
    highlightId: "",
    relatedQueueItemId: "",
    mediaType: "Profile Photo",
    mediaTypeRaw: "profile_photo",
    bucketName: "msr-profile-photos",
    storagePath: "qa/approval-test-placeholder.png",
    originalFilename: "msr-approval-test-placeholder.png",
    mimeType: "image/png",
    fileSizeBytes: 0,
    publicUrl: "",
    signedUrlExpiresAt: "",
    approvalStatus: "Pending Review",
    approvalStatusRaw: "pending_review",
    visibilityStatus: "Private",
    visibilityStatusRaw: "private",
    parentGuardianRequired: false,
    adminReviewRequired: true,
    isJuniorMedia: false,
    source: "supabase-media-approval-test",
    storageSource: "localStorage",
    mediaData: {
      testMetadata: {
        kind: "supabase_media_approval_test",
        createdAt,
        note: "Temporary QA media approval record created from the in-app Supabase Media Approval Test panel.",
      },
    },
    createdAt,
    updatedAt: createdAt,
  };
}

function createPrivateStorageTestImageFile() {
  if (typeof File === "undefined" || typeof atob === "undefined") {
    return null;
  }

  const base64Png =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Zz7kAAAAASUVORK5CYII=";
  const byteString = atob(base64Png);
  const byteArray = new Uint8Array(byteString.length);

  for (let index = 0; index < byteString.length; index += 1) {
    byteArray[index] = byteString.charCodeAt(index);
  }

  return new File([byteArray], "msr-storage-test.png", { type: "image/png" });
}

function createFullHighlightThumbnailTestImageFile() {
  if (typeof File === "undefined") {
    return null;
  }

  const file = createPrivateStorageTestImageFile();
  if (!file) {
    return null;
  }

  return new File([file], `msr-highlight-thumbnail-test-${Date.now()}.png`, {
    type: "image/png",
  });
}

function getMediaApprovalDisplayLabel(mediaAsset) {
  if (!mediaAsset) {
    return "Pending Review";
  }

  return mediaAsset.approvalStatus || (mediaAsset.isJuniorMedia ? "Pending Parent Approval" : "Pending Review");
}

function getMediaVisibilityDisplayLabel(mediaAsset) {
  return mediaAsset?.visibilityStatus || "Private";
}

function getMediaApprovalBadgeTone(mediaAsset) {
  switch (String(mediaAsset?.approvalStatusRaw || "").trim().toLowerCase()) {
    case "parent_approved":
    case "admin_approved":
      return "approved";
    case "rejected":
    case "archived":
      return "muted";
    case "pending_parent_approval":
    case "pending_review":
    default:
      return "pending";
  }
}

function getMediaVisibilityBadgeTone(mediaAsset) {
  switch (String(mediaAsset?.visibilityStatusRaw || "").trim().toLowerCase()) {
    case "profile_only":
    case "showcase_approved":
    case "public_approved":
      return "approved";
    case "owner_only":
    case "private":
    default:
      return "private";
  }
}

function getMediaOwnerPresentationMessage(
  mediaAsset,
  { previewLoaded = false, emptyMessage = "No private media asset is linked yet." } = {},
) {
  if (!mediaAsset) {
    return emptyMessage;
  }

  switch (String(mediaAsset?.approvalStatusRaw || "").trim().toLowerCase()) {
    case "pending_parent_approval":
      return "Pending parent/guardian approval. This media stays private and hidden in public-safe views until approval is complete.";
    case "pending_review":
      return "Pending review. This media stays private and hidden in public-safe views until approval is complete.";
    case "parent_approved":
      return previewLoaded
        ? "Parent approval is recorded. This signed owner preview stays private while admin review is still in progress."
        : "Parent approval is recorded. Admin review is still required before broader signed-in display is allowed.";
    case "admin_approved":
      return previewLoaded
        ? "Owner preview loaded from a short-lived signed URL. Public and unauthenticated media access stay disabled."
        : "Approved for signed-in owner preview only. If the signed preview has expired, load a fresh private preview from Account or Highlight Manager.";
    case "rejected":
      return "Rejected media stays private and only shows status labels instead of exposing the file.";
    case "archived":
      return "Archived media stays private and only shows status labels instead of exposing the file.";
    default:
      return previewLoaded
        ? "Owner preview loaded from a short-lived signed URL. Public and unauthenticated media access stay disabled."
        : getMediaOwnerApprovalNote(mediaAsset);
  }
}

function getMediaOwnerApprovalNote(mediaAsset) {
  if (!mediaAsset) {
    return "No private media asset is linked yet.";
  }

  if (mediaAsset.approvalStatusRaw === "pending_parent_approval") {
    return "Pending parent/guardian approval";
  }
  if (mediaAsset.approvalStatusRaw === "pending_review") {
    return "Pending admin review";
  }
  if (mediaAsset.approvalStatusRaw === "parent_approved") {
    return "Parent/guardian approved and still waiting on admin review";
  }
  if (mediaAsset.approvalStatusRaw === "admin_approved") {
    return "Approved for private profile-only viewing";
  }
  if (mediaAsset.approvalStatusRaw === "rejected") {
    return "Rejected and kept private";
  }
  if (mediaAsset.approvalStatusRaw === "archived") {
    return "Archived and kept private";
  }

  return mediaAsset.isJuniorMedia ? "Pending parent/guardian approval" : "Pending admin review";
}

function getMediaReviewRouteLabel(mediaAsset) {
  if (!mediaAsset) {
    return "No review route yet";
  }

  return mediaAsset.parentGuardianRequired
    ? "Parent/guardian approval first, then admin review"
    : "Admin review before broader visibility";
}

function MediaStatusBadge({ label, tone = "neutral" }) {
  return <span className={`badge media-status-badge media-status-badge-${tone}`}>{label}</span>;
}

function MediaStatusBadgeRow({
  mediaAsset,
  previewLoaded = false,
  showOwnerPreview = false,
  showPublicDisabled = false,
  showVideoPrivate = false,
  leadingBadges = [],
}) {
  const badgeItems = [
    ...(Array.isArray(leadingBadges) ? leadingBadges : []),
    ...(mediaAsset
      ? [
          {
            label: getMediaApprovalDisplayLabel(mediaAsset),
            tone: getMediaApprovalBadgeTone(mediaAsset),
          },
          {
            label: getMediaVisibilityDisplayLabel(mediaAsset),
            tone: getMediaVisibilityBadgeTone(mediaAsset),
          },
        ]
      : []),
    ...(showOwnerPreview && previewLoaded
      ? [{ label: "Owner Preview", tone: "approved" }]
      : []),
    ...(showPublicDisabled ? [{ label: "Public Disabled", tone: "disabled" }] : []),
    ...(showVideoPrivate ? [{ label: "Video Private", tone: "private" }] : []),
  ].filter((item) => item?.label);

  const dedupedBadgeItems = [];
  const seenLabels = new Set();

  badgeItems.forEach((item) => {
    const labelKey = String(item.label || "").trim().toLowerCase();
    if (!labelKey || seenLabels.has(labelKey)) {
      return;
    }

    seenLabels.add(labelKey);
    dedupedBadgeItems.push(item);
  });

  if (dedupedBadgeItems.length === 0) {
    return null;
  }

  return (
    <div className="badge-row media-status-row">
      {dedupedBadgeItems.map((item) => (
        <MediaStatusBadge key={`${item.label}-${item.tone}`} label={item.label} tone={item.tone} />
      ))}
    </div>
  );
}

function getMediaApprovalWorkflowState(mediaStatus) {
  if (!mediaStatus?.backendEnabled) {
    return { value: "not_enabled", label: "Not enabled" };
  }

  if (mediaStatus.mode === "supabase_active" && mediaStatus.storageMode === "active") {
    return { value: "active", label: "Active" };
  }

  if (mediaStatus.mode === "planning" || mediaStatus.storageMode === "not_enabled") {
    return { value: "not_enabled", label: "Not enabled" };
  }

  return { value: "fallback", label: "Fallback" };
}

function getLatestMediaAsset(mediaAssets, predicate) {
  return (Array.isArray(mediaAssets) ? mediaAssets : [])
    .filter(predicate)
    .sort(
      (left, right) =>
        new Date(right.updatedAt || right.createdAt || 0).getTime() -
        new Date(left.updatedAt || left.createdAt || 0).getTime(),
    )[0] || null;
}

function getLatestProfilePhotoAsset(mediaAssets, athleteProfileId) {
  return getLatestMediaAsset(
    mediaAssets,
    (asset) =>
      asset.mediaTypeRaw === "profile_photo" &&
      asset.athleteProfileId === athleteProfileId &&
      asset.storageSource === "supabase",
  );
}

function getLatestHighlightThumbnailAsset(mediaAssets, highlightId) {
  return getLatestMediaAsset(
    mediaAssets,
    (asset) =>
      asset.mediaTypeRaw === "highlight_thumbnail" &&
      asset.highlightId === highlightId &&
      asset.storageSource === "supabase",
  );
}

function getLatestHighlightVideoAsset(mediaAssets, highlightId) {
  return getLatestMediaAsset(
    mediaAssets,
    (asset) =>
      asset.mediaTypeRaw === "highlight_video" &&
      asset.highlightId === highlightId &&
      asset.storageSource === "supabase",
  );
}

function flattenAdminQueueCollections(queues) {
  return Object.values(queues || {}).flatMap((items) => (Array.isArray(items) ? items : []));
}

function findExistingMediaReviewQueueItem(queues, mediaAsset) {
  const queueItems = flattenAdminQueueCollections(queues);

  return (
    queueItems.find((item) => item.id && item.id === mediaAsset?.relatedQueueItemId) ||
    queueItems.find((item) => {
      if (!item || !mediaAsset) {
        return false;
      }

      if (mediaAsset.mediaTypeRaw === "highlight_thumbnail" || mediaAsset.mediaTypeRaw === "highlight_video") {
        return (
          normalizeText(item.queueTypeRaw || item.queueType) === "highlight review" &&
          String(item.relatedHighlightId || item.highlightId || "").trim() ===
            String(mediaAsset.highlightId || "").trim() &&
          normalizeText(item.sourceContext || "") === "media upload"
        );
      }

      return (
        normalizeText(item.queueTypeRaw || item.queueType) === "profile review" &&
        String(item.relatedAthleteProfileId || item.athleteId || "").trim() ===
          String(mediaAsset.athleteProfileId || "").trim() &&
        normalizeText(item.sourceContext || "") === "media upload"
      );
    }) ||
    null
  );
}

function buildManagedMediaReviewQueueRecord({
  mediaAsset,
  athleteProfile,
  relatedHighlight = null,
  existingItem,
}) {
  const isProfilePhoto = mediaAsset?.mediaTypeRaw === "profile_photo";
  const isHighlightVideo = mediaAsset?.mediaTypeRaw === "highlight_video";
  const queueType = isProfilePhoto ? "profile_review" : "highlight_review";
  const title = isProfilePhoto
    ? `${athleteProfile?.displayName || "Athlete"} profile photo approval`
    : `${athleteProfile?.displayName || "Athlete"} ${
        isHighlightVideo ? "highlight video" : "thumbnail"
      } approval`;
  const detail = [
    mediaAsset?.originalFilename || "Private media asset",
    isProfilePhoto ? "Profile photo" : isHighlightVideo ? "Highlight video" : "Highlight thumbnail",
    athleteProfile?.sport || "Sport not provided",
    athleteProfile?.ageGroup || "Age group not provided",
    getMediaApprovalDisplayLabel(mediaAsset),
    getMediaVisibilityDisplayLabel(mediaAsset),
  ].join(" / ");
  const now = new Date().toISOString();

  return buildManagedAdminQueueRecord({
    queueType,
    title,
    detail,
    existingItem,
    overrideFields: {
      queueType,
      queueTypeRaw: queueType,
      status: existingItem?.status || "Pending",
      queueStatus: existingItem?.queueStatus || "Pending",
      priority:
        mediaAsset?.isJuniorMedia || athleteProfile?.isJunior
          ? "High"
          : existingItem?.priority || "Normal",
      reviewReason: isProfilePhoto
        ? "Profile photo media approval"
        : isHighlightVideo
          ? "Highlight video media approval"
          : "Highlight thumbnail media approval",
      sourceContext: "media_upload",
      noDirectMessaging: true,
      ownerUserId: mediaAsset?.ownerUserId || athleteProfile?.ownerUserId || null,
      relatedAthleteProfileId: isProfilePhoto ? athleteProfile?.id || mediaAsset?.athleteProfileId || "" : "",
      relatedHighlightId:
        !isProfilePhoto ? relatedHighlight?.id || mediaAsset?.highlightId || "" : "",
      queueData: {
        ...(existingItem?.queueData || {}),
        mediaAssetId: mediaAsset?.id || "",
        mediaTypeRaw: mediaAsset?.mediaTypeRaw || "",
        athleteProfileId: athleteProfile?.id || mediaAsset?.athleteProfileId || "",
        highlightId: relatedHighlight?.id || mediaAsset?.highlightId || "",
        approvalStatusRaw: mediaAsset?.approvalStatusRaw || "",
        visibilityStatusRaw: mediaAsset?.visibilityStatusRaw || "",
        parentGuardianRequired: Boolean(mediaAsset?.parentGuardianRequired),
        adminReviewRequired: Boolean(mediaAsset?.adminReviewRequired),
        reviewFlow: "approval_safe_media_workflow_phase_1",
        updatedAt: now,
      },
    },
  });
}

function App() {
  const realAuthEnabled = isRealAuthEnabled();
  const [demoAccount, setDemoAccount] = useState(() => getDemoAccount());
  const [authSession, setAuthSession] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [authenticatedAccount, setAuthenticatedAccount] = useState(null);
  const [ownedProfiles, setOwnedProfiles] = useState([]);
  const [athletes, setAthletes] = useState(() =>
    normalizeProfiles(readLocalData(STORAGE_KEYS.athletes, sampleAthletes)),
  );
  const [highlights, setHighlights] = useState(() =>
    normalizeHighlights(readLocalData(STORAGE_KEYS.highlights, sampleHighlights)),
  );
  const [opportunities, setOpportunities] = useState(() =>
    normalizeOpportunities(readLocalData(STORAGE_KEYS.opportunities, opportunitySeed)),
  );
  const [shortlist, setShortlist] = useState(() =>
    normalizeShortlist(readLocalData(STORAGE_KEYS.shortlist, [])),
  );
  const [contactRequests, setContactRequests] = useState(() =>
    normalizeContactRequests(readLocalData(STORAGE_KEYS.requests, [])),
  );
  const [adminQueues, setAdminQueues] = useState(() =>
    normalizeAdminQueues(readLocalData(STORAGE_KEYS.adminQueues, adminSeed)),
  );
  const [selectedRole, setSelectedRole] = useState(() => getCurrentRole());
  const [message, setMessage] = useState("");
  const [profileBackendStatus, setProfileBackendStatus] = useState({
    mode: "local",
    modeLabel: "Local Demo",
    source: "localStorage",
    sourceLabel: "localStorage",
    tableDetected: null,
    tableDetectedLabel: "unknown",
    backendEnabled: false,
    message: "Athlete profiles are saved on this device only.",
    sportsDataMigrationStatus: "Profiles only",
    profileCount: 0,
    localProfileCount: 0,
    supabaseProfileCount: 0,
  });
  const [profileBackendTestState, setProfileBackendTestState] = useState(() =>
    createProfileBackendTestState(),
  );
  const [highlightBackendStatus, setHighlightBackendStatus] = useState({
    mode: "local",
    modeLabel: "Local Demo",
    source: "localStorage",
    sourceLabel: "localStorage",
    tableDetected: null,
    tableDetectedLabel: "unknown",
    backendEnabled: false,
    message: "Highlight metadata is saved on this device only.",
    sportsDataMigrationStatus: "Profiles + Highlights metadata only",
    highlightCount: 0,
    localHighlightCount: 0,
    supabaseHighlightCount: 0,
  });
  const [highlightBackendTestState, setHighlightBackendTestState] = useState(() =>
    createHighlightBackendTestState(),
  );
  const [opportunityBackendStatus, setOpportunityBackendStatus] = useState({
    mode: "local",
    modeLabel: "Local Demo",
    source: "localStorage",
    sourceLabel: "localStorage",
    tableDetected: null,
    tableDetectedLabel: "unknown",
    backendEnabled: false,
    message: "Opportunities are saved on this device only.",
    sportsDataMigrationStatus: "Profiles + Highlights metadata + Opportunities metadata only",
    opportunityCount: 0,
    localOpportunityCount: 0,
    supabaseOpportunityCount: 0,
  });
  const [opportunityBackendTestState, setOpportunityBackendTestState] = useState(() =>
    createOpportunityBackendTestState(),
  );
  const [shortlistBackendStatus, setShortlistBackendStatus] = useState({
    mode: "local",
    modeLabel: "Local Demo",
    source: "localStorage",
    sourceLabel: "localStorage",
    tableDetected: null,
    tableDetectedLabel: "unknown",
    backendEnabled: false,
    message: "Shortlist records are saved on this device only.",
    sportsDataMigrationStatus:
      "Profiles + Highlights metadata + Opportunities metadata + Contact request metadata + Shortlists metadata only",
    shortlistCount: 0,
    localShortlistCount: 0,
    supabaseShortlistCount: 0,
  });
  const [shortlistBackendTestState, setShortlistBackendTestState] = useState(() =>
    createShortlistBackendTestState(),
  );
  const [contactRequestBackendStatus, setContactRequestBackendStatus] = useState({
    mode: "local",
    modeLabel: "Local Demo",
    source: "localStorage",
    sourceLabel: "localStorage",
    tableDetected: null,
    tableDetectedLabel: "unknown",
    backendEnabled: false,
    message: "Contact requests are saved on this device only.",
    sportsDataMigrationStatus:
      "Profiles + Highlights metadata + Opportunities metadata + Contact request metadata only",
    requestCount: 0,
    localRequestCount: 0,
    supabaseRequestCount: 0,
  });
  const [contactRequestBackendTestState, setContactRequestBackendTestState] = useState(() =>
    createContactRequestBackendTestState(),
  );
  const [adminQueueBackendStatus, setAdminQueueBackendStatus] = useState({
    mode: "local",
    modeLabel: "Local Demo",
    source: "localStorage",
    sourceLabel: "localStorage",
    tableDetected: null,
    tableDetectedLabel: "unknown",
    backendEnabled: false,
    message: "Admin queue records are saved on this device only.",
    sportsDataMigrationStatus:
      "Profiles + Highlights metadata + Opportunities metadata + Contact request metadata + Shortlists metadata + Admin queue metadata only",
    adminQueueCount: 0,
    localAdminQueueCount: 0,
    supabaseAdminQueueCount: 0,
  });
  const [adminQueueBackendTestState, setAdminQueueBackendTestState] = useState(() =>
    createAdminQueueBackendTestState(),
  );
  const [mediaAssets, setMediaAssets] = useState([]);
  const [mediaBackendStatus, setMediaBackendStatus] = useState({
    mode: "planning",
    modeLabel: "Planning",
    source: "localStorage",
    sourceLabel: "localStorage",
    tableDetected: null,
    tableDetectedLabel: "unknown",
    backendEnabled: false,
    storageMode: "not_enabled",
    storageModeLabel: "Not Enabled",
    videoStorageMode: "not_enabled",
    videoStorageModeLabel: "Not enabled",
    profilePhotoBucketDetected: null,
    profilePhotoBucketDetectedLabel: "unknown",
    highlightThumbnailBucketDetected: null,
    highlightThumbnailBucketDetectedLabel: "unknown",
    highlightVideoBucketDetected: null,
    highlightVideoBucketDetectedLabel: "unknown",
    bucketStatus: "not enabled yet",
    uploadsEnabled: false,
    publicMediaAccess: false,
    videoUploadsEnabled: false,
    videoUploadsLabel: "Disabled",
    message: "Media metadata and private storage are staged safely. Approval-gated private image uploads activate when the current signed-in account, tables, and buckets are ready.",
    storageMessage: "Private Supabase Storage is not enabled yet.",
    sportsDataMigrationStatus:
      "Profiles + Highlights metadata + Opportunities metadata + Contact request metadata + Shortlists metadata + Admin queue metadata + Media metadata + Private storage phase 1 + Approval-safe media workflow phase 1 + Private highlight video upload phase 1",
    assetCount: 0,
    localAssetCount: 0,
    supabaseAssetCount: 0,
  });
  const [mediaBackendTestState, setMediaBackendTestState] = useState(() =>
    createMediaMetadataBackendTestState(),
  );
  const [storageBackendTestState, setStorageBackendTestState] = useState(() =>
    createStorageBackendTestState(),
  );
  const [privateVideoStorageTestState, setPrivateVideoStorageTestState] = useState(() =>
    createPrivateVideoStorageTestState(),
  );
  const [fullHighlightThumbnailTestState, setFullHighlightThumbnailTestState] = useState(() =>
    createFullHighlightThumbnailTestState(),
  );
  const [mediaApprovalTestState, setMediaApprovalTestState] = useState(() =>
    createMediaApprovalBackendTestState(),
  );
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState({});

  function applyManagedProfileResult(result) {
    const nextProfiles = normalizeProfiles(result?.profiles || []);

    setOwnedProfiles(nextProfiles);
    setProfileBackendStatus({
      mode: result?.mode || "local",
      modeLabel: result?.modeLabel || "Local Demo",
      source: result?.source || "localStorage",
      sourceLabel: result?.sourceLabel || "localStorage",
      tableDetected: result?.tableDetected ?? null,
      tableDetectedLabel: result?.tableDetectedLabel || "unknown",
      backendEnabled: Boolean(result?.backendEnabled),
      message: result?.message || "Athlete profiles are saved on this device only.",
      sportsDataMigrationStatus: result?.sportsDataMigrationStatus || "Profiles only",
      profileCount: Number(result?.profileCount || nextProfiles.length || 0),
      localProfileCount: Number(result?.localProfileCount || 0),
      supabaseProfileCount: Number(result?.supabaseProfileCount || 0),
    });

    return nextProfiles;
  }

  function applyManagedHighlightResult(result) {
    const nextHighlights = normalizeHighlights(result?.highlights || []);

    setHighlights(nextHighlights);
    setHighlightBackendStatus({
      mode: result?.mode || "local",
      modeLabel: result?.modeLabel || "Local Demo",
      source: result?.source || "localStorage",
      sourceLabel: result?.sourceLabel || "localStorage",
      tableDetected: result?.tableDetected ?? null,
      tableDetectedLabel: result?.tableDetectedLabel || "unknown",
      backendEnabled: Boolean(result?.backendEnabled),
      message: result?.message || "Highlight metadata is saved on this device only.",
      sportsDataMigrationStatus:
        result?.sportsDataMigrationStatus || "Profiles + Highlights metadata only",
      highlightCount: Number(result?.highlightCount || nextHighlights.length || 0),
      localHighlightCount: Number(result?.localHighlightCount || 0),
      supabaseHighlightCount: Number(result?.supabaseHighlightCount || 0),
    });

    return nextHighlights;
  }

  function applyManagedOpportunityResult(result) {
    const nextOpportunities = normalizeOpportunities(result?.opportunities || []);

    setOpportunities(nextOpportunities);
    setOpportunityBackendStatus({
      mode: result?.mode || "local",
      modeLabel: result?.modeLabel || "Local Demo",
      source: result?.source || "localStorage",
      sourceLabel: result?.sourceLabel || "localStorage",
      tableDetected: result?.tableDetected ?? null,
      tableDetectedLabel: result?.tableDetectedLabel || "unknown",
      backendEnabled: Boolean(result?.backendEnabled),
      message: result?.message || "Opportunities are saved on this device only.",
      sportsDataMigrationStatus:
        result?.sportsDataMigrationStatus ||
        "Profiles + Highlights metadata + Opportunities metadata only",
      opportunityCount: Number(result?.opportunityCount || nextOpportunities.length || 0),
      localOpportunityCount: Number(result?.localOpportunityCount || 0),
      supabaseOpportunityCount: Number(result?.supabaseOpportunityCount || 0),
    });

    return nextOpportunities;
  }

  function applyManagedShortlistResult(result) {
    const nextShortlist = normalizeShortlist(result?.shortlist || []);

    setShortlist(nextShortlist);
    setShortlistBackendStatus({
      mode: result?.mode || "local",
      modeLabel: result?.modeLabel || "Local Demo",
      source: result?.source || "localStorage",
      sourceLabel: result?.sourceLabel || "localStorage",
      tableDetected: result?.tableDetected ?? null,
      tableDetectedLabel: result?.tableDetectedLabel || "unknown",
      backendEnabled: Boolean(result?.backendEnabled),
      message: result?.message || "Shortlist records are saved on this device only.",
      sportsDataMigrationStatus:
        result?.sportsDataMigrationStatus ||
        "Profiles + Highlights metadata + Opportunities metadata + Contact request metadata + Shortlists metadata only",
      shortlistCount: Number(result?.shortlistCount || nextShortlist.length || 0),
      localShortlistCount: Number(result?.localShortlistCount || 0),
      supabaseShortlistCount: Number(result?.supabaseShortlistCount || 0),
    });

    return nextShortlist;
  }

  function applyManagedContactRequestResult(result) {
    const nextRequests = normalizeContactRequests(result?.contactRequests || []);

    setContactRequests(nextRequests);
    setContactRequestBackendStatus({
      mode: result?.mode || "local",
      modeLabel: result?.modeLabel || "Local Demo",
      source: result?.source || "localStorage",
      sourceLabel: result?.sourceLabel || "localStorage",
      tableDetected: result?.tableDetected ?? null,
      tableDetectedLabel: result?.tableDetectedLabel || "unknown",
      backendEnabled: Boolean(result?.backendEnabled),
      message: result?.message || "Contact requests are saved on this device only.",
      sportsDataMigrationStatus:
        result?.sportsDataMigrationStatus ||
        "Profiles + Highlights metadata + Opportunities metadata + Contact request metadata only",
      requestCount: Number(result?.requestCount || nextRequests.length || 0),
      localRequestCount: Number(result?.localRequestCount || 0),
      supabaseRequestCount: Number(result?.supabaseRequestCount || 0),
    });

    return nextRequests;
  }

  function applyManagedAdminQueueResult(result) {
    const nextQueues = normalizeAdminQueues(result?.queues || {});

    setAdminQueues(nextQueues);
    setAdminQueueBackendStatus({
      mode: result?.mode || "local",
      modeLabel: result?.modeLabel || "Local Demo",
      source: result?.source || "localStorage",
      sourceLabel: result?.sourceLabel || "localStorage",
      tableDetected: result?.tableDetected ?? null,
      tableDetectedLabel: result?.tableDetectedLabel || "unknown",
      backendEnabled: Boolean(result?.backendEnabled),
      message: result?.message || "Admin queue records are saved on this device only.",
      sportsDataMigrationStatus:
        result?.sportsDataMigrationStatus ||
        "Profiles + Highlights metadata + Opportunities metadata + Contact request metadata + Shortlists metadata + Admin queue metadata only",
      adminQueueCount: Number(result?.adminQueueCount || 0),
      localAdminQueueCount: Number(result?.localAdminQueueCount || 0),
      supabaseAdminQueueCount: Number(result?.supabaseAdminQueueCount || 0),
    });

    return nextQueues;
  }

  function applyManagedMediaResult(result) {
    setMediaAssets(Array.isArray(result?.mediaAssets) ? result.mediaAssets : []);
    setMediaBackendStatus({
      mode: result?.mode || "planning",
      modeLabel: result?.modeLabel || "Planning",
      source: result?.source || "localStorage",
      sourceLabel: result?.sourceLabel || "localStorage",
      tableDetected: result?.tableDetected ?? null,
      tableDetectedLabel: result?.tableDetectedLabel || "unknown",
      backendEnabled: Boolean(result?.backendEnabled),
      storageMode: result?.storageMode || "not_enabled",
      storageModeLabel: result?.storageModeLabel || "Not Enabled",
      videoStorageMode: result?.videoStorageMode || "not_enabled",
      videoStorageModeLabel: result?.videoStorageModeLabel || "Not enabled",
      profilePhotoBucketDetected: result?.profilePhotoBucketDetected ?? null,
      profilePhotoBucketDetectedLabel: result?.profilePhotoBucketDetectedLabel || "unknown",
      highlightThumbnailBucketDetected: result?.highlightThumbnailBucketDetected ?? null,
      highlightThumbnailBucketDetectedLabel:
        result?.highlightThumbnailBucketDetectedLabel || "unknown",
      highlightVideoBucketDetected: result?.highlightVideoBucketDetected ?? null,
      highlightVideoBucketDetectedLabel: result?.highlightVideoBucketDetectedLabel || "unknown",
      bucketStatus: result?.bucketStatus || "not enabled yet",
      uploadsEnabled: Boolean(result?.uploadsEnabled),
      publicMediaAccess: Boolean(result?.publicMediaAccess),
      videoUploadsEnabled: Boolean(result?.videoUploadsEnabled),
      videoUploadsLabel: result?.videoUploadsLabel || "Disabled",
      message:
        result?.message ||
        "Media metadata and private storage are staged safely. Approval-gated private image uploads activate when the current signed-in account, tables, and buckets are ready.",
      storageMessage: result?.storageMessage || "Private Supabase Storage is not enabled yet.",
      sportsDataMigrationStatus:
        result?.sportsDataMigrationStatus ||
        "Profiles + Highlights metadata + Opportunities metadata + Contact request metadata + Shortlists metadata + Admin queue metadata + Media metadata + Private storage phase 1 + Approval-safe media workflow phase 1 + Private highlight video upload phase 1",
      assetCount: Number(result?.assetCount || 0),
      localAssetCount: Number(result?.localAssetCount || 0),
      supabaseAssetCount: Number(result?.supabaseAssetCount || 0),
    });
  }

  async function refreshManagedProfiles() {
    const result = await getManagedProfiles();
    applyManagedProfileResult(result);
    return result;
  }

  async function refreshManagedHighlights() {
    const result = await getManagedHighlights();
    applyManagedHighlightResult(result);
    return result;
  }

  async function refreshManagedOpportunities() {
    const result = await getManagedOpportunities();
    applyManagedOpportunityResult(result);
    return result;
  }

  async function refreshManagedShortlist() {
    const result = await getManagedShortlist();
    applyManagedShortlistResult(result);
    return result;
  }

  async function refreshManagedContactRequests() {
    const result = await getManagedContactRequests();
    applyManagedContactRequestResult(result);
    return result;
  }

  async function refreshManagedAdminQueues() {
    const result = await getManagedAdminQueueItems();
    applyManagedAdminQueueResult(result);
    return result;
  }

  async function refreshManagedMediaAssets() {
    const result = await getManagedMediaAssets();
    applyManagedMediaResult(result);
    return result;
  }

  function cacheMediaPreviewUrl(mediaAssetId, signedUrl) {
    if (!mediaAssetId || !signedUrl) {
      return;
    }

    setMediaPreviewUrls((current) =>
      current[mediaAssetId] === signedUrl ? current : { ...current, [mediaAssetId]: signedUrl },
    );
  }

  useEffect(() => {
    if (!authUser?.id) {
      return;
    }

    const ownerPreviewAssets = (Array.isArray(mediaAssets) ? mediaAssets : [])
      .filter(
        (asset) =>
          !mediaPreviewUrls[asset.id] &&
          canManagedOwnerViewMedia(asset, authUser.id),
      )
      .sort(
        (left, right) =>
          new Date(right.updatedAt || right.createdAt || 0).getTime() -
          new Date(left.updatedAt || left.createdAt || 0).getTime(),
      );

    if (ownerPreviewAssets.length === 0) {
      return;
    }

    let isCancelled = false;

    async function loadOwnerPreviewUrls() {
      for (const asset of ownerPreviewAssets) {
        const result = await getManagedSignedMediaPreview(asset.id);

        if (isCancelled) {
          return;
        }

        if (result?.success && result?.signedUrl) {
          cacheMediaPreviewUrl(asset.id, result.signedUrl);
        }
      }
    }

    loadOwnerPreviewUrls();

    return () => {
      isCancelled = true;
    };
  }, [authUser?.id, mediaAssets, mediaPreviewUrls, ownedProfiles]);

  async function runSupabaseProfileTest() {
    if (profileBackendTestState.status === "running") {
      return;
    }

    setProfileBackendTestState(
      createProfileBackendTestState({
        status: "running",
        label: "Running...",
        message: "Creating a temporary athlete profile through the live profile backend path.",
      }),
    );

    try {
      const testProfile = buildSupabaseProfileBackendTestRecord();
      const saveResult = await saveManagedProfile(testProfile);
      const reloadResult = await refreshManagedProfiles();
      const savedProfileId = saveResult?.profile?.id || testProfile.id;
      const loadedProfile =
        reloadResult?.profiles?.find((item) => item.id === savedProfileId) || null;
      const sourceUsed =
        saveResult?.source === "supabase" && saveResult?.fallback !== true
          ? "Supabase"
          : "localStorage";
      const ownerUserIdExists = Boolean(
        loadedProfile?.ownerUserId || saveResult?.ownerUserIdExists,
      );
      const profileDataExists =
        saveResult?.profileDataExists === true ||
        (loadedProfile ? Object.keys(loadedProfile).length > 0 : false);

      if (saveResult?.source === "supabase" && saveResult?.fallback !== true && loadedProfile) {
        setProfileBackendTestState(
          createProfileBackendTestState({
            status: "pass",
            label: "PASS — Supabase profile save/load works",
            message:
              "Supabase profile save/load passed. A test profile was created and loaded from athlete_profiles.",
            savedProfileId,
            sourceUsed,
            profileDataExists,
            ownerUserIdExists,
            foundOnReload: true,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      if (loadedProfile) {
        setProfileBackendTestState(
          createProfileBackendTestState({
            status: "fallback",
            label: "FALLBACK — saved locally only",
            message:
              saveResult?.message ||
              "Profile test used localStorage fallback. Supabase profile backend did not win.",
            savedProfileId,
            sourceUsed,
            profileDataExists,
            ownerUserIdExists,
            foundOnReload: true,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      setProfileBackendTestState(
        createProfileBackendTestState({
          status: "fail",
          label: "FAIL — Supabase profile backend error",
          message:
            saveResult?.message ||
            "The profile test could not confirm the saved athlete profile on reload.",
          savedProfileId,
          sourceUsed,
          profileDataExists,
          ownerUserIdExists,
          foundOnReload: false,
          lastRanAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      setProfileBackendTestState(
        createProfileBackendTestState({
          status: "fail",
          label: "FAIL — Supabase profile backend error",
          message: String(error?.message || "Unknown error."),
          lastRanAt: new Date().toISOString(),
        }),
      );
    }
  }

  async function deleteSupabaseProfileTest() {
    if (!profileBackendTestState.savedProfileId) {
      setProfileBackendTestState((current) => ({
        ...current,
        deleteMessage: "No generated test profile is currently selected for cleanup.",
      }));
      return;
    }

    setProfileBackendTestState((current) => ({
      ...current,
      deleteMessage: "Deleting the generated test profile...",
    }));

    const result = await deleteManagedProfile(profileBackendTestState.savedProfileId);
    await refreshManagedProfiles();

    if (!result?.success) {
      setProfileBackendTestState((current) => ({
        ...current,
        status: "fail",
        label: "FAIL — Supabase profile backend error",
        message: result?.message || "Test profile cleanup could not be completed.",
        deleteMessage: result?.message || "Test profile cleanup could not be completed.",
      }));
      return;
    }

    setProfileBackendTestState((current) =>
      createProfileBackendTestState({
        ...current,
        status: current.status === "pass" ? "pass" : "idle",
        label:
          current.status === "pass"
            ? "PASS — Supabase profile save/load works"
            : "Not run yet",
        message:
          current.status === "pass"
            ? current.message
            : "Run the profile backend test to verify athlete_profiles save/load through the current signed-in session.",
        savedProfileId: "",
        sourceUsed: "",
        profileDataExists: null,
        ownerUserIdExists: null,
        foundOnReload: null,
        deleteMessage: "Generated test profile deleted.",
        lastRanAt: current.lastRanAt,
      }),
    );
  }

  async function runSupabaseHighlightTest() {
    if (highlightBackendTestState.status === "running") {
      return;
    }

    const ownedAthlete =
      ownedProfiles.find((item) => Boolean(item?.ownerUserId) && !item.isJunior) ||
      ownedProfiles.find((item) => Boolean(item?.ownerUserId)) ||
      null;

    if (!ownedAthlete) {
      setHighlightBackendTestState(
        createHighlightBackendTestState({
          status: "fail",
          label: "FAIL - Supabase highlight backend error",
          message: "Create a Supabase-backed athlete profile first.",
        }),
      );
      return;
    }

    setHighlightBackendTestState(
      createHighlightBackendTestState({
        status: "running",
        label: "Running...",
        message: "Creating a temporary highlight through the live highlight backend path.",
      }),
    );

    try {
      const testHighlight = buildSupabaseHighlightBackendTestRecord(ownedAthlete);
      const saveResult = await saveManagedHighlight(testHighlight);
      const reloadResult = await refreshManagedHighlights();
      const savedHighlightId = saveResult?.highlight?.id || testHighlight.id;
      const loadedHighlight =
        reloadResult?.highlights?.find((item) => item.id === savedHighlightId) || null;
      const sourceUsed =
        saveResult?.source === "supabase" && saveResult?.fallback !== true
          ? "Supabase"
          : "localStorage";
      const ownerUserIdExists = Boolean(
        loadedHighlight?.ownerUserId || saveResult?.ownerUserIdExists,
      );
      const athleteProfileIdExists = Boolean(
        loadedHighlight?.athleteId || saveResult?.athleteProfileIdExists,
      );
      const highlightDataExists =
        saveResult?.highlightDataExists === true ||
        (loadedHighlight ? Object.keys(loadedHighlight).length > 0 : false);

      if (
        saveResult?.source === "supabase" &&
        saveResult?.fallback !== true &&
        loadedHighlight
      ) {
        setHighlightBackendTestState(
          createHighlightBackendTestState({
            status: "pass",
            label: "PASS - Supabase highlight save/load works",
            message:
              "Supabase highlight save/load passed. A test highlight was created and loaded from highlights.",
            savedHighlightId,
            sourceUsed,
            highlightDataExists,
            ownerUserIdExists,
            athleteProfileIdExists,
            foundOnReload: true,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      if (loadedHighlight) {
        setHighlightBackendTestState(
          createHighlightBackendTestState({
            status: "fallback",
            label: "FALLBACK - saved locally only",
            message:
              saveResult?.message ||
              "Highlight test used localStorage fallback. Supabase highlight backend did not win.",
            savedHighlightId,
            sourceUsed,
            highlightDataExists,
            ownerUserIdExists,
            athleteProfileIdExists,
            foundOnReload: true,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      setHighlightBackendTestState(
        createHighlightBackendTestState({
          status: "fail",
          label: "FAIL - Supabase highlight backend error",
          message:
            saveResult?.message ||
            "The highlight test could not confirm the saved highlight on reload.",
          savedHighlightId,
          sourceUsed,
          highlightDataExists,
          ownerUserIdExists,
          athleteProfileIdExists,
          foundOnReload: false,
          lastRanAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      setHighlightBackendTestState(
        createHighlightBackendTestState({
          status: "fail",
          label: "FAIL - Supabase highlight backend error",
          message: String(error?.message || "Unknown error."),
          lastRanAt: new Date().toISOString(),
        }),
      );
    }
  }

  async function deleteSupabaseHighlightTest() {
    if (!highlightBackendTestState.savedHighlightId) {
      setHighlightBackendTestState((current) => ({
        ...current,
        deleteMessage: "No generated test highlight is currently selected for cleanup.",
      }));
      return;
    }

    setHighlightBackendTestState((current) => ({
      ...current,
      deleteMessage: "Deleting the generated test highlight...",
    }));

    const result = await deleteManagedHighlight(highlightBackendTestState.savedHighlightId);
    await refreshManagedHighlights();

    if (!result?.success) {
      setHighlightBackendTestState((current) => ({
        ...current,
        status: "fail",
        label: "FAIL - Supabase highlight backend error",
        message: result?.message || "Test highlight cleanup could not be completed.",
        deleteMessage: result?.message || "Test highlight cleanup could not be completed.",
      }));
      return;
    }

    setHighlightBackendTestState((current) =>
      createHighlightBackendTestState({
        ...current,
        status: current.status === "pass" ? "pass" : "idle",
        label:
          current.status === "pass"
            ? "PASS - Supabase highlight save/load works"
            : "Not run yet",
        message:
          current.status === "pass"
            ? current.message
            : "Run the highlight backend test to verify highlights save/load through the current signed-in session.",
        savedHighlightId: "",
        sourceUsed: "",
        highlightDataExists: null,
        ownerUserIdExists: null,
        athleteProfileIdExists: null,
        foundOnReload: null,
        deleteMessage: "Generated test highlight deleted.",
        lastRanAt: current.lastRanAt,
      }),
    );
  }

  async function runSupabaseOpportunityTest() {
    if (opportunityBackendTestState.status === "running") {
      return;
    }

    setOpportunityBackendTestState(
      createOpportunityBackendTestState({
        status: "running",
        label: "Running...",
        message: "Creating a temporary opportunity through the live opportunity backend path.",
      }),
    );

    try {
      const testOpportunity = buildSupabaseOpportunityBackendTestRecord();
      const saveResult = await saveManagedOpportunity(testOpportunity);
      const reloadResult = await refreshManagedOpportunities();
      const savedOpportunityId = saveResult?.opportunity?.id || testOpportunity.id;
      const loadedOpportunity =
        reloadResult?.opportunities?.find((item) => item.id === savedOpportunityId) || null;
      const sourceUsed =
        saveResult?.source === "supabase" && saveResult?.fallback !== true
          ? "Supabase"
          : "localStorage";
      const ownerUserIdExists = Boolean(
        loadedOpportunity?.ownerUserId || saveResult?.ownerUserIdExists,
      );
      const opportunityDataExists =
        saveResult?.opportunityDataExists === true ||
        (loadedOpportunity?.opportunityData
          ? Object.keys(loadedOpportunity.opportunityData).length > 0
          : false);

      if (
        saveResult?.source === "supabase" &&
        saveResult?.fallback !== true &&
        loadedOpportunity
      ) {
        setOpportunityBackendTestState(
          createOpportunityBackendTestState({
            status: "pass",
            label: "PASS - Supabase opportunity save/load works",
            message:
              "Supabase opportunity save/load passed. A test opportunity was created and loaded from opportunities.",
            savedOpportunityId,
            sourceUsed,
            opportunityDataExists,
            ownerUserIdExists,
            foundOnReload: true,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      if (loadedOpportunity) {
        setOpportunityBackendTestState(
          createOpportunityBackendTestState({
            status: "fallback",
            label: "FALLBACK - saved locally only",
            message:
              saveResult?.message ||
              "Opportunity test used localStorage fallback. Supabase opportunity backend did not win.",
            savedOpportunityId,
            sourceUsed,
            opportunityDataExists,
            ownerUserIdExists,
            foundOnReload: true,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      setOpportunityBackendTestState(
        createOpportunityBackendTestState({
          status: "fail",
          label: "FAIL - Supabase opportunity backend error",
          message:
            saveResult?.message ||
            "The opportunity test could not confirm the saved opportunity on reload.",
          savedOpportunityId,
          sourceUsed,
          opportunityDataExists,
          ownerUserIdExists,
          foundOnReload: false,
          lastRanAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      setOpportunityBackendTestState(
        createOpportunityBackendTestState({
          status: "fail",
          label: "FAIL - Supabase opportunity backend error",
          message: String(error?.message || "Unknown error."),
          lastRanAt: new Date().toISOString(),
        }),
      );
    }
  }

  async function deleteSupabaseOpportunityTest() {
    if (!opportunityBackendTestState.savedOpportunityId) {
      setOpportunityBackendTestState((current) => ({
        ...current,
        deleteMessage: "No generated test opportunity is currently selected for cleanup.",
      }));
      return;
    }

    setOpportunityBackendTestState((current) => ({
      ...current,
      deleteMessage: "Deleting the generated test opportunity...",
    }));

    const result = await deleteManagedOpportunity(opportunityBackendTestState.savedOpportunityId);
    await refreshManagedOpportunities();

    if (!result?.success) {
      setOpportunityBackendTestState((current) => ({
        ...current,
        status: "fail",
        label: "FAIL - Supabase opportunity backend error",
        message: result?.message || "Test opportunity cleanup could not be completed.",
        deleteMessage: result?.message || "Test opportunity cleanup could not be completed.",
      }));
      return;
    }

    setOpportunityBackendTestState((current) =>
      createOpportunityBackendTestState({
        ...current,
        status: current.status === "pass" ? "pass" : "idle",
        label:
          current.status === "pass"
            ? "PASS - Supabase opportunity save/load works"
            : "Not run yet",
        message:
          current.status === "pass"
            ? current.message
            : "Run the opportunity backend test to verify opportunities save/load through the current signed-in session.",
        savedOpportunityId: "",
        sourceUsed: "",
        opportunityDataExists: null,
        ownerUserIdExists: null,
        foundOnReload: null,
        deleteMessage: "Generated test opportunity deleted.",
        lastRanAt: current.lastRanAt,
      }),
    );
  }

  async function runSupabaseShortlistTest() {
    if (shortlistBackendTestState.status === "running") {
      return;
    }

    const ownedAthlete =
      ownedProfiles.find((item) => Boolean(item?.ownerUserId) && !item.isJunior) ||
      ownedProfiles.find((item) => Boolean(item?.ownerUserId)) ||
      null;

    if (!ownedAthlete) {
      setShortlistBackendTestState(
        createShortlistBackendTestState({
          status: "fail",
          label: "FAIL - Supabase shortlist backend error",
          message: "Create a Supabase-backed athlete profile first.",
        }),
      );
      return;
    }

    setShortlistBackendTestState(
      createShortlistBackendTestState({
        status: "running",
        label: "Running...",
        message: "Creating a temporary shortlist record through the live shortlist backend path.",
      }),
    );

    try {
      const testShortlist = buildSupabaseShortlistBackendTestRecord(ownedAthlete);
      const saveResult = await saveManagedShortlistRecord(testShortlist);
      const reloadResult = await refreshManagedShortlist();
      const savedShortlistId = saveResult?.shortlistRecord?.id || testShortlist.id;
      const loadedShortlist =
        reloadResult?.shortlist?.find((item) => item.id === savedShortlistId) || null;
      const sourceUsed =
        saveResult?.source === "supabase" && saveResult?.fallback !== true
          ? "Supabase"
          : "localStorage";
      const ownerUserIdExists = Boolean(
        loadedShortlist?.ownerUserId || saveResult?.ownerUserIdExists,
      );
      const athleteProfileIdExists = Boolean(
        loadedShortlist?.athleteProfileId || saveResult?.athleteProfileIdExists,
      );
      const shortlistDataExists =
        saveResult?.shortlistDataExists === true ||
        (loadedShortlist?.shortlistData
          ? Object.keys(loadedShortlist.shortlistData).length > 0
          : false);

      if (
        saveResult?.source === "supabase" &&
        saveResult?.fallback !== true &&
        loadedShortlist
      ) {
        setShortlistBackendTestState(
          createShortlistBackendTestState({
            status: "pass",
            label: "PASS - Supabase shortlist save/load works",
            message:
              "Supabase shortlist save/load passed. A test shortlist record was created and loaded from shortlists.",
            savedShortlistId,
            sourceUsed,
            shortlistDataExists,
            ownerUserIdExists,
            athleteProfileIdExists,
            foundOnReload: true,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      if (loadedShortlist) {
        setShortlistBackendTestState(
          createShortlistBackendTestState({
            status: "fallback",
            label: "FALLBACK - saved locally only",
            message:
              saveResult?.message ||
              "Shortlist test used localStorage fallback. Supabase shortlist backend did not win.",
            savedShortlistId,
            sourceUsed,
            shortlistDataExists,
            ownerUserIdExists,
            athleteProfileIdExists,
            foundOnReload: true,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      setShortlistBackendTestState(
        createShortlistBackendTestState({
          status: "fail",
          label: "FAIL - Supabase shortlist backend error",
          message:
            saveResult?.message ||
            "The shortlist test could not confirm the saved shortlist record on reload.",
          savedShortlistId,
          sourceUsed,
          shortlistDataExists,
          ownerUserIdExists,
          athleteProfileIdExists,
          foundOnReload: false,
          lastRanAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      setShortlistBackendTestState(
        createShortlistBackendTestState({
          status: "fail",
          label: "FAIL - Supabase shortlist backend error",
          message: String(error?.message || "Unknown error."),
          lastRanAt: new Date().toISOString(),
        }),
      );
    }
  }

  async function deleteSupabaseShortlistTest() {
    if (!shortlistBackendTestState.savedShortlistId) {
      setShortlistBackendTestState((current) => ({
        ...current,
        deleteMessage: "No generated test shortlist is currently selected for cleanup.",
      }));
      return;
    }

    setShortlistBackendTestState((current) => ({
      ...current,
      deleteMessage: "Deleting the generated test shortlist...",
    }));

    const result = await deleteManagedShortlistRecord(shortlistBackendTestState.savedShortlistId);
    await refreshManagedShortlist();

    if (!result?.success) {
      setShortlistBackendTestState((current) => ({
        ...current,
        status: "fail",
        label: "FAIL - Supabase shortlist backend error",
        message: result?.message || "Test shortlist cleanup could not be completed.",
        deleteMessage: result?.message || "Test shortlist cleanup could not be completed.",
      }));
      return;
    }

    setShortlistBackendTestState((current) =>
      createShortlistBackendTestState({
        ...current,
        status: current.status === "pass" ? "pass" : "idle",
        label:
          current.status === "pass"
            ? "PASS - Supabase shortlist save/load works"
            : "Not run yet",
        message:
          current.status === "pass"
            ? current.message
            : "Run the shortlist backend test to verify shortlists save/load through the current signed-in session.",
        savedShortlistId: "",
        sourceUsed: "",
        shortlistDataExists: null,
        ownerUserIdExists: null,
        athleteProfileIdExists: null,
        foundOnReload: null,
        deleteMessage: "Generated test shortlist deleted.",
        lastRanAt: current.lastRanAt,
      }),
    );
  }

  async function runSupabaseContactRequestTest() {
    if (contactRequestBackendTestState.status === "running") {
      return;
    }

    const ownedAthlete =
      ownedProfiles.find((item) => Boolean(item?.ownerUserId) && !item.isJunior) ||
      ownedProfiles.find((item) => Boolean(item?.ownerUserId)) ||
      null;

    if (!ownedAthlete) {
      setContactRequestBackendTestState(
        createContactRequestBackendTestState({
          status: "fail",
          label: "FAIL - Supabase contact request backend error",
          message: "Create a Supabase-backed athlete profile first.",
        }),
      );
      return;
    }

    setContactRequestBackendTestState(
      createContactRequestBackendTestState({
        status: "running",
        label: "Running...",
        message:
          "Creating a temporary contact request through the live contact request backend path.",
      }),
    );

    try {
      const testRequest = buildSupabaseContactRequestBackendTestRecord(ownedAthlete);
      const saveResult = await saveManagedContactRequest(testRequest);
      const reloadResult = await refreshManagedContactRequests();
      const savedContactRequestId = saveResult?.contactRequest?.id || testRequest.id;
      const loadedRequest =
        reloadResult?.contactRequests?.find((item) => item.id === savedContactRequestId) || null;
      const sourceUsed =
        saveResult?.source === "supabase" && saveResult?.fallback !== true
          ? "Supabase"
          : "localStorage";
      const requesterUserIdExists = Boolean(
        loadedRequest?.requesterUserId || saveResult?.requesterUserIdExists,
      );
      const athleteOwnerUserIdExists = Boolean(
        loadedRequest?.athleteOwnerUserId || saveResult?.athleteOwnerUserIdExists,
      );
      const requestContextExists =
        saveResult?.requestContextExists === true ||
        (loadedRequest?.requestContext
          ? Object.keys(loadedRequest.requestContext).length > 0
          : false);

      if (
        saveResult?.source === "supabase" &&
        saveResult?.fallback !== true &&
        loadedRequest
      ) {
        setContactRequestBackendTestState(
          createContactRequestBackendTestState({
            status: "pass",
            label: "PASS - Supabase contact request save/load works",
            message:
              "Supabase contact request save/load passed. A test request was created and loaded from contact_requests.",
            savedContactRequestId,
            sourceUsed,
            requestContextExists,
            requesterUserIdExists,
            athleteOwnerUserIdExists,
            foundOnReload: true,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      if (loadedRequest) {
        setContactRequestBackendTestState(
          createContactRequestBackendTestState({
            status: "fallback",
            label: "FALLBACK - saved locally only",
            message:
              saveResult?.message ||
              "Contact request test used localStorage fallback. Supabase contact request backend did not win.",
            savedContactRequestId,
            sourceUsed,
            requestContextExists,
            requesterUserIdExists,
            athleteOwnerUserIdExists,
            foundOnReload: true,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      setContactRequestBackendTestState(
        createContactRequestBackendTestState({
          status: "fail",
          label: "FAIL - Supabase contact request backend error",
          message:
            saveResult?.message ||
            "The contact request test could not confirm the saved record on reload.",
          savedContactRequestId,
          sourceUsed,
          requestContextExists,
          requesterUserIdExists,
          athleteOwnerUserIdExists,
          foundOnReload: false,
          lastRanAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      setContactRequestBackendTestState(
        createContactRequestBackendTestState({
          status: "fail",
          label: "FAIL - Supabase contact request backend error",
          message: String(error?.message || "Unknown error."),
          lastRanAt: new Date().toISOString(),
        }),
      );
    }
  }

  async function deleteSupabaseContactRequestTest() {
    if (!contactRequestBackendTestState.savedContactRequestId) {
      setContactRequestBackendTestState((current) => ({
        ...current,
        deleteMessage: "No generated test contact request is currently selected for cleanup.",
      }));
      return;
    }

    setContactRequestBackendTestState((current) => ({
      ...current,
      deleteMessage: "Deleting the generated test contact request...",
    }));

    const result = await deleteManagedContactRequest(
      contactRequestBackendTestState.savedContactRequestId,
    );
    await refreshManagedContactRequests();

    if (!result?.success) {
      setContactRequestBackendTestState((current) => ({
        ...current,
        status: "fail",
        label: "FAIL - Supabase contact request backend error",
        message: result?.message || "Test contact request cleanup could not be completed.",
        deleteMessage:
          result?.message || "Test contact request cleanup could not be completed.",
      }));
      return;
    }

    setContactRequestBackendTestState((current) =>
      createContactRequestBackendTestState({
        ...current,
        status: current.status === "pass" ? "pass" : "idle",
        label:
          current.status === "pass"
            ? "PASS - Supabase contact request save/load works"
            : "Not run yet",
        message:
          current.status === "pass"
            ? current.message
            : "Run the contact request backend test to verify contact_requests save/load through the current signed-in session.",
        savedContactRequestId: "",
        sourceUsed: "",
        requestContextExists: null,
        requesterUserIdExists: null,
        athleteOwnerUserIdExists: null,
        foundOnReload: null,
        deleteMessage: "Generated test contact request deleted.",
        lastRanAt: current.lastRanAt,
      }),
    );
  }

  async function runSupabaseAdminQueueTest() {
    if (adminQueueBackendTestState.status === "running") {
      return;
    }

    setAdminQueueBackendTestState(
      createAdminQueueBackendTestState({
        status: "running",
        label: "Running...",
        message:
          "Creating a temporary admin queue record through the live admin queue backend path.",
      }),
    );

    try {
      const testQueueItem = buildSupabaseAdminQueueBackendTestRecord();
      const saveResult = await saveManagedAdminQueueItem(testQueueItem);
      let reloadResult = null;
      let reloadErrorMessage = "";

      try {
        reloadResult = await refreshManagedAdminQueues();
        reloadErrorMessage = reloadResult?.readErrorMessage || "";
      } catch (reloadError) {
        reloadErrorMessage = String(
          reloadError?.message || "Admin queue reload failed after the save attempt.",
        );
      }

      const savedAdminQueueItemId = saveResult?.queueItem?.id || testQueueItem.id;
      const loadedQueueItem =
        reloadResult?.queueItems?.find((item) => item.id === savedAdminQueueItemId) || null;
      const sourceUsed =
        saveResult?.source === "supabase" && saveResult?.fallback !== true
          ? "Supabase"
          : "localStorage";
      const insertErrorMessage = saveResult?.insertErrorMessage || "";
      const diagnosticLabel =
        getAdminQueueDiagnosticLabel(saveResult?.insertErrorCategory) ||
        getAdminQueueDiagnosticLabel(reloadResult?.readErrorCategory) ||
        (reloadErrorMessage ? "Reload error" : "");
      const ownerUserIdExists = Boolean(
        loadedQueueItem?.ownerUserId || saveResult?.ownerUserIdExists,
      );
      const queueDataExists =
        saveResult?.queueDataExists === true ||
        (loadedQueueItem?.queueData
          ? Object.keys(loadedQueueItem.queueData).length > 0
          : false);

      if (saveResult?.source === "supabase" && saveResult?.fallback !== true && loadedQueueItem) {
        setAdminQueueBackendTestState(
          createAdminQueueBackendTestState({
            status: "pass",
            label: "PASS - Supabase admin queue save/load works",
            message:
              "Supabase admin queue save/load passed. A test admin queue record was created and loaded from admin_queue_items.",
            savedAdminQueueItemId,
            sourceUsed,
            queueDataExists,
            ownerUserIdExists,
            foundOnReload: true,
            insertErrorMessage,
            reloadErrorMessage,
            diagnosticLabel,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      if (loadedQueueItem) {
        setAdminQueueBackendTestState(
          createAdminQueueBackendTestState({
            status: "fallback",
            label: "FALLBACK - saved locally only",
            message:
              saveResult?.message ||
              "Admin queue test used localStorage fallback. Supabase admin queue backend did not win.",
            savedAdminQueueItemId,
            sourceUsed,
            queueDataExists,
            ownerUserIdExists,
            foundOnReload: true,
            insertErrorMessage,
            reloadErrorMessage,
            diagnosticLabel,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      setAdminQueueBackendTestState(
        createAdminQueueBackendTestState({
          status: "fail",
          label: "FAIL - Supabase admin queue backend error",
          message:
            reloadErrorMessage ||
            saveResult?.message ||
            "The admin queue test could not confirm the saved queue record on reload.",
          savedAdminQueueItemId,
          sourceUsed,
          queueDataExists,
          ownerUserIdExists,
          foundOnReload: false,
          insertErrorMessage,
          reloadErrorMessage,
          diagnosticLabel,
          lastRanAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      setAdminQueueBackendTestState(
        createAdminQueueBackendTestState({
          status: "fail",
          label: "FAIL - Supabase admin queue backend error",
          message: String(error?.message || "Unknown error."),
          insertErrorMessage: String(error?.message || "Unknown error."),
          diagnosticLabel: "Unknown backend error",
          lastRanAt: new Date().toISOString(),
        }),
      );
    }
  }

  async function deleteSupabaseAdminQueueTest() {
    if (!adminQueueBackendTestState.savedAdminQueueItemId) {
      setAdminQueueBackendTestState((current) => ({
        ...current,
        deleteMessage: "No generated test admin queue item is currently selected for cleanup.",
      }));
      return;
    }

    setAdminQueueBackendTestState((current) => ({
      ...current,
      deleteMessage: "Deleting the generated test admin queue item...",
    }));

    const result = await deleteManagedAdminQueueItem(adminQueueBackendTestState.savedAdminQueueItemId);
    await refreshManagedAdminQueues();

    if (!result?.success) {
      setAdminQueueBackendTestState((current) => ({
        ...current,
        status: "fail",
        label: "FAIL - Supabase admin queue backend error",
        message: result?.message || "Test admin queue cleanup could not be completed.",
        deleteMessage: result?.message || "Test admin queue cleanup could not be completed.",
      }));
      return;
    }

    setAdminQueueBackendTestState((current) =>
      createAdminQueueBackendTestState({
        ...current,
        status: current.status === "pass" ? "pass" : "idle",
        label:
          current.status === "pass"
            ? "PASS - Supabase admin queue save/load works"
            : "Not run yet",
        message:
          current.status === "pass"
            ? current.message
            : "Run the admin queue backend test to verify admin queue records save/load through the current signed-in session.",
        savedAdminQueueItemId: "",
        sourceUsed: "",
        queueDataExists: null,
        ownerUserIdExists: null,
        foundOnReload: null,
        insertErrorMessage: "",
        reloadErrorMessage: "",
        diagnosticLabel: "",
        deleteMessage: "Generated test admin queue item deleted.",
        lastRanAt: current.lastRanAt,
      }),
    );
  }

  async function runSupabaseMediaMetadataTest() {
    if (mediaBackendTestState.status === "running") {
      return;
    }

    if (!authUser?.id) {
      setMediaBackendTestState(
        createMediaMetadataBackendTestState({
          status: "fail",
          label: "FAIL - Supabase media metadata backend error",
          message: "Sign in with a Supabase account first. Uploads are still disabled in this phase.",
          lastRanAt: new Date().toISOString(),
        }),
      );
      return;
    }

    setMediaBackendTestState(
      createMediaMetadataBackendTestState({
        status: "running",
        label: "Running...",
        message:
          "Creating a temporary media metadata record through the live media metadata backend path.",
      }),
    );

    try {
      const ownedAthleteProfileId = ownedProfiles[0]?.id || "";
      const testMediaAsset = buildSupabaseMediaMetadataTestRecord(ownedAthleteProfileId);
      const saveResult = await saveManagedMediaAsset(testMediaAsset);
      const reloadResult = await refreshManagedMediaAssets();
      const savedMediaAssetId = saveResult?.mediaAsset?.id || testMediaAsset.id;
      const loadedMediaAsset =
        reloadResult?.mediaAssets?.find((item) => item.id === savedMediaAssetId) || null;
      const sourceUsed =
        saveResult?.source === "supabase" && saveResult?.fallback !== true
          ? "Supabase"
          : "localStorage";
      const ownerUserIdExists = Boolean(
        loadedMediaAsset?.ownerUserId || saveResult?.ownerUserIdExists,
      );
      const mediaDataExists =
        saveResult?.mediaDataExists === true ||
        (loadedMediaAsset?.mediaData
          ? Object.keys(loadedMediaAsset.mediaData).length > 0
          : false);

      if (saveResult?.source === "supabase" && saveResult?.fallback !== true && loadedMediaAsset) {
        setMediaBackendTestState(
          createMediaMetadataBackendTestState({
            status: "pass",
            label: "PASS - Supabase media metadata save/load works",
            message:
              "Supabase media metadata save/load passed. A test media_assets record was created and loaded with no real file upload.",
            savedMediaAssetId,
            sourceUsed,
            mediaDataExists,
            ownerUserIdExists,
            foundOnReload: true,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      if (loadedMediaAsset) {
        setMediaBackendTestState(
          createMediaMetadataBackendTestState({
            status: "fallback",
            label: "FALLBACK - saved locally only",
            message:
              saveResult?.message ||
              "Media metadata test used localStorage fallback. Supabase media metadata backend did not win.",
            savedMediaAssetId,
            sourceUsed,
            mediaDataExists,
            ownerUserIdExists,
            foundOnReload: true,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      setMediaBackendTestState(
        createMediaMetadataBackendTestState({
          status: "fail",
          label: "FAIL - Supabase media metadata backend error",
          message:
            saveResult?.message ||
            "The media metadata test could not confirm the saved record on reload.",
          savedMediaAssetId,
          sourceUsed,
          mediaDataExists,
          ownerUserIdExists,
          foundOnReload: false,
          lastRanAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      setMediaBackendTestState(
        createMediaMetadataBackendTestState({
          status: "fail",
          label: "FAIL - Supabase media metadata backend error",
          message: String(error?.message || "Unknown error."),
          lastRanAt: new Date().toISOString(),
        }),
      );
    }
  }

  async function deleteSupabaseMediaMetadataTest() {
    if (!mediaBackendTestState.savedMediaAssetId) {
      setMediaBackendTestState((current) => ({
        ...current,
        deleteMessage: "No generated test media metadata record is currently selected for cleanup.",
      }));
      return;
    }

    setMediaBackendTestState((current) => ({
      ...current,
      deleteMessage: "Deleting the generated test media metadata record...",
    }));

    const result = await deleteManagedMediaAsset(mediaBackendTestState.savedMediaAssetId);
    await refreshManagedMediaAssets();

    if (!result?.success) {
      setMediaBackendTestState((current) => ({
        ...current,
        status: "fail",
        label: "FAIL - Supabase media metadata backend error",
        message: result?.message || "Test media metadata cleanup could not be completed.",
        deleteMessage: result?.message || "Test media metadata cleanup could not be completed.",
      }));
      return;
    }

    setMediaBackendTestState((current) =>
      createMediaMetadataBackendTestState({
        ...current,
        status: current.status === "pass" ? "pass" : "idle",
        label:
          current.status === "pass"
            ? "PASS - Supabase media metadata save/load works"
            : "Not run yet",
        message:
          current.status === "pass"
            ? current.message
            : "Run the media metadata backend test to verify media_assets save/load through the current signed-in session.",
        savedMediaAssetId: "",
        sourceUsed: "",
        mediaDataExists: null,
        ownerUserIdExists: null,
        foundOnReload: null,
        deleteMessage: "Generated test media metadata record deleted.",
        lastRanAt: current.lastRanAt,
      }),
    );
  }

  async function syncMediaReviewQueueForAsset(mediaAsset) {
    if (!mediaAsset?.id || mediaAsset.storageSource !== "supabase") {
      return {
        success: false,
        skipped: true,
        message: "Media review queue sync was skipped.",
      };
    }

    const athleteProfile =
      ownedProfiles.find((item) => item.id === mediaAsset.athleteProfileId) ||
      visibleAthletes.find((item) => item.id === mediaAsset.athleteProfileId) ||
      null;
    const relatedHighlight =
      visibleHighlights.find((item) => item.id === mediaAsset.highlightId) || null;
    const existingQueueItem = findExistingMediaReviewQueueItem(adminQueues, mediaAsset);
    const queueRecord = buildManagedMediaReviewQueueRecord({
      mediaAsset,
      athleteProfile,
      relatedHighlight,
      existingItem: existingQueueItem,
    });
    const queueResult =
      existingQueueItem && existingQueueItem.storageSource === "supabase"
        ? await updateManagedAdminQueueItem(existingQueueItem.id, queueRecord)
        : await saveManagedAdminQueueItem(queueRecord);

    if (queueResult?.queues) {
      applyManagedAdminQueueResult(queueResult);
    }

    if (
      queueResult?.success &&
      queueResult?.queueItem?.id &&
      queueResult.queueItem.id !== mediaAsset.relatedQueueItemId
    ) {
      const mediaUpdateResult = await updateManagedMediaAsset(mediaAsset.id, {
        relatedQueueItemId: queueResult.queueItem.id,
        mediaData: {
          ...(mediaAsset.mediaData || {}),
          reviewQueueLinked: true,
          reviewQueueItemId: queueResult.queueItem.id,
          reviewQueueType: queueRecord.queueTypeRaw,
        },
      });

      if (Array.isArray(mediaUpdateResult?.mediaAssets)) {
        applyManagedMediaResult(mediaUpdateResult);
      } else {
        await refreshManagedMediaAssets();
      }

      return {
        ...queueResult,
        mediaAsset:
          mediaUpdateResult?.mediaAsset || queueResult?.mediaAsset || mediaAsset,
      };
    }

    return queueResult;
  }

  async function reviewMediaAssetByAdmin(mediaAssetId, action) {
    const currentAsset = mediaAssets.find((item) => item.id === mediaAssetId) || null;

    if (!currentAsset) {
      return {
        success: false,
        message: "Media asset not found.",
      };
    }

    if (
      (action === "approve" || action === "keep_private") &&
      currentAsset.isJuniorMedia &&
      currentAsset.approvalStatusRaw === "pending_parent_approval"
    ) {
      return {
        success: false,
        message:
          "Junior media still needs parent/guardian approval before admin approval can move it forward.",
      };
    }

    const reviewTimestamp = new Date().toISOString();
    const withReviewMetadata = (result) =>
      result?.success
        ? updateManagedMediaAsset(mediaAssetId, {
            mediaData: {
              ...(currentAsset.mediaData || {}),
              lastAdminReviewAction: action,
              lastAdminReviewAt: reviewTimestamp,
            },
          })
        : result;
    const mediaReviewNote =
      action === "approve"
        ? "Media approved in the owner-scoped review flow."
        : action === "keep_private"
          ? "Media approved but kept private in the owner-scoped review flow."
          : action === "reject"
            ? "Media rejected in the owner-scoped review flow."
            : "Media archived in the owner-scoped review flow.";
    const baseUpdateResult =
      action === "approve"
        ? await markManagedMediaProfileOnly(mediaAssetId)
        : action === "keep_private"
          ? await approveManagedMediaAsset(mediaAssetId, { visibilityStatusRaw: "private" })
          : action === "reject"
            ? await rejectManagedMediaAsset(mediaAssetId)
            : await archiveManagedMediaAsset(mediaAssetId);
    const updateResult = await withReviewMetadata(baseUpdateResult);

    if (Array.isArray(updateResult?.mediaAssets)) {
      applyManagedMediaResult(updateResult);
    } else {
      await refreshManagedMediaAssets();
    }

    if (!updateResult?.success) {
      return {
        success: false,
        message: updateResult?.message || "Media approval update could not be completed.",
      };
    }

    const queueItem = findExistingMediaReviewQueueItem(adminQueues, currentAsset);
    let queueUpdateMessage = "";

    if (queueItem?.id) {
      const queueStatus =
        action === "approve" || action === "keep_private"
          ? "Approved"
          : action === "reject"
            ? "Rejected"
            : "Archived";
      const queueUpdateResult = await updateManagedAdminQueueItem(
        queueItem.id,
        buildManagedAdminQueueRecord({
          queueType: queueItem.queueTypeRaw || queueItem.queueType,
          title: queueItem.title,
          detail: queueItem.detail,
          existingItem: queueItem,
          overrideFields: {
            status: queueStatus,
            queueStatus,
            adminDecision: queueStatus,
            adminDecisionBy: authUser?.id || queueItem.adminDecisionBy || null,
            adminDecisionAt: new Date().toISOString(),
            reviewNotes: mediaReviewNote,
            sourceContext: queueItem.sourceContext || "media_upload",
          },
        }),
      );

      if (queueUpdateResult?.queues) {
        applyManagedAdminQueueResult(queueUpdateResult);
      }

      if (!queueUpdateResult?.success) {
        queueUpdateMessage = queueUpdateResult?.message || "";
      }
    }

    return {
      success: true,
      message: queueUpdateMessage
        ? `${mediaReviewNote} ${queueUpdateMessage}`
        : mediaReviewNote,
    };
  }

  async function approveMediaAssetByParent(mediaAssetId) {
    const currentAsset = mediaAssets.find((item) => item.id === mediaAssetId) || null;

    if (!currentAsset) {
      return {
        success: false,
        message: "Media asset not found.",
      };
    }

    const updateResult = await updateManagedMediaAsset(mediaAssetId, {
      approvalStatusRaw: "parent_approved",
      parentGuardianRequired: false,
      adminReviewRequired: true,
      visibilityStatusRaw:
        currentAsset.visibilityStatusRaw === "profile_only" ? "profile_only" : "private",
      mediaData: {
        ...(currentAsset.mediaData || {}),
        lastParentApprovalAction: "approve",
        lastParentApprovalAt: new Date().toISOString(),
      },
    });

    if (Array.isArray(updateResult?.mediaAssets)) {
      applyManagedMediaResult(updateResult);
    } else {
      await refreshManagedMediaAssets();
    }

    if (!updateResult?.success) {
      return {
        success: false,
        message:
          updateResult?.message ||
          "Parent/guardian approval could not be recorded for this private media asset.",
      };
    }

    return {
      success: true,
      message:
        "Parent/guardian approval recorded. The private media asset now stays private while admin review continues.",
    };
  }

  async function runSupabaseMediaApprovalTest() {
    if (mediaApprovalTestState.status === "running") {
      return;
    }

    if (!authUser?.id) {
      setMediaApprovalTestState(
        createMediaApprovalBackendTestState({
          status: "fail",
      label: "FAIL - media approval display error",
          message: "Sign in with a Supabase account first.",
          lastRanAt: new Date().toISOString(),
        }),
      );
      return;
    }

    setMediaApprovalTestState(
      createMediaApprovalBackendTestState({
        status: "running",
        label: "Running...",
        message:
          "Creating a temporary media_assets record, moving it through pending, approved, and rejected display states, and confirming no public URL or public-access path is introduced.",
      }),
    );

    try {
      const ownedAthleteProfileId = ownedProfiles[0]?.id || "";
      const testMediaAsset = buildSupabaseMediaApprovalTestRecord(ownedAthleteProfileId);
      const saveResult = await saveManagedMediaAsset(testMediaAsset);

      if (!saveResult?.success) {
        setMediaApprovalTestState(
          createMediaApprovalBackendTestState({
            status: "fail",
            label: "FAIL - media approval display error",
            message: saveResult?.message || "The temporary media approval record could not be saved.",
            sourceUsed: saveResult?.source || "localStorage",
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      const savedMediaAssetId = saveResult?.mediaAsset?.id || testMediaAsset.id;
      const sourceUsed =
        saveResult?.source === "supabase" && saveResult?.fallback !== true
          ? "Supabase"
          : "localStorage";

      if (sourceUsed !== "Supabase") {
        setMediaApprovalTestState(
          createMediaApprovalBackendTestState({
            status: "fallback",
            label: "FALLBACK - saved locally only",
            message:
              saveResult?.message ||
              "Media approval display test used fallback, so approval-state updates did not run through Supabase.",
            savedMediaAssetId,
            sourceUsed,
            initialApprovalStatus: saveResult?.mediaAsset?.approvalStatus || "",
            publicUrlCreated: false,
            signedPreviewAvailable: false,
            publicAccessEnabled: false,
            metadataOnly: true,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      const initialApprovalStatus = getMediaApprovalDisplayLabel(saveResult?.mediaAsset);
      const approvedResult = await markManagedMediaProfileOnly(savedMediaAssetId);
      const approvedWithTestMetadata = approvedResult?.success
        ? await updateManagedMediaAsset(savedMediaAssetId, {
            mediaData: {
              ...(approvedResult?.mediaAsset?.mediaData ||
                saveResult?.mediaAsset?.mediaData ||
                {}),
              approvalTestStage: "approved",
            },
          })
        : approvedResult;

      if (Array.isArray(approvedWithTestMetadata?.mediaAssets)) {
        applyManagedMediaResult(approvedWithTestMetadata);
      } else {
        await refreshManagedMediaAssets();
      }

      if (!approvedWithTestMetadata?.success || approvedWithTestMetadata?.fallback === true) {
        setMediaApprovalTestState(
          createMediaApprovalBackendTestState({
            status: "fail",
            label: "FAIL - media approval display error",
            message:
              approvedWithTestMetadata?.message ||
              "The approval-state update to admin_approved/profile_only did not complete.",
            savedMediaAssetId,
            sourceUsed,
            initialApprovalStatus,
            approvedStatus: getMediaApprovalDisplayLabel(approvedWithTestMetadata?.mediaAsset),
            publicUrlCreated: false,
            signedPreviewAvailable: false,
            publicAccessEnabled: false,
            metadataOnly: true,
            updateErrorMessage:
              approvedWithTestMetadata?.message ||
              "The approval-state update to admin_approved/profile_only did not complete.",
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      const approvedStatus = getMediaApprovalDisplayLabel(
        approvedWithTestMetadata?.mediaAsset || saveResult?.mediaAsset,
      );
      const rejectedResult = await rejectManagedMediaAsset(savedMediaAssetId);
      const rejectedWithTestMetadata = rejectedResult?.success
        ? await updateManagedMediaAsset(savedMediaAssetId, {
            mediaData: {
              ...(rejectedResult?.mediaAsset ||
              approvedWithTestMetadata?.mediaAsset ||
              saveResult?.mediaAsset
                ? (
                    rejectedResult?.mediaAsset?.mediaData ||
                    approvedWithTestMetadata?.mediaAsset?.mediaData ||
                    saveResult?.mediaAsset?.mediaData ||
                    {}
                  )
                : {}),
              approvalTestStage: "rejected",
            },
          })
        : rejectedResult;

      if (Array.isArray(rejectedWithTestMetadata?.mediaAssets)) {
        applyManagedMediaResult(rejectedWithTestMetadata);
      } else {
        await refreshManagedMediaAssets();
      }

      if (!rejectedWithTestMetadata?.success || rejectedWithTestMetadata?.fallback === true) {
        setMediaApprovalTestState(
          createMediaApprovalBackendTestState({
            status: "fail",
            label: "FAIL - media approval display error",
            message:
              rejectedWithTestMetadata?.message ||
              "The approval-state update to rejected/private did not complete.",
            savedMediaAssetId,
            sourceUsed,
            initialApprovalStatus,
            approvedStatus,
            rejectedStatus: getMediaApprovalDisplayLabel(rejectedWithTestMetadata?.mediaAsset),
            publicUrlCreated: false,
            signedPreviewAvailable: false,
            publicAccessEnabled: false,
            metadataOnly: true,
            updateErrorMessage:
              rejectedWithTestMetadata?.message ||
              "The approval-state update to rejected/private did not complete.",
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      const cleanupResult = await deleteManagedMediaAsset(savedMediaAssetId);
      await refreshManagedMediaAssets();

      if (!cleanupResult?.success) {
        setMediaApprovalTestState(
          createMediaApprovalBackendTestState({
            status: "fail",
            label: "FAIL - media approval display error",
            message:
              cleanupResult?.message ||
              "The media approval display test could not clean up the temporary record.",
            savedMediaAssetId,
            sourceUsed,
            initialApprovalStatus,
            approvedStatus,
            rejectedStatus: getMediaApprovalDisplayLabel(
              rejectedWithTestMetadata?.mediaAsset || approvedWithTestMetadata?.mediaAsset,
            ),
            publicUrlCreated: false,
            signedPreviewAvailable: false,
            publicAccessEnabled: false,
            metadataOnly: true,
            cleanupMessage:
              cleanupResult?.message ||
              "The media approval display test could not clean up the temporary record.",
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      setMediaApprovalTestState(
        createMediaApprovalBackendTestState({
          status: "pass",
          label: "PASS - media approval display rules work",
          message:
            "Media approval display test passed. A temporary media_assets record moved from pending review/private to admin approved/profile only, then to rejected/private. No public URL was created, public unauthenticated access stayed disabled, and cleanup completed.",
          savedMediaAssetId,
          sourceUsed,
          initialApprovalStatus,
          approvedStatus,
          rejectedStatus: getMediaApprovalDisplayLabel(
            rejectedWithTestMetadata?.mediaAsset || approvedWithTestMetadata?.mediaAsset,
          ),
          publicUrlCreated: false,
          signedPreviewAvailable: false,
          publicAccessEnabled: false,
          metadataOnly: true,
          cleanupMessage: "Generated media approval display test record deleted.",
          lastRanAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      setMediaApprovalTestState(
        createMediaApprovalBackendTestState({
          status: "fail",
          label: "FAIL - media approval display error",
          message: String(error?.message || "Unknown error."),
          updateErrorMessage: String(error?.message || "Unknown error."),
          lastRanAt: new Date().toISOString(),
        }),
      );
    }
  }

  async function deleteSupabaseMediaApprovalTest() {
    if (!mediaApprovalTestState.savedMediaAssetId) {
      setMediaApprovalTestState((current) => ({
        ...current,
        cleanupMessage: "No generated media approval display test record is currently selected for cleanup.",
      }));
      return;
    }

    setMediaApprovalTestState((current) => ({
      ...current,
      cleanupMessage: "Deleting the generated media approval display test record...",
    }));

    const result = await deleteManagedMediaAsset(mediaApprovalTestState.savedMediaAssetId);
    await refreshManagedMediaAssets();

    if (!result?.success) {
      setMediaApprovalTestState((current) => ({
        ...current,
        status: "fail",
        label: "FAIL - media approval display error",
        message: result?.message || "Media approval display test cleanup could not be completed.",
        cleanupMessage:
          result?.message || "Media approval display test cleanup could not be completed.",
      }));
      return;
    }

    setMediaApprovalTestState((current) =>
      createMediaApprovalBackendTestState({
        ...current,
        status: current.status === "pass" ? "pass" : "idle",
        label:
          current.status === "pass"
            ? "PASS - media approval display rules work"
            : "Not run yet",
        message:
          current.status === "pass"
            ? current.message
            : "Run the media approval display test to verify approval-state updates through the current signed-in media workflow.",
        savedMediaAssetId: "",
        sourceUsed: "",
        initialApprovalStatus: "",
        approvedStatus: "",
        rejectedStatus: "",
        publicUrlCreated: null,
        signedPreviewAvailable: null,
        publicAccessEnabled: null,
        metadataOnly: null,
        updateErrorMessage: "",
        cleanupMessage: "Generated media approval display test record deleted.",
        lastRanAt: current.lastRanAt,
      }),
    );
  }

  async function uploadPrivateProfilePhoto(file, athleteProfileId) {
    const result = await uploadManagedProfilePhoto({ file, athleteProfileId });

    if (Array.isArray(result?.mediaAssets)) {
      applyManagedMediaResult(result);
    } else {
      await refreshManagedMediaAssets();
    }

    if (result?.success && result?.source === "supabase" && result?.fallback !== true && result?.mediaAsset) {
      cacheMediaPreviewUrl(result.mediaAsset.id, result.signedUrl || "");
      const queueResult = await syncMediaReviewQueueForAsset(result.mediaAsset);

      if (queueResult?.success === false && !queueResult?.skipped) {
        return {
          ...result,
          message: `${result.message} Review queue note: ${
            queueResult?.message || "The admin review record could not be linked yet."
          }`,
        };
      }

      return {
        ...result,
        message: `${result.message} ${getMediaOwnerApprovalNote(result.mediaAsset)}.`,
      };
    }

    return result;
  }

  async function uploadPrivateHighlightThumbnail(file, highlightId) {
    const result = await uploadManagedHighlightThumbnail({ file, highlightId });

    if (Array.isArray(result?.mediaAssets)) {
      applyManagedMediaResult(result);
    } else {
      await refreshManagedMediaAssets();
    }

    if (result?.success && result?.source === "supabase" && result?.fallback !== true && result?.mediaAsset) {
      cacheMediaPreviewUrl(result.mediaAsset.id, result.signedUrl || "");
      const queueResult = await syncMediaReviewQueueForAsset(result.mediaAsset);

      if (queueResult?.success === false && !queueResult?.skipped) {
        return {
          ...result,
          message: `${result.message} Review queue note: ${
            queueResult?.message || "The admin review record could not be linked yet."
          }`,
        };
      }

      return {
        ...result,
        message: `${result.message} ${getMediaOwnerApprovalNote(result.mediaAsset)}.`,
      };
    }

    return result;
  }

  async function uploadPrivateHighlightVideo(file, highlightId) {
    const result = await uploadManagedHighlightVideo({ file, highlightId });

    if (Array.isArray(result?.mediaAssets)) {
      applyManagedMediaResult(result);
    } else {
      await refreshManagedMediaAssets();
    }

    if (result?.success && result?.source === "supabase" && result?.fallback !== true && result?.mediaAsset) {
      cacheMediaPreviewUrl(result.mediaAsset.id, result.signedUrl || "");
      if (result?.replacedMediaAssetId) {
        setMediaPreviewUrls((current) => {
          if (!current[result.replacedMediaAssetId]) {
            return current;
          }

          const next = { ...current };
          delete next[result.replacedMediaAssetId];
          return next;
        });
      }
      const queueResult = await syncMediaReviewQueueForAsset(result.mediaAsset);

      if (queueResult?.success === false && !queueResult?.skipped) {
        return {
          ...result,
          message: `${result.message} Review queue note: ${
            queueResult?.message || "The admin review record could not be linked yet."
          }`,
        };
      }

      return {
        ...result,
        message: `${result.message} ${getMediaOwnerApprovalNote(result.mediaAsset)}.`,
      };
    }

    return result;
  }

  async function deleteStoredMediaAssetRecord(mediaAssetId) {
    const result = await deleteManagedStoredMediaAsset(mediaAssetId);
    setMediaPreviewUrls((current) => {
      if (!current[mediaAssetId]) {
        return current;
      }

      const next = { ...current };
      delete next[mediaAssetId];
      return next;
    });
    await refreshManagedMediaAssets();
    return result;
  }

  async function deleteStoredHighlightVideoRecord(mediaAssetId) {
    const result = await deleteManagedStoredHighlightVideo(mediaAssetId);
    setMediaPreviewUrls((current) => {
      if (!current[mediaAssetId]) {
        return current;
      }

      const next = { ...current };
      delete next[mediaAssetId];
      return next;
    });
    await refreshManagedMediaAssets();
    return result;
  }

  async function loadPrivateSignedMediaUrl(mediaAssetId) {
    const result = await createManagedSignedMediaUrl(mediaAssetId);

    if (result?.success) {
      cacheMediaPreviewUrl(mediaAssetId, result.signedUrl || "");
      await refreshManagedMediaAssets();
    }

    return result;
  }

  async function loadPrivateSignedVideoUrl(mediaAssetId) {
    const result = await createManagedSignedVideoUrl(mediaAssetId);

    if (result?.success) {
      cacheMediaPreviewUrl(mediaAssetId, result.signedUrl || "");
      await refreshManagedMediaAssets();
    }

    return result;
  }

  async function runSupabaseStorageTest() {
    if (storageBackendTestState.status === "running") {
      return;
    }

    if (!authUser?.id) {
      setStorageBackendTestState(
        createStorageBackendTestState({
          status: "fail",
          label: "FAIL - Supabase private storage error",
          message: "Sign in with a Supabase account first.",
          lastRanAt: new Date().toISOString(),
        }),
      );
      return;
    }

    const ownedAthlete =
      ownedProfiles.find((item) => Boolean(item?.ownerUserId) && !item.isJunior) ||
      ownedProfiles.find((item) => Boolean(item?.ownerUserId)) ||
      ownedProfiles[0] ||
      null;

    if (!ownedAthlete?.id) {
      setStorageBackendTestState(
        createStorageBackendTestState({
          status: "fail",
          label: "FAIL - Supabase private storage error",
          message: "Create a Supabase-backed athlete profile first.",
          lastRanAt: new Date().toISOString(),
        }),
      );
      return;
    }

    const file = createPrivateStorageTestImageFile();
    if (!file) {
      setStorageBackendTestState(
        createStorageBackendTestState({
          status: "fail",
          label: "FAIL - Supabase private storage error",
          message:
            "This browser runtime could not create a temporary test image file, so no file was uploaded.",
          lastRanAt: new Date().toISOString(),
        }),
      );
      return;
    }

    setStorageBackendTestState(
      createStorageBackendTestState({
        status: "running",
        label: "Running...",
        message:
          "Uploading a temporary private profile photo, creating a media_assets row, generating a signed owner preview, and cleaning up again.",
      }),
    );

    try {
      const uploadResult = await uploadPrivateProfilePhoto(file, ownedAthlete.id);
      const savedMediaAssetId = uploadResult?.mediaAsset?.id || "";
      const sourceUsed =
        uploadResult?.source === "supabase" && uploadResult?.fallback !== true
          ? "Supabase"
          : uploadResult?.source || "localStorage";
      const uploadedObjectPath = uploadResult?.mediaAsset?.storagePath || "";
      const fileUploaded = Boolean(uploadResult?.fileUploaded);
      const signedUrlCreated = Boolean(uploadResult?.signedUrl);

      if (!uploadResult?.success || uploadResult?.fallback === true || sourceUsed !== "Supabase") {
        setStorageBackendTestState(
          createStorageBackendTestState({
            status: "fallback",
            label: "FALLBACK - private upload did not win",
            message:
              uploadResult?.message ||
              "Private storage test used fallback or could not complete the private upload path.",
            savedMediaAssetId,
            sourceUsed,
            uploadedObjectPath,
            signedUrlCreated,
            fileUploaded,
            deletedCleanly: null,
            uploadErrorMessage: uploadResult?.success ? "" : uploadResult?.message || "",
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      const deleteResult = savedMediaAssetId
        ? await deleteStoredMediaAssetRecord(savedMediaAssetId)
        : null;
      const deletedCleanly = Boolean(deleteResult?.success);

      if (!signedUrlCreated || !deletedCleanly) {
        setStorageBackendTestState(
          createStorageBackendTestState({
            status: "fail",
            label: "FAIL - Supabase private storage error",
            message:
              !signedUrlCreated
                ? uploadResult?.message ||
                  "The private upload worked, but a signed owner preview URL was not created."
                : deleteResult?.message || "The temporary private upload could not be cleaned up.",
            savedMediaAssetId,
            sourceUsed,
            uploadedObjectPath,
            signedUrlCreated,
            fileUploaded,
            deletedCleanly,
            uploadErrorMessage: "",
            signedUrlErrorMessage: signedUrlCreated ? "" : uploadResult?.message || "",
            deleteErrorMessage: deletedCleanly ? "" : deleteResult?.message || "",
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      setStorageBackendTestState(
        createStorageBackendTestState({
          status: "pass",
          label: "PASS - private storage upload works",
          message:
            "Private storage test passed. A temporary profile photo object uploaded to a private bucket, the media_assets row was saved, a signed owner preview URL was created, and cleanup completed.",
          savedMediaAssetId,
          sourceUsed,
          uploadedObjectPath,
          signedUrlCreated,
          fileUploaded,
          deletedCleanly,
          lastRanAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      setStorageBackendTestState(
        createStorageBackendTestState({
          status: "fail",
          label: "FAIL - Supabase private storage error",
          message: String(error?.message || "Unknown error."),
          lastRanAt: new Date().toISOString(),
        }),
      );
    }
  }

  async function runPrivateVideoStorageTest() {
    if (privateVideoStorageTestState.status === "running") {
      return;
    }

    if (!authUser?.id) {
      setPrivateVideoStorageTestState(
        createPrivateVideoStorageTestState({
          status: "fail",
          label: "FAIL - Supabase private video error",
          message: "Auth/session error: sign in with your Supabase account first.",
          lastRanAt: new Date().toISOString(),
        }),
      );
      return;
    }

    setPrivateVideoStorageTestState(
      createPrivateVideoStorageTestState({
        status: "running",
        label: "Running...",
        message:
          "Checking the private video bucket, creating a temporary highlight-video media_assets row, reloading it, and cleaning it up again. No real video file will be uploaded by this QA path.",
      }),
    );

    try {
      const readiness = await getManagedVideoUploadReadiness();
      const profileResult = await ensureFullSupabaseThumbnailTestProfile();
      if (!profileResult?.success || !profileResult?.profile) {
        setPrivateVideoStorageTestState(
          createPrivateVideoStorageTestState({
            status: "fail",
            label: "FAIL - Supabase private video error",
            message:
              profileResult?.message ||
              "Athlete profile save error: the private video storage test could not create or find its QA athlete profile.",
            videoBucketDetected: readiness?.bucketDetected ?? null,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      const highlightResult = await ensureFullSupabaseThumbnailTestHighlight(profileResult.profile);
      if (!highlightResult?.success || !highlightResult?.highlight) {
        setPrivateVideoStorageTestState(
          createPrivateVideoStorageTestState({
            status: "fail",
            label: "FAIL - Supabase private video error",
            message:
              highlightResult?.message ||
              "Highlight save error: the private video storage test could not create or find its QA highlight.",
            savedHighlightId: highlightResult?.savedHighlightId || "",
            videoBucketDetected: readiness?.bucketDetected ?? null,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      const placeholderResult = await uploadManagedHighlightVideoPlaceholder({
        highlightId: highlightResult.highlight.id,
        athleteProfileId: profileResult.profile.id,
      });
      const savedMediaAssetId = placeholderResult?.mediaAsset?.id || "";
      const sourceUsed =
        placeholderResult?.source === "supabase" && placeholderResult?.fallback !== true
          ? "Supabase"
          : placeholderResult?.source || "localStorage";

      if (!placeholderResult?.success || placeholderResult?.fallback === true || sourceUsed !== "Supabase") {
        setPrivateVideoStorageTestState(
          createPrivateVideoStorageTestState({
            status: placeholderResult?.fallback === true ? "fallback" : "fail",
            label:
              placeholderResult?.fallback === true
                ? "FALLBACK - private video path did not win"
                : "FAIL - Supabase private video error",
            message:
              placeholderResult?.message ||
              "The private video storage test could not save its metadata-only QA record.",
            savedHighlightId: highlightResult.highlight.id,
            savedMediaAssetId,
            sourceUsed,
            videoBucketDetected: readiness?.bucketDetected ?? null,
            metadataSaved: false,
            realFileUploaded: false,
            uploadErrorMessage:
              placeholderResult?.message ||
              "The private video storage test could not save its metadata-only QA record.",
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      const reloadResult = await refreshManagedMediaAssets();
      const foundOnReload = Boolean(
        reloadResult?.mediaAssets?.find((item) => item.id === savedMediaAssetId) || null,
      );
      const cleanupResult = savedMediaAssetId
        ? await deleteStoredHighlightVideoRecord(savedMediaAssetId)
        : { success: true, message: "No temporary private video QA asset needed cleanup." };

      if (!foundOnReload || !cleanupResult?.success) {
        setPrivateVideoStorageTestState(
          createPrivateVideoStorageTestState({
            status: "fail",
            label: "FAIL - Supabase private video error",
            message: !foundOnReload
              ? "media_assets error: the temporary private video metadata record was not found again after reload."
              : cleanupResult?.message || "Private video QA cleanup could not be completed.",
            savedHighlightId: highlightResult.highlight.id,
            savedMediaAssetId,
            sourceUsed,
            videoBucketDetected: readiness?.bucketDetected ?? null,
            metadataSaved: true,
            foundOnReload,
            realFileUploaded: false,
            uploadErrorMessage: !foundOnReload
              ? "media_assets error: the temporary private video metadata record was not found again after reload."
              : "",
            deleteMessage: cleanupResult?.message || "",
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      setPrivateVideoStorageTestState(
        createPrivateVideoStorageTestState({
          status: "pass",
          label: "PASS - private video bucket + metadata ready",
          message:
            "PASS - the private video bucket and media_assets linkage are ready for owner testing. No real video file was uploaded by this QA path, so manual private video upload is still required to prove live upload and signed preview playback.",
          savedHighlightId: highlightResult.highlight.id,
          savedMediaAssetId,
          sourceUsed,
          videoBucketDetected: readiness?.bucketDetected ?? null,
          metadataSaved: true,
          foundOnReload: true,
          realFileUploaded: false,
          deleteMessage: cleanupResult?.message || "Temporary private video metadata record deleted.",
          lastRanAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      setPrivateVideoStorageTestState(
        createPrivateVideoStorageTestState({
          status: "fail",
          label: "FAIL - Supabase private video error",
          message: String(error?.message || "Unknown error."),
          uploadErrorMessage: String(error?.message || "Unknown error."),
          lastRanAt: new Date().toISOString(),
        }),
      );
    }
  }

  async function deletePrivateVideoStorageTestAsset() {
    if (!privateVideoStorageTestState.savedMediaAssetId) {
      setPrivateVideoStorageTestState((current) => ({
        ...current,
        deleteMessage: "No temporary private video QA record is selected for cleanup right now.",
      }));
      return;
    }

    setPrivateVideoStorageTestState((current) => ({
      ...current,
      deleteMessage: "Deleting the temporary private video QA record...",
    }));

    const result = await deleteStoredHighlightVideoRecord(privateVideoStorageTestState.savedMediaAssetId);
    if (!result?.success) {
      setPrivateVideoStorageTestState((current) => ({
        ...current,
        status: "fail",
        label: "FAIL - Supabase private video error",
        message: result?.message || "Private video QA cleanup could not be completed.",
        deleteMessage: result?.message || "Private video QA cleanup could not be completed.",
      }));
      return;
    }

    setPrivateVideoStorageTestState((current) =>
      createPrivateVideoStorageTestState({
        ...current,
        status: current.status === "pass" ? "pass" : "idle",
        label:
          current.status === "pass" ? "PASS - private video bucket + metadata ready" : "Not run yet",
        deleteMessage: "Temporary private video QA record deleted.",
      }),
    );
  }

  async function runBuiltInPrivateVideoTest() {
    if (!authUser?.id) {
      return {
        success: false,
        message: "Auth/session error: sign in with your Supabase account first.",
      };
    }

    const readiness = await getManagedVideoUploadReadiness();
    if (!readiness?.videoUploadsEnabled) {
      return {
        success: false,
        message:
          readiness?.message ||
          "Video upload is locked until the private video bucket is ready for signed-in owner testing.",
      };
    }

    const fileResult = await createBuiltInPrivateVideoTestFile({
      athleteDisplayName: SUPABASE_THUMBNAIL_TEST_PROFILE_NAME,
      highlightTitle: SUPABASE_THUMBNAIL_TEST_HIGHLIGHT_NAME,
    });

    if (!fileResult?.success || !fileResult?.file) {
      return {
        success: false,
        message:
          fileResult?.message ||
          "Built-in browser video generation not supported. Use a real MP4/MOV/WEBM file.",
      };
    }

    const profileResult = await ensureFullSupabaseThumbnailTestProfile();
    if (!profileResult?.success || !profileResult?.profile) {
      return {
        success: false,
        message:
          profileResult?.message ||
          "Athlete profile save error: the built-in private video test could not create or find its QA athlete profile.",
      };
    }

    const highlightResult = await ensureFullSupabaseThumbnailTestHighlight(profileResult.profile);
    if (!highlightResult?.success || !highlightResult?.highlight) {
      return {
        success: false,
        message:
          highlightResult?.message ||
          "Highlight save error: the built-in private video test could not create or find its QA highlight.",
      };
    }

    const uploadResult = await uploadPrivateHighlightVideo(fileResult.file, highlightResult.highlight.id);
    if (!uploadResult?.success) {
      return {
        success: false,
        highlight: highlightResult.highlight,
        mediaAsset: uploadResult?.mediaAsset || null,
        message:
          uploadResult?.message ||
          "Unknown error: the built-in private video test could not upload its video file.",
      };
    }

    if (!uploadResult?.signedUrl) {
      return {
        success: false,
        highlight: highlightResult.highlight,
        mediaAsset: uploadResult?.mediaAsset || null,
        message:
          uploadResult?.message ||
          "Signed URL error: the built-in private video test uploaded its file, but the owner preview could not be created.",
      };
    }

    return {
      success: true,
      highlight: highlightResult.highlight,
      mediaAsset: uploadResult.mediaAsset,
      signedUrl: uploadResult.signedUrl,
      message:
        uploadResult?.message ||
        "PASS - built-in private video test uploaded successfully and the signed owner preview loaded.",
    };
  }

  async function ensureFullSupabaseThumbnailTestProfile() {
    const profileReloadResult = await refreshManagedProfiles();
    const currentProfiles = Array.isArray(profileReloadResult?.profiles)
      ? profileReloadResult.profiles
      : ownedProfiles;
    const existingProfile =
      currentProfiles.find(
        (item) =>
          item?.ownerUserId === authUser?.id &&
          item?.storageSource === "supabase" &&
          normalizeText(item?.displayName) === normalizeText(SUPABASE_THUMBNAIL_TEST_PROFILE_NAME),
      ) || null;

    if (existingProfile) {
      return {
        success: true,
        profile: existingProfile,
        created: false,
        sourceUsed: "Supabase",
      };
    }

    const testProfile = buildSupabaseFullThumbnailTestProfileRecord();
    const saveResult = await saveManagedProfile(testProfile);
    const reloadedProfiles = await refreshManagedProfiles();
    const savedProfile =
      reloadedProfiles?.profiles?.find((item) => item.id === (saveResult?.profile?.id || testProfile.id)) ||
      reloadedProfiles?.profiles?.find(
        (item) =>
          item?.ownerUserId === authUser?.id &&
          item?.storageSource === "supabase" &&
          normalizeText(item?.displayName) === normalizeText(SUPABASE_THUMBNAIL_TEST_PROFILE_NAME),
      ) ||
      null;

    if (saveResult?.source !== "supabase" || saveResult?.fallback === true || !savedProfile) {
      return {
        success: false,
        sourceUsed:
          saveResult?.source === "supabase" && saveResult?.fallback !== true
            ? "Supabase"
            : saveResult?.source || "localStorage",
        savedProfileId: saveResult?.profile?.id || testProfile.id,
        message:
          saveResult?.message ||
          "Athlete profile save error: the full Supabase highlight thumbnail test could not create its QA athlete profile.",
      };
    }

    return {
      success: true,
      profile: savedProfile,
      created: true,
      sourceUsed: "Supabase",
    };
  }

  async function ensureFullSupabaseThumbnailTestHighlight(profile) {
    const highlightReloadResult = await refreshManagedHighlights();
    const currentHighlights = Array.isArray(highlightReloadResult?.highlights)
      ? highlightReloadResult.highlights
      : highlights;
    const existingHighlight =
      currentHighlights.find(
        (item) =>
          item?.storageSource === "supabase" &&
          item?.athleteId === profile?.id &&
          normalizeText(item?.title) === normalizeText(SUPABASE_THUMBNAIL_TEST_HIGHLIGHT_NAME),
      ) || null;

    if (existingHighlight) {
      return {
        success: true,
        highlight: existingHighlight,
        created: false,
        sourceUsed: "Supabase",
      };
    }

    const testHighlight = buildSupabaseFullThumbnailTestHighlightRecord(profile);
    const saveResult = await saveManagedHighlight(testHighlight);
    const reloadedHighlights = await refreshManagedHighlights();
    const savedHighlight =
      reloadedHighlights?.highlights?.find(
        (item) => item.id === (saveResult?.highlight?.id || testHighlight.id),
      ) ||
      reloadedHighlights?.highlights?.find(
        (item) =>
          item?.storageSource === "supabase" &&
          item?.athleteId === profile?.id &&
          normalizeText(item?.title) === normalizeText(SUPABASE_THUMBNAIL_TEST_HIGHLIGHT_NAME),
      ) ||
      null;

    if (saveResult?.source !== "supabase" || saveResult?.fallback === true || !savedHighlight) {
      return {
        success: false,
        sourceUsed:
          saveResult?.source === "supabase" && saveResult?.fallback !== true
            ? "Supabase"
            : saveResult?.source || "localStorage",
        savedHighlightId: saveResult?.highlight?.id || testHighlight.id,
        message:
          saveResult?.message ||
          "Highlight save error: the full Supabase highlight thumbnail test could not create its QA highlight.",
      };
    }

    return {
      success: true,
      highlight: savedHighlight,
      created: true,
      sourceUsed: "Supabase",
    };
  }

  async function runFullSupabaseHighlightThumbnailTest() {
    if (fullHighlightThumbnailTestState.status === "running") {
      return;
    }

    if (!authUser?.id) {
      setFullHighlightThumbnailTestState(
        createFullHighlightThumbnailTestState({
          status: "fail",
          label: "FAIL - Supabase highlight thumbnail error",
          message: "Auth/session error: sign in with your Supabase account first.",
          athleteProfileReady: false,
          highlightReady: false,
          thumbnailUploaded: false,
          mediaAssetLinked: false,
          signedPreviewLoaded: false,
          lastRanAt: new Date().toISOString(),
        }),
      );
      return;
    }

    const testFile = createFullHighlightThumbnailTestImageFile();
    if (!testFile) {
      setFullHighlightThumbnailTestState(
        createFullHighlightThumbnailTestState({
          status: "fail",
          label: "FAIL - Supabase highlight thumbnail error",
          message:
            "Unknown error: this browser runtime could not create the built-in private PNG test thumbnail.",
          athleteProfileReady: false,
          highlightReady: false,
          thumbnailUploaded: false,
          mediaAssetLinked: false,
          signedPreviewLoaded: false,
          lastRanAt: new Date().toISOString(),
        }),
      );
      return;
    }

    setFullHighlightThumbnailTestState(
      createFullHighlightThumbnailTestState({
        status: "running",
        label: "Running...",
        message:
          "Creating or finding a Supabase athlete profile, creating or finding a Supabase highlight, uploading a built-in private PNG thumbnail, linking media_assets, and loading a signed private preview.",
      }),
    );

    try {
      const profileResult = await ensureFullSupabaseThumbnailTestProfile();
      if (!profileResult?.success || !profileResult?.profile) {
        setFullHighlightThumbnailTestState(
          createFullHighlightThumbnailTestState({
            status: "fail",
            label: "FAIL - Supabase highlight thumbnail error",
            message:
              profileResult?.message ||
              "Athlete profile save error: the full Supabase highlight thumbnail test could not create or find its QA athlete profile.",
            savedProfileId: profileResult?.savedProfileId || "",
            sourceUsed: profileResult?.sourceUsed || "localStorage",
            athleteProfileReady: false,
            athleteProfileAction: "",
            highlightReady: false,
            thumbnailUploaded: false,
            mediaAssetLinked: false,
            signedPreviewLoaded: false,
            uploadErrorMessage: profileResult?.message || "",
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      const highlightResult = await ensureFullSupabaseThumbnailTestHighlight(profileResult.profile);
      if (!highlightResult?.success || !highlightResult?.highlight) {
        setFullHighlightThumbnailTestState(
          createFullHighlightThumbnailTestState({
            status: "fail",
            label: "FAIL - Supabase highlight thumbnail error",
            message:
              highlightResult?.message ||
              "Highlight save error: the full Supabase highlight thumbnail test could not create or find its QA highlight.",
            savedProfileId: profileResult.profile.id,
            savedHighlightId: highlightResult?.savedHighlightId || "",
            sourceUsed: highlightResult?.sourceUsed || profileResult?.sourceUsed || "localStorage",
            athleteProfileReady: true,
            athleteProfileAction: profileResult.created ? "Created" : "Found existing",
            highlightReady: false,
            highlightAction: "",
            thumbnailUploaded: false,
            mediaAssetLinked: false,
            signedPreviewLoaded: false,
            uploadErrorMessage: highlightResult?.message || "",
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      const uploadResult = await uploadPrivateHighlightThumbnail(
        testFile,
        highlightResult.highlight.id,
      );
      const sourceUsed =
        uploadResult?.source === "supabase" && uploadResult?.fallback !== true
          ? "Supabase"
          : uploadResult?.source || "localStorage";

      if (!uploadResult?.success || uploadResult?.fallback === true || sourceUsed !== "Supabase") {
        setFullHighlightThumbnailTestState(
          createFullHighlightThumbnailTestState({
            status: uploadResult?.fallback === true ? "fallback" : "fail",
            label:
              uploadResult?.fallback === true
                ? "FALLBACK - local/demo path won"
                : "FAIL - Supabase highlight thumbnail error",
            message:
              uploadResult?.message ||
              "Unknown error: the full Supabase highlight thumbnail test could not upload its private thumbnail.",
            savedProfileId: profileResult.profile.id,
            savedHighlightId: highlightResult.highlight.id,
            savedMediaAssetId: uploadResult?.mediaAsset?.id || "",
            sourceUsed,
            athleteProfileReady: true,
            athleteProfileAction: profileResult.created ? "Created" : "Found existing",
            highlightReady: true,
            highlightAction: highlightResult.created ? "Created" : "Found existing",
            thumbnailUploaded: false,
            mediaAssetLinked: false,
            signedPreviewLoaded: false,
            uploadErrorMessage: uploadResult?.message || "",
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      const mediaReloadResult = await refreshManagedMediaAssets();
      const linkedMediaAsset =
        mediaReloadResult?.mediaAssets?.find((item) => item.id === uploadResult?.mediaAsset?.id) ||
        getLatestHighlightThumbnailAsset(
          mediaReloadResult?.mediaAssets || mediaAssets,
          highlightResult.highlight.id,
        ) ||
        uploadResult?.mediaAsset ||
        null;
      const mediaAssetLinked = Boolean(
        linkedMediaAsset?.id &&
          linkedMediaAsset?.highlightId === highlightResult.highlight.id &&
          linkedMediaAsset?.storageSource === "supabase",
      );

      let signedUrl = uploadResult?.signedUrl || "";
      let signedUrlErrorMessage = "";

      if (!signedUrl && linkedMediaAsset?.id) {
        const signedUrlResult = await loadPrivateSignedMediaUrl(linkedMediaAsset.id);
        signedUrl = signedUrlResult?.signedUrl || "";
        if (!signedUrlResult?.success || !signedUrl) {
          signedUrlErrorMessage =
            signedUrlResult?.message ||
            "Signed URL error: the full Supabase highlight thumbnail test could not load an owner-only preview URL.";
        }
      }

      const signedPreviewLoaded = Boolean(signedUrl);
      const approvalStatus = getMediaApprovalDisplayLabel(linkedMediaAsset);
      const visibilityStatus = getMediaVisibilityDisplayLabel(linkedMediaAsset);
      const currentPrivateThumbnail =
        linkedMediaAsset?.originalFilename || linkedMediaAsset?.storagePath || "Not uploaded yet";

      if (!mediaAssetLinked || !signedPreviewLoaded) {
        setFullHighlightThumbnailTestState(
          createFullHighlightThumbnailTestState({
            status: "fail",
            label: "FAIL - Supabase highlight thumbnail error",
            message: !mediaAssetLinked
              ? "media_assets insert/update error: the uploaded private thumbnail could not be confirmed against the selected Supabase highlight."
              : signedUrlErrorMessage ||
                "Signed URL error: the full Supabase highlight thumbnail test could not load an owner-only preview URL.",
            savedProfileId: profileResult.profile.id,
            savedHighlightId: highlightResult.highlight.id,
            savedMediaAssetId: linkedMediaAsset?.id || uploadResult?.mediaAsset?.id || "",
            sourceUsed,
            athleteProfileReady: true,
            athleteProfileAction: profileResult.created ? "Created" : "Found existing",
            highlightReady: true,
            highlightAction: highlightResult.created ? "Created" : "Found existing",
            thumbnailUploaded: true,
            mediaAssetLinked,
            signedPreviewLoaded,
            currentPrivateThumbnail,
            approvalStatus,
            visibilityStatus,
            uploadErrorMessage:
              !mediaAssetLinked
                ? "media_assets insert/update error: the uploaded private thumbnail could not be confirmed against the selected Supabase highlight."
                : "",
            signedUrlErrorMessage,
            lastRanAt: new Date().toISOString(),
          }),
        );
        return;
      }

      setFullHighlightThumbnailTestState(
        createFullHighlightThumbnailTestState({
          status: "pass",
          label: "PASS - full Supabase highlight thumbnail flow works",
          message:
            "PASS - the full Supabase highlight thumbnail flow worked. A Supabase-backed athlete profile was created or found, a Supabase-backed highlight was created or found, a built-in private PNG thumbnail uploaded to msr-highlight-thumbnails, media_assets linked correctly, and a signed private preview loaded for the signed-in owner only.",
          savedProfileId: profileResult.profile.id,
          savedHighlightId: highlightResult.highlight.id,
          savedMediaAssetId: linkedMediaAsset?.id || uploadResult?.mediaAsset?.id || "",
          sourceUsed,
          athleteProfileReady: true,
          athleteProfileAction: profileResult.created ? "Created" : "Found existing",
          highlightReady: true,
          highlightAction: highlightResult.created ? "Created" : "Found existing",
          thumbnailUploaded: true,
          mediaAssetLinked: true,
          signedPreviewLoaded: true,
          currentPrivateThumbnail,
          approvalStatus,
          visibilityStatus,
          lastRanAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      setFullHighlightThumbnailTestState(
        createFullHighlightThumbnailTestState({
          status: "fail",
          label: "FAIL - Supabase highlight thumbnail error",
          message: String(error?.message || "Unknown error."),
          athleteProfileReady: false,
          highlightReady: false,
          thumbnailUploaded: false,
          mediaAssetLinked: false,
          signedPreviewLoaded: false,
          lastRanAt: new Date().toISOString(),
        }),
      );
    }
  }

  async function deleteSupabaseStorageTestAsset() {
    if (!storageBackendTestState.savedMediaAssetId || storageBackendTestState.deletedCleanly) {
      setStorageBackendTestState((current) => ({
        ...current,
        deleteMessage: "No leftover private storage test asset needs cleanup right now.",
      }));
      return;
    }

    setStorageBackendTestState((current) => ({
      ...current,
      deleteMessage: "Deleting the leftover private storage test asset...",
    }));

    const result = await deleteStoredMediaAssetRecord(storageBackendTestState.savedMediaAssetId);

    if (!result?.success) {
      setStorageBackendTestState((current) => ({
        ...current,
        status: "fail",
        label: "FAIL - Supabase private storage error",
        message: result?.message || "Private storage test cleanup could not be completed.",
        deleteMessage: result?.message || "Private storage test cleanup could not be completed.",
        deleteErrorMessage:
          result?.message || "Private storage test cleanup could not be completed.",
      }));
      return;
    }

    setStorageBackendTestState((current) => ({
      ...current,
      deletedCleanly: true,
      deleteErrorMessage: "",
      deleteMessage: "Leftover private storage test asset deleted.",
    }));
  }

  useEffect(() => {
    let isCancelled = false;

    if (!realAuthEnabled) {
      setAuthSession(null);
      setAuthUser(null);
      setAuthenticatedAccount(null);
      return () => {
        isCancelled = true;
      };
    }

    async function loadSupabaseAccount() {
      const session = await getCurrentSession();
      const user = session?.user || null;
      const account = user ? await getAccountProfile(user) : null;

      if (isCancelled) {
        return;
      }

      setAuthSession(session);
      setAuthUser(user);
      setAuthenticatedAccount(account);

      if (account?.role) {
        setSelectedRole(account.role);
      }
    }

    loadSupabaseAccount();

    return () => {
      isCancelled = true;
    };
  }, [realAuthEnabled]);

  useEffect(() => {
    let isCancelled = false;

    async function loadManagedProfiles() {
      const result = await getManagedProfiles();

      if (isCancelled) {
        return;
      }

      applyManagedProfileResult(result);
    }

    loadManagedProfiles();

    return () => {
      isCancelled = true;
    };
  }, [realAuthEnabled, authUser?.id]);

  useEffect(() => {
    let isCancelled = false;

    async function loadManagedHighlights() {
      const result = await getManagedHighlights();

      if (isCancelled) {
        return;
      }

      applyManagedHighlightResult(result);
    }

    loadManagedHighlights();

    return () => {
      isCancelled = true;
    };
  }, [realAuthEnabled, authUser?.id]);

  useEffect(() => {
    let isCancelled = false;

    async function loadManagedOpportunities() {
      const result = await getManagedOpportunities();

      if (isCancelled) {
        return;
      }

      applyManagedOpportunityResult(result);
    }

    loadManagedOpportunities();

    return () => {
      isCancelled = true;
    };
  }, [realAuthEnabled, authUser?.id]);

  useEffect(() => {
    let isCancelled = false;

    async function loadManagedShortlistRecords() {
      const result = await getManagedShortlist();

      if (isCancelled) {
        return;
      }

      applyManagedShortlistResult(result);
    }

    loadManagedShortlistRecords();

    return () => {
      isCancelled = true;
    };
  }, [realAuthEnabled, authUser?.id]);

  useEffect(() => {
    let isCancelled = false;

    async function loadManagedContactRequests() {
      const result = await getManagedContactRequests();

      if (isCancelled) {
        return;
      }

      applyManagedContactRequestResult(result);
    }

    loadManagedContactRequests();

    return () => {
      isCancelled = true;
    };
  }, [realAuthEnabled, authUser?.id]);

  useEffect(() => {
    let isCancelled = false;

    async function loadManagedAdminQueues() {
      const result = await getManagedAdminQueueItems();

      if (isCancelled) {
        return;
      }

      applyManagedAdminQueueResult(result);
    }

    loadManagedAdminQueues();

    return () => {
      isCancelled = true;
    };
  }, [realAuthEnabled, authUser?.id]);

  useEffect(() => {
    let isCancelled = false;

    async function loadManagedMediaAssets() {
      const result = await getManagedMediaAssets();

      if (isCancelled) {
        return;
      }

      applyManagedMediaResult(result);
    }

    loadManagedMediaAssets();

    return () => {
      isCancelled = true;
    };
  }, [realAuthEnabled, authUser?.id]);

  useEffect(() => {
    writeLocalData(STORAGE_KEYS.athletes, athletes);
  }, [athletes]);

  useEffect(() => {
    writeLocalData(STORAGE_KEYS.highlights, highlights);
  }, [highlights]);

  useEffect(() => {
    writeLocalData(STORAGE_KEYS.opportunities, opportunities);
  }, [opportunities]);

  useEffect(() => {
    writeLocalData(STORAGE_KEYS.shortlist, shortlist);
  }, [shortlist]);

  useEffect(() => {
    writeLocalData(STORAGE_KEYS.requests, contactRequests);
  }, [contactRequests]);

  useEffect(() => {
    writeLocalData(STORAGE_KEYS.adminQueues, adminQueues);
  }, [adminQueues]);

  useEffect(() => {
    setCurrentRole(selectedRole);
  }, [selectedRole]);

  useEffect(() => {
    setAthletes((current) => syncAthleteHighlightRefs(current, highlights));
  }, [highlights]);

  useEffect(() => {
    setAdminQueues((current) => {
      const pendingHighlights = syncAdminHighlightQueue(current.pendingHighlights, highlights, athletes);
      const pendingOpportunities = syncAdminOpportunityQueue(
        current.pendingOpportunities,
        opportunities,
      );
      return pendingHighlights === current.pendingHighlights &&
        pendingOpportunities === current.pendingOpportunities
        ? current
        : {
            ...current,
            pendingHighlights,
            pendingOpportunities,
          };
    });
  }, [athletes, highlights, opportunities]);

  const visibleAthletes = useMemo(
    () => mergeProfileCollections(syncAthleteHighlightRefs(ownedProfiles, highlights), athletes),
    [ownedProfiles, athletes, highlights],
  );
  const visibleHighlights = highlights;
  const visibleOpportunities = opportunities;
  const pilotAthletes = useMemo(
    () => visibleAthletes.filter((item) => !isPilotHiddenQaRecord(item)),
    [visibleAthletes],
  );
  const pilotAthleteIds = useMemo(
    () => new Set(pilotAthletes.map((item) => item.id)),
    [pilotAthletes],
  );
  const pilotHighlights = useMemo(
    () =>
      visibleHighlights.filter(
        (item) => !isPilotHiddenQaRecord(item) && (!item.athleteId || pilotAthleteIds.has(item.athleteId)),
      ),
    [visibleHighlights, pilotAthleteIds],
  );
  const pilotHighlightIds = useMemo(
    () => new Set(pilotHighlights.map((item) => item.id)),
    [pilotHighlights],
  );
  const pilotOpportunities = useMemo(
    () => visibleOpportunities.filter((item) => !isPilotHiddenQaRecord(item)),
    [visibleOpportunities],
  );
  const pilotMediaAssets = useMemo(
    () =>
      mediaAssets.filter(
        (item) =>
          !isPilotHiddenQaRecord(item) &&
          (!item.athleteProfileId || pilotAthleteIds.has(item.athleteProfileId)) &&
          (!item.highlightId || pilotHighlightIds.has(item.highlightId)),
      ),
    [mediaAssets, pilotAthleteIds, pilotHighlightIds],
  );
  const activeAccount = realAuthEnabled ? authenticatedAccount : demoAccount;
  const hasSupabaseAccount = Boolean(authUser || authSession || authenticatedAccount);
  const profileSyncWarning = activeAccount?.profileSyncWarning || "";
  const roleConfig = getRoleConfig(selectedRole);
  const primaryNavItems = getPrimaryNavItemsForRole(selectedRole, Boolean(activeAccount));
  const desktopNavItems = getDesktopNavItems(Boolean(activeAccount));
  const headerRoleLabel = getHeaderRoleLabel(selectedRole);
  const shortlistSet = useMemo(
    () => new Set(shortlist.map((item) => item.athleteId)),
    [shortlist],
  );
  const requestMap = useMemo(
    () => buildRequestMap(contactRequests),
    [contactRequests],
  );
  const roleRequestRows = useMemo(
    () => getRoleRequestRows(contactRequests, pilotAthletes, pilotOpportunities, selectedRole),
    [contactRequests, pilotAthletes, pilotOpportunities, selectedRole],
  );
  const supabaseStatus = getSupabaseStatus();
  const backendModeLabel = !realAuthEnabled
    ? "Local Demo"
    : hasSupabaseAccount
      ? "Supabase Auth Active"
      : "Supabase Ready";
  const mediaApprovalWorkflow = getMediaApprovalWorkflowState(mediaBackendStatus);
  const backendStatus = {
    mode: !realAuthEnabled ? "local" : hasSupabaseAccount ? "supabase_auth" : "supabase_ready",
    dataMode: getDataMode(),
    modeLabel: backendModeLabel,
    enabled: isBackendEnabled(),
    configured: supabaseStatus.configured,
    authEnabled: realAuthEnabled,
    currentUserEmail: authUser?.email || activeAccount?.email || "",
    currentRole: activeAccount?.role || selectedRole || "",
    profileSyncWarning,
    profileDataMode: profileBackendStatus.mode,
    profileDataModeLabel: profileBackendStatus.modeLabel,
    athleteProfileTableDetected: profileBackendStatus.tableDetected,
    athleteProfileTableDetectedLabel: profileBackendStatus.tableDetectedLabel,
    currentProfileSource: profileBackendStatus.source,
    currentProfileSourceLabel: profileBackendStatus.sourceLabel,
    highlightDataMode: highlightBackendStatus.mode,
    highlightDataModeLabel: highlightBackendStatus.modeLabel,
    highlightTableDetected: highlightBackendStatus.tableDetected,
    highlightTableDetectedLabel: highlightBackendStatus.tableDetectedLabel,
    currentHighlightSource: highlightBackendStatus.source,
    currentHighlightSourceLabel: highlightBackendStatus.sourceLabel,
    opportunityDataMode: opportunityBackendStatus.mode,
    opportunityDataModeLabel: opportunityBackendStatus.modeLabel,
    opportunityTableDetected: opportunityBackendStatus.tableDetected,
    opportunityTableDetectedLabel: opportunityBackendStatus.tableDetectedLabel,
    currentOpportunitySource: opportunityBackendStatus.source,
    currentOpportunitySourceLabel: opportunityBackendStatus.sourceLabel,
    shortlistDataMode: shortlistBackendStatus.mode,
    shortlistDataModeLabel: shortlistBackendStatus.modeLabel,
    shortlistTableDetected: shortlistBackendStatus.tableDetected,
    shortlistTableDetectedLabel: shortlistBackendStatus.tableDetectedLabel,
    currentShortlistSource: shortlistBackendStatus.source,
    currentShortlistSourceLabel: shortlistBackendStatus.sourceLabel,
    contactRequestDataMode: contactRequestBackendStatus.mode,
    contactRequestDataModeLabel: contactRequestBackendStatus.modeLabel,
    contactRequestTableDetected: contactRequestBackendStatus.tableDetected,
    contactRequestTableDetectedLabel: contactRequestBackendStatus.tableDetectedLabel,
    currentContactRequestSource: contactRequestBackendStatus.source,
    currentContactRequestSourceLabel: contactRequestBackendStatus.sourceLabel,
    adminQueueDataMode: adminQueueBackendStatus.mode,
    adminQueueDataModeLabel: adminQueueBackendStatus.modeLabel,
    adminQueueTableDetected: adminQueueBackendStatus.tableDetected,
    adminQueueTableDetectedLabel: adminQueueBackendStatus.tableDetectedLabel,
    currentAdminQueueSource: adminQueueBackendStatus.source,
    currentAdminQueueSourceLabel: adminQueueBackendStatus.sourceLabel,
    mediaDataMode: mediaBackendStatus.mode,
    mediaDataModeLabel: mediaBackendStatus.modeLabel,
    mediaAssetTableDetected: mediaBackendStatus.tableDetected,
    mediaAssetTableDetectedLabel: mediaBackendStatus.tableDetectedLabel,
    currentMediaSource: mediaBackendStatus.source,
    currentMediaSourceLabel: mediaBackendStatus.sourceLabel,
    mediaStorageMode: mediaBackendStatus.storageMode,
    mediaStorageModeLabel: mediaBackendStatus.storageModeLabel,
    videoStorageMode: mediaBackendStatus.videoStorageMode,
    videoStorageModeLabel: mediaBackendStatus.videoStorageModeLabel,
    profilePhotoBucketDetected: mediaBackendStatus.profilePhotoBucketDetected,
    profilePhotoBucketDetectedLabel: mediaBackendStatus.profilePhotoBucketDetectedLabel,
    highlightThumbnailBucketDetected: mediaBackendStatus.highlightThumbnailBucketDetected,
    highlightThumbnailBucketDetectedLabel:
      mediaBackendStatus.highlightThumbnailBucketDetectedLabel,
    highlightVideoBucketDetected: mediaBackendStatus.highlightVideoBucketDetected,
    highlightVideoBucketDetectedLabel: mediaBackendStatus.highlightVideoBucketDetectedLabel,
    mediaBucketStatus: mediaBackendStatus.bucketStatus,
    uploadsEnabled: mediaBackendStatus.uploadsEnabled,
    publicMediaAccess: mediaBackendStatus.publicMediaAccess,
    publicUnauthenticatedMediaLabel: "Disabled",
    publicMediaUrlsEnabled: false,
    publicMediaUrlsLabel: "Disabled",
    videoUploadsEnabled: mediaBackendStatus.videoUploadsEnabled,
    videoUploadsLabel: mediaBackendStatus.videoUploadsLabel || "Disabled",
    mediaApprovalWorkflow: mediaApprovalWorkflow.value,
    mediaApprovalWorkflowLabel: mediaApprovalWorkflow.label,
    signedOwnerPreviewsLabel:
      mediaBackendStatus.storageMode === "active"
        ? "Active"
        : mediaBackendStatus.storageMode === "fallback"
          ? "Fallback"
          : "Not enabled",
    juniorMediaApprovalLabel: "Parent/guardian required",
    adminMediaReviewLabel:
      mediaApprovalWorkflow.value === "active" ? "Enabled for metadata" : "Not enabled",
    sportsDataMigrationStatus:
      mediaBackendStatus.sportsDataMigrationStatus ||
      adminQueueBackendStatus.sportsDataMigrationStatus ||
      shortlistBackendStatus.sportsDataMigrationStatus ||
      contactRequestBackendStatus.sportsDataMigrationStatus ||
      opportunityBackendStatus.sportsDataMigrationStatus ||
      highlightBackendStatus.sportsDataMigrationStatus ||
      profileBackendStatus.sportsDataMigrationStatus,
    profileDataMessage: profileBackendStatus.message,
    highlightDataMessage: highlightBackendStatus.message,
    opportunityDataMessage: opportunityBackendStatus.message,
    shortlistDataMessage: shortlistBackendStatus.message,
    contactRequestDataMessage: contactRequestBackendStatus.message,
    adminQueueDataMessage: adminQueueBackendStatus.message,
    mediaDataMessage: mediaBackendStatus.message,
    mediaStorageMessage: mediaBackendStatus.storageMessage,
    message: !realAuthEnabled
      ? getBackendReadinessMessage()
      : profileSyncWarning
        ? profileSyncWarning
        : hasSupabaseAccount
          ? mediaBackendStatus.videoUploadsEnabled
            ? "Supabase auth is active. Athlete profiles, highlight metadata, opportunity metadata, contact request metadata, shortlist records, admin queue records, and media metadata can now save to Supabase in this phase. Private profile photos, private highlight thumbnails, and private highlight video owner tests stay approval-gated, signed-preview only, and non-public. Public media access remains disabled."
            : "Supabase auth is active. Athlete profiles, highlight metadata, opportunity metadata, contact request metadata, shortlist records, admin queue records, and media metadata can now save to Supabase in this phase. Private profile photos and private highlight thumbnails stay owner-only, approval-gated, and non-public. Public media access and video uploads remain disabled."
          : "Backend is connected. Create or confirm a Supabase user, then sign in.",
  };

  async function selectRole(role) {
    const nextRole = ROLE_DEFINITIONS[role] ? role : DEFAULT_SELECTED_ROLE;
    setSelectedRole(nextRole);

    if (realAuthEnabled) {
      if (!hasSupabaseAccount) {
        setMessage(`${getRoleLabel(nextRole)} selected for the current local UI path.`);
        return;
      }

      const result = await saveAccountRole(nextRole);
      if (result?.account) {
        setAuthenticatedAccount(result.account);
      }
      setMessage(result?.message || `${getRoleLabel(nextRole)} role selected.`);
      return;
    }

    const result = await saveAccountRole(nextRole);
    if (result?.account) {
      setDemoAccount(result.account);
    }
    setMessage(result?.message || `${getRoleLabel(nextRole)} demo role selected.`);
  }

  async function createAccountRecord(formPayload) {
    const result = await signUpWithEmail(formPayload);
    setMessage(result.message || "");

    if (!result.success) {
      return result;
    }

    if (realAuthEnabled) {
      setAuthSession(result.session || null);
      setAuthUser(result.user || result.session?.user || null);
      setAuthenticatedAccount(result.account || null);
    } else {
      setDemoAccount(result.account || null);
    }

    if (result.account?.role) {
      setSelectedRole(result.account.role);
    }

    return result;
  }

  async function loginToAccount(formPayload) {
    const result = await signInWithEmail(formPayload);
    setMessage(result.message || "");

    if (!result.success) {
      return result;
    }

    if (realAuthEnabled) {
      setAuthSession(result.session || null);
      setAuthUser(result.user || result.session?.user || null);
      setAuthenticatedAccount(result.account || null);
    } else {
      setDemoAccount(result.account || null);
    }

    if (result.account?.role) {
      setSelectedRole(result.account.role);
    }

    return result;
  }

  async function logoutAccount() {
    const result = await signOut();
    setMessage(result.message || "");

    if (!result.success) {
      return result;
    }

    if (!realAuthEnabled) {
      setDemoAccount(null);
    }

    setAuthSession(null);
    setAuthUser(null);
    setAuthenticatedAccount(null);
    setSelectedRole(DEFAULT_SELECTED_ROLE);

    return result;
  }

  async function saveProfile(formPayload, mode) {
    const missingFields = getMissingProfileFields(formPayload, mode);
    if (missingFields.length > 0) {
      setMessage(
        `Complete the required resume fields before ${
          mode === "submit" ? "submitting" : "saving"
        }: ${missingFields.join(", ")}.`,
      );
      return { success: false, missingFields };
    }

    const isJunior = formPayload.ageCategory === "Junior";
    const profileStatus =
      mode === "submit"
        ? isJunior
          ? "Pending Parent Approval"
          : "Pending Verification"
        : "Draft";

    const createdAt = new Date().toISOString();
    const resolvedForm = getResolvedProfileFormValues(formPayload);
    const sportDefinition = resolvedForm.sportDefinition;
    if (!sportDefinition) {
      setMessage("Select a sport from the My Sports Resume catalogue before saving.");
      return { success: false };
    }
    const matchedTeam = resolvedForm.matchedTeam;
    const achievementSections = {
      awards: splitLines(formPayload.awards),
      representativeSelections: splitLines(formPayload.representativeSelections),
      finalsHistory: splitLines(formPayload.finalsHistory),
      mvpAwards: splitLines(formPayload.mvpAwards),
      bestAndFairest: splitLines(formPayload.bestAndFairest),
      carnivalResults: splitLines(formPayload.carnivalResults),
      otherAchievements: splitLines(formPayload.otherAchievements),
    };
    const playingHistory = {
      currentTeam:
        formPayload.currentTeam || matchedTeam?.name || resolvedForm.resolvedClub || "",
      previousTeams: splitLines(formPayload.previousTeams),
      yearsPlayed: formPayload.yearsPlayed || "",
      mainCompetition:
        resolvedForm.resolvedCompetition || "",
      representativeHistory: splitLines(formPayload.representativeHistory),
      schoolHistory: splitLines(formPayload.schoolHistory),
      academyHistory: splitLines(formPayload.academyHistory),
    };
    const baseProfile = enrichProfileRecord({
      ...PROFILE_DEFAULTS,
      id: createStableAthleteProfileId(),
      displayName: formPayload.displayName || "Untitled Athlete",
      profileSummary: formPayload.profileSummary || "",
      ageGroup: resolvedForm.resolvedAgeGroup || getDefaultAgeGroup(isJunior),
      isJunior,
      sportId: sportDefinition.id,
      sportCategory: sportDefinition.category,
      sport: sportDefinition.name,
      position:
        resolvedForm.resolvedPosition ||
        getPositionOptionsForSport(sportDefinition)[0] ||
        "TBA",
      secondaryPosition: resolvedForm.resolvedSecondaryPosition || "",
      region: resolvedForm.resolvedRegion || matchedTeam?.region || "",
      state: formPayload.state || matchedTeam?.state || "",
      postcode: formPayload.postcode || matchedTeam?.postcode || "",
      suburb: formPayload.suburb || matchedTeam?.suburb || "",
      club: matchedTeam?.name || resolvedForm.resolvedClub || "",
      teamDirectoryId: matchedTeam?.id || "",
      clubEntryType: matchedTeam?.clubEntryType || (matchedTeam ? "directory" : resolvedForm.usesCustomClub ? "custom_unverified" : "custom"),
      isVerifiedClubEntry: Boolean(matchedTeam?.isVerifiedDirectoryEntry),
      competition: resolvedForm.resolvedCompetition || "",
      competitionLevel: resolvedForm.resolvedCompetitionLevel || "Local Club",
      verificationBadges: [],
      achievementSections,
      achievements: flattenAchievementSections(achievementSections),
      stats: parseStats(formPayload.stats),
      physicalDetails: {
        height: formPayload.height || "",
        weight: formPayload.weight || "",
        dominantSide: formPayload.dominantSide || "",
        preferredSide: formPayload.preferredSide || "",
        fitnessNotes: formPayload.fitnessNotes || "",
        speedMetrics: formPayload.speedMetrics || "",
      },
      playingHistory,
      references: {
        coachName: formPayload.coachReferenceName || "",
        coachRole: formPayload.coachReferenceRole || "",
      },
      availability: {
        openToTrials: Boolean(formPayload.availability.openToTrials),
        openToAcademy: Boolean(formPayload.availability.openToAcademy),
        openToSchoolSport: Boolean(formPayload.availability.openToSchoolSport),
        openToRepresentativePathways: Boolean(
          formPayload.availability.openToRepresentativePathways,
        ),
        openToSeniorSigning: Boolean(formPayload.availability.openToSeniorSigning),
        openToFirstGrade: Boolean(formPayload.availability.openToFirstGrade),
        openToReserveGrade: Boolean(formPayload.availability.openToReserveGrade),
        willingToRelocate: Boolean(formPayload.availability.willingToRelocate),
        preferredLocations: formPayload.availability.preferredLocations || "",
      },
      profileStatus,
      visibilityStatus:
        mode === "submit" ? "Private" : formPayload.profileVisibility || "Private",
      highlights: [],
      contactRoute: isJunior ? "parent_guardian" : "athlete",
      createdAt,
      source: "local-draft",
    });

    const newHighlights = formPayload.highlightTitle
      ? [
          buildManagedHighlightRecord({
            athlete: baseProfile,
            formPayload: {
              highlightTitle: formPayload.highlightTitle,
              highlightType: resolvedForm.resolvedHighlightType || formPayload.highlightType,
              customHighlightType: formPayload.customHighlightType,
              highlightEvent: formPayload.highlightEvent,
              highlightDate: formPayload.highlightDate,
              highlightVideoUrl: formPayload.highlightVideoUrl,
              description: `Local demo highlight placeholder for ${
                formPayload.highlightEvent || "a recent performance"
              }. Replace with a private thumbnail or future video upload once media approval settings are ready.`,
              verificationSource: mapLegacyHighlightVerificationStatus(
                formPayload.highlightVerificationStatus,
              ),
            },
            overrideFields: {
              isFeatured: true,
              showcaseStatus: isJunior ? "Private" : "Profile Only",
            },
          }),
        ]
      : [];

    const profileWithHighlights = syncAthleteHighlightRefs(
      [
        {
          ...baseProfile,
          highlights: newHighlights.map((item) => item.id),
        },
      ],
      newHighlights,
    )[0];

    const completeness = calculateProfileCompleteness(profileWithHighlights);
    const completenessLabel = getProfileCompletenessLabel(completeness, profileWithHighlights);
    const persistenceResult = await saveManagedProfile({
      ...profileWithHighlights,
      completenessScore: completeness,
    });
    const persistedProfile = persistenceResult?.profile
      ? syncAthleteHighlightRefs([persistenceResult.profile], newHighlights)[0]
      : profileWithHighlights;
    const savedToSupabase =
      persistenceResult?.source === "supabase" && persistenceResult?.fallback !== true;

    if (mode === "submit" && !isJunior) {
      const adminQueueResult = await saveManagedAdminQueueItem(
        buildManagedAdminQueueRecord({
          queueType: "profile_review",
          title: `${persistedProfile.displayName} verification submission`,
          detail:
            "Adult profile submitted and needs admin review before visibility upgrades.",
          overrideFields: {
            relatedUserId: authUser?.id || null,
            relatedAthleteProfileId: persistedProfile.id,
            reviewReason: "Adult profile submitted for admin review.",
            sourceContext: "profile_submit",
            status: "Pending",
            queueStatus: "Pending",
            noDirectMessaging: true,
            queueData: {
              athleteDisplayName: persistedProfile.displayName,
              athleteSport: persistedProfile.sport,
              athleteState: persistedProfile.state,
              athleteRegion: persistedProfile.region,
            },
          },
        }),
      );

      if (adminQueueResult?.queues) {
        applyManagedAdminQueueResult(adminQueueResult);
      }
    }

    setAthletes((current) => upsertProfileRecord(current, persistedProfile));
    if (persistenceResult?.profiles) {
      applyManagedProfileResult(persistenceResult);
    } else {
      setOwnedProfiles((current) => upsertProfileRecord(current, persistedProfile));
    }

    if (newHighlights.length > 0) {
      for (const highlight of newHighlights) {
        const highlightResult = await saveManagedHighlight({
          ...highlight,
          athleteId: persistedProfile.id,
          sport: persistedProfile.sport,
          sportId: persistedProfile.sportId,
          sportCategory: persistedProfile.sportCategory,
          ageGroup: persistedProfile.ageGroup,
          position: persistedProfile.position,
          competition: persistedProfile.competition,
          competitionLevel: persistedProfile.competitionLevel,
          region: persistedProfile.region,
          state: persistedProfile.state,
          isJunior: persistedProfile.isJunior,
        });

        if (highlightResult?.highlights) {
          applyManagedHighlightResult(highlightResult);
        }
      }
    }

    const successMessage = savedToSupabase
      ? mode === "submit"
        ? `${baseProfile.displayName} added to your Supabase account. Status set to "${profileStatus}". Resume completeness ${completeness}% (${completenessLabel}).`
        : `${baseProfile.displayName} draft saved to your Supabase account. Resume completeness ${completeness}% (${completenessLabel}).`
      : persistenceResult?.fallback
        ? `${baseProfile.displayName} saved locally for now. ${persistenceResult.message}`
        : mode === "submit"
          ? `${baseProfile.displayName} added. Status set to "${profileStatus}". Resume completeness ${completeness}% (${completenessLabel}).`
          : `${baseProfile.displayName} draft saved on this device. Resume completeness ${completeness}% (${completenessLabel}).`;

    setMessage(successMessage);
    return {
      success: true,
      profile: persistedProfile,
      completeness,
      completenessLabel,
      storageSource: savedToSupabase ? "supabase" : "localStorage",
      fallback: Boolean(persistenceResult?.fallback),
      message: successMessage,
    };
  }

  async function requestContact(athleteId, actorRole = selectedRole) {
    const athlete = visibleAthletes.find((item) => item.id === athleteId);
    if (!athlete) {
      return { success: false };
    }

    const existing = contactRequests.find(
      (item) =>
        item.athleteId === athleteId &&
        (item.requestType || "contact_request") === "contact_request" &&
        !item.opportunityId,
    );

    if (existing) {
      setMessage("A contact request is already on file for this athlete.");
      return { success: true, duplicated: true };
    }

    const submittedAt = new Date().toISOString();
    const requestRole = ROLE_DEFINITIONS[actorRole] ? actorRole : selectedRole;
    const requestLabel = getRoleLabel(requestRole);
    const routeOwner = getContactRoute(athlete);
    const isJunior = Boolean(athlete.isJunior);
    const historyEntry = {
      id: createId("request-event"),
      actorRole: requestRole,
      actorLabel: requestLabel,
      createdAt: submittedAt,
    };
    const nextRequest = normalizeContactRequests([
      {
        id: createId("request"),
        athleteId,
        athleteProfileId: athleteId,
        athleteOwnerUserId: athlete.ownerUserId || null,
        athleteDisplayName: athlete.displayName,
        athleteIsJunior: isJunior,
        requesterName: activeAccount?.fullName || requestLabel,
        requesterEmail: activeAccount?.email || "",
        requesterRole: requestLabel,
        requesterOrganisation: activeAccount?.organisationName || "",
        organisation: activeAccount?.organisationName || "",
        to: routeOwner,
        contactRoute:
          routeOwner === "parent_guardian"
            ? "Under-18 interest routes to parent or guardian"
            : "Contact requests route to the athlete",
        requestType: "contact_request",
        requestTypeRaw: "general_contact_request",
        status: routeOwner === "parent_guardian" ? "Pending Parent/Guardian" : "Pending Review",
        safetyStatus: "Safe Pending",
        parentGuardianRequired: routeOwner === "parent_guardian",
        adminReviewRequired: true,
        noDirectMessaging: true,
        requestReason: "Request Contact button used from the athlete profile or public resume.",
        createdAt: submittedAt,
        updatedAt: submittedAt,
        count: 1,
        createdByRole: requestRole,
        createdByLabel: requestLabel,
        history: [historyEntry],
        source: "local-contact-request",
        storageSource: "localStorage",
        requestContext: {
          athleteSport: athlete.sport,
          athleteAgeGroup: athlete.ageGroup,
          athleteRegion: athlete.region,
          athleteState: athlete.state,
          action: "request_contact",
        },
      },
    ])[0];

    const persistenceResult = await saveManagedContactRequest(nextRequest);
    const savedRequest = persistenceResult?.contactRequest || nextRequest;
    const savedToSupabase =
      persistenceResult?.source === "supabase" && persistenceResult?.fallback !== true;

    if (persistenceResult?.contactRequests) {
      applyManagedContactRequestResult(persistenceResult);
    } else {
      setContactRequests((current) =>
        normalizeContactRequests([savedRequest, ...current.filter((item) => item.id !== savedRequest.id)]),
      );
    }

    const successMessage = savedToSupabase
      ? routeOwner === "parent_guardian"
        ? "Request routed to parent/guardian review."
        : "Contact request routed safely."
      : persistenceResult?.fallback
        ? "Contact request saved on this device only."
        : "Contact request saved on this device only.";

    setMessage(successMessage);
    return {
      success: true,
      request: savedRequest,
      storageSource: savedToSupabase ? "supabase" : "localStorage",
      fallback: Boolean(persistenceResult?.fallback),
      duplicated: false,
      message: successMessage,
    };
  }

  async function createOpportunity(formPayload, actorRole = selectedRole) {
    const nextOpportunity = buildOpportunityRecord(formPayload, actorRole);
    const persistenceResult = await saveManagedOpportunity(nextOpportunity);
    const savedOpportunity = persistenceResult?.opportunity || nextOpportunity;
    const savedToSupabase =
      persistenceResult?.source === "supabase" && persistenceResult?.fallback !== true;

    if (persistenceResult?.opportunities) {
      applyManagedOpportunityResult(persistenceResult);
    } else {
      setOpportunities((current) =>
        normalizeOpportunities([savedOpportunity, ...current.filter((item) => item.id !== savedOpportunity.id)]),
      );
    }

    const successMessage = savedToSupabase
      ? `Opportunity saved to your Supabase account. ${savedOpportunity.title} is set to "${savedOpportunity.verificationStatus}".`
      : persistenceResult?.fallback
        ? `Opportunity saved on this device only. ${persistenceResult.message}`
        : `Opportunity saved on this device only. ${savedOpportunity.title} is set to "${savedOpportunity.verificationStatus}".`;

    setMessage(successMessage);

    return {
      success: true,
      opportunity: savedOpportunity,
      storageSource: savedToSupabase ? "supabase" : "localStorage",
      fallback: Boolean(persistenceResult?.fallback),
      message: successMessage,
    };
  }

  async function expressInterest(opportunityId, athleteId) {
    const opportunity = visibleOpportunities.find((item) => item.id === opportunityId);
    const athlete = visibleAthletes.find((item) => item.id === athleteId);

    if (!opportunity || !athlete) {
      setMessage("Create or select a local athlete profile before expressing interest.");
      return { success: false };
    }

    const submittedAt = new Date().toISOString();
    const route = getContactRoute(athlete);
    const requestLabel = getRoleLabel(selectedRole);
    const existingInterest = contactRequests.find(
      (item) =>
        item.requestType === "opportunity_interest" &&
        item.opportunityId === opportunityId &&
        item.athleteId === athleteId,
    );

    const historyEntry = {
      id: createId("request-event"),
      actorRole: selectedRole,
      actorLabel: requestLabel,
      createdAt: submittedAt,
    };
    const baseRequest = normalizeContactRequests([
      {
        id: existingInterest?.id || createId("request"),
        athleteId,
        athleteProfileId: athleteId,
        athleteOwnerUserId: athlete.ownerUserId || null,
        athleteDisplayName: athlete.displayName,
        athleteIsJunior: athlete.isJunior,
        requesterName: activeAccount?.fullName || requestLabel,
        requesterEmail: activeAccount?.email || "",
        requesterRole: requestLabel,
        requesterOrganisation: activeAccount?.organisationName || opportunity.organisation || "",
        organisation: opportunity.organisation,
        opportunityId,
        opportunityTitle: opportunity.title,
        requestType: "opportunity_interest",
        requestTypeRaw: "opportunity_interest",
        to: route,
        contactRoute:
          route === "parent_guardian"
            ? "Under-18 interest routes to parent or guardian"
            : "Contact requests route to the athlete",
        status: route === "parent_guardian" ? "Pending Parent/Guardian" : "Pending Review",
        safetyStatus: "Safe Pending",
        parentGuardianRequired: route === "parent_guardian",
        adminReviewRequired: true,
        noDirectMessaging: true,
        requestReason: "Express Interest action used from the opportunities board.",
        createdAt: existingInterest?.createdAt || submittedAt,
        updatedAt: submittedAt,
        count: 1,
        createdByRole: selectedRole,
        createdByLabel: requestLabel,
        history: [historyEntry, ...(existingInterest?.history || [])],
        source: existingInterest?.source || "local-contact-request",
        storageSource: existingInterest?.storageSource || "localStorage",
        requestContext: {
          action: "express_interest",
          opportunityTitle: opportunity.title,
          organisation: opportunity.organisation,
          athleteSport: athlete.sport,
          athleteAgeGroup: athlete.ageGroup,
        },
      },
    ])[0];

    const persistenceResult = await saveManagedContactRequest(baseRequest);
    const savedRequest = persistenceResult?.contactRequest || baseRequest;
    const savedToSupabase =
      persistenceResult?.source === "supabase" && persistenceResult?.fallback !== true;

    if (persistenceResult?.contactRequests) {
      applyManagedContactRequestResult(persistenceResult);
    } else {
      setContactRequests((current) =>
        normalizeContactRequests([savedRequest, ...current.filter((item) => item.id !== savedRequest.id)]),
      );
    }

    return {
      success: true,
      athlete,
      opportunity,
      storageSource: savedToSupabase ? "supabase" : "localStorage",
      fallback: Boolean(persistenceResult?.fallback),
      message: athlete.isJunior
        ? savedToSupabase
          ? "Interest recorded. Request routed to parent/guardian review."
          : "Contact request saved on this device only."
        : savedToSupabase
          ? "Contact request routed safely."
          : "Contact request saved on this device only.",
    };
  }

  async function addAthleteToShortlist(athleteId, actorRole = selectedRole) {
    const athlete = visibleAthletes.find((item) => item.id === athleteId);
    if (!athlete) {
      setMessage("That athlete profile could not be found.");
      return { success: false };
    }

    if (shortlistSet.has(athleteId)) {
      setMessage(`${athlete.displayName} is already on the shortlist.`);
      return { success: true, duplicated: true };
    }

    const record = buildManagedShortlistRecord({
      athlete,
      actorRole,
      sourceContext: "manual",
      notes: "Shortlist Athlete action used from scout search, athlete profile, public resume, or opportunity detail.",
    });
    const persistenceResult = await saveManagedShortlistRecord(record);
    const savedRecord = persistenceResult?.shortlistRecord || record;
    const savedToSupabase =
      persistenceResult?.source === "supabase" && persistenceResult?.fallback !== true;

    if (persistenceResult?.shortlist) {
      applyManagedShortlistResult(persistenceResult);
    } else {
      setShortlist((current) => normalizeShortlist([savedRecord, ...current]));
    }

    const successMessage = savedToSupabase
      ? "Athlete added to your Supabase shortlist."
      : persistenceResult?.message || "Athlete shortlisted on this device only.";

    setMessage(successMessage);
    return {
      success: true,
      record: savedRecord,
      storageSource: savedToSupabase ? "supabase" : "localStorage",
      fallback: Boolean(persistenceResult?.fallback),
      duplicated: false,
      message: successMessage,
    };
  }

  async function removeAthleteFromShortlist(athleteId) {
    const shortlistRecord =
      shortlist.find((item) => item.athleteId === athleteId || item.athleteProfileId === athleteId) ||
      null;

    if (!shortlistRecord) {
      setMessage("That shortlist record could not be found.");
      return { success: false };
    }

    const result = await archiveManagedShortlistRecord(shortlistRecord.id);

    if (result?.shortlist) {
      applyManagedShortlistResult(result);
    } else if (result?.success) {
      setShortlist((current) => current.filter((item) => item.id !== shortlistRecord.id));
    }

    setMessage(result?.message || "Athlete removed from the shortlist.");
    return result;
  }

  function boostHighlight(highlightId) {
    setHighlights((current) =>
      current.map((highlight) => {
        if (highlight.id !== highlightId || highlight.isBoosted) {
          return highlight;
        }

        return {
          ...highlight,
          isBoosted: true,
          boostCount: highlight.boostCount + 1,
          updatedAt: new Date().toISOString(),
          statusLabel: getHighlightStatusLabel({
            ...highlight,
            boostCount: highlight.boostCount + 1,
          }),
        };
      }),
    );
  }

  function findMatchingSupabaseAthleteProfile(profile) {
    if (!profile) {
      return null;
    }

    return (
      visibleAthletes.find(
        (item) =>
          item?.storageSource === "supabase" &&
          (!authUser?.id || item?.ownerUserId === authUser.id) &&
          normalizeText(item?.displayName) === normalizeText(profile?.displayName) &&
          normalizeText(item?.sportId || item?.sport) ===
            normalizeText(profile?.sportId || profile?.sport) &&
          normalizeText(item?.ageGroup) === normalizeText(profile?.ageGroup) &&
          normalizeText(item?.state) === normalizeText(profile?.state) &&
          normalizeText(item?.region) === normalizeText(profile?.region),
      ) || null
    );
  }

  async function ensureSupabaseAthleteProfileRecord(profile) {
    if (!profile) {
      return {
        success: false,
        profile: null,
        source: "localStorage",
        fallback: true,
        message:
          "Athlete profile save error: select or create an athlete profile before uploading a private thumbnail.",
      };
    }

    if (
      normalizeText(profile?.storageSource || "").includes("supabase") ||
      normalizeText(profile?.source || "").includes("supabase")
    ) {
      return {
        success: true,
        profile,
        source: "supabase",
        fallback: false,
        created: false,
        message: "Supabase-backed athlete profile is ready.",
      };
    }

    const existingSupabaseProfile = findMatchingSupabaseAthleteProfile(profile);
    if (existingSupabaseProfile) {
      return {
        success: true,
        profile: existingSupabaseProfile,
        source: "supabase",
        fallback: false,
        created: false,
        message: "Supabase-backed athlete profile found.",
      };
    }

    const profileWithHighlights = syncAthleteHighlightRefs([profile], visibleHighlights)[0];
    const completenessScore = calculateProfileCompleteness(profileWithHighlights);
    const persistenceResult = await saveManagedProfile({
      ...profileWithHighlights,
      completenessScore,
    });
    const savedProfile = persistenceResult?.profile || profileWithHighlights;
    const savedToSupabase =
      persistenceResult?.source === "supabase" && persistenceResult?.fallback !== true;

    setAthletes((current) => upsertProfileRecord(current, savedProfile));
    if (persistenceResult?.profiles) {
      applyManagedProfileResult(persistenceResult);
    } else {
      setOwnedProfiles((current) => upsertProfileRecord(current, savedProfile));
    }

    if (!savedToSupabase) {
      return {
        success: false,
        profile: savedProfile,
        source: persistenceResult?.source || "localStorage",
        fallback: Boolean(persistenceResult?.fallback),
        message:
          persistenceResult?.message ||
          "Athlete profile save error: the athlete profile could not be saved to your Supabase account.",
      };
    }

    return {
      success: true,
      profile: savedProfile,
      source: "supabase",
      fallback: false,
      created: true,
      message: "Supabase-backed athlete profile saved and ready.",
    };
  }

  async function saveHighlightRecord(formPayload) {
    const forceSupabaseForThumbnail = Boolean(formPayload?.forceSupabaseForThumbnail);
    let athlete = visibleAthletes.find((item) => item.id === formPayload.athleteId);

    if (!athlete) {
      setMessage("Select an athlete profile before saving a highlight.");
      return { success: false };
    }

    if (forceSupabaseForThumbnail) {
      const profileResult = await ensureSupabaseAthleteProfileRecord(athlete);

      if (!profileResult?.success || !profileResult?.profile) {
        const message =
          profileResult?.message ||
          "Athlete profile save error: create or resave a Supabase-backed athlete profile first before uploading a private thumbnail.";
        setMessage(message);
        return {
          success: false,
          highlight: null,
          athlete: profileResult?.profile || athlete,
          source: profileResult?.source || "localStorage",
          storageSource: profileResult?.source || "localStorage",
          fallback: profileResult?.fallback !== false,
          errorCategory: "athlete_profile_error",
          errorStage: "profile_save",
          message,
        };
      }

      athlete = profileResult.profile;
    }

    const existingHighlight = formPayload.id
      ? visibleHighlights.find((item) => item.id === formPayload.id)
      : null;

    const nextHighlight = buildManagedHighlightRecord({
      athlete,
      formPayload,
      existingHighlight,
      overrideFields: {
        isFeatured:
          existingHighlight?.isFeatured ||
          !visibleHighlights.some((item) => item.athleteId === athlete.id),
      },
    });

    if (nextHighlight.isFeatured) {
      const currentlyFeatured = visibleHighlights.filter(
        (item) =>
          item.athleteId === athlete.id &&
          item.id !== nextHighlight.id &&
          item.isFeatured,
      );

      for (const highlight of currentlyFeatured) {
        const featureReset = normalizeHighlights([
          {
            ...highlight,
            isFeatured: false,
            updatedAt: new Date().toISOString(),
          },
        ])[0];

        const resetResult = await saveManagedHighlight(featureReset);
        if (resetResult?.highlights) {
          applyManagedHighlightResult(resetResult);
        }
      }
    }

    const result = await saveManagedHighlight(nextHighlight);
    if (!result?.success) {
      setMessage(result?.message || "The highlight could not be saved right now.");
      return { success: false, highlight: null, athlete };
    }

    if (result?.highlights) {
      applyManagedHighlightResult(result);
    }

    const savedHighlight = result?.highlight || nextHighlight;
    const savedToSupabase =
      result?.source === "supabase" && result?.fallback !== true;
    const statusMessage = forceSupabaseForThumbnail
      ? savedToSupabase
        ? "Highlight saved to your Supabase account and is ready for private thumbnail upload."
        : `Highlight save error: ${
            result?.message ||
            "the highlight could not be saved to your Supabase account before the private thumbnail upload."
          }`
      : savedToSupabase
        ? `Highlight saved to your Supabase account. ${getHighlightShowcaseLabel(savedHighlight)} / ${getHighlightVerificationLabel(savedHighlight)}.`
        : `Highlight saved on this device only. ${getHighlightShowcaseLabel(savedHighlight)} / ${getHighlightVerificationLabel(savedHighlight)}.`;

    setMessage(statusMessage);

    return {
      success: true,
      highlight: savedHighlight,
      athlete,
      source: savedToSupabase ? "supabase" : "localStorage",
      storageSource: savedToSupabase ? "supabase" : "localStorage",
      fallback: Boolean(result?.fallback),
      message: statusMessage,
    };
  }

  async function deleteHighlightRecord(highlightId) {
    const target = visibleHighlights.find((item) => item.id === highlightId);
    if (!target) {
      setMessage("Highlight not found.");
      return { success: false };
    }

    const result = await deleteManagedHighlight(highlightId);
    if (!result?.success) {
      setMessage(result?.message || "The highlight could not be removed right now.");
      return { success: false };
    }

    if (result?.highlights) {
      applyManagedHighlightResult(result);
    }

    if (target.isFeatured) {
      const remainingHighlights = (result?.highlights || []).filter(
        (item) => item.athleteId === target.athleteId,
      );
      const nextFeatured = sortHighlightsByPriority(remainingHighlights)[0] || null;

      if (nextFeatured && !nextFeatured.isFeatured) {
        const featureResult = await saveManagedHighlight(
          normalizeHighlights([
            {
              ...nextFeatured,
              isFeatured: true,
              updatedAt: new Date().toISOString(),
            },
          ])[0],
        );

        if (featureResult?.highlights) {
          applyManagedHighlightResult(featureResult);
        }
      }
    }

    const removedFromSupabase =
      result?.source === "supabase" && result?.fallback !== true;
    const statusMessage = removedFromSupabase
      ? "Highlight removed from your Supabase account."
      : "Highlight removed from the profile media library.";
    setMessage(statusMessage);

    return { success: true, message: statusMessage };
  }

  async function markHighlightFeatured(highlightId) {
    const target = visibleHighlights.find((item) => item.id === highlightId);
    if (!target) {
      setMessage("Highlight not found.");
      return { success: false };
    }

    const sameAthleteHighlights = visibleHighlights.filter(
      (item) => item.athleteId === target.athleteId,
    );
    let lastResult = null;

    for (const highlight of sameAthleteHighlights) {
      const nextHighlight = normalizeHighlights([
        {
          ...highlight,
          isFeatured: highlight.id === highlightId,
          updatedAt: highlight.id === highlightId ? new Date().toISOString() : highlight.updatedAt,
        },
      ])[0];

      const saveResult = await saveManagedHighlight(nextHighlight);
      if (saveResult?.highlights) {
        applyManagedHighlightResult(saveResult);
      }
      lastResult = saveResult;
    }

    const savedToSupabase =
      lastResult?.source === "supabase" && lastResult?.fallback !== true;
    const statusMessage = savedToSupabase
      ? "Featured highlight updated in your Supabase account."
      : "Featured highlight updated for this sports resume.";
    setMessage(statusMessage);

    return { success: true, message: statusMessage };
  }

  function setHighlightShowcaseStatus(highlightId, showcaseStatus) {
    setHighlights((current) =>
      current.map((highlight) => {
        if (highlight.id !== highlightId) {
          return highlight;
        }

        const nextStatus =
          highlight.isJunior &&
          showcaseStatus === "Showcase Approved" &&
          !isHighlightParentApproved(highlight)
            ? "Showcase Requested"
            : showcaseStatus;

        return normalizeHighlights([
          {
            ...highlight,
            showcaseStatus: nextStatus,
            updatedAt: new Date().toISOString(),
          },
        ])[0];
      }),
    );
  }

  function updateOwnedAndLocalProfiles(updateProfiles) {
    setAthletes((current) => updateProfiles(current));
    setOwnedProfiles((current) => updateProfiles(current));
  }

  function updateProfileVisibility(profileId, visibility) {
    updateOwnedAndLocalProfiles((current) =>
      current.map((profile) =>
        profile.id === profileId ? { ...profile, visibilityStatus: visibility } : profile,
      ),
    );
  }

  function approveProfile(profileId) {
    updateOwnedAndLocalProfiles((current) =>
      current.map((profile) =>
        profile.id === profileId
          ? {
              ...profile,
              profileStatus: "Profile Approved by Parent",
              verificationBadges: Array.from(
                new Set([...profile.verificationBadges, "Parent Approved"]),
              ),
            }
          : profile,
      ),
    );
  }

  function keepProfilePrivate(profileId) {
    updateProfileVisibility(profileId, "Private");
    updateOwnedAndLocalProfiles((current) =>
      current.map((profile) =>
        profile.id === profileId
          ? {
              ...profile,
              profileStatus:
                profile.profileStatus === "Pending Parent Approval"
                  ? "Private - Awaiting Parent Approval"
                  : profile.profileStatus,
            }
          : profile,
      ),
    );
  }

  function approveHighlight(highlightId) {
    setHighlights((current) =>
      current.map((highlight) => {
        if (highlight.id !== highlightId) {
          return highlight;
        }

        return normalizeHighlights([
          {
            ...highlight,
            approvalStatus: highlight.isJunior ? "Parent Approved" : "Admin Approved",
            verificationSource: highlight.isJunior ? "Parent" : "Admin",
            showcaseStatus:
              highlight.showcaseStatus === "Private" ? "Profile Only" : highlight.showcaseStatus,
            updatedAt: new Date().toISOString(),
          },
        ])[0];
      }),
    );
  }

  function keepHighlightPrivate(highlightId) {
    setHighlightShowcaseStatus(highlightId, "Private");
  }

  function requestHighlightChanges(highlightId) {
    setHighlights((current) =>
      current.map((highlight) =>
        highlight.id === highlightId
          ? normalizeHighlights([
              {
                ...highlight,
                approvalStatus: "Request Changes",
                showcaseStatus: "Private",
                updatedAt: new Date().toISOString(),
              },
            ])[0]
          : highlight,
      ),
    );
  }

  async function reviewHighlightByAdmin(highlightId, action) {
    const existingQueueItem =
      adminQueues.pendingHighlights.find((item) => item.highlightId === highlightId) || null;
    const currentHighlight = highlights.find((highlight) => highlight.id === highlightId) || null;
    const currentAthlete =
      athletes.find((athlete) => athlete.id === (currentHighlight?.athleteId || existingQueueItem?.athleteId)) ||
      null;

    setHighlights((current) =>
      current.map((highlight) => {
        if (highlight.id !== highlightId) {
          return highlight;
        }

        let approvalStatus = highlight.approvalStatus;
        let showcaseStatus = highlight.showcaseStatus;
        let verificationSource = highlight.verificationSource;

        if (action === "Approve") {
          approvalStatus = "Admin Approved";
          verificationSource = "Admin";
          if (showcaseStatus === "Showcase Requested") {
            showcaseStatus = "Showcase Approved";
          } else if (showcaseStatus === "Private") {
            showcaseStatus = "Profile Only";
          }
        }

        if (action === "Reject") {
          approvalStatus = "Rejected";
          showcaseStatus = "Private";
        }

        if (action === "Mark Reviewed") {
          approvalStatus = "Admin Reviewed";
          verificationSource = verificationSource === "Unverified" ? "Admin" : verificationSource;
          if (showcaseStatus === "Private") {
            showcaseStatus = "Profile Only";
          }
        }

        if (action === "Approve for Showcase") {
          approvalStatus = "Admin Approved";
          verificationSource = "Admin";
          showcaseStatus = "Showcase Approved";
        }

        if (action === "Keep Profile Only") {
          approvalStatus =
            approvalStatus === "Pending Admin Review" ? "Admin Reviewed" : approvalStatus;
          verificationSource = verificationSource === "Unverified" ? "Admin" : verificationSource;
          showcaseStatus = "Profile Only";
        }

        return normalizeHighlights([
          {
            ...highlight,
            approvalStatus,
            verificationSource,
            showcaseStatus,
            updatedAt: new Date().toISOString(),
          },
        ])[0];
      }),
    );

    const queueEntry =
      existingQueueItem ||
      (currentHighlight
        ? buildAdminHighlightQueueEntry(currentHighlight, currentAthlete, null)
        : null);

    if (queueEntry) {
      const persistenceResult =
        existingQueueItem && existingQueueItem.storageSource === "supabase"
          ? await updateManagedAdminQueueItem(
              existingQueueItem.id,
              buildManagedAdminQueueRecord({
                queueType: "highlight_review",
                existingItem: existingQueueItem,
                overrideFields: {
                  relatedAthleteProfileId:
                    currentAthlete?.id || currentHighlight?.athleteId || existingQueueItem?.athleteId || "",
                  relatedHighlightId: highlightId,
                  reviewReason: `Highlight review action: ${action}.`,
                  sourceContext: "highlight_admin_review",
                  status: getAdminQueueStatusFromAction(action),
                  queueStatus: getAdminQueueStatusFromAction(action),
                  adminDecision: getAdminQueueDecisionFromAction(action),
                  reviewedAt: new Date().toISOString(),
                  adminDecisionAt: new Date().toISOString(),
                  noDirectMessaging: true,
                },
              }),
            )
          : await saveManagedAdminQueueItem(
              buildManagedAdminQueueRecord({
                queueType: "highlight_review",
                title: queueEntry.title,
                detail: queueEntry.detail,
                existingItem: queueEntry,
                overrideFields: {
                  relatedAthleteProfileId:
                    currentAthlete?.id || currentHighlight?.athleteId || queueEntry?.athleteId || "",
                  relatedHighlightId: highlightId,
                  reviewReason: `Highlight review action: ${action}.`,
                  sourceContext: "highlight_admin_review",
                  status: getAdminQueueStatusFromAction(action),
                  queueStatus: getAdminQueueStatusFromAction(action),
                  adminDecision: getAdminQueueDecisionFromAction(action),
                  reviewedAt: new Date().toISOString(),
                  adminDecisionAt: new Date().toISOString(),
                  noDirectMessaging: true,
                },
              }),
            );

      if (persistenceResult?.queues) {
        applyManagedAdminQueueResult(persistenceResult);
      }
    }
  }

  async function reviewOpportunityByAdmin(opportunityId, action) {
    const existingQueueItem =
      adminQueues.pendingOpportunities.find((item) => item.opportunityId === opportunityId) || null;
    const currentOpportunity =
      opportunities.find((opportunity) => opportunity.id === opportunityId) || null;

    setOpportunities((current) =>
      current.map((opportunity) => {
        if (opportunity.id !== opportunityId) {
          return opportunity;
        }

        let verificationStatus = opportunity.verificationStatus;

        if (action === "Approve") {
          verificationStatus = "Verified organisation";
        }

        if (action === "Reject") {
          verificationStatus = "Rejected";
        }

        if (action === "Mark Reviewed") {
          verificationStatus = "Admin Reviewed";
        }

        return {
          ...opportunity,
          verificationStatus,
        };
      }),
    );

    const queueEntry =
      existingQueueItem ||
      (currentOpportunity
        ? buildAdminOpportunityQueueEntry(currentOpportunity, null)
        : null);

    if (queueEntry) {
      const persistenceResult =
        existingQueueItem && existingQueueItem.storageSource === "supabase"
          ? await updateManagedAdminQueueItem(
              existingQueueItem.id,
              buildManagedAdminQueueRecord({
                queueType: "opportunity_review",
                existingItem: existingQueueItem,
                overrideFields: {
                  relatedOpportunityId: opportunityId,
                  reviewReason: `Opportunity review action: ${action}.`,
                  sourceContext: "opportunity_admin_review",
                  status: getAdminQueueStatusFromAction(action),
                  queueStatus: getAdminQueueStatusFromAction(action),
                  adminDecision: getAdminQueueDecisionFromAction(action),
                  reviewedAt: new Date().toISOString(),
                  adminDecisionAt: new Date().toISOString(),
                  noDirectMessaging: true,
                },
              }),
            )
          : await saveManagedAdminQueueItem(
              buildManagedAdminQueueRecord({
                queueType: "opportunity_review",
                title: queueEntry.title,
                detail: queueEntry.detail,
                existingItem: queueEntry,
                overrideFields: {
                  relatedOpportunityId: opportunityId,
                  reviewReason: `Opportunity review action: ${action}.`,
                  sourceContext: "opportunity_admin_review",
                  status: getAdminQueueStatusFromAction(action),
                  queueStatus: getAdminQueueStatusFromAction(action),
                  adminDecision: getAdminQueueDecisionFromAction(action),
                  reviewedAt: new Date().toISOString(),
                  adminDecisionAt: new Date().toISOString(),
                  noDirectMessaging: true,
                },
              }),
            );

      if (persistenceResult?.queues) {
        applyManagedAdminQueueResult(persistenceResult);
      }
    }
  }

  async function resolveAdminQueue(queueName, itemId, status) {
    const queueEntry = adminQueues[queueName]?.find((item) => item.id === itemId) || null;

    if (queueEntry) {
      const persistenceResult = await updateManagedAdminQueueItem(
        itemId,
        buildManagedAdminQueueRecord({
          queueType: getAdminQueueTypeFromQueueName(queueName),
          existingItem: queueEntry,
          overrideFields: {
            status: getAdminQueueStatusFromAction(status),
            queueStatus: getAdminQueueStatusFromAction(status),
            adminDecision: getAdminQueueDecisionFromAction(status),
            reviewedAt: new Date().toISOString(),
            adminDecisionAt: new Date().toISOString(),
            noDirectMessaging: true,
          },
        }),
      );

      if (persistenceResult?.queues) {
        applyManagedAdminQueueResult(persistenceResult);
      }
    }

    if (status === "Approve" && queueName === "pendingProfiles") {
      const queueEntry = adminQueues[queueName].find((item) => item.id === itemId);
      if (queueEntry?.athleteId) {
        updateOwnedAndLocalProfiles((current) =>
          current.map((profile) =>
            profile.id === queueEntry.athleteId
              ? { ...profile, profileStatus: "Showcase Approved" }
              : profile,
          ),
        );
      }
    }

    if (status === "Approve" && queueName === "pendingHighlights") {
      const queueEntry = adminQueues[queueName].find((item) => item.id === itemId);
      if (queueEntry?.highlightId) {
        reviewHighlightByAdmin(queueEntry.highlightId, "Approve");
      }
    }

    if (
      ["Approve", "Reject", "Mark Reviewed"].includes(status) &&
      queueName === "pendingOpportunities"
    ) {
      const queueEntry = adminQueues[queueName].find((item) => item.id === itemId);
      if (queueEntry?.opportunityId) {
        reviewOpportunityByAdmin(queueEntry.opportunityId, status);
      }
    }
  }

  async function submitVerificationRequest(formPayload) {
    const submittedAt = new Date().toISOString();
    const sportText = formPayload.sports || "Sport not provided";
    const locationText = joinMeta([formPayload.region, formPayload.state]) || "Location not provided";
    const persistenceResult = await saveManagedAdminQueueItem(
      buildManagedAdminQueueRecord({
        queueType: "club_scout_verification",
        title: `${formPayload.organisationName || "Organisation"} verification request`,
        detail: `${formPayload.contactName || "Contact"} / ${formPayload.roleTitle || "Role not provided"} / ${formPayload.purpose || "Purpose not provided"} / ${sportText} / ${locationText} / ${formPayload.email || "Email placeholder only"}`,
        overrideFields: {
          relatedUserId: authUser?.id || null,
          reviewReason: "Organisation verification request submitted for admin review.",
          sourceContext: "verification_request_form",
          status: "Pending",
          queueStatus: "Pending",
          noDirectMessaging: true,
          source: "verification-request-form",
          queueData: {
            organisationName: formPayload.organisationName,
            contactName: formPayload.contactName,
            roleTitle: formPayload.roleTitle,
            sports: formPayload.sports,
            state: formPayload.state,
            region: formPayload.region,
            email: formPayload.email,
            purpose: formPayload.purpose,
            createdAt: submittedAt,
          },
          createdAt: submittedAt,
          updatedAt: submittedAt,
        },
      }),
    );

    if (persistenceResult?.queues) {
      applyManagedAdminQueueResult(persistenceResult);
    }

    const successMessage =
      persistenceResult?.source === "supabase" && persistenceResult?.fallback !== true
        ? "Verification request saved to your Supabase account."
        : persistenceResult?.message ||
          `${formPayload.organisationName || "Organisation"} verification request added to the admin queue.`;

    setMessage(successMessage);

    return { success: true, message: successMessage };
  }

  async function resetDemoData() {
    removeLocalData(STORAGE_KEYS.athletes);
    removeLocalData(STORAGE_KEYS.highlights);
    removeLocalData(STORAGE_KEYS.requests);
    removeLocalData(STORAGE_KEYS.adminQueues);
    removeLocalData(STORAGE_KEYS.mediaAssets);
    removeLocalData(STORAGE_KEYS.opportunities);
    removeLocalData(STORAGE_KEYS.shortlist);

    setAthletes(clone(sampleAthletes));
    setHighlights(clone(sampleHighlights));
    setOpportunities(normalizeOpportunities(clone(opportunitySeed)));
    setShortlist([]);
    setContactRequests([]);
    setAdminQueues(normalizeAdminQueues(adminSeed));
    await refreshManagedProfiles();
    await refreshManagedHighlights();
    await refreshManagedOpportunities();
    await refreshManagedShortlist();
    await refreshManagedContactRequests();
    await refreshManagedAdminQueues();
    await refreshManagedMediaAssets();
    setMessage("Demo data reset and reloaded from the local sample set.");
  }

  const featuredAthlete =
    getLatestRoleProfile(pilotAthletes, selectedRole, true) ||
    getLatestRoleProfile(pilotAthletes, selectedRole) ||
    pilotAthletes[0] ||
    null;
  const headerAlertCount = roleRequestRows.length;

  const accountNavLabel = activeAccount ? "Account" : "Login";
  const accountNavTo = activeAccount ? "/account" : "/login";

  return (
    <div className="shell">
      <div className="shell-glow shell-glow-left" />
      <div className="shell-glow shell-glow-right" />

      <header className="site-header">
        <div className="nav-shell">
          <Link className="brand-lockup" to="/">
            <span className="brand-mark" aria-hidden="true">
              <img src={mySportsResumeApprovedLogo} alt="" />
            </span>
            <div className="brand-copy">
              <span className="brand-kicker">Premium sports resume platform</span>
              <h1 className="brand-title">MY SPORTS RESUME</h1>
              <p className="brand-note">The sports resume for talent that deserves to be seen.</p>
            </div>
          </Link>

          <nav className="desktop-nav" aria-label="Primary">
            {desktopNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="desktop-nav-actions">
            <Link className="header-utility-pill" to="/requests">
              <span className="header-utility-label">Requests</span>
              <strong>{headerAlertCount}</strong>
            </Link>
            <span className="role-chip">{headerRoleLabel}</span>
            <Link className="button button-secondary desktop-nav-account" to={accountNavTo}>
              {accountNavLabel}
            </Link>
          </div>
        </div>
      </header>

      <main className="page-shell">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                featuredAthlete={featuredAthlete}
                athletes={pilotAthletes}
                highlights={pilotHighlights}
                verifiedPartners={sampleVerifiedAccounts}
                selectedRole={selectedRole}
                contactRequests={contactRequests}
                adminQueues={adminQueues}
                requestRows={roleRequestRows}
                onSelectRole={selectRole}
              />
            }
          />
          <Route
            path="/start"
            element={
              <RoleSelectionPage
                selectedRole={selectedRole}
                onSelectRole={selectRole}
                realAuthEnabled={realAuthEnabled}
              />
            }
          />
          <Route
            path="/login"
            element={
              <LoginPage
                account={activeAccount}
                onLogin={loginToAccount}
                realAuthEnabled={realAuthEnabled}
                statusMessage={message}
              />
            }
          />
          <Route
            path="/create-account"
            element={
              <CreateAccountPage
                account={activeAccount}
                onCreateAccount={createAccountRecord}
                realAuthEnabled={realAuthEnabled}
                statusMessage={message}
              />
            }
          />
          <Route
            path="/account-setup"
            element={
              <AccountSetupPage
                account={activeAccount}
                selectedRole={selectedRole}
                realAuthEnabled={realAuthEnabled}
                statusMessage={message}
              />
            }
          />
          <Route
            path="/account"
            element={
              <AccountPage
                account={activeAccount}
                selectedRole={selectedRole}
                ownedProfiles={ownedProfiles}
                mediaAssets={mediaAssets}
                mediaPreviewUrls={mediaPreviewUrls}
                backendStatus={backendStatus}
                realAuthEnabled={realAuthEnabled}
                profileBackendTestState={profileBackendTestState}
                highlightBackendTestState={highlightBackendTestState}
                opportunityBackendTestState={opportunityBackendTestState}
                shortlistBackendTestState={shortlistBackendTestState}
                contactRequestBackendTestState={contactRequestBackendTestState}
                adminQueueBackendTestState={adminQueueBackendTestState}
                mediaBackendTestState={mediaBackendTestState}
                storageBackendTestState={storageBackendTestState}
                privateVideoStorageTestState={privateVideoStorageTestState}
                fullHighlightThumbnailTestState={fullHighlightThumbnailTestState}
                mediaApprovalTestState={mediaApprovalTestState}
                onSelectRole={selectRole}
                onLogout={logoutAccount}
                onRunProfileBackendTest={runSupabaseProfileTest}
                onDeleteProfileBackendTest={deleteSupabaseProfileTest}
                onRunHighlightBackendTest={runSupabaseHighlightTest}
                onDeleteHighlightBackendTest={deleteSupabaseHighlightTest}
                onRunOpportunityBackendTest={runSupabaseOpportunityTest}
                onDeleteOpportunityBackendTest={deleteSupabaseOpportunityTest}
                onRunShortlistBackendTest={runSupabaseShortlistTest}
                onDeleteShortlistBackendTest={deleteSupabaseShortlistTest}
                onRunContactRequestBackendTest={runSupabaseContactRequestTest}
                onDeleteContactRequestBackendTest={deleteSupabaseContactRequestTest}
                onRunAdminQueueBackendTest={runSupabaseAdminQueueTest}
                onDeleteAdminQueueBackendTest={deleteSupabaseAdminQueueTest}
                onRunMediaBackendTest={runSupabaseMediaMetadataTest}
                onDeleteMediaBackendTest={deleteSupabaseMediaMetadataTest}
                onUploadProfilePhoto={uploadPrivateProfilePhoto}
                onDeleteStoredMediaAsset={deleteStoredMediaAssetRecord}
                onCreateSignedMediaUrl={loadPrivateSignedMediaUrl}
                onRunStorageBackendTest={runSupabaseStorageTest}
                onDeleteStorageBackendTest={deleteSupabaseStorageTestAsset}
                onRunPrivateVideoStorageTest={runPrivateVideoStorageTest}
                onDeletePrivateVideoStorageTest={deletePrivateVideoStorageTestAsset}
                onRunFullHighlightThumbnailTest={runFullSupabaseHighlightThumbnailTest}
                onRunMediaApprovalTest={runSupabaseMediaApprovalTest}
                onDeleteMediaApprovalTest={deleteSupabaseMediaApprovalTest}
                onReset={resetDemoData}
              />
            }
          />
          <Route
            path="/qa/media-approval"
            element={
              <MediaApprovalQAPage
                backendStatus={backendStatus}
                testState={mediaApprovalTestState}
                onDelete={deleteSupabaseMediaApprovalTest}
                onRunTest={runSupabaseMediaApprovalTest}
              />
            }
          />
          <Route
            path="/athlete/:athleteId"
            element={
              <AthleteProfilePage
                athletes={pilotAthletes}
                highlights={pilotHighlights}
                mediaAssets={pilotMediaAssets}
                mediaPreviewUrls={mediaPreviewUrls}
                currentUserId={authUser?.id || ""}
                selectedRole={selectedRole}
                shortlistSet={shortlistSet}
                contactMap={requestMap}
                onRequestContact={requestContact}
                onShortlistAthlete={addAthleteToShortlist}
              />
            }
          />
          <Route
            path="/resume/:athleteId"
            element={
              <PublicResumePage
                athletes={pilotAthletes}
                highlights={pilotHighlights}
                mediaAssets={pilotMediaAssets}
                mediaPreviewUrls={mediaPreviewUrls}
                currentUserId={authUser?.id || ""}
                contactMap={requestMap}
                onRequestContact={requestContact}
              />
            }
          />
          <Route
            path="/my-profile"
            element={
              <RoleDashboardPage
                selectedRole={selectedRole}
                athlete={featuredAthlete}
                athletes={pilotAthletes}
                highlights={pilotHighlights}
                mediaAssets={pilotMediaAssets}
                mediaPreviewUrls={mediaPreviewUrls}
                currentUserId={authUser?.id || ""}
                opportunities={pilotOpportunities}
                shortlist={shortlist}
                contactRequests={contactRequests}
                requestMap={requestMap}
                requestRows={roleRequestRows}
                queues={adminQueues}
                onRequestContact={requestContact}
                onRemoveShortlist={removeAthleteFromShortlist}
                onReset={resetDemoData}
              />
            }
          />
          <Route
            path="/create-profile"
            element={
              <CreateProfilePage
                onSaveProfile={saveProfile}
                selectedRole={selectedRole}
                statusMessage={message}
              />
            }
          />
          <Route
            path="/opportunities"
            element={
              <OpportunitiesBoardPage
                opportunities={pilotOpportunities}
                athletes={pilotAthletes}
                selectedRole={selectedRole}
                opportunityBackendStatus={opportunityBackendStatus}
                onCreateOpportunity={createOpportunity}
                onExpressInterest={expressInterest}
              />
            }
          />
          <Route
            path="/opportunities/:opportunityId"
            element={
              <OpportunityDetailPage
                opportunities={pilotOpportunities}
                athletes={pilotAthletes}
                selectedRole={selectedRole}
                shortlistSet={shortlistSet}
                onExpressInterest={expressInterest}
                onShortlistAthlete={addAthleteToShortlist}
              />
            }
          />
          <Route
            path="/highlight-manager"
            element={
              <HighlightManagerPage
                athletes={pilotAthletes}
                highlights={pilotHighlights}
                mediaAssets={pilotMediaAssets}
                backendStatus={backendStatus}
                selectedRole={selectedRole}
                onSaveHighlight={saveHighlightRecord}
                onDeleteHighlight={deleteHighlightRecord}
                onFeatureHighlight={markHighlightFeatured}
                onUploadHighlightThumbnail={uploadPrivateHighlightThumbnail}
                onRunBuiltInPrivateVideoTest={runBuiltInPrivateVideoTest}
                onDeleteStoredMediaAsset={deleteStoredMediaAssetRecord}
                onCreateSignedMediaUrl={loadPrivateSignedMediaUrl}
                onUploadHighlightVideo={uploadPrivateHighlightVideo}
                onDeleteStoredHighlightVideo={deleteStoredHighlightVideoRecord}
                onCreateSignedVideoUrl={loadPrivateSignedVideoUrl}
                fullHighlightThumbnailTestState={fullHighlightThumbnailTestState}
                onRunFullHighlightThumbnailTest={runFullSupabaseHighlightThumbnailTest}
              />
            }
          />
          <Route
            path="/highlights"
            element={
              <HighlightShowcasePage
                athletes={pilotAthletes}
                highlights={pilotHighlights}
                onBoost={boostHighlight}
              />
            }
          />
          <Route
            path="/search"
            element={
              <ScoutSearchPage
                athletes={pilotAthletes}
                onRequestContact={requestContact}
                requestMap={requestMap}
                selectedRole={selectedRole}
                shortlistSet={shortlistSet}
                onShortlistAthlete={addAthleteToShortlist}
              />
            }
          />
          <Route
            path="/shortlist"
            element={
              <ShortlistPage
                shortlist={shortlist}
                athletes={pilotAthletes}
                requestMap={requestMap}
                onRequestContact={requestContact}
                onRemove={removeAthleteFromShortlist}
                selectedRole={selectedRole}
              />
            }
          />
          <Route
            path="/requests"
            element={
              <ContactRequestHistoryPage
                selectedRole={selectedRole}
                athletes={pilotAthletes}
                opportunities={pilotOpportunities}
                requestRows={roleRequestRows}
              />
            }
          />
          <Route
            path="/verification-request"
            element={
              <ClubVerificationRequestPage
                onSubmitVerificationRequest={submitVerificationRequest}
                selectedRole={selectedRole}
                statusMessage={message}
              />
            }
          />
          <Route
            path="/directory"
            element={<SportsDirectoryPage athletes={pilotAthletes} selectedRole={selectedRole} />}
          />
          <Route path="/scout-search" element={<Navigate to="/search" replace />} />
          <Route
            path="/parent"
            element={
              <ParentDashboardPage
                athletes={pilotAthletes}
                highlights={pilotHighlights}
                mediaAssets={pilotMediaAssets}
                currentUserId={authUser?.id || ""}
                parentAccounts={sampleParentAccounts}
                onApproveProfile={approveProfile}
                onKeepProfilePrivate={keepProfilePrivate}
                onApproveHighlight={approveHighlight}
                onKeepHighlightPrivate={keepHighlightPrivate}
                onRequestHighlightChanges={requestHighlightChanges}
                onSetHighlightShowcaseStatus={setHighlightShowcaseStatus}
                onSetVisibility={updateProfileVisibility}
                opportunities={pilotOpportunities}
                contactRequests={contactRequests}
                requestMap={requestMap}
                onApproveMediaAsset={approveMediaAssetByParent}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <AdminDashboardPage
                queues={adminQueues}
                athletes={visibleAthletes}
                highlights={visibleHighlights}
                opportunities={visibleOpportunities}
                shortlist={shortlist}
                contactRequests={contactRequests}
                mediaAssets={mediaAssets}
                currentUserId={authUser?.id || ""}
                backendStatus={backendStatus}
                profileBackendTestState={profileBackendTestState}
                highlightBackendTestState={highlightBackendTestState}
                opportunityBackendTestState={opportunityBackendTestState}
                shortlistBackendTestState={shortlistBackendTestState}
                contactRequestBackendTestState={contactRequestBackendTestState}
                adminQueueBackendTestState={adminQueueBackendTestState}
                mediaBackendTestState={mediaBackendTestState}
                storageBackendTestState={storageBackendTestState}
                privateVideoStorageTestState={privateVideoStorageTestState}
                fullHighlightThumbnailTestState={fullHighlightThumbnailTestState}
                mediaApprovalTestState={mediaApprovalTestState}
                onDecision={resolveAdminQueue}
                onReviewHighlight={reviewHighlightByAdmin}
                onReviewMediaAsset={reviewMediaAssetByAdmin}
                onRunProfileBackendTest={runSupabaseProfileTest}
                onDeleteProfileBackendTest={deleteSupabaseProfileTest}
                onRunHighlightBackendTest={runSupabaseHighlightTest}
                onDeleteHighlightBackendTest={deleteSupabaseHighlightTest}
                onRunOpportunityBackendTest={runSupabaseOpportunityTest}
                onDeleteOpportunityBackendTest={deleteSupabaseOpportunityTest}
                onRunShortlistBackendTest={runSupabaseShortlistTest}
                onDeleteShortlistBackendTest={deleteSupabaseShortlistTest}
                onRunContactRequestBackendTest={runSupabaseContactRequestTest}
                onDeleteContactRequestBackendTest={deleteSupabaseContactRequestTest}
                onRunAdminQueueBackendTest={runSupabaseAdminQueueTest}
                onDeleteAdminQueueBackendTest={deleteSupabaseAdminQueueTest}
                onRunMediaBackendTest={runSupabaseMediaMetadataTest}
                onDeleteMediaBackendTest={deleteSupabaseMediaMetadataTest}
                onRunStorageBackendTest={runSupabaseStorageTest}
                onDeleteStorageBackendTest={deleteSupabaseStorageTestAsset}
                onRunPrivateVideoStorageTest={runPrivateVideoStorageTest}
                onDeletePrivateVideoStorageTest={deletePrivateVideoStorageTestAsset}
                onRunFullHighlightThumbnailTest={runFullSupabaseHighlightThumbnailTest}
                onRunMediaApprovalTest={runSupabaseMediaApprovalTest}
                onDeleteMediaApprovalTest={deleteSupabaseMediaApprovalTest}
                onReset={resetDemoData}
              />
            }
          />
          <Route
            path="/more"
            element={<MorePage selectedRole={selectedRole} hasDemoAccount={Boolean(activeAccount)} />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "mobile-nav-link active" : "mobile-nav-link"
            }
          >
            <img className="mobile-nav-logo" src={mySportsResumeApprovedLogo} alt="" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function RoleSelectionPage({ selectedRole, onSelectRole, realAuthEnabled }) {
  const roles = [
    {
      role: "junior_athlete",
      marker: "JR",
      title: "I am a junior athlete",
      copy: "Create a sports resume with parent or guardian approval.",
      buttonLabel: "Start Junior Path",
      note: "Parent/guardian approval required before wider visibility.",
    },
    {
      role: "parent_guardian",
      marker: "PG",
      title: "I am a parent / guardian",
      copy: "Approve and manage your child's sports resume safely.",
      buttonLabel: "Open Parent Dashboard",
      note: "Review visibility, approvals, and safe contact requests.",
    },
    {
      role: "adult_athlete",
      marker: "18+",
      title: "I am an 18+ athlete",
      copy: "Build a sports resume for clubs, first-grade teams, and opportunities.",
      buttonLabel: "Start 18+ Path",
      note: "Set availability for signings, trials, and relocation.",
    },
    {
      role: "club_scout",
      marker: "CLB",
      title: "I am a club, scout, coach, school, or academy",
      copy: "Search verified athletes and request contact safely.",
      buttonLabel: "Open Scout Desk",
      note: "No direct messaging. Junior contact stays parent-controlled.",
    },
    {
      role: "admin",
      marker: "ADM",
      title: "I am an admin / demo reviewer",
      copy: "Review pending profiles, highlights, and verification requests.",
      buttonLabel: "Open Admin Review",
      note: "Review trust queues, backend status, and local demo operations.",
    },
  ];

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="Start here"
        title="Choose the pathway that fits your role"
        description="Premium onboarding guides athletes, parents, clubs, schools, academies, and reviewers into the right trusted flow."
      />

      <article className="surface-card trust-statement">
        <div>
          <p className="eyebrow">Demo role memory</p>
          <h3>{getRoleLabel(selectedRole)} currently selected</h3>
          <p className="card-body">
            {realAuthEnabled
              ? "My Sports Resume keeps the active role synced for the current account while profiles, highlight metadata, and opportunities metadata can sync first and the rest of the sports data remains safely staged."
              : "My Sports Resume remembers the chosen role locally so the product flow feels smarter without adding real authentication yet."}
          </p>
        </div>
        <div className="trust-points">
          <TrustPoint title="Request-only platform" copy="No direct messaging. Contact requests only." />
          <TrustPoint title="Safe contact only" copy="All outreach still stays inside the contact request pathway." />
          <TrustPoint title="Role-aware demo" copy="Switch between athlete, parent, scout, and admin journeys any time." />
        </div>
      </article>

      <section className="dashboard-grid role-card-grid">
        {roles.map((item) => {
          const roleConfig = getRoleConfig(item.role);
          const isActive = selectedRole === item.role;

          return (
            <article className="surface-card role-card" key={item.role}>
              <div className="role-card-topline">
                <span className="role-marker">{item.marker}</span>
                <p className="card-kicker">{roleConfig.eyebrow}</p>
              </div>
              <h3>{item.title}</h3>
              <p className="card-body">{item.copy}</p>
              <p className="request-note role-card-note">{item.note}</p>
              <div className="badge-row">
                <span className={isActive ? "status-chip status-chip-success" : "status-chip"}>
                  {isActive ? "Active role" : "Available role"}
                </span>
              </div>
              <Link
                className="button button-primary"
                onClick={() => onSelectRole(item.role)}
                to={roleConfig.nextPath}
              >
                {item.buttonLabel}
              </Link>
            </article>
          );
        })}
      </section>
    </section>
  );
}

function DemoAuthNotice({ realAuthEnabled, title = "" }) {
  const authTitle = realAuthEnabled ? "Supabase auth mode" : "Local demo account";
  const authCopy = realAuthEnabled
    ? "Real sign in is active through Supabase Auth, while athlete profiles, highlight metadata, opportunity metadata, contact request metadata, shortlist records, and admin queue records can sync to Supabase when available."
    : "Data saved on this device only.";

  return (
    <article className="surface-card trust-statement">
      <div>
        <p className="eyebrow">Account mode</p>
        <h3>{title || (realAuthEnabled ? "Supabase auth mode" : "Local demo account mode")}</h3>
        <p className="card-body">
          {realAuthEnabled
            ? "Supabase Auth Phase 1 is active. The account layer is real, but app data is still local-first and request-led."
            : "This scaffold adds polished account UI while keeping My Sports Resume local-first, request-led, and focused on sports resumes rather than social features."}
        </p>
      </div>
      <div className="trust-points">
        <TrustPoint title={authTitle} copy={authCopy} />
        <TrustPoint
          title="Auth connection"
          copy={realAuthEnabled ? "Supabase auth enabled." : "Supabase auth not connected yet."}
        />
        <TrustPoint title="Password handling" copy="Password values are never stored in localStorage." />
        <TrustPoint
          title="Safety"
          copy="Sports resume platform, not a social app. No direct messaging. No exact addresses."
        />
      </div>
    </article>
  );
}

function ManualSupabaseUserGuide() {
  return (
    <div className="checklist">
      {MANUAL_SUPABASE_USER_STEPS.map((item, index) => (
        <div className="check-item" key={item}>
          <span className="check-mark done">{index + 1}</span>
          <p>{item}</p>
        </div>
      ))}
    </div>
  );
}

function getAuthGuidanceItems(mode, realAuthEnabled, statusMessage = "") {
  if (!realAuthEnabled) {
    return [];
  }

  const normalized = normalizeText(statusMessage);
  const items = [];

  if (mode === "login") {
    items.push("Use Login after creating or confirming the user in Supabase.");
    items.push(
      "Use Create Account first if this email was not created through this My Sports Resume Supabase project.",
    );

    if (
      normalized.includes("invalid login credentials") ||
      normalized.includes("email confirmation") ||
      normalized.includes("email not confirmed")
    ) {
      items.push(
        "Check that the user exists in Supabase Authentication -> Users, is confirmed, and that the password is correct.",
      );
    }
  }

  if (mode === "create") {
    items.push("Create Account uses the Supabase signUpWithEmail flow for this My Sports Resume project.");
    items.push(
      "After successful signup or login, the app attempts to create or update the lightweight app_user_profiles role row.",
    );

    if (
      normalized.includes("check your email") ||
      normalized.includes("confirm the account") ||
      normalized.includes("confirmation")
    ) {
      items.push("If email confirmation is enabled in Supabase, confirm the email first, then return to Login.");
    }

    if (normalized.includes("rate-limited signup emails") || normalized.includes("manual")) {
      items.push(
        "If Supabase rate-limits signup emails, create a confirmed manual test user in Supabase Authentication -> Users, then return to Login.",
      );
    }
  }

  return items;
}

function LoginPage({ account, onLogin, realAuthEnabled, statusMessage }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: account?.email || "",
    password: "",
  });
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAccount = Boolean(account);
  const accountStatusMessage =
    statusMessage && normalizeText(statusMessage).includes("account") ? statusMessage : "";
  const loginGuidance = getAuthGuidanceItems("login", realAuthEnabled, status || accountStatusMessage);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      email: account?.email || "",
      password: "",
    }));
  }, [account]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await onLogin(form);
    setIsSubmitting(false);
    setStatus(result.message);
    setStatusTone(result.success ? "success" : "warning");

    if (result.success) {
      navigate("/account");
    }
  }

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="Login"
        title={realAuthEnabled ? "Sign in to your My Sports Resume account" : "Open your local demo account"}
        description={
          realAuthEnabled
            ? "Supabase Auth is active here. Sign in with email and password while athlete and opportunity data stay local in this phase."
            : "This is a local-first account scaffold only. Real Supabase auth is not connected yet."
        }
      />

      <DemoAuthNotice realAuthEnabled={realAuthEnabled} />

      <div className="two-up-grid">
        <article className="surface-card dashboard-panel">
          <BrandLogoBadge compact />
          <p className="card-kicker">Account access</p>
          <h3>{realAuthEnabled ? "Supabase login" : "Local demo login"}</h3>
          <p className="card-body">
            {realAuthEnabled
              ? "Email and password sign in is active. Password values are handled by Supabase Auth and are never stored in localStorage."
              : "Local demo login only. This page does not use production authentication and does not store password values."}
          </p>
          {realAuthEnabled ? (
            <p className="request-note">
              Use Login after creating or confirming the user in Supabase.
            </p>
          ) : null}
          <form className="builder-topline" onSubmit={handleSubmit}>
            <FormField
              label="Email"
              value={form.email}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              placeholder={
                realAuthEnabled ? "your-account@example.com" : "your-demo-account@example.com"
              }
              helper={
                realAuthEnabled
                  ? "Use the same email you used when creating the account inside this Supabase project."
                  : "Use a demo email if you want. This stays on this device only."
              }
            />
            <FormField
              label="Password"
              type="password"
              value={form.password}
              onChange={(value) => setForm((current) => ({ ...current, password: value }))}
              placeholder={realAuthEnabled ? "Enter your password" : "Password placeholder only"}
              helper={
                realAuthEnabled
                  ? "Required for Supabase sign in. If access fails, the account may still need email confirmation or a password reset. Password values are never stored in localStorage."
                  : "Password values are never stored in localStorage."
              }
            />
            <div className="dashboard-actions">
              <button
                className="button button-primary"
                disabled={isSubmitting || (!realAuthEnabled && !hasAccount)}
                type="submit"
              >
                {isSubmitting
                  ? "Opening Account..."
                  : realAuthEnabled
                    ? "Sign In"
                    : "Login to Demo Account"}
              </button>
              <Link className="button button-secondary" to="/create-account">
                Create Account
              </Link>
            </div>
          </form>
          {!realAuthEnabled && !hasAccount ? (
            <p className="request-note">
              No local demo account exists on this device yet. Create Account to start the local-first role flow.
            </p>
          ) : null}
          {status || accountStatusMessage ? (
            <p className={`banner ${statusTone === "success" ? "banner-success" : "banner-warning"}`}>
              {status || accountStatusMessage}
            </p>
          ) : null}
        </article>

        <article className="surface-card dashboard-panel">
          <p className="card-kicker">{realAuthEnabled ? "Supabase account status" : "Local account status"}</p>
          <h3>
            {hasAccount
              ? realAuthEnabled
                ? "Supabase account is ready to use"
                : "Saved demo account found"
              : realAuthEnabled
                ? "No Supabase account session detected yet"
                : "No demo account on this device yet"}
          </h3>
          {hasAccount ? (
            <>
              <div className="detail-list">
                <DetailRow label="Name" value={account.fullName} />
                <DetailRow label="Email" value={account.email || "Not set"} />
                <DetailRow label="Role" value={getRoleLabel(account.role)} />
              </div>
              <p className="request-note">
                Under-18 accounts require parent or guardian approval before broader visibility or contact routes.
              </p>
            </>
          ) : (
            <p className="card-body">
              {realAuthEnabled
                ? "Backend is connected. Create or confirm a Supabase user, then sign in."
                : "Create a local demo account to save safe account metadata, sync the role flow, and continue into the right dashboard path."}
            </p>
          )}
          {loginGuidance.length > 0 ? (
            <div className="checklist">
              {loginGuidance.map((item) => (
                <div className="check-item" key={item}>
                  <span className="check-mark done" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          ) : null}
          {realAuthEnabled ? (
            <>
              <p className="card-kicker">Manual Supabase test user</p>
              <ManualSupabaseUserGuide />
            </>
          ) : null}
        </article>
      </div>
    </section>
  );
}

function CreateAccountPage({ account, onCreateAccount, realAuthEnabled, statusMessage }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: account?.fullName || "",
    email: account?.email || "",
    password: "",
    organisationName: account?.organisationName || "",
    role: account?.role || DEFAULT_SELECTED_ROLE,
  });
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupCooldownSeconds, setSignupCooldownSeconds] = useState(0);
  const accountStatusMessage =
    statusMessage && normalizeText(statusMessage).includes("account") ? statusMessage : "";
  const roleOptions = Object.values(ROLE_DEFINITIONS).map((item) => ({
    label: item.label,
    value: item.id,
  }));
  const createAccountGuidance = getAuthGuidanceItems("create", realAuthEnabled, status || accountStatusMessage);

  useEffect(() => {
    if (signupCooldownSeconds <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSignupCooldownSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [signupCooldownSeconds]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (realAuthEnabled && signupCooldownSeconds > 0) {
      setStatus(
        "Supabase signup is temporarily paused here after a rate limit response. Try again later or use the manual Supabase test user steps.",
      );
      setStatusTone("warning");
      return;
    }

    if (!form.fullName.trim()) {
      setStatus("Add a full name before continuing.");
      setStatusTone("warning");
      return;
    }
    if (!looksLikeEmail(form.email)) {
      setStatus("Add a valid-looking email before continuing.");
      setStatusTone("warning");
      return;
    }
    if (!form.role || !ROLE_DEFINITIONS[form.role]) {
      setStatus("Choose the account role before continuing.");
      setStatusTone("warning");
      return;
    }
    if (realAuthEnabled && !String(form.password || "").trim()) {
      setStatus("Add a password before creating the Supabase account.");
      setStatusTone("warning");
      return;
    }

    setIsSubmitting(true);
    const result = await onCreateAccount(form);
    setIsSubmitting(false);
    setStatus(result.message);
    setStatusTone(result.success && !result.requiresEmailConfirmation ? "success" : "warning");

    if (result.isRateLimited) {
      setSignupCooldownSeconds(SIGNUP_RATE_LIMIT_COOLDOWN_SECONDS);
    }

    if (result.success) {
      if (result.requiresEmailConfirmation) {
        return;
      }
      navigate("/account-setup");
    }
  }

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="Create account"
        title={realAuthEnabled ? "Create a Supabase account" : "Create a local demo account"}
        description={
          realAuthEnabled
            ? "Create a real account for sign up and login while sports data can keep using guarded Supabase or local fallback paths in this phase."
            : "Set up a polished account shell without enabling real auth, backend writes, or password storage."
        }
      />

      <DemoAuthNotice
        realAuthEnabled={realAuthEnabled}
        title={realAuthEnabled ? "Safe Supabase account setup" : "Safe local account setup"}
      />

      <div className="two-up-grid">
        <article className="surface-card dashboard-panel">
          <BrandLogoBadge compact />
          <p className="card-kicker">Create account</p>
          <h3>{realAuthEnabled ? "Supabase account details" : "Local demo account details"}</h3>
          {realAuthEnabled ? (
            <p className="request-note">
              If signup emails are rate-limited, use the manual Supabase test user steps below and then come back to Login.
            </p>
          ) : null}
          <form className="builder-topline" onSubmit={handleSubmit}>
            <FormField
              label="Full name"
              value={form.fullName}
              onChange={(value) => setForm((current) => ({ ...current, fullName: value }))}
              placeholder="Your name"
              helper={
                realAuthEnabled
                  ? "Saved to your lightweight account profile for the account setup flow."
                  : "This is local demo metadata only."
              }
            />
            <FormField
              label="Email"
              value={form.email}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              placeholder={
                realAuthEnabled ? "your-account@example.com" : "your-demo-account@example.com"
              }
              helper={
                realAuthEnabled
                  ? "Used by Supabase Auth for sign up and login in this My Sports Resume Supabase project."
                  : "Use a demo email if preferred. It stays on this device only."
              }
            />
            <FormField
              label="Password"
              type="password"
              value={form.password}
              onChange={(value) => setForm((current) => ({ ...current, password: value }))}
              placeholder={realAuthEnabled ? "Create a password" : "Password placeholder only"}
              helper={
                realAuthEnabled
                  ? "Required in Supabase auth mode. Password values are never stored in localStorage."
                  : "Do not use a real password here. Password values are never stored."
              }
            />
            <FormField
              label="Organisation name"
              value={form.organisationName}
              onChange={(value) => setForm((current) => ({ ...current, organisationName: value }))}
              placeholder="Optional for club / scout / coach accounts"
              helper="Optional. Useful for club, scout, school, or academy accounts."
            />
            <FormField
              label="Role selection"
              value={form.role}
              onChange={(value) => setForm((current) => ({ ...current, role: value }))}
              select
              options={roleOptions}
              helper="This selected role syncs with the local role flow stored in `msr_selected_role_v1`."
            />
            <div className="dashboard-actions">
              <button
                className="button button-primary"
                disabled={isSubmitting || signupCooldownSeconds > 0}
                type="submit"
              >
                {isSubmitting
                  ? "Saving Account..."
                  : signupCooldownSeconds > 0
                    ? `Try Again Later (${signupCooldownSeconds}s)`
                    : realAuthEnabled
                      ? "Create Supabase Account"
                      : "Create Demo Account"}
              </button>
              <Link className="button button-secondary" to="/login">
                Back to Login
              </Link>
            </div>
          </form>
          {signupCooldownSeconds > 0 ? (
            <p className="request-note">
              Repeated signup requests are paused after a Supabase rate limit response. Use the manual Supabase test user path or wait for the cooldown to finish.
            </p>
          ) : null}
          {status ? (
            <p className={`banner ${statusTone === "success" ? "banner-success" : "banner-warning"}`}>
              {status}
            </p>
          ) : null}
        </article>

        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Role sync</p>
          <h3>Account role guides the next step</h3>
          <div className="checklist">
            {[
              "Junior athlete accounts route into resume building with parent or guardian approval.",
              "Parent and guardian accounts route into approvals, visibility control, and contact request review.",
              "Club and scout accounts route into verification requests, athlete search, shortlist, and opportunities.",
            ].map((item) => (
              <div className="check-item" key={item}>
                <span className="check-mark done" />
                <p>{item}</p>
              </div>
            ))}
          </div>
          <p className="request-note">
            Password values are never stored in localStorage. {realAuthEnabled
              ? "Supabase handles account sign up while athlete profiles, highlights metadata, opportunities metadata, contact requests, shortlists, and admin queues can use guarded account-backed save paths in this phase."
              : "The local demo account stays on this device only until real auth is enabled later."}
          </p>
          {createAccountGuidance.length > 0 ? (
            <div className="checklist">
              {createAccountGuidance.map((item) => (
                <div className="check-item" key={item}>
                  <span className="check-mark done" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          ) : null}
          {realAuthEnabled ? (
            <>
              <p className="card-kicker">Manual Supabase test user</p>
              <ManualSupabaseUserGuide />
            </>
          ) : null}
        </article>
      </div>
      {accountStatusMessage ? <p className="banner banner-success">{accountStatusMessage}</p> : null}
    </section>
  );
}

function AccountSetupPage({ account, selectedRole, realAuthEnabled, statusMessage }) {
  const activeRole = account?.role || selectedRole;
  const roleConfig = getRoleConfig(activeRole);
  const setupCards = getAccountSetupCards(activeRole);
  const accountStatusMessage =
    statusMessage && normalizeText(statusMessage).includes("account") ? statusMessage : "";

  if (!account) {
    return (
      <section className="content-section">
        <article className="surface-card empty-state-card">
          <p className="card-kicker">{realAuthEnabled ? "No signed-in Supabase account yet" : "No local demo account yet"}</p>
          <h2>Create an account to unlock the role-based setup flow</h2>
          <p className="card-body">
            {realAuthEnabled
              ? "Sign in or create a Supabase account to unlock the role-based setup flow."
              : "The account scaffold is local-only for now and does not use real Supabase authentication yet."}
          </p>
          <div className="dashboard-actions">
            <Link className="button button-primary" to="/create-account">
              Create Account
            </Link>
            <Link className="button button-secondary" to="/login">
              Open Login
            </Link>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="Account setup"
        title={`${account.fullName}, your ${roleConfig.label.toLowerCase()} path is ready`}
        description={
          realAuthEnabled
            ? "Use this guided setup step to enter the right part of My Sports Resume with your Supabase account active."
            : "Use this guided setup step to enter the right part of My Sports Resume without enabling real auth yet."
        }
      />

      <DemoAuthNotice
        realAuthEnabled={realAuthEnabled}
        title={realAuthEnabled ? "Supabase account setup" : "Account setup stays local-first"}
      />

      <article className="surface-card trust-statement">
        <div>
          <p className="eyebrow">Next step</p>
          <h3>{roleConfig.eyebrow}</h3>
          <p className="card-body">
            {roleConfig.description} {activeRole === "junior_athlete"
              ? "Parent or guardian approval is required before wider visibility."
              : activeRole === "club_scout"
                ? "Clubs and scouts still use safe contact requests only, especially for junior athletes."
                : ""}
          </p>
        </div>
        <div className="detail-list">
          <DetailRow label={realAuthEnabled ? "Supabase account" : "Demo account"} value={account.fullName} />
          <DetailRow label="Email" value={account.email || "Not set"} />
          <DetailRow label="Selected role" value={getRoleLabel(activeRole)} />
        </div>
      </article>

      <section className="dashboard-grid">
        {setupCards.map((item) => (
          <article className="surface-card more-card" key={item.title}>
            <p className="card-kicker">Guided next step</p>
            <h3>{item.title}</h3>
            <p className="card-body">{item.copy}</p>
            <Link className="button button-primary" to={item.to}>
              {item.cta}
            </Link>
          </article>
        ))}
      </section>

      {accountStatusMessage ? <p className="banner banner-success">{accountStatusMessage}</p> : null}
    </section>
  );
}

function AccountPage({
  account,
  selectedRole,
  ownedProfiles,
  mediaAssets,
  mediaPreviewUrls,
  backendStatus,
  realAuthEnabled,
  profileBackendTestState,
  highlightBackendTestState,
  opportunityBackendTestState,
  shortlistBackendTestState,
  contactRequestBackendTestState,
  adminQueueBackendTestState,
  mediaBackendTestState,
  storageBackendTestState,
  privateVideoStorageTestState,
  fullHighlightThumbnailTestState,
  mediaApprovalTestState,
  onSelectRole,
  onLogout,
  onRunProfileBackendTest,
  onDeleteProfileBackendTest,
  onRunHighlightBackendTest,
  onDeleteHighlightBackendTest,
  onRunOpportunityBackendTest,
  onDeleteOpportunityBackendTest,
  onRunShortlistBackendTest,
  onDeleteShortlistBackendTest,
  onRunContactRequestBackendTest,
  onDeleteContactRequestBackendTest,
  onRunAdminQueueBackendTest,
  onDeleteAdminQueueBackendTest,
  onRunMediaBackendTest,
  onDeleteMediaBackendTest,
  onUploadProfilePhoto,
  onDeleteStoredMediaAsset,
  onCreateSignedMediaUrl,
  onRunStorageBackendTest,
  onDeleteStorageBackendTest,
  onRunPrivateVideoStorageTest,
  onDeletePrivateVideoStorageTest,
  onRunFullHighlightThumbnailTest,
  onRunMediaApprovalTest,
  onDeleteMediaApprovalTest,
  onReset,
}) {
  const accountLabel = account?.authMode === "supabase" ? "Supabase account active" : "Local demo account";
  const roleOptions = Object.values(ROLE_DEFINITIONS);

  if (!account) {
    return (
      <section className="page-stack">
        <SectionHeading
          eyebrow="Account"
          title="Account settings are ready when you are"
          description={
            realAuthEnabled
              ? "Sign in or create a Supabase account to manage role settings while profiles, highlights, opportunities, contact requests, shortlists, and admin queue records can sync first."
              : "Create a local demo account to sync role selection, account setup, and local-first account metadata."
          }
        />

        <DemoAuthNotice
          realAuthEnabled={realAuthEnabled}
          title={realAuthEnabled ? "Supabase auth is enabled" : "Account scaffold only"}
        />

        <article className="surface-card empty-state-card">
          <p className="card-kicker">{realAuthEnabled ? "No Supabase account session yet" : "No local demo account yet"}</p>
          <h3>Create an account to use the role-aware account flow</h3>
          <p className="card-body">
            {realAuthEnabled
              ? "Supabase auth is available. Athlete profiles, highlights metadata, opportunity metadata, contact request metadata, shortlist records, and admin queue records can save to your account first in this phase."
              : "Real auth is not connected yet. This account scaffold stores safe demo metadata on this device only."}
          </p>
          <div className="dashboard-actions">
            <Link className="button button-primary" to="/create-account">
              Create Account
            </Link>
            <Link className="button button-secondary" to="/login">
              Open Login
            </Link>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="Account"
        title={realAuthEnabled ? "Profile settings and Supabase account controls" : "Profile settings and local account controls"}
        description={
          realAuthEnabled
            ? "Review your real account, backend mode, and role flow while profiles, highlights metadata, opportunities metadata, contact request metadata, shortlist records, and admin queue records can sync first in this phase."
            : "Review your local demo account, backend mode, and role flow without enabling real Supabase authentication."
        }
      />

      <DemoAuthNotice
        realAuthEnabled={realAuthEnabled}
        title={realAuthEnabled ? "Supabase account settings" : "Local-first account settings"}
      />

      <div className="two-up-grid">
        <article className="surface-card dashboard-panel">
          <BrandLogoBadge compact />
          <p className="card-kicker">{accountLabel}</p>
          <h3>Account overview</h3>
          <div className="detail-list">
            <DetailRow label="Name" value={account.fullName} />
            <DetailRow label="Email" value={account.email || "Not set"} />
            <DetailRow label="Selected role" value={getRoleLabel(selectedRole)} />
            <DetailRow label="Backend mode" value={backendStatus.modeLabel} />
            <DetailRow
              label="Auth connection"
              value={realAuthEnabled ? "Supabase auth enabled" : "Supabase auth not connected yet"}
            />
            <DetailRow
              label="Athlete profiles"
              value={
                backendStatus.currentProfileSource === "supabase"
                  ? "Saved to your Supabase account"
                  : "Saved on this device only"
              }
            />
            <DetailRow
              label="Highlights metadata"
              value={
                backendStatus.currentHighlightSource === "supabase"
                  ? "Saved to your Supabase account"
                  : "Saved on this device only"
              }
            />
            <DetailRow
              label="Opportunities metadata"
              value={
                backendStatus.currentOpportunitySource === "supabase"
                  ? "Saved to your Supabase account"
                  : "Saved on this device only"
              }
            />
            <DetailRow
              label="Contact requests"
              value={
                backendStatus.currentContactRequestSource === "supabase"
                  ? "Saved to your Supabase account"
                  : "Saved on this device only"
              }
            />
            <DetailRow
              label="Shortlists"
              value={
                backendStatus.currentShortlistSource === "supabase"
                  ? "Saved to your Supabase account"
                  : "Saved on this device only"
              }
            />
            <DetailRow
              label="Admin queues"
              value={
                backendStatus.currentAdminQueueSource === "supabase"
                  ? "Saved to your Supabase account"
                  : "Saved on this device only"
              }
            />
            <DetailRow
              label="Media metadata mode"
              value={backendStatus.mediaDataModeLabel || "Planning"}
            />
            <DetailRow
              label="Media asset table"
              value={backendStatus.mediaAssetTableDetectedLabel || "unknown"}
            />
            <DetailRow
              label="Storage mode"
              value={backendStatus.mediaStorageModeLabel || "Not Enabled"}
            />
            <DetailRow
              label="Video storage mode"
              value={backendStatus.videoStorageModeLabel || "Not enabled"}
            />
            <DetailRow
              label="Media approval workflow"
              value={backendStatus.mediaApprovalWorkflowLabel || "Not enabled"}
            />
            <DetailRow
              label="Profile photo bucket"
              value={backendStatus.profilePhotoBucketDetectedLabel || "unknown"}
            />
            <DetailRow
              label="Thumbnail bucket"
              value={backendStatus.highlightThumbnailBucketDetectedLabel || "unknown"}
            />
            <DetailRow
              label="Video bucket"
              value={backendStatus.highlightVideoBucketDetectedLabel || "unknown"}
            />
            <DetailRow
              label="Storage buckets configured"
              value={backendStatus.mediaBucketStatus || "not enabled yet"}
            />
            <DetailRow
              label="Safe uploads enabled"
              value={backendStatus.uploadsEnabled ? "Yes" : "No"}
            />
            <DetailRow
              label="Public media access"
              value={backendStatus.publicMediaAccess ? "Yes" : "No"}
            />
            <DetailRow
              label="Public unauthenticated media"
              value={backendStatus.publicUnauthenticatedMediaLabel || "Disabled"}
            />
            <DetailRow
              label="Public video access"
              value="No"
            />
            <DetailRow
              label="Public media URLs"
              value={backendStatus.publicMediaUrlsLabel || "Disabled"}
            />
            <DetailRow
              label="Video uploads"
              value={backendStatus.videoUploadsLabel || "Disabled"}
            />
            <DetailRow
              label="Junior media approval"
              value={backendStatus.juniorMediaApprovalLabel || "Parent/guardian required"}
            />
            <DetailRow
              label="Signed owner previews"
              value={backendStatus.signedOwnerPreviewsLabel || "Not enabled"}
            />
            <DetailRow
              label="Admin media review"
              value={backendStatus.adminMediaReviewLabel || "Not enabled"}
            />
            {account.organisationName ? (
              <DetailRow label="Organisation" value={account.organisationName} />
            ) : null}
          </div>
          <p className="request-note">{backendStatus.message}</p>
          <p className="request-note">{backendStatus.profileDataMessage}</p>
          <p className="request-note">{backendStatus.highlightDataMessage}</p>
          <p className="request-note">{backendStatus.opportunityDataMessage}</p>
          <p className="request-note">{backendStatus.contactRequestDataMessage}</p>
          <p className="request-note">{backendStatus.shortlistDataMessage}</p>
          <p className="request-note">{backendStatus.adminQueueDataMessage}</p>
          <p className="request-note">{backendStatus.mediaDataMessage}</p>
          <p className="request-note">{backendStatus.mediaStorageMessage}</p>
          <p className="request-note">
            {realAuthEnabled
              ? backendStatus.videoUploadsEnabled
                ? "Passwords are handled by Supabase Auth and are never stored in localStorage. Private image uploads and private highlight video owner tests stay approval-gated, signed-preview only, and non-public. Public media URLs remain disabled."
                : "Passwords are handled by Supabase Auth and are never stored in localStorage. Private image uploads now stay owner-only, approval-gated, and non-public. Public media URLs and video uploads stay disabled."
              : "Data saved on this device only. Do not use real passwords in the local demo."}
          </p>
          <p className="request-note">
            For account, verification, or platform support, contact {APP_SUPPORT_EMAIL}.
          </p>
          <div className="dashboard-actions">
            <Link className="button button-primary" to="/qa/media-approval">
              Open Media Approval Test
            </Link>
          </div>
        </article>

        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Safety and controls</p>
          <h3>Account actions</h3>
          <div className="checklist">
            {[
              "Under-18 accounts require parent or guardian approval before wider visibility.",
              "Clubs and scouts cannot directly contact junior athletes.",
              "Contact requests only. No direct messaging. Exact addresses are not shown.",
            ].map((item) => (
              <div className="check-item" key={item}>
                <span className="check-mark done" />
                <p>{item}</p>
              </div>
            ))}
          </div>
          <div className="dashboard-actions account-action-grid">
            <Link className="button button-primary" to="/account-setup">
              Open Account Setup
            </Link>
            <Link className="button button-secondary" to="/more">
              More Tools
            </Link>
            <button className="button button-subtle" onClick={onLogout} type="button">
              {realAuthEnabled ? "Logout" : "Clear Demo Account"}
            </button>
            <button className="button button-subtle" onClick={onReset} type="button">
              Reset Demo Data
            </button>
          </div>
        </article>
      </div>

      <SupabaseProfileTestPanel
        backendStatus={backendStatus}
        testState={profileBackendTestState}
        onDelete={onDeleteProfileBackendTest}
        onRunTest={onRunProfileBackendTest}
      />

      <SupabaseHighlightTestPanel
        backendStatus={backendStatus}
        testState={highlightBackendTestState}
        onDelete={onDeleteHighlightBackendTest}
        onRunTest={onRunHighlightBackendTest}
      />

      <SupabaseOpportunityTestPanel
        backendStatus={backendStatus}
        testState={opportunityBackendTestState}
        onDelete={onDeleteOpportunityBackendTest}
        onRunTest={onRunOpportunityBackendTest}
      />

      <SupabaseShortlistTestPanel
        backendStatus={backendStatus}
        testState={shortlistBackendTestState}
        onDelete={onDeleteShortlistBackendTest}
        onRunTest={onRunShortlistBackendTest}
      />

      <SupabaseContactRequestTestPanel
        backendStatus={backendStatus}
        testState={contactRequestBackendTestState}
        onDelete={onDeleteContactRequestBackendTest}
        onRunTest={onRunContactRequestBackendTest}
      />

      <SupabaseAdminQueueTestPanel
        backendStatus={backendStatus}
        testState={adminQueueBackendTestState}
        onDelete={onDeleteAdminQueueBackendTest}
        onRunTest={onRunAdminQueueBackendTest}
      />

      <SupabaseMediaMetadataTestPanel
        backendStatus={backendStatus}
        testState={mediaBackendTestState}
        onDelete={onDeleteMediaBackendTest}
        onRunTest={onRunMediaBackendTest}
      />

      <SupabaseStorageTestPanel
        backendStatus={backendStatus}
        testState={storageBackendTestState}
        onDelete={onDeleteStorageBackendTest}
        onRunTest={onRunStorageBackendTest}
      />

      <SupabasePrivateVideoStorageTestPanel
        backendStatus={backendStatus}
        testState={privateVideoStorageTestState}
        onDelete={onDeletePrivateVideoStorageTest}
        onRunTest={onRunPrivateVideoStorageTest}
      />

      <SupabaseFullHighlightThumbnailTestPanel
        backendStatus={backendStatus}
        testState={fullHighlightThumbnailTestState}
        onRunTest={onRunFullHighlightThumbnailTest}
      />

      <SupabaseMediaApprovalTestPanel
        backendStatus={backendStatus}
        testState={mediaApprovalTestState}
        onDelete={onDeleteMediaApprovalTest}
        onRunTest={onRunMediaApprovalTest}
      />

      <PrivateProfilePhotoUploadPanel
        backendStatus={backendStatus}
        mediaAssets={mediaAssets}
        mediaPreviewUrls={mediaPreviewUrls}
        ownedProfiles={ownedProfiles}
        onDeleteAsset={onDeleteStoredMediaAsset}
        onLoadSignedUrl={onCreateSignedMediaUrl}
        onUpload={onUploadProfilePhoto}
      />

      <article className="surface-card dashboard-panel">
        <p className="card-kicker">Switch role</p>
        <h3>Sync the account role with the active product path</h3>
        <p className="card-body">
          Changing roles here updates the current product path and keeps the saved account role in sync with `msr_selected_role_v1`.
        </p>
        <div className="role-switch-grid">
          {roleOptions.map((item) => (
            <button
              className={selectedRole === item.id ? "button button-primary" : "button button-secondary"}
              key={item.id}
              onClick={() => onSelectRole(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}

function SupabaseProfileTestPanel({
  backendStatus,
  testState,
  onRunTest,
  onDelete,
  compact = false,
}) {
  const statusClass =
    testState?.status === "pass" ? "status-chip status-chip-success" : "status-chip";
  const sourceSummary = testState?.sourceUsed || "Not run yet";
  const profileDataSummary =
    testState?.profileDataExists === null
      ? "Not checked"
      : testState.profileDataExists
        ? "Yes"
        : "No";
  const ownerSummary =
    testState?.ownerUserIdExists === null
      ? "Not checked"
      : testState.ownerUserIdExists
        ? "Yes"
        : "No";
  const reloadSummary =
    testState?.foundOnReload === null
      ? "Not checked"
      : testState.foundOnReload
        ? "Yes"
        : "No";
  const panelKicker = compact ? "Supabase profile test" : "QA panel";

  return (
    <article className="surface-card dashboard-panel">
      <p className="card-kicker">{panelKicker}</p>
      <h3>Supabase Profile Test</h3>
      <div className="detail-list">
        <DetailRow
          label="Current auth user email"
          value={backendStatus?.currentUserEmail || "No Supabase user signed in"}
        />
        <DetailRow
          label="Current profile data mode"
          value={backendStatus?.profileDataModeLabel || "Local Demo"}
        />
        <DetailRow
          label="Current profile source"
          value={backendStatus?.currentProfileSourceLabel || "localStorage"}
        />
        <DetailRow
          label="Athlete profile table status"
          value={backendStatus?.athleteProfileTableDetectedLabel || "unknown"}
        />
        <DetailRow
          label="Test status"
          value={<span className={statusClass}>{testState?.label || "Not run yet"}</span>}
        />
        <DetailRow label="Saved profile id" value={testState?.savedProfileId || "Not created"} />
        <DetailRow label="Source used" value={sourceSummary} />
        <DetailRow label="profile_data JSON exists" value={profileDataSummary} />
        <DetailRow label="owner_user_id exists" value={ownerSummary} />
        <DetailRow label="Found again on reload" value={reloadSummary} />
      </div>
      <p className="request-note">
        Run this to create a temporary athlete profile through the live profileDataService path,
        reload profiles again, and prove whether Supabase or localStorage won.
      </p>
      <p className="request-note">{testState?.message}</p>
      {testState?.lastRanAt ? (
        <p className="request-note">Last run: {formatDisplayDate(testState.lastRanAt)}</p>
      ) : null}
      {testState?.deleteMessage ? <p className="request-note">{testState.deleteMessage}</p> : null}
      <div className="dashboard-actions">
        <button
          className="button button-primary"
          disabled={testState?.status === "running"}
          onClick={onRunTest}
          type="button"
        >
          {testState?.status === "running"
            ? "Running Supabase Profile Test..."
            : "Run Supabase Profile Test"}
        </button>
        <button
          className="button button-secondary"
          disabled={!testState?.savedProfileId || testState?.status === "running"}
          onClick={onDelete}
          type="button"
        >
          Delete Test Profile
        </button>
      </div>
    </article>
  );
}

function SupabaseHighlightTestPanel({
  backendStatus,
  testState,
  onRunTest,
  onDelete,
  compact = false,
}) {
  const statusClass =
    testState?.status === "pass" ? "status-chip status-chip-success" : "status-chip";
  const sourceSummary = testState?.sourceUsed || "Not run yet";
  const highlightDataSummary =
    testState?.highlightDataExists === null
      ? "Not checked"
      : testState.highlightDataExists
        ? "Yes"
        : "No";
  const ownerSummary =
    testState?.ownerUserIdExists === null
      ? "Not checked"
      : testState.ownerUserIdExists
        ? "Yes"
        : "No";
  const athleteProfileSummary =
    testState?.athleteProfileIdExists === null
      ? "Not checked"
      : testState.athleteProfileIdExists
        ? "Yes"
        : "No";
  const reloadSummary =
    testState?.foundOnReload === null
      ? "Not checked"
      : testState.foundOnReload
        ? "Yes"
        : "No";
  const panelKicker = compact ? "Supabase highlight test" : "QA panel";

  return (
    <article className="surface-card dashboard-panel">
      <p className="card-kicker">{panelKicker}</p>
      <h3>Supabase Highlight Test</h3>
      <div className="detail-list">
        <DetailRow
          label="Current auth user email"
          value={backendStatus?.currentUserEmail || "No Supabase user signed in"}
        />
        <DetailRow
          label="Current highlight data mode"
          value={backendStatus?.highlightDataModeLabel || "Local Demo"}
        />
        <DetailRow
          label="Current highlight source"
          value={backendStatus?.currentHighlightSourceLabel || "localStorage"}
        />
        <DetailRow
          label="Highlight table status"
          value={backendStatus?.highlightTableDetectedLabel || "unknown"}
        />
        <DetailRow
          label="Test status"
          value={<span className={statusClass}>{testState?.label || "Not run yet"}</span>}
        />
        <DetailRow
          label="Saved highlight id"
          value={testState?.savedHighlightId || "Not created"}
        />
        <DetailRow label="Source used" value={sourceSummary} />
        <DetailRow label="highlight_data JSON exists" value={highlightDataSummary} />
        <DetailRow label="owner_user_id exists" value={ownerSummary} />
        <DetailRow label="athlete_profile_id exists" value={athleteProfileSummary} />
        <DetailRow label="Found again on reload" value={reloadSummary} />
      </div>
      <p className="request-note">
        Run this to create a temporary highlight record through the live highlightDataService path,
        reload highlights again, and prove whether Supabase or localStorage won.
      </p>
      <p className="request-note">{testState?.message}</p>
      {testState?.lastRanAt ? (
        <p className="request-note">Last run: {formatDisplayDate(testState.lastRanAt)}</p>
      ) : null}
      {testState?.deleteMessage ? <p className="request-note">{testState.deleteMessage}</p> : null}
      <div className="dashboard-actions">
        <button
          className="button button-primary"
          disabled={testState?.status === "running"}
          onClick={onRunTest}
          type="button"
        >
          {testState?.status === "running"
            ? "Running Supabase Highlight Test..."
            : "Run Supabase Highlight Test"}
        </button>
        <button
          className="button button-secondary"
          disabled={!testState?.savedHighlightId || testState?.status === "running"}
          onClick={onDelete}
          type="button"
        >
          Delete Test Highlight
        </button>
      </div>
    </article>
  );
}

function SupabaseOpportunityTestPanel({
  backendStatus,
  testState,
  onRunTest,
  onDelete,
  compact = false,
}) {
  const statusClass =
    testState?.status === "pass" ? "status-chip status-chip-success" : "status-chip";
  const sourceSummary = testState?.sourceUsed || "Not run yet";
  const opportunityDataSummary =
    testState?.opportunityDataExists === null
      ? "Not checked"
      : testState.opportunityDataExists
        ? "Yes"
        : "No";
  const ownerSummary =
    testState?.ownerUserIdExists === null
      ? "Not checked"
      : testState.ownerUserIdExists
        ? "Yes"
        : "No";
  const reloadSummary =
    testState?.foundOnReload === null
      ? "Not checked"
      : testState.foundOnReload
        ? "Yes"
        : "No";
  const panelKicker = compact ? "Supabase opportunity test" : "QA panel";

  return (
    <article className="surface-card dashboard-panel">
      <p className="card-kicker">{panelKicker}</p>
      <h3>Supabase Opportunity Test</h3>
      <div className="detail-list">
        <DetailRow
          label="Current auth user email"
          value={backendStatus?.currentUserEmail || "No Supabase user signed in"}
        />
        <DetailRow
          label="Current opportunity data mode"
          value={backendStatus?.opportunityDataModeLabel || "Local Demo"}
        />
        <DetailRow
          label="Current opportunity source"
          value={backendStatus?.currentOpportunitySourceLabel || "localStorage"}
        />
        <DetailRow
          label="Opportunity table status"
          value={backendStatus?.opportunityTableDetectedLabel || "unknown"}
        />
        <DetailRow
          label="Test status"
          value={<span className={statusClass}>{testState?.label || "Not run yet"}</span>}
        />
        <DetailRow
          label="Saved opportunity id"
          value={testState?.savedOpportunityId || "Not created"}
        />
        <DetailRow label="Source used" value={sourceSummary} />
        <DetailRow label="opportunity_data JSON exists" value={opportunityDataSummary} />
        <DetailRow label="owner_user_id exists" value={ownerSummary} />
        <DetailRow label="Found again on reload" value={reloadSummary} />
      </div>
      <p className="request-note">
        Run this to create a temporary opportunity record through the live
        opportunityDataService path, reload opportunities again, and prove whether
        Supabase or localStorage won.
      </p>
      <p className="request-note">{testState?.message}</p>
      {testState?.lastRanAt ? (
        <p className="request-note">Last run: {formatDisplayDate(testState.lastRanAt)}</p>
      ) : null}
      {testState?.deleteMessage ? <p className="request-note">{testState.deleteMessage}</p> : null}
      <div className="dashboard-actions">
        <button
          className="button button-primary"
          disabled={testState?.status === "running"}
          onClick={onRunTest}
          type="button"
        >
          {testState?.status === "running"
            ? "Running Supabase Opportunity Test..."
            : "Run Supabase Opportunity Test"}
        </button>
        <button
          className="button button-secondary"
          disabled={!testState?.savedOpportunityId || testState?.status === "running"}
          onClick={onDelete}
          type="button"
        >
          Delete Test Opportunity
        </button>
      </div>
    </article>
  );
}

function SupabaseShortlistTestPanel({
  backendStatus,
  testState,
  onRunTest,
  onDelete,
  compact = false,
}) {
  const statusClass =
    testState?.status === "pass" ? "status-chip status-chip-success" : "status-chip";
  const sourceSummary = testState?.sourceUsed || "Not run yet";
  const shortlistDataSummary =
    testState?.shortlistDataExists === null
      ? "Not checked"
      : testState.shortlistDataExists
        ? "Yes"
        : "No";
  const ownerSummary =
    testState?.ownerUserIdExists === null
      ? "Not checked"
      : testState.ownerUserIdExists
        ? "Yes"
        : "No";
  const athleteProfileSummary =
    testState?.athleteProfileIdExists === null
      ? "Not checked"
      : testState.athleteProfileIdExists
        ? "Yes"
        : "No";
  const reloadSummary =
    testState?.foundOnReload === null
      ? "Not checked"
      : testState.foundOnReload
        ? "Yes"
        : "No";
  const panelKicker = compact ? "Supabase shortlist test" : "QA panel";

  return (
    <article className="surface-card dashboard-panel">
      <p className="card-kicker">{panelKicker}</p>
      <h3>Supabase Shortlist Test</h3>
      <div className="detail-list">
        <DetailRow
          label="Current auth user email"
          value={backendStatus?.currentUserEmail || "No Supabase user signed in"}
        />
        <DetailRow
          label="Current shortlist data mode"
          value={backendStatus?.shortlistDataModeLabel || "Local Demo"}
        />
        <DetailRow
          label="Current shortlist source"
          value={backendStatus?.currentShortlistSourceLabel || "localStorage"}
        />
        <DetailRow
          label="Shortlist table status"
          value={backendStatus?.shortlistTableDetectedLabel || "unknown"}
        />
        <DetailRow
          label="Test status"
          value={<span className={statusClass}>{testState?.label || "Not run yet"}</span>}
        />
        <DetailRow
          label="Saved shortlist id"
          value={testState?.savedShortlistId || "Not created"}
        />
        <DetailRow label="Source used" value={sourceSummary} />
        <DetailRow label="shortlist_data JSON exists" value={shortlistDataSummary} />
        <DetailRow label="owner_user_id exists" value={ownerSummary} />
        <DetailRow label="athlete_profile_id exists" value={athleteProfileSummary} />
        <DetailRow label="Found again on reload" value={reloadSummary} />
      </div>
      <p className="request-note">
        Run this to create a temporary shortlist record through the live shortlistDataService
        path, reload shortlist records again, and prove whether Supabase or localStorage won.
      </p>
      <p className="request-note">{testState?.message}</p>
      {testState?.lastRanAt ? (
        <p className="request-note">Last run: {formatDisplayDate(testState.lastRanAt)}</p>
      ) : null}
      {testState?.deleteMessage ? <p className="request-note">{testState.deleteMessage}</p> : null}
      <div className="dashboard-actions">
        <button
          className="button button-primary"
          disabled={testState?.status === "running"}
          onClick={onRunTest}
          type="button"
        >
          {testState?.status === "running"
            ? "Running Supabase Shortlist Test..."
            : "Run Supabase Shortlist Test"}
        </button>
        <button
          className="button button-secondary"
          disabled={!testState?.savedShortlistId || testState?.status === "running"}
          onClick={onDelete}
          type="button"
        >
          Delete Test Shortlist
        </button>
      </div>
    </article>
  );
}

function SupabaseContactRequestTestPanel({
  backendStatus,
  testState,
  onRunTest,
  onDelete,
  compact = false,
}) {
  const statusClass =
    testState?.status === "pass" ? "status-chip status-chip-success" : "status-chip";
  const sourceSummary = testState?.sourceUsed || "Not run yet";
  const requestContextSummary =
    testState?.requestContextExists === null
      ? "Not checked"
      : testState.requestContextExists
        ? "Yes"
        : "No";
  const requesterUserSummary =
    testState?.requesterUserIdExists === null
      ? "Not checked"
      : testState.requesterUserIdExists
        ? "Yes"
        : "No";
  const athleteOwnerSummary =
    testState?.athleteOwnerUserIdExists === null
      ? "Not checked"
      : testState.athleteOwnerUserIdExists
        ? "Yes"
        : "No";
  const reloadSummary =
    testState?.foundOnReload === null
      ? "Not checked"
      : testState.foundOnReload
        ? "Yes"
        : "No";
  const panelKicker = compact ? "Supabase contact request test" : "QA panel";

  return (
    <article className="surface-card dashboard-panel">
      <p className="card-kicker">{panelKicker}</p>
      <h3>Supabase Contact Request Test</h3>
      <div className="detail-list">
        <DetailRow
          label="Current auth user email"
          value={backendStatus?.currentUserEmail || "No Supabase user signed in"}
        />
        <DetailRow
          label="Current contact request data mode"
          value={backendStatus?.contactRequestDataModeLabel || "Local Demo"}
        />
        <DetailRow
          label="Current contact request source"
          value={backendStatus?.currentContactRequestSourceLabel || "localStorage"}
        />
        <DetailRow
          label="Contact request table status"
          value={backendStatus?.contactRequestTableDetectedLabel || "unknown"}
        />
        <DetailRow
          label="Test status"
          value={<span className={statusClass}>{testState?.label || "Not run yet"}</span>}
        />
        <DetailRow
          label="Saved request id"
          value={testState?.savedContactRequestId || "Not created"}
        />
        <DetailRow label="Source used" value={sourceSummary} />
        <DetailRow label="request_context JSON exists" value={requestContextSummary} />
        <DetailRow label="requester_user_id exists" value={requesterUserSummary} />
        <DetailRow label="athlete_owner_user_id exists" value={athleteOwnerSummary} />
        <DetailRow label="Found again on reload" value={reloadSummary} />
      </div>
      <p className="request-note">
        Run this to create a temporary structured contact request through the live
        contactRequestDataService path, reload request records again, and prove whether
        Supabase or localStorage won.
      </p>
      <p className="request-note">{testState?.message}</p>
      {testState?.lastRanAt ? (
        <p className="request-note">Last run: {formatDisplayDate(testState.lastRanAt)}</p>
      ) : null}
      {testState?.deleteMessage ? <p className="request-note">{testState.deleteMessage}</p> : null}
      <div className="dashboard-actions">
        <button
          className="button button-primary"
          disabled={testState?.status === "running"}
          onClick={onRunTest}
          type="button"
        >
          {testState?.status === "running"
            ? "Running Supabase Contact Request Test..."
            : "Run Supabase Contact Request Test"}
        </button>
        <button
          className="button button-secondary"
          disabled={!testState?.savedContactRequestId || testState?.status === "running"}
          onClick={onDelete}
          type="button"
        >
          Delete Test Contact Request
        </button>
      </div>
    </article>
  );
}

function SupabaseAdminQueueTestPanel({
  backendStatus,
  testState,
  onRunTest,
  onDelete,
  compact = false,
}) {
  const statusClass =
    testState?.status === "pass" ? "status-chip status-chip-success" : "status-chip";
  const sourceSummary = testState?.sourceUsed || "Not run yet";
  const queueDataSummary =
    testState?.queueDataExists === null
      ? "Not checked"
      : testState.queueDataExists
        ? "Yes"
        : "No";
  const ownerSummary =
    testState?.ownerUserIdExists === null
      ? "Not checked"
      : testState.ownerUserIdExists
        ? "Yes"
        : "No";
  const reloadSummary =
    testState?.foundOnReload === null
      ? "Not checked"
      : testState.foundOnReload
        ? "Yes"
        : "No";
  const insertErrorSummary = testState?.insertErrorMessage || "None reported";
  const reloadErrorSummary = testState?.reloadErrorMessage || "None reported";
  const diagnosticSummary = testState?.diagnosticLabel || "None reported";
  const panelKicker = compact ? "Supabase admin queue test" : "QA panel";

  return (
    <article className="surface-card dashboard-panel">
      <p className="card-kicker">{panelKicker}</p>
      <h3>Supabase Admin Queue Test</h3>
      <div className="detail-list">
        <DetailRow
          label="Current auth user email"
          value={backendStatus?.currentUserEmail || "No Supabase user signed in"}
        />
        <DetailRow
          label="Current admin queue data mode"
          value={backendStatus?.adminQueueDataModeLabel || "Local Demo"}
        />
        <DetailRow
          label="Current admin queue source"
          value={backendStatus?.currentAdminQueueSourceLabel || "localStorage"}
        />
        <DetailRow
          label="Admin queue table status"
          value={backendStatus?.adminQueueTableDetectedLabel || "unknown"}
        />
        <DetailRow
          label="Test status"
          value={<span className={statusClass}>{testState?.label || "Not run yet"}</span>}
        />
        <DetailRow
          label="Saved queue item id"
          value={testState?.savedAdminQueueItemId || "Not created"}
        />
        <DetailRow label="Source used" value={sourceSummary} />
        <DetailRow label="queue_data JSON exists" value={queueDataSummary} />
        <DetailRow label="owner_user_id exists" value={ownerSummary} />
        <DetailRow label="Found again on reload" value={reloadSummary} />
        <DetailRow label="Insert error message" value={insertErrorSummary} />
        <DetailRow label="Reload error message" value={reloadErrorSummary} />
        <DetailRow label="Likely backend issue" value={diagnosticSummary} />
      </div>
      <p className="request-note">
        Run this to create a temporary review record through the live adminQueueDataService
        path, reload admin queue records again, and prove whether Supabase or localStorage won.
      </p>
      <p className="request-note">{testState?.message}</p>
      {testState?.lastRanAt ? (
        <p className="request-note">Last run: {formatDisplayDate(testState.lastRanAt)}</p>
      ) : null}
      {testState?.deleteMessage ? <p className="request-note">{testState.deleteMessage}</p> : null}
      <div className="dashboard-actions">
        <button
          className="button button-primary"
          disabled={testState?.status === "running"}
          onClick={onRunTest}
          type="button"
        >
          {testState?.status === "running"
            ? "Running Supabase Admin Queue Test..."
            : "Run Supabase Admin Queue Test"}
        </button>
        <button
          className="button button-secondary"
          disabled={!testState?.savedAdminQueueItemId || testState?.status === "running"}
          onClick={onDelete}
          type="button"
        >
          Delete Test Admin Queue Item
        </button>
      </div>
    </article>
  );
}

function SupabaseMediaMetadataTestPanel({
  backendStatus,
  testState,
  onRunTest,
  onDelete,
  compact = false,
}) {
  const statusClass =
    testState?.status === "pass" ? "status-chip status-chip-success" : "status-chip";
  const sourceSummary = testState?.sourceUsed || "Not run yet";
  const mediaDataSummary =
    testState?.mediaDataExists === null
      ? "Not checked"
      : testState.mediaDataExists
        ? "Yes"
        : "No";
  const ownerSummary =
    testState?.ownerUserIdExists === null
      ? "Not checked"
      : testState.ownerUserIdExists
        ? "Yes"
        : "No";
  const reloadSummary =
    testState?.foundOnReload === null
      ? "Not checked"
      : testState.foundOnReload
        ? "Yes"
        : "No";
  const panelKicker = compact ? "Supabase media metadata test" : "QA panel";

  return (
    <article className="surface-card dashboard-panel">
      <p className="card-kicker">{panelKicker}</p>
      <h3>Supabase Media Metadata Test</h3>
      <div className="detail-list">
        <DetailRow
          label="Current auth user email"
          value={backendStatus?.currentUserEmail || "No Supabase user signed in"}
        />
        <DetailRow
          label="Current media metadata mode"
          value={backendStatus?.mediaDataModeLabel || "Planning"}
        />
        <DetailRow
          label="Current media source"
          value={backendStatus?.currentMediaSourceLabel || "localStorage"}
        />
        <DetailRow
          label="Media asset table status"
          value={backendStatus?.mediaAssetTableDetectedLabel || "unknown"}
        />
        <DetailRow
          label="Storage buckets configured"
          value={backendStatus?.mediaBucketStatus || "not enabled yet"}
        />
        <DetailRow label="Uploads enabled" value={backendStatus?.uploadsEnabled ? "Yes" : "No"} />
        <DetailRow
          label="Public media access"
          value={backendStatus?.publicMediaAccess ? "Yes" : "No"}
        />
        <DetailRow
          label="Test status"
          value={<span className={statusClass}>{testState?.label || "Not run yet"}</span>}
        />
        <DetailRow
          label="Saved media asset id"
          value={testState?.savedMediaAssetId || "Not created"}
        />
        <DetailRow label="Source used" value={sourceSummary} />
        <DetailRow label="media_data JSON exists" value={mediaDataSummary} />
        <DetailRow label="owner_user_id exists" value={ownerSummary} />
        <DetailRow label="Found again on reload" value={reloadSummary} />
      </div>
      <p className="request-note">
        Run this to create a temporary metadata-only `media_assets` record, reload media assets
        again, and prove whether Supabase or localStorage won. No real file upload happens here.
      </p>
      <p className="request-note">{testState?.message}</p>
      {testState?.lastRanAt ? (
        <p className="request-note">Last run: {formatDisplayDate(testState.lastRanAt)}</p>
      ) : null}
      {testState?.deleteMessage ? <p className="request-note">{testState.deleteMessage}</p> : null}
      <div className="dashboard-actions">
        <button
          className="button button-primary"
          disabled={testState?.status === "running"}
          onClick={onRunTest}
          type="button"
        >
          {testState?.status === "running"
            ? "Running Supabase Media Metadata Test..."
            : "Run Supabase Media Metadata Test"}
        </button>
        <button
          className="button button-secondary"
          disabled={
            !testState?.savedMediaAssetId ||
            testState?.status === "running" ||
            normalizeText(testState?.cleanupMessage || "") ===
              "generated media approval display test record deleted."
          }
          onClick={onDelete}
          type="button"
        >
          Delete Test Media Metadata
        </button>
      </div>
    </article>
  );
}

function SupabaseMediaApprovalTestPanel({
  backendStatus,
  testState,
  onRunTest,
  onDelete,
  compact = false,
}) {
  const statusClass =
    testState?.status === "pass" ? "status-chip status-chip-success" : "status-chip";
  const yesNoSummary = (value) => (value === null ? "Not checked" : value ? "Yes" : "No");
  const panelKicker = compact ? "Media approval display test" : "QA panel";

  return (
    <article className="surface-card dashboard-panel">
      <p className="card-kicker">{panelKicker}</p>
      <h3>Media Approval Display Test</h3>
      <div className="detail-list">
        <DetailRow
          label="Current auth user email"
          value={backendStatus?.currentUserEmail || "No Supabase user signed in"}
        />
        <DetailRow
          label="Media approval workflow"
          value={backendStatus?.mediaApprovalWorkflowLabel || "Not enabled"}
        />
        <DetailRow
          label="Public media URLs"
          value={backendStatus?.publicMediaUrlsLabel || "Disabled"}
        />
        <DetailRow
          label="Public unauthenticated media"
          value={backendStatus?.publicUnauthenticatedMediaLabel || "Disabled"}
        />
        <DetailRow
          label="Signed owner previews"
          value={backendStatus?.signedOwnerPreviewsLabel || "Not enabled"}
        />
        <DetailRow
          label="Video uploads"
          value={backendStatus?.videoUploadsLabel || "Disabled"}
        />
        <DetailRow
          label="Test status"
          value={<span className={statusClass}>{testState?.label || "Not run yet"}</span>}
        />
        <DetailRow
          label="Media asset id"
          value={testState?.savedMediaAssetId || "Not created"}
        />
        <DetailRow label="Source used" value={testState?.sourceUsed || "Not run yet"} />
        <DetailRow
          label="Initial approval status"
          value={testState?.initialApprovalStatus || "Not checked"}
        />
        <DetailRow
          label="Approved status"
          value={testState?.approvedStatus || "Not checked"}
        />
        <DetailRow
          label="Rejected status"
          value={testState?.rejectedStatus || "Not checked"}
        />
        <DetailRow
          label="Public URL created"
          value={yesNoSummary(testState?.publicUrlCreated)}
        />
        <DetailRow
          label="Signed preview available"
          value={
            testState?.metadataOnly
              ? "Metadata-only test"
              : yesNoSummary(testState?.signedPreviewAvailable)
          }
        />
        <DetailRow
          label="Public access enabled"
          value={yesNoSummary(testState?.publicAccessEnabled)}
        />
        <DetailRow
          label="Update error message"
          value={testState?.updateErrorMessage || "None reported"}
        />
      </div>
      <p className="request-note">
        Run this to create a temporary media metadata record, move it through the approval states,
        and confirm the owner-display rules stay private with no public URL creation or public
        unauthenticated access.
      </p>
      <p className="request-note">{testState?.message}</p>
      {testState?.lastRanAt ? (
        <p className="request-note">Last run: {formatDisplayDate(testState.lastRanAt)}</p>
      ) : null}
      {testState?.cleanupMessage ? <p className="request-note">{testState.cleanupMessage}</p> : null}
      <div className="dashboard-actions">
        <button
          className="button button-primary"
          disabled={testState?.status === "running"}
          onClick={onRunTest}
          type="button"
        >
          {testState?.status === "running"
            ? "Running Media Approval Display Test..."
            : "Run Media Approval Display Test"}
        </button>
        <button
          className="button button-secondary"
          disabled={!testState?.savedMediaAssetId || testState?.status === "running"}
          onClick={onDelete}
          type="button"
        >
          Delete Test Media Metadata
        </button>
      </div>
    </article>
  );
}

function MediaApprovalQAPage({ backendStatus, testState, onRunTest, onDelete }) {
  const isSignedIn = Boolean(backendStatus?.currentUserEmail);

  return (
    <section className="page-stack">
      {isSignedIn ? (
        <SupabaseMediaApprovalTestPanel
          backendStatus={backendStatus}
          onDelete={onDelete}
          onRunTest={onRunTest}
          testState={testState}
        />
      ) : (
        <article className="surface-card dashboard-panel">
          <p className="card-kicker">QA route</p>
          <h3>Media Approval Display Test</h3>
          <div className="detail-list">
            <DetailRow
              label="Current auth user email"
              value={backendStatus?.currentUserEmail || "No Supabase user signed in"}
            />
            <DetailRow
              label="Media approval workflow"
              value={backendStatus?.mediaApprovalWorkflowLabel || "Not enabled"}
            />
            <DetailRow
              label="Public media access"
              value={backendStatus?.publicMediaAccess ? "Enabled" : "Disabled"}
            />
            <DetailRow
              label="Video uploads"
              value={backendStatus?.videoUploadsLabel || "Disabled"}
            />
          </div>
          <p className="request-note">Sign in first, then return to /qa/media-approval.</p>
        </article>
      )}
    </section>
  );
}

function SupabaseStorageTestPanel({
  backendStatus,
  testState,
  onRunTest,
  onDelete,
  compact = false,
}) {
  const statusClass =
    testState?.status === "pass" ? "status-chip status-chip-success" : "status-chip";
  const sourceSummary = testState?.sourceUsed || "Not run yet";
  const fileUploadedSummary =
    testState?.fileUploaded === null
      ? "Not checked"
      : testState.fileUploaded
        ? "Yes"
        : "No";
  const signedUrlSummary =
    testState?.signedUrlCreated === null
      ? "Not checked"
      : testState.signedUrlCreated
        ? "Yes"
        : "No";
  const deletedSummary =
    testState?.deletedCleanly === null
      ? "Not checked"
      : testState.deletedCleanly
        ? "Yes"
        : "No";
  const panelKicker = compact ? "Supabase private storage test" : "QA panel";

  return (
    <article className="surface-card dashboard-panel">
      <p className="card-kicker">{panelKicker}</p>
      <h3>Supabase Storage Test</h3>
      <div className="detail-list">
        <DetailRow
          label="Current auth user email"
          value={backendStatus?.currentUserEmail || "No Supabase user signed in"}
        />
        <DetailRow
          label="Storage mode"
          value={backendStatus?.mediaStorageModeLabel || "Not Enabled"}
        />
        <DetailRow
          label="Profile photo bucket"
          value={backendStatus?.profilePhotoBucketDetectedLabel || "unknown"}
        />
        <DetailRow
          label="Thumbnail bucket"
          value={backendStatus?.highlightThumbnailBucketDetectedLabel || "unknown"}
        />
        <DetailRow
          label="Public media access"
          value={backendStatus?.publicMediaAccess ? "Yes" : "No"}
        />
        <DetailRow
          label="Video uploads"
          value={backendStatus?.videoUploadsLabel || "Disabled"}
        />
        <DetailRow
          label="Test status"
          value={<span className={statusClass}>{testState?.label || "Not run yet"}</span>}
        />
        <DetailRow
          label="Saved media asset id"
          value={testState?.savedMediaAssetId || "Not created"}
        />
        <DetailRow label="Source used" value={sourceSummary} />
        <DetailRow
          label="Uploaded object path"
          value={testState?.uploadedObjectPath || "Not uploaded"}
        />
        <DetailRow label="File uploaded" value={fileUploadedSummary} />
        <DetailRow label="Signed URL created" value={signedUrlSummary} />
        <DetailRow label="Cleanup completed" value={deletedSummary} />
        <DetailRow
          label="Upload error message"
          value={testState?.uploadErrorMessage || "None reported"}
        />
        <DetailRow
          label="Signed URL error message"
          value={testState?.signedUrlErrorMessage || "None reported"}
        />
        <DetailRow
          label="Delete error message"
          value={testState?.deleteErrorMessage || "None reported"}
        />
      </div>
      <p className="request-note">
        Run this to upload a temporary private profile photo object, create the linked `media_assets`
        row, generate a signed owner-only preview URL, and delete both the object and metadata row again.
      </p>
      <p className="request-note">{testState?.message}</p>
      {testState?.lastRanAt ? (
        <p className="request-note">Last run: {formatDisplayDate(testState.lastRanAt)}</p>
      ) : null}
      {testState?.deleteMessage ? <p className="request-note">{testState.deleteMessage}</p> : null}
      <div className="dashboard-actions">
        <button
          className="button button-primary"
          disabled={testState?.status === "running"}
          onClick={onRunTest}
          type="button"
        >
          {testState?.status === "running"
            ? "Running Private Storage Test..."
            : "Run Private Storage Metadata/Bucket Test"}
        </button>
        <button
          className="button button-secondary"
          disabled={!testState?.savedMediaAssetId || testState?.deletedCleanly === true}
          onClick={onDelete}
          type="button"
        >
          Delete Test Storage Asset
        </button>
      </div>
    </article>
  );
}

function SupabasePrivateVideoStorageTestPanel({
  backendStatus,
  testState,
  onRunTest,
  onDelete,
  compact = false,
}) {
  const statusClass =
    testState?.status === "pass"
      ? "status-chip status-chip-success"
      : testState?.status === "fallback"
        ? "status-chip status-chip-opportunity"
        : "status-chip";
  const yesNoSummary = (value) => (value === null ? "Not checked" : value ? "Yes" : "No");
  const panelKicker = compact ? "Supabase private video test" : "QA panel";

  return (
    <article className="surface-card dashboard-panel">
      <p className="card-kicker">{panelKicker}</p>
      <h3>Private Video Storage Test</h3>
      <div className="detail-list">
        <DetailRow
          label="Current auth user email"
          value={backendStatus?.currentUserEmail || "No Supabase user signed in"}
        />
        <DetailRow
          label="Video storage mode"
          value={backendStatus?.videoStorageModeLabel || "Not enabled"}
        />
        <DetailRow
          label="Video bucket detected"
          value={backendStatus?.highlightVideoBucketDetectedLabel || "unknown"}
        />
        <DetailRow label="Public video access" value="No" />
        <DetailRow
          label="Video uploads"
          value={backendStatus?.videoUploadsLabel || "Disabled"}
        />
        <DetailRow
          label="Public URLs"
          value={backendStatus?.publicMediaUrlsLabel || "Disabled"}
        />
        <DetailRow
          label="Test status"
          value={<span className={statusClass}>{testState?.label || "Not run yet"}</span>}
        />
        <DetailRow
          label="Saved highlight id"
          value={testState?.savedHighlightId || "Not created"}
        />
        <DetailRow
          label="Saved media asset id"
          value={testState?.savedMediaAssetId || "Not created"}
        />
        <DetailRow label="Source used" value={testState?.sourceUsed || "Not run yet"} />
        <DetailRow
          label="Bucket ready during test"
          value={yesNoSummary(testState?.videoBucketDetected)}
        />
        <DetailRow
          label="media_assets linked"
          value={yesNoSummary(testState?.metadataSaved)}
        />
        <DetailRow
          label="Found again on reload"
          value={yesNoSummary(testState?.foundOnReload)}
        />
        <DetailRow
          label="Real video uploaded"
          value={yesNoSummary(testState?.realFileUploaded)}
        />
        <DetailRow
          label="Upload error message"
          value={testState?.uploadErrorMessage || "None reported"}
        />
      </div>
      <p className="request-note">
        This QA path does not fake a real video upload. It checks the private
        `msr-highlight-videos` bucket path plus `media_assets` linkage, then tells you clearly that
        a manual video file upload is still required for live owner-preview proof.
      </p>
      <p className="request-note">{testState?.message}</p>
      {testState?.lastRanAt ? (
        <p className="request-note">Last run: {formatDisplayDate(testState.lastRanAt)}</p>
      ) : null}
      {testState?.deleteMessage ? <p className="request-note">{testState.deleteMessage}</p> : null}
      <div className="dashboard-actions">
        <button
          className="button button-primary"
          disabled={testState?.status === "running"}
          onClick={onRunTest}
          type="button"
        >
          {testState?.status === "running"
            ? "Running Private Video Storage Test..."
            : "Run Private Video Storage Test"}
        </button>
        <button
          className="button button-secondary"
          disabled={!testState?.savedMediaAssetId || testState?.status === "running"}
          onClick={onDelete}
          type="button"
        >
          Delete Test Video Metadata
        </button>
      </div>
    </article>
  );
}

function SupabaseFullHighlightThumbnailTestPanel({
  backendStatus,
  testState,
  onRunTest,
  compact = false,
}) {
  const statusClass =
    testState?.status === "pass"
      ? "status-chip status-chip-success"
      : testState?.status === "fallback"
        ? "status-chip status-chip-opportunity"
        : "status-chip";
  const yesNoSummary = (value) =>
    value === null ? "Not checked" : value ? "Yes" : "No";
  const panelKicker = compact ? "Supabase full thumbnail test" : "QA panel";

  return (
    <article className="surface-card dashboard-panel">
      <p className="card-kicker">{panelKicker}</p>
      <h3>Run Full Supabase Highlight Thumbnail Test</h3>
      <div className="detail-list">
        <DetailRow
          label="Current auth user email"
          value={backendStatus?.currentUserEmail || "No Supabase user signed in"}
        />
        <DetailRow
          label="Storage mode"
          value={backendStatus?.mediaStorageModeLabel || "Not Enabled"}
        />
        <DetailRow
          label="Thumbnail bucket"
          value={backendStatus?.highlightThumbnailBucketDetectedLabel || "unknown"}
        />
        <DetailRow
          label="Public media access"
          value={backendStatus?.publicMediaAccess ? "Yes" : "No"}
        />
        <DetailRow
          label="Video uploads"
          value={backendStatus?.videoUploadsLabel || "Disabled"}
        />
        <DetailRow
          label="Test status"
          value={<span className={statusClass}>{testState?.label || "Not run yet"}</span>}
        />
        <DetailRow
          label="Supabase athlete profile created/found"
          value={
            testState?.athleteProfileReady === true
              ? `Yes${testState?.athleteProfileAction ? ` - ${testState.athleteProfileAction}` : ""}`
              : yesNoSummary(testState?.athleteProfileReady)
          }
        />
        <DetailRow
          label="Supabase highlight created/found"
          value={
            testState?.highlightReady === true
              ? `Yes${testState?.highlightAction ? ` - ${testState.highlightAction}` : ""}`
              : yesNoSummary(testState?.highlightReady)
          }
        />
        <DetailRow label="Thumbnail uploaded" value={yesNoSummary(testState?.thumbnailUploaded)} />
        <DetailRow label="media_assets linked" value={yesNoSummary(testState?.mediaAssetLinked)} />
        <DetailRow
          label="Signed private preview loaded"
          value={yesNoSummary(testState?.signedPreviewLoaded)}
        />
        <DetailRow
          label="Saved athlete profile id"
          value={testState?.savedProfileId || "Not created"}
        />
        <DetailRow
          label="Saved highlight id"
          value={testState?.savedHighlightId || "Not created"}
        />
        <DetailRow
          label="Saved media asset id"
          value={testState?.savedMediaAssetId || "Not created"}
        />
        <DetailRow
          label="Current private thumbnail"
          value={testState?.currentPrivateThumbnail || "Not uploaded yet"}
        />
        <DetailRow
          label="Approval status"
          value={testState?.approvalStatus || "Pending Review"}
        />
        <DetailRow label="Visibility" value={testState?.visibilityStatus || "Private"} />
        <DetailRow label="Source used" value={testState?.sourceUsed || "Not run yet"} />
        <DetailRow
          label="Upload error message"
          value={testState?.uploadErrorMessage || "None reported"}
        />
        <DetailRow
          label="Signed URL error message"
          value={testState?.signedUrlErrorMessage || "None reported"}
        />
      </div>
      <p className="request-note">
        This test does not use the file picker. It creates or reuses a Supabase-backed athlete
        profile, creates or reuses a Supabase-backed highlight, uploads a built-in private PNG
        thumbnail to `msr-highlight-thumbnails`, links `media_assets`, and loads a signed owner-only
        preview.
      </p>
      <p className="request-note">{testState?.message}</p>
      {testState?.lastRanAt ? (
        <p className="request-note">Last run: {formatDisplayDate(testState.lastRanAt)}</p>
      ) : null}
      <div className="dashboard-actions">
        <button
          className="button button-primary"
          disabled={testState?.status === "running"}
          onClick={onRunTest}
          type="button"
        >
          {testState?.status === "running"
            ? "Running Full Supabase Highlight Thumbnail Test..."
            : "Run Full Supabase Highlight Thumbnail Test"}
        </button>
      </div>
    </article>
  );
}

function PrivateProfilePhotoUploadPanel({
  backendStatus,
  ownedProfiles,
  mediaAssets,
  mediaPreviewUrls,
  onUpload,
  onDeleteAsset,
  onLoadSignedUrl,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const targetProfile =
    ownedProfiles.find((item) => Boolean(item?.ownerUserId) && !item.isJunior) ||
    ownedProfiles.find((item) => Boolean(item?.ownerUserId)) ||
    ownedProfiles[0] ||
    null;
  const currentProfilePhotoAsset = targetProfile
    ? getLatestProfilePhotoAsset(mediaAssets, targetProfile.id)
    : null;

  useEffect(() => {
    if (currentProfilePhotoAsset?.id && mediaPreviewUrls?.[currentProfilePhotoAsset.id]) {
      setPreviewUrl(mediaPreviewUrls[currentProfilePhotoAsset.id]);
      return;
    }

    setPreviewUrl("");
  }, [currentProfilePhotoAsset?.id, mediaPreviewUrls]);

  useEffect(() => {
    setSelectedFile(null);
    setStatus("");
  }, [targetProfile?.id]);

  async function handleUpload() {
    if (!targetProfile?.id) {
      setStatus("Create a Supabase-backed athlete profile first.");
      return;
    }

    if (!selectedFile) {
      setStatus("Choose an image file first.");
      return;
    }

    setStatus("Uploading a private profile photo to your Supabase account...");
    const result = await onUpload(selectedFile, targetProfile.id);

    if (!result?.success) {
      setStatus(result?.message || "Private profile photo upload could not be completed.");
      return;
    }

    setPreviewUrl(result?.signedUrl || "");
    setSelectedFile(null);
    setStatus(
      result?.message ||
        "Private profile photo uploaded. The image stays private while approval is still pending.",
    );
  }

  async function handleLoadPreview() {
    if (!currentProfilePhotoAsset?.id) {
      setStatus("No private profile photo asset is linked to this athlete profile yet.");
      return;
    }

    setStatus("Creating a signed owner preview URL for the private profile photo...");
    const result = await onLoadSignedUrl(currentProfilePhotoAsset.id);

    if (!result?.success) {
      setStatus(result?.message || "Private profile photo preview could not be created.");
      return;
    }

    setPreviewUrl(result.signedUrl || "");
    setStatus("Private profile photo preview loaded for the signed-in owner only.");
  }

  async function handleDelete() {
    if (!currentProfilePhotoAsset?.id) {
      setStatus("No private profile photo asset is linked to this athlete profile yet.");
      return;
    }

    setStatus("Deleting the private profile photo...");
    const result = await onDeleteAsset(currentProfilePhotoAsset.id);

    if (!result?.success) {
      setStatus(result?.message || "Private profile photo delete could not be completed.");
      return;
    }

    setPreviewUrl("");
    setSelectedFile(null);
    setStatus(result?.message || "Private profile photo deleted.");
  }

  return (
    <article className="surface-card dashboard-panel private-upload-panel">
      <p className="card-kicker">Private media upload</p>
      <h3>Private profile photo upload</h3>
      <div className="detail-list">
        <DetailRow
          label="Target athlete profile"
          value={targetProfile?.displayName || "No owned athlete profile yet"}
        />
        <DetailRow
          label="Storage mode"
          value={backendStatus?.mediaStorageModeLabel || "Not Enabled"}
        />
        <DetailRow
          label="Profile photo bucket"
          value={backendStatus?.profilePhotoBucketDetectedLabel || "unknown"}
        />
        <DetailRow
          label="Public media access"
          value={backendStatus?.publicMediaAccess ? "Yes" : "No"}
        />
        <DetailRow
          label="Video uploads"
          value={backendStatus?.videoUploadsLabel || "Disabled"}
        />
        <DetailRow
          label="Current private asset"
          value={currentProfilePhotoAsset?.originalFilename || "Not uploaded yet"}
        />
        <DetailRow
          label="Approval status"
          value={getMediaApprovalDisplayLabel(currentProfilePhotoAsset)}
        />
        <DetailRow
          label="Visibility"
          value={getMediaVisibilityDisplayLabel(currentProfilePhotoAsset)}
        />
      </div>
      <MediaStatusBadgeRow
        mediaAsset={currentProfilePhotoAsset}
        previewLoaded={Boolean(previewUrl)}
        showOwnerPreview
        showPublicDisabled
      />
      <p className="request-note">
        Media stays private. Junior media requires parent/guardian approval first, and adult media stays pending admin review before broader visibility is allowed.
      </p>
      <label className="form-field">
        <span>Choose private profile photo</span>
        <input
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          type="file"
        />
        <p className="field-helper">JPG, PNG, or WEBP only. 5MB max. No public URL is created.</p>
      </label>
      {previewUrl ? (
        <img
          alt="Private profile photo preview"
          className="private-media-preview"
          src={previewUrl}
        />
      ) : null}
      <p className="request-note">
        {status ||
          (backendStatus?.uploadsEnabled
            ? getMediaOwnerPresentationMessage(currentProfilePhotoAsset, {
                emptyMessage:
                  "No private profile photo asset is linked yet. Upload one to unlock signed owner preview in this panel.",
                previewLoaded: Boolean(previewUrl),
              })
            : "Private profile photo upload needs the media_assets table plus private storage buckets before it can run.")}
      </p>
      <p className="request-note">
        If a signed preview expires, use Load Private Preview again. Signed previews are never stored as `public_url`.
      </p>
      <p className="request-note">{getMediaReviewRouteLabel(currentProfilePhotoAsset)}</p>
      <div className="dashboard-actions">
        <button className="button button-primary" onClick={handleUpload} type="button">
          Upload Private Profile Photo
        </button>
        <button
          className="button button-secondary"
          disabled={!currentProfilePhotoAsset?.id}
          onClick={handleLoadPreview}
          type="button"
        >
          Load Private Preview
        </button>
        <button
          className="button button-subtle"
          disabled={!currentProfilePhotoAsset?.id}
          onClick={handleDelete}
          type="button"
        >
          Delete Private Profile Photo
        </button>
      </div>
    </article>
  );
}

function AdminMediaReviewPanel({ athletes, currentUserId, mediaAssets, onReviewMediaAsset }) {
  const [status, setStatus] = useState("");
  const reviewableAssets = (Array.isArray(mediaAssets) ? mediaAssets : [])
    .filter(
      (asset) =>
        asset.storageSource === "supabase" &&
        asset.ownerUserId &&
        String(asset.ownerUserId) === String(currentUserId || ""),
    )
    .sort(
      (left, right) =>
        new Date(right.updatedAt || right.createdAt || 0).getTime() -
        new Date(left.updatedAt || left.createdAt || 0).getTime(),
    )
    .slice(0, 8);
  const pendingParentAssets = reviewableAssets.filter(
    (asset) => asset.approvalStatusRaw === "pending_parent_approval",
  );
  const pendingAdminAssets = reviewableAssets.filter(
    (asset) => asset.approvalStatusRaw === "pending_review",
  );
  const pendingProfilePhotos = pendingAdminAssets.filter((asset) => asset.mediaTypeRaw === "profile_photo");
  const pendingHighlightThumbnails = pendingAdminAssets.filter(
    (asset) => asset.mediaTypeRaw === "highlight_thumbnail",
  );
  const pendingHighlightVideos = pendingAdminAssets.filter(
    (asset) => asset.mediaTypeRaw === "highlight_video",
  );

  return (
    <article className="surface-card dashboard-panel">
      <p className="card-kicker">Media review</p>
      <h3>Owner-scoped media approval controls</h3>
      <p className="card-body">
        This phase keeps media review owner-scoped and demo-safe. Cross-account admin media access
        can come later after safer role-aware RLS is designed.
      </p>
      <div className="detail-list compact-detail-list">
        <DetailRow label="Profile photos pending review" value={String(pendingProfilePhotos.length)} />
        <DetailRow
          label="Highlight thumbnails pending review"
          value={String(pendingHighlightThumbnails.length)}
        />
        <DetailRow
          label="Highlight videos pending review"
          value={String(pendingHighlightVideos.length)}
        />
        <DetailRow
          label="Junior media pending parent approval"
          value={String(pendingParentAssets.length)}
        />
        <DetailRow
          label="Adult media pending admin review"
          value={String(pendingAdminAssets.filter((asset) => !asset.isJuniorMedia).length)}
        />
      </div>
      {status ? <p className="request-note">{status}</p> : null}
      {reviewableAssets.length === 0 ? (
        <p className="request-note">
          No current-user private media assets are ready for review controls yet.
        </p>
      ) : null}
      <div className="review-stack">
        {reviewableAssets.map((asset) => {
          const athlete =
            athletes.find((item) => item.id === asset.athleteProfileId) || null;

          return (
            <div className="review-row" key={asset.id}>
              <h4>{asset.originalFilename || asset.id}</h4>
              <p>
                {joinMeta([
                  asset.mediaType === "Highlight Thumbnail"
                    ? "Highlight thumbnail"
                    : asset.mediaType === "Highlight Video"
                      ? "Highlight video"
                      : "Profile photo",
                  athlete?.displayName || "Athlete not linked",
                  athlete?.sport || "",
                ])}
              </p>
              <p className="request-note">
                Approval: {getMediaApprovalDisplayLabel(asset)} / Visibility:{" "}
                {getMediaVisibilityDisplayLabel(asset)} / {getMediaReviewRouteLabel(asset)}
              </p>
              <MediaStatusBadgeRow
                leadingBadges={[
                  { label: asset.mediaType || "Private Media", tone: "neutral" },
                  { label: "Owner Scoped", tone: "private" },
                ]}
                mediaAsset={asset}
                showPublicDisabled
                showVideoPrivate={asset.mediaTypeRaw === "highlight_video"}
              />
              <div className="dashboard-actions">
                <button
                  className="button button-primary"
                  onClick={async () => {
                    const result = await onReviewMediaAsset(asset.id, "approve");
                    setStatus(result?.message || "Media approved.");
                  }}
                  type="button"
                >
                  Approve Media
                </button>
                <button
                  className="button button-secondary"
                  onClick={async () => {
                    const result = await onReviewMediaAsset(asset.id, "keep_private");
                    setStatus(result?.message || "Media approved and kept private.");
                  }}
                  type="button"
                >
                  Keep Private
                </button>
                <button
                  className="button button-secondary"
                  onClick={async () => {
                    const result = await onReviewMediaAsset(asset.id, "reject");
                    setStatus(result?.message || "Media rejected.");
                  }}
                  type="button"
                >
                  Reject Media
                </button>
                <button
                  className="button button-subtle"
                  onClick={async () => {
                    const result = await onReviewMediaAsset(asset.id, "archive");
                    setStatus(result?.message || "Media archived.");
                  }}
                  type="button"
                >
                  Archive Media
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function HomePage({
  featuredAthlete,
  athletes,
  highlights,
  verifiedPartners,
  selectedRole,
  adminQueues,
  requestRows,
}) {
  const spotlight = featuredAthlete || athletes[0] || null;
  const featuredHighlight = spotlight ? getPrimaryHighlight(highlights, spotlight.id) : null;
  const [selectedHomepageSport, setSelectedHomepageSport] = useState("Rugby League");
  const pilot2460Directory = getNearbySportsDirectory({ postcode: "2460", state: "NSW" });
  const pilot2460Clubs = getClubSuggestionsByPostcode({
    postcode: "2460",
    sport: "Rugby League",
  }).slice(0, 2);
  const pilot2460Sports = pilot2460Directory.sports.slice(0, 11);
  const pilotProfileLink =
    "/create-profile?pilot=2460&state=NSW&postcode=2460&suburb=South%20Grafton&sport=Rugby%20League&club=South%20Grafton%20Rebels";
  const trustPillars = [
    {
      title: "Built for Safety",
      copy: "Role-aware visibility, under-18 protection, and region-only presentation stay built in.",
    },
    {
      title: "Parent Approved",
      copy: "Junior pathways keep profile approvals, highlights, and requests parent or guardian controlled.",
    },
    {
      title: "Trusted Network",
      copy: "Designed for athletes, families, clubs, schools, academies, scouts, and local teams.",
    },
    {
      title: "Contact Requests Only",
      copy: "No direct messaging. Safe outreach stays structured and reviewable inside the platform.",
    },
  ];
  const featureCards = [
    {
      marker: "JR",
      eyebrow: "Athlete pathway",
      title: "Junior Athletes",
      copy: "Build a player-ready resume with highlights, pathway detail, and parent-controlled visibility.",
      points: ["Parent approval flow", "Safe contact routes", "Public resume preview"],
      to: "/create-profile",
      cta: "Start Pathway",
    },
    {
      marker: "18+",
      eyebrow: "Senior pathway",
      title: "18+ Players",
      copy: "Create a serious profile for clubs, first-grade opportunities, school sport, and relocation-ready discovery.",
      points: ["Availability settings", "Shareable public resume", "Scout-ready profile strength"],
      to: "/create-profile",
      cta: "Build Resume",
    },
    {
      marker: "CLB",
      eyebrow: "Recruitment desk",
      title: "Clubs & Scouts",
      copy: "Search verified athlete resumes, shortlist talent, and request contact without adding messaging clutter.",
      points: ["Premium athlete search", "Shortlist workflow", "Safe outreach only"],
      to: "/search",
      cta: "Open Search",
    },
    {
      marker: "SAFE",
      eyebrow: "Family control",
      title: "Parent Safety",
      copy: "Guardians stay in control of approvals, visibility settings, and contact pathways for under-18 athletes.",
      points: ["Approval queues", "Visibility controls", "Request history"],
      to: "/parent",
      cta: "View Controls",
    },
    {
      marker: "HL",
      eyebrow: "Resume proof",
      title: "Highlights Showcase",
      copy: "Show proof cards, not social posts, with verification context, featured clips, and Talent Boost visibility.",
      points: ["Featured highlight cards", "Approval-led showcase", "Profile-linked evidence"],
      to: "/highlights",
      cta: "Browse Highlights",
    },
    {
      marker: "OPP",
      eyebrow: "Opportunity board",
      title: "Opportunities Board",
      copy: "Browse structured pathways for trials, signings, academies, schools, and development squads.",
      points: ["Safe interest flow", "Verified opportunity labels", "Australia-focused discovery"],
      to: "/opportunities",
      cta: "See Opportunities",
    },
  ];
  const proofStripItems = [
    {
      title: "Built for athletes",
      copy: "Player-card profiles, structured stats, highlights, and pathway detail.",
    },
    {
      title: "Backed by families",
      copy: "Junior approvals, visibility control, and safe request routing.",
    },
    {
      title: "Junior and senior profiles",
      copy: "One platform for under-18 pathways and 18+ opportunity discovery.",
    },
    {
      title: "Verified clubs and scouts",
      copy: "Discovery tools designed for real clubs, schools, academies, and recruiters.",
    },
    {
      title: "Safe contact requests",
      copy: "Contact requests only, with structured outreach and no direct messaging.",
    },
    {
      title: "Built for Australia",
      copy: "Australian sports directory, age groups, and competition structures already built in.",
    },
  ];
  const heroHeadline = ["ONE PROFILE.", "EVERY OPPORTUNITY."];

  return (
    <section className="page-stack concept-home">
      <section className="hero-stage concept-hero-stage">
        <article className="hero-card premium-hero concept-hero-shell concept-hero-shell-visual-first">
          <div className="hero-copy concept-hero-copy">
            <div className="hero-pretitle-row">
              <span className="hero-shield-mark" aria-hidden="true">
                <img src={mySportsResumeApprovedLogo} alt="" />
              </span>
              <p className="eyebrow">Built for Australian sport</p>
            </div>
            <p className="hero-tagline">The sports resume for talent that deserves to be seen.</p>
            <h2 className="stacked-hero-headline">
              {heroHeadline.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
            <p className="hero-text">
              Create a sports resume, upload highlights privately, and find clubs or opportunities
              safely with contact requests only.
            </p>
            <p className="hero-keyline">Parent-safe. No DMs. Contact requests only.</p>
            <div className="cta-row">
              <Link className="button button-primary" to="/create-profile">
                Build Your Profile
              </Link>
              <Link className="button button-secondary" to="/opportunities">
                Find Opportunities
              </Link>
              <Link className="button button-subtle" to={pilotProfileLink}>
                Start 2460 Pilot Flow
              </Link>
            </div>
            <div className="badge-row hero-trust-row">
              {trustPillars.map((item) => (
                <span className="badge hero-trust-badge" key={item.title}>
                  {item.title}
                </span>
              ))}
            </div>
          </div>
          <div className="hero-visual-panel hero-banner-panel">
            <img
              alt="My Sports Resume multi-sport hero banner"
              src={msrHeroBanner}
            />
            <div className="hero-banner-overlay-card">
              <p className="card-kicker">Pilot-ready platform</p>
              <h3>Pick your sport. Find your club. Get seen safely.</h3>
              <p className="card-body">
                Built for parents, athletes, clubs, and scouts with private highlights and contact requests only.
              </p>
              <div className="badge-row">
                <span className="badge">Private highlights</span>
                <span className="badge">Parent-safe</span>
                <span className="badge">No direct messaging</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="home-preview-split">
        <article className="surface-card home-preview-card">
          <div className="concept-preview-header">
            <p className="card-kicker">Resume preview</p>
            <span className="status-chip status-chip-success">
              {spotlight && isVerifiedProfile(spotlight) ? "Verified athlete" : "Resume preview"}
            </span>
          </div>
          {spotlight ? (
            <ProfilePreviewCard athlete={spotlight} highlight={featuredHighlight} compact />
          ) : (
            <article className="surface-card profile-preview-card empty-state-card">
              <p className="card-kicker">No profile loaded</p>
              <h3>Create the first premium athlete resume</h3>
              <p className="card-body">
                Use the profile builder to load a player card into the experience.
              </p>
              <Link className="button button-primary" to="/create-profile">
                Build Your Profile
              </Link>
            </article>
          )}
        </article>
        <article className="surface-card home-flow-card">
          <p className="card-kicker">How it works</p>
          <h3>Built for real local sport, not a social feed</h3>
          <div className="checklist">
            {[
              "Choose your sport.",
              "Enter your postcode.",
              "Pick your club or team.",
              "Build your resume.",
              "Upload highlights privately.",
              "Get seen safely through contact requests only.",
            ].map((item) => (
              <div className="check-item" key={item}>
                <span className="check-mark done" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <SportPathwayStrip
        description="Choose your sport, build your sports resume, and find clubs near your postcode."
        selectedSport={selectedHomepageSport}
        onSelectSport={setSelectedHomepageSport}
        ctaItems={[
          { label: "Find clubs near your postcode", to: "/create-profile", variant: "button button-secondary" },
          { label: "Build your sports resume", to: "/create-profile", variant: "button button-primary" },
        ]}
        contextNote="Choose the sport first, then postcode, club, age group, and position."
      />

      <section className="surface-card pilot-mode-card">
        <div className="pilot-mode-copy">
          <p className="card-kicker">2460 Pilot Mode</p>
          <h3>South Grafton / Clarence Valley pilot</h3>
          <p className="card-body">
            For the first local pilot, start with your postcode, pick your club, and build a
            private sports resume in minutes.
          </p>
          <div className="badge-row">
            <span className="badge">Postcode 2460</span>
            <span className="badge">Rugby League featured</span>
            <span className="badge">Private highlights only</span>
            <span className="badge">No direct messaging</span>
          </div>
          <div className="cta-row">
            <Link className="button button-primary" to={pilotProfileLink}>
              Create Junior Profile
            </Link>
            <Link
              className="button button-secondary"
              to="/highlight-manager?athleteId=athlete-junior-rugby-nsw"
            >
              Upload Highlights Privately
            </Link>
            <Link className="button button-secondary" to="/resume/athlete-junior-rugby-nsw">
              View Safe Contact Rules
            </Link>
            <Link className="button button-subtle" to="/opportunities">
              Browse Local Opportunities
            </Link>
          </div>
          <p className="request-note">
            Parent approval and contact-request safety remain in place throughout the pilot.
          </p>
        </div>
        <div className="pilot-mode-directory">
          <p className="card-kicker">{pilot2460Directory.areaLabel || "Grafton starter directory"}</p>
          <h4>Suggested sports and clubs near 2460</h4>
          <div className="badge-row">
            {pilot2460Sports.map((sport) => (
              <span className="badge" key={sport}>
                {sport}
              </span>
            ))}
          </div>
          <div className="club-suggestion-grid">
            {pilot2460Clubs.map((club) => (
              <article className="club-suggestion-button static" key={club.id}>
                <strong>{club.clubName}</strong>
                <span>{joinMeta([club.sport, club.suburb, club.postcode])}</span>
              </article>
            ))}
            <article className="club-suggestion-button static">
              <strong>My club is not listed</strong>
              <span>Added manually - pending verification</span>
            </article>
          </div>
        </div>
      </section>

      <section className="surface-card concept-trust-strip">
        {trustPillars.map((item) => (
          <article className="concept-trust-item" key={item.title}>
            <p className="card-kicker">{item.title}</p>
            <p className="card-body">{item.copy}</p>
          </article>
        ))}
      </section>

      <section className="content-section concept-feature-section">
        <div className="audience-grid concept-feature-grid">
          {featureCards.map((item) => (
            <AudienceCard
              key={item.title}
              marker={item.marker}
              eyebrow={item.eyebrow}
              title={item.title}
              copy={item.copy}
              points={item.points}
              to={item.to}
              cta={item.cta}
            />
          ))}
        </div>
      </section>

      <section className="surface-card concept-proof-strip">
        {proofStripItems.map((item) => (
          <article className="concept-proof-item" key={item.title}>
            <p className="card-kicker">{item.title}</p>
            <p className="card-body">{item.copy}</p>
          </article>
        ))}
      </section>
    </section>
  );
}

function RoleDashboardPage({
  selectedRole,
  athlete,
  athletes,
  highlights,
  mediaAssets,
  mediaPreviewUrls,
  currentUserId,
  opportunities,
  shortlist,
  contactRequests,
  requestMap,
  requestRows,
  queues,
  onRequestContact,
  onRemoveShortlist,
  onReset,
}) {
  const latestManagedProfile =
    getLatestRoleProfile(athletes, selectedRole, true) ||
    getLatestRoleProfile(athletes, selectedRole);

  if (selectedRole === "junior_athlete" || selectedRole === "adult_athlete") {
    if (!latestManagedProfile) {
      return (
        <section className="page-stack">
          <SectionHeading
            eyebrow={getRoleConfig(selectedRole).eyebrow}
            title="My Profile"
            description="Your latest sports resume appears here, whether it is saved on this device or already saved securely."
          />
          <article className="surface-card empty-state-card">
            <p className="card-kicker">No athlete profile yet</p>
            <p className="card-body">Create your sports resume to see it here.</p>
            <div className="cta-row">
              <Link className="button button-primary" to="/create-profile">
                Create Your Sports Resume
              </Link>
              <Link className="button button-secondary" to="/start">
                Switch Role
              </Link>
            </div>
          </article>
        </section>
      );
    }

    return (
      <AthleteDashboardPage
        athlete={latestManagedProfile}
        requestMap={requestMap}
        athletes={athletes}
        highlights={highlights}
        mediaAssets={mediaAssets}
        mediaPreviewUrls={mediaPreviewUrls}
        currentUserId={currentUserId}
      />
    );
  }

  if (selectedRole === "parent_guardian") {
    const childProfile = latestManagedProfile;
    const pendingProfiles = athletes.filter(
      (item) => item.isJunior && item.profileStatus === "Pending Parent Approval",
    ).length;
    const pendingHighlights = highlights.filter(
      (item) => item.isJunior && item.approvalStatus === "Pending Parent Approval",
    ).length;
    const opportunityInterestRows = contactRequests
      .filter(
        (item) =>
          item.requestType === "opportunity_interest" && item.to === "parent_guardian",
      )
      .map((request) => ({
        request,
        athlete: athletes.find((item) => item.id === request.athleteId) || null,
        opportunity: opportunities.find((item) => item.id === request.opportunityId) || null,
      }))
      .filter((item) => item.athlete && item.opportunity);

    return (
      <section className="page-stack">
        <article className="surface-card dashboard-hero">
          <div className="dashboard-hero-copy">
            <p className="eyebrow">Parent / guardian dashboard</p>
            <h2>Safe oversight for junior athlete resumes</h2>
            <p className="hero-text">
              Review profile visibility, approvals, and contact requests without exposing junior athletes to direct messaging.
            </p>
            <div className="badge-row">
              <span className="status-chip status-chip-success">Parent-controlled contact route</span>
              <span className="status-chip">No direct messaging</span>
            </div>
          </div>
          <div className="dashboard-actions">
            <Link className="button button-primary" to="/parent">
              Open Approvals
            </Link>
            <Link className="button button-secondary" to="/requests">
              View Contact Requests
            </Link>
            <Link className="button button-subtle" to="/start">
              Switch Role
            </Link>
          </div>
        </article>

        <div className="dashboard-stat-grid">
          <MetricCard
            label="Pending profile approvals"
            value={`${pendingProfiles}`}
            detail="Junior profiles still waiting for parent or guardian approval"
            tone="gold"
          />
          <MetricCard
            label="Pending highlight approvals"
            value={`${pendingHighlights}`}
            detail="Controlled highlight clips waiting for a guardian decision"
            tone="blue"
          />
          <MetricCard
            label="Requests routed to guardian"
            value={`${requestRows.length}`}
            detail="All under-18 contact requests stay inside the parent pathway"
            tone="success"
          />
          <MetricCard
            label="Opportunity interests"
            value={`${opportunityInterestRows.length}`}
            detail="Junior opportunity interest records waiting in the safe route"
            tone="gold"
          />
        </div>

        <div className="two-up-grid">
          <article className="surface-card dashboard-panel">
            <p className="card-kicker">Child profile view</p>
            <h3>Latest junior resume</h3>
            {childProfile ? (
              <ProfileResumeCard athlete={childProfile} />
            ) : (
              <article className="surface-card nested-card empty-state-card">
                <p className="card-body">Create your sports resume to see it here.</p>
              </article>
            )}
          </article>

          <article className="surface-card dashboard-panel">
            <p className="card-kicker">Safety reminder</p>
            <h3>Controlled visibility only</h3>
            <div className="checklist">
              {[
                "No direct messaging. Contact requests only.",
                "Junior contact requests route to parent or guardian only.",
                "Use approvals and visibility controls before wider discovery.",
              ].map((item) => (
                <div className="check-item" key={item}>
                  <span className="check-mark done" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-card dashboard-panel">
            <p className="card-kicker">Opportunity routing</p>
            <h3>Junior opportunity interest activity</h3>
            {opportunityInterestRows.length === 0 ? (
              <p className="card-body">No junior opportunity interests are waiting right now.</p>
            ) : null}
            <div className="review-stack">
              {opportunityInterestRows.slice(0, 4).map(({ request, athlete, opportunity }) => (
                <div className="review-row" key={request.id}>
                  <h4>{opportunity.title}</h4>
                  <p>{joinMeta([opportunity.organisation, athlete.displayName, athlete.sport])}</p>
                  <p className="request-note">
                    Status: {request.status} / {getOpportunityContactNote(opportunity)}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (selectedRole === "club_scout") {
    const verifiedProfiles = athletes.filter(isVerifiedProfile).length;
    const shortlistRows = shortlist
      .map((item) => ({
        item,
        athlete: athletes.find((candidate) => candidate.id === item.athleteId) || null,
        request: requestMap[item.athleteId] || null,
      }))
      .filter((item) => item.athlete);
    const pendingOpportunities = opportunities.filter(shouldQueueOpportunityForAdmin).length;

    return (
      <section className="page-stack">
        <article className="surface-card dashboard-hero">
          <div className="dashboard-hero-copy">
            <p className="eyebrow">Club / scout dashboard</p>
            <h2>Recruitment desk</h2>
            <p className="hero-text">
              Search athlete resumes, use verified filters, and request contact safely through the correct pathway.
            </p>
            <div className="badge-row">
              <span className="status-chip status-chip-success">Verified profile filters</span>
              <span className="status-chip">Under-18 routes to guardian</span>
              <span className="status-chip">Contact requests only</span>
            </div>
          </div>
          <div className="dashboard-actions">
            <Link className="button button-primary" to="/search">
              Search Athletes
            </Link>
            <Link className="button button-secondary" to="/opportunities">
              View Opportunities
            </Link>
            <Link className="button button-secondary" to="/verification-request">
              Request Verification
            </Link>
            <Link className="button button-subtle" to="/shortlist">
              Open Shortlist
            </Link>
          </div>
        </article>

        <div className="dashboard-stat-grid">
          <MetricCard
            label="Athlete resumes"
            value={`${athletes.length}`}
            detail="Searchable athlete cards across the sports directory"
            tone="gold"
          />
          <MetricCard
            label="Verified profiles"
            value={`${verifiedProfiles}`}
            detail="Profiles carrying trust signals for cleaner shortlist review"
            tone="blue"
          />
          <MetricCard
            label="Requests created"
            value={`${requestRows.length}`}
            detail="Structured contact requests and opportunity interests created from search and profile views"
            tone="success"
          />
          <MetricCard
            label="Shortlist records"
            value={`${shortlistRows.length}`}
            detail="Athletes saved for later review"
            tone="gold"
          />
          <MetricCard
            label="Pending opportunities"
            value={`${pendingOpportunities}`}
            detail="Opportunity records currently waiting for admin verification"
            tone="blue"
          />
        </div>

        <div className="two-up-grid">
          <article className="surface-card dashboard-panel">
            <p className="card-kicker">Recruitment workflow</p>
            <h3>What this role can do</h3>
            <div className="checklist">
              {[
                "Search by sport, age group, competition level, state, region, and team.",
                "Use verified-only and verified-club filters to narrow the board.",
                "Request contact safely through the platform route.",
              ].map((item) => (
                <div className="check-item" key={item}>
                  <span className="check-mark done" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-card dashboard-panel">
            <p className="card-kicker">Shortlist snapshot</p>
            <h3>Saved athlete resumes</h3>
            {shortlistRows.length === 0 ? (
              <p className="card-body">No shortlisted athletes yet.</p>
            ) : null}
            <div className="review-stack">
              {shortlistRows.slice(0, 4).map(({ item, athlete: shortlistedAthlete, request }) => {
                const hasContactRequest = (request?.contactRequestCount || 0) > 0;

                return (
                  <div className="review-row" key={item.id}>
                    <h4>{shortlistedAthlete.displayName}</h4>
                    <p>
                      {joinMeta([
                        shortlistedAthlete.sport,
                        shortlistedAthlete.position,
                        getLocationSummary(shortlistedAthlete),
                      ])}
                    </p>
                    <p className="request-note">
                      {calculateProfileCompleteness(shortlistedAthlete)}% complete /{" "}
                      {getTeamVerificationLabel(shortlistedAthlete)}
                    </p>
                    <div className="review-actions">
                      <Link className="button button-secondary" to={`/resume/${shortlistedAthlete.id}`}>
                        View Resume
                      </Link>
                      <button
                        className={hasContactRequest ? "button button-subtle" : "button button-primary"}
                        disabled={hasContactRequest}
                        onClick={async () => {
                          await onRequestContact(shortlistedAthlete.id, selectedRole);
                        }}
                        type="button"
                      >
                        {hasContactRequest ? "Contact Requested" : "Create Contact Request"}
                      </button>
                      <button
                        className="button button-subtle"
                        onClick={() => onRemoveShortlist(shortlistedAthlete.id)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <article className="surface-card dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Admin / demo reviewer</p>
          <h2>Review desk</h2>
          <p className="hero-text">
            Track pending profile reviews, verification requests, sports directory readiness, and demo reset controls from one place.
          </p>
        </div>
        <div className="dashboard-actions">
          <Link className="button button-primary" to="/admin">
            Open Review Console
          </Link>
          <Link className="button button-secondary" to="/directory">
            View Sports Directory
          </Link>
          <button className="button button-subtle" onClick={onReset} type="button">
            Reset Demo Data
          </button>
        </div>
      </article>

      <div className="dashboard-stat-grid">
        <MetricCard
          label="Pending reviews"
          value={`${queues.pendingProfiles.length + queues.pendingHighlights.length + queues.pendingOpportunities.length + queues.flaggedContent.length}`}
          detail="Profiles, highlights, opportunities, and flagged content waiting for review"
          tone="gold"
        />
        <MetricCard
          label="Verification requests"
          value={`${queues.verificationRequests.length}`}
          detail="Club, coach, school, and academy requests currently in the queue"
          tone="blue"
        />
        <MetricCard
          label="Sports directory"
          value={`${getSimpleSportOptions().length} visible sports`}
          detail={`${teamDirectorySeed.length} starter clubs / teams plus internal catalogue grouping`}
          tone="success"
        />
        <MetricCard
          label="Live opportunities"
          value={`${opportunities.length}`}
          detail={`${opportunities.filter(isOpportunityVerified).length} verified / ${shortlist.length} shortlist records`}
          tone="blue"
        />
      </div>

      <div className="two-up-grid">
        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Trust reminders</p>
          <h3>Platform safety posture</h3>
          <div className="checklist">
            {[
              "No direct messaging. Contact requests only.",
              "Under-18 contact stays controlled by the parent or guardian route.",
              "Directory imports can expand later without changing the V1 local demo model.",
            ].map((item) => (
              <div className="check-item" key={item}>
                <span className="check-mark done" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Queue snapshot</p>
          <h3>What needs attention now</h3>
          <div className="detail-list">
            <DetailRow label="Profile reviews" value={String(queues.pendingProfiles.length)} />
            <DetailRow label="Highlight reviews" value={String(queues.pendingHighlights.length)} />
            <DetailRow label="Verification queue" value={String(queues.verificationRequests.length)} />
            <DetailRow label="Flagged content" value={String(queues.flaggedContent.length)} />
          </div>
        </article>
      </div>
    </section>
  );
}

function AthleteDashboardPage({
  athlete,
  requestMap,
  athletes,
  highlights,
  mediaAssets,
  mediaPreviewUrls,
  currentUserId,
}) {
  const [actionStatus, setActionStatus] = useState("");
  const profile = athlete || athletes?.[0] || null;

  if (!profile) {
    return (
      <section className="page-stack">
        <SectionHeading
          eyebrow="Athlete dashboard"
          title="No active athlete profile found"
          description="Create a profile to unlock the athlete control room."
        />
        <article className="surface-card empty-state-card">
          <Link className="button button-primary" to="/create-profile">
            Create Your Profile
          </Link>
        </article>
      </section>
    );
  }

  const request = requestMap[profile.id];
  const completion = calculateCompletion(profile);
  const checklist = buildChecklist(profile);
  const completionText =
    completion >= 90
      ? "Your sports resume is in strong shape for clubs and scouts."
      : `${Math.max(1, Math.round(20 - completion / 5))} upgrade step(s) remain.`;
  const visibility = profile.visibilityStatus || "Private";
  const profileHighlights = getHighlightsForAthlete(highlights, profile.id);
  const featuredHighlight = profileHighlights.find((item) => item.isFeatured) || profileHighlights[0] || null;
  const strengthLabel = getProfileStrengthLabel(completion, profile);
  const keyStat = getPrimaryStat(profile);
  const keyAchievement = getKeyAchievement(profile);
  const nextSteps = checklist.filter((item) => !item.complete).slice(0, 3);
  const profilePhotoAsset = getLatestProfilePhotoAsset(mediaAssets, profile.id);
  const canSignedInViewProfileMedia = Boolean(
    currentUserId && String(profile.ownerUserId || "") === String(currentUserId || ""),
  );
  const profilePhotoPreviewUrl =
    canSignedInViewProfileMedia && canManagedSignedInPreviewMedia(profilePhotoAsset, currentUserId)
      ? mediaPreviewUrls?.[profilePhotoAsset.id] || ""
      : "";
  const actionCards = [
    {
      title: "Continue editing profile",
      copy: "Keep building the sports resume sections that still need more context.",
      cta: "Continue Editing",
      to: "/create-profile",
    },
    {
      title: "View public resume",
      copy: "Open the full public-facing athlete resume and review how it reads to clubs.",
      cta: "View Resume",
      to: `/resume/${profile.id}`,
    },
    {
      title: "Go to Highlight Manager",
      copy: "Add, edit, feature, and review the clip library attached to this sports resume.",
      cta: "Manage Highlights",
      to: `/highlight-manager?athleteId=${profile.id}`,
    },
  ];
  if (profile.isJunior) {
    actionCards.push({
      title: "Go to Parent Dashboard",
      copy: "Junior contact and visibility remain controlled by the parent or guardian workflow.",
      cta: "Open Parent Dashboard",
      to: "/parent",
    });
  }
  if (profile.profileStatus === "Pending Verification") {
    actionCards.push({
      title: "Go to Admin Dashboard",
      copy: "This profile is waiting for a review decision before broader visibility.",
      cta: "Open Admin Dashboard",
      to: "/admin",
    });
  }

  async function handleCopyDemoLink() {
    const shareUrl = getDemoShareUrl(profile.id);
    const copied = await copyTextToClipboard(shareUrl);

    setActionStatus(
      copied
        ? "Resume link copied. Private media still stays protected."
        : `Resume link: ${shareUrl}. Private media still stays protected.`,
    );
  }

  function handlePrintResume() {
    const printUrl = getDemoShareUrl(profile.id, { print: true });

    if (typeof window !== "undefined") {
      window.open(printUrl, "_blank", "noopener,noreferrer");
    }

    setActionStatus("Print-ready public resume opened in a new tab.");
  }

  return (
    <section className="page-stack">
      <article className="surface-card dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Athlete control room</p>
          <h2>{profile.displayName}</h2>
          <p className="hero-text">
            {joinMeta([
              profile.sport,
              profile.position,
              profile.competitionLevel,
              getLocationSummary(profile),
            ])}
          </p>
          <div className="badge-row">
            <span className="status-chip status-chip-success">
              {isVerifiedProfile(profile) ? "Verified profile" : "Verification pending"}
            </span>
            <span className="status-chip status-chip-opportunity">
              {getOpportunityCount(profile) > 0
                ? "Open to opportunities"
                : "Opportunity status not set"}
            </span>
            <span className="status-chip">{visibility}</span>
            <span className="status-chip">{strengthLabel}</span>
          </div>
        </div>

        <div className="dashboard-actions">
          <Link className="button button-primary" to={`/resume/${profile.id}`}>
            Preview Resume
          </Link>
          <button className="button button-secondary" onClick={handleCopyDemoLink} type="button">
            Copy Resume Link
          </button>
          <button className="button button-subtle" onClick={handlePrintResume} type="button">
            Print Resume
          </button>
          <Link className="button button-subtle" to={`/highlight-manager?athleteId=${profile.id}`}>
            Manage Highlights
          </Link>
        </div>
      </article>

      {actionStatus ? <p className="banner banner-success">{actionStatus}</p> : null}

      <div className="dashboard-stat-grid">
        <MetricCard
          label="Profile completion"
          value={`${completion}%`}
          detail={`${strengthLabel}. ${completionText}`}
          tone="gold"
          progress={completion}
        />
        <MetricCard
          label="Verification status"
          value={profile.profileStatus}
          detail={`${getVerificationSummary(profile)} ${getTeamVerificationLabel(profile)}.`}
          tone="success"
        />
        <MetricCard
          label="Visibility status"
          value={visibility}
          detail={`Safe route: ${getContactRouteLabel(profile.contactRoute)}`}
          tone="blue"
        />
        <MetricCard
          label="Recent profile interest"
          value={`${request?.count || 0}`}
          detail={`Key achievement: ${keyAchievement}`}
          tone="success"
        />
      </div>

      <section className="content-section">
        <SectionHeading
          eyebrow="Quick actions"
          title="What to improve next"
          description="Treat the dashboard like your athlete control room for profile quality and discovery readiness."
        />
        <div className="card-grid">
          {actionCards.map((item) => (
            <article className="surface-card action-tile-card" key={item.title}>
              <p className="card-kicker">Quick action</p>
              <h3>{item.title}</h3>
              <p className="card-body">{item.copy}</p>
              <Link className="button button-secondary" to={item.to}>
                {item.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <div className="dashboard-main-grid">
        <article className="surface-card checklist-card">
          <p className="card-kicker">Resume checklist</p>
          <h3>What to tighten next</h3>
          <div className="checklist">
            {checklist.map((item) => (
              <div className="check-item" key={item.label}>
                <span className={item.complete ? "check-mark done" : "check-mark"} />
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Visibility and trust</p>
          <h3>What recruiters can see</h3>
          <p className="card-body">{deriveStatusMessage(profile)}</p>
          <div className="detail-list">
            <DetailRow label="Contact route" value={getContactRouteLabel(profile.contactRoute)} />
            <DetailRow label="Requests logged" value={String(request?.count || 0)} />
            <DetailRow label="Opportunity status" value={String(getOpportunityCount(profile))} />
            <DetailRow label="Key stat" value={`${keyStat.label} / ${keyStat.value}`} />
          </div>
        </article>

        <article className="surface-card dashboard-panel private-upload-panel">
          <p className="card-kicker">Private image workflow</p>
          <h3>Private profile photo</h3>
          <div className="search-card-header">
            <AthleteAvatar athlete={profile} large mediaUrl={profilePhotoPreviewUrl} />
            <div>
              <p className="card-body">
                {profilePhotoPreviewUrl
                  ? "This owner-only preview comes from a short-lived signed private URL and does not appear on the public resume."
                  : "The fallback avatar stays in place here until approved private profile media is ready for signed owner preview."}
              </p>
              <MediaStatusBadgeRow
                mediaAsset={profilePhotoAsset}
                previewLoaded={Boolean(profilePhotoPreviewUrl)}
                showOwnerPreview
                showPublicDisabled
              />
              <p className="request-note">
                {getMediaOwnerPresentationMessage(profilePhotoAsset, {
                  emptyMessage:
                    "No private profile photo asset is linked yet. The fallback avatar remains active until a signed owner preview is available.",
                  previewLoaded: Boolean(profilePhotoPreviewUrl),
                })}
              </p>
              <p className="request-note">{getMediaReviewRouteLabel(profilePhotoAsset)}</p>
            </div>
          </div>
          <div className="detail-list">
            <DetailRow
              label="Approval status"
              value={getMediaApprovalDisplayLabel(profilePhotoAsset)}
            />
            <DetailRow
              label="Visibility"
              value={getMediaVisibilityDisplayLabel(profilePhotoAsset)}
            />
            <DetailRow
              label="Review route"
              value={getMediaReviewRouteLabel(profilePhotoAsset)}
            />
          </div>
        </article>

        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Suggested next steps</p>
          <h3>{nextSteps.length > 0 ? "Highest impact upgrades" : "Your profile is in strong shape"}</h3>
          <p className="card-body">
            {nextSteps.length > 0
              ? "These are the fastest ways to make the public resume feel more complete."
              : "Keep refining highlights and current-season details so the profile stays fresh."}
          </p>
          <div className="checklist">
            {(nextSteps.length > 0 ? nextSteps : checklist.slice(0, 3)).map((item) => (
              <div className="check-item" key={item.label}>
                <span className={item.complete ? "check-mark done" : "check-mark"} />
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <section className="content-section">
        <SectionHeading
          eyebrow="Public resume"
          title="Your premium player card"
          description="A clean recruiting-facing preview with safe contact routing."
        />
        <div className="card-grid card-grid-two">
          <ProfileResumeCard
            athlete={profile}
            mediaUrl={profilePhotoPreviewUrl}
            ownerMediaNote={
              canSignedInViewProfileMedia
                ? profilePhotoPreviewUrl
                  ? "Approved private profile photo preview is visible here to the signed-in owner only. Public unauthenticated media access stays disabled."
                  : profilePhotoAsset
                    ? `${getMediaApprovalDisplayLabel(profilePhotoAsset)} / ${getMediaVisibilityDisplayLabel(profilePhotoAsset)}. Approved private profile photos appear here for the signed-in owner only once the signed preview is available.`
                    : "No private profile photo asset is linked yet. Approved private profile photos appear here for the signed-in owner only once the signed preview is available."
                : ""
            }
          />
          <article className="surface-card dashboard-panel">
            <p className="card-kicker">Resume actions</p>
            <h3>Share-ready profile</h3>
            <p className="card-body">
              Use the public profile as the clean link you send to clubs, coaches, and scouts.
            </p>
            <p className="request-note">{getSafeRequestMessage(request, profile.contactRoute)}</p>
            <div className="cta-row">
              <Link className="button button-secondary" to={`/resume/${profile.id}`}>
                View Public Resume
              </Link>
              <Link className="button button-subtle" to="/create-profile">
                Continue Editing Profile
              </Link>
              <Link className="button button-subtle" to={`/highlight-manager?athleteId=${profile.id}`}>
                Manage Highlights
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="content-section">
        <SectionHeading
          eyebrow="Playing evidence"
          title="Highlights in your portfolio"
          description="Signed-in owner highlight cards now keep private media previews approval-aware, signed-only, and public-safe."
        />
        <div className="wall-grid">
          {profileHighlights.length === 0 ? (
            <article className="surface-card empty-state-card">
              <p className="card-kicker">No highlight cards yet</p>
              <p className="card-body">Add your first highlight to strengthen your sports resume.</p>
            </article>
          ) : null}
          {profileHighlights.map((highlight) => {
            const thumbnailAsset = getLatestHighlightThumbnailAsset(mediaAssets, highlight.id);
            const videoAsset = getLatestHighlightVideoAsset(mediaAssets, highlight.id);
            const thumbnailPreviewUrl =
              canSignedInViewProfileMedia &&
              canManagedSignedInPreviewMedia(thumbnailAsset, currentUserId)
                ? mediaPreviewUrls?.[thumbnailAsset.id] || ""
                : "";
            const videoPreviewUrl =
              canSignedInViewProfileMedia &&
              canManagedSignedInPreviewMedia(videoAsset, currentUserId)
                ? mediaPreviewUrls?.[videoAsset.id] || ""
                : "";

            return (
              <ProfileHighlightCard
                athlete={profile}
                highlight={highlight}
                key={highlight.id}
                thumbnailAsset={thumbnailAsset}
                thumbnailPreviewUrl={thumbnailPreviewUrl}
                videoAsset={videoAsset}
                videoPreviewUrl={videoPreviewUrl}
                showOwnerMediaStatus={canSignedInViewProfileMedia}
              />
            );
          })}
        </div>
      </section>
    </section>
  );
}

function ProfileResumeCard({ athlete, mediaUrl = "", ownerMediaNote = "" }) {
  const sportDefinition = getSportDefinitionForProfile(athlete);
  const teamFieldLabel = getTeamFieldLabel(sportDefinition);
  const locationSummary = getLocationSummary(athlete) || "Location not provided";
  const completion = calculateProfileCompleteness(athlete);
  const completionLabel = getProfileCompletenessLabel(completion, athlete);
  const opportunityBadges = getAvailabilityBadges(athlete);

  return (
    <article className="surface-card profile-resume-card">
      <div className="card-header-row">
        <div>
          <p className="card-kicker">Digital player card</p>
          <h3>{athlete.displayName}</h3>
        </div>
        <span className="player-number">#{getJerseyNumber(athlete)}</span>
      </div>

      <div className="resume-title">
        <AthleteAvatar athlete={athlete} mediaUrl={mediaUrl} />
        <div>
          <p className="card-meta">{joinMeta([athlete.sport, athlete.position, athlete.ageGroup])}</p>
          <p className="card-meta">{joinMeta([locationSummary, athlete.competitionLevel])}</p>
        </div>
      </div>

      <div className="badge-row">
        {athlete.verificationBadges.map((badge) => (
          <VerificationBadge key={badge} label={badge} />
        ))}
        <span className="status-chip">
          {completion}% {completionLabel}
        </span>
        <span className="status-chip status-chip-opportunity">
          {getOpportunityCount(athlete) > 0 ? "Open to opportunities" : "Opportunity status not set"}
        </span>
        <span className={athlete.isVerifiedClubEntry ? "status-chip status-chip-success" : "status-chip"}>
          {getTeamVerificationLabel(athlete)}
        </span>
      </div>

      <div className="stat-grid compact-stat-grid">
        <div className="stat-card">
          <span>{teamFieldLabel}</span>
          <strong>{athlete.club || "Not provided"}</strong>
        </div>
        <div className="stat-card">
          <span>Competition level</span>
          <strong>{athlete.competitionLevel || getRecruitingLevel(athlete)}</strong>
        </div>
        <div className="stat-card">
          <span>Resume completeness</span>
          <strong>{completion}%</strong>
        </div>
        <div className="stat-card">
          <span>Contact route</span>
          <strong>{getContactRouteLabel(getContactRoute(athlete))}</strong>
        </div>
      </div>

      <p className="request-note">
        {opportunityBadges.length > 0
          ? opportunityBadges.join(" / ")
          : "Opportunity preferences not set."}
      </p>
      {ownerMediaNote ? <p className="request-note">{ownerMediaNote}</p> : null}
    </article>
  );
}

function AthleteProfilePage({
  athletes,
  highlights,
  mediaAssets,
  mediaPreviewUrls,
  currentUserId,
  selectedRole,
  shortlistSet,
  contactMap,
  onRequestContact,
  onShortlistAthlete,
}) {
  const { athleteId } = useParams();
  const [requestSentText, setRequestSentText] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  const athlete = athletes.find((item) => item.id === athleteId) || athletes[0] || null;

  if (!athlete) {
    return <Navigate to="/" replace />;
  }

  const isShortlisted = shortlistSet?.has(athlete.id);

  const profileHighlights = getHighlightsForAthlete(highlights, athlete.id);
  const featuredHighlight =
    profileHighlights.find((item) => item.isFeatured) || profileHighlights[0] || null;
  const statusMessage = getVerificationSummary(athlete);
  const requestMessage = getSafeRequestMessage(contactMap[athlete.id], athlete.contactRoute);
  const hasContactRequest = (contactMap[athlete.id]?.contactRequestCount || 0) > 0;
  const privateProfilePhotoAsset = getLatestProfilePhotoAsset(mediaAssets, athlete.id);
  const canViewPrivateProfilePhoto =
    Boolean(currentUserId) && String(athlete.ownerUserId || "") === String(currentUserId || "");
  const privateProfilePhotoUrl =
    canViewPrivateProfilePhoto &&
    canManagedSignedInPreviewMedia(privateProfilePhotoAsset, currentUserId)
      ? mediaPreviewUrls?.[privateProfilePhotoAsset.id] || ""
      : "";
  const history = playingHistoryFromProfile(athlete);
  const aboutCopy = getProfileAbout(athlete);
  const coachNote = getCoachReference(athlete);
  const completion = calculateCompletion(athlete);
  const strengthLabel = getProfileStrengthLabel(completion, athlete);
  const sportDefinition = getSportDefinitionForProfile(athlete);
  const teamFieldLabel = getTeamFieldLabel(sportDefinition);
  const locationSummary = getLocationSummary(athlete) || "Location not provided";
  const clubVerificationLabel = getTeamVerificationLabel(athlete);
  const achievementSections = getAchievementSectionEntries(athlete);
  const physicalRows = getPhysicalDetailRows(athlete);
  const availabilityBadges = getAvailabilityBadges(athlete);
  const quickDetails = [
    { label: "Sport", value: athlete.sport },
    { label: "Position / role", value: athlete.position || "Not provided" },
    { label: "Secondary role", value: athlete.secondaryPosition || "Not provided" },
    { label: "Location", value: locationSummary },
    { label: "Age group", value: athlete.ageGroup || "Not provided" },
    { label: "Competition level", value: athlete.competitionLevel || "Not provided" },
    { label: teamFieldLabel, value: athlete.club || "Not provided" },
    { label: "Competition", value: athlete.competition || "Not provided" },
    { label: "Club verification", value: clubVerificationLabel },
  ];
  const statCards =
    athlete.stats.length > 0
      ? [...athlete.stats.slice(0, 3), { label: "Profile strength", value: `${completion}%` }]
      : [
          { label: "Visibility", value: athlete.visibilityStatus },
          { label: "Competition level", value: athlete.competitionLevel || "Not provided" },
          { label: "Club entry", value: clubVerificationLabel },
          { label: "Highlights", value: String(profileHighlights.length) },
          { label: "Profile strength", value: `${completion}%` },
        ];

  async function handleCopyDemoLink() {
    const shareUrl = getDemoShareUrl(athlete.id);
    const copied = await copyTextToClipboard(shareUrl);

    setShareStatus(
      copied
        ? "Resume link copied. Private media still stays protected."
        : `Resume link: ${shareUrl}. Private media still stays protected.`,
    );
  }

  function handlePrintResume() {
    const printUrl = getDemoShareUrl(athlete.id, { print: true });

    if (typeof window !== "undefined") {
      window.open(printUrl, "_blank", "noopener,noreferrer");
    }

    setShareStatus("Print-ready public resume opened in a new tab.");
  }

  return (
    <section className="page-stack">
      {shareStatus ? <p className="banner banner-success">{shareStatus}</p> : null}

      <section className="athlete-hero-grid">
        <article className="surface-card athlete-identity-card">
          <div className="identity-topline">
            <p className="eyebrow">Premium athlete resume</p>
            <span className="player-number">#{getJerseyNumber(athlete)}</span>
          </div>

          <div className="athlete-identity-main">
            <AthleteAvatar athlete={athlete} large mediaUrl={privateProfilePhotoUrl} />
            <div className="athlete-identity-copy">
              <h2>{athlete.displayName}</h2>
              <p className="hero-text">
                {joinMeta([athlete.sport, athlete.position, athlete.ageGroup, locationSummary])}
              </p>
              <p className="card-meta">
                {teamFieldLabel}: {athlete.club || "Not provided"} / {athlete.competition || "Competition not provided"}
              </p>
              <div className="badge-row">
                <span className="status-chip status-chip-success">
                  {isVerifiedProfile(athlete) ? "Verified" : "Verification pending"}
                </span>
                <span className="status-chip status-chip-opportunity">
                  {getOpportunityCount(athlete) > 0
                    ? "Open to opportunities"
                    : "Closed to opportunities"}
                </span>
                <span className="status-chip">{athlete.competitionLevel || getRecruitingLevel(athlete)}</span>
                <span className="status-chip">
                  Resume completeness {completion}% / {strengthLabel}
                </span>
              </div>
              <div className="badge-row">
                <span className="badge">{athlete.sportCategory || sportDefinition.category}</span>
                <span className="badge">{athlete.position || "Role not set"}</span>
                <span className="badge">{athlete.ageGroup || "Age group not set"}</span>
                <span className="badge">{locationSummary}</span>
                <span className="badge">{clubVerificationLabel}</span>
              </div>
              <div className="badge-row">
                {athlete.verificationBadges.map((badge) => (
                  <VerificationBadge key={badge} label={badge} />
                ))}
              </div>
              {canViewPrivateProfilePhoto ? (
                <>
                  <MediaStatusBadgeRow
                    mediaAsset={privateProfilePhotoAsset}
                    previewLoaded={Boolean(privateProfilePhotoUrl)}
                    showOwnerPreview
                    showPublicDisabled
                  />
                  <p className="request-note">
                    {getMediaOwnerPresentationMessage(privateProfilePhotoAsset, {
                      emptyMessage:
                        "No private profile photo asset is linked yet. The signed-in owner still sees the placeholder avatar here until approved media is ready for signed preview display.",
                      previewLoaded: Boolean(privateProfilePhotoUrl),
                    })}
                  </p>
                </>
              ) : null}
              <div className="cta-row">
                <Link className="button button-primary" to={`/resume/${athlete.id}`}>
                  Preview Resume
                </Link>
                <button className="button button-secondary" onClick={handleCopyDemoLink} type="button">
                  Copy Resume Link
                </button>
                {selectedRole === "club_scout" ? (
                  <button
                    className={isShortlisted ? "button button-subtle" : "button button-secondary"}
                    onClick={async () => {
                      const result = await onShortlistAthlete(athlete.id, selectedRole);
                      setShareStatus(
                        result?.duplicated || isShortlisted
                          ? "Athlete already shortlisted."
                          : result?.message || "Athlete added to shortlist.",
                      );
                    }}
                    type="button"
                  >
                    {isShortlisted ? "Shortlisted" : "Shortlist Athlete"}
                  </button>
                ) : null}
                <button className="button button-subtle" onClick={handlePrintResume} type="button">
                  Print Resume
                </button>
                <Link className="button button-subtle" to={`/highlight-manager?athleteId=${athlete.id}`}>
                  Manage Highlights
                </Link>
                <Link className="button button-subtle" to="/my-profile">
                  Back to Edit/Profile
                </Link>
              </div>
            </div>
          </div>
        </article>

        <article className="surface-card featured-highlight-card">
          <p className="card-kicker">Featured highlight</p>
          <div className="highlight-canvas highlight-canvas-large">
            <span>Highlight preview</span>
            <strong>{featuredHighlight?.statusLabel || "Resume highlight"}</strong>
          </div>
          <h3>{featuredHighlight?.title || "No highlight attached yet"}</h3>
          <p className="card-body">
            {featuredHighlight?.description ||
              "This athlete has not added a featured highlight card yet."}
          </p>
          <div className="badge-row">
            <span className="badge">{featuredHighlight?.highlightType || "Highlight placeholder"}</span>
            <span className="badge">{getHighlightDisplayEvent(featuredHighlight)}</span>
            <span className="badge">{formatDisplayDate(featuredHighlight?.date || featuredHighlight?.eventDate)}</span>
            <span className="badge">{featuredHighlight?.positionPlayed || athlete.position || "Role not set"}</span>
            <span className="badge">{athlete.competitionLevel || "Competition level not set"}</span>
          </div>
          <p className="request-note">
            Verification: {getHighlightVerificationLabel(featuredHighlight)} / Visibility:{" "}
            {getHighlightShowcaseLabel(featuredHighlight)}
          </p>
          <div className="cta-row">
            <Link className="button button-secondary" to={`/highlight-manager?athleteId=${athlete.id}`}>
              Manage Highlights
            </Link>
            <Link className="button button-subtle" to="/highlights">
              View Highlights
            </Link>
            <Link className="button button-primary" to="/search">
              Browse More Athletes
            </Link>
          </div>
        </article>
      </section>

      <section className="stat-band stat-band-four">
        {statCards.map((item) => (
          <article className="surface-card stat-band-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <div className="profile-main-grid">
        <article className="surface-card profile-content-card">
          <p className="card-kicker">Resume summary</p>
          <h3>Professional profile summary</h3>
          <p className="card-body">{aboutCopy}</p>
          <div
            className="completion-track"
            role="progressbar"
            aria-valuenow={completion}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="completion-fill" style={{ width: `${completion}%` }} />
          </div>
          <p className="request-note">
            Resume completeness: {completion}% / {strengthLabel}
          </p>
        </article>

        <article className="surface-card profile-content-card">
          <p className="card-kicker">Sport and competition details</p>
          <h3>Quick answers for clubs</h3>
          <div className="detail-list">
            {quickDetails.map((item) => (
              <DetailRow key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </article>

        <article className="surface-card profile-content-card">
          <p className="card-kicker">Safety and contact route</p>
          <h3>Request contact the right way</h3>
          <p className="card-body">
            My Sports Resume routes all contact through the correct pathway so the resume stays professional and safe.
          </p>
          <p className="request-note">
            {athlete.isJunior
              ? "Contact requests route to parent or guardian."
              : "Contact requests route to athlete."}
          </p>
          <div className="cta-row">
            <button
              className={hasContactRequest ? "button button-subtle" : "button button-primary"}
              disabled={hasContactRequest}
              onClick={async () => {
                const result = await onRequestContact(athlete.id);
                if (result?.duplicated) {
                  setRequestSentText("A contact request is already on file for this athlete.");
                  return;
                }
                setRequestSentText(
                  result?.message || `Request sent to the ${getContactRouteLabel(athlete.contactRoute)}.`,
                );
              }}
              type="button"
            >
              {hasContactRequest ? "Contact Requested" : "Request Contact"}
            </button>
            <Link className="button button-subtle" to="/search">
              Back to Search
            </Link>
          </div>
          <p className="request-note">{requestSentText || requestMessage}</p>
        </article>
      </div>

      <article className="surface-card trust-summary-card">
        <div>
          <p className="card-kicker">Trust and verification</p>
          <h3>Verified profile signals</h3>
          <p className="card-body">{statusMessage}</p>
          <p className="request-note">
            {athlete.isJunior
              ? "Under-18 profiles stay parent or guardian controlled."
              : "Adult profiles keep contact inside a request-only workflow."}
          </p>
        </div>
        <div className="detail-list">
          <DetailRow label="Visibility" value={athlete.visibilityStatus} />
          <DetailRow label="Contact route" value={getContactRouteLabel(athlete.contactRoute)} />
          <DetailRow label="Profile type" value={getRecruitingLevel(athlete)} />
          <DetailRow label="Club entry" value={clubVerificationLabel} />
          <DetailRow label="Highlights" value={String(profileHighlights.length)} />
        </div>
      </article>

      <section className="content-section">
        <SectionHeading
          eyebrow="Resume evidence"
          title="Playing history, achievements, and trust notes"
          description="A premium player-card experience needs more than one highlight. It needs structured context."
        />

        <div className="profile-grid profile-grid-three">
          <article className="surface-card profile-content-card">
            <p className="card-kicker">Playing history</p>
            <div className="timeline">
              {history.map((entry) => (
                <article className="timeline-item" key={entry.title + entry.year}>
                  <p className="timeline-year">{entry.year}</p>
                  <p className="timeline-title">{entry.title}</p>
                  <p className="card-meta">{entry.details}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="surface-card profile-content-card">
            <p className="card-kicker">Achievements</p>
            <div className="achievement-section-grid">
              {achievementSections.length === 0 && athlete.achievements.length === 0 ? (
                <p className="card-body">No achievements recorded yet.</p>
              ) : null}
              {achievementSections.length > 0
                ? achievementSections.map((section) => (
                    <article className="surface-card nested-card achievement-section-card" key={section.key}>
                      <p className="card-kicker">{section.label}</p>
                      <div className="checklist">
                        {section.items.map((item) => (
                          <div className="check-item" key={item}>
                            <span className="check-mark done" />
                            <p>{item}</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))
                : athlete.achievements.map((item) => (
                    <div className="achievement-badge" key={item}>
                      {item}
                    </div>
                  ))}
            </div>
          </article>

          <article className="surface-card profile-content-card">
            <p className="card-kicker">References and coach notes</p>
            <h3>Verified context</h3>
            <p className="card-body">{coachNote}</p>
            <div className="detail-list">
              <DetailRow
                label="Reference name"
                value={athlete.references?.coachName || "Not provided"}
              />
              <DetailRow
                label="Reference role"
                value={athlete.references?.coachRole || "Not provided"}
              />
              <DetailRow label="Profile status" value={athlete.profileStatus} />
              <DetailRow label="Scout visible status" value={athlete.visibilityStatus} />
            </div>
          </article>
        </div>
      </section>

      <section className="content-section">
        <SectionHeading
          eyebrow="Performance details"
          title="Stats, athlete details, and availability"
          description="This section rounds out the resume with evidence, profile depth, and current opportunity intent."
        />

        <div className="profile-grid profile-grid-three">
          <article className="surface-card profile-content-card">
            <p className="card-kicker">Stats</p>
            <h3>Performance snapshot</h3>
            <div className="stat-grid compact-stat-grid">
              {athlete.stats.length === 0 ? (
                <p className="card-body">No stats recorded yet.</p>
              ) : null}
              {athlete.stats.map((item) => (
                <div className="stat-card" key={`${item.label}-${item.value}`}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-card profile-content-card">
            <p className="card-kicker">Athlete details</p>
            <h3>Optional profile context</h3>
            {physicalRows.length === 0 ? (
              <p className="card-body">No optional physical or fitness details have been added yet.</p>
            ) : (
              <div className="detail-list">
                {physicalRows.map((item) => (
                  <DetailRow key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            )}
          </article>

          <article className="surface-card profile-content-card">
            <p className="card-kicker">Availability</p>
            <h3>Opportunity intent</h3>
            {availabilityBadges.length === 0 ? (
              <p className="card-body">Opportunity preferences have not been added yet.</p>
            ) : (
              <div className="badge-row">
                {availabilityBadges.map((item) => (
                  <span className="badge" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            )}
            <p className="request-note">
              {athlete.isJunior
                ? "Contact requests route to parent or guardian."
                : "Contact requests route to athlete."}
            </p>
          </article>
        </div>
      </section>

      <section className="content-section">
        <SectionHeading
          eyebrow="Highlight library"
          title="Resume highlights"
          description="Featured clips appear first, followed by the rest of the profile media library."
        />
        <div className="wall-grid">
          {profileHighlights.length === 0 ? (
            <article className="surface-card empty-state-card">
              <p className="card-kicker">No highlight cards yet</p>
              <p className="card-body">
                No highlights added yet.
              </p>
              <Link className="button button-primary" to={`/highlight-manager?athleteId=${athlete.id}`}>
                Manage Highlights
              </Link>
            </article>
          ) : null}
          {profileHighlights.map((highlight) => {
            const thumbnailAsset = getLatestHighlightThumbnailAsset(mediaAssets, highlight.id);
            const videoAsset = getLatestHighlightVideoAsset(mediaAssets, highlight.id);
            const thumbnailPreviewUrl =
              canViewPrivateProfilePhoto &&
              canManagedSignedInPreviewMedia(thumbnailAsset, currentUserId)
                ? mediaPreviewUrls?.[thumbnailAsset.id] || ""
                : "";
            const videoPreviewUrl =
              canViewPrivateProfilePhoto &&
              canManagedSignedInPreviewMedia(videoAsset, currentUserId)
                ? mediaPreviewUrls?.[videoAsset.id] || ""
                : "";

            return (
              <ProfileHighlightCard
                athlete={athlete}
                highlight={highlight}
                key={highlight.id}
                thumbnailAsset={thumbnailAsset}
                thumbnailPreviewUrl={thumbnailPreviewUrl}
                videoAsset={videoAsset}
                videoPreviewUrl={videoPreviewUrl}
                showOwnerMediaStatus={canViewPrivateProfilePhoto}
              />
            );
          })}
        </div>
      </section>
    </section>
  );
}

function PublicResumePage({
  athletes,
  highlights,
  mediaAssets,
  mediaPreviewUrls,
  currentUserId,
  contactMap,
  onRequestContact,
}) {
  const { athleteId } = useParams();
  const [actionStatus, setActionStatus] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const athlete = athletes.find((item) => item.id === athleteId) || athletes[0] || null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const shouldPrint = new URLSearchParams(window.location.search).get("print") === "1";

    if (shouldPrint) {
      const timer = window.setTimeout(() => {
        window.print();
      }, 250);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, []);

  if (!athlete) {
    return <Navigate to="/" replace />;
  }

  const profileHighlights = getHighlightsForAthlete(highlights, athlete.id, { publicOnly: true });
  const featuredHighlights = profileHighlights.slice(0, 3);
  const request = contactMap[athlete.id];
  const hasContactRequest = (request?.contactRequestCount || 0) > 0;
  const privateProfilePhotoAsset = getLatestProfilePhotoAsset(mediaAssets, athlete.id);
  const canOwnerPreviewResumeMedia =
    Boolean(currentUserId) && String(athlete.ownerUserId || "") === String(currentUserId || "");
  const privateProfilePhotoUrl =
    canOwnerPreviewResumeMedia &&
    canManagedSignedInPreviewMedia(privateProfilePhotoAsset, currentUserId)
      ? mediaPreviewUrls?.[privateProfilePhotoAsset.id] || ""
      : "";
  const warnings = getResumeVisibilityWarnings(athlete);
  const completion = calculateProfileCompleteness(athlete);
  const completionLabel = getProfileCompletenessLabel(completion, athlete);
  const sportDefinition = getSportDefinitionForProfile(athlete);
  const teamFieldLabel = getTeamFieldLabel(sportDefinition);
  const locationSummary = getLocationSummary(athlete) || "Location not provided";
  const achievementSections = getAchievementSectionEntries(athlete);
  const physicalRows = getPhysicalDetailRows(athlete);
  const availabilityBadges = getAvailabilityBadges(athlete);
  const keyStats = athlete.stats.slice(0, 6);
  const keyAchievements = athlete.achievements.slice(0, 6);
  const referenceName = athlete.references?.coachName || "Not provided";
  const referenceRole = athlete.references?.coachRole || "Not provided";
  const contactRouteCopy = athlete.isJunior
    ? "Contact requests route to parent/guardian."
    : "Contact requests route to athlete.";

  async function handleCopyResumeLink() {
    const shareUrl = getDemoShareUrl(athlete.id);
    const copied = await copyTextToClipboard(shareUrl);

    setActionStatus(
      copied
        ? "Resume link copied. Private media still stays protected."
        : `Resume link: ${shareUrl}. Private media still stays protected.`,
    );
  }

  function handlePrintResume() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  async function handleRequestContact() {
    const result = await onRequestContact(athlete.id);
    setRequestStatus(
      result?.duplicated
        ? "A contact request is already on file for this athlete."
        : result?.message || `Request sent to the ${getContactRouteLabel(getContactRoute(athlete))}.`,
    );
  }

  return (
    <section className="page-stack public-resume-page">
      <article className="surface-card public-resume-toolbar print-hidden">
        <div>
          <p className="card-kicker">Resume preview</p>
          <h2>Shareable sports resume</h2>
          <p className="card-body">
            A scout-ready preview with safe contact routing, visibility controls, and print-friendly structure.
          </p>
        </div>
        <div className="cta-row">
          <Link className="button button-subtle" to={`/athlete/${athlete.id}`}>
            Back to Edit/Profile
          </Link>
          <button className="button button-secondary" onClick={handleCopyResumeLink} type="button">
            Copy Resume Link
          </button>
          <button className="button button-primary" onClick={handlePrintResume} type="button">
            Print Resume
          </button>
        </div>
      </article>

      {actionStatus ? <p className="banner banner-success print-hidden">{actionStatus}</p> : null}
      {warnings.map((warning) => (
        <p className="banner banner-warning" key={warning}>
          {warning}
        </p>
      ))}

      <article className="surface-card public-resume-shell">
        <header className="public-resume-header">
          <div className="public-resume-identity">
            <div className="resume-title">
              <AthleteAvatar athlete={athlete} large mediaUrl={privateProfilePhotoUrl} />
              <div>
                <p className="card-kicker">The sports resume for talent that deserves to be seen.</p>
                <h2>{athlete.displayName}</h2>
                <p className="hero-text">
                  {joinMeta([
                    athlete.ageGroup,
                    athlete.isJunior ? "Junior athlete" : "18+ athlete",
                    athlete.sport,
                    athlete.position,
                  ])}
                </p>
                <p className="card-meta">
                  {joinMeta([
                    athlete.secondaryPosition ? `Secondary role: ${athlete.secondaryPosition}` : null,
                    locationSummary,
                    athlete.competitionLevel,
                  ])}
                </p>
                {canOwnerPreviewResumeMedia ? (
                  <>
                    <MediaStatusBadgeRow
                      mediaAsset={privateProfilePhotoAsset}
                      previewLoaded={Boolean(privateProfilePhotoUrl)}
                      showOwnerPreview
                      showPublicDisabled
                    />
                    <p className="request-note">
                      {privateProfilePhotoUrl
                        ? "Private owner preview is active here through a signed URL. Public visitors still see no private media on this route."
                        : getMediaOwnerPresentationMessage(privateProfilePhotoAsset, {
                            emptyMessage:
                              "No private profile photo asset is linked yet. Public visitors still see safe placeholders only on this route.",
                            previewLoaded: false,
                          })}
                    </p>
                  </>
                ) : privateProfilePhotoAsset ? (
                  <>
                    <MediaStatusBadgeRow mediaAsset={privateProfilePhotoAsset} showPublicDisabled />
                    <p className="request-note">
                      Public visitors still see safe placeholders only. Private media does not render on unauthenticated resume routes in this phase.
                    </p>
                  </>
                ) : null}
              </div>
            </div>

            <div className="badge-row">
              <span className="status-chip status-chip-success">
                {completion}% / {completionLabel}
              </span>
              <span className="status-chip">{athlete.visibilityStatus}</span>
              <span className={athlete.isVerifiedClubEntry ? "status-chip status-chip-success" : "status-chip"}>
                {getTeamVerificationLabel(athlete)}
              </span>
              <span className="status-chip status-chip-opportunity">
                {getOpportunityCount(athlete) > 0 ? "Open to opportunities" : "Opportunity status not set"}
              </span>
            </div>

            <div className="badge-row">
              {athlete.verificationBadges.length > 0 ? (
                athlete.verificationBadges.map((badge) => (
                  <VerificationBadge key={badge} label={badge} />
                ))
              ) : (
                <span className="badge">Verification signals still building</span>
              )}
            </div>
          </div>

          <div className="surface-card nested-card public-resume-summary">
            <p className="card-kicker">Resume snapshot</p>
            <div className="detail-list">
              <DetailRow label="Sport" value={athlete.sport} />
              <DetailRow label="Position / role" value={athlete.position || "Not provided"} />
              <DetailRow label="Secondary role" value={athlete.secondaryPosition || "Not provided"} />
              <DetailRow label="Region / state" value={locationSummary} />
              <DetailRow label={teamFieldLabel} value={athlete.club || "Not provided"} />
              <DetailRow label="Competition level" value={athlete.competitionLevel || "Not provided"} />
              <DetailRow label="Profile completeness" value={`${completion}% / ${completionLabel}`} />
            </div>
          </div>
        </header>

        <div className="public-resume-grid">
          <article className="surface-card public-resume-section">
            <p className="card-kicker">Profile summary</p>
            <h3>Scout-ready overview</h3>
            <p className="card-body">{getProfileAbout(athlete)}</p>
            <div
              className="completion-track"
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="completion-fill" style={{ width: `${completion}%` }} />
            </div>
            <p className="request-note">{contactRouteCopy}</p>
          </article>

          <article className="surface-card public-resume-section">
            <p className="card-kicker">Key achievements</p>
            <h3>Performance highlights</h3>
            {keyAchievements.length === 0 ? (
              <p className="card-body">No achievements have been added yet.</p>
            ) : (
              <div className="checklist">
                {keyAchievements.map((item) => (
                  <div className="check-item" key={item}>
                    <span className="check-mark done" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="surface-card public-resume-section">
            <p className="card-kicker">Key stats</p>
            <h3>Sport evidence</h3>
            {keyStats.length === 0 ? (
              <p className="card-body">No stats have been added yet.</p>
            ) : (
              <div className="stat-grid compact-stat-grid">
                {keyStats.map((item) => (
                  <div className="stat-card" key={`${item.label}-${item.value}`}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="surface-card public-resume-section">
            <p className="card-kicker">Highlights</p>
            <h3>Video and clip context</h3>
            {featuredHighlights.length === 0 ? (
              <p className="card-body">No public highlights added yet.</p>
            ) : (
              <div className="review-stack">
                {featuredHighlights.map((highlight) => (
                  <div className="review-row" key={highlight.id}>
                    <h4>{highlight.title}</h4>
                    <p>{highlight.description || "Highlight description not added yet."}</p>
                    <div className="badge-row">
                      <span className="badge">{highlight.highlightType || highlight.tag}</span>
                      <span className="badge">{getHighlightDisplayEvent(highlight)}</span>
                      <span className="badge">{formatDisplayDate(highlight.date || highlight.eventDate)}</span>
                      <span className="badge">{getHighlightVerificationLabel(highlight)}</span>
                      <span className="badge">{getHighlightShowcaseLabel(highlight)}</span>
                    </div>
                    <p className="request-note">
                      {canOwnerPreviewResumeMedia
                        ? "Signed-in owner views can load approved private previews elsewhere in the app, but this public resume route still stays metadata-first and public-safe."
                        : "Private profile photos, thumbnails, and videos stay hidden here. Public media URLs and public video access are still disabled."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="surface-card public-resume-section">
            <p className="card-kicker">References and verification</p>
            <h3>Trust signals</h3>
            <div className="detail-list">
              <DetailRow label="Coach reference" value={referenceName} />
              <DetailRow label="Coach role" value={referenceRole} />
              <DetailRow label="Profile status" value={athlete.profileStatus} />
              <DetailRow label="Scout visible status" value={athlete.visibilityStatus} />
              <DetailRow label="Club / team verification" value={getTeamVerificationLabel(athlete)} />
            </div>
            {achievementSections.length > 0 ? (
              <div className="review-stack public-resume-substack">
                {achievementSections.slice(0, 3).map((section) => (
                  <div className="review-row" key={section.key}>
                    <h4>{section.label}</h4>
                    <p>{section.items.slice(0, 2).join(" / ")}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </article>

          <article className="surface-card public-resume-section">
            <p className="card-kicker">Availability</p>
            <h3>Opportunity settings</h3>
            {availabilityBadges.length === 0 ? (
              <p className="card-body">Availability preferences have not been added yet.</p>
            ) : (
              <div className="badge-row">
                {availabilityBadges.map((item) => (
                  <span className="badge" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            )}
            {physicalRows.length > 0 ? (
              <div className="detail-list public-resume-substack">
                {physicalRows.map((item) => (
                  <DetailRow key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            ) : null}
          </article>
        </div>

        <article className="surface-card public-contact-panel">
          <div>
            <p className="card-kicker">Safe contact route</p>
            <h3>Request contact safely</h3>
            <p className="card-body">
              No direct messaging. My Sports Resume uses contact requests only.
            </p>
            <div className="checklist">
              {[
                contactRouteCopy,
                "Exact address is never shown on the public resume.",
                athlete.isJunior
                  ? "Under-18 profiles remain parent/guardian controlled."
                  : "Contact requests stay inside the athlete-controlled request pathway.",
              ].map((item) => (
                <div className="check-item" key={item}>
                  <span className="check-mark done" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="public-contact-actions">
            <button
              className={hasContactRequest ? "button button-subtle print-hidden" : "button button-primary print-hidden"}
              disabled={hasContactRequest}
              onClick={handleRequestContact}
              type="button"
            >
              {hasContactRequest ? "Contact Requested" : "Request Contact"}
            </button>
            <p className="request-note">{requestStatus || getSafeRequestMessage(request, athlete.contactRoute)}</p>
          </div>
        </article>
      </article>
    </section>
  );
}

function OpportunitiesBoardPage({
  opportunities,
  athletes,
  selectedRole,
  opportunityBackendStatus,
  onCreateOpportunity,
  onExpressInterest,
}) {
  const canCreateOpportunity = selectedRole === "club_scout" || selectedRole === "admin";
  const [advancedFiltersExpanded, setAdvancedFiltersExpanded] = useState(false);
  const activeAthlete =
    getLatestRoleProfile(athletes, selectedRole, true) ||
    getLatestRoleProfile(athletes, selectedRole) ||
    null;
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState({
    query: "",
    sportCategory: "All",
    sport: "All",
    postcodeSuburb: "",
    clubOrganisation: "",
    opportunityType: "All",
    ageGroup: "All",
    state: "All",
    region: "All",
    juniorSenior: "All",
    verifiedOnly: false,
  });
  const [form, setForm] = useState({
    title: "",
    organisation: "",
    contactRoleTitle: "",
    sport: getDefaultSportDefinition().name,
    positionRole: "",
    ageGroup: "",
    juniorSenior: "Senior",
    state: "",
    region: "",
    postcode: "",
    suburb: "",
    competitionLevel: "",
    opportunityType: "Club recruitment",
    description: "",
    requirements: "",
    closingDate: "",
  });

  const opportunityNearbyDirectory = getNearbySportsDirectory({
    postcode: filters.postcodeSuburb,
    suburb: filters.postcodeSuburb,
    state: filters.state === "All" ? "" : filters.state,
  });
  const sportOptions = ["All", ...new Set([...opportunityNearbyDirectory.sports, ...getSimpleSportOptions()])];
  const opportunityFilterClubSuggestions = [
    ...getClubSuggestionsByPostcode({
      postcode: filters.postcodeSuburb,
      sport: filters.sport === "All" ? "" : filters.sport,
    }),
    ...getClubSuggestionsBySuburb({
      suburb: filters.postcodeSuburb,
      sport: filters.sport === "All" ? "" : filters.sport,
    }),
  ].filter((club, index, list) => list.findIndex((item) => item.id === club.id) === index);
  const opportunityClubSuggestions = [
    ...getClubSuggestionsByPostcode({ postcode: form.postcode, sport: form.sport }),
    ...getClubSuggestionsBySuburb({ suburb: form.suburb, sport: form.sport }),
  ]
    .filter((club, index, list) => list.findIndex((item) => item.id === club.id) === index)
    .slice(0, 6);
  const opportunityFormNearbyDirectory = getNearbySportsDirectory({
    postcode: form.postcode,
    suburb: form.suburb,
    state: form.state,
  });
  const opportunityFormSportOptions = [
    ...new Set([...opportunityFormNearbyDirectory.sports, ...getSimpleSportOptions()]),
  ];
  const usesStructuredOpportunityAgeFilters =
    filters.state === "NSW" && filters.sport === "Rugby League";
  const usesStructuredOpportunityAgeForm =
    form.state === "NSW" && form.sport === "Rugby League";
  const opportunityAgeFilterOptions = usesStructuredOpportunityAgeFilters
    ? ["All", ...NSW_RUGBY_LEAGUE_FILTER_AGE_GROUP_OPTIONS]
    : [
        "All",
        ...(filters.sport !== "All"
          ? getDirectoryAgeGroupsForSport(filters.sport)
          : AUSTRALIAN_AGE_GROUPS),
      ];
  const opportunityAgeFormOptions = usesStructuredOpportunityAgeForm
    ? NSW_RUGBY_LEAGUE_FILTER_AGE_GROUP_OPTIONS
    : getDirectoryAgeGroupsForSport(form.sport);
  const regionOptions = [
    "All",
    ...new Set(
      opportunities
        .filter((item) => filters.state === "All" || item.state === filters.state)
        .map((item) => item.region)
        .filter(Boolean),
    ),
  ];
  const filtered = opportunities.filter((opportunity) => {
    const query = filters.query.trim().toLowerCase();
    const blob = [
      opportunity.title,
      opportunity.organisation,
      opportunity.sport,
      opportunity.positionRole,
      opportunity.region,
      opportunity.state,
      opportunity.opportunityType,
    ]
      .join(" ")
      .toLowerCase();

    if (query && !blob.includes(query)) {
      return false;
    }
    if (
      filters.sportCategory !== "All" &&
      filters.sportCategory !== opportunity.sportCategory
    ) {
      return false;
    }
    if (!sportFilterMatches(filters.sport, opportunity.sport)) {
      return false;
    }
    const locationQuery = normalizeText(filters.postcodeSuburb);
    if (
      locationQuery &&
      ![
        opportunity.postcode,
        opportunity.suburb,
        opportunity.region,
        opportunity.state,
        opportunity.organisation,
      ]
        .join(" ")
        .toLowerCase()
        .includes(locationQuery)
    ) {
      return false;
    }
    const organisationQuery = normalizeText(filters.clubOrganisation);
    if (
      organisationQuery &&
      ![
        opportunity.organisation,
        opportunity.region,
        opportunity.suburb,
        opportunity.postcode,
      ]
        .join(" ")
        .toLowerCase()
        .includes(organisationQuery)
    ) {
      return false;
    }
    if (
      filters.opportunityType !== "All" &&
      filters.opportunityType !== opportunity.opportunityType
    ) {
      return false;
    }
    if (filters.ageGroup !== "All" && filters.ageGroup !== opportunity.ageGroup) {
      return false;
    }
    if (filters.state !== "All" && filters.state !== opportunity.state) {
      return false;
    }
    if (filters.region !== "All" && filters.region !== opportunity.region) {
      return false;
    }
    if (
      filters.juniorSenior === "Junior" &&
      !opportunity.isJuniorOpportunity
    ) {
      return false;
    }
    if (filters.juniorSenior === "Senior" && opportunity.isJuniorOpportunity) {
      return false;
    }
    if (filters.verifiedOnly && !isOpportunityVerified(opportunity)) {
      return false;
    }
    return true;
  });
  const verifiedCount = opportunities.filter(isOpportunityVerified).length;
  const pendingCount = opportunities.filter(shouldQueueOpportunityForAdmin).length;
  const filteredMatchCount = filtered.reduce(
    (count, opportunity) => count + getMatchingAthletesForOpportunity(opportunity, athletes).length,
    0,
  );

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function resetFilters() {
    setFilters({
      query: "",
      sportCategory: "All",
      sport: "All",
      postcodeSuburb: "",
      clubOrganisation: "",
      opportunityType: "All",
      ageGroup: "All",
      state: "All",
      region: "All",
      juniorSenior: "All",
      verifiedOnly: false,
    });
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm({
      title: "",
      organisation: "",
      contactRoleTitle: "",
      sport: getDefaultSportDefinition().name,
      positionRole: "",
      ageGroup: "",
      juniorSenior: "Senior",
      state: "",
      region: "",
      postcode: "",
      suburb: "",
      competitionLevel: "",
      opportunityType: "Club recruitment",
      description: "",
      requirements: "",
      closingDate: "",
    });
  }

  async function submitOpportunity() {
    if (!String(form.organisation || "").trim() || !String(form.title || "").trim()) {
      setStatus("Add an organisation and opportunity title before saving.");
      return;
    }

    const result = await onCreateOpportunity(
      {
        ...form,
        isJuniorOpportunity: form.juniorSenior === "Junior",
        verificationStatus: "Pending Admin Verification",
      },
      selectedRole,
    );

    if (!result?.success) {
      setStatus("The opportunity could not be created.");
      return;
    }

    setStatus(result.message || `${result.opportunity.title} added to the opportunities board.`);
    resetForm();
  }

  async function handleExpressInterest(opportunityId) {
    if (selectedRole !== "junior_athlete" && selectedRole !== "adult_athlete") {
      setStatus(
        "Express interest is available from a junior or 18+ athlete role with an athlete profile.",
      );
      return;
    }

    if (!activeAthlete) {
      setStatus("Create your sports resume to express interest in this opportunity.");
      return;
    }

    const result = await onExpressInterest(opportunityId, activeAthlete.id);
    setStatus(result?.message || "Interest could not be recorded right now.");
  }

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="Opportunities"
        title="Find safe local pathways by sport and postcode"
        description="Choose a sport, then postcode/suburb, club or organisation, age group, and opportunity type."
      />

      <div className="dashboard-stat-grid">
        <MetricCard
          label="Total opportunities"
          value={`${opportunities.length}`}
          detail="Structured opportunities across club, academy, school, and pathway use cases"
          tone="gold"
        />
        <MetricCard
          label="Verified opportunities"
          value={`${verifiedCount}`}
          detail="Opportunities carrying approval or verification signals"
          tone="success"
        />
        <MetricCard
          label="Pending opportunity reviews"
          value={`${pendingCount}`}
          detail="Opportunities still waiting for verification checks"
          tone="blue"
        />
        <MetricCard
          label="Suggested athlete matches"
          value={`${filteredMatchCount}`}
          detail="Profiles currently matching the active pathway filters"
          tone="gold"
        />
      </div>

      <article className="surface-card search-board-card">
        <div className="search-board-topline">
          <div>
            <p className="card-kicker">Pathway board</p>
            <h3>{filtered.length} opportunities match your current search</h3>
          </div>
          <div className="inline-actions">
            <span className="status-chip">Contact request only</span>
            <button className="button button-subtle inline-button" onClick={resetFilters} type="button">
              Reset Filters
            </button>
          </div>
        </div>
        <p className="request-note">
          Opportunities stay structured and request-only with no direct messaging.
        </p>

        <SportPathwayStrip
          title="Choose your sport"
          description="Sport -> Postcode/Suburb -> Club/Organisation -> Age Group -> Opportunity Type"
          selectedSport={filters.sport === "All" ? "" : filters.sport}
          onSelectSport={(sport) => updateFilter("sport", sport)}
          compact
          ctaItems={[
            { label: "Build profile", to: "/create-profile", variant: "button button-primary" },
          ]}
          contextNote="Pathway-based discovery only. Contact requests stay structured and safe."
        />

        <div className="search-filter-grid">
          <FilterField
            label="Sport"
            value={filters.sport}
            options={sportOptions}
            onChange={(value) => updateFilter("sport", value)}
          />
          <label className="form-field">
            <span>Postcode or suburb</span>
            <input
              type="text"
              value={filters.postcodeSuburb}
              onChange={(event) => updateFilter("postcodeSuburb", event.target.value)}
              placeholder="2460 or South Grafton"
            />
          </label>
          <label className="form-field">
            <span>Club / organisation</span>
            <input
              type="text"
              value={filters.clubOrganisation}
              onChange={(event) => updateFilter("clubOrganisation", event.target.value)}
              placeholder="South Grafton Rebels"
            />
          </label>
          <label className="form-field search-query-field">
            <span>Search title or role (optional)</span>
            <input
              type="text"
              value={filters.query}
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder="Search opportunities or role keywords"
            />
          </label>
          <FilterField
            label="Age group"
            value={filters.ageGroup}
            options={opportunityAgeFilterOptions}
            onChange={(value) => updateFilter("ageGroup", value)}
          />
          <FilterField
            label="Opportunity type"
            value={filters.opportunityType}
            options={["All", ...OPPORTUNITY_TYPE_OPTIONS]}
            onChange={(value) => updateFilter("opportunityType", value)}
          />
          <FilterField
            label="State"
            value={filters.state}
            options={["All", ...STATE_OPTIONS]}
            onChange={(value) => updateFilter("state", value)}
          />
        </div>

        <div className="detail-grid-full structured-selector-card family-flow-card postcode-directory-panel">
          <div className="form-section-header compact-form-header">
            <div>
              <p className="card-kicker">Find local clubs by postcode</p>
              <h4>
                {filters.postcodeSuburb
                  ? `Club suggestions near ${filters.postcodeSuburb}`
                  : "Enter postcode/suburb before choosing a club"}
              </h4>
            </div>
            <p className="request-note">
              {opportunityNearbyDirectory.areaLabel
                ? `${opportunityNearbyDirectory.areaLabel} starter directory`
                : "Suggested clubs and sports appear here when the starter directory has a match."}
            </p>
          </div>
          <div className="directory-summary-row">
            <span className="status-chip">
              Sports found: {opportunityNearbyDirectory.sports.length > 0 ? opportunityNearbyDirectory.sports.join(", ") : "None saved yet"}
            </span>
            <span className="status-chip">Contact route: Request records only</span>
          </div>
          <div className="club-suggestion-grid">
            {opportunityFilterClubSuggestions.length > 0 ? (
              opportunityFilterClubSuggestions.slice(0, 6).map((club) => (
                <button
                  className={
                    normalizeText(filters.clubOrganisation) === normalizeText(club.clubName)
                      ? "club-suggestion-button selected"
                      : "club-suggestion-button"
                  }
                  key={club.id}
                  onClick={() => {
                    updateFilter("clubOrganisation", club.clubName);
                    if (filters.sport === "All") {
                      updateFilter("sport", club.sport);
                    }
                    if (filters.state === "All") {
                      updateFilter("state", club.state);
                    }
                  }}
                  type="button"
                >
                  <strong>{club.clubName}</strong>
                  <span>{joinMeta([club.sport, club.suburb, club.postcode])}</span>
                </button>
              ))
            ) : (
              <span className="club-suggestion-empty">
                {filters.postcodeSuburb
                  ? "No saved clubs for this postcode yet. Custom organisation fallback remains available."
                  : "Try 2460 for the Grafton / South Grafton / Clarence Valley starter directory."}
              </span>
            )}
          </div>
        </div>

        <div className="search-board-advanced-toggle">
          <button
            className="button button-secondary"
            onClick={() => setAdvancedFiltersExpanded((current) => !current)}
            type="button"
          >
            {advancedFiltersExpanded ? "Hide extra filters" : "More filters"}
          </button>
          <p className="request-note">
            Pathway view first: sport, postcode/suburb, club or organisation, age group, and opportunity type.
          </p>
        </div>

        {advancedFiltersExpanded ? (
          <>
            <div className="filter-grid secondary-filter-grid">
              <FilterField
                label="Junior or senior"
                value={filters.juniorSenior}
                options={["All", "Junior", "Senior"]}
                onChange={(value) => updateFilter("juniorSenior", value)}
              />
              <article className="surface-card nested-card inline-info-card">
                <p className="card-kicker">Safety note</p>
                <h4>Contact requests only</h4>
                <p className="card-body">
                  Opportunities stay structured and location-safe. Use postcode/suburb to find a club or organisation, then keep contact inside request records only.
                </p>
              </article>
            </div>

            <div className="checkbox-grid checkbox-grid-board">
              <CheckboxChip
                checked={filters.verifiedOnly}
                label="Verified opportunities only"
                onChange={() => updateFilter("verifiedOnly", !filters.verifiedOnly)}
              />
            </div>
          </>
        ) : null}
      </article>

      {status ? <p className="banner banner-success">{status}</p> : null}

      {canCreateOpportunity ? (
        <article className="surface-card create-profile-form-card">
          <div className="form-section-header">
            <div>
              <p className="card-kicker">Post opportunity</p>
              <h3>Create an opportunity</h3>
            </div>
            <p className="request-note">
              New opportunities start as pending verification and stay request-only.
            </p>
          </div>
          <div className="detail-grid">
            <FormField
              label="Opportunity title"
              value={form.title}
              onChange={(value) => updateForm("title", value)}
              placeholder="First grade winger wanted, junior academy intake, rep squad trial"
            />
            <FormField
              label="State"
              select
              value={form.state}
              options={STATE_OPTIONS}
              onChange={(value) => updateForm("state", value)}
              placeholderOption="Select state"
            />
            <FormField
              label="Postcode"
              value={form.postcode}
              onChange={(value) => updateForm("postcode", value)}
              placeholder="Example: 2460"
            />
            <FormField
              label="Suburb"
              value={form.suburb}
              onChange={(value) => updateForm("suburb", value)}
              placeholder="Example: South Grafton"
            />
            <div className="detail-grid-full structured-selector-card family-flow-card postcode-directory-panel">
              <div className="form-section-header compact-form-header">
                <div>
                  <p className="card-kicker">Find local clubs by postcode</p>
                  <h4>{opportunityFormNearbyDirectory.areaLabel || "Suggested sports appear here"}</h4>
                </div>
                <p className="request-note">
                  Choose a local sport first, then pick the club/organisation if it appears. Custom organisations remain allowed.
                </p>
              </div>
              <div className="club-suggestion-grid">
                {opportunityFormNearbyDirectory.sports.length > 0 ? (
                  opportunityFormNearbyDirectory.sports.map((sport) => (
                    <button
                      className={form.sport === sport ? "club-suggestion-button selected" : "club-suggestion-button"}
                      key={sport}
                      onClick={() => updateForm("sport", sport)}
                      type="button"
                    >
                      <strong>{sport}</strong>
                      <span>Suggested near {form.postcode || form.suburb || "this area"}</span>
                    </button>
                  ))
                ) : (
                  <span className="club-suggestion-empty">
                    Enter postcode/suburb to load local sports. Try 2460 for Grafton starter data.
                  </span>
                )}
              </div>
            </div>
            <FormField
              label="Sport"
              select
              value={form.sport}
              options={opportunityFormSportOptions}
              onChange={(value) => updateForm("sport", value)}
            />
            <FormField
              label="Organisation"
              value={form.organisation}
              onChange={(value) => updateForm("organisation", value)}
              placeholder="Club, school, academy, or program name"
            />
            <FormField
              label="Contact role / title"
              value={form.contactRoleTitle}
              onChange={(value) => updateForm("contactRoleTitle", value)}
              placeholder="Recruitment lead, coach, director of sport"
            />
            <FormField
              label="Position / role needed"
              value={form.positionRole}
              onChange={(value) => updateForm("positionRole", value)}
              placeholder="Halfback, key defender, opening batter, shooter"
              listId="opportunity-position-options"
              listOptions={getDirectoryPositionsForSport(form.sport)}
              helper="Use a suggested sport role where possible; custom roles are still allowed."
            />
            <FormField
              label="Age group"
              select
              value={form.ageGroup}
              options={opportunityAgeFormOptions}
              onChange={(value) => updateForm("ageGroup", value)}
              placeholderOption="Select age group"
            />
            <FormField
              label="Junior or senior"
              select
              value={form.juniorSenior}
              options={["Junior", "Senior"]}
              onChange={(value) => updateForm("juniorSenior", value)}
            />
            <div className="detail-grid-full structured-selector-card family-flow-card">
              <div className="form-section-header compact-form-header">
                <div>
                  <p className="card-kicker">Club suggestions</p>
                  <h4>Pick the organisation if it appears</h4>
                </div>
                <p className="request-note">
                  Enter postcode/suburb and sport first. Starter clubs can fill the organisation and area context for you.
                </p>
              </div>
              <div className="club-suggestion-grid">
                {opportunityClubSuggestions.length > 0 ? (
                  opportunityClubSuggestions.map((club) => (
                    <button
                      className={
                        form.organisation === club.clubName
                          ? "club-suggestion-button selected"
                          : "club-suggestion-button"
                      }
                      key={club.id}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          organisation: club.clubName,
                          region: club.groupOrAssociation || club.region || current.region,
                          postcode: club.postcode || current.postcode,
                          suburb: club.suburb || current.suburb,
                          competitionLevel: current.competitionLevel || "Regional",
                        }))
                      }
                      type="button"
                    >
                      <strong>{club.clubName}</strong>
                      <span>{joinMeta([club.suburb, club.postcode, club.groupOrAssociation || club.region])}</span>
                    </button>
                  ))
                ) : (
                  <span className="club-suggestion-empty">Add sport, state, and postcode/suburb for suggestions.</span>
                )}
                <span className="club-suggestion-empty">Custom club or organisation is still allowed.</span>
              </div>
            </div>
            <FormField
              label="Competition / region optional"
              value={form.region}
              onChange={(value) => updateForm("region", value)}
              placeholder="Group 2, Regional NSW, Metro Melbourne"
            />
            <FormField
              label="Competition level"
              select
              value={form.competitionLevel}
              options={COMPETITION_LEVELS}
              onChange={(value) => updateForm("competitionLevel", value)}
              placeholderOption="Select competition level"
            />
            <FormField
              label="Opportunity type"
              select
              value={form.opportunityType}
              options={OPPORTUNITY_TYPE_OPTIONS}
              onChange={(value) => updateForm("opportunityType", value)}
            />
            <label className="form-field">
              <span>Closing date</span>
              <input
                type="date"
                value={form.closingDate}
                onChange={(event) => updateForm("closingDate", event.target.value)}
              />
            </label>
            <label className="form-field detail-grid-full">
              <span>Description</span>
              <textarea
                rows="4"
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                placeholder="Describe the opportunity, the playing environment, and what the organisation is looking for."
              />
            </label>
            <label className="form-field detail-grid-full">
              <span>Requirements</span>
              <textarea
                rows="4"
                value={form.requirements}
                onChange={(event) => updateForm("requirements", event.target.value)}
                placeholder="Eligibility, playing history, highlight needs, reference expectations, or pathway notes."
              />
            </label>
          </div>
          <div className="cta-row">
            <button className="button button-primary" onClick={submitOpportunity} type="button">
              Create Opportunity
            </button>
            <button className="button button-secondary" onClick={resetForm} type="button">
              Reset Form
            </button>
          </div>
        </article>
      ) : null}

      <div className="card-grid search-results-grid">
        {filtered.map((opportunity) => {
          const matches = getMatchingAthletesForOpportunity(opportunity, athletes);

          return (
            <article className="surface-card premium-search-card" key={opportunity.id}>
              <p className="card-kicker">{opportunity.organisation}</p>
              <h3>{opportunity.title}</h3>
              <p className="card-meta">
                {joinMeta([
                  opportunity.sport,
                  opportunity.positionRole,
                  opportunity.ageGroup,
                  getLocationSummary(opportunity),
                ])}
              </p>

              <div className="badge-row">
                <span className={isOpportunityVerified(opportunity) ? "status-chip status-chip-success" : "status-chip"}>
                  {getOpportunityVerificationLabel(opportunity)}
                </span>
                <span className="status-chip">{getJuniorSeniorLabel(opportunity.isJuniorOpportunity)}</span>
                <span className="status-chip status-chip-opportunity">{opportunity.opportunityType}</span>
                <span className="status-chip">{getOpportunitySourceLabel(opportunity)}</span>
              </div>

              <div className="detail-list">
                <DetailRow label="Organisation" value={opportunity.organisation} />
                <DetailRow label="Competition level" value={opportunity.competitionLevel || "Not provided"} />
                <DetailRow label="Closing date" value={formatDisplayDate(opportunity.closingDate)} />
                <DetailRow label="Source" value={getOpportunitySourceLabel(opportunity)} />
                <DetailRow label="Safe route" value={getOpportunityContactNote(opportunity)} />
                <DetailRow label="Suggested athletes" value={String(matches.length)} />
              </div>

              <p className="card-body">{opportunity.description}</p>

              <div className="cta-row">
                <Link className="button button-primary" to={`/opportunities/${opportunity.id}`}>
                  View Details
                </Link>
                <button
                  className="button button-secondary"
                  onClick={() => handleExpressInterest(opportunity.id)}
                  type="button"
                >
                  Express Interest
                </button>
              </div>
            </article>
          );
        })}

        {filtered.length === 0 ? (
          <article className="surface-card empty-state-card">
            <p className="card-kicker">No opportunities found</p>
            <p className="card-body">
              No opportunities match the current board filters. Reset the board or post a new opportunity.
            </p>
            <button className="button button-secondary" onClick={resetFilters} type="button">
              Reset Filters
            </button>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function OpportunityDetailPage({
  opportunities,
  athletes,
  selectedRole,
  shortlistSet,
  onExpressInterest,
  onShortlistAthlete,
}) {
  const { opportunityId } = useParams();
  const [status, setStatus] = useState("");
  const opportunity = opportunities.find((item) => item.id === opportunityId) || opportunities[0] || null;
  const activeAthlete =
    getLatestRoleProfile(athletes, selectedRole, true) ||
    getLatestRoleProfile(athletes, selectedRole) ||
    null;

  if (!opportunity) {
    return <Navigate to="/opportunities" replace />;
  }

  const matches = getMatchingAthletesForOpportunity(opportunity, athletes).slice(0, 6);

  async function handleExpressInterest() {
    if (selectedRole !== "junior_athlete" && selectedRole !== "adult_athlete") {
      setStatus(
        "Express interest is available from a junior or 18+ athlete role with an athlete profile.",
      );
      return;
    }

    if (!activeAthlete) {
      setStatus("Create your sports resume to express interest in this opportunity.");
      return;
    }

    const result = await onExpressInterest(opportunity.id, activeAthlete.id);
    setStatus(result?.message || "Interest could not be recorded in local demo mode.");
  }

  async function handleShortlist(athleteId) {
    const result = await onShortlistAthlete(athleteId, selectedRole);
    setStatus(
      result?.duplicated
        ? "Athlete already shortlisted."
        : result?.message || "Athlete added to shortlist.",
    );
  }

  return (
    <section className="page-stack">
      <article className="surface-card dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Opportunity detail</p>
          <h2>{opportunity.title}</h2>
          <p className="hero-text">
            {joinMeta([
              opportunity.organisation,
              opportunity.sport,
              opportunity.positionRole,
              opportunity.ageGroup,
            ])}
          </p>
          <div className="badge-row">
            <span className={isOpportunityVerified(opportunity) ? "status-chip status-chip-success" : "status-chip"}>
              {getOpportunityVerificationLabel(opportunity)}
            </span>
            <span className="status-chip status-chip-opportunity">{opportunity.opportunityType}</span>
            <span className="status-chip">{opportunity.competitionLevel}</span>
            <span className="status-chip">{getJuniorSeniorLabel(opportunity.isJuniorOpportunity)}</span>
            <span className="status-chip">{getOpportunitySourceLabel(opportunity)}</span>
          </div>
        </div>
        <div className="dashboard-actions">
          <button className="button button-primary" onClick={handleExpressInterest} type="button">
            Express Interest
          </button>
          <Link className="button button-secondary" to="/opportunities">
            Back to Board
          </Link>
        </div>
      </article>

      {status ? <p className="banner banner-success">{status}</p> : null}

      <div className="two-up-grid">
        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Opportunity summary</p>
          <h3>What this organisation is looking for</h3>
          <div className="detail-list">
            <DetailRow label="Organisation" value={opportunity.organisation} />
            <DetailRow label="Sport" value={opportunity.sport} />
            <DetailRow label="Position / role" value={opportunity.positionRole} />
            <DetailRow label="Age group" value={opportunity.ageGroup} />
            <DetailRow label="State / region" value={getLocationSummary(opportunity)} />
            <DetailRow label="Competition level" value={opportunity.competitionLevel} />
            <DetailRow label="Opportunity type" value={opportunity.opportunityType} />
            <DetailRow label="Closing date" value={formatDisplayDate(opportunity.closingDate)} />
            <DetailRow
              label="Save status"
              value={
                getOpportunitySourceLabel(opportunity) === "Supabase"
                  ? "Saved securely"
                  : "Saved on this device only"
              }
            />
          </div>
        </article>

        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Safe contact rules</p>
          <h3>Request-only pathway</h3>
          <div className="checklist">
            {[
              "No direct messaging.",
              "Contact requests only.",
              getOpportunityContactNote(opportunity).replace(" No direct messaging.", ""),
              "Exact addresses are never shown in the board.",
              getOpportunitySourceLabel(opportunity) === "Supabase"
                ? "This opportunity stays owner-controlled in this phase. No public board-wide posting yet."
                : "This opportunity is still saved on this device only in this phase.",
            ].map((item) => (
              <div className="check-item" key={item}>
                <span className="check-mark done" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="surface-card dashboard-panel">
        <p className="card-kicker">Description</p>
        <h3>Opportunity notes</h3>
        <p className="card-body">{opportunity.description}</p>
        <p className="request-note">{opportunity.requirements}</p>
      </article>

      <section className="content-section">
        <SectionHeading
          eyebrow="Suggested athletes"
          title="Local match suggestions"
          description="These athlete resumes match the opportunity by sport, pathway, role, location, and current availability where possible."
        />

        <div className="dashboard-grid">
          {matches.map((athlete) => {
            const completion = calculateProfileCompleteness(athlete);

            return (
              <article className="surface-card dashboard-panel" key={athlete.id}>
                <div className="search-card-header">
                  <AthleteAvatar athlete={athlete} />
                  <div>
                    <p className="card-kicker">{athlete.sport}</p>
                    <h3>{athlete.displayName}</h3>
                    <p className="card-meta">
                      {joinMeta([athlete.position, getLocationSummary(athlete), athlete.ageGroup])}
                    </p>
                  </div>
                </div>
                <div className="badge-row">
                  <span className={isVerifiedProfile(athlete) ? "status-chip status-chip-success" : "status-chip"}>
                    {isVerifiedProfile(athlete) ? "Verified profile" : "Verification pending"}
                  </span>
                  <span className="status-chip">
                    {completion}% {getProfileCompletenessLabel(completion, athlete)}
                  </span>
                  <span className="status-chip">
                    {getContactRouteLabel(getContactRoute(athlete))}
                  </span>
                </div>
                <div className="cta-row">
                  <Link className="button button-primary" to={`/resume/${athlete.id}`}>
                    View Resume
                  </Link>
                  {selectedRole === "club_scout" ? (
                    <button
                      className={shortlistSet.has(athlete.id) ? "button button-subtle" : "button button-secondary"}
                      onClick={() => handleShortlist(athlete.id)}
                      type="button"
                    >
                      {shortlistSet.has(athlete.id) ? "Shortlisted" : "Shortlist Athlete"}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}

          {matches.length === 0 ? (
            <article className="surface-card empty-state-card">
              <p className="card-kicker">No matched athletes yet</p>
              <p className="card-body">
                No current athlete resumes match this opportunity closely enough yet.
              </p>
            </article>
          ) : null}
        </div>
      </section>
    </section>
  );
}

function ShortlistPage({ shortlist, athletes, requestMap, onRequestContact, onRemove, selectedRole }) {
  const [status, setStatus] = useState("");
  const shortlistRows = shortlist
    .map((item) => {
      const athlete = athletes.find((candidate) => candidate.id === item.athleteId);
      return athlete
        ? {
            item,
            athlete,
          }
        : null;
    })
    .filter(Boolean);

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="Shortlist"
        title="Recruitment shortlist"
        description="Save athlete resumes for review inside a clean, request-only recruitment workflow."
      />

      <article className="surface-card trust-statement">
        <div>
          <p className="eyebrow">Shortlist flow</p>
          <h3>Professional shortlist only</h3>
          <p className="card-body">
            Shortlisting keeps recruitment review structured and private. Contact requests still use the safe route shown on each athlete resume.
          </p>
        </div>
        <div className="trust-points">
          <TrustPoint title="No direct messaging" copy="Shortlist only saves resumes for later review inside the safe contact workflow." />
          <TrustPoint title="Safe contact" copy="Use Create Contact Request when you are ready to move through the platform route." />
        </div>
      </article>

      {status ? <p className="banner banner-success">{status}</p> : null}

      <div className="dashboard-grid">
        {shortlistRows.map(({ item, athlete }) => {
          const request = requestMap[athlete.id];
          const completion = calculateProfileCompleteness(athlete);

          return (
            <article className="surface-card dashboard-panel" key={item.id}>
              <div className="search-card-header">
                <AthleteAvatar athlete={athlete} />
                <div>
                  <p className="card-kicker">{athlete.sport}</p>
                  <h3>{athlete.displayName}</h3>
                  <p className="card-meta">
                    {joinMeta([athlete.position, getLocationSummary(athlete), athlete.ageGroup])}
                  </p>
                </div>
              </div>
              <div className="badge-row">
                <span className={isVerifiedProfile(athlete) ? "status-chip status-chip-success" : "status-chip"}>
                  {isVerifiedProfile(athlete) ? "Verified profile" : "Verification pending"}
                </span>
                <span className="status-chip">
                  {completion}% {getProfileCompletenessLabel(completion, athlete)}
                </span>
                <span className="status-chip">{getTeamVerificationLabel(athlete)}</span>
              </div>
              <div className="detail-list">
                <DetailRow label="Sport / role" value={joinMeta([athlete.sport, athlete.position])} />
                <DetailRow label="Region / state" value={getLocationSummary(athlete) || "Not provided"} />
                <DetailRow label="Source" value={getShortlistSourceLabel(item)} />
                <DetailRow label="Shortlist type" value={item.shortlistType || "Athlete Shortlist"} />
                <DetailRow label="Shortlist status" value={item.shortlistStatus || "Active"} />
                <DetailRow label="Contact route" value={getContactRouteLabel(getContactRoute(athlete))} />
                <DetailRow
                  label="Current requests"
                  value={String(request?.contactRequestCount || request?.count || 0)}
                />
              </div>
              <div className="cta-row">
                <Link className="button button-primary" to={`/resume/${athlete.id}`}>
                  View Resume
                </Link>
                <button
                  className={
                    (request?.contactRequestCount || 0) > 0
                      ? "button button-subtle"
                      : "button button-secondary"
                  }
                  disabled={(request?.contactRequestCount || 0) > 0}
                  onClick={async () => {
                    const result = await onRequestContact(athlete.id, selectedRole || "club_scout");
                    setStatus(
                      result?.duplicated
                        ? "A contact request is already on file for this athlete."
                        : result?.message || "Contact request created from the shortlist.",
                    );
                  }}
                  type="button"
                >
                  {(request?.contactRequestCount || 0) > 0
                    ? "Contact Requested"
                    : "Create Contact Request"}
                </button>
                <button
                  className="button button-subtle"
                  onClick={async () => {
                    const result = await onRemove(athlete.id);
                    setStatus(result?.message || "Athlete removed from shortlist.");
                  }}
                  type="button"
                >
                  Remove from Shortlist
                </button>
              </div>
            </article>
          );
        })}

        {shortlistRows.length === 0 ? (
          <article className="surface-card empty-state-card">
            <p className="card-kicker">No shortlisted athletes yet</p>
            <p className="card-body">
              Shortlist athletes from Scout Search or the athlete profile to build a clean recruitment review list.
            </p>
            <Link className="button button-primary" to="/search">
              Open Scout Search
            </Link>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function CreateProfilePage({ onSaveProfile, selectedRole, statusMessage }) {
  const location = useLocation();
  const [form, setForm] = useState(() => createProfileFormDefaults(selectedRole));
  const [status, setStatus] = useState("");
  const [lastSavedSummary, setLastSavedSummary] = useState(null);
  const [advancedDetailsExpanded, setAdvancedDetailsExpanded] = useState(false);
  const appliedPrefillSearchRef = useRef("");
  const isJunior = form.ageCategory === "Junior";
  const sportDefinition =
    findSportDefinition(form.sportId || form.sport) || getDefaultSportDefinition();
  const nearbySportsDirectory = getNearbySportsDirectory({
    postcode: form.postcode,
    suburb: form.suburb,
    state: form.state,
  });
  const localSportOptions = nearbySportsDirectory.sports;
  const hasLocationSearch = Boolean(String(form.postcode || form.suburb || "").trim());
  const usesStructuredRugbyLeagueForm = isStructuredNswRugbyLeagueMode(sportDefinition, form.state);
  const selectedSportName = form.sport || sportDefinition?.name || "Other";
  const positionOptions = usesStructuredRugbyLeagueForm
    ? NSW_RUGBY_LEAGUE_POSITION_OPTIONS
    : getDirectoryPositionsForSport(selectedSportName);
  const secondaryPositionOptions = positionOptions.filter(
    (item) => item === NSW_RUGBY_LEAGUE_OTHER_OPTION || item !== form.position,
  );
  const ageGroupOptions = usesStructuredRugbyLeagueForm
    ? NSW_RUGBY_LEAGUE_AGE_GROUP_OPTIONS
    : getDirectoryAgeGroupsForSport(selectedSportName);
  const competitionLevelOptions = usesStructuredRugbyLeagueForm
    ? getNswRugbyLeagueCompetitionLevelOptions(form.region)
    : getCompetitionLevelOptionsForSport(sportDefinition);
  const statSuggestions = getSportStatSuggestions(sportDefinition.id);
  const resolvedFormValues = getResolvedProfileFormValues(form);
  const directoryTeams = getDirectoryTeamsForSport(
    sportDefinition,
    form.state,
    usesStructuredRugbyLeagueForm ? form.region : "",
  );
  const postcodeClubSuggestions = getClubSuggestionsByPostcode({
    postcode: form.postcode,
    sport: form.sport || sportDefinition?.name,
  });
  const suburbClubSuggestions = getClubSuggestionsBySuburb({
    suburb: form.suburb,
    sport: form.sport || sportDefinition?.name,
  });
  const clubSuggestions = [...postcodeClubSuggestions, ...suburbClubSuggestions]
    .filter((club, index, list) => list.findIndex((item) => item.id === club.id) === index)
    .slice(0, 8);
  const selectedStarterClub = getClubByName(resolvedFormValues.resolvedClub);
  const selectedClubAgeGroups = selectedStarterClub
    ? getAgeGroupsForClub(selectedStarterClub)
    : [];
  const matchedDirectoryTeam = resolvedFormValues.matchedTeam;
  const structuredGroupOptions = getNswRugbyLeagueGroupOptions();
  const structuredClubOptions = [
    ...(form.region ? getNswRugbyLeagueClubsByGroup(form.region) : []).map((club) => ({
      label: `${club.name} - ${club.townArea}`,
      value: club.name,
    })),
    { label: "My club is not listed", value: NSW_RUGBY_LEAGUE_CUSTOM_CLUB_VALUE },
  ];
  const structuredCompetitionOptions = getNswRugbyLeagueCompetitionOptions(form.region);
  const showCustomClubField =
    form.club === NSW_RUGBY_LEAGUE_CUSTOM_CLUB_VALUE ||
    form.club === AUSTRALIAN_CUSTOM_CLUB_VALUE;
  const showCustomGroupField =
    usesStructuredRugbyLeagueForm && form.region === NSW_RUGBY_LEAGUE_OTHER_REGION_VALUE;
  const showCustomCompetitionField = showCustomClubField || showCustomGroupField;
  const showCustomAgeGroupField = form.ageGroup === NSW_RUGBY_LEAGUE_OTHER_OPTION;
  const showCustomPositionField = form.position === NSW_RUGBY_LEAGUE_OTHER_OPTION;
  const showCustomSecondaryPositionField =
    form.secondaryPosition === NSW_RUGBY_LEAGUE_OTHER_OPTION;
  const showCustomHighlightTypeField =
    form.highlightType === NSW_RUGBY_LEAGUE_OTHER_OPTION;
  const profileHighlightOptions = getDirectoryHighlightTypesForSport(selectedSportName);
  const quickStatChips =
    selectedSportName === "Rugby League"
      ? RUGBY_LEAGUE_PROFILE_STAT_CHIPS
      : statSuggestions.slice(0, 8);
  const selectedClubLabel =
    resolvedFormValues.resolvedClub || form.currentTeam || "Choose a club or team";
  const selectedCompetitionGroup =
    resolvedFormValues.resolvedCompetition ||
    resolvedFormValues.resolvedRegion ||
    matchedDirectoryTeam?.region ||
    "Auto-fills from club where available";
  const selectedLocationLabel =
    nearbySportsDirectory.areaLabel ||
    joinMeta([form.suburb, form.postcode, form.state]) ||
    "Enter postcode or suburb";
  const inferredPathwayLabel = isJunior ? "Junior" : "Senior";
  const teamFieldLabel = getTeamFieldLabel(sportDefinition);
  const competitionFieldLabel = getCompetitionFieldLabel(sportDefinition);
  const teamVerificationLabel = matchedDirectoryTeam
    ? "Verified starter directory entry"
    : resolvedFormValues.resolvedClub
      ? "Added manually - pending verification"
      : "No team, club, or program selected yet";
  const builderProgress = calculateBuilderCompletion(form);
  const builderChecklist = buildBuilderChecklist(form);
  const builderCompletionLabel = getProfileStrengthLabel(builderProgress);
  const roleLabel = getRoleLabel(selectedRole);
  const pilotModeActive = new URLSearchParams(location.search).get("pilot") === "2460";

  useEffect(() => {
    setForm(createProfileFormDefaults(selectedRole));
    setStatus("");
    setLastSavedSummary(null);
    setAdvancedDetailsExpanded(false);
    appliedPrefillSearchRef.current = "";
  }, [selectedRole]);

  useEffect(() => {
    const search = location.search || "";
    if (!search || appliedPrefillSearchRef.current === search) {
      return;
    }

    const params = new URLSearchParams(search);
    const sport = String(params.get("sport") || "").trim();
    const state = String(params.get("state") || "").trim();
    const postcode = String(params.get("postcode") || "").trim();
    const suburb = String(params.get("suburb") || "").trim();
    const club = String(params.get("club") || "").trim();
    const displayName = String(params.get("name") || "").trim();

    if (![sport, state, postcode, suburb, club, displayName].some(Boolean)) {
      appliedPrefillSearchRef.current = search;
      return;
    }

    appliedPrefillSearchRef.current = search;
    setAdvancedDetailsExpanded(false);
    setForm((current) => {
      const nextSport =
        (sport && findSportDefinition(sport)) || findSportDefinition(current.sportId || current.sport);
      const matchedClub = club ? getClubByName(club) : null;

      return {
        ...current,
        displayName: displayName || current.displayName,
        state: state || current.state,
        postcode: postcode || current.postcode,
        suburb: suburb || current.suburb,
        sportCategory: nextSport?.category || current.sportCategory,
        sportId: nextSport?.id || current.sportId,
        sport: nextSport?.name || sport || current.sport,
        club: club || current.club,
        currentTeam: club || current.currentTeam,
        customClubName:
          club &&
          !matchedClub &&
          club !== AUSTRALIAN_CUSTOM_CLUB_VALUE &&
          club !== NSW_RUGBY_LEAGUE_CUSTOM_CLUB_VALUE
            ? club
            : current.customClubName,
        clubEntryType: matchedClub ? "directory" : current.clubEntryType,
        isVerifiedClubEntry:
          matchedClub ? matchedClub.verifiedStatus === "starter_seed" : current.isVerifiedClubEntry,
        teamDirectoryId: matchedClub?.id || current.teamDirectoryId,
        region: matchedClub?.groupOrAssociation || matchedClub?.region || current.region,
        competition: matchedClub?.groupOrAssociation || matchedClub?.region || current.competition,
        mainCompetition:
          matchedClub?.groupOrAssociation || matchedClub?.region || current.mainCompetition,
      };
    });
  }, [location.search]);

  function normalizeAvailabilityForAgeCategory(availability, shouldBeJunior) {
    const next = {
      ...PROFILE_DEFAULTS.availability,
      ...(availability || {}),
    };

    if (shouldBeJunior) {
      next.openToSeniorSigning = false;
      next.openToFirstGrade = false;
      next.openToReserveGrade = false;
      next.willingToRelocate = false;
      next.preferredLocations = "";
      return next;
    }

    next.openToSchoolSport = false;
    next.openToRepresentativePathways = false;
    return next;
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateAgeCategory(value) {
    setForm((current) => {
      const shouldBeJunior = value === "Junior";
      const resolvedAgeGroup = resolveSelectableValue(current.ageGroup, current.customAgeGroup);
      const currentMatches = resolvedAgeGroup
        ? isJuniorAgeGroup(resolvedAgeGroup) === shouldBeJunior
        : true;

      return {
        ...current,
        ageCategory: value,
        ageGroup: currentMatches ? current.ageGroup : getDefaultAgeGroup(shouldBeJunior),
        customAgeGroup: currentMatches ? current.customAgeGroup : "",
        highlightVerificationStatus: shouldBeJunior ? "Parent approval needed" : "Pending review",
        availability: normalizeAvailabilityForAgeCategory(current.availability, shouldBeJunior),
      };
    });
  }

  function updateAgeGroup(value) {
    setForm((current) => {
      const resolvedAgeGroup = resolveSelectableValue(value, current.customAgeGroup);
      const shouldBeJunior = resolvedAgeGroup
        ? isJuniorAgeGroup(resolvedAgeGroup)
        : current.ageCategory === "Junior";

      return {
        ...current,
        ageGroup: value,
        customAgeGroup:
          value === NSW_RUGBY_LEAGUE_OTHER_OPTION ? current.customAgeGroup : "",
        ageCategory: shouldBeJunior ? "Junior" : "Senior",
        highlightVerificationStatus: shouldBeJunior ? "Parent approval needed" : "Pending review",
        availability: normalizeAvailabilityForAgeCategory(current.availability, shouldBeJunior),
      };
    });
  }

  function updateSportCategory(value) {
    const nextSportOptions = getSportOptionsByCategory(value);
    const fallbackSport = nextSportOptions[0] || getDefaultSportDefinition();

    setForm((current) => {
      const currentSport = findSportDefinition(current.sportId || current.sport);
      const preservedSport =
        currentSport && currentSport.category === value ? currentSport : fallbackSport;

      return {
        ...current,
        sportCategory: value,
        sportId: preservedSport?.id || "",
        sport: preservedSport?.name || "",
        position:
          currentSport?.id === preservedSport?.id &&
          getPositionOptionsForSport(preservedSport).includes(current.position)
            ? current.position
            : "",
        customPosition: "",
        secondaryPosition: "",
        customSecondaryPosition: "",
        customAgeGroup: "",
        club: "",
        customClubName: "",
        currentTeam: "",
        teamDirectoryId: "",
        clubEntryType: "custom",
        isVerifiedClubEntry: false,
        region: "",
        customGroupRegion: "",
        competition: "",
        mainCompetition: "",
        customCompetitionGroup: "",
        competitionLevel:
          currentSport?.id === preservedSport?.id ? current.competitionLevel : "",
        highlightType: "Match highlight",
        customHighlightType: "",
      };
    });
  }

  function updateSport(value) {
    const nextSport = findSportDefinition(value);
    const nextDirectoryPositions = getDirectoryPositionsForSport(value);
    const nextHighlightTypes = getDirectoryHighlightTypesForSport(value);

    if (!nextSport) {
      setForm((current) => ({
        ...current,
        sport: value,
        sportId: "",
        position: "",
        customPosition: "",
        secondaryPosition: "",
        customSecondaryPosition: "",
        customAgeGroup: "",
        club: "",
        customClubName: "",
        currentTeam: "",
        teamDirectoryId: "",
        clubEntryType: "custom",
        isVerifiedClubEntry: false,
        region: "",
        customGroupRegion: "",
        competition: "",
        mainCompetition: "",
        customCompetitionGroup: "",
        highlightType: nextHighlightTypes[0] || "Match highlight",
        customHighlightType: "",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      sportCategory: nextSport.category,
      sportId: nextSport.id,
      sport: nextSport.name,
      position: nextDirectoryPositions.includes(current.position)
        ? current.position
        : "",
      customPosition: "",
      secondaryPosition: "",
      customSecondaryPosition: "",
      customAgeGroup: "",
      club: "",
      customClubName: "",
      currentTeam: "",
      teamDirectoryId: "",
      clubEntryType: "custom",
      isVerifiedClubEntry: false,
      region: "",
      customGroupRegion: "",
      competition: "",
      mainCompetition: "",
      customCompetitionGroup: "",
      highlightType: nextHighlightTypes[0] || "Match highlight",
      customHighlightType: "",
    }));
  }

  function updateStateField(value) {
    setForm((current) => {
      const currentSport =
        findSportDefinition(current.sportId || current.sport) || getDefaultSportDefinition();
      const currentTeam = current.teamDirectoryId ? TEAMS_BY_ID[current.teamDirectoryId] : null;
      const clearDirectoryTeam = currentTeam && value && currentTeam.state !== value;
      const leavingStructuredMode =
        isStructuredNswRugbyLeagueMode(currentSport, current.state) && value !== "NSW";

      return {
        ...current,
        state: value,
        teamDirectoryId: clearDirectoryTeam ? "" : current.teamDirectoryId,
        club: clearDirectoryTeam || leavingStructuredMode ? "" : current.club,
        currentTeam: clearDirectoryTeam || leavingStructuredMode ? "" : current.currentTeam,
        competition: clearDirectoryTeam || leavingStructuredMode ? "" : current.competition,
        mainCompetition: clearDirectoryTeam || leavingStructuredMode ? "" : current.mainCompetition,
        clubEntryType: clearDirectoryTeam || leavingStructuredMode ? "custom" : current.clubEntryType,
        isVerifiedClubEntry:
          clearDirectoryTeam || leavingStructuredMode ? false : current.isVerifiedClubEntry,
        region: leavingStructuredMode ? "" : current.region,
        customClubName: value === "NSW" ? current.customClubName : "",
        customGroupRegion: value === "NSW" ? current.customGroupRegion : "",
        customCompetitionGroup: value === "NSW" ? current.customCompetitionGroup : "",
      };
    });
  }

  function updateStructuredGroupRegion(value) {
    setForm((current) => {
      const nextCompetition = getNswRugbyLeagueDefaultCompetition(value);
      const nextCompetitionLevel = getNswRugbyLeagueDefaultCompetitionLevel(value);
      return {
        ...current,
        region: value,
        customGroupRegion:
          value === NSW_RUGBY_LEAGUE_OTHER_REGION_VALUE ? current.customGroupRegion : "",
        club: "",
        customClubName: "",
        currentTeam: "",
        teamDirectoryId: "",
        clubEntryType: "custom",
        isVerifiedClubEntry: false,
        competition: nextCompetition || current.competition,
        mainCompetition: nextCompetition || current.mainCompetition,
        customCompetitionGroup: "",
        competitionLevel: nextCompetitionLevel || current.competitionLevel,
      };
    });
  }

  function updateTeamClub(value) {
    setForm((current) => {
      const currentSport =
        findSportDefinition(current.sportId || current.sport) || getDefaultSportDefinition();
      if (
        (value === NSW_RUGBY_LEAGUE_CUSTOM_CLUB_VALUE ||
          value === AUSTRALIAN_CUSTOM_CLUB_VALUE)
      ) {
        return {
          ...current,
          club: value,
          teamDirectoryId: "",
          clubEntryType: "custom_unverified",
          isVerifiedClubEntry: false,
          currentTeam: current.customClubName || "",
        };
      }
      const starterClub = getClubByName(value);
      if (starterClub) {
        const directoryTeam = mapStarterClubToDirectoryTeam(starterClub);
        return {
          ...current,
          club: directoryTeam.name,
          currentTeam: directoryTeam.name,
          teamDirectoryId: directoryTeam.id,
          clubEntryType: directoryTeam.clubEntryType,
          isVerifiedClubEntry: false,
          region: directoryTeam.region || current.region,
          state: directoryTeam.state || current.state,
          postcode: directoryTeam.postcode || current.postcode,
          suburb: directoryTeam.suburb || current.suburb,
          competition: directoryTeam.competition || current.competition,
          mainCompetition: directoryTeam.competition || current.mainCompetition,
          competitionLevel: directoryTeam.level || current.competitionLevel,
        };
      }
      const matchedTeam = findTeamDirectoryEntry({
        name: value,
        sportDefinition: currentSport,
        state: current.state,
        region: current.region,
      });

      return {
        ...current,
        club: value,
        currentTeam: value,
        teamDirectoryId: matchedTeam?.id || "",
        clubEntryType: matchedTeam ? "directory" : value ? "custom_unverified" : "custom",
        isVerifiedClubEntry: Boolean(matchedTeam?.isVerifiedDirectoryEntry),
        region: matchedTeam?.region || current.region,
        state: matchedTeam?.state || current.state,
        competition: matchedTeam?.competition || current.competition,
        mainCompetition: matchedTeam?.competition || current.mainCompetition,
        competitionLevel: matchedTeam?.level || current.competitionLevel,
      };
    });
  }

  function updateCustomClubName(value) {
    setForm((current) => ({
      ...current,
      customClubName: value,
      currentTeam:
        current.club === NSW_RUGBY_LEAGUE_CUSTOM_CLUB_VALUE ||
        current.club === AUSTRALIAN_CUSTOM_CLUB_VALUE
          ? value
          : current.currentTeam,
      clubEntryType:
        (current.club === NSW_RUGBY_LEAGUE_CUSTOM_CLUB_VALUE ||
          current.club === AUSTRALIAN_CUSTOM_CLUB_VALUE) &&
        value
          ? "custom_unverified"
          : current.clubEntryType,
    }));
  }

  function updateMainCompetition(value) {
    setForm((current) => ({
      ...current,
      competition: value,
      mainCompetition: value,
      customCompetitionGroup: "",
    }));
  }

  function updateCustomCompetitionGroup(value) {
    setForm((current) => ({
      ...current,
      competition: value,
      mainCompetition: value,
      customCompetitionGroup: value,
    }));
  }

  function updateAvailability(field) {
    setForm((current) => ({
      ...current,
      availability: {
        ...current.availability,
        [field]: !current.availability[field],
      },
    }));
  }

  function appendAdvancedNote(field, label) {
    setForm((current) => {
      const existing = String(current[field] || "").trimEnd();
      const noteLine = `${label}: `;

      if (
        existing
          .split("\n")
          .some((line) => line.trim().toLowerCase().startsWith(label.toLowerCase()))
      ) {
        return current;
      }

      return {
        ...current,
        [field]: existing ? `${existing}\n${noteLine}` : noteLine,
      };
    });
  }

  async function submitForm(mode) {
    const saved = await onSaveProfile(form, mode);
    if (saved?.success) {
      setLastSavedSummary({
        profileId: saved.profile.id,
        displayName: saved.profile.displayName,
        completeness: saved.completeness,
        label: saved.completenessLabel,
        profileStatus: saved.profile.profileStatus,
        contactRoute: getContactRouteLabel(saved.profile.contactRoute),
      });
      setStatus(
        saved.message ||
          (saved.storageSource === "supabase"
            ? mode === "submit"
              ? `${saved.profile.displayName} saved securely and ready for review.`
              : `${saved.profile.displayName} draft saved securely.`
            : mode === "submit"
              ? `${saved.profile.displayName} saved on this device and ready to finish later.`
              : `${saved.profile.displayName} draft saved on this device.`),
      );
      setForm(createProfileFormDefaults(selectedRole));
    } else {
      setStatus("Could not save the athlete profile right now.");
    }
  }

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="Profile builder"
        title="Create a quick junior sports profile"
        description="Start with the basics: athlete name, postcode, sport, club, age group, and position. Stats, achievements, and extra resume detail can be added later."
      />

      <div className="create-profile-grid">
        <article className="surface-card create-profile-form-card">
          <div className="builder-topline">
            <div>
              <p className="card-kicker">Quick profile setup</p>
              <h3>Start with the basics</h3>
              <p className="card-body">
                Parents and athletes can save a clean first profile now, then build out stats,
                achievements, and highlights later.
              </p>
            </div>
            <div className="builder-progress-panel">
              <span>{builderCompletionLabel} resume depth</span>
              <div
                className="completion-track"
                role="progressbar"
                aria-valuenow={builderProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="completion-fill" style={{ width: `${builderProgress}%` }} />
              </div>
              <p className="request-note">
                Role path: {roleLabel} / Contact route: {isJunior ? "parent or guardian" : "athlete"}
              </p>
            </div>
          </div>

          {pilotModeActive ? (
            <article className="surface-card nested-card pilot-inline-card">
              <p className="card-kicker">2460 Pilot Mode</p>
              <h4>South Grafton / Clarence Valley quick start</h4>
              <p className="card-body">
                Start with Rugby League and postcode 2460, then choose a local club and save the
                athlete profile in under two minutes.
              </p>
              <div className="badge-row">
                <span className="badge">Postcode 2460</span>
                <span className="badge">South Grafton Rebels</span>
                <span className="badge">Grafton Ghosts</span>
              </div>
            </article>
          ) : null}

          <div className="quick-profile-step-grid" aria-label="Quick profile setup steps">
            {QUICK_PROFILE_SETUP_STEPS.map((step, index) => (
              <div className="quick-profile-step" key={step}>
                <span>Step {index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>

          <article className="form-section-card basic-profile-summary-card">
            <div className="form-section-header">
              <div>
                <p className="card-kicker">Basic profile summary</p>
                <h3>You have already answered the key questions</h3>
              </div>
              <p className="request-note">
                Optional resume extras below should add new detail, not repeat these basics.
              </p>
            </div>
            <div className="detail-list summary-detail-grid">
              <DetailRow label="Athlete" value={form.displayName || "Add athlete name"} />
              <DetailRow label="Sport" value={selectedSportName || "Choose sport"} />
              <DetailRow label="Postcode / suburb" value={selectedLocationLabel} />
              <DetailRow label="Club / team" value={selectedClubLabel} />
              <DetailRow
                label="Age group"
                value={resolvedFormValues.resolvedAgeGroup || "Choose age group"}
              />
              <DetailRow
                label="Position"
                value={resolvedFormValues.resolvedPosition || "Choose position"}
              />
              <DetailRow label="Pathway" value={`${inferredPathwayLabel} - inferred from age group`} />
            </div>
          </article>

          <article className="form-section-card">
            <div className="form-section-header">
              <div>
                <p className="card-kicker">Quick Profile Setup</p>
                <h3>Start with the basics</h3>
              </div>
              <p className="request-note">
                This is the fast setup path. You can add stats, awards, school sport,
                academy history, and highlights after the profile is created.
              </p>
            </div>
            <div className="detail-grid">
              <div className="detail-grid-full quick-step-divider">
                <span>Step 1</span>
                <strong>Who is the athlete?</strong>
              </div>
              <FormField
                label="Display name"
                value={form.displayName}
                onChange={(value) => updateField("displayName", value)}
                helper="Use the public name you want shown on the resume."
              />
              <label className="form-field">
                <span>Short about me (optional)</span>
                <textarea
                  rows="3"
                  value={form.profileSummary}
                  onChange={(event) => updateField("profileSummary", event.target.value)}
                  placeholder="Example: I love playing hooker, defending hard, and learning from my coaches."
                />
                <p className="field-helper">
                  One simple note is enough. You can skip this now and add it later.
                </p>
              </label>
              <FormField
                label="State"
                select
                value={form.state}
                options={STATE_OPTIONS}
                placeholderOption="Select state"
                onChange={updateStateField}
                helper="Use the athlete's main playing state."
              />
              <div className="detail-grid-full quick-step-divider">
                <span>Step 2</span>
                <strong>Choose sport and location</strong>
              </div>
              <div className="detail-grid-full">
                <SportPathwayStrip
                  description="Choose your sport, then enter postcode/suburb so local clubs are easier to find."
                  selectedSport={form.sport}
                  onSelectSport={updateSport}
                  contextNote="Choose the sport first, then postcode, club, age group, and position."
                />
              </div>
              <FormField
                label="Postcode or suburb"
                value={form.postcode}
                onChange={(value) => updateField("postcode", value)}
                placeholder="Example: 2460"
                helper="Find clubs near your postcode."
              />
              <FormField
                label="Suburb if known"
                value={form.suburb}
                onChange={(value) => updateField("suburb", value)}
                placeholder="Example: South Grafton"
                helper="Use this if postcode is not handy."
              />
              <div className="detail-grid-full structured-selector-card family-flow-card postcode-directory-panel">
                <div className="form-section-header compact-form-header">
                  <div>
                    <p className="card-kicker">Local finder</p>
                    <h4>Find local clubs by postcode</h4>
                  </div>
                  <p className="request-note">
                    {hasLocationSearch && nearbySportsDirectory.areaLabel
                      ? `${nearbySportsDirectory.areaLabel} starter directory`
                      : "Enter a postcode or suburb first. If nothing is saved yet, you can still add your club manually."}
                  </p>
                </div>
                <div className="directory-summary-row">
                  <span className="status-chip">Area: {nearbySportsDirectory.areaLabel || "Not selected yet"}</span>
                  <span className="status-chip">
                    Sports found: {localSportOptions.length > 0 ? localSportOptions.length : 0}
                  </span>
                  <span className="status-chip">
                    Clubs found: {nearbySportsDirectory.clubs.length}
                  </span>
                </div>
                <div className="club-suggestion-grid">
                  {localSportOptions.length > 0 ? (
                    localSportOptions.map((sport) => (
                      <button
                        className={form.sport === sport ? "club-suggestion-button selected" : "club-suggestion-button"}
                        key={sport}
                        onClick={() => updateSport(sport)}
                        type="button"
                      >
                        <strong>{sport}</strong>
                        <span>Suggested near {form.postcode || form.suburb || "this area"}</span>
                      </button>
                    ))
                  ) : (
                    <span className="club-suggestion-empty">
                      {hasLocationSearch
                        ? "No saved clubs for this postcode yet. My club is not listed stays available."
                        : "Try 2460 to see the Grafton / South Grafton / Clarence Valley starter directory."}
                    </span>
                  )}
                </div>
              </div>
              <div className="detail-grid-full structured-selector-card family-flow-card">
                <div className="form-section-header compact-form-header">
                  <div>
                    <p className="card-kicker">Club picker</p>
                    <h4>Choose a suggested club</h4>
                  </div>
                  <p className="request-note">
                    {form.sport
                      ? `Showing ${form.sport} clubs near ${form.postcode || form.suburb || "the selected area"}.`
                      : "Select a sport first, then choose a suggested club if it appears."}
                  </p>
                </div>
                <div className="club-suggestion-grid">
                  {clubSuggestions.length > 0 ? (
                    clubSuggestions.map((club) => (
                      <button
                        className={
                          resolvedFormValues.resolvedClub === club.clubName
                            ? "club-suggestion-button selected"
                            : "club-suggestion-button"
                        }
                        key={club.id}
                        onClick={() => updateTeamClub(club.clubName)}
                        type="button"
                      >
                        <strong>{club.clubName}</strong>
                        <span>{joinMeta([club.suburb, club.postcode, club.groupOrAssociation || club.region])}</span>
                      </button>
                    ))
                  ) : (
                    <span className="club-suggestion-empty">
                      {hasLocationSearch
                        ? "No saved clubs for this postcode yet."
                        : "Enter postcode/suburb first to show starter club suggestions."}
                    </span>
                  )}
                  <button
                    className={
                      showCustomClubField
                        ? "club-suggestion-button selected"
                        : "club-suggestion-button"
                    }
                    onClick={() => {
                      updateTeamClub(AUSTRALIAN_CUSTOM_CLUB_VALUE);
                    }}
                    type="button"
                  >
                    <strong>My club is not listed</strong>
                    <span>Add my club manually. It will show as pending verification.</span>
                  </button>
                </div>
                <div className="detail-list compact-detail-list">
                  <DetailRow
                    label="Selected club"
                    value={
                      resolvedFormValues.resolvedClub ||
                      "No club selected yet"
                    }
                  />
                  <DetailRow
                    label="Club status"
                    value={selectedStarterClub ? "Starter directory match" : showCustomClubField ? "Custom club, saved safely" : "Not selected"}
                  />
                  <DetailRow
                    label="Age groups available"
                    value={
                      selectedClubAgeGroups.length > 0
                        ? selectedClubAgeGroups.slice(0, 8).join(", ")
                        : "Use the standard age group selector on this form"
                    }
                  />
                </div>
              </div>
              <div className="detail-grid-full quick-step-divider">
                <span>Step 3</span>
                <strong>Choose club, age group and position</strong>
              </div>
              <FormField
                label={usesStructuredRugbyLeagueForm ? "Team / age group" : "Age group"}
                select
                value={form.ageGroup}
                options={ageGroupOptions}
                placeholderOption="Select age group"
                onChange={updateAgeGroup}
                helper={
                  usesStructuredRugbyLeagueForm
                    ? "Junior years run Under 6 to Under 18. Senior grades start after Under 18."
                    : "Use the standard age band or pathway level that fits this athlete."
                }
              />
              {showCustomAgeGroupField ? (
                <FormField
                  label="Custom age group"
                  value={form.customAgeGroup}
                  onChange={(value) => updateField("customAgeGroup", value)}
                  placeholder="Example: School open boys, invitational 15s"
                  helper="Only use this when the listed age groups do not fit."
                />
              ) : null}
              {usesStructuredRugbyLeagueForm ? (
                <>
                  <div className="detail-grid-full structured-selector-card directory-details-card">
                    <div className="form-section-header compact-form-header">
                      <div>
                        <p className="card-kicker">Auto-filled club context</p>
                        <h4>Group and competition summary</h4>
                      </div>
                      <p className="request-note">
                        {NSW_RUGBY_LEAGUE_DIRECTORY_LABEL} This comes from the club or postcode context above.
                      </p>
                    </div>
                    <div className="badge-row">
                      <span className="badge">NSW only</span>
                      <span className="badge">Rugby League</span>
                      <span className="badge">Custom fallback available</span>
                    </div>
                    <div className="detail-list compact-detail-list">
                      <DetailRow label="Club / team" value={selectedClubLabel} />
                      <DetailRow label="Group / region" value={resolvedFormValues.resolvedRegion || selectedLocationLabel} />
                      <DetailRow label="Competition / group" value={selectedCompetitionGroup} />
                      {showCustomGroupField ? (
                        <FormField
                          label="Custom group / region"
                          value={form.customGroupRegion}
                          onChange={(value) => updateField("customGroupRegion", value)}
                          placeholder="Example: Local district junior competition"
                          helper="Saved as custom NSW Rugby League region metadata when the starter directory needs expanding."
                        />
                      ) : null}
                      {showCustomClubField ? (
                        <FormField
                          label="Custom club name"
                          value={form.customClubName}
                          onChange={updateCustomClubName}
                          placeholder="Enter club name"
                          helper="This shows as Added manually - pending verification so families are never blocked by the starter directory."
                        />
                      ) : null}
                      {showCustomCompetitionField ? (
                        <FormField
                          label="Custom competition / group"
                          value={form.customCompetitionGroup}
                          onChange={updateCustomCompetitionGroup}
                          placeholder="Example: Group 2 development carnival"
                          helper="Only shown when the club or group needs a custom unverified entry."
                        />
                      ) : null}
                    </div>
                  </div>
                  <ChoiceChipGroup
                    helper="Tap the main Rugby League position instead of typing it."
                    label="Primary position"
                    onChange={(value) => updateField("position", value)}
                    options={positionOptions}
                    value={form.position}
                  />
                  {showCustomPositionField ? (
                    <FormField
                      label="Custom primary position"
                      value={form.customPosition}
                      onChange={(value) => updateField("customPosition", value)}
                      placeholder="Enter custom role"
                      helper="Only use when the standard Rugby League position list does not fit."
                    />
                  ) : null}
                  <ChoiceChipGroup
                    helper="Optional. Add a secondary role when the athlete genuinely covers multiple spots."
                    label="Secondary position"
                    onChange={(value) => updateField("secondaryPosition", value)}
                    options={secondaryPositionOptions}
                    value={form.secondaryPosition}
                  />
                  {showCustomSecondaryPositionField ? (
                    <FormField
                      label="Custom secondary position"
                      value={form.customSecondaryPosition}
                      onChange={(value) => updateField("customSecondaryPosition", value)}
                      placeholder="Enter secondary role"
                      helper="Only use when the standard Rugby League position list does not fit."
                    />
                  ) : null}
                </>
              ) : (
                <>
                  <ChoiceChipGroup
                    helper="Tap the role that best fits this athlete. Use Other only when the starter list needs expanding."
                    label="Position / role"
                    onChange={(value) => updateField("position", value)}
                    options={positionOptions}
                    value={form.position}
                  />
                  {showCustomPositionField ? (
                    <FormField
                      label="Custom position / role"
                      value={form.customPosition}
                      onChange={(value) => updateField("customPosition", value)}
                      placeholder="Enter custom role"
                      helper="This will be saved as a manual role until the sport preset is expanded."
                    />
                  ) : null}
                  <ChoiceChipGroup
                    helper="Optional. Add a secondary role only if it helps clubs understand the athlete quickly."
                    label="Secondary position / role"
                    onChange={(value) => updateField("secondaryPosition", value)}
                    options={secondaryPositionOptions}
                    value={form.secondaryPosition}
                  />
                  {showCustomSecondaryPositionField ? (
                    <FormField
                      label="Custom secondary role"
                      value={form.customSecondaryPosition}
                      onChange={(value) => updateField("customSecondaryPosition", value)}
                      placeholder="Enter secondary role"
                      helper="Optional manual role saved safely with the profile."
                    />
                  ) : null}
                  {showCustomClubField ? (
                    <FormField
                      label="Club / team name"
                      value={form.customClubName}
                      onChange={updateCustomClubName}
                      placeholder="Enter your club or team name"
                      helper="This appears as Added manually - pending verification, so families are never blocked by the starter directory."
                    />
                  ) : null}
                </>
              )}
              {isJunior ? (
                <p className="banner banner-warning detail-grid-full">
                  Junior profiles stay approval-gated. Parents or guardians stay in control,
                  and the platform uses contact requests only with no direct messaging.
                </p>
              ) : null}
            </div>
          </article>

          <article className="form-section-card advanced-resume-toggle-card">
            <div className="form-section-header advanced-toggle-header">
              <div>
                <p className="card-kicker">Optional</p>
                <h3>Optional resume extras</h3>
              </div>
              <button
                className="button button-secondary"
                onClick={() => setAdvancedDetailsExpanded((current) => !current)}
                type="button"
              >
                {advancedDetailsExpanded ? "Hide optional extras" : "Add more detail later"}
              </button>
            </div>
            <p className="card-body">
              You can skip these. They help serious athletes add more detail later,
              without re-asking the club, sport, age group, or position already chosen above.
            </p>
          </article>

          {advancedDetailsExpanded ? (
            <div className="advanced-resume-details">
              <article className="form-section-card">
            <div className="form-section-header">
              <div>
                <p className="card-kicker">Optional detail</p>
                <h3>Physical and athlete details</h3>
              </div>
              <p className="request-note">
                Optional. Only add details that are useful and comfortable to share.
              </p>
            </div>
            <div className="detail-grid">
              <FormField
                label="Height"
                value={form.height}
                onChange={(value) => updateField("height", value)}
                placeholder="Optional"
                helper="Optional. Use only if helpful for the sport and pathway."
              />
              <FormField
                label="Weight"
                value={form.weight}
                onChange={(value) => updateField("weight", value)}
                placeholder="Optional"
                helper="Optional. Do not include anything sensitive or unnecessary."
              />
              <FormField
                label="Dominant foot / hand"
                value={form.dominantSide}
                onChange={(value) => updateField("dominantSide", value)}
                placeholder="Right foot, left hand"
                helper="Optional. Useful for football codes, cricket, tennis, and similar sports."
              />
              <FormField
                label="Preferred side"
                value={form.preferredSide}
                onChange={(value) => updateField("preferredSide", value)}
                placeholder="Left edge, right wing, right side"
                helper="Optional. Use for side-specific roles when relevant."
              />
            </div>
            <div className="detail-grid">
              <label className="form-field">
                <span>Fitness notes</span>
                <textarea
                  rows="3"
                  value={form.fitnessNotes}
                  onChange={(event) => updateField("fitnessNotes", event.target.value)}
                  placeholder="Optional notes about work rate, endurance, recovery, or testing context"
                />
                <p className="field-helper">
                  Keep this concise and professional. Avoid anything sensitive for junior athletes.
                </p>
              </label>
              <label className="form-field">
                <span>Speed / fitness metrics</span>
                <textarea
                  rows="3"
                  value={form.speedMetrics}
                  onChange={(event) => updateField("speedMetrics", event.target.value)}
                  placeholder={"40m: 5.31 sec\nBronco: 4:58\nYo-Yo: 18.4"}
                />
                <p className="field-helper">
                  Optional. Use one line per metric if the athlete has testing or combine data.
                </p>
              </label>
            </div>
          </article>

          <article className="form-section-card">
            <div className="form-section-header">
              <div>
                <p className="card-kicker">Optional detail</p>
                <h3>Playing history</h3>
              </div>
              <p className="request-note">
                Current club, sport, pathway, and position come from quick setup. Add only extra history here.
              </p>
            </div>
            <article className="surface-card nested-card inline-info-card profile-context-summary-card">
              <p className="card-kicker">Auto-filled from quick setup</p>
              <div className="detail-list">
                <DetailRow label="Current club" value={selectedClubLabel} />
                <DetailRow label="Competition / group" value={selectedCompetitionGroup} />
                <DetailRow
                  label="Main position"
                  value={resolvedFormValues.resolvedPosition || "Choose in quick setup"}
                />
                <DetailRow label="Pathway" value={`${inferredPathwayLabel} - inferred from age group`} />
              </div>
              <p className="request-note">
                To change these, update the basic setup above. Use the fields below only for history or exceptions.
              </p>
            </article>
            <div className="detail-grid">
              <FormField
                label="Years played"
                select
                value={form.yearsPlayed}
                options={PROFILE_YEARS_PLAYED_OPTIONS}
                placeholderOption="Optional - choose experience"
                onChange={(value) => updateField("yearsPlayed", value)}
                helper="Skip this if you are not sure. It can be added later."
              />
            </div>
            <div className="detail-grid">
              <label className="form-field">
                <span>Previous teams / clubs</span>
                <textarea
                  rows="3"
                  value={form.previousTeams}
                  onChange={(event) => updateField("previousTeams", event.target.value)}
                  placeholder="One line per previous team, club, or program"
                />
                <p className="field-helper">Use one line per team, club, squad, or program.</p>
              </label>
              <label className="form-field">
                <span>Representative history</span>
                <textarea
                  rows="3"
                  value={form.representativeHistory}
                  onChange={(event) => updateField("representativeHistory", event.target.value)}
                  placeholder="One line per representative selection or pathway"
                />
                <p className="field-helper">Example: Regional NSW U16 squad, state camp, development squad.</p>
              </label>
              <label className="form-field">
                <span>School sport history</span>
                <textarea
                  rows="3"
                  value={form.schoolHistory}
                  onChange={(event) => updateField("schoolHistory", event.target.value)}
                  placeholder="One line per school team, carnival, or school pathway"
                />
                <p className="field-helper">Useful for junior and school sport pathways.</p>
              </label>
              <label className="form-field">
                <span>Academy / pathway history</span>
                <textarea
                  rows="3"
                  value={form.academyHistory}
                  onChange={(event) => updateField("academyHistory", event.target.value)}
                  placeholder="One line per academy, squad, or pathway program"
                />
                <p className="field-helper">Use one line per academy, squad, or pathway program.</p>
              </label>
            </div>
          </article>

          <article className="form-section-card">
            <div className="form-section-header">
              <div>
                <p className="card-kicker">Optional detail</p>
                <h3>Achievements</h3>
              </div>
              <p className="request-note">
                Optional. Tap a starter chip, then add one short note if you want.
              </p>
            </div>
            <div className="quick-suggestion-panel detail-grid-full">
              <p className="card-kicker">Achievement starters</p>
              <div className="quick-suggestion-grid">
                {PROFILE_ACHIEVEMENT_QUICK_CHIPS.map((item) => (
                  <button
                    className="quick-suggestion-button"
                    key={`${item.field}-${item.label}`}
                    onClick={() => appendAdvancedNote(item.field, item.label)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="detail-grid">
              <label className="form-field">
                <span>Awards</span>
                <textarea
                  rows="3"
                  value={form.awards}
                  onChange={(event) => updateField("awards", event.target.value)}
                  placeholder="One line per award"
                />
                <p className="field-helper">Team awards, club awards, program awards, and similar honours.</p>
              </label>
              <label className="form-field">
                <span>Representative selections</span>
                <textarea
                  rows="3"
                  value={form.representativeSelections}
                  onChange={(event) => updateField("representativeSelections", event.target.value)}
                  placeholder="One line per selection"
                />
                <p className="field-helper">Representative teams, pathway squads, camps, or selection events.</p>
              </label>
              <label className="form-field">
                <span>Premierships / finals</span>
                <textarea
                  rows="3"
                  value={form.finalsHistory}
                  onChange={(event) => updateField("finalsHistory", event.target.value)}
                  placeholder="One line per finals or premiership result"
                />
                <p className="field-helper">Use this for finals appearances, titles, and tournament finishes.</p>
              </label>
              <label className="form-field">
                <span>MVP / player awards</span>
                <textarea
                  rows="3"
                  value={form.mvpAwards}
                  onChange={(event) => updateField("mvpAwards", event.target.value)}
                  placeholder="One line per MVP or player award"
                />
                <p className="field-helper">Great for athlete-of-the-match, MVP, or player-of-the-season notes.</p>
              </label>
              <label className="form-field">
                <span>Best and fairest</span>
                <textarea
                  rows="3"
                  value={form.bestAndFairest}
                  onChange={(event) => updateField("bestAndFairest", event.target.value)}
                  placeholder="One line per best and fairest result"
                />
                <p className="field-helper">Useful for AFL, netball, rugby league, and club-level recognition.</p>
              </label>
              <label className="form-field">
                <span>Carnival / tournament results</span>
                <textarea
                  rows="3"
                  value={form.carnivalResults}
                  onChange={(event) => updateField("carnivalResults", event.target.value)}
                  placeholder="One line per carnival or tournament result"
                />
                <p className="field-helper">Use for carnival placings, meet outcomes, or tournament progression.</p>
              </label>
              <label className="form-field detail-grid-full">
                <span>Other achievements</span>
                <textarea
                  rows="3"
                  value={form.otherAchievements}
                  onChange={(event) => updateField("otherAchievements", event.target.value)}
                  placeholder="Captaincy, leadership, milestones, pathway invites, records"
                />
                <p className="field-helper">Add anything meaningful that helps clubs understand the athlete's trajectory.</p>
              </label>
            </div>
          </article>

          <article className="form-section-card">
            <div className="form-section-header">
              <div>
                <p className="card-kicker">Optional detail</p>
                <h3>Stats</h3>
              </div>
              <p className="request-note">
                Optional. Tap a starter stat and add a value later, or skip stats for first setup.
              </p>
            </div>
            <div className="quick-suggestion-panel">
              <p className="card-kicker">Stat starters</p>
              <div className="quick-suggestion-grid">
                {quickStatChips.length > 0 ? (
                  quickStatChips.map((item) => (
                    <button
                      className="quick-suggestion-button"
                      key={item}
                      onClick={() => appendAdvancedNote("stats", item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))
                ) : (
                  <span className="badge">Custom stat entries supported</span>
                )}
              </div>
            </div>
            <label className="form-field">
              <span>Sport-aware stats</span>
              <textarea
                rows="5"
                value={form.stats}
                onChange={(event) => updateField("stats", event.target.value)}
                placeholder={getSportStatsPlaceholder(sportDefinition)}
              />
              <p className="field-helper">
                Use one line per stat and separate label from value with a colon. Custom entries are supported.
              </p>
            </label>
          </article>

          <article className="form-section-card">
            <div className="form-section-header">
              <div>
                <p className="card-kicker">Optional detail</p>
                <h3>Add first highlight later</h3>
              </div>
              <p className="request-note">
                Highlights are not required to create a profile. Save the profile first, then use Highlight Manager when you are ready.
              </p>
            </div>
            <div className="cta-row">
              <Link className="button button-secondary" to="/highlight-manager">
                Go to Highlight Manager
              </Link>
              <span className="request-note">
                Add highlight type, thumbnail, video, and match details in the dedicated Highlight Manager.
              </span>
            </div>
          </article>

          <article className="form-section-card">
            <div className="form-section-header">
              <div>
                <p className="card-kicker">Optional detail</p>
                <h3>References and verification</h3>
              </div>
              <p className="request-note">
                Add reference context and review the trust status that will be shown on the public resume.
              </p>
            </div>
            <div className="detail-grid">
              <FormField
                label="Coach reference name"
                value={form.coachReferenceName}
                onChange={(value) => updateField("coachReferenceName", value)}
                placeholder="Coach or pathway contact"
                helper="Optional, but helpful for trust and resume quality."
              />
              <FormField
                label="Coach role"
                value={form.coachReferenceRole}
                onChange={(value) => updateField("coachReferenceRole", value)}
                placeholder="Head coach, team manager, academy lead"
                helper="Role context helps clubs understand the reference."
              />
              <FormField
                label="Scout visible status"
                select
                value={form.profileVisibility}
                options={VISIBILITY_OPTIONS}
                onChange={(value) => updateField("profileVisibility", value)}
                helper="This controls the local demo visibility status until parent or admin review changes it."
              />
              <article className="surface-card nested-card inline-info-card">
                <p className="card-kicker">Trust summary</p>
                <h4>{teamVerificationLabel}</h4>
                <div className="detail-list">
                  <DetailRow label="Club / team status" value={teamVerificationLabel} />
                  <DetailRow
                    label="Parent approval"
                    value={isJunior ? "Required before visibility expands" : "Not required"}
                  />
                  <DetailRow label="Review status" value="Pending review" />
                  <DetailRow label="Scout visible status" value={form.profileVisibility} />
                </div>
              </article>
            </div>
          </article>

          <article className="form-section-card">
            <div className="form-section-header">
              <div>
                <p className="card-kicker">Optional detail</p>
                <h3>Availability</h3>
              </div>
              <p className="request-note">
                Show the opportunity types this athlete is open to while keeping contact requests inside the safe route.
              </p>
            </div>
            <div className="availability-panel">
              <p className="card-kicker">Availability and recruitment intent</p>
              <div className="checkbox-grid">
                <CheckboxChip
                  checked={form.availability.openToTrials}
                  label="Open to trials"
                  onChange={() => updateAvailability("openToTrials")}
                />
                <CheckboxChip
                  checked={form.availability.openToAcademy}
                  label="Open to academy opportunities"
                  onChange={() => updateAvailability("openToAcademy")}
                />
                {isJunior ? (
                  <>
                    <CheckboxChip
                      checked={form.availability.openToSchoolSport}
                      label="Open to school sport opportunities"
                      onChange={() => updateAvailability("openToSchoolSport")}
                    />
                    <CheckboxChip
                      checked={form.availability.openToRepresentativePathways}
                      label="Open to representative pathways"
                      onChange={() => updateAvailability("openToRepresentativePathways")}
                    />
                  </>
                ) : (
                  <>
                    <CheckboxChip
                      checked={form.availability.openToSeniorSigning}
                      label="Open to senior signing"
                      onChange={() => updateAvailability("openToSeniorSigning")}
                    />
                    <CheckboxChip
                      checked={form.availability.openToFirstGrade}
                      label="Open to first grade opportunities"
                      onChange={() => updateAvailability("openToFirstGrade")}
                    />
                    <CheckboxChip
                      checked={form.availability.openToReserveGrade}
                      label="Open to reserve grade opportunities"
                      onChange={() => updateAvailability("openToReserveGrade")}
                    />
                    <CheckboxChip
                      checked={form.availability.willingToRelocate}
                      label="Willing to relocate"
                      onChange={() => updateAvailability("willingToRelocate")}
                    />
                  </>
                )}
              </div>
              {!isJunior ? (
                <div className="detail-grid">
                  <FormField
                    label="Preferred states / regions"
                    value={form.availability.preferredLocations}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        availability: {
                          ...current.availability,
                          preferredLocations: value,
                        },
                      }))
                    }
                    placeholder="NSW metro, South East QLD, Canberra region"
                    helper="Optional. Use if the athlete has specific relocation or signing preferences."
                  />
                </div>
              ) : null}
              <article className="surface-card nested-card inline-info-card">
                <p className="card-kicker">Contact route</p>
                <h4>{isJunior ? "Parent or guardian controlled" : "Athlete controlled"}</h4>
                <p className="card-body">
                  {isJunior
                    ? "Junior contact goes to parent or guardian only. The platform uses contact requests only."
                    : "Adult athlete contact requests route to the athlete. The platform still uses contact requests only."}
                </p>
              </article>
            </div>
          </article>
            </div>
          ) : null}

          <div className="cta-row create-profile-save-row">
            <div className="quick-step-divider quick-step-divider-inline">
              <span>Step 4</span>
              <strong>Save profile</strong>
            </div>
            <button className="button button-subtle" onClick={() => submitForm("draft")} type="button">
              Save Draft
            </button>
            <button className="button button-primary" onClick={() => submitForm("submit")} type="button">
              Save Profile
            </button>
          </div>

          {statusMessage ? <p className="banner banner-success">{statusMessage}</p> : null}
          {status ? <p className="banner banner-success">{status}</p> : null}
        </article>

        <article className="surface-card create-profile-side-card">
          <p className="card-kicker">Builder checklist</p>
          <h3>A cleaner way to build the resume</h3>
          <p className="card-body">
            Your profile feeds the player-card layout, highlight workflow, safe contact requests, and trusted review surfaces.
          </p>
          <div className="checklist">
            {builderChecklist.map((item) => (
              <div className="check-item" key={item.label}>
                <span className={item.complete ? "check-mark done" : "check-mark"} />
                <p>{item.label}</p>
              </div>
            ))}
          </div>
          {lastSavedSummary ? (
            <article className="surface-card nested-card builder-side-note">
              <p className="card-kicker">Last saved profile</p>
              <h4>{lastSavedSummary.displayName}</h4>
              <div className="detail-list">
                <DetailRow label="Resume completeness" value={`${lastSavedSummary.completeness}%`} />
                <DetailRow label="Resume label" value={lastSavedSummary.label} />
                <DetailRow label="Current status" value={lastSavedSummary.profileStatus} />
                <DetailRow label="Contact route" value={lastSavedSummary.contactRoute} />
              </div>
              <div className="cta-row">
                <Link
                  className="button button-primary"
                  to={`/highlight-manager?athleteId=${lastSavedSummary.profileId}`}
                >
                  Add First Highlight
                </Link>
                <Link
                  className="button button-secondary"
                  to="/my-profile"
                >
                  Open My Profile
                </Link>
                <Link
                  className="button button-subtle"
                  to={`/resume/${lastSavedSummary.profileId}`}
                >
                  Preview Resume
                </Link>
              </div>
            </article>
          ) : null}
          <article className="surface-card nested-card builder-side-note">
            <p className="card-kicker">Directory status</p>
            <h4>{teamVerificationLabel}</h4>
            <p className="card-body">
              {matchedDirectoryTeam
                ? `${matchedDirectoryTeam.name} matches the starter seed for ${matchedDirectoryTeam.region}, ${matchedDirectoryTeam.state}.`
                : "If no team or club is in the starter directory, a custom local entry is saved as unverified without breaking the profile flow."}
            </p>
          </article>
          <article className="surface-card nested-card builder-side-note">
            <p className="card-kicker">Safety note</p>
            <div className="checklist">
              {[
                "No direct messaging. Contact requests only.",
                "Region only, not exact address.",
                isJunior
                  ? "Under-18 contact requests route to parent or guardian."
                  : "Adult contact requests route to the athlete.",
              ].map((item) => (
                <div className="check-item" key={item}>
                  <span className="check-mark done" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>
        </article>
      </div>
    </section>
  );
}

function HighlightManagerPage({
  athletes,
  highlights,
  mediaAssets,
  backendStatus,
  selectedRole,
  onSaveHighlight,
  onDeleteHighlight,
  onFeatureHighlight,
  onUploadHighlightThumbnail,
  onRunBuiltInPrivateVideoTest,
  onUploadHighlightVideo,
  onDeleteStoredMediaAsset,
  onDeleteStoredHighlightVideo,
  onCreateSignedMediaUrl,
  onCreateSignedVideoUrl,
  fullHighlightThumbnailTestState,
  onRunFullHighlightThumbnailTest,
}) {
  const location = useLocation();
  const preferredProfile =
    getLatestRoleProfile(athletes, selectedRole, true) ||
    getLatestRoleProfile(athletes, selectedRole) ||
    athletes[0] ||
    null;
  const requestedAthleteId =
    new URLSearchParams(location.search).get("athleteId") || preferredProfile?.id || athletes[0]?.id || "";
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState("");
  const [matchDetailsExpanded, setMatchDetailsExpanded] = useState(false);
  const [thumbnailUploadFile, setThumbnailUploadFile] = useState(null);
  const [thumbnailUploadStatus, setThumbnailUploadStatus] = useState("");
  const [thumbnailUploadIssue, setThumbnailUploadIssue] = useState(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("");
  const [videoUploadFile, setVideoUploadFile] = useState(null);
  const [videoUploadStatus, setVideoUploadStatus] = useState("");
  const [videoUploadIssue, setVideoUploadIssue] = useState("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [videoDeleteStatus, setVideoDeleteStatus] = useState("");
  const [videoReplaceStatus, setVideoReplaceStatus] = useState("");
  const [videoBuiltInTestRunning, setVideoBuiltInTestRunning] = useState(false);
  const videoFileInputRef = useRef(null);
  const [videoUploadReadiness, setVideoUploadReadiness] = useState(() => ({
    enabled: false,
    signedIn: false,
    bucketName: "msr-highlight-videos",
    bucketDetectedLabel: "unknown",
    allowedTypesLabel: "MP4, MOV, WEBM",
    maxFileSizeLabel: "100MB",
    publicMediaAccess: false,
    publicUrlsEnabled: false,
    videoUploadsEnabled: false,
    juniorApprovalRequired: true,
    adminReviewRequired: true,
    message:
      "Video upload is planned but not enabled yet. For now, add highlight metadata and upload a private thumbnail.",
  }));
  const preserveThumbnailSelectionOnNextEditRef = useRef(false);
  const preserveVideoSelectionOnNextEditRef = useRef(false);
  const customThumbnailUploadSuccessMessage =
    "Private thumbnail uploaded successfully. It is saved privately, linked to this highlight, pending review, and only visible through signed preview.";
  const [form, setForm] = useState(() => ({
    id: "",
    athleteId: requestedAthleteId,
    title: "",
    sport: "",
    highlightType: "",
    customHighlightType: "",
    matchType: "",
    matchEvent: "",
    roundLabel: "",
    competition: "",
    date: "",
    opponent: "",
    positionPlayed: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    verificationSource: "Unverified",
    showcaseStatus: "Profile Only",
  }));
  const selectedAthlete =
    athletes.find((item) => item.id === form.athleteId) ||
    preferredProfile ||
    athletes[0] ||
    null;
  const selectedAthleteSportDefinition =
    findSportDefinition(selectedAthlete?.sportId || selectedAthlete?.sport) ||
    getDefaultSportDefinition();
  const highlightTypeOptions = getDirectoryHighlightTypesForSport(
    selectedAthlete?.sport || selectedAthleteSportDefinition?.name || "Other",
  );
  const usesStructuredHighlightTypes = highlightTypeOptions.length > 0;
  const editingHighlight = editingId
    ? highlights.find((item) => item.id === editingId) || null
    : null;
  const suggestedTags = highlightTypeOptions.filter((item) => item !== NSW_RUGBY_LEAGUE_OTHER_OPTION);
  const highlightTypeSelectionValue = usesStructuredHighlightTypes
    ? getHighlightTypeSelectionValue(form.highlightType, selectedAthleteSportDefinition.id)
    : form.highlightType;
  const showCustomManagedHighlightTypeField =
    form.highlightType === NSW_RUGBY_LEAGUE_OTHER_OPTION;
  const positionPlayedSuggestionOptions = usesStructuredHighlightTypes
    ? getDirectoryPositionsForSport(selectedAthlete?.sport || selectedAthleteSportDefinition?.name).filter(
        (item) => item !== NSW_RUGBY_LEAGUE_OTHER_OPTION,
      )
    : getPositionOptionsForSport(selectedAthleteSportDefinition);
  const athleteHighlights = selectedAthlete
    ? getHighlightsForAthlete(highlights, selectedAthlete.id)
    : [];
  const hasSavedHighlightSelected = Boolean(editingId);
  const hasThumbnailFileSelected = Boolean(thumbnailUploadFile);
  const selectedHighlightIsSupabase = Boolean(
    hasSavedHighlightSelected &&
      normalizeText(editingHighlight?.source || editingHighlight?.storageSource || "").includes(
        "supabase",
      ),
  );
  const supabaseHighlightReady = Boolean(hasSavedHighlightSelected && selectedHighlightIsSupabase);
  const currentHighlightThumbnailAsset = hasSavedHighlightSelected
    ? getLatestHighlightThumbnailAsset(mediaAssets, editingId)
    : null;
  const currentHighlightVideoAsset = hasSavedHighlightSelected
    ? getLatestHighlightVideoAsset(mediaAssets, editingId)
    : null;
  const hasVideoFileSelected = Boolean(videoUploadFile);
  const videoUploadEnabled = Boolean(
    supabaseHighlightReady && videoUploadReadiness?.videoUploadsEnabled,
  );
  const videoUploadButtonReady = Boolean(videoUploadEnabled && hasVideoFileSelected);
  const videoUploadButtonStateLabel = videoUploadButtonReady ? "ready" : "locked";
  const videoReplaceReady = Boolean(
    supabaseHighlightReady && currentHighlightVideoAsset?.id && hasVideoFileSelected,
  );
  const videoUploadLockReasonLabel = !videoUploadReadiness?.signedIn
    ? "signed out"
    : !hasSavedHighlightSelected
      ? "missing saved highlight"
      : !selectedHighlightIsSupabase
        ? "saved on this device only"
        : !videoUploadReadiness?.videoUploadsEnabled
          ? "private uploads not ready"
          : !hasVideoFileSelected
            ? "missing video file"
            : "none";
  const videoUploadLockedMessage = !videoUploadReadiness?.signedIn
    ? "Sign in first. Video upload stays locked until you are signed in."
    : !hasSavedHighlightSelected || !selectedHighlightIsSupabase
      ? "Save a highlight first. Video upload is locked until the highlight is saved."
    : !videoUploadReadiness?.videoUploadsEnabled
        ? videoUploadReadiness?.message ||
          "Video upload is locked until private uploads are ready."
        : !hasVideoFileSelected
          ? "Choose an MP4, MOV, or WEBM video under 100MB before uploading."
          : "Video upload is ready.";
  const thumbnailNeedsFileReselect = Boolean(
    hasSavedHighlightSelected && !hasThumbnailFileSelected && thumbnailUploadIssue?.requiresFileReselect,
  );
  const showThumbnailRetryAction = Boolean(
    hasSavedHighlightSelected &&
      hasThumbnailFileSelected &&
      thumbnailUploadIssue?.canRetry &&
      !thumbnailNeedsFileReselect,
  );
  const selectedThumbnailActionLabel = showThumbnailRetryAction
    ? "Retry Private Thumbnail Upload"
    : supabaseHighlightReady
      ? "Upload Private Thumbnail Now"
      : "Save Highlight First & Upload Selected Thumbnail";
  const highlightCompetitionSuggestions = useMemo(() => {
    const options = [];

    if (selectedAthlete?.region) {
      options.push(selectedAthlete.region);
    }
    if (selectedAthlete?.competition) {
      options.push(selectedAthlete.competition);
    }
    if (usesStructuredHighlightTypes) {
      options.push("Club game", "School game", "Representative game", "Other");
    }

    return [...new Set(options.filter(Boolean))];
  }, [selectedAthlete?.competition, selectedAthlete?.region, usesStructuredHighlightTypes]);
  const hasOptionalMatchDetails = Boolean(
    form.matchEvent ||
      form.matchType ||
      form.roundLabel ||
      form.competition ||
      form.date ||
      form.opponent ||
      form.positionPlayed,
  );
  const showcaseOptions =
    selectedAthlete?.isJunior && !isHighlightParentApproved(editingHighlight)
      ? HIGHLIGHT_SHOWCASE_OPTIONS.filter((item) => item !== "Showcase Approved")
      : HIGHLIGHT_SHOWCASE_OPTIONS;

  function getEmptyForm(athlete, athleteId = athlete?.id || "") {
    const sportTags = getDirectoryHighlightTypesForSport(athlete?.sport || athlete?.sportId || "Other").filter(
      (item) => item !== NSW_RUGBY_LEAGUE_OTHER_OPTION,
    );
    return {
      id: "",
      athleteId,
      title: "",
      sport: athlete?.sport || "",
      highlightType: sportTags[0] || "",
      customHighlightType: "",
      matchType: "",
      matchEvent: "",
      roundLabel: "",
      competition: athlete?.competition || "",
      date: "",
      opponent: "",
      positionPlayed: athlete?.position || "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      verificationSource: athlete?.isJunior ? "Parent" : "Unverified",
      showcaseStatus: athlete?.isJunior ? "Private" : "Profile Only",
    };
  }

  useEffect(() => {
    if (!form.athleteId && requestedAthleteId) {
      const athlete = athletes.find((item) => item.id === requestedAthleteId) || preferredProfile;
      setForm(getEmptyForm(athlete, requestedAthleteId));
    }
  }, [athletes, form.athleteId, preferredProfile, requestedAthleteId]);

  useEffect(() => {
    if (editingId || !requestedAthleteId || requestedAthleteId === form.athleteId) {
      return;
    }

    const athlete = athletes.find((item) => item.id === requestedAthleteId) || preferredProfile;
    setForm(getEmptyForm(athlete, requestedAthleteId));
  }, [athletes, editingId, form.athleteId, preferredProfile, requestedAthleteId]);

  useEffect(() => {
    const preserveThumbnailState = preserveThumbnailSelectionOnNextEditRef.current;
    const preserveVideoState = preserveVideoSelectionOnNextEditRef.current;

    const clearVideoFileInputValue = () => {
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = "";
      }
    };

    if (preserveThumbnailState) {
      preserveThumbnailSelectionOnNextEditRef.current = false;
      setThumbnailPreviewUrl("");
    } else {
      setThumbnailUploadFile(null);
      setThumbnailUploadStatus("");
      setThumbnailUploadIssue(null);
      setThumbnailPreviewUrl("");
    }

    if (preserveVideoState) {
      preserveVideoSelectionOnNextEditRef.current = false;
    } else {
      setVideoUploadFile(null);
      setVideoUploadStatus("");
      setVideoUploadIssue("");
      setVideoPreviewUrl("");
      setVideoDeleteStatus("");
      setVideoReplaceStatus("");
      clearVideoFileInputValue();
    }
  }, [editingId]);

  useEffect(() => {
    let isCancelled = false;

    async function loadVideoUploadReadiness() {
      const result = await getManagedVideoUploadReadiness();
      if (isCancelled) {
        return;
      }

      setVideoUploadReadiness((current) => ({
        ...current,
        ...result,
      }));
    }

    loadVideoUploadReadiness();

    return () => {
      isCancelled = true;
    };
  }, [
    backendStatus?.mediaAssetTableDetectedLabel,
    backendStatus?.mediaStorageModeLabel,
    backendStatus?.videoUploadsEnabled,
  ]);

  function setThumbnailUploadFailure(result, options = {}) {
    const {
      afterSave = false,
      fallbackMessage = "Unknown error: private thumbnail upload could not be completed.",
    } = options;
    const nextMessage = String(result?.message || fallbackMessage).trim() || fallbackMessage;
    const nextIssue = {
      errorCategory: result?.errorCategory || "unknown_error",
      errorStage: result?.errorStage || "upload",
      canRetry: result?.canRetry !== false,
      requiresFileReselect: Boolean(result?.requiresFileReselect),
      message: nextMessage,
    };

    setThumbnailUploadIssue(nextIssue);
    if (nextIssue.requiresFileReselect) {
      setThumbnailUploadFile(null);
    }
    setThumbnailUploadStatus(afterSave ? `Highlight saved. ${nextMessage}` : nextMessage);
    return nextIssue;
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleAthleteChange(athleteId) {
    const athlete = athletes.find((item) => item.id === athleteId) || null;
    setEditingId("");
    setMatchDetailsExpanded(false);
    setStatus("");
    setThumbnailUploadFile(null);
    setThumbnailUploadStatus("");
    setThumbnailUploadIssue(null);
    setThumbnailPreviewUrl("");
    setForm(getEmptyForm(athlete, athleteId));
  }

  function resetForm(nextAthleteId = selectedAthlete?.id || requestedAthleteId) {
    const athlete = athletes.find((item) => item.id === nextAthleteId) || selectedAthlete;
    setEditingId("");
    setMatchDetailsExpanded(false);
    setThumbnailUploadFile(null);
    setThumbnailUploadStatus("");
    setThumbnailUploadIssue(null);
    setThumbnailPreviewUrl("");
    setForm(getEmptyForm(athlete, nextAthleteId));
  }

  function startEdit(highlight) {
    const athlete = athletes.find((item) => item.id === highlight.athleteId) || selectedAthlete;
    setEditingId(highlight.id);
    setStatus("");
    setMatchDetailsExpanded(
      Boolean(
        highlight.matchEvent ||
          highlight.eventName ||
          highlight.matchType ||
          highlight.roundLabel ||
          highlight.competition ||
          highlight.date ||
          highlight.eventDate ||
          highlight.opponent ||
          highlight.positionPlayed,
      ),
    );
    setForm({
      id: highlight.id,
      athleteId: highlight.athleteId,
      title: highlight.title || "",
      sport: athlete?.sport || highlight.sport || "",
      highlightType:
        usesStructuredHighlightTypes &&
        !suggestedTags.includes(highlight.highlightType || highlight.tag || "")
          ? NSW_RUGBY_LEAGUE_OTHER_OPTION
          : highlight.highlightType || highlight.tag || "",
      customHighlightType:
        usesStructuredHighlightTypes &&
        !suggestedTags.includes(highlight.highlightType || highlight.tag || "")
          ? highlight.highlightType || highlight.tag || ""
          : "",
      matchType: highlight.matchType || "",
      matchEvent: highlight.matchEvent || highlight.eventName || "",
      roundLabel: highlight.roundLabel || "",
      competition: highlight.competition || athlete?.competition || "",
      date: highlight.date || highlight.eventDate || "",
      opponent: highlight.opponent || "",
      positionPlayed: highlight.positionPlayed || athlete?.position || "",
      description: highlight.description || "",
      videoUrl: highlight.videoUrl || "",
      thumbnailUrl: highlight.thumbnailUrl || "",
      verificationSource: highlight.verificationSource || "Unverified",
      showcaseStatus: highlight.showcaseStatus || "Profile Only",
    });
  }

  function handleThumbnailFileChange(event) {
    const nextFile = event.target.files?.[0] || null;
    setThumbnailUploadFile(nextFile);
    setThumbnailUploadIssue(null);

    if (!hasSavedHighlightSelected) {
      setThumbnailUploadStatus(
        nextFile
          ? "Save the highlight first. Your selected thumbnail will upload after the highlight is saved securely."
          : "Choose a JPG, PNG, or WEBP thumbnail under 5MB, then save the highlight to upload it privately.",
      );
      return;
    }

    if (!selectedHighlightIsSupabase) {
      setThumbnailUploadStatus(
        nextFile
          ? "This highlight will be saved securely first, then the private thumbnail will upload."
          : "This highlight is not saved securely yet. Choose a thumbnail, then save it before uploading privately.",
      );
      return;
    }

    setThumbnailUploadStatus(
      nextFile
        ? "Thumbnail image selected. Click Upload Private Thumbnail Now."
        : "Please choose the thumbnail image again, then click Upload Private Thumbnail.",
    );
  }

  async function createBuiltInTestThumbnailFile() {
    if (typeof document === "undefined") {
      return {
        success: false,
        message: "Built-in test thumbnail generation needs a live browser session.",
      };
    }

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const context = canvas.getContext("2d");

    if (!context) {
      return {
        success: false,
        message: "Built-in test thumbnail generation could not start the image canvas.",
      };
    }

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#0d1c17");
    gradient.addColorStop(0.55, "#123428");
    gradient.addColorStop(1, "#1f6b43");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "rgba(255, 255, 255, 0.08)";
    context.fillRect(28, 28, canvas.width - 56, canvas.height - 56);

    context.fillStyle = "#d8f8e7";
    context.font = "700 30px Georgia, serif";
    context.fillText("MY SPORTS RESUME", 44, 78);

    context.fillStyle = "#ffffff";
    context.font = "700 34px Georgia, serif";
    context.fillText("Private Test Thumbnail", 44, 146);

    context.fillStyle = "#b8dbc9";
    context.font = "500 18px Arial, sans-serif";
    context.fillText(selectedAthlete?.displayName || "Athlete profile", 46, 194);
    context.fillText(form.title || editingHighlight?.title || "Saved highlight", 46, 224);
    context.fillText("Owner-only preview · No public URL · Video disabled", 46, 284);
    context.fillText("Pending review until approval rules are satisfied", 46, 312);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!blob) {
      return {
        success: false,
        message: "Built-in test thumbnail generation could not create a PNG image.",
      };
    }

    const fileName = `msr-test-thumbnail-${Date.now()}.png`;
    return {
      success: true,
      file: new File([blob], fileName, { type: "image/png" }),
    };
  }

  async function submitHighlight(options = {}) {
    const {
      preserveThumbnailSelection = false,
      fromThumbnailFlow = false,
      fromVideoFlow = false,
      autoUploadThumbnail = false,
      forceSupabaseForThumbnail = false,
    } = options;
    const selectedThumbnailFile = thumbnailUploadFile;
    if (!form.athleteId) {
      const message = "Select an athlete profile before saving a highlight.";
      setStatus(message);
      if (fromThumbnailFlow) {
        setThumbnailUploadStatus(message);
      }
      if (fromVideoFlow) {
        setVideoUploadIssue(message);
        setVideoUploadStatus(message);
      }
      return { success: false, message };
    }

    const resolvedHighlightType = resolveSelectableValue(
      form.highlightType,
      form.customHighlightType,
    );
    if (!resolvedHighlightType) {
      const message = "Choose a highlight type before saving the highlight.";
      setStatus(message);
      if (fromThumbnailFlow) {
        setThumbnailUploadStatus(message);
      }
      if (fromVideoFlow) {
        setVideoUploadIssue(message);
        setVideoUploadStatus(message);
      }
      return { success: false, message };
    }

    const autoGeneratedTitle = buildAutoHighlightTitle({
      highlightType: form.highlightType,
      customHighlightType: form.customHighlightType,
      positionPlayed: form.positionPlayed || selectedAthlete?.position || "",
      matchType: form.matchType,
      existingTitle: form.title,
    });

    const result = await onSaveHighlight({
      ...form,
      title: autoGeneratedTitle,
      sport: selectedAthlete?.sport || form.sport,
      highlightType: resolvedHighlightType || "Match highlight",
      forceSupabaseForThumbnail,
    });

    if (!result?.success) {
      const message = result?.message || "The highlight could not be saved right now.";
      setStatus(message);
      if (fromThumbnailFlow) {
        setThumbnailUploadStatus(message);
      }
      return { success: false, message };
    }

    const savedHighlight = result.highlight;
    if (preserveThumbnailSelection && selectedThumbnailFile) {
      preserveThumbnailSelectionOnNextEditRef.current = true;
    }
    if (fromVideoFlow) {
      preserveVideoSelectionOnNextEditRef.current = true;
    }
    startEdit(savedHighlight);
    const baseMessage =
      result?.message ||
      `Highlight saved. ${getHighlightShowcaseLabel(savedHighlight)} / ${getHighlightVerificationLabel(savedHighlight)}.`;
    let successMessage = baseMessage;
    setThumbnailUploadIssue(null);

    if (autoUploadThumbnail && selectedThumbnailFile) {
      if (result?.source !== "supabase" || result?.fallback === true) {
        const nextIssue = setThumbnailUploadFailure(
          {
            errorCategory: "highlight_not_saved_error",
            errorStage: "highlight_save",
            canRetry: true,
            requiresFileReselect: false,
            message:
              "Highlight save error: this highlight is still saved on this device only. Save it securely first before uploading a private thumbnail.",
          },
          { afterSave: true },
        );
        successMessage = `${baseMessage} ${
          nextIssue.canRetry
            ? "Retry the private thumbnail upload after the highlight saves securely."
            : "The private thumbnail upload is blocked until the highlight saves securely."
        }`;
        setStatus(successMessage);
        return {
          success: true,
          highlight: savedHighlight,
          athlete: result.athlete,
          message: successMessage,
          saveSource: result?.source || "localStorage",
          saveFallback: result?.fallback !== false,
        };
      }

      setThumbnailUploadStatus("Highlight saved. Uploading the private thumbnail...");
      const thumbnailResult = await onUploadHighlightThumbnail(selectedThumbnailFile, savedHighlight.id);

      if (thumbnailResult?.success) {
        setThumbnailPreviewUrl(thumbnailResult?.signedUrl || "");
        setThumbnailUploadFile(null);
        if (!thumbnailResult?.signedUrl) {
          const signedUrlMessage =
            "Signed URL error: the private thumbnail uploaded and media_assets was linked, but the signed owner preview could not be created right now.";
          setThumbnailUploadIssue({
            errorCategory: "signed_url_error",
            errorStage: "signed_url",
            canRetry: true,
            requiresFileReselect: false,
            message: signedUrlMessage,
          });
          successMessage = signedUrlMessage;
          setThumbnailUploadStatus(signedUrlMessage);
        } else {
          setThumbnailUploadIssue(null);
          successMessage = customThumbnailUploadSuccessMessage;
          setThumbnailUploadStatus(successMessage);
        }
      } else {
        const nextIssue = setThumbnailUploadFailure(thumbnailResult, {
          afterSave: true,
          fallbackMessage: "Unknown error: private thumbnail upload could not be completed.",
        });
        successMessage = `${baseMessage} ${
          nextIssue.requiresFileReselect
            ? "Please choose the thumbnail image again, then click Upload Private Thumbnail."
            : "Retry the private thumbnail upload with the button below."
        }`;
      }
    } else if (preserveThumbnailSelection && selectedThumbnailFile) {
      successMessage =
        result?.source === "supabase" && result?.fallback !== true
          ? `${baseMessage} Highlight saved. You can now upload the private thumbnail.`
          : `${baseMessage} This highlight is still saved on this device only, so the private thumbnail upload cannot start yet.`;
    }

    setStatus(successMessage);
    if (fromThumbnailFlow && !(autoUploadThumbnail && selectedThumbnailFile)) {
      setThumbnailUploadStatus(
        result?.source === "supabase" && result?.fallback !== true
          ? "Highlight saved. You can now upload the private thumbnail."
          : "This highlight is still saved on this device only, so the private thumbnail upload cannot start yet.",
      );
    }
    if (fromVideoFlow) {
      const savedToSupabase = result?.source === "supabase" && result?.fallback !== true;
      const videoMessage = savedToSupabase
        ? "Highlight saved securely. Video upload is now unlocked."
        : "Highlight save error: the video upload is still locked because this highlight did not save securely.";
      setVideoUploadIssue(savedToSupabase ? "" : videoMessage);
      setVideoUploadStatus(videoMessage);
    }
    return {
      success: true,
      highlight: savedHighlight,
      athlete: result.athlete,
      message: successMessage,
      saveSource: result?.source || "localStorage",
      saveFallback: result?.fallback !== false,
    };
  }

  async function handleDelete() {
    if (!editingId) {
      return;
    }

    const result = await onDeleteHighlight(editingId);
    setStatus(result?.message || "Highlight removed from the profile media library.");
    resetForm();
  }

  async function handleThumbnailUpload() {
    if (!hasSavedHighlightSelected) {
      setThumbnailUploadIssue(null);
      setThumbnailUploadStatus("Save the highlight first, then upload a thumbnail.");
      return;
    }

    if (!thumbnailUploadFile) {
      setThumbnailUploadFailure(
        {
          errorCategory: "file_missing_error",
          errorStage: "validation",
          canRetry: false,
          requiresFileReselect: true,
          message: "Please choose the thumbnail image again, then click Upload Private Thumbnail.",
        },
        { fallbackMessage: "Please choose the thumbnail image again, then click Upload Private Thumbnail." },
      );
      return;
    }

    setThumbnailUploadIssue(null);
    setThumbnailUploadStatus("Uploading a private thumbnail...");
    const result = await onUploadHighlightThumbnail(thumbnailUploadFile, editingId);

    if (!result?.success) {
      setThumbnailUploadFailure(result, {
        fallbackMessage: "Unknown error: private thumbnail upload could not be completed.",
      });
      return;
    }

    setThumbnailPreviewUrl(result?.signedUrl || "");
    setThumbnailUploadFile(null);
    if (!result?.signedUrl) {
      const signedUrlMessage =
        "Signed URL error: the private thumbnail uploaded and media_assets was linked, but the signed owner preview could not be created right now.";
      setThumbnailUploadIssue({
        errorCategory: "signed_url_error",
        errorStage: "signed_url",
        canRetry: true,
        requiresFileReselect: false,
        message: signedUrlMessage,
      });
      setThumbnailUploadStatus(signedUrlMessage);
      setStatus(signedUrlMessage);
      return;
    }

    setThumbnailUploadIssue(null);
    setThumbnailUploadStatus(customThumbnailUploadSuccessMessage);
    setStatus(customThumbnailUploadSuccessMessage);
  }

  async function handleSaveHighlightAction() {
    await submitHighlight({
      preserveThumbnailSelection: hasThumbnailFileSelected,
      fromThumbnailFlow: hasThumbnailFileSelected,
    });
  }

  async function ensureSupabaseHighlightReadyForThumbnailUpload() {
    if (!hasSavedHighlightSelected) {
      setThumbnailUploadIssue(null);
      setThumbnailUploadStatus("Save the highlight first, then upload a thumbnail.");
      return { success: false, message: "Save the highlight first, then upload a thumbnail." };
    }

    if (selectedHighlightIsSupabase) {
      return { success: true, highlightId: editingId };
    }

    const message =
      "This highlight is saved on this device only. Save it securely before uploading a private thumbnail.";
    setThumbnailUploadFailure(
      {
        errorCategory: "highlight_not_saved_error",
        errorStage: "highlight_source",
        canRetry: false,
        requiresFileReselect: false,
        message,
      },
      { fallbackMessage: message },
    );
    return { success: false, message };
  }

  async function handleBuiltInTestThumbnailUpload() {
    const readyResult = await ensureSupabaseHighlightReadyForThumbnailUpload();
    if (!readyResult.success) {
      return;
    }

    setThumbnailUploadIssue(null);
    setThumbnailUploadStatus("Creating a built-in private test thumbnail...");
    const generatedFileResult = await createBuiltInTestThumbnailFile();

    if (!generatedFileResult?.success || !generatedFileResult?.file) {
      setThumbnailUploadFailure(
        {
          errorCategory: "unknown_error",
          errorStage: "generated_thumbnail",
          canRetry: true,
          requiresFileReselect: false,
          message:
            generatedFileResult?.message ||
            "Unknown error: the built-in test thumbnail image could not be generated.",
        },
        { fallbackMessage: "Unknown error: the built-in test thumbnail image could not be generated." },
      );
      return;
    }

    setThumbnailUploadStatus("Uploading a built-in private test thumbnail...");
    const result = await onUploadHighlightThumbnail(generatedFileResult.file, readyResult.highlightId);

    if (!result?.success) {
      setThumbnailUploadFailure(result, {
        fallbackMessage: "Unknown error: the built-in private test thumbnail upload could not be completed.",
      });
      return;
    }

    setThumbnailPreviewUrl(result?.signedUrl || "");
    setThumbnailUploadIssue(null);
    setThumbnailUploadStatus(
      `PASS — built-in private test thumbnail uploaded. ${result?.message || "Signed private preview loaded for the signed-in owner only."}`,
    );
    setStatus("PASS — built-in private test thumbnail uploaded successfully.");
  }

  async function handleSelectedThumbnailUploadAction() {
    if (!thumbnailUploadFile) {
      setThumbnailUploadFailure(
        {
          errorCategory: "file_missing_error",
          errorStage: "validation",
          canRetry: false,
          requiresFileReselect: true,
          message: "Please choose the thumbnail image again, then click Upload Private Thumbnail.",
        },
        { fallbackMessage: "Please choose the thumbnail image again, then click Upload Private Thumbnail." },
      );
      return;
    }

    if (supabaseHighlightReady) {
      await handleThumbnailUpload();
      return;
    }

    setThumbnailUploadIssue(null);
    setThumbnailUploadStatus(
      hasSavedHighlightSelected
        ? "This highlight will be saved securely first, then the private thumbnail will upload."
        : "Saving the highlight securely, then uploading the private thumbnail...",
    );
    await submitHighlight({
      preserveThumbnailSelection: true,
      fromThumbnailFlow: true,
      autoUploadThumbnail: true,
      forceSupabaseForThumbnail: true,
    });
  }

  async function handleThumbnailPreviewLoad() {
    if (!currentHighlightThumbnailAsset?.id) {
      setThumbnailUploadStatus("No private thumbnail asset is linked to this highlight yet.");
      return;
    }

    setThumbnailUploadStatus("Creating a signed owner preview URL for the private thumbnail...");
    const result = await onCreateSignedMediaUrl(currentHighlightThumbnailAsset.id);

    if (!result?.success) {
      setThumbnailUploadStatus(result?.message || "Private thumbnail preview could not be created.");
      return;
    }

    setThumbnailPreviewUrl(result.signedUrl || "");
    setThumbnailUploadStatus("Private thumbnail preview loaded for the signed-in owner only.");
  }

  async function handleThumbnailDelete() {
    if (!currentHighlightThumbnailAsset?.id) {
      setThumbnailUploadStatus("No private thumbnail asset is linked to this highlight yet.");
      return;
    }

    setThumbnailUploadStatus("Deleting the private highlight thumbnail...");
    const result = await onDeleteStoredMediaAsset(currentHighlightThumbnailAsset.id);

    if (!result?.success) {
      setThumbnailUploadStatus(result?.message || "Private thumbnail delete could not be completed.");
      return;
    }

    setThumbnailPreviewUrl("");
    setThumbnailUploadFile(null);
    setThumbnailUploadStatus(result?.message || "Private highlight thumbnail deleted.");
  }

  function handleVideoFileChange(event) {
    const file = event.target.files?.[0] || null;
    setVideoUploadFile(file);
    setVideoUploadIssue("");
    setVideoDeleteStatus("");

    if (!file) {
      setVideoReplaceStatus("");
      if (!currentHighlightVideoAsset?.id) {
        setVideoPreviewUrl("");
      }
      setVideoUploadStatus("Choose a private MP4, MOV, or WEBM file under 100MB.");
      return;
    }

    if (!hasSavedHighlightSelected) {
      setVideoReplaceStatus("");
      setVideoPreviewUrl("");
      setVideoUploadStatus("Save or select a saved highlight before uploading a private video.");
      return;
    }

    if (!selectedHighlightIsSupabase) {
      setVideoReplaceStatus("");
      setVideoPreviewUrl("");
      setVideoUploadStatus(
        "This highlight is saved on this device only. Save it securely first before private video upload can run.",
      );
      return;
    }

    setVideoReplaceStatus(
      currentHighlightVideoAsset?.id
        ? "Replace ready: the current private video stays in place until the new upload finishes successfully."
        : "No existing private video will be replaced by this upload.",
    );
    setVideoUploadStatus(
      currentHighlightVideoAsset?.id
        ? "Private replacement video selected. Click Replace Private Highlight Video to upload the new private file and remove the old one after success."
        : "Private video selected. Click Upload Private Highlight Video to store it privately for owner-only signed preview.",
    );
  }

  async function handleSaveSupabaseHighlightFirst() {
    setVideoUploadIssue("");
    setVideoDeleteStatus("");
    setVideoReplaceStatus("");
    setVideoUploadStatus("Saving the highlight securely first...");
    await submitHighlight({
      fromVideoFlow: true,
      forceSupabaseForThumbnail: true,
    });
  }

  async function handleBuiltInVideoTest() {
    if (videoBuiltInTestRunning) {
      return;
    }

    setVideoBuiltInTestRunning(true);
    setVideoUploadIssue("");
    setVideoUploadStatus("Running the built-in private video test...");

    try {
      const result = await onRunBuiltInPrivateVideoTest();
      if (!result?.success) {
        const message =
          result?.message ||
          "Built-in browser video generation not supported. Use a real MP4/MOV/WEBM file.";
        setVideoUploadIssue(message);
        setVideoReplaceStatus("");
        setVideoUploadStatus(message);
        return;
      }

      if (result?.highlight) {
        preserveVideoSelectionOnNextEditRef.current = true;
        startEdit(result.highlight);
      }

      setVideoPreviewUrl(result?.signedUrl || "");
      setVideoUploadFile(null);
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = "";
      }
      setVideoUploadIssue("");
      setVideoDeleteStatus("");
      setVideoReplaceStatus(
        "Built-in test upload completed. No existing private video was replaced unless the QA highlight already had one.",
      );
      setVideoUploadStatus(
        `PASS - built-in private video test uploaded successfully. ${
          result?.message || "Signed private preview loaded for the signed-in owner only."
        } Use Delete Private Video if you want to clean up the test upload.`,
      );
      setStatus("PASS - built-in private video test uploaded successfully.");
    } finally {
      setVideoBuiltInTestRunning(false);
    }
  }

  async function handleVideoUpload() {
    if (!hasSavedHighlightSelected || !selectedHighlightIsSupabase) {
      const message =
        !hasSavedHighlightSelected
          ? "Save or select a saved highlight before uploading a private video."
          : "This highlight is saved on this device only. Save it securely first before private video upload can run.";
      setVideoUploadIssue(message);
      setVideoReplaceStatus("");
      setVideoUploadStatus(message);
      return;
    }

    if (!videoUploadFile) {
      const message = "Choose a private MP4, MOV, or WEBM file under 100MB first.";
      setVideoUploadIssue(message);
      setVideoReplaceStatus("");
      setVideoUploadStatus(message);
      return;
    }

    const replacingExistingVideo = Boolean(currentHighlightVideoAsset?.id);
    setVideoUploadIssue("");
    setVideoDeleteStatus("");
    setVideoReplaceStatus(
      replacingExistingVideo
        ? "Replacing the current private video after the new upload succeeds..."
        : "Uploading a new private video.",
    );
    setVideoUploadStatus(
      replacingExistingVideo
        ? "Uploading the new private highlight video first. The old private video will be deleted only after this succeeds."
        : "Uploading a private highlight video...",
    );
    const result = await onUploadHighlightVideo(videoUploadFile, editingId);

    if (!result?.success) {
      const message = result?.message || "Unknown error: private highlight video upload could not be completed.";
      setVideoUploadIssue(message);
      setVideoReplaceStatus(
        replacingExistingVideo
          ? "Replace did not complete. The previous private video should still be unchanged."
          : "Upload did not complete.",
      );
      setVideoUploadStatus(message);
      return;
    }

    setVideoPreviewUrl(result?.signedUrl || "");
    setVideoUploadIssue(result?.signedUrl ? "" : result?.message || "");
    setVideoUploadFile(null);
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = "";
    }
    setVideoDeleteStatus("");
    if (!result?.signedUrl) {
      const message =
        result?.message ||
        "Signed URL error: the private highlight video uploaded, but the owner preview could not be created right now.";
      setVideoUploadIssue(message);
      setVideoReplaceStatus(
        result?.replaceMessage ||
          (replacingExistingVideo
            ? "Replace may be partial. Check the current private video status below."
            : "Upload completed, but signed preview did not load."),
      );
      setVideoUploadStatus(message);
      setStatus(message);
      return;
    }

    setVideoReplaceStatus(
      result?.replaceMessage ||
        (replacingExistingVideo
          ? "Replace complete: the old private video was removed after the new upload succeeded."
          : "No previous private video needed replacement."),
    );
    setVideoUploadStatus(
      result?.message ||
        "Private highlight video uploaded successfully. It stays private, linked to this highlight, pending review, and only visible through signed owner preview.",
    );
    setStatus(
      result?.message ||
        "Private highlight video uploaded successfully. It stays private, linked to this highlight, pending review, and only visible through signed owner preview.",
    );
  }

  async function handleVideoPreviewLoad() {
    if (!currentHighlightVideoAsset?.id) {
      const message = "No private highlight video is linked to this highlight yet.";
      setVideoUploadIssue("");
      setVideoUploadStatus(message);
      return;
    }

    setVideoUploadIssue("");
    setVideoUploadStatus("Creating a signed owner preview URL for the private highlight video...");
    const result = await onCreateSignedVideoUrl(currentHighlightVideoAsset.id);

    if (!result?.success) {
      const message = result?.message || "Private highlight video preview could not be created.";
      setVideoUploadIssue(message);
      setVideoUploadStatus(message);
      return;
    }

    setVideoPreviewUrl(result.signedUrl || "");
    setVideoDeleteStatus("");
    setVideoUploadStatus("Private highlight video preview loaded for the signed-in owner only.");
  }

  async function handleVideoDelete() {
    if (!currentHighlightVideoAsset?.id) {
      const message = "No private highlight video is linked to this highlight yet.";
      setVideoUploadIssue("");
      setVideoUploadStatus(message);
      return;
    }

    setVideoUploadIssue("");
    setVideoReplaceStatus("");
    setVideoDeleteStatus("Deleting the current private video from private storage and metadata...");
    setVideoUploadStatus("Deleting the private highlight video...");
    const result = await onDeleteStoredHighlightVideo(currentHighlightVideoAsset.id);

    if (!result?.success) {
      const message = result?.message || "Private highlight video delete could not be completed.";
      setVideoUploadIssue(message);
      setVideoDeleteStatus(message);
      setVideoUploadStatus(message);
      return;
    }

    setVideoPreviewUrl("");
    setVideoUploadFile(null);
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = "";
    }
    setVideoDeleteStatus(
      result?.deletedObjectPath
        ? "Delete complete: the private video file was removed and the highlight record was cleared."
        : result?.message || "Private highlight video deleted.",
    );
    setVideoUploadStatus(result?.message || "Private highlight video deleted.");
  }

  if (athletes.length === 0) {
    return (
      <section className="page-stack">
        <SectionHeading
          eyebrow="Highlight manager"
          title="No athlete profile found"
          description="Create your sports resume first, then attach highlights to that profile."
        />
        <article className="surface-card empty-state-card">
          <p className="card-kicker">No profiles available</p>
          <p className="card-body">Create your sports resume to unlock the Highlight Manager.</p>
          <Link className="button button-primary" to="/create-profile">
            Create Your Sports Resume
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="Highlight manager"
        title="Add highlights and private media"
        description="Pick the athlete, choose the highlight type, upload private media if you want, and save."
      />

      <article className="surface-card dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Media workflow</p>
          <h2>{selectedAthlete?.displayName || "Athlete profile"}</h2>
          <p className="hero-text">
            {joinMeta([
              selectedAthlete?.sport,
              selectedAthlete?.position,
              selectedAthlete?.competitionLevel,
              getLocationSummary(selectedAthlete),
            ])}
          </p>
              <div className="badge-row">
                <span className="status-chip status-chip-opportunity">
                  {athleteHighlights.length} highlight{athleteHighlights.length === 1 ? "" : "s"}
                </span>
                <span className="status-chip">
                  {selectedAthlete?.profileVisibleHighlightCount || 0} resume-ready clips
                </span>
                <span className="status-chip">
                  {selectedAthlete?.showcaseReadyHighlightCount || 0} showcase-approved clips
                </span>
              </div>
        </div>
        <div className="dashboard-actions">
          <Link className="button button-primary" to={`/resume/${selectedAthlete?.id}`}>
            Preview Resume
          </Link>
          <Link className="button button-secondary" to="/highlights">
            View Showcase
          </Link>
          <button className="button button-subtle" onClick={() => resetForm()} type="button">
            Add New Highlight
          </button>
        </div>
      </article>

      <div className="dashboard-stat-grid">
        <MetricCard
          label="Managed highlights"
          value={`${athleteHighlights.length}`}
          detail="Highlights attached to the selected athlete profile"
          tone="gold"
        />
        <MetricCard
          label="Pending approvals"
          value={`${
            athleteHighlights.filter(
              (item) =>
                item.approvalStatus === "Pending Parent Approval" ||
                item.approvalStatus === "Pending Admin Review",
            ).length
          }`}
          detail="Review still controls visibility and trust status"
          tone="blue"
        />
        <MetricCard
          label="Featured clip"
          value={
            athleteHighlights.find((item) => item.isFeatured)?.title
              ? "Set"
              : "Not set"
          }
          detail="Featured highlights appear first on the athlete resume"
          tone="success"
        />
      </div>

      <article className="surface-card trust-statement">
        <div>
          <p className="eyebrow">Proof for the resume</p>
          <h3>Professional highlight management</h3>
          <p className="card-body">
            Talent Boost helps strong approved clips gain visibility inside a clean, request-only platform.
          </p>
        </div>
        <div className="trust-points">
          <TrustPoint title="Resume evidence" copy="Each clip is tied to a profile, match or event, sport context, and verification pathway." />
          <TrustPoint title="Junior controls" copy="Junior highlights require parent or guardian approval before showcase visibility." />
          <TrustPoint title="Safe visibility" copy="Private clips stay off the public resume until the right approval and visibility settings are in place." />
        </div>
      </article>

      {status ? <p className="banner banner-success">{status}</p> : null}

      <SportPathwayStrip
        title="Choose your sport"
        description="Pick athlete -> choose highlight type -> upload private thumbnail or video if wanted -> save."
        selectedSport={selectedAthlete?.sport || ""}
        compact
        contextNote="You can add match details later. Private media stays private until reviewed."
      />

      <div className="create-profile-grid highlight-manager-grid">
        <article className="surface-card create-profile-form-card">
          <div className="form-section-header">
            <div>
              <p className="card-kicker">{editingId ? "Edit highlight" : "Add highlight"}</p>
              <h3>{editingId ? "Update highlight details" : "Attach a new highlight to the athlete resume"}</h3>
            </div>
            <p className="request-note">
              Start with the athlete and the highlight type. Match details are optional and private uploads stay private.
            </p>
          </div>

          <div className="detail-grid">
            <label className="form-field detail-grid-full">
              <span>Athlete / profile selector</span>
              <select value={form.athleteId} onChange={(event) => handleAthleteChange(event.target.value)}>
                {athletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.displayName} - {athlete.sport} - {athlete.ageGroup}
                  </option>
                ))}
              </select>
              <p className="field-helper">Attach the highlight to the correct athlete resume before saving.</p>
            </label>
            <div className="detail-grid-full surface-card nested-card highlight-context-card">
              <p className="card-kicker">Selected athlete context</p>
              <h4>Quick path: choose athlete, choose highlight type, save.</h4>
              <p className="card-body">
                {joinMeta([
                  selectedAthlete?.sport,
                  selectedAthlete?.ageGroup,
                  selectedAthlete?.position,
                  selectedAthlete?.competition || selectedAthlete?.region,
                ])}
              </p>
              <div className="badge-row">
                <span className="badge">Title can be auto-created</span>
                <span className="badge">Match details are optional</span>
                <span className="badge">No public media URL</span>
              </div>
            </div>
            <ChoiceChipGroup
              helper="Sport-specific highlight types are click-based so kids and parents do not need to type them. Use Other only when needed."
              label="What happened in the clip?"
              onChange={(value) => updateField("highlightType", value)}
              options={highlightTypeOptions}
              value={highlightTypeSelectionValue}
            />
            {showCustomManagedHighlightTypeField ? (
              <FormField
                label="Custom highlight type"
                value={form.customHighlightType}
                onChange={(value) => updateField("customHighlightType", value)}
                placeholder="Enter custom highlight type"
                helper="Only use this if the starter highlight list does not fit."
              />
            ) : null}
              <FormField
              label="Clip title optional"
              value={form.title}
              onChange={(value) => updateField("title", value)}
              placeholder="Leave this blank and the app will create a clean title for you"
              helper="Kids and parents do not need to write a perfect title. If you leave this blank, the app will generate one from the selected highlight type."
            />
            <FormField
              label="Short description optional"
              value={form.description}
              onChange={(value) => updateField("description", value)}
              placeholder="One short note about what coaches should notice in the clip"
              helper="Keep it short and factual. You can skip this too."
            />
            <div className="detail-grid-full surface-card nested-card highlight-optional-card">
              <div className="highlight-optional-header">
                <div>
                  <p className="card-kicker">Match details optional</p>
                  <h4>Skip this if you do not know the round, opponent, or competition.</h4>
                </div>
                <button
                  className="button button-secondary highlight-optional-toggle"
                  onClick={() => setMatchDetailsExpanded((current) => !current)}
                  type="button"
                >
                  {matchDetailsExpanded ? "Hide optional details" : "Add match details optional"}
                </button>
              </div>
              <p className="request-note">
                {hasOptionalMatchDetails
                  ? "Optional match details are already attached to this clip. You can keep editing them here, or leave them alone."
                  : "The basic highlight save path is athlete plus highlight type, with an optional title or short description."}
              </p>
              {matchDetailsExpanded ? (
                <div className="detail-grid highlight-optional-grid">
                  {usesStructuredHighlightTypes ? (
                    <>
                      <FormField
                        label="Match type"
                        select
                        value={form.matchType}
                        options={RUGBY_LEAGUE_MATCH_TYPE_OPTIONS}
                        onChange={(value) => updateField("matchType", value)}
                        placeholderOption="Select match type"
                        helper="Pick the closest option. This is optional."
                      />
                      <FormField
                        label="Round"
                        select
                        value={form.roundLabel}
                        options={RUGBY_LEAGUE_ROUND_OPTIONS}
                        onChange={(value) => updateField("roundLabel", value)}
                        placeholderOption="Select round"
                        helper="Only add the round if you know it."
                      />
                    </>
                  ) : null}
                  <FormField
                    label="Match / event name"
                    value={form.matchEvent}
                    onChange={(value) => updateField("matchEvent", value)}
                    placeholder="Match or event name if known"
                    helper="Optional. This can stay blank."
                  />
                  <FormField
                    label="Competition / group"
                    value={form.competition}
                    onChange={(value) => updateField("competition", value)}
                    placeholder="Competition or group if known"
                    listId={`highlight-competition-${selectedAthlete?.id || "default"}`}
                    listOptions={highlightCompetitionSuggestions}
                    helper="The selected athlete's Rugby League group or competition is suggested here when it helps."
                  />
                  <label className="form-field">
                    <span>Date</span>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(event) => updateField("date", event.target.value)}
                    />
                    <p className="field-helper">Optional. Add the date only if you know it.</p>
                  </label>
                  <FormField
                    label="Opponent"
                    value={form.opponent}
                    onChange={(value) => updateField("opponent", value)}
                    placeholder="Opponent if known"
                    helper="Optional free text only."
                  />
                  <FormField
                    label="Position played"
                    value={form.positionPlayed}
                    onChange={(value) => updateField("positionPlayed", value)}
                    placeholder="Position if known"
                    listId={`highlight-position-played-${selectedAthlete?.sportId || "all"}`}
                    listOptions={positionPlayedSuggestionOptions}
                    helper="Optional. Use the athlete's usual position or type a different one if this clip was from another role."
                  />
                </div>
              ) : null}
            </div>
            <label className="form-field detail-grid-full">
              <span>Choose your own thumbnail</span>
              <input
                accept="image/jpeg,image/png,image/webp"
                onChange={handleThumbnailFileChange}
                type="file"
              />
              <p className="field-helper">
                {!hasSavedHighlightSelected
                  ? hasThumbnailFileSelected
                    ? "Save the highlight first. Your selected thumbnail will upload after the highlight is saved securely."
                    : "Choose a private JPG, PNG, or WEBP thumbnail under 5MB. The app will save the highlight securely first, then upload the thumbnail privately."
                  : !selectedHighlightIsSupabase
                    ? "This highlight will be saved securely first, then the private thumbnail will upload."
                    : "Optional custom upload. Use a private JPG, PNG, or WEBP thumbnail under 5MB. No public URL is created. Junior uploads stay pending parent/guardian approval, adult uploads stay pending admin review, and video upload comes later."}
              </p>
            </label>
            <div className="detail-grid-full surface-card nested-card">
              <p className="card-kicker">Private thumbnail tools</p>
              <h4>
                {hasSavedHighlightSelected
                  ? selectedHighlightIsSupabase
                    ? "Owner-only thumbnail upload"
                    : "Save highlight first"
                  : "Save highlight first"}
              </h4>
              <p className="card-body">
                {hasSavedHighlightSelected
                  ? selectedHighlightIsSupabase
                    ? "Choose your own image and upload it privately for this saved highlight. No public URL is created."
                    : "This highlight will be saved securely first, then the private thumbnail will upload."
                  : "Choose a thumbnail now, then save the highlight and upload it privately."}
              </p>
              <div className="badge-row">
                <span className="badge">Private upload</span>
                <span className="badge">Owner-only preview</span>
                <span className="badge">No public media</span>
                <span className="badge">Pending review</span>
              </div>
              <div className="detail-list compact-detail-list">
                <DetailRow
                  label="Selected highlight"
                  value={hasSavedHighlightSelected ? "Yes" : "No"}
                />
                <DetailRow
                  label="Highlight id"
                  value={editingId || "Not saved yet"}
                />
                <DetailRow
                  label="Save status"
                  value={
                    !hasSavedHighlightSelected
                      ? "Not saved yet"
                      : selectedHighlightIsSupabase
                        ? "Saved securely"
                        : "Saved on this device only"
                  }
                />
                <DetailRow
                  label="Private upload ready"
                  value={supabaseHighlightReady ? "Yes" : "Save first"}
                />
                <DetailRow
                  label="Thumbnail file selected"
                  value={hasThumbnailFileSelected ? "Yes" : "No"}
                />
                <DetailRow
                  label="Public media access"
                  value={backendStatus?.publicMediaAccess ? "Yes" : "No"}
                />
                <DetailRow
                  label="Video uploads"
                  value={backendStatus?.videoUploadsLabel || "Disabled"}
                />
                <DetailRow
                  label="Current private thumbnail"
                  value={
                    currentHighlightThumbnailAsset?.originalFilename ||
                    currentHighlightThumbnailAsset?.id ||
                    "Not uploaded yet"
                  }
                />
                <DetailRow
                  label="Approval status"
                  value={getMediaApprovalDisplayLabel(currentHighlightThumbnailAsset)}
                />
                <DetailRow
                  label="Visibility"
                  value={getMediaVisibilityDisplayLabel(currentHighlightThumbnailAsset)}
                />
                <DetailRow
                  label="Signed private preview loaded"
                  value={thumbnailPreviewUrl ? "Yes" : "No"}
                />
                <DetailRow
                  label="Last action result"
                  value={thumbnailUploadStatus || "Not run yet"}
                />
                <DetailRow
                  label="Last error reason"
                  value={thumbnailUploadIssue?.message || "None reported"}
                />
              </div>
              <MediaStatusBadgeRow
                mediaAsset={currentHighlightThumbnailAsset}
                previewLoaded={Boolean(thumbnailPreviewUrl)}
                showOwnerPreview
                showPublicDisabled
              />
              {currentHighlightThumbnailAsset ? (
                <p className="request-note">{getMediaReviewRouteLabel(currentHighlightThumbnailAsset)}</p>
              ) : null}
              {thumbnailPreviewUrl ? (
                <img
                  alt="Private highlight thumbnail preview"
                  className="private-media-preview"
                  src={thumbnailPreviewUrl}
                />
              ) : null}
              <p className="request-note">
                {!hasSavedHighlightSelected
                  ? hasThumbnailFileSelected
                    ? "Save the highlight first. Your selected thumbnail will upload after the highlight is saved securely."
                    : "Save or select a highlight before uploading a thumbnail."
                  : thumbnailNeedsFileReselect
                    ? "Please choose the thumbnail image again, then click Upload Private Thumbnail."
                    : !selectedHighlightIsSupabase
                      ? "This highlight will be saved securely first, then the private thumbnail will upload."
                    : thumbnailUploadStatus ||
                    (backendStatus?.uploadsEnabled
                      ? getMediaOwnerPresentationMessage(currentHighlightThumbnailAsset, {
                          emptyMessage:
                            "No private thumbnail asset is linked yet. Upload one to unlock signed owner preview in this panel.",
                          previewLoaded: Boolean(thumbnailPreviewUrl),
                        })
                      : "Private thumbnail upload is not ready yet for this highlight.")}
              </p>
              <p className="request-note">
                If a signed preview expires, use Load Private Preview again. Signed previews are never stored as `public_url`.
              </p>
              <p className="request-note">
                {hasSavedHighlightSelected
                  ? selectedHighlightIsSupabase
                    ? "Choose your own thumbnail for the main real upload flow. Private video upload is available below for saved highlights."
                    : "This highlight is not ready for private thumbnail upload yet. Use Save Highlight First & Upload Selected Thumbnail."
                  : "Choose a thumbnail now, then use Save Highlight First & Upload Selected Thumbnail."}
              </p>
              <div className="dashboard-actions">
                <button
                  className="button button-primary"
                  disabled={!hasThumbnailFileSelected}
                  onClick={handleSelectedThumbnailUploadAction}
                  type="button"
                >
                  {selectedThumbnailActionLabel}
                </button>
                <button
                  className="button button-secondary"
                  disabled={!hasSavedHighlightSelected || !currentHighlightThumbnailAsset?.id}
                  onClick={handleThumbnailPreviewLoad}
                  type="button"
                >
                  Load Private Preview
                </button>
                <button
                  className="button button-subtle"
                  disabled={!hasSavedHighlightSelected || !currentHighlightThumbnailAsset?.id}
                  onClick={handleThumbnailDelete}
                  type="button"
                >
                  Delete Private Thumbnail
                </button>
              </div>
            </div>
            <label className="form-field detail-grid-full">
              <span>Choose private video</span>
              <input
                accept="video/mp4,video/quicktime,video/webm"
                disabled={!videoUploadEnabled}
                onChange={handleVideoFileChange}
                ref={videoFileInputRef}
                type="file"
              />
              <p className="field-helper">
                {!hasSavedHighlightSelected
                  ? "Save a highlight first. Video upload is locked until the highlight is saved."
                  : !selectedHighlightIsSupabase
                    ? "Save a highlight securely first. Video upload is locked until the highlight is saved."
                    : !videoUploadReadiness?.videoUploadsEnabled
                      ? videoUploadReadiness?.message ||
                        "Private video upload is not ready yet on this account."
                      : "Choose an MP4, MOV, or WEBM video under 100MB before uploading. No public URL is created. Junior uploads stay pending parent/guardian approval, adult uploads stay pending admin review, and signed preview stays owner-only."}
              </p>
            </label>
            <div className="detail-grid-full surface-card nested-card">
              <p className="card-kicker">Private video upload</p>
              <h4>
                {hasSavedHighlightSelected
                  ? selectedHighlightIsSupabase
                    ? "Private Highlight Video Upload"
                    : "Save highlight first"
                  : "Save highlight first"}
              </h4>
              <p className="card-body">
                {hasSavedHighlightSelected
                  ? selectedHighlightIsSupabase
                    ? "Upload a private highlight video for this saved highlight, keep it approval-gated, and load an owner-only signed preview. No public URL is created."
                    : "Save a highlight securely first. Video upload is locked until the highlight is saved."
                  : "Save a highlight securely first. Video upload is locked until the highlight is saved."}
              </p>
              <div className="badge-row">
                <span className="badge">Private owner preview</span>
                <span className="badge">Signed preview only</span>
                <span className="badge">No public URLs</span>
                <span className="badge">No public video feed</span>
              </div>
              <div className="detail-list compact-detail-list">
                <DetailRow
                  label="Selected highlight"
                  value={hasSavedHighlightSelected ? "Yes" : "No"}
                />
                <DetailRow
                  label="Highlight id"
                  value={editingId || "Not saved yet"}
                />
                <DetailRow
                  label="Save status"
                  value={
                    !hasSavedHighlightSelected
                      ? "Not saved yet"
                      : selectedHighlightIsSupabase
                        ? "Saved securely"
                        : "Saved on this device only"
                  }
                />
                <DetailRow
                  label="Private upload ready"
                  value={supabaseHighlightReady ? "Yes" : "Save first"}
                />
                <DetailRow
                  label="Video file selected"
                  value={hasVideoFileSelected ? "Yes" : "No"}
                />
                <DetailRow
                  label="Upload button state"
                  value={videoUploadButtonStateLabel}
                />
                <DetailRow
                  label="Why locked"
                  value={videoUploadButtonStateLabel === "ready" ? "None" : videoUploadLockReasonLabel}
                />
                <DetailRow
                  label="Video uploads"
                  value={videoUploadReadiness?.videoUploadsLabel || "Disabled"}
                />
                <DetailRow
                  label="Public video access"
                  value="No"
                />
                <DetailRow
                  label="Private upload location"
                  value={backendStatus?.highlightVideoBucketDetectedLabel === "yes"
                    ? "msr-highlight-videos"
                    : "msr-highlight-videos (checking availability)"}
                />
                <DetailRow
                  label="Max size"
                  value={videoUploadReadiness?.maxFileSizeLabel || "100MB"}
                />
                <DetailRow
                  label="Allowed types"
                  value={videoUploadReadiness?.allowedTypesLabel || "MP4, MOV, WEBM"}
                />
                <DetailRow
                  label="Current private video"
                  value={
                    currentHighlightVideoAsset?.originalFilename ||
                    currentHighlightVideoAsset?.id ||
                    "Not uploaded yet"
                  }
                />
                <DetailRow
                  label="Video media asset id"
                  value={currentHighlightVideoAsset?.id || "Not linked yet"}
                />
                <DetailRow
                  label="Saved file path"
                  value={currentHighlightVideoAsset?.storagePath || "Not linked yet"}
                />
                <DetailRow
                  label="Approval status"
                  value={getMediaApprovalDisplayLabel(currentHighlightVideoAsset)}
                />
                <DetailRow
                  label="Visibility"
                  value={getMediaVisibilityDisplayLabel(currentHighlightVideoAsset)}
                />
                <DetailRow
                  label="Public URL created"
                  value={currentHighlightVideoAsset?.publicUrl ? "Yes" : "No"}
                />
                <DetailRow
                  label="Signed private preview loaded"
                  value={videoPreviewUrl ? "Yes" : "No"}
                />
                <DetailRow
                  label="Delete status"
                  value={videoDeleteStatus || "Not run yet"}
                />
                <DetailRow
                  label="Replace status"
                  value={videoReplaceStatus || "Not run yet"}
                />
                <DetailRow
                  label="Last action result"
                  value={videoUploadStatus || "Not run yet"}
                />
                <DetailRow
                  label="Last error reason"
                  value={videoUploadIssue || "None reported"}
                />
              </div>
              <MediaStatusBadgeRow
                mediaAsset={currentHighlightVideoAsset}
                previewLoaded={Boolean(videoPreviewUrl)}
                showOwnerPreview
                showPublicDisabled
                showVideoPrivate
              />
              {currentHighlightVideoAsset ? (
                <p className="request-note">{getMediaReviewRouteLabel(currentHighlightVideoAsset)}</p>
              ) : null}
              {videoPreviewUrl ? (
                <video
                  className="private-media-preview"
                  controls
                  src={videoPreviewUrl}
                />
              ) : null}
              <p className="request-note">
                {videoUploadStatus ||
                  videoUploadLockedMessage}
              </p>
              <p className="request-note">
                If a signed preview expires, use Load Private Video Preview again. Signed previews are never stored as `public_url`.
              </p>
              {videoReplaceReady ? (
                <p className="request-note">
                  Replace ready: the current private video stays in place until the new upload finishes successfully.
                </p>
              ) : null}
              <p className="request-note">Private owner preview only.</p>
              <p className="request-note">No public video URL is created.</p>
              <p className="request-note">
                Public showcase video access comes later after approval rules.
              </p>
              <div className="dashboard-actions">
                {!supabaseHighlightReady ? (
                  <button
                    className="button button-primary"
                    disabled={videoBuiltInTestRunning}
                    onClick={handleSaveSupabaseHighlightFirst}
                    type="button"
                  >
                    Save Highlight First
                  </button>
                ) : null}
                <button
                  className={supabaseHighlightReady ? "button button-primary" : "button button-secondary"}
                  disabled={!videoUploadButtonReady}
                  onClick={handleVideoUpload}
                  type="button"
                >
                  {currentHighlightVideoAsset?.id ? "Replace Private Highlight Video" : "Upload Private Highlight Video"}
                </button>
                <button
                  className="button button-secondary"
                  disabled={!supabaseHighlightReady || !currentHighlightVideoAsset?.id}
                  onClick={handleVideoPreviewLoad}
                  type="button"
                >
                  Load Private Video Preview
                </button>
                <button
                  className="button button-subtle"
                  disabled={!supabaseHighlightReady || !currentHighlightVideoAsset?.id}
                  onClick={handleVideoDelete}
                  type="button"
                >
                  Delete Private Video
                </button>
              </div>
            </div>
            <FormField
              label="Verification source"
              select
              value={form.verificationSource}
              options={HIGHLIGHT_VERIFICATION_SOURCES}
              onChange={(value) => updateField("verificationSource", value)}
              helper={
                selectedAthlete?.isJunior
                  ? "Junior highlights default to the parent or guardian pathway until they are approved."
                  : "Adults can still begin unverified and move through coach, club, or admin review."
              }
            />
            <FormField
              label="Showcase visibility"
              select
              value={form.showcaseStatus}
              options={showcaseOptions}
              onChange={(value) => updateField("showcaseStatus", value)}
              helper={
                selectedAthlete?.isJunior
                  ? "Junior highlights cannot move straight into Showcase Approved without parent approval."
                  : "Adults can keep clips profile-only or request showcase review."
              }
            />
          </div>

          <div className="cta-row">
            <button className="button button-primary" onClick={handleSaveHighlightAction} type="button">
              {editingId ? "Save Highlight" : "Add Highlight"}
            </button>
            <button className="button button-secondary" onClick={() => resetForm()} type="button">
              Reset Form
            </button>
            {editingId ? (
              <button className="button button-subtle" onClick={handleDelete} type="button">
                Delete Highlight
              </button>
            ) : null}
          </div>
        </article>

        <article className="surface-card create-profile-side-card">
          <p className="card-kicker">Current media library</p>
          <h3>{selectedAthlete?.displayName || "Athlete"} highlights</h3>
          <p className="card-body">
            Featured highlights show first on the athlete resume. Profile-only clips can still strengthen the public resume without entering showcase discovery.
          </p>

          {athleteHighlights.length === 0 ? (
            <article className="surface-card nested-card empty-state-card">
              <p className="card-kicker">No highlights added yet</p>
              <p className="card-body">Add your first highlight to strengthen your sports resume.</p>
            </article>
          ) : null}

          <div className="review-stack">
            {athleteHighlights.map((highlight) => (
              <div className="review-row" key={highlight.id}>
                <div className="search-card-header">
                  <div>
                    <h4>{highlight.title}</h4>
                    <p>
                      {joinMeta([
                        highlight.highlightType || highlight.tag,
                        getHighlightDisplayEvent(highlight),
                        formatDisplayDate(highlight.date || highlight.eventDate),
                      ])}
                    </p>
                  </div>
                </div>
                <div className="badge-row">
                  {highlight.isFeatured ? (
                    <span className="status-chip status-chip-success">Featured highlight</span>
                  ) : null}
                  <span className="status-chip">{getHighlightShowcaseLabel(highlight)}</span>
                  <span className="status-chip">{getHighlightVerificationLabel(highlight)}</span>
                  <span className="badge">{highlight.positionPlayed || selectedAthlete?.position || "Role not set"}</span>
                </div>
                <p className="request-note">
                  {highlight.description || "No description added yet."}
                </p>
                <div className="review-actions">
                  <button
                    className="button button-secondary"
                    onClick={() => startEdit(highlight)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="button button-primary"
                    onClick={async () => {
                      const result = await onFeatureHighlight(highlight.id);
                      setStatus(result?.message || "Featured highlight updated for this sports resume.");
                    }}
                    type="button"
                  >
                    {highlight.isFeatured ? "Featured" : "Mark Featured"}
                  </button>
                  <button
                    className="button button-subtle"
                    onClick={async () => {
                      const result = await onDeleteHighlight(highlight.id);
                      setStatus(result?.message || "Highlight removed from the profile media library.");
                      if (editingId === highlight.id) {
                        resetForm(selectedAthlete?.id || requestedAthleteId);
                      }
                    }}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function HighlightShowcasePage({ athletes, highlights, onBoost }) {
  const showcaseHighlights = sortHighlightsByPriority(
    highlights.filter((item) => {
      const athlete = athletes.find((candidate) => candidate.id === item.athleteId);
      if (!athlete) {
        return false;
      }

      return isHighlightShowcaseReady({
        ...item,
        isJunior: athlete.isJunior,
      });
    }),
  );
  const initialFilters = {
    sportCategory: "All",
    sport: "All",
    highlightType: "All",
    ageGroup: "All",
    state: "All",
    region: "All",
    juniorSenior: "All",
    verificationSource: "All",
  };
  const [filters, setFilters] = useState(initialFilters);
  const sports = [
    "All",
    ...new Set(
      showcaseHighlights
        .filter(
          (item) =>
            filters.sportCategory === "All" || item.sportCategory === filters.sportCategory,
        )
        .map((item) => item.sport)
        .filter(Boolean),
    ),
  ];
  const highlightTypes = [
    "All",
    ...new Set(
      showcaseHighlights
        .filter((item) => filters.sport === "All" || item.sport === filters.sport)
        .map((item) => item.highlightType || item.tag)
        .filter(Boolean),
    ),
  ];
  const ageGroups = [
    "All",
    ...new Set(showcaseHighlights.map((item) => item.ageGroup).filter(Boolean)),
  ];
  const states = [
    "All",
    ...new Set(
      showcaseHighlights
        .map((item) => item.state || athletes.find((athlete) => athlete.id === item.athleteId)?.state)
        .filter(Boolean),
    ),
  ];
  const regions = [
    "All",
    ...new Set(
      showcaseHighlights
        .filter((item) => filters.state === "All" || (item.state || "") === filters.state)
        .map((item) => item.region)
        .filter(Boolean),
    ),
  ];
  const verificationSources = [
    "All",
    ...new Set(showcaseHighlights.map((item) => item.verificationSource || "Unverified")),
  ];

  const filtered = showcaseHighlights.filter((item) => {
    const athlete = athletes.find((candidate) => candidate.id === item.athleteId);
    if (!athlete) {
      return false;
    }
    const highlightCategory = item.sportCategory || athlete.sportCategory;
    const highlightState = item.state || athlete.state;

    if (filters.sportCategory !== "All" && filters.sportCategory !== highlightCategory) {
      return false;
    }
    if (!sportFilterMatches(filters.sport, item.sport)) {
      return false;
    }
    if (filters.highlightType !== "All" && filters.highlightType !== (item.highlightType || item.tag)) {
      return false;
    }
    if (filters.ageGroup !== "All" && filters.ageGroup !== item.ageGroup) {
      return false;
    }
    if (filters.state !== "All" && filters.state !== highlightState) {
      return false;
    }
    if (filters.region !== "All" && filters.region !== item.region) {
      return false;
    }
    if (filters.juniorSenior === "Junior" && !athlete.isJunior) {
      return false;
    }
    if (filters.juniorSenior === "Senior" && athlete.isJunior) {
      return false;
    }
    if (
      filters.verificationSource !== "All" &&
      filters.verificationSource !== (item.verificationSource || "Unverified")
    ) {
      return false;
    }
    return true;
  });

  const featuredHighlight = filtered[0] || null;
  const featuredAthlete = featuredHighlight
    ? athletes.find((item) => item.id === featuredHighlight.athleteId) || null
    : null;

  function setFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="Highlight showcase"
        title="Professional highlight library"
        description="A clean library of athlete clips built for visibility and resume strength."
      />

      <div className="dashboard-stat-grid">
        <MetricCard
          label="Showcase-ready highlights"
          value={`${showcaseHighlights.length}`}
          detail="Approved clips currently visible in the premium highlight library"
          tone="gold"
        />
        <MetricCard
          label="Filtered results"
          value={`${filtered.length}`}
          detail="Clips matching the current showcase view"
          tone="blue"
        />
        <MetricCard
          label="Protected junior clips"
          value={`${showcaseHighlights.filter((item) => item.isJunior).length}`}
          detail="Junior content appears only after parent-controlled approval"
          tone="success"
        />
      </div>

      <article className="surface-card dashboard-panel">
        <p className="card-kicker">Showcase safety</p>
        <h3>Metadata-first showcase only</h3>
        <p className="card-body">
          Highlight Showcase stays card-focused in this phase. Private thumbnails, private videos,
          public media URLs, and public media feed behavior remain disabled.
        </p>
        <MediaStatusBadgeRow
          leadingBadges={[{ label: "Metadata First", tone: "neutral" }]}
          showPublicDisabled
          showVideoPrivate
        />
      </article>

      <article className="surface-card filter-card recruitment-filter-card">
        <div className="search-board-topline">
          <div>
            <p className="card-kicker">Showcase controls</p>
            <h3>Filter the highlight library</h3>
          </div>
          <button className="button button-subtle inline-button" onClick={resetFilters} type="button">
            Reset Filters
          </button>
        </div>
        <div className="filter-grid">
          <FilterField
            label="Sport"
            value={filters.sport}
            options={sports}
            onChange={(value) => setFilter("sport", value)}
          />
          <FilterField
            label="Highlight type"
            value={filters.highlightType}
            options={highlightTypes}
            onChange={(value) => setFilter("highlightType", value)}
          />
          <FilterField
            label="Age group"
            value={filters.ageGroup}
            options={ageGroups}
            onChange={(value) => setFilter("ageGroup", value)}
          />
          <FilterField
            label="State"
            value={filters.state}
            options={states}
            onChange={(value) => setFilter("state", value)}
          />
          <FilterField
            label="Region"
            value={filters.region}
            options={regions}
            onChange={(value) => setFilter("region", value)}
          />
          <FilterField
            label="Junior or senior"
            value={filters.juniorSenior}
            options={["All", "Junior", "Senior"]}
            onChange={(value) => setFilter("juniorSenior", value)}
          />
          <FilterField
            label="Verification source"
            value={filters.verificationSource}
            options={verificationSources}
            onChange={(value) => setFilter("verificationSource", value)}
          />
        </div>
      </article>

      {featuredHighlight && featuredAthlete ? (
        <article className="surface-card featured-showcase-card">
          <div className="featured-showcase-media">
            <span>Featured clip</span>
            <strong>{featuredHighlight.statusLabel}</strong>
          </div>
          <div className="featured-showcase-copy">
            <p className="card-kicker">Featured highlight</p>
            <h3>{featuredHighlight.title}</h3>
            <p className="card-meta">
              {joinMeta([
                featuredAthlete.displayName,
                featuredAthlete.sport,
                featuredAthlete.position,
                getLocationSummary(featuredAthlete),
                featuredAthlete.ageGroup,
              ])}
            </p>
            <p className="card-body">{featuredHighlight.description}</p>
            <div className="badge-row">
              <span className="badge">{featuredHighlight.highlightType || featuredHighlight.tag}</span>
              <span className="badge">{getHighlightDisplayEvent(featuredHighlight)}</span>
              <span className="badge">{formatDisplayDate(featuredHighlight.date || featuredHighlight.eventDate)}</span>
              <span className="badge">{featuredHighlight.verificationSource || "Unverified"}</span>
              <span className="badge">{getHighlightVerificationLabel(featuredHighlight)}</span>
            </div>
            <p className="request-note">
              Talent Boost is a showcase signal for stronger approved clips - just the athlete, the clip, and the pathway context.
            </p>
            <div className="cta-row">
              <button
                className="button button-secondary"
                onClick={() => onBoost(featuredHighlight.id)}
                type="button"
              >
                Talent Boost
              </button>
              <Link className="button button-primary" to={`/resume/${featuredAthlete.id}`}>
                View Profile
              </Link>
            </div>
          </div>
        </article>
      ) : null}

      <div className="wall-grid">
        {filtered.slice(featuredHighlight ? 1 : 0).map((highlight) => {
          const athlete = athletes.find((item) => item.id === highlight.athleteId);
          if (!athlete) {
            return null;
          }

          return (
            <HighlightWallCard
              athlete={athlete}
              highlight={highlight}
              key={highlight.id}
              onBoost={() => onBoost(highlight.id)}
            />
          );
        })}

        {filtered.length === 0 ? (
          <article className="surface-card empty-state-card">
            <p className="card-kicker">No showcase-ready highlights yet</p>
            <p className="card-body">
              No highlight clips match the current filters. Try resetting the showcase view or approve more clips through the highlight review flow.
            </p>
            <button className="button button-secondary" onClick={resetFilters} type="button">
              Reset Filters
            </button>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function ScoutSearchPage({
  athletes,
  onRequestContact,
  requestMap,
  selectedRole,
  shortlistSet,
  onShortlistAthlete,
}) {
  const initialFilters = {
    query: "",
    sportCategory: "All",
    sport: "All",
    postcodeSuburb: "",
    ageGroup: "All",
    position: "All",
    state: "All",
    region: "All",
    competitionLevel: "All",
    teamClub: "All",
    verifiedOnly: false,
    verifiedClubOnly: false,
    juniorSenior: "All",
    trialsOnly: false,
    seniorSigningOnly: false,
    relocateOnly: false,
  };
  const [filters, setFilters] = useState(initialFilters);
  const [advancedFiltersExpanded, setAdvancedFiltersExpanded] = useState(false);
  const usesStructuredScoutFilters =
    filters.state === "NSW" && filters.sport === "Rugby League";

  const scoutNearbyDirectory = getNearbySportsDirectory({
    postcode: filters.postcodeSuburb,
    suburb: filters.postcodeSuburb,
    state: filters.state === "All" ? "" : filters.state,
  });
  const sportOptions = ["All", ...new Set([...scoutNearbyDirectory.sports, ...getSimpleSportOptions()])];
  const ageOptions = usesStructuredScoutFilters
    ? ["All", ...NSW_RUGBY_LEAGUE_FILTER_AGE_GROUP_OPTIONS]
    : [
        "All",
        ...(filters.sport !== "All"
          ? getDirectoryAgeGroupsForSport(filters.sport)
          : AUSTRALIAN_AGE_GROUPS),
      ];
  const positionOptions = usesStructuredScoutFilters
    ? ["All", ...NSW_RUGBY_LEAGUE_POSITION_OPTIONS]
    : filters.sport !== "All"
      ? ["All", ...getDirectoryPositionsForSport(filters.sport)]
    : [
        "All",
        ...new Set(
          athletes
            .filter((item) => filters.sport === "All" || item.sport === filters.sport)
            .map((item) => item.position)
            .filter(Boolean),
        ),
      ];
  const stateOptions = ["All", ...STATE_OPTIONS];
  const regionOptions = usesStructuredScoutFilters
    ? ["All", ...getNswRugbyLeagueGroupOptions().map((item) => item.value)]
    : [
        "All",
        ...new Set(
          athletes
            .filter((item) => filters.state === "All" || item.state === filters.state)
            .map((item) => item.region)
            .filter(Boolean),
        ),
      ];
  const competitionLevelOptions = usesStructuredScoutFilters
    ? ["All", ...getNswRugbyLeagueCompetitionLevelOptions(filters.region)]
    : [
        "All",
        ...new Set(athletes.map((item) => item.competitionLevel).filter(Boolean)),
      ];
  const scoutLocationClubSuggestions = [
    ...getClubSuggestionsByPostcode({
      postcode: filters.postcodeSuburb,
      sport: filters.sport === "All" ? "" : filters.sport,
    }),
    ...getClubSuggestionsBySuburb({
      suburb: filters.postcodeSuburb,
      sport: filters.sport === "All" ? "" : filters.sport,
    }),
  ].filter((club, index, list) => list.findIndex((item) => item.id === club.id) === index);
  const hasScoutLocationSearch = Boolean(String(filters.postcodeSuburb || "").trim());
  const scoutClubSuggestions =
    hasScoutLocationSearch && scoutLocationClubSuggestions.length > 0
      ? scoutLocationClubSuggestions
      : hasScoutLocationSearch
        ? getNearbyClubSuggestions({
            sport: filters.sport === "All" ? "" : filters.sport,
            state: filters.state === "All" ? "" : filters.state,
            postcode: filters.postcodeSuburb,
            suburb: filters.postcodeSuburb,
          })
        : [];
  const teamClubOptions = [
    "All",
    ...new Set([
      ...scoutClubSuggestions.map((item) => item.clubName),
      ...athletes
        .filter((item) => {
          if (!sportFilterMatches(filters.sport, item.sport)) {
            return false;
          }
          if (filters.state !== "All" && item.state !== filters.state) {
            return false;
          }
          return true;
        })
        .map((item) => item.club)
        .filter(Boolean),
    ]),
  ];
  const teamClubFilterLabel = "Club / team";
  const verifiedResults = athletes.filter((item) => isVerifiedProfile(item)).length;
  const openResults = athletes.filter((item) => getOpportunityCount(item) > 0).length;

  const filtered = athletes.filter((athlete) => {
    const query = filters.query.trim().toLowerCase();
    const queryBlob = [
      athlete.displayName,
      athlete.sportCategory,
      athlete.club,
      athlete.region,
      athlete.state,
      athlete.postcode,
      athlete.suburb,
      athlete.position,
      athlete.sport,
      athlete.competition,
      athlete.competitionLevel,
    ]
      .join(" ")
      .toLowerCase();

    if (query && !queryBlob.includes(query)) {
      return false;
    }
    if (filters.sportCategory !== "All" && filters.sportCategory !== athlete.sportCategory) {
      return false;
    }
    if (!sportFilterMatches(filters.sport, athlete.sport)) {
      return false;
    }
    const locationQuery = normalizeText(filters.postcodeSuburb);
    if (
      locationQuery &&
      ![
        athlete.postcode,
        athlete.suburb,
        athlete.club,
        athlete.region,
        athlete.state,
      ]
        .join(" ")
        .toLowerCase()
        .includes(locationQuery)
    ) {
      return false;
    }
    if (filters.ageGroup !== "All" && filters.ageGroup !== athlete.ageGroup) {
      return false;
    }
    if (filters.position !== "All" && filters.position !== athlete.position) {
      return false;
    }
    if (filters.state !== "All" && filters.state !== athlete.state) {
      return false;
    }
    if (filters.region !== "All" && filters.region !== athlete.region) {
      return false;
    }
    if (
      filters.competitionLevel !== "All" &&
      filters.competitionLevel !== athlete.competitionLevel
    ) {
      return false;
    }
    if (filters.teamClub !== "All" && filters.teamClub !== athlete.club) {
      return false;
    }
    if (filters.verifiedOnly && !isVerifiedProfile(athlete)) {
      return false;
    }
    if (filters.verifiedClubOnly && !athlete.isVerifiedClubEntry) {
      return false;
    }
    if (filters.juniorSenior === "Junior" && !athlete.isJunior) {
      return false;
    }
    if (filters.juniorSenior === "Senior" && athlete.isJunior) {
      return false;
    }
    if (filters.trialsOnly && !athlete.availability.openToTrials) {
      return false;
    }
    if (filters.seniorSigningOnly && !athlete.availability.openToSeniorSigning) {
      return false;
    }
    if (filters.relocateOnly && !athlete.availability.willingToRelocate) {
      return false;
    }
    return true;
  });

  function setFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="Scout search"
        title="Find athletes by local club, sport and age group"
        description="Start with postcode/suburb, then choose sport, club, age group, and position. Contact requests only."
      />

      <div className="dashboard-stat-grid">
        <MetricCard
          label="Athlete resumes"
          value={`${athletes.length}`}
          detail="Profiles currently visible in this search"
          tone="gold"
        />
        <MetricCard
          label="Verified profiles"
          value={`${verifiedResults}`}
          detail="Profiles carrying visible trust or approval signals"
          tone="success"
        />
        <MetricCard
          label="Open to opportunities"
          value={`${openResults}`}
          detail="Athletes currently presenting opportunity intent"
          tone="blue"
        />
      </div>

      <article className="surface-card search-board-card">
        <div className="search-board-topline">
          <div>
            <p className="card-kicker">Search results</p>
            <h3>{filtered.length} athlete resumes match your search</h3>
          </div>
          <div className="inline-actions">
            <span className="status-chip status-chip-success">Verified search environment</span>
            <button className="button button-subtle inline-button" onClick={resetFilters} type="button">
              Reset Filters
            </button>
          </div>
        </div>

        <SportPathwayStrip
          title="Choose your sport"
          description="Postcode/Suburb -> Sport -> Club/Team -> Age Group -> Position"
          selectedSport={filters.sport === "All" ? "" : filters.sport}
          onSelectSport={(sport) => setFilter("sport", sport)}
          compact
          ctaItems={[
            { label: "Build profile", to: "/create-profile", variant: "button button-primary" },
          ]}
          contextNote="Find athletes by local club, sport and age group. Contact requests only. No direct messaging."
        />

        <div className="search-filter-grid">
          <label className="form-field">
            <span>Postcode or suburb</span>
            <input
              type="text"
              value={filters.postcodeSuburb}
              onChange={(event) => setFilter("postcodeSuburb", event.target.value)}
              placeholder="2460 or South Grafton"
            />
          </label>
          <FilterField
            label="Sport"
            value={filters.sport}
              options={sportOptions}
              onChange={(value) => setFilter("sport", value)}
            />
          <label className="form-field search-query-field">
            <span>Search athlete name (optional)</span>
            <input
              type="text"
              value={filters.query}
              onChange={(event) => setFilter("query", event.target.value)}
              placeholder="Search player name"
            />
          </label>
          <FilterField
            label={teamClubFilterLabel}
            value={filters.teamClub}
            options={teamClubOptions}
            onChange={(value) => setFilter("teamClub", value)}
          />
          <FilterField
            label="Age group"
            value={filters.ageGroup}
            options={ageOptions}
            onChange={(value) => setFilter("ageGroup", value)}
          />
          <FilterField
            label="Position"
            value={filters.position}
            options={positionOptions}
            onChange={(value) => setFilter("position", value)}
          />
          <FilterField
            label="State"
            value={filters.state}
            options={stateOptions}
            onChange={(value) => setFilter("state", value)}
          />
        </div>

        <div className="detail-grid-full structured-selector-card family-flow-card postcode-directory-panel">
          <div className="form-section-header compact-form-header">
            <div>
              <p className="card-kicker">Find local clubs by postcode</p>
              <h4>
                {filters.postcodeSuburb
                  ? `Clubs found near ${filters.postcodeSuburb}`
                  : "Enter postcode/suburb to narrow the board"}
              </h4>
            </div>
            <p className="request-note">
              {scoutNearbyDirectory.areaLabel
                ? `${scoutNearbyDirectory.areaLabel} starter directory`
                : "Region/group stays secondary. Start with postcode, then sport, club, age group, and position."}
            </p>
          </div>
          <div className="directory-summary-row">
            <span className="status-chip">
              Sports: {scoutNearbyDirectory.sports.length > 0 ? scoutNearbyDirectory.sports.join(", ") : "No saved sports yet"}
            </span>
            <span className="status-chip">Private media stays protected</span>
          </div>
          <div className="club-suggestion-grid">
            {scoutClubSuggestions.length > 0 ? (
              scoutClubSuggestions.slice(0, 6).map((club) => (
                <button
                  className={filters.teamClub === club.clubName ? "club-suggestion-button selected" : "club-suggestion-button"}
                  key={club.id}
                  onClick={() => {
                    setFilter("teamClub", club.clubName);
                    if (filters.sport === "All") {
                      setFilter("sport", club.sport);
                    }
                    if (filters.state === "All") {
                      setFilter("state", club.state);
                    }
                  }}
                  type="button"
                >
                  <strong>{club.clubName}</strong>
                  <span>{joinMeta([club.sport, club.suburb, club.postcode])}</span>
                </button>
              ))
            ) : (
              <span className="club-suggestion-empty">
                {filters.postcodeSuburb
                  ? "No saved clubs for this postcode yet. Custom club fallback stays available when creating a profile."
                  : "Try 2460 to load Grafton / South Grafton / Clarence Valley starter clubs."}
              </span>
            )}
          </div>
        </div>

        <div className="search-board-advanced-toggle">
          <button
            className="button button-secondary"
            onClick={() => setAdvancedFiltersExpanded((current) => !current)}
            type="button"
          >
            {advancedFiltersExpanded ? "Hide extra filters" : "More filters"}
          </button>
          <p className="request-note">
            {usesStructuredScoutFilters
              ? "For NSW Rugby League, postcode/suburb and club are the main path. Group and competition are secondary."
              : "Start with postcode, sport, club, age group, and position. Use extra filters only when needed."}
          </p>
        </div>

        {advancedFiltersExpanded ? (
          <>
            <div className="filter-grid secondary-filter-grid">
              <FilterField
                label="Competition level"
                value={filters.competitionLevel}
                options={competitionLevelOptions}
                onChange={(value) => setFilter("competitionLevel", value)}
              />
              <FilterField
                label="Junior or senior"
                value={filters.juniorSenior}
                options={["All", "Junior", "Senior"]}
                onChange={(value) => setFilter("juniorSenior", value)}
              />
              <article className="surface-card nested-card inline-info-card">
                <p className="card-kicker">Directory signals</p>
                <h4>Club-first search</h4>
                <p className="card-body">
                  Advanced filters are optional. The main flow stays postcode, sport, club, age group, and position.
                </p>
              </article>
            </div>

            <div className="checkbox-grid checkbox-grid-board">
              <CheckboxChip
                checked={filters.verifiedOnly}
                label="Verified profiles only"
                onChange={() => setFilter("verifiedOnly", !filters.verifiedOnly)}
              />
              <CheckboxChip
                checked={filters.verifiedClubOnly}
                label="Verified club/team only"
                onChange={() => setFilter("verifiedClubOnly", !filters.verifiedClubOnly)}
              />
              <CheckboxChip
                checked={filters.trialsOnly}
                label="Available for trials"
                onChange={() => setFilter("trialsOnly", !filters.trialsOnly)}
              />
              <CheckboxChip
                checked={filters.seniorSigningOnly}
                label="Available for senior signing"
                onChange={() => setFilter("seniorSigningOnly", !filters.seniorSigningOnly)}
              />
              <CheckboxChip
                checked={filters.relocateOnly}
                label="Willing to relocate"
                onChange={() => setFilter("relocateOnly", !filters.relocateOnly)}
              />
            </div>
          </>
        ) : null}
      </article>

      <div className="card-grid search-results-grid">
        {filtered.map((athlete) => {
          const request = requestMap[athlete.id];
          const verified = isVerifiedProfile(athlete);
          const stat = getPrimaryStat(athlete);
          const keyAchievement = getKeyAchievement(athlete);
          const completion = calculateProfileCompleteness(athlete);
          const completionLabel = getProfileCompletenessLabel(completion, athlete);
          const availabilityBadges = getAvailabilityBadges(athlete);
          const sportDefinition = getSportDefinitionForProfile(athlete);
          const teamFieldLabel = getTeamFieldLabel(sportDefinition);

          return (
            <article className="surface-card premium-search-card" key={athlete.id}>
              <header className="search-card-header">
                <AthleteAvatar athlete={athlete} />
                <div>
                  <p className="card-kicker">{athlete.sport || sportDefinition.name}</p>
                  <h3>{athlete.displayName}</h3>
                  <p className="card-meta">
                    {joinMeta([
                      athlete.sport,
                      athlete.position,
                      getLocationSummary(athlete),
                      athlete.ageGroup,
                    ])}
                  </p>
                </div>
              </header>

              <div className="badge-row">
                <span className={verified ? "status-chip status-chip-success" : "status-chip"}>
                  {verified ? "Verified profile" : "Needs verification"}
                </span>
                <span className="status-chip">
                  {completion}% {completionLabel}
                </span>
                <span className="status-chip status-chip-opportunity">
                  {getOpportunityCount(athlete) > 0
                    ? "Open to opportunities"
                    : "Opportunity status not set"}
                </span>
                <span className={athlete.isVerifiedClubEntry ? "status-chip status-chip-success" : "status-chip"}>
                  {getTeamVerificationLabel(athlete)}
                </span>
                <span className="status-chip">
                  Contact: {getContactRouteLabel(getContactRoute(athlete))}
                </span>
              </div>

              <div className="detail-list">
                <DetailRow label={teamFieldLabel} value={athlete.club || "Not provided"} />
                <DetailRow
                  label="Competition level"
                  value={athlete.competitionLevel || "Not provided"}
                />
                <DetailRow label="Age group" value={athlete.ageGroup || "Not provided"} />
                <DetailRow label="Pathway" value={getJuniorSeniorLabel(athlete)} />
                <DetailRow label={stat.label} value={stat.value} />
                <DetailRow label="Key achievement" value={keyAchievement} />
              </div>

              <div className="badge-row">
                {athlete.verificationBadges.map((badge) => (
                  <VerificationBadge key={badge} label={badge} compact />
                ))}
                {availabilityBadges.slice(0, 2).map((item) => (
                  <span className="badge" key={item}>
                    {item}
                  </span>
                ))}
              </div>

              <div className="cta-row">
                <Link className="button button-primary" to={`/resume/${athlete.id}`}>
                  View Resume
                </Link>
                <button
                  className={
                    (request?.contactRequestCount || 0) > 0
                      ? "button button-subtle"
                      : "button button-secondary"
                  }
                  disabled={(request?.contactRequestCount || 0) > 0}
                  onClick={async () => {
                    await onRequestContact(athlete.id, selectedRole);
                  }}
                  type="button"
                >
                  {(request?.contactRequestCount || 0) > 0
                    ? "Contact Requested"
                    : "Request Contact"}
                </button>
                {selectedRole === "club_scout" ? (
                  <button
                    className={shortlistSet.has(athlete.id) ? "button button-subtle" : "button button-secondary"}
                    onClick={async () => {
                      await onShortlistAthlete(athlete.id, selectedRole);
                    }}
                    type="button"
                  >
                    {shortlistSet.has(athlete.id) ? "Shortlisted" : "Shortlist Athlete"}
                  </button>
                ) : null}
              </div>

              <p className="request-note">
                {getSafeRequestMessage(request, athlete.contactRoute)}{" "}
                {availabilityBadges.length > 0 ? `Availability: ${availabilityBadges.join(" / ")}.` : ""}
              </p>
            </article>
          );
        })}

        {filtered.length === 0 ? (
          <article className="surface-card empty-state-card">
            <p className="card-kicker">No resumes found</p>
            <p className="card-body">
              Try widening the filters to find more local athletes, or create a new athlete resume
              with club and age-group detail.
            </p>
            <div className="cta-row">
              <button className="button button-secondary" onClick={resetFilters} type="button">
                Reset Filters
              </button>
              <Link className="button button-subtle" to="/create-profile">
                Create Profile
              </Link>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function ContactRequestHistoryPage({ selectedRole, requestRows }) {
  const roleConfig = getRoleConfig(selectedRole);
  const headingMap = {
    parent_guardian: {
      title: "Contact requests routed to parent or guardian",
      description: "Review incoming requests for junior athletes without exposing direct messaging.",
    },
    adult_athlete: {
      title: "Contact requests routed to the athlete",
      description: "See the structured request history for the adult athlete pathway.",
    },
    club_scout: {
      title: "Requests you have created",
      description:
        "Track structured contact requests and opportunity interest records created from scout search, athlete resumes, and the opportunities board.",
    },
  };
  const content = headingMap[selectedRole] || {
    title: "Contact request history",
    description: "Review safe contact history by role.",
  };
  const sortedRows = [...requestRows].sort(
    (left, right) =>
      new Date(right.request.updatedAt || right.request.createdAt || 0).getTime() -
      new Date(left.request.updatedAt || left.request.createdAt || 0).getTime(),
  );
  const contactRows = sortedRows.filter(
    ({ request }) => (request.requestType || "contact_request") === "contact_request",
  );
  const interestRows = sortedRows.filter(
    ({ request }) => request.requestType === "opportunity_interest",
  );

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow={roleConfig.eyebrow}
        title={content.title}
        description={content.description}
      />

      <article className="surface-card trust-statement">
        <div>
          <p className="eyebrow">Safety reminder</p>
          <h3>Contact requests only</h3>
          <p className="card-body">
            My Sports Resume uses contact requests only. Request history exists only to support structured, reviewable contact pathways.
          </p>
        </div>
      </article>

      <div className="dashboard-stat-grid">
        <MetricCard
          label="Total request records"
          value={`${sortedRows.length}`}
          detail="Combined contact requests and opportunity interest records visible to this role"
          tone="gold"
        />
        <MetricCard
          label="Contact requests"
          value={`${contactRows.length}`}
          detail="Safe athlete contact requests without direct outreach tools"
          tone="blue"
        />
        <MetricCard
          label="Opportunity interests"
          value={`${interestRows.length}`}
          detail="Structured opportunity responses stored inside the same safe contact-request pathway"
          tone="success"
        />
      </div>

      <div className="dashboard-grid">
        {sortedRows.length === 0 ? (
          <article className="surface-card empty-state-card">
            <p className="card-kicker">No requests yet</p>
            <p className="card-body">
              No contact requests match the active role yet. Use scout search to create a request or wait for new inbound requests.
            </p>
          </article>
        ) : null}

        {sortedRows.map(({ athlete, request, opportunity }) => (
          <article className="surface-card dashboard-panel" key={request.id}>
            <p className="card-kicker">
              {request.requestType === "opportunity_interest" ? "Opportunity interest" : athlete.sport}
            </p>
            <h3>
              {request.requestType === "opportunity_interest"
                ? opportunity?.title || request.opportunityTitle || "Opportunity interest"
                : athlete.displayName}
            </h3>
            <p className="card-meta">
              {request.requestType === "opportunity_interest"
                ? joinMeta([
                    opportunity?.organisation || request.organisation,
                    athlete.displayName,
                    athlete.sport,
                    athlete.ageGroup,
                  ])
                : joinMeta([athlete.position, getLocationSummary(athlete), athlete.ageGroup])}
            </p>
            <div className="detail-list">
              <DetailRow label="Route" value={getContactRouteLabel(request.to || athlete.contactRoute)} />
              <DetailRow
                label="Record type"
                value={
                  request.requestType === "opportunity_interest"
                    ? "Opportunity interest"
                    : "Contact request"
                }
              />
              <DetailRow
                label="Status"
                value={
                  request.requestType === "opportunity_interest"
                    ? request.status || "Pending Review"
                    : `${request.status || "Pending Review"} / ${request.count || 1} total`
                }
              />
              <DetailRow label="Source" value={getContactRequestSourceLabel(request)} />
              {request.requestType === "opportunity_interest" ? (
                <DetailRow
                  label="Organisation"
                  value={opportunity?.organisation || request.organisation || "Not provided"}
                />
              ) : null}
              <DetailRow
                label="Latest role"
                value={request.history?.[0]?.actorLabel || request.createdByLabel || "Demo role"}
              />
              <DetailRow
                label="Last updated"
                value={new Date(request.updatedAt || request.createdAt).toLocaleDateString()}
              />
            </div>
            <div className="cta-row">
              <Link className="button button-primary" to={`/resume/${athlete.id}`}>
                View Resume
              </Link>
              {request.requestType === "opportunity_interest" && opportunity ? (
                <Link className="button button-secondary" to={`/opportunities/${opportunity.id}`}>
                  View Opportunity
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ClubVerificationRequestPage({ onSubmitVerificationRequest, selectedRole, statusMessage }) {
  const [form, setForm] = useState({
    organisationName: "",
    contactName: "",
    roleTitle: "",
    sports: "",
    state: "",
    region: "",
    email: "",
    purpose: "Club recruitment",
  });
  const [status, setStatus] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitForm() {
    const result = await onSubmitVerificationRequest(form);
    if (result?.success) {
      setStatus(result?.message || "Verification request saved for review.");
      setForm({
        organisationName: "",
        contactName: "",
        roleTitle: "",
        sports: "",
        state: "",
        region: "",
        email: "",
        purpose: "Club recruitment",
      });
    } else {
      setStatus(result?.message || "Could not submit the verification request right now.");
    }
  }

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="Verification request"
        title="Submit your organisation for review"
        description="Requests are checked before trust labels appear."
      />

      <div className="create-profile-grid">
        <article className="surface-card create-profile-form-card">
          <div className="builder-topline">
            <div>
              <p className="card-kicker">Verification form</p>
              <h3>Request verification</h3>
              <p className="card-body">
                Built for clubs, coaches, schools, and academies who want trusted visibility.
              </p>
            </div>
            <div className="builder-progress-panel">
              <span>{getRoleLabel(selectedRole)}</span>
              <p className="request-note">
                Your request is saved securely for review.
              </p>
            </div>
          </div>

          <article className="form-section-card">
            <div className="form-section-header">
              <div>
                <p className="card-kicker">Organisation details</p>
                <h3>Who is requesting verification?</h3>
              </div>
            </div>
            <div className="detail-grid">
              <FormField
                label="Organisation name"
                value={form.organisationName}
                onChange={(value) => updateField("organisationName", value)}
              />
              <FormField
                label="Contact name"
                value={form.contactName}
                onChange={(value) => updateField("contactName", value)}
              />
              <FormField
                label="Role / title"
                value={form.roleTitle}
                onChange={(value) => updateField("roleTitle", value)}
                placeholder="Recruitment lead, coach, team manager"
              />
              <FormField
                label="Sport / sports"
                value={form.sports}
                onChange={(value) => updateField("sports", value)}
                placeholder="Rugby League, AFL, Netball"
              />
              <FormField
                label="State"
                select
                value={form.state}
                options={STATE_OPTIONS}
                placeholderOption="Select state"
                onChange={(value) => updateField("state", value)}
              />
              <FormField
                label="Region"
                value={form.region}
                onChange={(value) => updateField("region", value)}
                placeholder="Metro, regional, district"
              />
              <FormField
                label="Contact email"
                value={form.email}
                onChange={(value) => updateField("email", value)}
                placeholder="name@example.com"
              />
              <FormField
                label="Verification purpose"
                select
                value={form.purpose}
                options={[
                  "Club recruitment",
                  "School sport",
                  "Academy pathway",
                  "Coach/team manager",
                  "Local first-grade recruitment",
                ]}
                onChange={(value) => updateField("purpose", value)}
              />
            </div>
          </article>

          <div className="cta-row">
            <button className="button button-primary" onClick={submitForm} type="button">
              Submit Verification Request
            </button>
            <Link className="button button-secondary" to="/account">
              View Account Status
            </Link>
          </div>

          {statusMessage ? <p className="banner banner-success">{statusMessage}</p> : null}
          {status ? <p className="banner banner-success">{status}</p> : null}
        </article>

        <article className="surface-card create-profile-side-card">
          <p className="card-kicker">Verification note</p>
          <h3>What happens next</h3>
          <div className="checklist">
            {[
              "Your organisation request is saved for review.",
              "Trust labels appear after checks are complete.",
              "Contact requests stay structured with no direct messaging.",
            ].map((item) => (
              <div className="check-item" key={item}>
                <span className="check-mark done" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function SportsDirectoryPage({ athletes, selectedRole }) {
  const customClubCount = new Set(
    athletes
      .filter((item) => item.club && !item.isVerifiedClubEntry)
      .map((item) => `${normalizeText(item.sport)}::${normalizeText(item.club)}`),
  ).size;
  const categorySummaries = SPORT_CATEGORIES.map((category) => ({
    category,
    count: sportsCatalog.filter((sport) => sport.category === category).length,
  }));

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow={getRoleConfig(selectedRole).eyebrow}
        title="Australian sports directory"
        description="A local catalogue structure for sports, categories, age groups, competition levels, roles, and starter teams or clubs."
      />

      <div className="dashboard-stat-grid">
        <MetricCard
          label="Sports"
          value={`${sportsCatalog.length}`}
          detail="Australian sports currently loaded into the catalogue"
          tone="gold"
        />
        <MetricCard
          label="Sport categories"
          value={`${SPORT_CATEGORIES.length}`}
          detail="Structured groups to keep search, profile creation, and discovery scalable"
          tone="blue"
        />
        <MetricCard
          label="Starter clubs / teams"
          value={`${teamDirectorySeed.length}`}
          detail="Seed data only - full verified club imports can be added later"
          tone="success"
        />
        <MetricCard
          label="Manual clubs pending verification"
          value={`${customClubCount}`}
          detail="Saved locally from profile creation when no starter directory match exists"
          tone="gold"
        />
      </div>

      <section className="dashboard-grid">
        {categorySummaries.map((item) => (
          <article className="surface-card dashboard-panel" key={item.category}>
            <p className="card-kicker">Internal catalogue group</p>
            <h3>{item.category}</h3>
            <p className="card-body">{item.count} sports currently mapped in the local catalogue.</p>
          </article>
        ))}
      </section>

      <article className="surface-card dashboard-panel">
        <p className="card-kicker">Starter directory sample</p>
        <h3>Seed clubs, teams, programs, and squads</h3>
        <div className="review-stack">
          {teamDirectorySeed.map((team) => (
            <div className="review-row" key={team.id}>
              <h4>{team.name}</h4>
              <p>{joinMeta([team.sport, team.competition, `${team.region}, ${team.state}`])}</p>
              <p className="request-note">
                Level: {team.level} / {team.isVerifiedDirectoryEntry ? "Verified starter entry" : "Unverified starter entry"}
              </p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function ParentDashboardPage({
  athletes,
  highlights,
  mediaAssets,
  currentUserId,
  parentAccounts,
  onApproveProfile,
  onKeepProfilePrivate,
  onApproveHighlight,
  onKeepHighlightPrivate,
  onRequestHighlightChanges,
  onSetHighlightShowcaseStatus,
  onSetVisibility,
  opportunities,
  contactRequests,
  requestMap,
  onApproveMediaAsset,
}) {
  const [mediaApprovalStatus, setMediaApprovalStatus] = useState("");
  const pendingProfiles = athletes.filter(
    (item) =>
      item.isJunior &&
      item.profileStatus === "Pending Parent Approval" &&
      item.contactRoute === "parent_guardian",
  );
  const pendingHighlights = highlights.filter(
    (item) => item.isJunior && item.approvalStatus === "Pending Parent Approval",
  );
  const pendingAthleteIds = Array.from(
    new Set([
      ...pendingProfiles.map((item) => item.id),
      ...pendingHighlights.map((item) => item.athleteId),
    ]),
  );
  const juniorContactRequests = (contactRequests || [])
    .filter((item) => item.requestType === "contact_request" && item.to === "parent_guardian")
    .map((request) => ({
      athlete: athletes.find((item) => item.id === request.athleteId) || null,
      request,
    }))
    .filter((item) => item.athlete);
  const juniorOpportunityRequests = (contactRequests || [])
    .filter(
      (item) => item.requestType === "opportunity_interest" && item.to === "parent_guardian",
    )
    .map((request) => ({
      request,
      athlete: athletes.find((item) => item.id === request.athleteId) || null,
      opportunity: opportunities.find((item) => item.id === request.opportunityId) || null,
    }))
    .filter((item) => item.athlete && item.opportunity);
  const profileHighlightMap = highlights.reduce((acc, highlight) => {
    if (!acc[highlight.athleteId]) {
      acc[highlight.athleteId] = [];
    }
    acc[highlight.athleteId].push(highlight);
    return acc;
  }, {});
  const pendingJuniorMediaAssets = (Array.isArray(mediaAssets) ? mediaAssets : [])
    .filter(
      (asset) =>
        asset.storageSource === "supabase" &&
        asset.isJuniorMedia &&
        asset.parentGuardianRequired &&
        asset.approvalStatusRaw === "pending_parent_approval" &&
        String(asset.ownerUserId || "") === String(currentUserId || ""),
    )
    .sort(
      (left, right) =>
        new Date(right.updatedAt || right.createdAt || 0).getTime() -
        new Date(left.updatedAt || left.createdAt || 0).getTime(),
    );

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="Parent dashboard"
        title="Guardian visibility controls"
        description="The premium design now carries through the trust workflow as well."
      />

      <div className="dashboard-stat-grid">
        <MetricCard
          label="Pending profiles"
          value={`${pendingProfiles.length}`}
          detail="Junior profiles awaiting guardian approval"
          tone="gold"
        />
        <MetricCard
          label="Pending highlights"
          value={`${pendingHighlights.length}`}
          detail="Controlled clips still inside the approval flow"
          tone="blue"
        />
        <MetricCard
          label="Connected accounts"
          value={`${parentAccounts.length}`}
          detail="Parent or guardian accounts linked to athletes"
          tone="success"
        />
        <MetricCard
          label="Contact requests"
          value={`${juniorContactRequests.length}`}
          detail="Requests routed through guardian-safe contact flow"
          tone="gold"
        />
        <MetricCard
          label="Opportunity interests"
          value={`${juniorOpportunityRequests.length}`}
          detail="Junior opportunity interest records routed to parent or guardian"
          tone="success"
        />
      </div>

      <article className="surface-card trust-statement">
        <div>
          <p className="eyebrow">Parent controls</p>
          <h3>Safe visibility stays front and center</h3>
          <p className="card-body">{SAFETY_COPY}</p>
        </div>
        <div className="trust-points">
          <TrustPoint title="Child profile oversight" copy="Guardian controls keep visibility intentional and reviewable." />
          <TrustPoint title="Request review" copy="Contact requests stay visible before any wider exposure happens." />
        </div>
      </article>

      <div className="two-up-grid">
        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Safety guidance</p>
          <h3>How the junior flow works</h3>
          <div className="checklist">
            {[
              "Profiles can stay private until approved.",
              "Highlights remain controlled before showcase release.",
              "Contact always routes to the parent or guardian pathway.",
            ].map((item) => (
              <div className="check-item" key={item}>
                <span className="check-mark done" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Contact request review</p>
          <h3>Recent junior contact activity</h3>
          {juniorContactRequests.length === 0 ? (
            <p className="card-body">No junior contact requests are waiting right now.</p>
          ) : null}
          <div className="review-stack">
            {juniorContactRequests.slice(0, 4).map(({ athlete, request }) => (
              <div className="review-row" key={request.id}>
                <h4>{athlete.displayName}</h4>
                <p>
                  {joinMeta([athlete.sport, athlete.position, athlete.region])}
                </p>
                <p className="request-note">
                  Requests logged: {request.count || 1} / Route: {getContactRouteLabel(athlete.contactRoute)}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Opportunity interest review</p>
          <h3>Junior opportunity routing</h3>
          {juniorOpportunityRequests.length === 0 ? (
            <p className="card-body">No junior opportunity interests are waiting right now.</p>
          ) : null}
          <div className="review-stack">
            {juniorOpportunityRequests.slice(0, 4).map(({ request, athlete, opportunity }) => (
              <div className="review-row" key={request.id}>
                <h4>{opportunity.title}</h4>
                <p>{joinMeta([opportunity.organisation, athlete.displayName, athlete.sport])}</p>
                <p className="request-note">
                  Status: {request.status} / {getOpportunityContactNote(opportunity)}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Junior media approval</p>
          <h3>Private media waiting for parent approval</h3>
          <p className="card-body">
            This owner-scoped parent view keeps junior media private, approval-gated, and off
            public routes until both guardian and admin review steps are complete.
          </p>
          {mediaApprovalStatus ? <p className="request-note">{mediaApprovalStatus}</p> : null}
          {pendingJuniorMediaAssets.length === 0 ? (
            <p className="request-note">
              No owner-scoped junior media assets are currently waiting for parent approval.
            </p>
          ) : null}
          <div className="review-stack">
            {pendingJuniorMediaAssets.slice(0, 6).map((asset) => {
              const athlete =
                athletes.find((item) => item.id === asset.athleteProfileId) || null;
              const relatedHighlight =
                highlights.find((item) => item.id === asset.highlightId) || null;

              return (
                <div className="review-row" key={asset.id}>
                  <h4>{asset.originalFilename || asset.id}</h4>
                  <p>
                    {joinMeta([
                      athlete?.displayName || "Athlete not linked",
                      asset.mediaType,
                      relatedHighlight?.title || "",
                    ])}
                  </p>
                  <p className="request-note">
                    Approval: {getMediaApprovalDisplayLabel(asset)} / Visibility:{" "}
                    {getMediaVisibilityDisplayLabel(asset)} / {getMediaReviewRouteLabel(asset)}
                  </p>
                  <MediaStatusBadgeRow
                    leadingBadges={[
                      { label: asset.mediaType || "Private Media", tone: "neutral" },
                      { label: "Owner Scoped", tone: "private" },
                    ]}
                    mediaAsset={asset}
                    showPublicDisabled
                  />
                  <div className="review-actions">
                    <button
                      className="button button-primary"
                      onClick={async () => {
                        const result = await onApproveMediaAsset(asset.id);
                        setMediaApprovalStatus(
                          result?.message || "Parent/guardian approval recorded.",
                        );
                      }}
                      type="button"
                    >
                      Parent Approve Media
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="request-note">
            Parent-linked review will expand later. For now, approvals stay scoped to the athlete
            profiles already connected to this dashboard.
          </p>
        </article>
      </div>

      <article className="surface-card">
        <p className="card-kicker">Connected parent accounts</p>
        <div className="card-grid card-grid-two">
          {parentAccounts.map((account) => (
            <article className="surface-card nested-card" key={account.id}>
              <p className="card-kicker">{account.role}</p>
              <h3>{account.fullName}</h3>
              <p className="card-meta">Linked athlete: {account.linkedAthleteId}</p>
              <p className="card-body">Region: {account.region}</p>
            </article>
          ))}
        </div>
      </article>

      <section className="content-section">
        <SectionHeading
          eyebrow="Pending approvals"
          title="Junior approval centre"
          description="Approve visibility or keep content private from one premium review surface. Junior highlights must be parent approved before broader visibility."
        />

        {pendingAthleteIds.length === 0 ? (
          <article className="surface-card empty-state-card">
            <p className="card-kicker">No pending junior approvals</p>
            <p className="card-body">
              No pending junior highlights need approval.
            </p>
          </article>
        ) : null}

        <div className="two-up-grid">
          {pendingAthleteIds.map((athleteId) => {
            const athlete = athletes.find((item) => item.id === athleteId);
            if (!athlete) {
              return null;
            }

            const athleteHighlights = getHighlightsForAthlete(profileHighlightMap[athlete.id] || [], athlete.id)
              .filter((highlight) => highlight.isJunior);
            const pendingAthleteHighlights = athleteHighlights.filter(
              (highlight) => highlight.approvalStatus === "Pending Parent Approval",
            );
            const request = requestMap[athlete.id];

            return (
              <article className="surface-card parent-item-card" key={athlete.id}>
                <div className="search-card-header">
                  <AthleteAvatar athlete={athlete} />
                  <div>
                    <p className="card-kicker">Child profile draft</p>
                    <h3>{athlete.displayName}</h3>
                    <p className="card-meta">
                      {joinMeta([athlete.sport, athlete.position, athlete.ageGroup])}
                    </p>
                  </div>
                </div>

                <div className="badge-row">
                  {athlete.verificationBadges.map((badge) => (
                    <VerificationBadge key={badge} label={badge} compact />
                  ))}
                </div>

                <p className="card-body">{deriveStatusMessage(athlete)}</p>
                <p className="request-note">
                  Visibility: {athlete.visibilityStatus} / Requests: {request?.count || 0}
                </p>

                <div className="cta-row">
                  <button
                    className="button button-primary"
                    onClick={() => onApproveProfile(athlete.id)}
                    type="button"
                  >
                    Approve Profile
                  </button>
                  <button
                    className="button button-subtle"
                    onClick={() => onKeepProfilePrivate(athlete.id)}
                    type="button"
                  >
                    Keep Private
                  </button>
                </div>

                <article className="availability-list compact">
                  <h4>Visibility controls</h4>
                  <div className="visibility-grid">
                    {VISIBILITY_OPTIONS.map((option) => (
                      <button
                        className={
                          athlete.visibilityStatus === option
                            ? "visibility-option active"
                            : "visibility-option"
                        }
                        key={option}
                        onClick={() => onSetVisibility(athlete.id, option)}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </article>

                <div className="review-stack">
                  <p className="card-kicker">Highlight approvals</p>
                  {athleteHighlights.length === 0 ? (
                    <p className="request-note">No highlights added yet.</p>
                  ) : null}
                  {athleteHighlights.map((highlight) => (
                    <div className="review-row" key={highlight.id}>
                      <h4>{highlight.title}</h4>
                      <p>
                        {joinMeta([
                          highlight.highlightType || highlight.tag,
                          getHighlightDisplayEvent(highlight),
                          formatDisplayDate(highlight.date || highlight.eventDate),
                        ])}
                      </p>
                      <div className="badge-row">
                        {highlight.isFeatured ? (
                          <span className="status-chip status-chip-success">Featured</span>
                        ) : null}
                        <span className="status-chip">{getHighlightVerificationLabel(highlight)}</span>
                        <span className="status-chip">{getHighlightShowcaseLabel(highlight)}</span>
                      </div>
                      <p className="request-note">
                        {highlight.description || "No description added yet."}
                      </p>
                      <div className="review-actions">
                        <button
                          className="button button-primary"
                          onClick={() => onApproveHighlight(highlight.id)}
                          type="button"
                        >
                          Approve Highlight
                        </button>
                        <button
                          className="button button-subtle"
                          onClick={() => onKeepHighlightPrivate(highlight.id)}
                          type="button"
                        >
                          Keep Private
                        </button>
                        <button
                          className="button button-secondary"
                          onClick={() => onRequestHighlightChanges(highlight.id)}
                          type="button"
                        >
                          Request Changes
                        </button>
                      </div>
                      <article className="availability-list compact">
                        <h4>Showcase visibility</h4>
                        <div className="visibility-grid">
                          {HIGHLIGHT_SHOWCASE_OPTIONS.map((option) => (
                            <button
                              className={
                                getHighlightShowcaseLabel(highlight) === option
                                  ? "visibility-option active"
                                  : "visibility-option"
                              }
                              key={option}
                              onClick={() => onSetHighlightShowcaseStatus(highlight.id, option)}
                              type="button"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </article>
                    </div>
                  ))}
                  {pendingAthleteHighlights.length === 0 && athleteHighlights.length > 0 ? (
                    <p className="request-note">
                      No pending junior highlights need approval for this profile right now.
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function AdminDashboardPage({
  queues,
  athletes,
  highlights,
  opportunities,
  shortlist,
  contactRequests,
  mediaAssets,
  currentUserId,
  backendStatus,
  profileBackendTestState,
  highlightBackendTestState,
  opportunityBackendTestState,
  shortlistBackendTestState,
  contactRequestBackendTestState,
  adminQueueBackendTestState,
  mediaBackendTestState,
  storageBackendTestState,
  privateVideoStorageTestState,
  fullHighlightThumbnailTestState,
  mediaApprovalTestState,
  onDecision,
  onReviewHighlight,
  onReviewMediaAsset,
  onRunProfileBackendTest,
  onDeleteProfileBackendTest,
  onRunHighlightBackendTest,
  onDeleteHighlightBackendTest,
  onRunOpportunityBackendTest,
  onDeleteOpportunityBackendTest,
  onRunShortlistBackendTest,
  onDeleteShortlistBackendTest,
  onRunContactRequestBackendTest,
  onDeleteContactRequestBackendTest,
  onRunAdminQueueBackendTest,
  onDeleteAdminQueueBackendTest,
  onRunMediaBackendTest,
  onDeleteMediaBackendTest,
  onRunStorageBackendTest,
  onDeleteStorageBackendTest,
  onRunPrivateVideoStorageTest,
  onDeletePrivateVideoStorageTest,
  onRunFullHighlightThumbnailTest,
  onRunMediaApprovalTest,
  onDeleteMediaApprovalTest,
  onReset,
}) {
  const requestRows = (contactRequests || [])
    .map((request) => {
      const athlete = athletes.find((item) => item.id === request.athleteId);
      if (!athlete) {
        return null;
      }

      return {
        athlete,
        request,
        opportunity: request.opportunityId
          ? opportunities.find((item) => item.id === request.opportunityId) || null
          : null,
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        new Date(right.request.updatedAt || right.request.createdAt || 0).getTime() -
        new Date(left.request.updatedAt || left.request.createdAt || 0).getTime(),
    );
  const contactRequestRows = requestRows.filter(
    ({ request }) => (request.requestType || "contact_request") === "contact_request",
  );
  const interestRows = requestRows.filter(
    ({ request }) => request.requestType === "opportunity_interest",
  );
  const showcaseReadyCount = highlights.filter(isHighlightShowcaseReady).length;
  const pendingHighlightReviews = sortHighlightsByPriority(
    highlights.filter(
      (item) => !item.isJunior && item.approvalStatus === "Pending Admin Review",
    ),
  );
  const showcaseRequests = sortHighlightsByPriority(
    highlights.filter((item) => item.showcaseStatus === "Showcase Requested"),
  );
  const unverifiedHighlights = sortHighlightsByPriority(
    highlights.filter((item) => (item.verificationSource || "Unverified") === "Unverified"),
  );
  const customClubCount = new Set(
    athletes
      .filter((item) => item.club && !item.isVerifiedClubEntry)
      .map((item) => `${normalizeText(item.sport)}::${normalizeText(item.club)}`),
  ).size;
  const verifiedOpportunityCount = opportunities.filter(isOpportunityVerified).length;
  const recentOpportunities = [...opportunities]
    .sort(
      (left, right) =>
        new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime(),
    )
    .slice(0, 4);
  const backendModeLabel = backendStatus?.modeLabel || "Local Demo";
  const stats = [
    {
      label: "Pending profile reviews",
      value: `${queues.pendingProfiles.length}`,
      detail: "Profiles waiting for trust review",
      tone: "gold",
    },
    {
      label: "Pending highlight reviews",
      value: `${pendingHighlightReviews.length + showcaseRequests.length}`,
      detail: "Highlights waiting for trust review or showcase review",
      tone: "blue",
    },
    {
      label: "Pending opportunity reviews",
      value: `${queues.pendingOpportunities.length}`,
      detail: "Opportunity records currently waiting for admin verification",
      tone: "success",
    },
    {
      label: "Total opportunities",
      value: `${opportunities.length}`,
      detail: "Live opportunity records across club, academy, school, and pathway workflows",
      tone: "gold",
    },
    {
      label: "Verified opportunities",
      value: `${verifiedOpportunityCount}`,
      detail: "Opportunities already carrying verified or admin-reviewed organisation status",
      tone: "blue",
    },
    {
      label: "Contact requests",
      value: `${contactRequestRows.length}`,
      detail: "Standard athlete contact requests currently logged in the safe route",
      tone: "blue",
    },
    {
      label: "Shortlist records",
      value: `${shortlist.length}`,
      detail: "Saved athlete resumes currently sitting in the club and scout shortlist flow",
      tone: "gold",
    },
    {
      label: "Interest records",
      value: `${interestRows.length}`,
      detail: "Opportunity interest submissions currently routed through the safe contact flow",
      tone: "success",
    },
    {
      label: "Showcase approved clips",
      value: `${showcaseReadyCount}`,
      detail: "Approved highlights already visible in the premium showcase board",
      tone: "success",
    },
  ];

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="Admin dashboard"
        title="Trust review and platform quality"
        description="The operations side now matches the premium athlete-facing experience."
      />

      <div className="dashboard-stat-grid">
        {stats.map((item) => (
          <MetricCard
            key={item.label}
            label={item.label}
            value={item.value}
            detail={item.detail}
            tone={item.tone}
          />
        ))}
      </div>

      <div className="two-up-grid">
        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Trust controls</p>
          <h3>Admin focus areas</h3>
          <div className="checklist">
            {[
              "Approve resumes only when profile context is strong.",
              "Keep junior contact flow controlled and reviewable.",
              "Use flagged content queues to protect platform quality.",
            ].map((item) => (
              <div className="check-item" key={item}>
                <span className="check-mark done" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Contact request review</p>
          <h3>Recent request activity</h3>
          {requestRows.length === 0 ? (
            <p className="card-body">No contact requests have been logged yet.</p>
          ) : null}
          <div className="review-stack">
            {requestRows.slice(0, 4).map(({ athlete, request, opportunity }) => (
              <div className="review-row" key={request.id}>
                <h4>
                  {request.requestType === "opportunity_interest"
                    ? opportunity?.title || request.opportunityTitle || "Opportunity interest"
                    : athlete.displayName}
                </h4>
                <p>
                  {request.requestType === "opportunity_interest"
                    ? joinMeta([
                        opportunity?.organisation || request.organisation,
                        athlete.displayName,
                        athlete.sport,
                      ])
                    : joinMeta([athlete.sport, athlete.position, athlete.region])}
                </p>
                <p className="request-note">
                  {request.requestType === "opportunity_interest"
                    ? `Opportunity interest / Status: ${request.status} / Route: ${getContactRouteLabel(request.to)}`
                    : `Contact request / Total requests: ${request.count || 1} / Route: ${getContactRouteLabel(athlete.contactRoute)}`}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Sports directory</p>
          <h3>Catalogue and club seed status</h3>
          <div className="detail-list">
            <DetailRow label="Simple sports shown" value={String(getSimpleSportOptions().length)} />
            <DetailRow label="Internal catalogue groups" value={String(SPORT_CATEGORIES.length)} />
            <DetailRow label="Starter clubs / teams" value={String(teamDirectorySeed.length)} />
            <DetailRow label="Manual clubs pending verification" value={String(customClubCount)} />
          </div>
          <p className="request-note">
            Starter directory only - full verified team directories can be imported later.
          </p>
        </article>

        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Backend status</p>
          <h3>Connection scaffold readiness</h3>
          <div className="detail-list">
            <DetailRow
              label="Current mode"
              value={
                <span className="badge compact verification-badge-neutral">{backendModeLabel}</span>
              }
            />
            <DetailRow
              label="Backend enabled"
              value={
                <span
                  className={
                    backendStatus?.enabled ? "status-chip status-chip-success" : "status-chip"
                  }
                >
                  {backendStatus?.enabled ? "Yes" : "No"}
                </span>
              }
            />
            <DetailRow
              label="Supabase configured"
              value={
                <span
                  className={
                    backendStatus?.configured ? "status-chip status-chip-success" : "status-chip"
                  }
                >
                  {backendStatus?.configured ? "Yes" : "No"}
                </span>
              }
            />
            <DetailRow
              label="Auth enabled"
              value={
                <span
                  className={
                    backendStatus?.authEnabled ? "status-chip status-chip-success" : "status-chip"
                  }
                >
                  {backendStatus?.authEnabled ? "Yes" : "No"}
                </span>
              }
            />
            <DetailRow
              label="Current user"
              value={backendStatus?.currentUserEmail || "No Supabase user signed in"}
            />
            <DetailRow
              label="Current role"
              value={backendStatus?.currentRole ? getRoleLabel(backendStatus.currentRole) : "Not set"}
            />
            <DetailRow
              label="Profile data mode"
              value={backendStatus?.profileDataModeLabel || "Local Demo"}
            />
            <DetailRow
              label="Athlete profile table"
              value={backendStatus?.athleteProfileTableDetectedLabel || "unknown"}
            />
            <DetailRow
              label="Current profile source"
              value={backendStatus?.currentProfileSourceLabel || "localStorage"}
            />
            <DetailRow
              label="Highlight data mode"
              value={backendStatus?.highlightDataModeLabel || "Local Demo"}
            />
            <DetailRow
              label="Highlight table"
              value={backendStatus?.highlightTableDetectedLabel || "unknown"}
            />
            <DetailRow
              label="Current highlight source"
              value={backendStatus?.currentHighlightSourceLabel || "localStorage"}
            />
            <DetailRow
              label="Opportunity data mode"
              value={backendStatus?.opportunityDataModeLabel || "Local Demo"}
            />
            <DetailRow
              label="Opportunity table"
              value={backendStatus?.opportunityTableDetectedLabel || "unknown"}
            />
            <DetailRow
              label="Current opportunity source"
              value={backendStatus?.currentOpportunitySourceLabel || "localStorage"}
            />
            <DetailRow
              label="Shortlist data mode"
              value={backendStatus?.shortlistDataModeLabel || "Local Demo"}
            />
            <DetailRow
              label="Shortlist table"
              value={backendStatus?.shortlistTableDetectedLabel || "unknown"}
            />
            <DetailRow
              label="Current shortlist source"
              value={backendStatus?.currentShortlistSourceLabel || "localStorage"}
            />
            <DetailRow
              label="Contact request data mode"
              value={backendStatus?.contactRequestDataModeLabel || "Local Demo"}
            />
            <DetailRow
              label="Contact request table"
              value={backendStatus?.contactRequestTableDetectedLabel || "unknown"}
            />
            <DetailRow
              label="Current contact request source"
              value={backendStatus?.currentContactRequestSourceLabel || "localStorage"}
            />
            <DetailRow
              label="Admin queue data mode"
              value={backendStatus?.adminQueueDataModeLabel || "Local Demo"}
            />
            <DetailRow
              label="Admin queue table"
              value={backendStatus?.adminQueueTableDetectedLabel || "unknown"}
            />
            <DetailRow
              label="Current admin queue source"
              value={backendStatus?.currentAdminQueueSourceLabel || "localStorage"}
            />
            <DetailRow
              label="Media metadata mode"
              value={backendStatus?.mediaDataModeLabel || "Planning"}
            />
            <DetailRow
              label="Media asset table"
              value={backendStatus?.mediaAssetTableDetectedLabel || "unknown"}
            />
            <DetailRow
              label="Storage mode"
              value={backendStatus?.mediaStorageModeLabel || "Not Enabled"}
            />
            <DetailRow
              label="Video storage mode"
              value={backendStatus?.videoStorageModeLabel || "Not enabled"}
            />
            <DetailRow
              label="Media approval workflow"
              value={backendStatus?.mediaApprovalWorkflowLabel || "Not enabled"}
            />
            <DetailRow
              label="Profile photo bucket"
              value={backendStatus?.profilePhotoBucketDetectedLabel || "unknown"}
            />
            <DetailRow
              label="Thumbnail bucket"
              value={backendStatus?.highlightThumbnailBucketDetectedLabel || "unknown"}
            />
            <DetailRow
              label="Video bucket"
              value={backendStatus?.highlightVideoBucketDetectedLabel || "unknown"}
            />
            <DetailRow
              label="Storage buckets configured"
              value={backendStatus?.mediaBucketStatus || "not enabled yet"}
            />
            <DetailRow
              label="Safe uploads enabled"
              value={backendStatus?.uploadsEnabled ? "Yes" : "No"}
            />
            <DetailRow
              label="Public media access"
              value={backendStatus?.publicMediaAccess ? "Yes" : "No"}
            />
            <DetailRow
              label="Public unauthenticated media"
              value={backendStatus?.publicUnauthenticatedMediaLabel || "Disabled"}
            />
            <DetailRow
              label="Public video access"
              value="No"
            />
            <DetailRow
              label="Public media URLs"
              value={backendStatus?.publicMediaUrlsLabel || "Disabled"}
            />
            <DetailRow
              label="Video uploads"
              value={backendStatus?.videoUploadsLabel || "Disabled"}
            />
            <DetailRow
              label="Junior media approval"
              value={backendStatus?.juniorMediaApprovalLabel || "Parent/guardian required"}
            />
            <DetailRow
              label="Signed owner previews"
              value={backendStatus?.signedOwnerPreviewsLabel || "Not enabled"}
            />
            <DetailRow
              label="Admin media review"
              value={backendStatus?.adminMediaReviewLabel || "Not enabled"}
            />
            <DetailRow
              label="Sports data migration"
              value={
                backendStatus?.sportsDataMigrationStatus ||
                "Profiles + Highlights metadata + Opportunities metadata + Contact request metadata + Shortlists metadata + Admin queue metadata + Media metadata + Private storage phase 1 + Approval-safe media workflow phase 1 + Private highlight video upload phase 1"
              }
            />
          </div>
          <p className="request-note">{backendStatus?.message}</p>
          <p className="request-note">{backendStatus?.profileDataMessage}</p>
          <p className="request-note">{backendStatus?.highlightDataMessage}</p>
          <p className="request-note">{backendStatus?.opportunityDataMessage}</p>
          <p className="request-note">{backendStatus?.shortlistDataMessage}</p>
          <p className="request-note">{backendStatus?.contactRequestDataMessage}</p>
          <p className="request-note">{backendStatus?.adminQueueDataMessage}</p>
          <p className="request-note">{backendStatus?.mediaDataMessage}</p>
          <p className="request-note">{backendStatus?.mediaStorageMessage}</p>
          <p className="request-note">
            For account, verification, or platform support, contact {APP_ADMIN_EMAIL}.
          </p>
          <div className="dashboard-actions">
            <Link className="button button-primary" to="/qa/media-approval">
              Open Media Approval Test
            </Link>
          </div>
        </article>

        <SupabaseProfileTestPanel
          backendStatus={backendStatus}
          compact
          testState={profileBackendTestState}
          onDelete={onDeleteProfileBackendTest}
          onRunTest={onRunProfileBackendTest}
        />

        <SupabaseHighlightTestPanel
          backendStatus={backendStatus}
          compact
          testState={highlightBackendTestState}
          onDelete={onDeleteHighlightBackendTest}
          onRunTest={onRunHighlightBackendTest}
        />

        <SupabaseOpportunityTestPanel
          backendStatus={backendStatus}
          compact
          testState={opportunityBackendTestState}
          onDelete={onDeleteOpportunityBackendTest}
          onRunTest={onRunOpportunityBackendTest}
        />

        <SupabaseShortlistTestPanel
          backendStatus={backendStatus}
          compact
          testState={shortlistBackendTestState}
          onDelete={onDeleteShortlistBackendTest}
          onRunTest={onRunShortlistBackendTest}
        />

        <SupabaseContactRequestTestPanel
          backendStatus={backendStatus}
          compact
          testState={contactRequestBackendTestState}
          onDelete={onDeleteContactRequestBackendTest}
          onRunTest={onRunContactRequestBackendTest}
        />

        <SupabaseAdminQueueTestPanel
          backendStatus={backendStatus}
          compact
          testState={adminQueueBackendTestState}
          onDelete={onDeleteAdminQueueBackendTest}
          onRunTest={onRunAdminQueueBackendTest}
        />

        <SupabaseMediaMetadataTestPanel
          backendStatus={backendStatus}
          compact
          testState={mediaBackendTestState}
          onDelete={onDeleteMediaBackendTest}
          onRunTest={onRunMediaBackendTest}
        />

        <SupabaseStorageTestPanel
          backendStatus={backendStatus}
          compact
          testState={storageBackendTestState}
          onDelete={onDeleteStorageBackendTest}
          onRunTest={onRunStorageBackendTest}
        />

        <SupabasePrivateVideoStorageTestPanel
          backendStatus={backendStatus}
          compact
          testState={privateVideoStorageTestState}
          onDelete={onDeletePrivateVideoStorageTest}
          onRunTest={onRunPrivateVideoStorageTest}
        />

        <SupabaseFullHighlightThumbnailTestPanel
          backendStatus={backendStatus}
          compact
          testState={fullHighlightThumbnailTestState}
          onRunTest={onRunFullHighlightThumbnailTest}
        />

        <SupabaseMediaApprovalTestPanel
          backendStatus={backendStatus}
          compact
          testState={mediaApprovalTestState}
          onDelete={onDeleteMediaApprovalTest}
          onRunTest={onRunMediaApprovalTest}
        />

        <AdminMediaReviewPanel
          athletes={athletes}
          currentUserId={currentUserId}
          mediaAssets={mediaAssets}
          onReviewMediaAsset={onReviewMediaAsset}
        />

        <article className="surface-card dashboard-panel">
          <p className="card-kicker">Opportunity board status</p>
          <h3>Live recruitment board overview</h3>
          {recentOpportunities.length === 0 ? (
            <p className="card-body">No opportunities are live in the local board right now.</p>
          ) : null}
          <div className="review-stack">
            {recentOpportunities.map((opportunity) => (
              <div className="review-row" key={opportunity.id}>
                <h4>{opportunity.title}</h4>
                <p>
                  {joinMeta([
                    opportunity.organisation,
                    opportunity.sport,
                    opportunity.positionRole,
                    getLocationSummary(opportunity),
                  ])}
                </p>
                <p className="request-note">
                  {getOpportunityVerificationLabel(opportunity)} / {opportunity.opportunityType} / Closing{" "}
                  {formatDisplayDate(opportunity.closingDate)}
                </p>
              </div>
            ))}
          </div>
          <p className="request-note">
            {backendStatus?.currentOpportunitySource === "supabase"
              ? "Owned opportunities can save securely in this phase while visibility stays controlled."
              : "Opportunities still stay request-only in this phase, with no direct messaging and no public posting flow."}
          </p>
        </article>
      </div>

      <div className="cta-row section-row-end">
        <button className="button button-subtle" onClick={onReset} type="button">
          Reset Demo Data
        </button>
      </div>

      <div className="dashboard-grid">
        <ReviewQueue
          title="Pending profile reviews"
          items={queues.pendingProfiles}
          onDecision={(id, value) => onDecision("pendingProfiles", id, value)}
        />
        <ReviewQueue
          title="Pending opportunity reviews"
          items={queues.pendingOpportunities}
          onDecision={(id, value) => onDecision("pendingOpportunities", id, value)}
        />
        <ReviewQueue
          title="Club and scout verification requests"
          items={queues.verificationRequests}
          onDecision={(id, value) => onDecision("verificationRequests", id, value)}
        />
        <ReviewQueue
          title="Flagged content"
          items={queues.flaggedContent}
          onDecision={(id, value) => onDecision("flaggedContent", id, value)}
        />
        <AdminHighlightReviewPanel
          title="Pending highlight reviews"
          description="Adult highlights waiting for admin review before their trust or public status improves."
          athletes={athletes}
          highlights={pendingHighlightReviews}
          onAction={onReviewHighlight}
        />
        <AdminHighlightReviewPanel
          title="Showcase requests"
          description="These clips have been requested for showcase visibility and need an admin decision."
          athletes={athletes}
          highlights={showcaseRequests}
          onAction={onReviewHighlight}
        />
        <AdminHighlightReviewPanel
          title="Unverified highlights"
          description="Highlights still carrying unverified status can be reviewed, approved, or kept profile-only."
          athletes={athletes}
          highlights={unverifiedHighlights}
          onAction={onReviewHighlight}
        />
      </div>
    </section>
  );
}

function MorePage({ selectedRole, hasDemoAccount }) {
  const links = getMoreLinksForRole(selectedRole, hasDemoAccount);

  return (
    <section className="page-stack">
      <SectionHeading
        eyebrow="More"
        title="Platform tools and admin routes"
        description="Utility pages still exist, but they now feel like part of the same premium product."
      />

      <article className="surface-card trust-statement">
        <div>
          <p className="eyebrow">Platform note</p>
          <h3>A sports resume platform first</h3>
          <p className="card-body">
            My Sports Resume stays focused on athlete portfolios, discovery, trust, and safe contact.
          </p>
        </div>
        <div className="trust-points">
          <TrustPoint title="Current role" copy={getRoleLabel(selectedRole)} />
          <TrustPoint title="Switch anytime" copy="Use the role chooser to explore a different dashboard path." />
        </div>
      </article>

      <section className="dashboard-grid">
        {links.map((item) => (
          <article className="surface-card more-card" key={item.label}>
            <p className="card-kicker">Shortcut</p>
            <h3>{item.label}</h3>
            <p className="card-body">{item.description}</p>
            <Link className="button button-primary" to={item.to}>
              Open
            </Link>
          </article>
        ))}
      </section>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="content-section">
      <article className="surface-card empty-state-card">
        <p className="card-kicker">Page not found</p>
        <h2>This route is not in the prototype yet</h2>
        <p className="card-body">Use the premium navigation to return home.</p>
        <Link className="button button-primary" to="/">
          Return Home
        </Link>
      </article>
    </section>
  );
}

function BrandLogoBadge({ compact = false }) {
  return (
    <div className={compact ? "brand-logo-badge compact" : "brand-logo-badge"}>
      <img src={mySportsResumeApprovedLogo} alt="My Sports Resume logo" />
      <div>
        <p className="card-kicker">My Sports Resume</p>
        <h4>Profile. Highlights. Opportunity.</h4>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <header className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="section-description">{description}</p>
    </header>
  );
}

function SportPathwayStrip({
  title = "Choose your sport",
  description = "Build your sports resume and find clubs near your postcode.",
  sports = SPORT_FIRST_PATHWAY_OPTIONS,
  selectedSport = "",
  onSelectSport,
  ctaItems = [],
  compact = false,
  contextNote = "Find clubs near your postcode, then keep building from there.",
}) {
  const activeSportName = selectedSport || sports[0] || "Rugby League";
  const normalizedSelected = normalizeText(activeSportName);
  const activeSportDefinition = findSportDefinition(activeSportName) || getDefaultSportDefinition();
  const summary = SPORT_PATHWAY_SUMMARIES[activeSportDefinition.name] || SPORT_PATHWAY_SUMMARIES.Other;
  const positionOptions = getDirectoryPositionsForSport(activeSportDefinition.name)
    .filter((item) => item !== NSW_RUGBY_LEAGUE_OTHER_OPTION)
    .slice(0, compact ? 6 : 8);
  const highlightOptions = getDirectoryHighlightTypesForSport(activeSportDefinition.name)
    .filter((item) => item !== NSW_RUGBY_LEAGUE_OTHER_OPTION)
    .slice(0, compact ? 6 : 8);
  const ageGroups = getDirectoryAgeGroupsForSport(activeSportDefinition.name);
  const ageSummary = activeSportDefinition.supportsIndividual && !activeSportDefinition.supportsTeamClub
    ? "Under 8 to Under 18, then Open or Masters."
    : "Under 6 to Under 18, then senior grades.";
  const getActionClassName = (variant) => variant || "button button-secondary";

  return (
    <article className="surface-card sport-pathway-strip">
      <div className="sport-pathway-topline">
        <p className="card-kicker">Sport-first pathway</p>
        <h3>{title}</h3>
      </div>
      <p className="card-body">{description}</p>
      <div className="sport-pathway-grid" role="group" aria-label={title}>
        {sports.map((sport) => {
          const isSelected = normalizedSelected === normalizeText(sport);
          const className = isSelected
            ? "sport-pathway-pill sport-pathway-pill-selected"
            : "sport-pathway-pill";

          if (typeof onSelectSport === "function") {
            return (
              <button
                className={className}
                key={sport}
                onClick={() => onSelectSport(sport)}
                type="button"
              >
                {sport}
              </button>
            );
          }

          return (
            <span className={className} key={sport}>
              {sport}
            </span>
          );
        })}
      </div>
      <div className={compact ? "sport-space-panel compact" : "sport-space-panel"}>
        <div className="sport-space-summary">
          <p className="card-kicker">{activeSportDefinition.name}</p>
          <h4>Build your {activeSportDefinition.name} pathway</h4>
          <p className="card-body">{summary.description}</p>
          <p className="request-note">{summary.pathway}</p>
        </div>
        <div className="sport-space-detail-grid">
          <article className="sport-space-detail-card">
            <p className="card-kicker">Common positions / roles</p>
            <div className="badge-row">
              {positionOptions.map((item) => (
                <span className="badge" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </article>
          <article className="sport-space-detail-card">
            <p className="card-kicker">Common highlights</p>
            <div className="badge-row">
              {highlightOptions.map((item) => (
                <span className="badge" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </article>
          <article className="sport-space-detail-card">
            <p className="card-kicker">Age group pathway</p>
            <p className="card-body">{ageSummary}</p>
            <p className="request-note">
              {ageGroups.slice(0, 4).join(", ")}{ageGroups.length > 4 ? " ..." : ""}
            </p>
          </article>
        </div>
        {ctaItems.length > 0 ? (
          <div className="cta-row sport-space-cta-row">
            {ctaItems.map((item) =>
              item.to ? (
                <Link
                  className={getActionClassName(item.variant)}
                  key={`${item.label}-${item.to}`}
                  to={item.to}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  className={getActionClassName(item.variant)}
                  key={item.label}
                  onClick={item.onClick}
                  type="button"
                >
                  {item.label}
                </button>
              ),
            )}
          </div>
        ) : null}
      </div>
      <p className="request-note">{contextNote}</p>
    </article>
  );
}

function StepCard({ number, title, copy }) {
  return (
    <article className="surface-card step-card">
      <span className="step-number">{number}</span>
      <p className="card-kicker">How it works</p>
      <h3>{title}</h3>
      <p className="card-body">{copy}</p>
    </article>
  );
}

function AudienceCard({ marker, eyebrow, title, copy, points, to, cta }) {
  return (
    <article className="surface-card audience-card">
      <div className="audience-card-topline">
        <span className="audience-marker">{marker}</span>
        <p className="card-kicker">{eyebrow}</p>
      </div>
      <h3>{title}</h3>
      <p className="card-body">{copy}</p>
      <div className="checklist">
        {points.map((item) => (
          <div className="check-item" key={item}>
            <span className="check-mark done" />
            <p>{item}</p>
          </div>
        ))}
      </div>
      {to && cta ? (
        <Link className="button button-secondary feature-card-link" to={to}>
          {cta}
        </Link>
      ) : null}
    </article>
  );
}

function TrustPoint({ title, copy }) {
  return (
    <article className="trust-point">
      <h4>{title}</h4>
      <p>{copy}</p>
    </article>
  );
}

function AthleteAvatar({ athlete, large, mediaUrl = "" }) {
  return (
    <div className={large ? "athlete-avatar athlete-avatar-large" : "athlete-avatar"}>
      {mediaUrl ? (
        <>
          <img
            alt={`${athlete.displayName} private profile media preview`}
            className="athlete-avatar-image"
            src={mediaUrl}
          />
          <small className="athlete-avatar-image-label">Owner preview</small>
        </>
      ) : (
        <>
          <span>{getInitials(athlete.displayName)}</span>
          <small>Player avatar</small>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, detail, tone, progress, compact = false }) {
  const compactClass = compact ? " compact-metric" : "";
  const toneClass = tone ? ` tone-${tone}` : "";
  const className = `surface-card metric-card${toneClass}${compactClass}`;

  return (
    <article className={className}>
      <p className="card-kicker">{label}</p>
      <strong>{value}</strong>
      {typeof progress === "number" ? (
        <div
          className="completion-track"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="completion-fill" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      <p className="card-body">{detail}</p>
    </article>
  );
}

function ProfilePreviewCard({ athlete, highlight, compact = false }) {
  const opportunityBadges = getAvailabilityBadges(athlete);
  const sportDefinition = getSportDefinitionForProfile(athlete);
  const teamFieldLabel = getTeamFieldLabel(sportDefinition);
  const locationSummary = getLocationSummary(athlete) || "Location not provided";
  const compactLocationSummary = joinMeta([athlete.region, athlete.state]) || locationSummary;
  const topAchievements = athlete.achievements.slice(0, compact ? 2 : 3);
  const previewAchievements =
    topAchievements.length > 0
      ? topAchievements
      : [
          athlete.club ? `${teamFieldLabel}: ${athlete.club}` : "Playing history ready to add",
          athlete.competitionLevel || "Competition level ready to add",
        ];
  const previewStats = compact
    ? [
        { label: "Age group", value: athlete.ageGroup || "Not set" },
        { label: "State", value: athlete.state || athlete.region || "Not set" },
        { label: "Level", value: athlete.competitionLevel || "Not set" },
      ]
    : athlete.stats.length > 0
    ? athlete.stats.slice(0, 3)
    : [
        { label: teamFieldLabel, value: athlete.club || "Not provided" },
        { label: "Competition level", value: athlete.competitionLevel || "Not provided" },
        { label: "Visibility", value: athlete.visibilityStatus },
      ].slice(0, 3);
  const previewNote =
    opportunityBadges.length > 0
      ? opportunityBadges.join(compact ? " • " : " / ")
      : "Opportunity preferences will appear here once set.";
  const previewClassName = compact
    ? "surface-card profile-preview-card compact-preview-card"
    : "surface-card profile-preview-card";
  const displayPreviewNote = compact
    ? null
    : opportunityBadges.length > 0
    ? opportunityBadges.join(" / ")
    : "Opportunity preferences will appear here once set.";
  const identityPrimaryMeta = compact
    ? joinMeta([athlete.sport, athlete.position || "Role not set"])
    : joinMeta([athlete.sport, athlete.position, athlete.ageGroup, locationSummary]);
  const identitySecondaryMeta = compact
    ? compactLocationSummary
    : `${teamFieldLabel}: ${athlete.club || "Not provided"}`;
  const compactSupportingMeta = compact
    ? `${teamFieldLabel}: ${athlete.club || "Team not set"}`
    : null;

  return (
    <article className={previewClassName}>
      {!compact ? (
        <div className="resume-preview-topline">
          <span className={isVerifiedProfile(athlete) ? "badge verification-badge-verified" : "badge"}>
            {isVerifiedProfile(athlete) ? "Verified Athlete" : "Public Resume Preview"}
          </span>
          <span className="card-kicker">Public resume card</span>
        </div>
      ) : null}

      <div className="preview-hero">
        <AthleteAvatar athlete={athlete} large={!compact} />
        <div className="preview-identity">
          <div className="card-header-row">
            <p className="card-kicker">Resume preview</p>
            <span className="player-number">#{getJerseyNumber(athlete)}</span>
          </div>
          <h3>{athlete.displayName}</h3>
          <p className="card-meta">{identityPrimaryMeta}</p>
          <p className="card-meta">{identitySecondaryMeta}</p>
          {compactSupportingMeta ? (
            <p className="card-meta preview-supporting-meta">{compactSupportingMeta}</p>
          ) : null}
          {!compact ? (
            <div className="badge-row">
              <span className="status-chip status-chip-success">{athlete.sport}</span>
              <span className="status-chip status-chip-opportunity">
                {athlete.position || "Role not set"}
              </span>
              <span className="status-chip">{athlete.ageGroup || "Age group not set"}</span>
            </div>
          ) : null}
        </div>
      </div>

      {!compact ? (
        <div className="badge-row">
          <span className="badge">{athlete.sportCategory || sportDefinition.category}</span>
          <span className="badge">{athlete.position || "Role not set"}</span>
          <span className="badge">{locationSummary}</span>
          <span className="badge">{athlete.competitionLevel || "Competition level not set"}</span>
        </div>
      ) : (
        <div className="badge-row compact-preview-badges">
          <span className="badge">{athlete.sportCategory || sportDefinition.category}</span>
          <span className="badge">{getTeamVerificationLabel(athlete)}</span>
        </div>
      )}

      {previewAchievements.length > 0 ? (
        <div className="achievement-grid resume-preview-achievements">
          {previewAchievements.map((item) => (
            <span className="achievement-badge" key={item}>
              {item}
            </span>
          ))}
        </div>
      ) : null}

      <div className="highlight-canvas">
        <span>Featured highlight</span>
        <strong>{highlight?.title || "Add your first highlight"}</strong>
        {compact ? (
          <small>{highlight ? getHighlightDisplayEvent(highlight) : "Video proof will appear here."}</small>
        ) : null}
      </div>

      <div className="stat-grid compact-stat-grid">
        {previewStats.map((item) => (
          <div className="stat-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      {displayPreviewNote ? <p className="request-note">{displayPreviewNote}</p> : null}

      <Link className="button button-subtle" to={`/resume/${athlete.id}`}>
        View Full Public Resume
      </Link>
    </article>
  );
}

function HighlightWallCard({ athlete, highlight, onBoost }) {
  return (
    <article className="surface-card wall-card">
      <div className="wall-media">
        <span>Highlight card</span>
        <strong>{highlight.statusLabel}</strong>
      </div>

      <p className="card-kicker">{athlete.sportCategory || athlete.sport}</p>
      <h3>{highlight.title}</h3>
      <p className="card-meta">
        {joinMeta([
          athlete.displayName,
          highlight.positionPlayed || athlete.position,
          getLocationSummary(athlete),
          athlete.ageGroup,
        ])}
      </p>
      <p className="card-body">{highlight.description || "No description provided yet."}</p>

      <div className="badge-row">
        <span className="badge">{highlight.highlightType || highlight.tag}</span>
        <span className="badge">{getHighlightDisplayEvent(highlight)}</span>
        <span className="badge">{formatDisplayDate(highlight.date || highlight.eventDate)}</span>
        <span className="badge">{athlete.sport}</span>
        <span className="badge">{highlight.positionPlayed || athlete.position || "Role not set"}</span>
        <span className="badge">{athlete.competitionLevel || "Competition level not set"}</span>
        <span className="badge">{getTeamVerificationLabel(athlete)}</span>
      </div>

      <div className="badge-row">
        <span className="status-chip">{getHighlightShowcaseLabel(highlight)}</span>
        <span className="status-chip">{getHighlightVerificationLabel(highlight)}</span>
        <span className="status-chip">{highlight.verificationSource || "Unverified"}</span>
        <span className="status-chip status-chip-opportunity">
          {highlight.isJunior ? "Junior safe route" : `Talent Boost x${highlight.boostCount}`}
        </span>
      </div>

      <p className="request-note">
        {highlight.isJunior
          ? "Showcase approval remains controlled. Junior boost counts stay hidden from public-facing language."
          : "Talent Boost is a local showcase signal only for approved resume highlights."}
      </p>

      <div className="cta-row">
        <button className="button button-secondary" onClick={onBoost} type="button">
          Talent Boost
        </button>
        <Link className="button button-primary" to={`/resume/${athlete.id}`}>
          View Profile
        </Link>
      </div>
    </article>
  );
}

function ProfileHighlightCard({
  athlete,
  highlight,
  thumbnailAsset = null,
  thumbnailPreviewUrl = "",
  videoAsset = null,
  videoPreviewUrl = "",
  showOwnerMediaStatus = false,
}) {
  const showApprovedThumbnailPreview = Boolean(thumbnailPreviewUrl);
  const showApprovedVideoPreview = Boolean(videoPreviewUrl);
  const thumbnailMessage = getMediaOwnerPresentationMessage(thumbnailAsset, {
    emptyMessage: "No private thumbnail asset is linked to this highlight yet.",
    previewLoaded: showApprovedThumbnailPreview,
  });
  const videoMessage = getMediaOwnerPresentationMessage(videoAsset, {
    emptyMessage: "No private video asset is linked to this highlight yet.",
    previewLoaded: showApprovedVideoPreview,
  });

  return (
    <article className="surface-card profile-highlight-card">
      <div className="video-strip">
        <span>Clip preview</span>
        <strong>{highlight.statusLabel || highlight.tag}</strong>
      </div>
      {showApprovedThumbnailPreview ? (
        <div className="private-media-preview-panel">
          <img
            alt={`${highlight.title} approved private thumbnail preview`}
            className="private-media-preview"
            src={thumbnailPreviewUrl}
          />
          <small className="private-media-preview-label">Private owner preview</small>
        </div>
      ) : null}
      {showApprovedVideoPreview ? (
        <div className="private-media-preview-panel">
          <video
            className="private-media-preview"
            controls
            src={videoPreviewUrl}
          />
          <small className="private-media-preview-label">Private owner preview</small>
        </div>
      ) : null}
      <p className="card-kicker">{athlete.sport}</p>
      <h3>{highlight.title}</h3>
      <p className="card-meta">
        {joinMeta([athlete.position, getLocationSummary(athlete), athlete.ageGroup])}
      </p>
      <p className="card-body">{highlight.description || "No clip description provided."}</p>
      <div className="badge-row">
        <span className="badge">{highlight.highlightType || highlight.tag}</span>
        <span className="badge">{getHighlightDisplayEvent(highlight)}</span>
        <span className="badge">{formatDisplayDate(highlight.date || highlight.eventDate)}</span>
        <span className="badge">{highlight.positionPlayed || athlete.position || "Role not set"}</span>
        <span className="badge">{athlete.competitionLevel || "Competition level not set"}</span>
        <span className="status-chip">{getHighlightShowcaseLabel(highlight)}</span>
        <span className="status-chip">{getHighlightVerificationLabel(highlight)}</span>
      </div>
      <p className="request-note">
        {highlight.isJunior
          ? "Showcase approval label is controlled by parent and admin review for junior athletes."
          : "Talent Boost helps this clip stand out inside the premium highlight library."}
      </p>
      {showOwnerMediaStatus ? (
        <div className="media-note-stack">
          <div className="media-status-summary">
            <p className="card-kicker">Thumbnail status</p>
            <MediaStatusBadgeRow
              leadingBadges={[{ label: "Private", tone: "private" }]}
              mediaAsset={thumbnailAsset}
              previewLoaded={showApprovedThumbnailPreview}
              showOwnerPreview
              showPublicDisabled
            />
            <p className="request-note">{thumbnailMessage}</p>
          </div>
          <div className="media-status-summary">
            <p className="card-kicker">Video status</p>
            <MediaStatusBadgeRow
              leadingBadges={[{ label: "Private", tone: "private" }]}
              mediaAsset={videoAsset}
              previewLoaded={showApprovedVideoPreview}
              showOwnerPreview
              showPublicDisabled
              showVideoPrivate
            />
            <p className="request-note">{videoMessage}</p>
          </div>
          {!showApprovedThumbnailPreview && !showApprovedVideoPreview ? (
            <div className="private-media-placeholder">
              <span>Owner preview not loaded</span>
              <strong>Pending, rejected, archived, or expired private media stays hidden here.</strong>
              <small>
                Use Account or Highlight Manager to load a fresh private preview when the signed URL needs to be refreshed.
              </small>
            </div>
          ) : null}
        </div>
      ) : null}
      <Link className="button button-subtle" to={`/resume/${athlete.id}`}>
        View Profile
      </Link>
    </article>
  );
}

function VerificationBadge({ label, compact }) {
  const baseClass = compact ? "badge verification-badge compact" : "badge verification-badge";
  const toneClass =
    label.includes("Verified") || label.includes("Approved")
      ? `${baseClass} verification-badge-verified`
      : `${baseClass} verification-badge-neutral`;

  return <span className={toneClass}>{label}</span>;
}

function FilterField({ label, value, options, onChange, compact }) {
  return (
    <label className={compact ? "form-field compact" : "form-field"}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChoiceChipGroup({ label, value, options, onChange, helper }) {
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  );

  return (
    <div className="form-field detail-grid-full choice-chip-group">
      <span>{label}</span>
      <div className="choice-chip-grid">
        {normalizedOptions.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              aria-pressed={isActive}
              className={isActive ? "choice-chip-button active" : "choice-chip-button"}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {helper ? <p className="field-helper">{helper}</p> : null}
    </div>
  );
}

function CheckboxChip({ checked, label, onChange }) {
  return (
    <label className={checked ? "checkbox-chip active" : "checkbox-chip"}>
      <input checked={checked} onChange={onChange} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function AdminHighlightReviewPanel({ title, description, athletes, highlights, onAction }) {
  return (
    <article className="surface-card review-queue-card">
      <p className="card-kicker">Highlight review</p>
      <h3>{title}</h3>
      <p className="card-body">{description}</p>
      <div className="review-stack">
        {highlights.length === 0 ? (
          <article className="surface-card nested-card review-row">
            <p className="card-body">No items currently in this queue.</p>
          </article>
        ) : null}

        {highlights.map((highlight) => {
          const athlete = athletes.find((item) => item.id === highlight.athleteId) || null;

          return (
            <div className="review-row" key={highlight.id}>
              <h4>{highlight.title}</h4>
              <p>
                {joinMeta([
                  athlete?.displayName,
                  athlete?.sport || highlight.sport,
                  highlight.highlightType || highlight.tag,
                  getHighlightDisplayEvent(highlight),
                ])}
              </p>
              <div className="badge-row">
                <span className="badge">{formatDisplayDate(highlight.date || highlight.eventDate)}</span>
                <span className="badge">{athlete?.ageGroup || highlight.ageGroup || "Age group not added"}</span>
                <span className="status-chip">{getHighlightVerificationLabel(highlight)}</span>
                <span className="status-chip">{getHighlightShowcaseLabel(highlight)}</span>
              </div>
              <p className="request-note">
                {highlight.description || "No description added yet."}
              </p>
              <div className="review-actions">
                <button
                  className="button button-primary"
                  onClick={() => onAction(highlight.id, "Approve")}
                  type="button"
                >
                  Approve
                </button>
                <button
                  className="button button-secondary"
                  onClick={() => onAction(highlight.id, "Approve for Showcase")}
                  type="button"
                >
                  Approve for Showcase
                </button>
                <button
                  className="button button-secondary"
                  onClick={() => onAction(highlight.id, "Keep Profile Only")}
                  type="button"
                >
                  Keep Profile Only
                </button>
                <button
                  className="button button-subtle"
                  onClick={() => onAction(highlight.id, "Mark Reviewed")}
                  type="button"
                >
                  Mark Reviewed
                </button>
                <button
                  className="button button-subtle"
                  onClick={() => onAction(highlight.id, "Reject")}
                  type="button"
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function ReviewQueue({ title, items, onDecision }) {
  return (
    <article className="surface-card review-queue-card">
      <p className="card-kicker">Review queue</p>
      <h3>{title}</h3>
      <div className="review-stack">
        {items.length === 0 ? (
          <article className="surface-card nested-card review-row">
            <p className="card-body">No items currently in this queue.</p>
          </article>
        ) : null}

        {items.map((item) => (
          <div className="review-row" key={item.id}>
            <h4>{item.title}</h4>
            <p>{item.detail}</p>
            <div className="review-actions">
              <button
                className="button button-subtle"
                onClick={() => onDecision(item.id, "Reject")}
                type="button"
              >
                Reject
              </button>
              <button
                className="button button-primary"
                onClick={() => onDecision(item.id, "Approve")}
                type="button"
              >
                Approve
              </button>
              <button
                className="button button-secondary"
                onClick={() => onDecision(item.id, "Mark Reviewed")}
                type="button"
              >
                Mark Reviewed
              </button>
            </div>
            {item.status ? <p className="request-note">Status: {item.status}</p> : null}
            <p className="request-note">Source: {getAdminQueueSourceLabel(item)}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  select,
  options = [],
  helper,
  listId,
  listOptions = [],
  placeholderOption,
  autoComplete,
}) {
  const uniqueListOptions = [...new Set(listOptions.filter(Boolean))];
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  );

  if (select) {
    return (
      <label className="form-field">
        <span>{label}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {placeholderOption ? <option value="">{placeholderOption}</option> : null}
          {normalizedOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {helper ? <p className="field-helper">{helper}</p> : null}
      </label>
    );
  }

  return (
    <label className="form-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        list={listId || undefined}
        autoComplete={autoComplete || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {listId && uniqueListOptions.length > 0 ? (
        <datalist id={listId}>
          {uniqueListOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      ) : null}
      {helper ? <p className="field-helper">{helper}</p> : null}
    </label>
  );
}

export default App;
