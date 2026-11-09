/**
 * Atmosphere Weather Explorer - API Service
 * Handles Open-Meteo Geocoding, Forecast Retrieval,
 * Resilient Fallback Architecture, and Reverse Geocoding.
 * Developer: Sameera Bhanu (SVECW)
 */

const BASE_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const BASE_GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const CORS_PROXY_URL = 'https://api.allorigins.win/raw?url=';
const BACKUP_PROXY_URL = 'https://corsproxy.io/?url=';

let activeSearchAbort = null;

/**
 * Resilient fetch wrapper with timeout and automatic proxy failover
 */
async function fetchWithFallback(url, timeoutMs = 3500) {
  // Strategy 1: Attempt direct API call
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    // Direct call failed or timed out (e.g. ISP Hetzner route restriction)
    console.info('Direct API request failed, engaging resilient proxy pipeline...', err.message);
  }

  // Strategy 2: Primary CORS proxy (Cloudflare edge)
  try {
    const proxyUrl = `${CORS_PROXY_URL}${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, {
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Primary proxy failed, engaging secondary fallback proxy...', err.message);
  }

  // Strategy 3: Secondary CORS proxy
  const backupUrl = `${BACKUP_PROXY_URL}${encodeURIComponent(url)}`;
  const backupResponse = await fetch(backupUrl, {
    headers: { 'Accept': 'application/json' }
  });
  if (!backupResponse.ok) {
    throw new Error(`Weather service responded with status ${backupResponse.status}`);
  }
  return await backupResponse.json();
}

export const WeatherApi = {
  /**
   * Search matching cities worldwide by name using Open-Meteo Geocoding API
   */
  async searchCities(query, limit = 6) {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return [];

    // Cancel any prior in-flight search request
    if (activeSearchAbort) {
      activeSearchAbort.abort();
    }
    activeSearchAbort = new AbortController();

    const url = `${BASE_GEO_URL}?name=${encodeURIComponent(trimmed)}&count=${limit}&language=en&format=json`;

    try {
      const response = await fetch(url, {
        signal: activeSearchAbort.signal,
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed with status: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.results) return [];

      return data.results.map(item => ({
        id: item.id,
        name: item.name,
        country: item.country || '',
        country_code: item.country_code || '',
        admin1: item.admin1 || '',
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone || 'auto'
      }));
    } catch (err) {
      if (err.name === 'AbortError') {
        return []; // Normal debounce cancellation
      }
      // If direct geocoding is blocked, try through fallback proxy
      try {
        const fallbackData = await fetchWithFallback(url, 3000);
        if (fallbackData && fallbackData.results) {
          return fallbackData.results.map(item => ({
            id: item.id,
            name: item.name,
            country: item.country || '',
            country_code: item.country_code || '',
            admin1: item.admin1 || '',
            latitude: item.latitude,
            longitude: item.longitude,
            timezone: item.timezone || 'auto'
          }));
        }
      } catch (proxyErr) {
        console.error('All geocoding attempts failed:', proxyErr);
      }
      return [];
    }
  },

  /**
   * Fetch complete current and forecast weather data for coordinates
   */
  async getForecast(latitude, longitude, timezone = 'auto') {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Valid numeric coordinates (latitude, longitude) are required.');
    }

    const currentParams = [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'visibility',
      'uv_index'
    ].join(',');

    const hourlyParams = [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation_probability',
      'weather_code',
      'surface_pressure',
      'visibility',
      'wind_speed_10m',
      'is_day'
    ].join(',');

    const dailyParams = [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_sum',
      'precipitation_probability_max'
    ].join(',');

    const query = [
      `latitude=${latitude}`,
      `longitude=${longitude}`,
      `current=${currentParams}`,
      `hourly=${hourlyParams}`,
      `daily=${dailyParams}`,
      `timezone=${encodeURIComponent(timezone || 'auto')}`
    ].join('&');

    const url = `${BASE_FORECAST_URL}?${query}`;
    const data = await fetchWithFallback(url, 3500);

    if (!data || !data.current) {
      throw new Error('Incomplete weather payload received from Open-Meteo.');
    }

    return data;
  },

  /**
   * Reverse-geocode coordinates to identify nearest city/locality
   */
  async reverseGeocode(latitude, longitude) {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    try {
      const data = await fetchWithFallback(nominatimUrl, 3000);
      if (data && data.address) {
        const addr = data.address;
        const cityName = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Current Location';
        const country = addr.country || '';
        const admin1 = addr.state || addr.province || '';
        return {
          id: `gps-${latitude.toFixed(2)}-${longitude.toFixed(2)}`,
          name: cityName,
          country: country,
          country_code: (addr.country_code || '').toUpperCase(),
          admin1: admin1,
          latitude: latitude,
          longitude: longitude,
          timezone: 'auto'
        };
      }
    } catch (e) {
      console.warn('Reverse geocoding unavailable, using coordinates fallback:', e);
    }

    return {
      id: `gps-${latitude.toFixed(2)}-${longitude.toFixed(2)}`,
      name: 'Current Location',
      country: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
      country_code: '',
      admin1: '',
      latitude: latitude,
      longitude: longitude,
      timezone: 'auto'
    };
  }
};
