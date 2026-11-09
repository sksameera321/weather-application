/**
 * Atmosphere Weather Explorer - Resilient Meteorological API Service
 * Handles Open-Meteo Geocoding, Multi-Endpoint Forecast Retrieval,
 * Offline Caching, and Reverse Geocoding.
 * Developer: Sameera Bhanu (SVECW)
 */

const BASE_GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const PRIMARY_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ENSEMBLE_FORECAST_URL = 'https://ensemble-api.open-meteo.com/v1/ensemble';

let activeSearchAbort = null;

/**
 * Fetch with safe timeout control (default: 8500ms)
 */
async function fetchWithTimeout(url, timeoutMs = 8500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Normalize Open-Meteo payload ensuring required metrics exist
 */
function normalizeWeatherData(data) {
  if (!data || !data.current) return null;

  const current = data.current;
  const hourly = data.hourly || { time: [], temperature_2m: [], weather_code: [] };
  const daily = data.daily || { time: [], temperature_2m_max: [], temperature_2m_min: [], weather_code: [] };

  // 1. Visibility normalization
  if (current.visibility === undefined || current.visibility === null) {
    const code = current.weather_code || 0;
    if (code === 45 || code === 48) {
      current.visibility = 800; // Foggy
    } else if (code >= 51 && code <= 82) {
      current.visibility = 4500; // Rain / showers
    } else {
      current.visibility = 10000; // Clear
    }
  }

  // 2. UV Index normalization
  if (current.uv_index === undefined || current.uv_index === null) {
    const now = new Date();
    const hour = now.getHours();
    const isDay = current.is_day === 1;
    if (isDay && hour >= 9 && hour <= 17) {
      const peakDist = Math.abs(hour - 13);
      current.uv_index = Math.max(1, Math.round(6 - peakDist * 1.1));
    } else {
      current.uv_index = 0;
    }
  }

  // 3. Hourly normalization
  if (!hourly.is_day && hourly.time) {
    hourly.is_day = hourly.time.map(t => {
      const h = new Date(t).getHours();
      return (h >= 6 && h < 19) ? 1 : 0;
    });
  }

  if (!hourly.precipitation_probability && hourly.weather_code) {
    hourly.precipitation_probability = hourly.weather_code.map(c => 
      (c >= 51 && c <= 82) ? 65 : (c >= 1 && c <= 3 ? 20 : 5)
    );
  }

  // 4. Daily normalization
  if (!daily.uv_index_max && daily.time) {
    daily.uv_index_max = daily.time.map(() => 5);
  }

  if (!daily.precipitation_probability_max && daily.weather_code) {
    daily.precipitation_probability_max = daily.weather_code.map(c => 
      (c >= 51 && c <= 82) ? 75 : (c >= 1 && c <= 3 ? 25 : 5)
    );
  }

  return data;
}

/**
 * Generate intelligent seasonal fallback weather if completely offline
 */
function generateOfflineFallback(latitude, longitude, cityName = 'Offline Station') {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const isNorthern = latitude >= 0;
  
  // Approximate base temperature by latitude & season
  let baseTemp = 22;
  const isSummer = isNorthern ? (month >= 4 && month <= 8) : (month <= 1 || month >= 10);
  const latFactor = (90 - Math.abs(latitude)) / 90;
  baseTemp = isSummer ? (16 + 18 * latFactor) : (5 + 20 * latFactor);
  baseTemp = Math.round(baseTemp * 10) / 10;

  const currentHour = now.getHours();
  const isDay = currentHour >= 6 && currentHour < 18 ? 1 : 0;

  // Build 24-hour timeline
  const hourlyTime = [];
  const hourlyTemp = [];
  const hourlyCode = [];
  const hourlyIsDay = [];
  const hourlyPrecip = [];

  for (let i = 0; i < 36; i++) {
    const t = new Date(now.getTime() + i * 3600000);
    const h = t.getHours();
    const hIsDay = h >= 6 && h < 18 ? 1 : 0;
    const tempOffset = Math.sin((h - 8) / 24 * Math.PI * 2) * 4;
    hourlyTime.push(t.toISOString().slice(0, 16));
    hourlyTemp.push(Math.round((baseTemp + tempOffset) * 10) / 10);
    hourlyCode.push(i % 5 === 0 ? 2 : 1);
    hourlyIsDay.push(hIsDay);
    hourlyPrecip.push(i % 7 === 0 ? 20 : 5);
  }

  // Build 7-day daily forecast
  const dailyTime = [];
  const dailyMax = [];
  const dailyMin = [];
  const dailyCode = [];
  const dailySunrise = [];
  const dailySunset = [];

  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(now.getTime() + d * 86400000);
    const dateStr = dayDate.toISOString().slice(0, 10);
    dailyTime.push(dateStr);
    dailyMax.push(Math.round((baseTemp + 4 + Math.random() * 2) * 10) / 10);
    dailyMin.push(Math.round((baseTemp - 3 - Math.random() * 2) * 10) / 10);
    dailyCode.push(d === 2 ? 2 : (d === 4 ? 61 : 1));
    dailySunrise.push(`${dateStr}T06:20`);
    dailySunset.push(`${dateStr}T17:45`);
  }

  return {
    _fallback: true,
    latitude,
    longitude,
    current: {
      time: now.toISOString().slice(0, 16),
      temperature_2m: baseTemp,
      relative_humidity_2m: 58,
      apparent_temperature: Math.round((baseTemp + 1) * 10) / 10,
      is_day: isDay,
      precipitation: 0,
      weather_code: 1,
      surface_pressure: 1014,
      wind_speed_10m: 10.5,
      wind_direction_10m: 75,
      visibility: 10000,
      uv_index: isDay ? 4 : 0
    },
    hourly: {
      time: hourlyTime,
      temperature_2m: hourlyTemp,
      weather_code: hourlyCode,
      is_day: hourlyIsDay,
      precipitation_probability: hourlyPrecip
    },
    daily: {
      time: dailyTime,
      temperature_2m_max: dailyMax,
      temperature_2m_min: dailyMin,
      weather_code: dailyCode,
      sunrise: dailySunrise,
      sunset: dailySunset,
      uv_index_max: [5, 4, 5, 3, 5, 4, 4],
      precipitation_probability_max: [10, 15, 60, 20, 10, 5, 5]
    }
  };
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
        return []; // Standard debounce cancellation
      }
      console.warn('Geocoding query error:', err.message);
      return [];
    }
  },

  /**
   * Fetch complete current and forecast weather data
   * Resilient multi-endpoint architecture:
   * 1. Primary: Direct Open-Meteo standard forecast endpoint
   * 2. Secondary: Open-Meteo Ensemble ICON model endpoint (IPv6 + global CDN)
   * 3. Tertiary: LocalStorage cached station data or realistic offline model
   */
  async getForecast(latitude, longitude, timezone = 'auto', cityName = '') {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Valid numeric coordinates (latitude, longitude) are required.');
    }

    const cacheKey = `atmosphere_weather_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;

    // Prepare Endpoint A: Open-Meteo Primary Forecast API
    const standardParams = [
      `latitude=${latitude}`,
      `longitude=${longitude}`,
      'current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,visibility,uv_index',
      'hourly=temperature_2m,weather_code,is_day',
      'daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum',
      `timezone=${encodeURIComponent(timezone || 'auto')}`
    ].join('&');
    const primaryUrl = `${PRIMARY_FORECAST_URL}?${standardParams}`;

    // Prepare Endpoint B: Open-Meteo Ensemble ICON Model (Dual-Stack IPv6 + Netcup/Hetzner Edge)
    const ensembleParams = [
      `latitude=${latitude}`,
      `longitude=${longitude}`,
      'models=icon_seamless',
      'current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m',
      'hourly=temperature_2m,weather_code',
      'daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
      `timezone=${encodeURIComponent(timezone || 'auto')}`
    ].join('&');
    const ensembleUrl = `${ENSEMBLE_FORECAST_URL}?${ensembleParams}`;

    // Race both endpoints concurrently: whichever responds fastest wins!
    const fetchEndpoint = async (url, label) => {
      const res = await fetchWithTimeout(url, 9000);
      if (!res.ok) throw new Error(`${label} returned ${res.status}`);
      const raw = await res.json();
      const normalized = normalizeWeatherData(raw);
      if (!normalized) throw new Error(`${label} returned incomplete payload`);
      return normalized;
    };

    try {
      const fastestData = await Promise.any([
        fetchEndpoint(ensembleUrl, 'Ensemble ICON Model'),
        fetchEndpoint(primaryUrl, 'Primary Open-Meteo')
      ]);

      try { localStorage.setItem(cacheKey, JSON.stringify(fastestData)); } catch (e) {}
      return fastestData;
    } catch (networkErr) {
      console.warn('Live network endpoints failed or unavailable, checking cache:', networkErr);
    }

    // Strategy 3: LocalStorage Cache
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        console.info('Serving cached meteorological data from LocalStorage.');
        const parsed = JSON.parse(cached);
        parsed._cached = true;
        return parsed;
      }
    } catch (cacheErr) {
      console.warn('Cache lookup failed:', cacheErr);
    }

    // Strategy 4: Realistic Offline Model
    console.info('Generating offline meteorological estimation for current location.');
    return generateOfflineFallback(latitude, longitude, cityName);
  },

  /**
   * Reverse-geocode coordinates to identify nearest city/locality
   */
  async reverseGeocode(latitude, longitude) {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    try {
      const res = await fetchWithTimeout(nominatimUrl, 4500);
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const cityName = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Current Location';
          return {
            id: `gps-${latitude.toFixed(2)}-${longitude.toFixed(2)}`,
            name: cityName,
            country: addr.country || '',
            country_code: (addr.country_code || '').toUpperCase(),
            admin1: addr.state || addr.province || '',
            latitude: latitude,
            longitude: longitude,
            timezone: 'auto'
          };
        }
      }
    } catch (e) {
      console.warn('Reverse geocoding unavailable, using coordinate label:', e.message);
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
