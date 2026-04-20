// ============================================================
// geocode.ts — Auto-geocode addresses using OpenStreetMap Nominatim
// ============================================================
// Free, no API key needed. Biased toward Lagos, Nigeria.
// ============================================================

export interface GeoResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

// Lagos bounding box for better results
const LAGOS_VIEWBOX = "2.6,6.2,4.4,6.9"; // west,south,east,north

/**
 * Geocode an address string to lat/lng coordinates.
 * Uses OpenStreetMap Nominatim API with Nigeria country code bias.
 * Returns null if no results found or on error.
 */
export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  if (!address || address.trim().length < 5) return null;

  // Append "Lagos, Nigeria" if not already present for better results
  const query = /lagos|nigeria/i.test(address)
    ? address.trim()
    : `${address.trim()}, Lagos, Nigeria`;

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      countrycodes: "ng",
      viewbox: LAGOS_VIEWBOX,
      bounded: "0", // prefer but don't restrict to viewbox
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "LASBCA-Billing-System/1.0",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name || "",
    };
  } catch (err) {
    console.warn("[Geocode] Failed to geocode address:", err);
    return null;
  }
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
