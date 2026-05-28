import {
  NSW_RUGBY_LEAGUE_HIGHLIGHT_TYPE_OPTIONS,
  NSW_RUGBY_LEAGUE_POSITION_OPTIONS,
} from "./nswRugbyLeagueDirectory";

export const AUSTRALIAN_CUSTOM_CLUB_VALUE = "__custom_unverified_club__";

export const AUSTRALIAN_SPORTS_DIRECTORY_LABEL =
  "Starter postcode sports directory - expandable and pending verification.";

export const MAIN_AUSTRALIAN_SPORTS_LIST = [
  "Rugby League",
  "Rugby Union",
  "AFL",
  "Soccer",
  "Netball",
  "Basketball",
  "Cricket",
  "Touch Football",
  "Oztag",
  "Athletics",
  "Swimming",
  "Boxing",
  "Martial Arts",
  "Tennis",
  "Hockey",
  "Golf",
  "Baseball",
  "Softball",
  "Volleyball",
  "Rowing",
  "Surf Life Saving",
  "Other",
];

// Backward-compatible export used by existing screens.
export const SIMPLE_SPORTS_LIST = MAIN_AUSTRALIAN_SPORTS_LIST;

export const TEAM_SPORT_JUNIOR_AGE_GROUPS = [
  "Under 6",
  "Under 7",
  "Under 8",
  "Under 9",
  "Under 10",
  "Under 11",
  "Under 12",
  "Under 13",
  "Under 14",
  "Under 15",
  "Under 16",
  "Under 17",
  "Under 18",
];

export const TEAM_SPORT_SENIOR_AGE_GROUPS = [
  "Under 19",
  "Under 21",
  "Open",
  "Reserve Grade",
  "First Grade",
  "Women's",
  "Masters",
  "Other",
];

export const INDIVIDUAL_SPORT_AGE_GROUPS = [
  "Under 8",
  "Under 10",
  "Under 12",
  "Under 14",
  "Under 16",
  "Under 18",
  "Open",
  "Masters",
  "Other",
];

const DEFAULT_SOURCE_NOTE =
  "Starter seed only - not a complete official Australian club database. Verify before official directory launch.";

const NEEDS_VERIFICATION_SOURCE_NOTE =
  "Starter 2460 placeholder - needs local verification before official directory launch.";

const DEFAULT_2460_AREA = "Grafton / South Grafton / Clarence Valley";
const DEFAULT_2460_NEARBY_SUBURBS = [
  "Grafton",
  "South Grafton",
  "Junction Hill",
  "Clarenza",
  "Waterview Heights",
  "Clarence Valley",
];

const TEAM_SPORTS = new Set([
  "rugby league",
  "rugby union",
  "afl",
  "soccer",
  "netball",
  "basketball",
  "cricket",
  "touch football",
  "oztag",
  "hockey",
  "baseball",
  "softball",
  "volleyball",
]);

const POSITION_OPTIONS_BY_SPORT = {
  "rugby league": NSW_RUGBY_LEAGUE_POSITION_OPTIONS,
  "rugby union": [
    "Fullback",
    "Wing",
    "Centre",
    "Fly-half",
    "Scrum-half",
    "Prop",
    "Hooker",
    "Lock",
    "Flanker",
    "Number 8",
    "Utility",
    "Other",
  ],
  afl: ["Defender", "Midfielder", "Ruck", "Forward", "Wing", "Utility", "Other"],
  soccer: ["Goalkeeper", "Defender", "Fullback", "Midfielder", "Winger", "Striker", "Utility", "Other"],
  netball: ["GS", "GA", "WA", "C", "WD", "GD", "GK", "Other"],
  basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Centre", "Other"],
  cricket: ["Batter", "Bowler", "All-rounder", "Wicketkeeper", "Fielder", "Other"],
  "touch football": ["Middle", "Link", "Wing", "Utility", "Other"],
  oztag: ["Middle", "Link", "Wing", "Utility", "Other"],
  athletics: ["Sprinter", "Distance", "Middle-distance", "Field event", "Relay", "Multi-event", "Other"],
  swimming: ["Sprinter", "Distance", "Middle-distance", "Relay", "Multi-event", "Other"],
  boxing: ["Athlete", "Fighter", "Weight class pending", "Other"],
  "martial arts": ["Athlete", "Fighter", "Weight class pending", "Other"],
  tennis: ["Singles Player", "Doubles Player", "Other"],
  hockey: ["Goalkeeper", "Defender", "Midfielder", "Forward", "Utility", "Other"],
  golf: ["Golfer", "Other"],
  baseball: ["Pitcher", "Catcher", "Infielder", "Outfielder", "Utility", "Other"],
  softball: ["Pitcher", "Catcher", "Infielder", "Outfielder", "Utility", "Other"],
  volleyball: ["Setter", "Outside Hitter", "Middle Blocker", "Opposite", "Libero", "Other"],
  rowing: ["Single Sculler", "Sweep Rower", "Coxswain", "Crew", "Other"],
  "surf life saving": ["Sprinter", "Swimmer", "Board", "Ski", "Iron Athlete", "Relay", "Other"],
  other: ["Athlete", "Competitor", "Player", "Other"],
};

const HIGHLIGHT_TYPES_BY_SPORT = {
  "rugby league": NSW_RUGBY_LEAGUE_HIGHLIGHT_TYPE_OPTIONS,
  "rugby union": [
    "Try",
    "Try assist",
    "Line break",
    "Tackle",
    "Ruck work",
    "Maul",
    "Kick chase",
    "Support play",
    "Full game clip",
    "Other",
  ],
  afl: ["Goal", "Mark", "Tackle", "Clearance", "Inside 50", "Intercept", "Spoil", "Run and carry", "Full game clip", "Other"],
  soccer: ["Goal", "Assist", "Save", "Tackle", "Interception", "Through ball", "Cross", "Dribble", "Defensive recovery", "Set piece", "Full game clip", "Other"],
  netball: ["Goal", "Intercept", "Deflection", "Feed", "Centre pass receive", "Rebound", "Defensive pressure", "Turnover", "Full game clip", "Other"],
  basketball: ["Score", "Assist", "Rebound", "Steal", "Block", "Fast break", "Three-pointer", "Defensive stop", "Full game clip", "Other"],
  cricket: ["Wicket", "Catch", "Run out", "Boundary", "Six", "Bowling spell", "Batting innings", "Keeper dismissal", "Fielding highlight", "Other"],
  "touch football": ["Try", "Try assist", "Line break", "Dummy-half run", "Defensive read", "Touch", "Full game clip", "Other"],
  oztag: ["Try", "Try assist", "Line break", "Tag", "Defensive read", "Kick return", "Full game clip", "Other"],
  boxing: ["Combination", "Defence", "Footwork", "Sparring clip", "Pad work", "Competition bout", "Technique clip", "Other"],
  "martial arts": ["Combination", "Defence", "Footwork", "Sparring clip", "Pad work", "Competition bout", "Technique clip", "Other"],
  athletics: ["Race clip", "Start", "Finish", "PB attempt", "Relay", "Technique clip", "Training clip", "Other"],
  swimming: ["Race clip", "Start", "Finish", "PB attempt", "Relay", "Technique clip", "Training clip", "Other"],
  tennis: ["Winner", "Serve", "Rally", "Volley", "Return", "Match point", "Technique clip", "Other"],
  hockey: ["Goal", "Assist", "Save", "Tackle", "Interception", "Penalty corner", "Full game clip", "Other"],
  golf: ["Drive", "Approach", "Short game", "Putting", "Tournament round", "Technique clip", "Other"],
  baseball: ["Hit", "Home run", "Pitching", "Catch", "Throw", "Fielding play", "Full game clip", "Other"],
  softball: ["Hit", "Home run", "Pitching", "Catch", "Throw", "Fielding play", "Full game clip", "Other"],
  volleyball: ["Kill", "Block", "Serve", "Dig", "Set", "Defensive save", "Full game clip", "Other"],
  rowing: ["Race clip", "Start", "Finish", "Technique clip", "Training clip", "Other"],
  "surf life saving": ["Race clip", "Start", "Finish", "Board leg", "Ski leg", "Swim leg", "Technique clip", "Other"],
  other: ["Race clip", "Technique clip", "Training clip", "Competition clip", "Full game clip", "Other"],
};

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePostcode(value) {
  return String(value || "").trim();
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function isTeamSport(sport) {
  return TEAM_SPORTS.has(normalizeText(sport));
}

function getStarterAgeGroupsForSport(sport) {
  return isTeamSport(sport)
    ? [...TEAM_SPORT_JUNIOR_AGE_GROUPS, ...TEAM_SPORT_SENIOR_AGE_GROUPS]
    : [...INDIVIDUAL_SPORT_AGE_GROUPS];
}

function makeClub({
  id,
  postcode = "",
  suburb = "",
  areaLabel = "",
  nearbySuburbs = [],
  state = "NSW",
  sport = "Rugby League",
  clubName,
  shortName = "",
  groupOrAssociation = "",
  region = "",
  competitionLevelOptions,
  ageGroupsSupported,
  seniorGradesSupported,
  genderPathwaysSupported = ["Boys", "Girls", "Women", "Men"],
  positionOptions,
  verifiedStatus = "starter_seed",
  sourceNote = DEFAULT_SOURCE_NOTE,
}) {
  const resolvedCompetitionLevels =
    competitionLevelOptions || ["Junior", "Local Club", "Regional", "Representative", "Open"];
  const resolvedAgeGroups = ageGroupsSupported || getStarterAgeGroupsForSport(sport);
  const resolvedSeniorGrades = seniorGradesSupported || [];
  const resolvedPositionOptions = positionOptions || getPositionsForSport(sport);

  return {
    id,
    postcode,
    suburb,
    area_label: areaLabel,
    areaLabel,
    area: areaLabel,
    nearby_suburbs: nearbySuburbs,
    nearbySuburbs,
    state,
    sport,
    club_name: clubName,
    clubName,
    short_name: shortName,
    shortName,
    group_or_association: groupOrAssociation,
    groupOrAssociation,
    region: region || groupOrAssociation,
    competition_level_options: resolvedCompetitionLevels,
    competitionLevelOptions: resolvedCompetitionLevels,
    age_groups_supported: resolvedAgeGroups,
    ageGroupsSupported: resolvedAgeGroups,
    senior_grades_supported: resolvedSeniorGrades,
    seniorGradesSupported: resolvedSeniorGrades,
    gender_pathways_supported: genderPathwaysSupported,
    genderPathwaysSupported,
    position_options: resolvedPositionOptions,
    positionOptions: resolvedPositionOptions,
    verified_status: verifiedStatus,
    verifiedStatus,
    source_note: sourceNote,
    sourceNote,
  };
}

function makeGraftonStarterClub({
  id,
  sport,
  clubName,
  shortName,
  groupOrAssociation,
  competitionLevelOptions,
  positionOptions,
  verifiedStatus = "starter_seed_needs_verification",
}) {
  return makeClub({
    id,
    sport,
    clubName,
    shortName,
    suburb: "Grafton",
    postcode: "2460",
    nearbySuburbs: DEFAULT_2460_NEARBY_SUBURBS,
    areaLabel: DEFAULT_2460_AREA,
    region: "Clarence Valley",
    groupOrAssociation,
    competitionLevelOptions,
    positionOptions,
    verifiedStatus,
    sourceNote:
      verifiedStatus === "starter_seed" ? DEFAULT_SOURCE_NOTE : NEEDS_VERIFICATION_SOURCE_NOTE,
  });
}

// Starter postcode sports directory only - not a complete official Australian sports database.
export const australianSportsClubDirectory = [
  makeClub({
    id: "club-rugby-league-south-grafton-rebels",
    clubName: "South Grafton Rebels",
    shortName: "Rebels",
    suburb: "South Grafton",
    postcode: "2460",
    nearbySuburbs: DEFAULT_2460_NEARBY_SUBURBS,
    areaLabel: DEFAULT_2460_AREA,
    groupOrAssociation: "Group 2",
    competitionLevelOptions: ["Junior", "Group 2", "Reserve Grade", "First Grade"],
    genderPathwaysSupported: ["Boys tackle", "Girls League Tag", "Women's Tackle", "Men"],
    verifiedStatus: "starter_seed",
  }),
  makeClub({
    id: "club-rugby-league-grafton-ghosts",
    clubName: "Grafton Ghosts",
    shortName: "Ghosts",
    suburb: "Grafton",
    postcode: "2460",
    nearbySuburbs: DEFAULT_2460_NEARBY_SUBURBS,
    areaLabel: DEFAULT_2460_AREA,
    groupOrAssociation: "Group 2",
    competitionLevelOptions: ["Junior", "Group 2", "Reserve Grade", "First Grade"],
    genderPathwaysSupported: ["Boys tackle", "Girls League Tag", "Women's Tackle", "Men"],
    verifiedStatus: "starter_seed",
  }),
  makeGraftonStarterClub({
    id: "club-netball-grafton-pathway-verify",
    sport: "Netball",
    clubName: "Grafton Netball pathway - verify",
    shortName: "Grafton Netball",
    groupOrAssociation: "Clarence Valley netball pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "Representative"],
  }),
  makeGraftonStarterClub({
    id: "club-soccer-clarence-valley-pathway-verify",
    sport: "Soccer",
    clubName: "Clarence Valley Soccer pathway - verify",
    shortName: "Clarence Valley Soccer",
    groupOrAssociation: "Clarence Valley soccer pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "Representative"],
  }),
  makeGraftonStarterClub({
    id: "club-basketball-grafton-pathway-verify",
    sport: "Basketball",
    clubName: "Grafton Basketball pathway - verify",
    shortName: "Grafton Basketball",
    groupOrAssociation: "Clarence Valley basketball pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "Representative"],
  }),
  makeGraftonStarterClub({
    id: "club-cricket-clarence-valley-pathway-verify",
    sport: "Cricket",
    clubName: "Clarence Valley Cricket pathway - verify",
    shortName: "Clarence Valley Cricket",
    groupOrAssociation: "Clarence Valley cricket pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "First Grade"],
  }),
  makeGraftonStarterClub({
    id: "club-rugby-union-grafton-pathway-verify",
    sport: "Rugby Union",
    clubName: "Grafton Rugby Union pathway - verify",
    shortName: "Grafton Rugby",
    groupOrAssociation: "Clarence Valley rugby union pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "First Grade"],
  }),
  makeGraftonStarterClub({
    id: "club-touch-football-grafton-pathway-verify",
    sport: "Touch Football",
    clubName: "Grafton Touch Football pathway - verify",
    shortName: "Grafton Touch",
    groupOrAssociation: "Clarence Valley touch football pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "Representative"],
  }),
  makeGraftonStarterClub({
    id: "club-oztag-grafton-pathway-verify",
    sport: "Oztag",
    clubName: "Grafton Oztag pathway - verify",
    shortName: "Grafton Oztag",
    groupOrAssociation: "Clarence Valley Oztag pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "Representative"],
  }),
  makeGraftonStarterClub({
    id: "club-athletics-grafton-pathway-verify",
    sport: "Athletics",
    clubName: "Grafton Athletics pathway - verify",
    shortName: "Grafton Athletics",
    groupOrAssociation: "Clarence Valley athletics pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "Representative"],
  }),
  makeGraftonStarterClub({
    id: "club-swimming-grafton-pathway-verify",
    sport: "Swimming",
    clubName: "Grafton Swimming pathway - verify",
    shortName: "Grafton Swimming",
    groupOrAssociation: "Clarence Valley swimming pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "Representative"],
  }),
  makeGraftonStarterClub({
    id: "club-boxing-grafton-pathway-verify",
    sport: "Boxing",
    clubName: "Grafton Boxing pathway - verify",
    shortName: "Grafton Boxing",
    groupOrAssociation: "Clarence Valley boxing / combat sports pathway - verify",
    competitionLevelOptions: ["Junior", "Open"],
  }),
  makeGraftonStarterClub({
    id: "club-martial-arts-grafton-pathway-verify",
    sport: "Martial Arts",
    clubName: "Grafton Martial Arts pathway - verify",
    shortName: "Grafton Martial Arts",
    groupOrAssociation: "Clarence Valley combat sports pathway - verify",
    competitionLevelOptions: ["Junior", "Open"],
  }),
  makeGraftonStarterClub({
    id: "club-afl-clarence-valley-pathway-verify",
    sport: "AFL",
    clubName: "Clarence Valley AFL pathway - verify",
    shortName: "Clarence Valley AFL",
    groupOrAssociation: "Clarence Valley AFL pathway - verify",
  }),
  makeGraftonStarterClub({
    id: "club-tennis-grafton-pathway-verify",
    sport: "Tennis",
    clubName: "Grafton Tennis pathway - verify",
    shortName: "Grafton Tennis",
    groupOrAssociation: "Clarence Valley tennis pathway - verify",
  }),
  makeGraftonStarterClub({
    id: "club-hockey-grafton-pathway-verify",
    sport: "Hockey",
    clubName: "Grafton Hockey pathway - verify",
    shortName: "Grafton Hockey",
    groupOrAssociation: "Clarence Valley hockey pathway - verify",
  }),
  makeGraftonStarterClub({
    id: "club-golf-grafton-pathway-verify",
    sport: "Golf",
    clubName: "Grafton Golf pathway - verify",
    shortName: "Grafton Golf",
    groupOrAssociation: "Clarence Valley golf pathway - verify",
  }),
  makeGraftonStarterClub({
    id: "club-baseball-clarence-valley-pathway-verify",
    sport: "Baseball",
    clubName: "Clarence Valley Baseball pathway - verify",
    shortName: "Clarence Valley Baseball",
    groupOrAssociation: "Clarence Valley baseball pathway - verify",
  }),
  makeGraftonStarterClub({
    id: "club-softball-clarence-valley-pathway-verify",
    sport: "Softball",
    clubName: "Clarence Valley Softball pathway - verify",
    shortName: "Clarence Valley Softball",
    groupOrAssociation: "Clarence Valley softball pathway - verify",
  }),
  makeGraftonStarterClub({
    id: "club-volleyball-grafton-pathway-verify",
    sport: "Volleyball",
    clubName: "Grafton Volleyball pathway - verify",
    shortName: "Grafton Volleyball",
    groupOrAssociation: "Clarence Valley volleyball pathway - verify",
  }),
  makeGraftonStarterClub({
    id: "club-rowing-clarence-valley-pathway-verify",
    sport: "Rowing",
    clubName: "Clarence Valley Rowing pathway - verify",
    shortName: "Clarence Valley Rowing",
    groupOrAssociation: "Clarence Valley rowing pathway - verify",
  }),
  makeGraftonStarterClub({
    id: "club-surf-life-saving-clarence-valley-pathway-verify",
    sport: "Surf Life Saving",
    clubName: "Clarence Valley Surf Life Saving pathway - verify",
    shortName: "Clarence Valley SLS",
    groupOrAssociation: "Clarence Valley surf life saving pathway - verify",
  }),
  makeClub({
    id: "club-rugby-league-coffs-harbour-comets",
    clubName: "Coffs Harbour Comets",
    shortName: "Comets",
    suburb: "Coffs Harbour",
    postcode: "2450",
    groupOrAssociation: "Group 2",
  }),
  makeClub({
    id: "club-rugby-league-sawtell-panthers",
    clubName: "Sawtell Panthers",
    shortName: "Panthers",
    suburb: "Sawtell",
    postcode: "2452",
    groupOrAssociation: "Group 2",
  }),
  makeClub({
    id: "club-rugby-league-woolgoolga-seahorses",
    clubName: "Woolgoolga Seahorses",
    shortName: "Seahorses",
    suburb: "Woolgoolga",
    postcode: "2456",
    groupOrAssociation: "Group 2",
  }),
  makeClub({
    id: "club-rugby-league-nambucca-heads-roosters",
    clubName: "Nambucca Heads Roosters",
    shortName: "Roosters",
    suburb: "Nambucca Heads",
    postcode: "2448",
    groupOrAssociation: "Group 2",
  }),
  makeClub({
    id: "club-rugby-league-macksville-sea-eagles",
    clubName: "Macksville Sea Eagles",
    shortName: "Sea Eagles",
    suburb: "Macksville",
    postcode: "2447",
    groupOrAssociation: "Group 2",
  }),
  makeClub({
    id: "club-rugby-league-bowraville-tigers",
    clubName: "Bowraville Tigers",
    shortName: "Tigers",
    suburb: "Bowraville",
    postcode: "2449",
    groupOrAssociation: "Group 2",
  }),
  makeClub({
    id: "club-rugby-league-kempsey-dragons",
    clubName: "Kempsey Dragons",
    shortName: "Dragons",
    suburb: "Kempsey",
    postcode: "2440",
    groupOrAssociation: "Group 2",
  }),
  makeClub({
    id: "club-rugby-league-smithtown-tigers",
    clubName: "Smithtown Tigers",
    shortName: "Tigers",
    suburb: "Smithtown",
    postcode: "2440",
    groupOrAssociation: "Group 2",
  }),
];

function filterClubsBySport(clubs, sport) {
  const normalizedSport = normalizeText(sport);
  if (!normalizedSport || normalizedSport === "all") {
    return clubs;
  }

  return clubs.filter((club) => normalizeText(club.sport) === normalizedSport);
}

export function getMainSportsList() {
  return [...MAIN_AUSTRALIAN_SPORTS_LIST];
}

export function getSportsList() {
  return getMainSportsList();
}

export function searchClubsByPostcode(postcode) {
  const normalizedPostcode = normalizePostcode(postcode);
  if (!normalizedPostcode) {
    return [];
  }

  return australianSportsClubDirectory.filter((club) => normalizePostcode(club.postcode) === normalizedPostcode);
}

export function getClubsByPostcode(postcode) {
  return searchClubsByPostcode(postcode);
}

export function searchClubsBySuburb(suburb) {
  const normalizedSuburb = normalizeText(suburb);
  if (!normalizedSuburb) {
    return [];
  }

  return australianSportsClubDirectory.filter((club) => {
    const nearbySuburbs = club.nearbySuburbs || club.nearby_suburbs || [];
    return [club.suburb, club.areaLabel, club.area_label, club.area, ...nearbySuburbs].some((value) =>
      normalizeText(value).includes(normalizedSuburb),
    );
  });
}

export function getClubsBySportAndState(sport, state) {
  const normalizedSport = normalizeText(sport);
  const normalizedState = normalizeText(state);

  return australianSportsClubDirectory.filter((club) => {
    const sportMatches = !normalizedSport || normalizeText(club.sport) === normalizedSport;
    const stateMatches = !normalizedState || normalizeText(club.state) === normalizedState;
    return sportMatches && stateMatches;
  });
}

export function getNearbyClubSuggestions({ sport, postcode, suburb, state } = {}) {
  const normalizedSport = normalizeText(sport);
  const normalizedState = normalizeText(state);
  const exactMatches = [
    ...searchClubsByPostcode(postcode),
    ...searchClubsBySuburb(suburb),
  ].filter((club, index, list) => list.findIndex((item) => item.id === club.id) === index);

  const filteredExactMatches = exactMatches.filter((club) => {
    const sportMatches = !normalizedSport || normalizeText(club.sport) === normalizedSport;
    const stateMatches = !normalizedState || normalizeText(club.state) === normalizedState;
    return sportMatches && stateMatches;
  });

  if (filteredExactMatches.length > 0) {
    return filteredExactMatches;
  }

  return getClubsBySportAndState(sport, state);
}

export function getDirectoryAreaByPostcode(postcode) {
  const clubs = searchClubsByPostcode(postcode);
  return clubs.find((club) => club.areaLabel || club.area_label || club.area)?.areaLabel || "";
}

export function getSportsByPostcode(postcode) {
  return uniqueValues(searchClubsByPostcode(postcode).map((club) => club.sport));
}

export function getSuburbsByPostcode(postcode) {
  return uniqueValues(
    searchClubsByPostcode(postcode).flatMap((club) => [
      club.suburb,
      club.areaLabel || club.area_label || club.area,
      ...(club.nearbySuburbs || club.nearby_suburbs || []),
    ]),
  );
}

export function getClubSuggestionsByPostcode({ postcode, sport } = {}) {
  return filterClubsBySport(searchClubsByPostcode(postcode), sport);
}

export function getClubSuggestionsBySuburb({ suburb, sport } = {}) {
  return filterClubsBySport(searchClubsBySuburb(suburb), sport);
}

export function getNearbySportsDirectory({ postcode, suburb, state } = {}) {
  const normalizedState = normalizeText(state);
  const postcodeMatches = searchClubsByPostcode(postcode);
  const suburbMatches = searchClubsBySuburb(suburb);
  const clubs = [...postcodeMatches, ...suburbMatches]
    .filter((club, index, list) => list.findIndex((item) => item.id === club.id) === index)
    .filter((club) => !normalizedState || normalizeText(club.state) === normalizedState);
  const sports = uniqueValues(clubs.map((club) => club.sport));
  const suburbs = uniqueValues(
    clubs.flatMap((club) => [
      club.suburb,
      ...(club.nearbySuburbs || club.nearby_suburbs || []),
    ]),
  );
  const areaLabel =
    clubs.find((club) => club.areaLabel || club.area_label || club.area)?.areaLabel ||
    clubs.find((club) => club.area_label)?.area_label ||
    clubs.find((club) => club.area)?.area ||
    suburbs.slice(0, 3).join(" / ");

  return {
    areaLabel,
    clubs,
    sports,
    suburbs,
    hasExactPostcode: postcodeMatches.length > 0,
  };
}

export function getClubByName(name) {
  const normalizedName = normalizeText(name);
  if (!normalizedName) {
    return null;
  }

  return (
    australianSportsClubDirectory.find(
      (club) =>
        normalizeText(club.clubName) === normalizedName ||
        normalizeText(club.club_name) === normalizedName ||
        normalizeText(club.shortName) === normalizedName ||
        normalizeText(club.short_name) === normalizedName,
    ) || null
  );
}

export function getAgeGroupsForSport(sport) {
  return getStarterAgeGroupsForSport(sport || "Other");
}

export function getAgeGroupsForClub(club) {
  if (!club) {
    return getAgeGroupsForSport("Rugby League");
  }

  return uniqueValues([
    ...(club.ageGroupsSupported || club.age_groups_supported || []),
    ...(club.seniorGradesSupported || club.senior_grades_supported || []),
  ]);
}

export function getAgeGroupsForSportClub({ sport, club } = {}) {
  const directoryClub = typeof club === "string" ? getClubByName(club) : club;
  if (directoryClub) {
    return getAgeGroupsForClub(directoryClub);
  }

  return getAgeGroupsForSport(sport);
}

export function getPositionsForSport(sport) {
  return POSITION_OPTIONS_BY_SPORT[normalizeText(sport)] || POSITION_OPTIONS_BY_SPORT.other;
}

export function getHighlightTypesForSport(sport) {
  return HIGHLIGHT_TYPES_BY_SPORT[normalizeText(sport)] || HIGHLIGHT_TYPES_BY_SPORT.other;
}

export function normaliseClubName(name) {
  const matchedClub = getClubByName(name);
  if (matchedClub) {
    return matchedClub.clubName || matchedClub.club_name;
  }

  return String(name || "")
    .trim()
    .replace(/\s+/g, " ");
}
