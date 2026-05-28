export const NSW_RUGBY_LEAGUE_DIRECTORY_LABEL =
  "Starter NSW Rugby League directory - expandable and editable.";

export const NSW_RUGBY_LEAGUE_OTHER_REGION_VALUE = "Other NSW Rugby League";
export const NSW_RUGBY_LEAGUE_CUSTOM_CLUB_VALUE = "__custom_unverified_club__";
export const NSW_RUGBY_LEAGUE_OTHER_OPTION = "Other";

export const NSW_RUGBY_LEAGUE_JUNIOR_AGE_GROUP_OPTIONS = [
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

export const NSW_RUGBY_LEAGUE_SENIOR_AGE_GROUP_OPTIONS = [
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

export const NSW_RUGBY_LEAGUE_FILTER_AGE_GROUP_OPTIONS = [
  ...NSW_RUGBY_LEAGUE_JUNIOR_AGE_GROUP_OPTIONS,
  ...NSW_RUGBY_LEAGUE_SENIOR_AGE_GROUP_OPTIONS,
];

export const NSW_RUGBY_LEAGUE_AGE_GROUP_OPTIONS = [
  ...NSW_RUGBY_LEAGUE_FILTER_AGE_GROUP_OPTIONS,
  NSW_RUGBY_LEAGUE_OTHER_OPTION,
];

export const NSW_RUGBY_LEAGUE_POSITION_OPTIONS = [
  "Fullback",
  "Wing",
  "Centre",
  "Five-eighth",
  "Halfback",
  "Prop",
  "Hooker",
  "Second Row",
  "Lock",
  "Interchange",
  "Utility",
  "League Tag",
  NSW_RUGBY_LEAGUE_OTHER_OPTION,
];

export const NSW_RUGBY_LEAGUE_HIGHLIGHT_TYPE_OPTIONS = [
  "Try",
  "Try assist",
  "Line break",
  "Line-break assist",
  "Tackle break",
  "Offload",
  "Kick chase",
  "40/20",
  "Goal kicking",
  "Field goal",
  "Defensive read",
  "One-on-one tackle",
  "Cover tackle",
  "Kick pressure",
  "Dummy-half run",
  "Support play",
  "Catch and pass",
  "Kick return",
  "Hit-up / carry",
  "Playmaking",
  "Speed / footwork",
  "Full game clip",
  NSW_RUGBY_LEAGUE_OTHER_OPTION,
];

const COMMON_JUNIOR_AGE_GROUPS = [...NSW_RUGBY_LEAGUE_JUNIOR_AGE_GROUP_OPTIONS];
const COMMON_SENIOR_AGE_GROUPS = [...NSW_RUGBY_LEAGUE_SENIOR_AGE_GROUP_OPTIONS];

const COMPETITION_LEVEL_OPTIONS = [
  "Local Club",
  "District",
  "Regional",
  "Representative",
  "Reserve Grade",
  "First Grade",
];

function buildClub(id, name, townArea, overrides = {}) {
  return {
    id,
    name,
    townArea,
    competition: overrides.competition || "",
    competitionLevel: overrides.competitionLevel || "Regional",
    juniorAvailability:
      typeof overrides.juniorAvailability === "boolean" ? overrides.juniorAvailability : true,
    seniorAvailability:
      typeof overrides.seniorAvailability === "boolean" ? overrides.seniorAvailability : false,
    ageGroups: overrides.ageGroups || COMMON_JUNIOR_AGE_GROUPS,
    starterOnly:
      typeof overrides.starterOnly === "boolean" ? overrides.starterOnly : true,
  };
}

const NSW_RUGBY_LEAGUE_GROUPS = [
  {
    id: "group-1-northern-rivers",
    label: "Group 1 / Northern Rivers",
    townArea: "Northern Rivers",
    competition: "Group 1 Rugby League",
    competitionLevel: "Regional",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "group-2",
    label: "Group 2",
    townArea: "Mid North Coast and Clarence Valley",
    competition: "Group 2 Junior Rugby League",
    competitionLevel: "Regional",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [
      buildClub("coffs-harbour-comets", "Coffs Harbour Comets", "Coffs Harbour", {
        competition: "Group 2 Junior Rugby League",
        seniorAvailability: true,
      }),
      buildClub("grafton-ghosts", "Grafton Ghosts", "Grafton", {
        competition: "Group 2 Junior Rugby League",
        seniorAvailability: true,
      }),
      buildClub("macksville-sea-eagles", "Macksville Sea Eagles", "Macksville", {
        competition: "Group 2 Junior Rugby League",
        seniorAvailability: true,
      }),
      buildClub("nambucca-heads-roosters", "Nambucca Heads Roosters", "Nambucca Heads", {
        competition: "Group 2 Junior Rugby League",
        seniorAvailability: true,
      }),
      buildClub("sawtell-panthers", "Sawtell Panthers", "Sawtell", {
        competition: "Group 2 Junior Rugby League",
        seniorAvailability: true,
      }),
      buildClub("south-grafton-rebels", "South Grafton Rebels", "South Grafton", {
        competition: "Group 2 Junior Rugby League",
        seniorAvailability: true,
      }),
      buildClub("woolgoolga-seahorses", "Woolgoolga Seahorses", "Woolgoolga", {
        competition: "Group 2 Junior Rugby League",
        seniorAvailability: true,
      }),
      buildClub("bowraville-tigers", "Bowraville Tigers", "Bowraville", {
        competition: "Group 2 Junior Rugby League",
      }),
      buildClub("kempsey-dragons", "Kempsey Dragons", "Kempsey", {
        competition: "Group 2 Junior Rugby League",
      }),
      buildClub("smithtown-tigers", "Smithtown Tigers", "Smithtown", {
        competition: "Group 2 Junior Rugby League",
      }),
    ],
  },
  {
    id: "group-3",
    label: "Group 3",
    townArea: "Mid North Coast",
    competition: "Group 3 Rugby League",
    competitionLevel: "Regional",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "group-4",
    label: "Group 4",
    townArea: "North West NSW",
    competition: "Group 4 Rugby League",
    competitionLevel: "Regional",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "group-6-macarthur",
    label: "Group 6 / Macarthur",
    townArea: "Macarthur",
    competition: "Group 6 Rugby League",
    competitionLevel: "District",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "group-7-illawarra-south-coast",
    label: "Group 7 / Illawarra South Coast",
    townArea: "Illawarra and South Coast",
    competition: "Group 7 Rugby League",
    competitionLevel: "Regional",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "group-9",
    label: "Group 9",
    townArea: "Riverina",
    competition: "Group 9 Junior Rugby League",
    competitionLevel: "Regional",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [
      buildClub("wagga-kangaroos-juniors", "Wagga Kangaroos Juniors", "Wagga Wagga", {
        competition: "Group 9 Junior Rugby League",
        competitionLevel: "Regional",
      }),
    ],
  },
  {
    id: "group-10-western-premiership",
    label: "Group 10 / Western Premiership area",
    townArea: "Central West",
    competition: "Western Premiership",
    competitionLevel: "Regional",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "group-11-western-premiership",
    label: "Group 11 / Western Premiership area",
    townArea: "Western NSW",
    competition: "Western Premiership",
    competitionLevel: "Regional",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "group-16",
    label: "Group 16",
    townArea: "Far South Coast",
    competition: "Group 16 Rugby League",
    competitionLevel: "Regional",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "group-19",
    label: "Group 19",
    townArea: "New England",
    competition: "Group 19 Rugby League",
    competitionLevel: "Regional",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "group-20",
    label: "Group 20",
    townArea: "South West NSW",
    competition: "Group 20 Rugby League",
    competitionLevel: "Regional",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "group-21",
    label: "Group 21",
    townArea: "Upper Hunter",
    competition: "Group 21 Rugby League",
    competitionLevel: "Regional",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "central-coast",
    label: "Central Coast",
    townArea: "Central Coast",
    competition: "Central Coast Rugby League",
    competitionLevel: "District",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "newcastle-rugby-league",
    label: "Newcastle Rugby League",
    townArea: "Hunter",
    competition: "Newcastle Rugby League",
    competitionLevel: "First Grade",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: [
      ...COMMON_JUNIOR_AGE_GROUPS,
      ...COMMON_SENIOR_AGE_GROUPS,
    ],
    clubs: [
      buildClub("maitland-maroons", "Maitland Maroons", "Maitland", {
        competition: "Newcastle Rugby League",
        competitionLevel: "First Grade",
        seniorAvailability: true,
        ageGroups: [
          ...COMMON_JUNIOR_AGE_GROUPS,
          ...COMMON_SENIOR_AGE_GROUPS,
        ],
      }),
    ],
  },
  {
    id: "canberra-monaro",
    label: "Canberra Region / Monaro",
    townArea: "Canberra and Monaro",
    competition: "Canberra Region Rugby League",
    competitionLevel: "Representative",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "western-rams",
    label: "Western Rams",
    townArea: "Western NSW",
    competition: "Western Rams pathway",
    competitionLevel: "Representative",
    juniorAvailability: true,
    seniorAvailability: false,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "riverina",
    label: "Riverina",
    townArea: "Riverina",
    competition: "Riverina Rugby League pathway",
    competitionLevel: "Representative",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "north-coast",
    label: "North Coast",
    townArea: "North Coast",
    competition: "North Coast Rugby League pathway",
    competitionLevel: "Representative",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "northern-rivers",
    label: "Northern Rivers",
    townArea: "Northern Rivers",
    competition: "Northern Rivers Rugby League pathway",
    competitionLevel: "Representative",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "sydney-metro-junior-league",
    label: "Sydney Metro / Junior League",
    townArea: "Sydney Metro",
    competition: "Sydney Junior Rugby League",
    competitionLevel: "District",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: COMMON_JUNIOR_AGE_GROUPS,
    clubs: [],
    note: "Starter region only - club list expandable.",
  },
  {
    id: "other-nsw-rugby-league",
    label: NSW_RUGBY_LEAGUE_OTHER_REGION_VALUE,
    townArea: "Other NSW Rugby League pathway",
    competition: "Custom NSW Rugby League competition",
    competitionLevel: "Local Club",
    juniorAvailability: true,
    seniorAvailability: true,
    ageGroups: NSW_RUGBY_LEAGUE_AGE_GROUP_OPTIONS,
    clubs: [],
    note: "Use when the athlete's club or group needs a custom unverified entry.",
  },
];

export const nswRugbyLeagueDirectory = {
  label: NSW_RUGBY_LEAGUE_DIRECTORY_LABEL,
  state: "NSW",
  sport: "Rugby League",
  competitionLevelOptions: COMPETITION_LEVEL_OPTIONS,
  groups: NSW_RUGBY_LEAGUE_GROUPS,
};

export const nswRugbyLeagueTeamDirectorySeed = NSW_RUGBY_LEAGUE_GROUPS.flatMap((group) =>
  group.clubs.map((club) => ({
    id: `team-rugby-league-${club.id}`,
    name: club.name,
    sport: "Rugby League",
    region: group.label,
    state: "NSW",
    competition: club.competition || group.competition,
    level: club.competitionLevel || group.competitionLevel,
    townArea: club.townArea,
    juniorAvailability: club.juniorAvailability,
    seniorAvailability: club.seniorAvailability,
    ageGroups: club.ageGroups,
    starterOnly: club.starterOnly,
    directoryLabel: NSW_RUGBY_LEAGUE_DIRECTORY_LABEL,
    isVerifiedDirectoryEntry: true,
  })),
);

export function isNswRugbyLeagueSportState({ state, sport, sportId }) {
  const normalizedState = String(state || "").trim().toLowerCase();
  const normalizedSport = String(sport || "").trim().toLowerCase();
  const normalizedSportId = String(sportId || "").trim().toLowerCase();

  return (
    normalizedState === "nsw" &&
    (normalizedSport === "rugby league" || normalizedSportId === "rugby-league")
  );
}

export function getNswRugbyLeagueGroupOptions() {
  return NSW_RUGBY_LEAGUE_GROUPS.map((group) => ({
    label: group.label,
    value: group.label,
  }));
}

export function getNswRugbyLeagueGroupRecord(groupLabel) {
  return (
    NSW_RUGBY_LEAGUE_GROUPS.find((group) => group.label === groupLabel) ||
    NSW_RUGBY_LEAGUE_GROUPS.find((group) => group.label === NSW_RUGBY_LEAGUE_OTHER_REGION_VALUE) ||
    null
  );
}

export function getNswRugbyLeagueClubsByGroup(groupLabel) {
  if (!groupLabel || groupLabel === "All") {
    return NSW_RUGBY_LEAGUE_GROUPS.flatMap((group) => group.clubs);
  }
  const group = getNswRugbyLeagueGroupRecord(groupLabel);
  return Array.isArray(group?.clubs) ? group.clubs : [];
}

export function getNswRugbyLeagueCompetitionOptions(groupLabel) {
  const options =
    !groupLabel || groupLabel === "All"
      ? NSW_RUGBY_LEAGUE_GROUPS.flatMap((group) => [
          group.competition,
          ...group.clubs.map((club) => club.competition),
        ])
      : [
          getNswRugbyLeagueGroupRecord(groupLabel)?.competition,
          ...getNswRugbyLeagueClubsByGroup(groupLabel).map((club) => club.competition),
        ];

  return [...new Set(options)];
}

export function getNswRugbyLeagueCompetitionLevelOptions(groupLabel) {
  const options = [
    ...(!groupLabel || groupLabel === "All"
      ? NSW_RUGBY_LEAGUE_GROUPS.flatMap((group) => [
          group.competitionLevel,
          ...group.clubs.map((club) => club.competitionLevel),
        ])
      : [
          getNswRugbyLeagueGroupRecord(groupLabel)?.competitionLevel,
          ...getNswRugbyLeagueClubsByGroup(groupLabel).map((club) => club.competitionLevel),
        ]),
    ...COMPETITION_LEVEL_OPTIONS,
  ].filter(Boolean);

  return [...new Set(options)];
}

export function getNswRugbyLeagueDefaultCompetition(groupLabel) {
  if (!groupLabel || groupLabel === "All") {
    return "";
  }
  return getNswRugbyLeagueGroupRecord(groupLabel)?.competition || "";
}

export function getNswRugbyLeagueDefaultCompetitionLevel(groupLabel) {
  if (!groupLabel || groupLabel === "All") {
    return "";
  }
  return getNswRugbyLeagueGroupRecord(groupLabel)?.competitionLevel || "Local Club";
}
