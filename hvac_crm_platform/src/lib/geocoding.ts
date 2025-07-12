/**
 * Warsaw-specific geocoding utilities for HVAC management platform
 * Provides address validation, district detection, and GPS coordinate generation
 */

export interface WarsawDistrict {
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  affluenceScore: number;
  avgQuote: number;
  center: {
    lat: number;
    lng: number;
  };
}

export interface AddressComponents {
  street?: string;
  streetNumber?: string;
  district?: string;
  zipCode?: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Warsaw districts with precise boundaries and affluence data
export const WARSAW_DISTRICTS: WarsawDistrict[] = [
  {
    name: "Śródmieście",
    bounds: { north: 52.25, south: 52.22, east: 21.04, west: 21.0 },
    affluenceScore: 0.9,
    avgQuote: 12500,
    center: { lat: 52.2297, lng: 21.0122 },
  },
  {
    name: "Wilanów",
    bounds: { north: 52.18, south: 52.16, east: 21.12, west: 21.08 },
    affluenceScore: 0.85,
    avgQuote: 11800,
    center: { lat: 52.17, lng: 21.1 },
  },
  {
    name: "Mokotów",
    bounds: { north: 52.2, south: 52.17, east: 21.05, west: 21.0 },
    affluenceScore: 0.75,
    avgQuote: 9500,
    center: { lat: 52.185, lng: 21.025 },
  },
  {
    name: "Żoliborz",
    bounds: { north: 52.29, south: 52.25, east: 21.03, west: 20.97 },
    affluenceScore: 0.7,
    avgQuote: 8800,
    center: { lat: 52.27, lng: 21.0 },
  },
  {
    name: "Ursynów",
    bounds: { north: 52.17, south: 52.13, east: 21.09, west: 21.03 },
    affluenceScore: 0.65,
    avgQuote: 8200,
    center: { lat: 52.15, lng: 21.06 },
  },
  {
    name: "Wola",
    bounds: { north: 52.25, south: 52.21, east: 21.01, west: 20.95 },
    affluenceScore: 0.6,
    avgQuote: 7500,
    center: { lat: 52.23, lng: 20.98 },
  },
  {
    name: "Praga-Południe",
    bounds: { north: 52.24, south: 52.2, east: 21.1, west: 21.04 },
    affluenceScore: 0.45,
    avgQuote: 6200,
    center: { lat: 52.22, lng: 21.07 },
  },
  {
    name: "Targówek",
    bounds: { north: 52.31, south: 52.27, east: 21.1, west: 21.03 },
    affluenceScore: 0.4,
    avgQuote: 5800,
    center: { lat: 52.29, lng: 21.065 },
  },
  {
    name: "Bemowo",
    bounds: { north: 52.27, south: 52.23, east: 20.97, west: 20.9 },
    affluenceScore: 0.55,
    avgQuote: 7000,
    center: { lat: 52.25, lng: 20.935 },
  },
  {
    name: "Bielany",
    bounds: { north: 52.3, south: 52.26, east: 20.98, west: 20.92 },
    affluenceScore: 0.6,
    avgQuote: 7300,
    center: { lat: 52.28, lng: 20.95 },
  },
];

/**
 * Extract district from address string using pattern matching
 */
export function extractDistrictFromAddress(address: string): string | undefined {
  if (!address) return undefined;

  const normalizedAddress = address.toLowerCase().trim();

  // Direct district name matching
  for (const district of WARSAW_DISTRICTS) {
    const districtName = district.name.toLowerCase();
    if (normalizedAddress.includes(districtName)) {
      return district.name;
    }
  }

  // Common street patterns for district detection
  const streetPatterns = {
    Śródmieście: ["nowy świat", "krakowskie przedmieście", "marszałkowska", "jerozolimskie"],
    Wilanów: ["wilanowska", "branickiego", "sarmacka", "klimczaka"],
    Mokotów: ["puławska", "niepodległości", "domaniewska", "woronicza"],
    Żoliborz: ["słowackiego", "mickiewicza", "krasińskiego", "wilson"],
    Ursynów: ["pileckiego", "rosoła", "stryjeńskich", "komisji edukacji"],
    Wola: ["solidarności", "leszno", "chłodna", "towarowa"],
    "Praga-Południe": ["grochowska", "saska", "francuska", "waszyngtona"],
    Targówek: ["bródnowska", "malborska", "św. wincentego", "handlowa"],
  };

  for (const [district, streets] of Object.entries(streetPatterns)) {
    if (streets.some((street) => normalizedAddress.includes(street))) {
      return district;
    }
  }

  return undefined;
}

/**
 * Parse Polish address into components
 */
export function parseWarsawAddress(address: string): AddressComponents {
  if (!address) return {};

  const components: AddressComponents = {
    city: "Warsaw",
  };

  // Extract zip code (XX-XXX format)
  const zipMatch = address.match(/(\d{2}-\d{3})/);
  if (zipMatch) {
    components.zipCode = zipMatch[1];
  }

  // Extract street and number
  const streetMatch =
    address.match(/ul\.\s*([^,\d]+)\s*(\d+[a-zA-Z]*)?/i) ||
    address.match(/([^,\d]+)\s*(\d+[a-zA-Z]*)/);
  if (streetMatch) {
    components.street = streetMatch[1].trim();
    components.streetNumber = streetMatch[2]?.trim();
  }

  // Extract district
  components.district = extractDistrictFromAddress(address);

  return components;
}

/**
 * Generate approximate GPS coordinates for Warsaw address
 * Uses district centers with small random offset for realistic positioning
 */
export function generateCoordinatesForAddress(
  address: string
): { lat: number; lng: number } | undefined {
  const components = parseWarsawAddress(address);

  if (!components.district) {
    // Default to Warsaw center if no district detected
    return {
      lat: 52.2297 + (Math.random() - 0.5) * 0.02,
      lng: 21.0122 + (Math.random() - 0.5) * 0.02,
    };
  }

  const district = WARSAW_DISTRICTS.find((d) => d.name === components.district);
  if (!district) return undefined;

  // Add small random offset within district bounds for realistic positioning
  const latOffset = (Math.random() - 0.5) * 0.01;
  const lngOffset = (Math.random() - 0.5) * 0.01;

  return {
    lat: district.center.lat + latOffset,
    lng: district.center.lng + lngOffset,
  };
}

/**
 * Validate if coordinates are within Warsaw boundaries
 */
export function isWithinWarsaw(lat: number, lng: number): boolean {
  const WARSAW_BOUNDS = {
    north: 52.37,
    south: 52.1,
    east: 21.27,
    west: 20.85,
  };

  return (
    lat >= WARSAW_BOUNDS.south &&
    lat <= WARSAW_BOUNDS.north &&
    lng >= WARSAW_BOUNDS.west &&
    lng <= WARSAW_BOUNDS.east
  );
}

/**
 * Get district from GPS coordinates
 */
export function getDistrictFromCoordinates(lat: number, lng: number): string | undefined {
  for (const district of WARSAW_DISTRICTS) {
    if (
      lat >= district.bounds.south &&
      lat <= district.bounds.north &&
      lng >= district.bounds.west &&
      lng <= district.bounds.east
    ) {
      return district.name;
    }
  }
  return undefined;
}

/**
 * Calculate distance between two points in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validate Warsaw address format
 */
export function validateWarsawAddress(address: string): {
  isValid: boolean;
  errors: string[];
  suggestions?: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];

  if (!address || address.trim().length < 5) {
    errors.push("Address is too short");
    return { isValid: false, errors };
  }

  const components = parseWarsawAddress(address);

  if (!components.district) {
    errors.push("Could not identify Warsaw district");
    suggestions.push("Please include district name or recognizable street");
  }

  if (!components.street) {
    errors.push("Street name not found");
    suggestions.push("Please include street name (e.g., 'ul. Marszałkowska')");
  }

  if (!components.zipCode) {
    suggestions.push("Consider adding zip code for better accuracy");
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}
