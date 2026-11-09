/**
 * Atmosphere Weather Explorer - Storage Service
 * Handles browser LocalStorage persistence for user preferences,
 * favorites, and recent search history.
 * Developer: Sameera Bhanu (SVECW)
 */

const StorageKeys = {
  UNIT: 'atmosphere_temp_unit',
  LAST_CITY: 'atmosphere_last_city',
  RECENT_SEARCHES: 'atmosphere_recent_searches',
  FAVORITES: 'atmosphere_favorites'
};

const DEFAULT_CITY = {
  id: 2643743,
  name: 'London',
  country: 'United Kingdom',
  country_code: 'GB',
  admin1: 'England',
  latitude: 51.50853,
  longitude: -0.12574,
  timezone: 'Europe/London'
};

export const Storage = {
  /**
   * Get preferred temperature unit ('C' or 'F')
   */
  getUnit() {
    try {
      const unit = localStorage.getItem(StorageKeys.UNIT);
      return unit === 'F' ? 'F' : 'C';
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
      return 'C';
    }
  },

  /**
   * Set preferred temperature unit ('C' or 'F')
   */
  setUnit(unit) {
    try {
      localStorage.setItem(StorageKeys.UNIT, unit === 'F' ? 'F' : 'C');
    } catch (e) {
      console.warn('Failed to save unit to LocalStorage:', e);
    }
  },

  /**
   * Get last viewed city or fallback to default
   */
  getLastCity() {
    try {
      const data = localStorage.getItem(StorageKeys.LAST_CITY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse last city from LocalStorage:', e);
    }
    return DEFAULT_CITY;
  },

  /**
   * Save last viewed city
   */
  setLastCity(city) {
    if (!city || typeof city.latitude !== 'number') return;
    try {
      localStorage.setItem(StorageKeys.LAST_CITY, JSON.stringify(city));
    } catch (e) {
      console.warn('Failed to save last city to LocalStorage:', e);
    }
  },

  /**
   * Get recent search history (max 6 items)
   */
  getRecentSearches() {
    try {
      const data = localStorage.getItem(StorageKeys.RECENT_SEARCHES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to parse recent searches:', e);
      return [];
    }
  },

  /**
   * Add a city to recent searches (deduplicated, unshifted to front, max 6)
   */
  addRecentSearch(city) {
    if (!city || !city.name) return;
    try {
      let recents = this.getRecentSearches();
      // Filter out existing city with same coordinates/name
      recents = recents.filter(item => 
        !(item.name.toLowerCase() === city.name.toLowerCase() && 
          item.country === city.country)
      );
      recents.unshift({
        id: city.id || `${city.name}-${city.latitude}`,
        name: city.name,
        country: city.country || '',
        country_code: city.country_code || '',
        admin1: city.admin1 || '',
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone || 'auto'
      });
      if (recents.length > 6) recents = recents.slice(0, 6);
      localStorage.setItem(StorageKeys.RECENT_SEARCHES, JSON.stringify(recents));
    } catch (e) {
      console.warn('Failed to update recent searches:', e);
    }
  },

  /**
   * Clear all recent searches
   */
  clearRecentSearches() {
    try {
      localStorage.removeItem(StorageKeys.RECENT_SEARCHES);
    } catch (e) {
      console.warn('Failed to clear recent searches:', e);
    }
  },

  /**
   * Get favorite cities list
   */
  getFavorites() {
    try {
      const data = localStorage.getItem(StorageKeys.FAVORITES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse favorites:', e);
    }
    // Default starter favorites if empty
    return [
      {
        id: 'fav-tokyo',
        name: 'Tokyo',
        country: 'Japan',
        country_code: 'JP',
        admin1: 'Tokyo',
        latitude: 35.6895,
        longitude: 139.6917,
        timezone: 'Asia/Tokyo'
      },
      {
        id: 'fav-ny',
        name: 'New York',
        country: 'United States',
        country_code: 'US',
        admin1: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
        timezone: 'America/New_York'
      },
      {
        id: 'fav-paris',
        name: 'Paris',
        country: 'France',
        country_code: 'FR',
        admin1: 'Île-de-France',
        latitude: 48.8566,
        longitude: 2.3522,
        timezone: 'Europe/Paris'
      }
    ];
  },

  /**
   * Check if a city is in favorites
   */
  isFavorite(city) {
    if (!city) return false;
    const favorites = this.getFavorites();
    return favorites.some(item => 
      (city.id && item.id === city.id) ||
      (item.name.toLowerCase() === city.name.toLowerCase() && item.country === city.country) ||
      (Math.abs(item.latitude - city.latitude) < 0.05 && Math.abs(item.longitude - city.longitude) < 0.05)
    );
  },

  /**
   * Toggle a city in favorites list
   * Returns true if now favorite, false if removed
   */
  toggleFavorite(city) {
    if (!city || !city.name) return false;
    let favorites = this.getFavorites();
    const existingIndex = favorites.findIndex(item =>
      (city.id && item.id === city.id) ||
      (item.name.toLowerCase() === city.name.toLowerCase() && item.country === city.country) ||
      (Math.abs(item.latitude - city.latitude) < 0.05 && Math.abs(item.longitude - city.longitude) < 0.05)
    );

    let isFavNow = false;
    if (existingIndex >= 0) {
      favorites.splice(existingIndex, 1);
      isFavNow = false;
    } else {
      favorites.unshift({
        id: city.id || `fav-${Date.now()}`,
        name: city.name,
        country: city.country || '',
        country_code: city.country_code || '',
        admin1: city.admin1 || '',
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone || 'auto'
      });
      isFavNow = true;
    }

    try {
      localStorage.setItem(StorageKeys.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites:', e);
    }
    return isFavNow;
  },

  /**
   * Remove a specific favorite by id
   */
  removeFavorite(id) {
    let favorites = this.getFavorites();
    favorites = favorites.filter(item => item.id !== id);
    try {
      localStorage.setItem(StorageKeys.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to update favorites:', e);
    }
    return favorites;
  }
};
