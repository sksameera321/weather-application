/**
 * Atmosphere Weather Explorer - Main Application Controller
 * Coordinates API fetch cycles, state management, UI rendering,
 * and user interactions.
 * Developer: Sameera Bhanu (SVECW)
 */

import { Storage } from './storage.js';
import { WeatherApi } from './api.js';
import { 
  getWeatherInfo, 
  getWeatherBackground,
  getConditionIconSvg, 
  formatTemp, 
  formatWind, 
  getWindDirection, 
  formatPressure, 
  formatVisibility, 
  calculateDewPoint, 
  getUvInfo, 
  generateConditionSummary 
} from './weather.js';
import { Forecast } from './forecast.js';

// Application State
const state = {
  currentCity: null,
  weatherData: null,
  hourlyList: [],
  dailyList: [],
  unit: Storage.getUnit(), // 'C' or 'F'
  isLoading: false,
  searchSuggestions: [],
  selectedSuggestionIdx: -1,
  currentBgUrl: '',
  activeBgLayer: 'primary'
};

// DOM Selectors
const DOM = {
  body: document.body,
  skyBgPrimary: document.getElementById('sky-bg-primary'),
  skyBgSecondary: document.getElementById('sky-bg-secondary'),
  skyAmbientPill: document.getElementById('sky-ambient-pill'),
  searchInput: document.getElementById('search-input'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  locateMeBtn: document.getElementById('locate-me-btn'),
  searchSuggestions: document.getElementById('search-suggestions'),
  refreshBtn: document.getElementById('refresh-btn'),
  unitCBtn: document.getElementById('unit-c-btn'),
  unitFBtn: document.getElementById('unit-f-btn'),
  openFavoritesBtn: document.getElementById('open-favorites-btn'),
  favoritesBadge: document.getElementById('favorites-count-badge'),
  favoritesDrawer: document.getElementById('favorites-drawer'),
  closeDrawerBtn: document.getElementById('close-drawer-btn'),
  drawerBackdrop: document.getElementById('drawer-backdrop'),
  favoritesCardsList: document.getElementById('favorites-cards-list'),
  recentChipsList: document.getElementById('recent-chips-list'),
  clearRecentsBtn: document.getElementById('clear-recents-btn'),
  alertBanner: document.getElementById('alert-banner'),
  alertMessage: document.getElementById('alert-message'),
  alertActionBtn: document.getElementById('alert-action-btn'),

  // Hero Overview
  currentCityName: document.getElementById('current-city-name'),
  toggleFavBtn: document.getElementById('toggle-fav-btn'),
  currentRegionCountry: document.getElementById('current-region-country'),
  currentLocalTime: document.getElementById('current-local-time'),
  currentLocalDate: document.getElementById('current-local-date'),
  currentTempValue: document.getElementById('current-temp-value'),
  currentTempUnit: document.getElementById('current-temp-unit'),
  currentConditionText: document.getElementById('current-condition-text'),
  todayHigh: document.getElementById('today-high'),
  todayLow: document.getElementById('today-low'),
  currentFeelsLike: document.getElementById('current-feels-like'),
  heroWeatherIcon: document.getElementById('hero-weather-icon'),
  weatherSummaryText: document.getElementById('weather-summary-text'),

  // Hourly Section
  hourlyTrack: document.getElementById('hourly-track'),
  hourlyScrollLeft: document.getElementById('hourly-scroll-left'),
  hourlyScrollRight: document.getElementById('hourly-scroll-right'),

  // Daily Section
  dailyForecastList: document.getElementById('daily-forecast-list'),

  // Bento Metrics
  metricUvVal: document.getElementById('metric-uv-val'),
  metricUvLevel: document.getElementById('metric-uv-level'),
  metricUvBar: document.getElementById('metric-uv-bar'),
  metricUvAdvice: document.getElementById('metric-uv-advice'),

  metricWindSpeed: document.getElementById('metric-wind-speed'),
  metricWindDirText: document.getElementById('metric-wind-dir-text'),
  compassNeedle: document.getElementById('compass-needle'),
  metricWindCompassDeg: document.getElementById('metric-wind-compass-deg'),

  metricSunPrimary: document.getElementById('metric-sun-primary'),
  metricSunEventName: document.getElementById('metric-sun-event-name'),
  solarSunDot: document.getElementById('solar-sun-dot'),
  metricSunriseTime: document.getElementById('metric-sunrise-time'),
  metricSunsetTime: document.getElementById('metric-sunset-time'),

  metricHumidityVal: document.getElementById('metric-humidity-val'),
  metricDewPoint: document.getElementById('metric-dew-point'),
  metricHumidityBar: document.getElementById('metric-humidity-bar'),
  metricHumidityComfort: document.getElementById('metric-humidity-comfort'),

  metricVisibilityVal: document.getElementById('metric-visibility-val'),
  metricVisibilityLabel: document.getElementById('metric-visibility-label'),
  metricVisibilityDesc: document.getElementById('metric-visibility-desc'),

  metricPressureVal: document.getElementById('metric-pressure-val'),
  metricPressureState: document.getElementById('metric-pressure-state'),
  metricPressureNeedle: document.getElementById('metric-pressure-needle'),
  metricPressureDesc: document.getElementById('metric-pressure-desc')
};

/**
 * Initialize Atmosphere Application
 */
async function initApp() {
  setupEventListeners();
  updateUnitButtons();
  renderRecents();
  updateFavoritesCount();

  // Load last viewed city from LocalStorage or default to London
  const savedCity = Storage.getLastCity();
  await loadCityWeather(savedCity);
}

/**
 * Fetch and display complete weather for a target city
 */
async function loadCityWeather(city) {
  if (!city || typeof city.latitude !== 'number') return;

  state.isLoading = true;
  state.currentCity = city;
  Storage.setLastCity(city);
  Storage.addRecentSearch(city);
  renderRecents();
  updateFavoriteButtonState();
  hideAlert();

  DOM.refreshBtn.classList.add('spinning');
  DOM.currentConditionText.textContent = 'Updating...';

  try {
    const data = await WeatherApi.getForecast(city.latitude, city.longitude, city.timezone, city.name);
    state.weatherData = data;

    // Process forecast data models
    state.hourlyList = Forecast.processHourlyForecast(data.hourly, data.current, city.timezone);
    state.dailyList = Forecast.processDailyForecast(data.daily, data.current.temperature_2m);

    renderAll();

    if (data._fallback) {
      showAlert(`Network restricted: Displaying meteorological estimation for ${city.name}.`, () => {
        loadCityWeather(city);
      });
    } else if (data._cached) {
      showAlert(`Offline mode: Showing cached weather for ${city.name}.`, () => {
        loadCityWeather(city);
      });
    } else {
      hideAlert();
    }
  } catch (err) {
    console.error('Failed to load weather:', err);
    showAlert(`Unable to fetch real-time weather for ${city.name}. (${err.message})`, () => {
      loadCityWeather(city);
    });
  } finally {
    state.isLoading = false;
    DOM.refreshBtn.classList.remove('spinning');
  }
}

/**
 * Master Render Pipeline
 */
function renderAll() {
  if (!state.weatherData || !state.currentCity) return;

  renderHero();
  renderHourly();
  renderDaily();
  renderBento();
  updateAtmosphericTheme();
}

/**
 * Render Hero Overview Card
 */
function renderHero() {
  const current = state.weatherData.current;
  const daily = state.weatherData.daily;
  const city = state.currentCity;
  const unit = state.unit;

  // City & Region
  DOM.currentCityName.textContent = city.name;
  const regionParts = [city.admin1, city.country].filter(Boolean);
  DOM.currentRegionCountry.textContent = regionParts.join(', ') || 'Global Station';

  // Date & Local Time formatting
  updateLocalTimeDisplay();

  // Temperatures
  DOM.currentTempValue.textContent = formatTemp(current.temperature_2m, unit, false);
  DOM.currentTempUnit.textContent = '°';
  
  const highToday = daily && daily.temperature_2m_max ? daily.temperature_2m_max[0] : current.temperature_2m;
  const lowToday = daily && daily.temperature_2m_min ? daily.temperature_2m_min[0] : current.temperature_2m;
  
  DOM.todayHigh.textContent = formatTemp(highToday, unit);
  DOM.todayLow.textContent = formatTemp(lowToday, unit);
  DOM.currentFeelsLike.textContent = formatTemp(current.apparent_temperature, unit);

  // Condition name & icon
  const info = getWeatherInfo(current.weather_code);
  DOM.currentConditionText.textContent = info.description;
  DOM.heroWeatherIcon.innerHTML = getConditionIconSvg(current.weather_code, current.is_day);

  // Advisory Summary phrase
  DOM.weatherSummaryText.textContent = generateConditionSummary(current, daily);

  updateFavoriteButtonState();
}

/**
 * Render 24-Hour Hourly Forecast Horizontal Track
 */
function renderHourly() {
  if (!state.hourlyList || !state.hourlyList.length) {
    DOM.hourlyTrack.innerHTML = '<p class="suggestion-empty">No hourly data available.</p>';
    return;
  }

  const unit = state.unit;
  const html = state.hourlyList.map((item, idx) => {
    const isNow = idx === 0;
    const iconSvg = getConditionIconSvg(item.weatherCode, item.isDay);
    const tempStr = formatTemp(item.tempC, unit);
    const rainBadge = item.precipProb > 10 
      ? `<div class="hourly-precip-badge"><span>💧</span>${item.precipProb}%</div>` 
      : '';

    return `
      <div class="hourly-item-card ${isNow ? 'is-now' : ''}">
        <span class="hourly-time">${item.timeLabel}</span>
        <div class="hourly-icon-wrap" aria-hidden="true">${iconSvg}</div>
        <span class="hourly-temp">${tempStr}</span>
        ${rainBadge}
      </div>
    `;
  }).join('');

  DOM.hourlyTrack.innerHTML = html;
}

/**
 * Render 7-Day Forecast with Apple Weather Temperature Spectrum Bars
 */
function renderDaily() {
  const dailyObj = state.dailyList;
  if (!dailyObj || !dailyObj.days || !dailyObj.days.length) {
    DOM.dailyForecastList.innerHTML = '<p class="suggestion-empty">No daily forecast available.</p>';
    return;
  }

  const unit = state.unit;
  const html = dailyObj.days.map(day => {
    const iconSvg = getConditionIconSvg(day.weatherCode, 1);
    const minStr = formatTemp(day.minTempC, unit);
    const maxStr = formatTemp(day.maxTempC, unit);

    const dotHtml = day.isToday && day.dotPercent !== null
      ? `<div class="apple-spectrum-dot" style="left: ${day.dotPercent.toFixed(1)}%;"></div>`
      : '';

    return `
      <div class="daily-row-item ${day.isToday ? 'is-today' : ''}">
        <div class="daily-day-info">
          <span class="daily-day-name">${day.dayName}</span>
          <span class="daily-date-sub">${day.dateLabel}</span>
        </div>
        <div class="daily-icon-wrap" aria-hidden="true">
          ${iconSvg}
        </div>
        <span class="daily-min-temp">${minStr}</span>
        <div class="apple-spectrum-track" aria-hidden="true">
          <div class="apple-spectrum-bar" style="left: ${day.barLeftPercent.toFixed(1)}%; width: ${day.barWidthPercent.toFixed(1)}%;"></div>
          ${dotHtml}
        </div>
        <span class="daily-max-temp">${maxStr}</span>
      </div>
    `;
  }).join('');

  DOM.dailyForecastList.innerHTML = html;
}

/**
 * Render Bento Grid Meteorological Cards
 */
function renderBento() {
  const current = state.weatherData.current;
  const daily = state.weatherData.daily;
  const unit = state.unit;

  // 1. UV Index
  const uvVal = current.uv_index !== undefined ? current.uv_index : (daily.uv_index_max ? daily.uv_index_max[0] : 0);
  const uvInfo = getUvInfo(uvVal);
  DOM.metricUvVal.textContent = Math.round(uvVal);
  DOM.metricUvLevel.textContent = uvInfo.level;
  DOM.metricUvLevel.style.backgroundColor = `${uvInfo.color}33`;
  DOM.metricUvLevel.style.color = uvInfo.color;
  DOM.metricUvBar.style.width = `${uvInfo.percent}%`;
  DOM.metricUvAdvice.textContent = uvInfo.description;

  // 2. Wind & Compass
  const windKmh = current.wind_speed_10m || 0;
  const windDeg = current.wind_direction_10m || 0;
  const windDirName = getWindDirection(windDeg);
  DOM.metricWindSpeed.textContent = formatWind(windKmh, unit);
  DOM.metricWindDirText.textContent = `${windDirName}`;
  DOM.compassNeedle.style.transform = `rotate(${windDeg}deg)`;
  DOM.metricWindCompassDeg.textContent = `${windDeg}° ${windDirName} Heading`;

  // 3. Sunrise & Sunset Solar Arc
  const sunriseIso = daily && daily.sunrise ? daily.sunrise[0] : null;
  const sunsetIso = daily && daily.sunset ? daily.sunset[0] : null;
  const solar = Forecast.calculateSolarTimes(sunriseIso, sunsetIso);

  DOM.metricSunPrimary.textContent = current.is_day ? solar.sunsetFormatted : solar.sunriseFormatted;
  DOM.metricSunEventName.textContent = current.is_day ? 'Sunset' : 'Sunrise';
  DOM.metricSunriseTime.textContent = solar.sunriseFormatted;
  DOM.metricSunsetTime.textContent = solar.sunsetFormatted;

  // Position Sun marker on SVG parabolic arc
  // Arc path: Q 100 10 -> X range: 20 to 180 (span 160)
  const progressRatio = solar.daylightProgressPercent / 100;
  const sunX = 20 + (160 * progressRatio);
  // Parabola height approximation
  const normalX = (progressRatio - 0.5) * 2; // -1 to 1
  const sunY = 80 - (70 * (1 - normalX * normalX));
  DOM.solarSunDot.setAttribute('cx', sunX.toFixed(1));
  DOM.solarSunDot.setAttribute('cy', Math.max(15, Math.min(80, sunY)).toFixed(1));

  // 4. Humidity & Dew Point
  const humidity = current.relative_humidity_2m || 0;
  DOM.metricHumidityVal.textContent = `${humidity}%`;
  const dewC = calculateDewPoint(current.temperature_2m, humidity);
  DOM.metricDewPoint.textContent = `Dew point ${formatTemp(dewC, unit)}`;
  DOM.metricHumidityBar.style.width = `${humidity}%`;
  
  if (humidity < 35) {
    DOM.metricHumidityComfort.textContent = 'Air is currently dry. Stay hydrated.';
  } else if (humidity <= 65) {
    DOM.metricHumidityComfort.textContent = 'Humidity level is comfortably balanced.';
  } else {
    DOM.metricHumidityComfort.textContent = 'High moisture. Feels humid and heavy.';
  }

  // 5. Visibility
  const visMeters = current.visibility !== undefined ? current.visibility : 10000;
  DOM.metricVisibilityVal.textContent = formatVisibility(visMeters, unit);
  if (visMeters >= 9000) {
    DOM.metricVisibilityLabel.textContent = 'Clear';
    DOM.metricVisibilityDesc.textContent = 'Crystal clear horizon visibility.';
  } else if (visMeters >= 4000) {
    DOM.metricVisibilityLabel.textContent = 'Moderate';
    DOM.metricVisibilityDesc.textContent = 'Mild haze or mist in the distance.';
  } else {
    DOM.metricVisibilityLabel.textContent = 'Poor';
    DOM.metricVisibilityDesc.textContent = 'Dense fog or atmospheric haze present.';
  }

  // 6. Atmospheric Pressure
  const pressureHpa = current.surface_pressure || 1013;
  DOM.metricPressureVal.textContent = formatPressure(pressureHpa, unit);
  // Pressure calibration: standard 1013 hPa (range 970 to 1050)
  const pressureRatio = Math.max(0, Math.min(100, ((pressureHpa - 970) / 80) * 100));
  DOM.metricPressureNeedle.style.left = `${pressureRatio.toFixed(1)}%`;

  if (pressureHpa > 1020) {
    DOM.metricPressureState.textContent = 'High';
    DOM.metricPressureDesc.textContent = 'High pressure system brings settled skies.';
  } else if (pressureHpa < 1005) {
    DOM.metricPressureState.textContent = 'Low';
    DOM.metricPressureDesc.textContent = 'Low pressure indicates active weather/rain.';
  } else {
    DOM.metricPressureState.textContent = 'Standard';
    DOM.metricPressureDesc.textContent = 'Typical sea-level atmospheric pressure.';
  }
}

/**
 * Update Atmospheric Background Class & Crossfade Sky Photography
 */
function updateAtmosphericTheme() {
  if (!state.weatherData || !state.weatherData.current) return;
  const current = state.weatherData.current;
  const isDay = current.is_day === 1;
  const code = current.weather_code;
  const info = getWeatherInfo(code);

  DOM.body.className = ''; // Reset

  let themeClass = 'theme-clear-day';
  let themeColor = '#0284c7';

  if (code >= 95) {
    themeClass = 'theme-thunderstorm';
    themeColor = '#1e1b4b';
  } else if (code >= 71) {
    themeClass = 'theme-snowy';
    themeColor = '#475569';
  } else if (code >= 51) {
    themeClass = 'theme-rainy';
    themeColor = '#334155';
  } else if (code === 45 || code === 48) {
    themeClass = 'theme-foggy';
    themeColor = '#4b5563';
  } else if (code === 2 || code === 3) {
    themeClass = isDay ? 'theme-cloudy-day' : 'theme-cloudy-night';
    themeColor = isDay ? '#475569' : '#0f172a';
  } else {
    themeClass = isDay ? 'theme-clear-day' : 'theme-clear-night';
    themeColor = isDay ? '#0284c7' : '#090d16';
  }

  DOM.body.classList.add(themeClass);

  // Update theme-color meta tag
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', themeColor);

  // Update ambient sky pill indicator
  if (DOM.skyAmbientPill) {
    const icon = isDay ? '☀️' : '🌙';
    DOM.skyAmbientPill.textContent = `${icon} ${info.description}`;
  }

  // Crossfade Photographic Sky Background
  const targetBgUrl = getWeatherBackground(code, isDay);
  if (state.currentBgUrl !== targetBgUrl) {
    state.currentBgUrl = targetBgUrl;
    transitionSkyBackground(targetBgUrl);
  }
}

/**
 * Crossfade background photography layers smoothly
 */
function transitionSkyBackground(url) {
  if (!DOM.skyBgPrimary || !DOM.skyBgSecondary) return;

  const isPrimaryActive = state.activeBgLayer === 'primary';
  const incomingLayer = isPrimaryActive ? DOM.skyBgSecondary : DOM.skyBgPrimary;
  const outgoingLayer = isPrimaryActive ? DOM.skyBgPrimary : DOM.skyBgSecondary;

  // Preload image before switching to guarantee zero flash
  const img = new Image();
  img.src = url;
  img.onload = () => {
    incomingLayer.style.backgroundImage = `url("${url}")`;
    incomingLayer.classList.add('active');
    outgoingLayer.classList.remove('active');
    state.activeBgLayer = isPrimaryActive ? 'secondary' : 'primary';
  };
  img.onerror = () => {
    // If external image fails, gracefully fallback to CSS gradients
    incomingLayer.style.backgroundImage = 'none';
  };
}

/**
 * Calculate & Format Local Time for Target City
 */
function updateLocalTimeDisplay() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  DOM.currentLocalDate.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const fHours = hours % 12 || 12;
  const fMins = minutes < 10 ? `0${minutes}` : minutes;
  DOM.currentLocalTime.textContent = `${fHours}:${fMins} ${ampm}`;
}

/**
 * Unit Switcher: Toggle between °C and °F
 */
function switchUnit(newUnit) {
  if (state.unit === newUnit) return;
  state.unit = newUnit;
  Storage.setUnit(newUnit);
  updateUnitButtons();
  if (state.weatherData) {
    renderAll();
  }
}

function updateUnitButtons() {
  if (state.unit === 'F') {
    DOM.unitFBtn.classList.add('active');
    DOM.unitFBtn.setAttribute('aria-checked', 'true');
    DOM.unitCBtn.classList.remove('active');
    DOM.unitCBtn.setAttribute('aria-checked', 'false');
  } else {
    DOM.unitCBtn.classList.add('active');
    DOM.unitCBtn.setAttribute('aria-checked', 'true');
    DOM.unitFBtn.classList.remove('active');
    DOM.unitFBtn.setAttribute('aria-checked', 'false');
  }
}

/**
 * Recent Searches Navigation Strip
 */
function renderRecents() {
  const recents = Storage.getRecentSearches();
  if (!recents.length) {
    DOM.recentChipsList.innerHTML = '<span class="suggestion-region">No recent cities</span>';
    DOM.clearRecentsBtn.classList.add('hidden');
    return;
  }

  DOM.clearRecentsBtn.classList.remove('hidden');
  const html = recents.map(city => {
    const flag = city.country_code ? getFlagEmoji(city.country_code) : '📍';
    return `
      <button type="button" class="recent-chip" data-city='${JSON.stringify(city)}'>
        <span class="recent-chip-flag">${flag}</span>
        <span>${city.name}</span>
      </button>
    `;
  }).join('');

  DOM.recentChipsList.innerHTML = html;
}

/**
 * Helper to convert ISO country code to Emoji flag
 */
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Favorites Drawer & Favorite Toggle
 */
function updateFavoritesCount() {
  const favs = Storage.getFavorites();
  DOM.favoritesBadge.textContent = favs.length;
}

function updateFavoriteButtonState() {
  if (!state.currentCity) return;
  const isFav = Storage.isFavorite(state.currentCity);
  if (isFav) {
    DOM.toggleFavBtn.classList.add('active');
    DOM.toggleFavBtn.setAttribute('title', 'Remove city from favorites');
  } else {
    DOM.toggleFavBtn.classList.remove('active');
    DOM.toggleFavBtn.setAttribute('title', 'Add city to favorites');
  }
}

function renderFavorites() {
  const favs = Storage.getFavorites();
  updateFavoritesCount();

  if (!favs.length) {
    DOM.favoritesCardsList.innerHTML = `
      <div class="fav-empty-state">
        <p>No saved locations yet.</p>
        <p style="margin-top: 0.5rem; font-size: 0.75rem;">Click the star icon ⭐ next to any city to pin it here for instantaneous access.</p>
      </div>
    `;
    return;
  }

  const html = favs.map(city => {
    const flag = city.country_code ? getFlagEmoji(city.country_code) : '📍';
    const region = [city.admin1, city.country].filter(Boolean).join(', ');
    return `
      <div class="favorite-card-item" data-fav-city='${JSON.stringify(city)}'>
        <div>
          <div class="fav-card-city">${flag} ${city.name}</div>
          <div class="fav-card-region">${region}</div>
        </div>
        <div class="fav-card-actions">
          <button type="button" class="fav-remove-btn" data-fav-id="${city.id}" title="Remove from favorites">×</button>
        </div>
      </div>
    `;
  }).join('');

  DOM.favoritesCardsList.innerHTML = html;
}

function openFavoritesDrawer() {
  renderFavorites();
  DOM.favoritesDrawer.classList.remove('hidden');
}

function closeFavoritesDrawer() {
  DOM.favoritesDrawer.classList.add('hidden');
}

/**
 * Search Autocomplete Logic
 */
let debounceTimer = null;

function handleSearchInput(e) {
  const query = e.target.value.trim();
  
  if (query.length > 0) {
    DOM.clearSearchBtn.classList.remove('hidden');
  } else {
    DOM.clearSearchBtn.classList.add('hidden');
    hideSuggestions();
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    if (query.length < 2) {
      hideSuggestions();
      return;
    }

    try {
      const results = await WeatherApi.searchCities(query);
      state.searchSuggestions = results;
      state.selectedSuggestionIdx = -1;
      renderSuggestions(results);
    } catch (err) {
      console.warn('Search autocomplete error:', err);
    }
  }, 260);
}

function renderSuggestions(results) {
  if (!results.length) {
    DOM.searchSuggestions.innerHTML = '<div class="suggestion-empty">No matching global locations found.</div>';
    DOM.searchSuggestions.classList.remove('hidden');
    return;
  }

  const html = results.map((item, idx) => {
    const flag = item.country_code ? getFlagEmoji(item.country_code) : '📍';
    const regionText = [item.admin1, item.country].filter(Boolean).join(', ');
    return `
      <div class="suggestion-item" data-idx="${idx}" role="option">
        <div class="suggestion-info">
          <span class="suggestion-city">${flag} ${item.name}</span>
          <span class="suggestion-region">${regionText}</span>
        </div>
        <span class="suggestion-country-badge">${item.country_code || 'GEO'}</span>
      </div>
    `;
  }).join('');

  DOM.searchSuggestions.innerHTML = html;
  DOM.searchSuggestions.classList.remove('hidden');
}

function hideSuggestions() {
  DOM.searchSuggestions.classList.add('hidden');
  DOM.searchSuggestions.innerHTML = '';
  state.selectedSuggestionIdx = -1;
}

function selectSuggestion(index) {
  const city = state.searchSuggestions[index];
  if (city) {
    DOM.searchInput.value = '';
    DOM.clearSearchBtn.classList.add('hidden');
    hideSuggestions();
    loadCityWeather(city);
  }
}

/**
 * Handle Keyboard Navigation in Autocomplete
 */
function handleSearchKeydown(e) {
  const items = DOM.searchSuggestions.querySelectorAll('.suggestion-item');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    state.selectedSuggestionIdx = (state.selectedSuggestionIdx + 1) % items.length;
    highlightSuggestion(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    state.selectedSuggestionIdx = (state.selectedSuggestionIdx - 1 + items.length) % items.length;
    highlightSuggestion(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (state.selectedSuggestionIdx >= 0 && state.selectedSuggestionIdx < state.searchSuggestions.length) {
      selectSuggestion(state.selectedSuggestionIdx);
    } else if (state.searchSuggestions.length > 0) {
      selectSuggestion(0);
    }
  } else if (e.key === 'Escape') {
    hideSuggestions();
  }
}

function highlightSuggestion(items) {
  items.forEach((item, idx) => {
    if (idx === state.selectedSuggestionIdx) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

/**
 * Alert Notifications
 */
function showAlert(message, retryCallback) {
  DOM.alertMessage.textContent = message;
  DOM.alertBanner.classList.remove('hidden');
  if (retryCallback) {
    DOM.alertActionBtn.onclick = retryCallback;
    DOM.alertActionBtn.classList.remove('hidden');
  } else {
    DOM.alertActionBtn.classList.add('hidden');
  }
}

function hideAlert() {
  DOM.alertBanner.classList.add('hidden');
}

/**
 * Setup All Event Listeners
 */
function setupEventListeners() {
  // Search Events
  DOM.searchInput.addEventListener('input', handleSearchInput);
  DOM.searchInput.addEventListener('keydown', handleSearchKeydown);

  DOM.clearSearchBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    DOM.clearSearchBtn.classList.add('hidden');
    hideSuggestions();
    DOM.searchInput.focus();
  });

  // Suggestion Click Delegation
  DOM.searchSuggestions.addEventListener('click', (e) => {
    const item = e.target.closest('.suggestion-item');
    if (item) {
      const idx = parseInt(item.getAttribute('data-idx'), 10);
      selectSuggestion(idx);
    }
  });

  // Dismiss suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-section')) {
      hideSuggestions();
    }
  });

  // Global Keyboard shortcut: '/' to focus search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== DOM.searchInput) {
      e.preventDefault();
      DOM.searchInput.focus();
      DOM.searchInput.select();
    } else if (e.key === 'Escape') {
      closeFavoritesDrawer();
      hideSuggestions();
    }
  });

  // Locate Me Button (GPS)
  DOM.locateMeBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    DOM.locateMeBtn.classList.add('spinning');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        DOM.locateMeBtn.classList.remove('spinning');
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const reverseCity = await WeatherApi.reverseGeocode(lat, lon);
        loadCityWeather(reverseCity);
      },
      (err) => {
        DOM.locateMeBtn.classList.remove('spinning');
        console.warn('Geolocation denied or failed:', err);
        showAlert('Location access was denied or timed out. Please search for your city manually.');
      },
      { timeout: 8000 }
    );
  });

  // Refresh Button
  DOM.refreshBtn.addEventListener('click', () => {
    if (state.currentCity) {
      loadCityWeather(state.currentCity);
    }
  });

  // Unit Toggle Buttons
  DOM.unitCBtn.addEventListener('click', () => switchUnit('C'));
  DOM.unitFBtn.addEventListener('click', () => switchUnit('F'));

  // Favorite Button on Hero Card
  DOM.toggleFavBtn.addEventListener('click', () => {
    if (!state.currentCity) return;
    Storage.toggleFavorite(state.currentCity);
    updateFavoriteButtonState();
    updateFavoritesCount();
  });

  // Favorites Drawer Triggers
  DOM.openFavoritesBtn.addEventListener('click', openFavoritesDrawer);
  DOM.closeDrawerBtn.addEventListener('click', closeFavoritesDrawer);
  DOM.drawerBackdrop.addEventListener('click', closeFavoritesDrawer);

  // Favorites Drawer Card Click & Remove Delegation
  DOM.favoritesCardsList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.fav-remove-btn');
    if (removeBtn) {
      e.stopPropagation();
      const favId = removeBtn.getAttribute('data-fav-id');
      Storage.removeFavorite(favId);
      renderFavorites();
      updateFavoriteButtonState();
      return;
    }

    const card = e.target.closest('.favorite-card-item');
    if (card) {
      const city = JSON.parse(card.getAttribute('data-fav-city'));
      closeFavoritesDrawer();
      loadCityWeather(city);
    }
  });

  // Recent Chips Click Delegation
  DOM.recentChipsList.addEventListener('click', (e) => {
    const chip = e.target.closest('.recent-chip');
    if (chip) {
      const city = JSON.parse(chip.getAttribute('data-city'));
      loadCityWeather(city);
    }
  });

  // Clear Recents Button
  DOM.clearRecentsBtn.addEventListener('click', () => {
    Storage.clearRecentSearches();
    renderRecents();
  });

  // Hourly Scroll Chevrons
  DOM.hourlyScrollLeft.addEventListener('click', () => {
    DOM.hourlyTrack.scrollBy({ left: -260, behavior: 'smooth' });
  });

  DOM.hourlyScrollRight.addEventListener('click', () => {
    DOM.hourlyTrack.scrollBy({ left: 260, behavior: 'smooth' });
  });

  // Footer Quick Cities Buttons
  document.querySelectorAll('.quick-city-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const city = {
        name: btn.dataset.city,
        latitude: parseFloat(btn.dataset.lat),
        longitude: parseFloat(btn.dataset.lon),
        country: btn.dataset.country,
        timezone: 'auto'
      };
      loadCityWeather(city);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Online / Offline Detection
  window.addEventListener('offline', () => {
    showAlert('Network connection lost. Showing cached meteorological data.');
  });

  window.addEventListener('online', () => {
    hideAlert();
    if (state.currentCity) loadCityWeather(state.currentCity);
  });
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
