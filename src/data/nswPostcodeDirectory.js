const DEFAULT_SPORTS = [
  "Rugby League",
  "Soccer",
  "Netball",
  "Basketball",
  "Cricket",
  "Rugby Union",
  "Touch Football",
  "Oztag",
  "AFL",
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
];

export const NSW_POSTCODE_DIRECTORY_LABEL =
  "Starter NSW postcode directory - expandable and pending verification.";

const NSW_POSTCODE_DIRECTORY = [
  {
    postcode: "2000",
    suburbs: ["Sydney", "Sydney CBD", "The Rocks", "Haymarket"],
    area_label: "Sydney CBD / Inner City",
    region_label: "Sydney Metro",
    directory_status: "covered",
    notes: "Starter metro area for Sydney city clubs and school sport pathways.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Basketball", "Cricket", "AFL", "Tennis"],
  },
  {
    postcode: "2145",
    suburbs: ["Parramatta", "Granville", "Westmead", "North Parramatta"],
    area_label: "Parramatta / Greater Western Sydney",
    region_label: "Western Sydney",
    directory_status: "covered",
    notes: "Starter western Sydney area for family-friendly club discovery.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Basketball", "Cricket", "AFL", "Touch Football"],
  },
  {
    postcode: "2200",
    suburbs: ["Canterbury", "Bankstown", "Lakemba", "Belmore"],
    area_label: "Canterbury / Bankstown",
    region_label: "South-West Sydney",
    directory_status: "starter_area",
    notes: "Starter south-west Sydney area with room to expand club and school pathways.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Basketball", "Cricket", "Touch Football"],
  },
  {
    postcode: "2250",
    suburbs: ["Gosford", "East Gosford", "West Gosford", "Wyoming"],
    area_label: "Central Coast / Gosford",
    region_label: "Central Coast",
    directory_status: "covered",
    notes: "Starter central coast club and pathway area.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Basketball", "Cricket", "AFL", "Athletics"],
  },
  {
    postcode: "2300",
    suburbs: ["Newcastle", "The Hill", "Hamilton", "Merewether"],
    area_label: "Newcastle / Hunter",
    region_label: "Hunter",
    directory_status: "covered",
    notes: "Starter Hunter region area for club and school pathways.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Basketball", "Cricket", "AFL", "Rowing"],
  },
  {
    postcode: "2320",
    suburbs: ["Maitland", "East Maitland", "Rutherford", "Thornton"],
    area_label: "Maitland / Lower Hunter",
    region_label: "Hunter",
    directory_status: "starter_area",
    notes: "Starter lower Hunter area for youth club pathways.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Basketball", "Cricket", "Rugby Union"],
  },
  {
    postcode: "2350",
    suburbs: ["Armidale", "Uralla", "Inverell"],
    area_label: "New England / Armidale",
    region_label: "New England",
    directory_status: "starter_area",
    notes: "Starter New England pathway area pending expanded club coverage.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Cricket", "AFL", "Athletics", "Swimming"],
  },
  {
    postcode: "2400",
    suburbs: ["Gunnedah", "Narrabri", "Tamworth"],
    area_label: "North West NSW",
    region_label: "North West",
    directory_status: "needs_club_data",
    notes: "Starter north west NSW area placeholder pending postcode and club verification.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Cricket", "AFL", "Boxing"],
  },
  {
    postcode: "2440",
    suburbs: ["Kempsey", "Smithtown", "Frederickton", "South Kempsey"],
    area_label: "Kempsey / Macleay Valley",
    region_label: "North Coast",
    directory_status: "covered",
    notes: "Starter North Coast area with rugby league and local pathway seed clubs.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Cricket", "Touch Football", "Athletics"],
  },
  {
    postcode: "2460",
    suburbs: ["Grafton", "South Grafton", "Junction Hill", "Clarenza", "Waterview Heights", "Clarence Valley"],
    area_label: "Grafton / South Grafton / Clarence Valley",
    region_label: "Clarence Valley",
    directory_status: "starter_area",
    notes: "Pilot postcode area for Clarence Valley junior football and local club discovery.",
    suggested_sports: DEFAULT_SPORTS,
  },
  {
    postcode: "2480",
    suburbs: ["Lismore", "Goonellabah", "Bangalow", "Alstonville"],
    area_label: "Northern Rivers / Lismore",
    region_label: "Northern Rivers",
    directory_status: "starter_area",
    notes: "Starter Northern Rivers area for multi-sport club discovery.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Basketball", "Cricket", "AFL", "Touch Football"],
  },
  {
    postcode: "2500",
    suburbs: ["Wollongong", "North Wollongong", "Coniston", "Fairy Meadow"],
    area_label: "Wollongong / Illawarra",
    region_label: "Illawarra",
    directory_status: "covered",
    notes: "Starter Illawarra area for club and school pathways.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Basketball", "Cricket", "Rugby Union", "AFL"],
  },
  {
    postcode: "2526",
    suburbs: ["Shellharbour", "Albion Park", "Oak Flats", "Warilla"],
    area_label: "Shellharbour / South Coast",
    region_label: "South Coast",
    directory_status: "starter_area",
    notes: "Starter South Coast area placeholder pending club verification.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Cricket", "Touch Football", "AFL"],
  },
  {
    postcode: "2570",
    suburbs: ["Moss Vale", "Bowral", "Mittagong", "Berrima"],
    area_label: "Southern Highlands",
    region_label: "Southern Highlands",
    directory_status: "starter_area",
    notes: "Starter Southern Highlands area placeholder pending club verification.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Cricket", "Rugby Union", "Tennis"],
  },
  {
    postcode: "2650",
    suburbs: ["Wagga Wagga", "Turvey Park", "Lake Albert", "Kooringal"],
    area_label: "Wagga Wagga / Riverina",
    region_label: "Riverina",
    directory_status: "covered",
    notes: "Starter Riverina area for club, school, and pathway discovery.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Cricket", "AFL", "Basketball", "Athletics"],
  },
  {
    postcode: "2800",
    suburbs: ["Orange", "Bletchington", "Calare", "West Orange"],
    area_label: "Orange / Central West",
    region_label: "Central West",
    directory_status: "covered",
    notes: "Starter Central West area for club and school pathways.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Cricket", "AFL", "Swimming", "Athletics"],
  },
  {
    postcode: "2820",
    suburbs: ["Dubbo", "East Dubbo", "West Dubbo", "Brocklehurst"],
    area_label: "Dubbo / Central West",
    region_label: "Central West",
    directory_status: "starter_area",
    notes: "Starter Dubbo area placeholder pending club verification.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Cricket", "Basketball", "AFL"],
  },
  {
    postcode: "2830",
    suburbs: ["Broken Hill", "South Broken Hill"],
    area_label: "Broken Hill / Far West",
    region_label: "Far West",
    directory_status: "starter_area",
    notes: "Starter Far West area placeholder pending club verification.",
    suggested_sports: ["Rugby League", "Soccer", "Netball", "Cricket", "Boxing", "Athletics"],
  },
];

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizePostcode(value) {
  return String(value || "").trim();
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildFallbackEntry(postcode) {
  const normalizedPostcode = normalizePostcode(postcode);
  if (!normalizedPostcode) {
    return null;
  }

  const numericPostcode = Number.parseInt(normalizedPostcode, 10);
  let areaLabel = `NSW postcode ${normalizedPostcode}`;
  let regionLabel = "NSW starter area";

  if (!Number.isNaN(numericPostcode)) {
    if (numericPostcode >= 2000 && numericPostcode <= 2099) {
      areaLabel = "Sydney CBD / Inner City";
      regionLabel = "Sydney Metro";
    } else if (numericPostcode >= 2100 && numericPostcode <= 2199) {
      areaLabel = "Northern Sydney";
      regionLabel = "Sydney Metro";
    } else if (numericPostcode >= 2200 && numericPostcode <= 2299) {
      areaLabel = "South-West Sydney";
      regionLabel = "Sydney Metro";
    } else if (numericPostcode >= 2300 && numericPostcode <= 2399) {
      areaLabel = "Hunter / North Coast";
      regionLabel = "Regional NSW";
    } else if (numericPostcode >= 2400 && numericPostcode <= 2499) {
      areaLabel = "North Coast / Clarence Valley";
      regionLabel = "Regional NSW";
    } else if (numericPostcode >= 2500 && numericPostcode <= 2599) {
      areaLabel = "Illawarra / South Coast";
      regionLabel = "Regional NSW";
    } else if (numericPostcode >= 2600 && numericPostcode <= 2699) {
      areaLabel = "Border / Tablelands NSW";
      regionLabel = "Border region";
    } else if (numericPostcode >= 2700 && numericPostcode <= 2799) {
      areaLabel = "Riverina / Southern NSW";
      regionLabel = "Regional NSW";
    } else if (numericPostcode >= 2800 && numericPostcode <= 2899) {
      areaLabel = "Central West / Far West";
      regionLabel = "Regional NSW";
    } else if (numericPostcode >= 2900 && numericPostcode <= 2999) {
      areaLabel = "Border / Canberra fringe";
      regionLabel = "Border region";
    }
  }

  return {
    postcode: normalizedPostcode,
    suburbs: [areaLabel],
    area_label: areaLabel,
    region_label: regionLabel,
    directory_status: "needs_club_data",
    notes: "Starter postcode entry - add clubs manually when local data is not yet saved.",
    suggested_sports: [...DEFAULT_SPORTS],
    source_note: "Starter postcode directory fallback placeholder pending expanded verification.",
  };
}

export function searchNswPostcodes(query) {
  const normalizedQuery = normalizeText(query);
  const numericQuery = normalizePostcode(query);
  if (!normalizedQuery && !numericQuery) {
    return [...NSW_POSTCODE_DIRECTORY];
  }

  const matches = NSW_POSTCODE_DIRECTORY.filter((entry) => {
    const searchBlob = [
      entry.postcode,
      entry.area_label,
      entry.region_label,
      entry.notes,
      ...(entry.suburbs || []),
      ...(entry.suggested_sports || []),
    ]
      .join(" ")
      .toLowerCase();

    return (
      (numericQuery && entry.postcode === numericQuery) ||
      (normalizedQuery && searchBlob.includes(normalizedQuery))
    );
  });

  if (matches.length > 0) {
    return matches;
  }

  const fallback = buildFallbackEntry(numericQuery || normalizedQuery);
  return fallback ? [fallback] : [];
}

export function getNswPostcodeDirectoryEntry(postcode) {
  const normalizedPostcode = normalizePostcode(postcode);
  if (!normalizedPostcode) {
    return null;
  }

  return searchNswPostcodes(normalizedPostcode)[0] || buildFallbackEntry(normalizedPostcode);
}

export function getNswPostcodeAreaLabel(postcode) {
  return getNswPostcodeDirectoryEntry(postcode)?.area_label || "";
}

export function getNswPostcodeSportsByPostcode(postcode) {
  const entry = getNswPostcodeDirectoryEntry(postcode);
  return uniqueValues(entry?.suggested_sports || DEFAULT_SPORTS);
}

export function getNswPostcodeStarterSummary(postcode) {
  const entry = getNswPostcodeDirectoryEntry(postcode);
  if (!entry) {
    return null;
  }

  return {
    postcode: entry.postcode,
    areaLabel: entry.area_label,
    regionLabel: entry.region_label,
    directoryStatus: entry.directory_status,
    directoryStatusLabel:
      entry.directory_status === "covered"
        ? "Covered"
        : entry.directory_status === "starter_area"
          ? "Starter area"
          : "Needs club data",
    notes: entry.notes,
    suburbs: entry.suburbs || [],
    suggestedSports: entry.suggested_sports || DEFAULT_SPORTS,
    sourceNote: entry.source_note || "Starter postcode directory placeholder pending verification.",
  };
}

export function getNswPostcodeDirectoryCoverageSummary() {
  const statusCounts = {
    covered: 0,
    starter_area: 0,
    needs_club_data: 0,
  };

  const byRegion = {};
  NSW_POSTCODE_DIRECTORY.forEach((entry) => {
    const status = entry.directory_status || "needs_club_data";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    const regionKey = entry.region_label || "Unspecified";
    byRegion[regionKey] = (byRegion[regionKey] || 0) + 1;
  });

  return {
    total: NSW_POSTCODE_DIRECTORY.length,
    ...statusCounts,
    byRegion,
  };
}

