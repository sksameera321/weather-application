/**
 * Atmosphere Weather Explorer - Weather Presentation & Conversion Module
 * Comprehensive WMO Weather Codes, Custom SVG Vector Icons,
 * and Meteorological Metric Unit Converters.
 * Developer: Sameera Bhanu (SVECW)
 */

/**
 * WMO Weather Code Interpretations (0 - 99)
 */
export const WMO_CODES = {
  0: { description: 'Clear Sky', theme: 'clear', iconDay: 'sun', iconNight: 'moon' },
  1: { description: 'Mainly Clear', theme: 'clear', iconDay: 'sun-cloud', iconNight: 'moon-cloud' },
  2: { description: 'Partly Cloudy', theme: 'cloudy', iconDay: 'partly-cloudy-day', iconNight: 'partly-cloudy-night' },
  3: { description: 'Overcast', theme: 'overcast', iconDay: 'overcast', iconNight: 'overcast' },
  45: { description: 'Foggy', theme: 'fog', iconDay: 'fog', iconNight: 'fog' },
  48: { description: 'Depositing Rime Fog', theme: 'fog', iconDay: 'fog', iconNight: 'fog' },
  51: { description: 'Light Drizzle', theme: 'rain', iconDay: 'drizzle', iconNight: 'drizzle' },
  53: { description: 'Moderate Drizzle', theme: 'rain', iconDay: 'drizzle', iconNight: 'drizzle' },
  55: { description: 'Dense Drizzle', theme: 'rain', iconDay: 'drizzle', iconNight: 'drizzle' },
  56: { description: 'Light Freezing Drizzle', theme: 'snow', iconDay: 'snow', iconNight: 'snow' },
  57: { description: 'Dense Freezing Drizzle', theme: 'snow', iconDay: 'snow', iconNight: 'snow' },
  61: { description: 'Slight Rain', theme: 'rain', iconDay: 'rain-light', iconNight: 'rain-light' },
  63: { description: 'Moderate Rain', theme: 'rain', iconDay: 'rain', iconNight: 'rain' },
  65: { description: 'Heavy Rain', theme: 'rain', iconDay: 'rain-heavy', iconNight: 'rain-heavy' },
  66: { description: 'Light Freezing Rain', theme: 'snow', iconDay: 'rain-snow', iconNight: 'rain-snow' },
  67: { description: 'Heavy Freezing Rain', theme: 'snow', iconDay: 'rain-snow', iconNight: 'rain-snow' },
  71: { description: 'Slight Snow Fall', theme: 'snow', iconDay: 'snow', iconNight: 'snow' },
  73: { description: 'Moderate Snow Fall', theme: 'snow', iconDay: 'snow', iconNight: 'snow' },
  75: { description: 'Heavy Snow Fall', theme: 'snow', iconDay: 'snow-heavy', iconNight: 'snow-heavy' },
  77: { description: 'Snow Grains', theme: 'snow', iconDay: 'snow', iconNight: 'snow' },
  80: { description: 'Slight Rain Showers', theme: 'rain', iconDay: 'rain-showers-day', iconNight: 'rain-showers-night' },
  81: { description: 'Moderate Rain Showers', theme: 'rain', iconDay: 'rain-showers-day', iconNight: 'rain-showers-night' },
  82: { description: 'Violent Rain Showers', theme: 'rain', iconDay: 'rain-heavy', iconNight: 'rain-heavy' },
  85: { description: 'Slight Snow Showers', theme: 'snow', iconDay: 'snow', iconNight: 'snow' },
  86: { description: 'Heavy Snow Showers', theme: 'snow', iconDay: 'snow-heavy', iconNight: 'snow-heavy' },
  95: { description: 'Thunderstorm', theme: 'thunder', iconDay: 'thunderstorm', iconNight: 'thunderstorm' },
  96: { description: 'Thunderstorm with Slight Hail', theme: 'thunder', iconDay: 'thunder-hail', iconNight: 'thunder-hail' },
  99: { description: 'Thunderstorm with Heavy Hail', theme: 'thunder', iconDay: 'thunder-hail', iconNight: 'thunder-hail' }
};

/**
 * Returns weather info for any WMO code
 */
export function getWeatherInfo(code) {
  return WMO_CODES[code] || {
    description: 'Variable Weather',
    theme: 'cloudy',
    iconDay: 'partly-cloudy-day',
    iconNight: 'partly-cloudy-night'
  };
}

/**
 * Precision SVG Icons for crisp, Apple-like weather presentation
 */
export const WEATHER_ICONS = {
  sun: `
    <svg viewBox="0 0 64 64" fill="none" class="weather-icon-svg icon-sun" aria-hidden="true">
      <defs>
        <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FDB813" />
          <stop offset="100%" stop-color="#F59E0B" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="14" fill="url(#sunGrad)" filter="drop-shadow(0 2px 8px rgba(245,158,11,0.35))"/>
      <g stroke="#F59E0B" stroke-width="3" stroke-linecap="round">
        <line x1="32" y1="8" x2="32" y2="12" />
        <line x1="32" y1="52" x2="32" y2="56" />
        <line x1="8" y1="32" x2="12" y2="32" />
        <line x1="52" y1="32" x2="56" y2="32" />
        <line x1="15" y1="15" x2="18" y2="18" />
        <line x1="46" y1="46" x2="49" y2="49" />
        <line x1="15" y1="49" x2="18" y2="46" />
        <line x1="46" y1="18" x2="49" y2="15" />
      </g>
    </svg>
  `,

  moon: `
    <svg viewBox="0 0 64 64" fill="none" class="weather-icon-svg icon-moon" aria-hidden="true">
      <defs>
        <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#E2E8F0" />
          <stop offset="100%" stop-color="#94A3B8" />
        </linearGradient>
      </defs>
      <path d="M42 36C42 46.4934 33.4934 55 23 55C18.3986 55 14.1955 53.3642 10.9029 50.627C14.0734 51.5238 17.4326 52 20.8974 52C34.7077 52 45.9026 40.8051 45.9026 26.9949C45.9026 20.4704 43.4079 14.5297 39.3138 10.0911C47.0189 14.0537 52.3077 22.1009 52.3077 31.4103C52.3077 33.0033 52.1558 34.5614 51.8661 36.0716C49.0069 36.0242 45.7486 36 42 36Z" fill="url(#moonGrad)" filter="drop-shadow(0 2px 10px rgba(148,163,184,0.3))"/>
      <circle cx="48" cy="18" r="1.5" fill="#E2E8F0" opacity="0.8"/>
      <circle cx="16" cy="14" r="1" fill="#E2E8F0" opacity="0.7"/>
      <circle cx="50" cy="42" r="1" fill="#E2E8F0" opacity="0.6"/>
    </svg>
  `,

  'partly-cloudy-day': `
    <svg viewBox="0 0 64 64" fill="none" class="weather-icon-svg icon-partly-cloudy" aria-hidden="true">
      <defs>
        <radialGradient id="sunSmall" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FDB813" />
          <stop offset="100%" stop-color="#F59E0B" />
        </radialGradient>
        <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#CBD5E1" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="10" fill="url(#sunSmall)" />
      <g stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round">
        <line x1="24" y1="8" x2="24" y2="11" />
        <line x1="8" y1="24" x2="11" y2="24" />
        <line x1="12" y1="12" x2="14" y2="14" />
        <line x1="36" y1="12" x2="34" y2="14" />
      </g>
      <path d="M46 48H20C15.0294 48 11 43.9706 11 39C11 34.3592 14.5173 30.5408 19.0357 30.0531C20.6121 24.2882 25.8988 20 32.1667 20C39.5676 20 45.6667 25.7005 45.6667 32.7333C45.6667 33.1593 45.6427 33.58 45.5956 33.9942C49.1979 34.6136 51.9167 37.7423 51.9167 41.5C51.9167 45.0899 49.2684 48 46 48Z" fill="url(#cloudGrad)" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.12))"/>
    </svg>
  `,

  'partly-cloudy-night': `
    <svg viewBox="0 0 64 64" fill="none" class="weather-icon-svg" aria-hidden="true">
      <defs>
        <linearGradient id="cloudGradNight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#F1F5F9" />
          <stop offset="100%" stop-color="#94A3B8" />
        </linearGradient>
      </defs>
      <path d="M28 16C28 22.6 22.6 28 16 28C14.2 28 12.5 27.6 11 26.9C12.8 29.8 16.1 31.8 19.9 31.8C25.5 31.8 30 27.3 30 21.7C30 18.5 28.5 15.6 26.2 13.8C27.3 14.4 28 15.1 28 16Z" fill="#CBD5E1"/>
      <path d="M48 50H22C17.0294 50 13 45.9706 13 41C13 36.3592 16.5173 32.5408 21.0357 32.0531C22.6121 26.2882 27.8988 22 34.1667 22C41.5676 22 47.6667 27.7005 47.6667 34.7333C47.6667 35.1593 47.6427 35.58 47.5956 35.9942C51.1979 36.6136 53.9167 39.7423 53.9167 43.5C53.9167 47.0899 51.2684 50 48 50Z" fill="url(#cloudGradNight)" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.18))"/>
    </svg>
  `,

  overcast: `
    <svg viewBox="0 0 64 64" fill="none" class="weather-icon-svg" aria-hidden="true">
      <defs>
        <linearGradient id="cloudBack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#CBD5E1" />
          <stop offset="100%" stop-color="#94A3B8" />
        </linearGradient>
        <linearGradient id="cloudFront" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#CBD5E1" />
        </linearGradient>
      </defs>
      <path d="M38 34H18C14 34 11 31 11 27C11 23.3 13.8 20.3 17.5 20C18.8 15.4 23 12 28 12C33.9 12 38.8 16.6 38.8 22.2C41.7 22.7 44 25.2 44 28.2C44 31.4 41.3 34 38 34Z" fill="url(#cloudBack)" opacity="0.85"/>
      <path d="M48 52H20C15.0294 52 11 47.9706 11 43C11 38.3592 14.5173 34.5408 19.0357 34.0531C20.6121 28.2882 25.8988 24 32.1667 24C39.5676 24 45.6667 29.7005 45.6667 36.7333C45.6667 37.1593 45.6427 37.58 45.5956 37.9942C49.1979 38.6136 51.9167 41.7423 51.9167 45.5C51.9167 49.0899 49.2684 52 48 52Z" fill="url(#cloudFront)" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.12))"/>
    </svg>
  `,

  fog: `
    <svg viewBox="0 0 64 64" fill="none" class="weather-icon-svg" aria-hidden="true">
      <defs>
        <linearGradient id="fogCloud" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#F1F5F9" />
          <stop offset="100%" stop-color="#CBD5E1" />
        </linearGradient>
      </defs>
      <path d="M46 32H18C13.5 32 10 28.5 10 24C10 19.8 13.2 16.3 17.3 15.9C18.7 10.7 23.5 7 29.1 7C35.8 7 41.2 12.1 41.2 18.5C44.4 19.1 47 21.9 47 25.2C47 29 44.5 32 46 32Z" fill="url(#fogCloud)" opacity="0.9"/>
      <g stroke="#94A3B8" stroke-width="3" stroke-linecap="round">
        <line x1="12" y1="40" x2="52" y2="40" />
        <line x1="16" y1="46" x2="48" y2="46" />
        <line x1="20" y1="52" x2="44" y2="52" />
      </g>
    </svg>
  `,

  drizzle: `
    <svg viewBox="0 0 64 64" fill="none" class="weather-icon-svg" aria-hidden="true">
      <path d="M46 36H20C15 36 11 32 11 27C11 22.4 14.5 18.5 19 18C20.6 12.3 25.9 8 32.2 8C39.6 8 45.7 13.7 45.7 20.7C49.2 21.3 52 24.4 52 28.2C52 32.5 49.3 36 46 36Z" fill="#CBD5E1"/>
      <g stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="2 6">
        <line x1="22" y1="42" x2="19" y2="54" />
        <line x1="32" y1="42" x2="29" y2="54" />
        <line x1="42" y1="42" x2="39" y2="54" />
      </g>
    </svg>
  `,

  rain: `
    <svg viewBox="0 0 64 64" fill="none" class="weather-icon-svg icon-rain" aria-hidden="true">
      <defs>
        <linearGradient id="rainCloud" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#CBD5E1" />
          <stop offset="100%" stop-color="#64748B" />
        </linearGradient>
      </defs>
      <path d="M46 36H20C15 36 11 32 11 27C11 22.4 14.5 18.5 19 18C20.6 12.3 25.9 8 32.2 8C39.6 8 45.7 13.7 45.7 20.7C49.2 21.3 52 24.4 52 28.2C52 32.5 49.3 36 46 36Z" fill="url(#rainCloud)"/>
      <g stroke="#0284C7" stroke-width="3" stroke-linecap="round">
        <line x1="22" y1="42" x2="18" y2="54" />
        <line x1="33" y1="42" x2="29" y2="54" />
        <line x1="44" y1="42" x2="40" y2="54" />
      </g>
    </svg>
  `,

  'rain-heavy': `
    <svg viewBox="0 0 64 64" fill="none" class="weather-icon-svg icon-rain" aria-hidden="true">
      <defs>
        <linearGradient id="heavyCloud" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#94A3B8" />
          <stop offset="100%" stop-color="#475569" />
        </linearGradient>
      </defs>
      <path d="M48 34H18C13.5 34 10 30 10 25.5C10 21.2 13.3 17.6 17.5 17C19 11.5 24 7 30 7C37 7 43 12.5 43 19C46.5 19.5 49 22.5 49 26C49 30.5 46.5 34 48 34Z" fill="url(#heavyCloud)"/>
      <g stroke="#0284C7" stroke-width="3.5" stroke-linecap="round">
        <line x1="18" y1="40" x2="13" y2="56" />
        <line x1="28" y1="40" x2="23" y2="56" />
        <line x1="38" y1="40" x2="33" y2="56" />
        <line x1="48" y1="40" x2="43" y2="56" />
      </g>
    </svg>
  `,

  snow: `
    <svg viewBox="0 0 64 64" fill="none" class="weather-icon-svg" aria-hidden="true">
      <defs>
        <linearGradient id="snowCloud" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#CBD5E1" />
        </linearGradient>
      </defs>
      <path d="M46 34H20C15 34 11 30 11 25.5C11 21.2 14.5 17.5 19 17C20.6 11.6 25.9 7.5 32.2 7.5C39.6 7.5 45.7 13 45.7 19.7C49.2 20.3 52 23.2 52 26.8C52 30.8 49.3 34 46 34Z" fill="url(#snowCloud)"/>
      <g stroke="#38BDF8" stroke-width="2" stroke-linecap="round">
        <!-- Snowflake 1 -->
        <circle cx="20" cy="46" r="1.5" fill="#38BDF8" />
        <line x1="17" y1="46" x2="23" y2="46" />
        <line x1="20" y1="43" x2="20" y2="49" />
        <!-- Snowflake 2 -->
        <circle cx="32" cy="50" r="1.5" fill="#38BDF8" />
        <line x1="29" y1="50" x2="35" y2="50" />
        <line x1="32" y1="47" x2="32" y2="53" />
        <!-- Snowflake 3 -->
        <circle cx="44" cy="46" r="1.5" fill="#38BDF8" />
        <line x1="41" y1="46" x2="47" y2="46" />
        <line x1="44" y1="43" x2="44" y2="49" />
      </g>
    </svg>
  `,

  thunderstorm: `
    <svg viewBox="0 0 64 64" fill="none" class="weather-icon-svg icon-thunder" aria-hidden="true">
      <defs>
        <linearGradient id="stormCloud" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#475569" />
          <stop offset="100%" stop-color="#1E293B" />
        </linearGradient>
      </defs>
      <path d="M46 34H20C15 34 11 30 11 25.5C11 21.2 14.5 17.5 19 17C20.6 11.6 25.9 7.5 32.2 7.5C39.6 7.5 45.7 13 45.7 19.7C49.2 20.3 52 23.2 52 26.8C52 30.8 49.3 34 46 34Z" fill="url(#stormCloud)"/>
      <polygon points="34,32 24,45 32,45 28,58 42,42 33,42" fill="#FACC15" filter="drop-shadow(0 2px 6px rgba(250,204,21,0.5))"/>
    </svg>
  `
};

// Aliases for missing icon keys
WEATHER_ICONS['sun-cloud'] = WEATHER_ICONS['partly-cloudy-day'];
WEATHER_ICONS['moon-cloud'] = WEATHER_ICONS['partly-cloudy-night'];
WEATHER_ICONS['rain-light'] = WEATHER_ICONS['drizzle'];
WEATHER_ICONS['rain-snow'] = WEATHER_ICONS['snow'];
WEATHER_ICONS['snow-heavy'] = WEATHER_ICONS['snow'];
WEATHER_ICONS['rain-showers-day'] = WEATHER_ICONS['rain'];
WEATHER_ICONS['rain-showers-night'] = WEATHER_ICONS['rain'];
WEATHER_ICONS['thunder-hail'] = WEATHER_ICONS['thunderstorm'];

/**
 * Returns the matching SVG markup for a weather code and is_day flag
 */
export function getConditionIconSvg(code, isDay = 1) {
  const info = getWeatherInfo(code);
  const iconKey = isDay ? info.iconDay : info.iconNight;
  return WEATHER_ICONS[iconKey] || WEATHER_ICONS.overcast;
}

/**
 * Conversion Utilities
 */
export function cToF(c) {
  return (c * 9) / 5 + 32;
}

export function fToC(f) {
  return ((f - 32) * 5) / 9;
}

export function formatTemp(tempC, unit = 'C', includeSymbol = true) {
  if (tempC === undefined || tempC === null || isNaN(tempC)) return '--';
  const val = unit === 'F' ? Math.round(cToF(tempC)) : Math.round(tempC);
  return includeSymbol ? `${val}°` : `${val}`;
}

export function formatWind(kmh, unit = 'C') {
  if (kmh === undefined || kmh === null || isNaN(kmh)) return '--';
  if (unit === 'F') {
    const mph = Math.round(kmh * 0.621371);
    return `${mph} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

export function getWindDirection(deg) {
  if (deg === undefined || deg === null) return 'N';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg % 360) / 22.5) % 16;
  return directions[index];
}

export function formatPressure(hpa, unit = 'C') {
  if (!hpa) return '--';
  if (unit === 'F') {
    const inHg = (hpa * 0.02953).toFixed(2);
    return `${inHg} inHg`;
  }
  return `${Math.round(hpa)} hPa`;
}

export function formatVisibility(meters, unit = 'C') {
  if (meters === undefined || meters === null) return '--';
  if (unit === 'F') {
    const miles = (meters / 1609.34).toFixed(1);
    return `${miles} mi`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km} km`;
}

/**
 * Calculate dew point from temperature (°C) and relative humidity (%)
 * Magnus formula approximation
 */
export function calculateDewPoint(tempC, humidity) {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * tempC) / (b + tempC)) + Math.log(humidity / 100.0);
  const dewPoint = (b * alpha) / (a - alpha);
  return Math.round(dewPoint);
}

/**
 * UV Index qualitative categorization and advice
 */
export function getUvInfo(uv) {
  const val = Math.round(uv || 0);
  if (val <= 2) {
    return { level: 'Low', description: 'No protection needed. Safe for outdoor activities.', color: '#10B981', percent: 20 };
  } else if (val <= 5) {
    return { level: 'Moderate', description: 'Wear sunglasses & SPF 30+ during peak hours.', color: '#F59E0B', percent: 45 };
  } else if (val <= 7) {
    return { level: 'High', description: 'Cover up, seek shade between 11 AM & 4 PM.', color: '#F97316', percent: 70 };
  } else if (val <= 10) {
    return { level: 'Very High', description: 'Minimize midday sun exposure, wear hat & SPF.', color: '#EF4444', percent: 88 };
  } else {
    return { level: 'Extreme', description: 'Stay indoors or take full protective precautions.', color: '#8B5CF6', percent: 100 };
  }
}

/**
 * Generate human-friendly weather summary sentence
 */
export function generateConditionSummary(current, dailyToday) {
  const code = current.weather_code;
  const temp = Math.round(current.temperature_2m);
  const feels = Math.round(current.apparent_temperature);
  const info = getWeatherInfo(code);

  let feelPhrase = '';
  if (Math.abs(temp - feels) >= 3) {
    feelPhrase = feels > temp ? ' Humidity makes it feel warmer.' : ' Wind chill makes it feel colder.';
  }

  if (code >= 95) {
    return `Severe thunderstorms in the area. Expect heavy lightning and rain.${feelPhrase}`;
  } else if (code >= 61) {
    return `Active precipitation with ${info.description.toLowerCase()}.${feelPhrase}`;
  } else if (code >= 51) {
    return `Intermittent light drizzle today.${feelPhrase}`;
  } else if (code === 0 || code === 1) {
    return `Clear and pleasant skies with great visibility.${feelPhrase}`;
  } else if (code === 2 || code === 3) {
    return `Partly cloudy skies with moderate cloud cover.${feelPhrase}`;
  } else if (code >= 71) {
    return `Snowfall in the area. Expect cold conditions.${feelPhrase}`;
  } else if (code === 45 || code === 48) {
    return `Dense fog advisory. Drive with caution.${feelPhrase}`;
  }
  return `Current conditions are ${info.description.toLowerCase()}.${feelPhrase}`;
}
