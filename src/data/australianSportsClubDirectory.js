import {
  NSW_RUGBY_LEAGUE_AGE_GROUP_OPTIONS,
  NSW_RUGBY_LEAGUE_POSITION_OPTIONS,
} from "./nswRugbyLeagueDirectory";

export const AUSTRALIAN_CUSTOM_CLUB_VALUE = "__custom_unverified_club__";

export const SIMPLE_SPORTS_LIST = [
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
  "Other",
];

const DEFAULT_SOURCE_NOTE =
  "Starter seed only - not complete official database. Verify before official directory launch.";

const DEFAULT_2460_AREA = "Grafton / South Grafton / Clarence Valley";
const DEFAULT_2460_NEARBY_SUBURBS = ["Grafton", "South Grafton", "Junction Hill", "Clarenza", "Waterview Heights"];

const RUGBY_LEAGUE_JUNIOR_AGE_GROUPS = [
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

const RUGBY_LEAGUE_SENIOR_GRADES = [
  "Under 19",
  "Under 21",
  "Open",
  "Reserve Grade",
  "First Grade",
  "Ladies League Tag",
  "Girls League Tag",
  "Women's Tackle",
  "Masters",
];

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getStarterPositionOptionsForSport(sport) {
  const normalizedSport = normalizeText(sport);

  if (normalizedSport === "rugby league") {
    return NSW_RUGBY_LEAGUE_POSITION_OPTIONS;
  }

  if (normalizedSport === "netball") {
    return ["GS", "GA", "WA", "C", "WD", "GD", "GK", "Other"];
  }

  if (normalizedSport === "basketball") {
    return ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Centre", "Other"];
  }

  if (normalizedSport === "cricket") {
    return ["Batter", "Bowler", "All-rounder", "Wicketkeeper", "Captain", "Other"];
  }

  if (normalizedSport === "rugby union") {
    return ["Fullback", "Wing", "Centre", "Fly-half", "Scrum-half", "Hooker", "Lock", "Prop", "Other"];
  }

  if (normalizedSport === "soccer" || normalizedSport === "soccer / football") {
    return ["Goalkeeper", "Defender", "Midfielder", "Winger", "Striker", "Other"];
  }

  if (normalizedSport === "touch football" || normalizedSport === "oztag") {
    return ["Middle", "Link", "Wing", "Utility", "Other"];
  }

  if (normalizedSport === "athletics") {
    return ["Sprinter", "Middle Distance Runner", "Long Distance Runner", "Jumper", "Thrower", "Other"];
  }

  if (normalizedSport === "swimming") {
    return ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "IM", "Other"];
  }

  if (normalizedSport === "boxing") {
    return ["Boxer", "Other"];
  }

  return ["Athlete", "Competitor", "Player", "Other"];
}

function makeClub({
  id,
  sport = "Rugby League",
  clubName,
  shortName,
  suburb,
  postcode,
  nearbySuburbs,
  area,
  state = "NSW",
  region = "North Coast",
  groupOrAssociation = "Group 2",
  competitionLevelOptions,
  ageGroupsSupported,
  seniorGradesSupported,
  genderPathwaysSupported,
  positionOptions,
  verifiedStatus = "starter_seed",
  sourceNote = DEFAULT_SOURCE_NOTE,
}) {
  const juniorAgeGroups = ageGroupsSupported || RUGBY_LEAGUE_JUNIOR_AGE_GROUPS;
  const seniorGrades = seniorGradesSupported || RUGBY_LEAGUE_SENIOR_GRADES;
  const resolvedGenderPathways = genderPathwaysSupported || [
    "Boys tackle",
    "Girls League Tag",
    "Women's Tackle",
  ];
  const resolvedPositionOptions = positionOptions || getStarterPositionOptionsForSport(sport);
  const resolvedCompetitionLevelOptions =
    competitionLevelOptions || ["Junior", "Regional", "Reserve Grade", "First Grade"];

  return {
    id,
    sport,
    state,
    postcode,
    suburb,
    nearby_suburbs: nearbySuburbs || [],
    nearbySuburbs: nearbySuburbs || [],
    area: area || "",
    region,
    group_or_association: groupOrAssociation,
    groupOrAssociation,
    club_name: clubName,
    clubName,
    short_name: shortName,
    shortName,
    competition_level_options: resolvedCompetitionLevelOptions,
    competitionLevelOptions: resolvedCompetitionLevelOptions,
    age_groups_supported: juniorAgeGroups,
    ageGroupsSupported: juniorAgeGroups,
    senior_grades_supported: seniorGrades,
    seniorGradesSupported: seniorGrades,
    gender_pathways_supported: resolvedGenderPathways,
    genderPathwaysSupported: resolvedGenderPathways,
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
    area: DEFAULT_2460_AREA,
    region: "Clarence Valley",
    groupOrAssociation,
    competitionLevelOptions,
    positionOptions,
    verifiedStatus,
    sourceNote:
      verifiedStatus === "starter_seed"
        ? DEFAULT_SOURCE_NOTE
        : "Starter 2460 placeholder - needs local verification before official directory launch.",
  });
}

// Starter seed only - not complete official database.
export const australianSportsClubDirectory = [
  makeClub({
    id: "club-rugby-league-south-grafton-rebels",
    clubName: "South Grafton Rebels",
    shortName: "Rebels",
    suburb: "South Grafton",
    postcode: "2460",
    nearbySuburbs: DEFAULT_2460_NEARBY_SUBURBS,
    area: DEFAULT_2460_AREA,
  }),
  makeClub({
    id: "club-rugby-league-grafton-ghosts",
    clubName: "Grafton Ghosts",
    shortName: "Ghosts",
    suburb: "Grafton",
    postcode: "2460",
    nearbySuburbs: DEFAULT_2460_NEARBY_SUBURBS,
    area: DEFAULT_2460_AREA,
  }),
  makeGraftonStarterClub({
    id: "club-netball-grafton-local-verify",
    sport: "Netball",
    clubName: "Grafton local netball club - verify",
    shortName: "Grafton Netball",
    groupOrAssociation: "Clarence Valley netball pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "Representative"],
  }),
  makeGraftonStarterClub({
    id: "club-soccer-clarence-valley-verify",
    sport: "Soccer",
    clubName: "Clarence Valley soccer club - verify",
    shortName: "Clarence Valley Soccer",
    groupOrAssociation: "Clarence Valley soccer pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "Representative"],
  }),
  makeGraftonStarterClub({
    id: "club-basketball-grafton-pathway-verify",
    sport: "Basketball",
    clubName: "Grafton basketball pathway - verify",
    shortName: "Grafton Basketball",
    groupOrAssociation: "Clarence Valley basketball pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "Representative"],
  }),
  makeGraftonStarterClub({
    id: "club-cricket-clarence-valley-verify",
    sport: "Cricket",
    clubName: "Clarence Valley cricket club - verify",
    shortName: "Clarence Valley Cricket",
    groupOrAssociation: "Clarence Valley cricket pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "First Grade"],
  }),
  makeGraftonStarterClub({
    id: "club-rugby-union-grafton-verify",
    sport: "Rugby Union",
    clubName: "Grafton rugby union club - verify",
    shortName: "Grafton Rugby",
    groupOrAssociation: "Clarence Valley rugby union pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "First Grade"],
  }),
  makeGraftonStarterClub({
    id: "club-touch-football-clarence-valley-verify",
    sport: "Touch Football",
    clubName: "Clarence Valley touch football - verify",
    shortName: "Clarence Valley Touch",
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
    id: "club-boxing-grafton-combat-verify",
    sport: "Boxing",
    clubName: "Grafton boxing / combat sports - verify",
    shortName: "Grafton Combat Sports",
    groupOrAssociation: "Clarence Valley combat sports pathway - verify",
    competitionLevelOptions: ["Junior", "Open"],
  }),
  makeGraftonStarterClub({
    id: "club-athletics-clarence-valley-running-verify",
    sport: "Athletics",
    clubName: "Clarence Valley athletics / running - verify",
    shortName: "Clarence Valley Athletics",
    groupOrAssociation: "Clarence Valley athletics pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "Representative"],
  }),
  makeGraftonStarterClub({
    id: "club-swimming-grafton-verify",
    sport: "Swimming",
    clubName: "Grafton swimming club - verify",
    shortName: "Grafton Swimming",
    groupOrAssociation: "Clarence Valley swimming pathway - verify",
    competitionLevelOptions: ["Junior", "Open", "Representative"],
  }),
  makeClub({
    id: "club-rugby-league-coffs-harbour-comets",
    clubName: "Coffs Harbour Comets",
    shortName: "Comets",
    suburb: "Coffs Harbour",
    postcode: "2450",
  }),
  makeClub({
    id: "club-rugby-league-sawtell-panthers",
    clubName: "Sawtell Panthers",
    shortName: "Panthers",
    suburb: "Sawtell",
    postcode: "2452",
  }),
  makeClub({
    id: "club-rugby-league-woolgoolga-seahorses",
    clubName: "Woolgoolga Seahorses",
    shortName: "Seahorses",
    suburb: "Woolgoolga",
    postcode: "2456",
  }),
  makeClub({
    id: "club-rugby-league-nambucca-heads-roosters",
    clubName: "Nambucca Heads Roosters",
    shortName: "Roosters",
    suburb: "Nambucca Heads",
    postcode: "2448",
  }),
  makeClub({
    id: "club-rugby-league-macksville-sea-eagles",
    clubName: "Macksville Sea Eagles",
    shortName: "Sea Eagles",
    suburb: "Macksville",
    postcode: "2447",
  }),
  makeClub({
    id: "club-rugby-league-bowraville-tigers",
    clubName: "Bowraville Tigers",
    shortName: "Tigers",
    suburb: "Bowraville",
    postcode: "2449",
  }),
  makeClub({
    id: "club-rugby-league-kempsey-dragons",
    clubName: "Kempsey Dragons",
    shortName: "Dragons",
    suburb: "Kempsey",
    postcode: "2440",
  }),
  makeClub({
    id: "club-rugby-league-smithtown-tigers",
    clubName: "Smithtown Tigers",
    shortName: "Tigers",
    suburb: "Smithtown",
    postcode: "2440",
  }),
];

const POSITION_OPTIONS_BY_SPORT = {
  "rugby league": NSW_RUGBY_LEAGUE_POSITION_OPTIONS,
  "rugby union": [
    "Fullback",
    "Wing",
    "Centre",
    "Fly-half",
    "Scrum-half",
    "Hooker",
    "Lock",
    "Prop",
    "Flanker",
    "Number 8",
    "Other",
  ],
  afl: ["Midfielder", "Key Defender", "Key Forward", "Ruck", "Wing", "Utility", "Other"],
  soccer: ["Goalkeeper", "Defender", "Midfielder", "Winger", "Striker", "Other"],
  "soccer / football": ["Goalkeeper", "Defender", "Midfielder", "Winger", "Striker", "Other"],
  netball: ["GS", "GA", "WA", "C", "WD", "GD", "GK", "Other"],
  basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Centre", "Other"],
  cricket: ["Batter", "Bowler", "All-rounder", "Wicketkeeper", "Captain", "Other"],
  "touch football": ["Middle", "Link", "Wing", "Utility", "Other"],
  oztag: ["Middle", "Link", "Wing", "Utility", "Other"],
  athletics: ["Sprinter", "Middle Distance Runner", "Long Distance Runner", "Jumper", "Thrower", "Other"],
  swimming: ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "IM", "Other"],
  boxing: ["Boxer", "Other"],
  "martial arts": ["Fighter", "Sparring Athlete", "Kata Athlete", "Grappler", "Other"],
  tennis: ["Singles Player", "Doubles Player", "Other"],
  hockey: ["Goalkeeper", "Defender", "Midfielder", "Forward", "Other"],
  golf: ["Golfer", "Other"],
  other: ["Athlete", "Competitor", "Player", "Other"],
};

export function getSportsList() {
  return [...SIMPLE_SPORTS_LIST];
}

export function searchClubsByPostcode(postcode) {
  const normalizedPostcode = normalizeText(postcode);
  if (!normalizedPostcode) {
    return [];
  }

  return australianSportsClubDirectory.filter(
    (club) => normalizeText(club.postcode) === normalizedPostcode,
  );
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
    return [club.suburb, club.area, ...nearbySuburbs].some((value) =>
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

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function filterClubsBySport(clubs, sport) {
  const normalizedSport = normalizeText(sport);
  if (!normalizedSport || normalizedSport === "all") {
    return clubs;
  }

  return clubs.filter((club) => normalizeText(club.sport) === normalizedSport);
}

export function getSportsByPostcode(postcode) {
  return uniqueValues(searchClubsByPostcode(postcode).map((club) => club.sport));
}

export function getSuburbsByPostcode(postcode) {
  return uniqueValues(
    searchClubsByPostcode(postcode).flatMap((club) => [
      club.suburb,
      club.area,
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
  const areaLabel = clubs.find((club) => club.area)?.area || suburbs.slice(0, 3).join(" / ");

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
        normalizeText(club.shortName) === normalizedName,
    ) || null
  );
}

export function getAgeGroupsForClub(club) {
  if (!club) {
    return NSW_RUGBY_LEAGUE_AGE_GROUP_OPTIONS;
  }

  return [
    ...(club.ageGroupsSupported || club.age_groups_supported || []),
    ...(club.seniorGradesSupported || club.senior_grades_supported || []),
  ];
}

export function getAgeGroupsForSportClub({ sport, club } = {}) {
  const directoryClub = typeof club === "string" ? getClubByName(club) : club;
  if (directoryClub) {
    return getAgeGroupsForClub(directoryClub);
  }

  if (normalizeText(sport) === "rugby league") {
    return NSW_RUGBY_LEAGUE_AGE_GROUP_OPTIONS;
  }

  return [...RUGBY_LEAGUE_JUNIOR_AGE_GROUPS, ...RUGBY_LEAGUE_SENIOR_GRADES, "Other"];
}

export function getPositionsForSport(sport) {
  return POSITION_OPTIONS_BY_SPORT[normalizeText(sport)] || POSITION_OPTIONS_BY_SPORT.other;
}
