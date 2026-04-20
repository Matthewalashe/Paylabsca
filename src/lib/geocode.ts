// ============================================================
// geocode.ts — Auto-geocode addresses using multiple providers
// ============================================================
// Primary: OpenStreetMap Nominatim (free, no key)
// Fallback: Photon (Komoot) geocoder (free, no key)
// Both biased toward Lagos, Nigeria for best results.
//
// TIPS FOR BEST RESULTS:
// - Include area name: "1 Marina Road, Lagos Island"
// - Include LGA: "25 Broad Street, Ikeja, Lagos"
// - Use full address with landmarks when possible
// ============================================================

export interface GeoResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

// Lagos bounding box for better results
const LAGOS_VIEWBOX = "2.6,6.2,4.4,6.9"; // west,south,east,north
const LAGOS_CENTER = { lat: 6.5244, lon: 3.3792 };

/**
 * Normalize a Lagos address for better geocoding results.
 * Adds "Lagos, Nigeria" if missing, strips common abbreviations.
 */
function normalizeAddress(address: string): string {
  let q = address.trim();
  
  // Expand common Lagos abbreviations
  q = q.replace(/\bSt\b\.?/gi, "Street");
  q = q.replace(/\bRd\b\.?/gi, "Road");
  q = q.replace(/\bAve\b\.?/gi, "Avenue");
  q = q.replace(/\bCres\b\.?/gi, "Crescent");
  q = q.replace(/\bCl\b\.?/gi, "Close");
  q = q.replace(/\bBlvd\b\.?/gi, "Boulevard");
  q = q.replace(/\bEst\b\.?/gi, "Estate");
  
  // Append "Lagos, Nigeria" if not already present
  if (!/lagos/i.test(q)) q += ", Lagos";
  if (!/nigeria/i.test(q)) q += ", Nigeria";
  
  return q;
}

/**
 * Try geocoding with OpenStreetMap Nominatim.
 */
async function geocodeNominatim(query: string): Promise<GeoResult | null> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "3",
      countrycodes: "ng",
      viewbox: LAGOS_VIEWBOX,
      bounded: "0",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "LASBCA-Billing-System/1.0 (lasbca.gov.ng)",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    // Pick the result closest to Lagos center
    let best = data[0];
    let bestDist = Infinity;
    for (const r of data) {
      const lat = parseFloat(r.lat);
      const lon = parseFloat(r.lon);
      const dist = Math.abs(lat - LAGOS_CENTER.lat) + Math.abs(lon - LAGOS_CENTER.lon);
      if (dist < bestDist) {
        bestDist = dist;
        best = r;
      }
    }

    return {
      latitude: parseFloat(best.lat),
      longitude: parseFloat(best.lon),
      displayName: best.display_name || "",
    };
  } catch (err) {
    console.warn("[Geocode/Nominatim] Failed:", err);
    return null;
  }
}

/**
 * Try geocoding with Photon (Komoot) — free, no key, good for international addresses.
 */
async function geocodePhoton(query: string): Promise<GeoResult | null> {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: "3",
      lat: String(LAGOS_CENTER.lat),
      lon: String(LAGOS_CENTER.lon),
      lang: "en",
    });

    const response = await fetch(
      `https://photon.komoot.io/api/?${params}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data?.features || data.features.length === 0) return null;

    // Filter to Nigeria results, pick closest to Lagos
    const nigeriaResults = data.features.filter(
      (f: any) => f.properties?.country === "Nigeria"
    );
    const candidates = nigeriaResults.length > 0 ? nigeriaResults : data.features;

    let best = candidates[0];
    let bestDist = Infinity;
    for (const f of candidates) {
      const [lon, lat] = f.geometry.coordinates;
      const dist = Math.abs(lat - LAGOS_CENTER.lat) + Math.abs(lon - LAGOS_CENTER.lon);
      if (dist < bestDist) {
        bestDist = dist;
        best = f;
      }
    }

    const [lon, lat] = best.geometry.coordinates;
    return {
      latitude: lat,
      longitude: lon,
      displayName: [best.properties?.name, best.properties?.street, best.properties?.city, best.properties?.state]
        .filter(Boolean).join(", "),
    };
  } catch (err) {
    console.warn("[Geocode/Photon] Failed:", err);
    return null;
  }
}

/**
 * Geocode an address string to lat/lng coordinates.
 * Tries Nominatim first, falls back to Photon.
 * Also tries simplified query variants if full address fails.
 * Returns null if no results found.
 */
export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  if (!address || address.trim().length < 5) return null;

  const fullQuery = normalizeAddress(address);

  // Try 1: Full query with Nominatim
  let result = await geocodeNominatim(fullQuery);
  if (result) return result;

  // Try 2: Full query with Photon
  result = await geocodePhoton(fullQuery);
  if (result) return result;

  // Try 3: Simplified query — remove house numbers, keep street + area
  const simplified = address
    .replace(/^\d+[a-z]?\s*,?\s*/i, "") // strip leading house number
    .replace(/\b(?:plot|block|flat|suite|unit)\s*\d+[a-z]?\s*,?\s*/gi, "") // strip plot/block numbers
    .trim();
  
  if (simplified !== address.trim() && simplified.length >= 5) {
    const simplifiedQuery = normalizeAddress(simplified);
    result = await geocodeNominatim(simplifiedQuery);
    if (result) return result;
    result = await geocodePhoton(simplifiedQuery);
    if (result) return result;
  }

  // Try 4: Extract just area/street name keywords
  const words = address.trim().split(/[\s,]+/).filter(w => 
    w.length > 2 && !/^\d+$/.test(w) && !/^(no|plot|block|flat|suite|unit|street|road|close|avenue)$/i.test(w)
  );
  if (words.length >= 2) {
    const keywordQuery = normalizeAddress(words.slice(0, 3).join(" "));
    result = await geocodeNominatim(keywordQuery);
    if (result) return result;
  }

  return null;
}

/**
 * Debounced geocode helper.
 * Returns a function that cancels previous pending geocode calls.
 */
export function createDebouncedGeocoder(delayMs = 800) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return {
    geocode: (address: string): Promise<GeoResult | null> => {
      return new Promise((resolve) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          const result = await geocodeAddress(address);
          resolve(result);
        }, delayMs);
      });
    },
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}
