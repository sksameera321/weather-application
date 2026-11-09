/**
 * Atmosphere Weather Explorer - Forecast Processing Module
 * Transforms raw Open-Meteo time-series matrices into refined
 * Hourly, 7-Day Apple-style spectrum, and Solar daylight models.
 * Developer: Sameera Bhanu (SVECW)
 */

export const Forecast = {
  /**
   * Process upcoming 24-hour hourly forecast
   */
  processHourlyForecast(hourlyData, currentData, timezone = 'auto') {
    if (!hourlyData || !hourlyData.time || !hourlyData.time.length) return [];

    const now = new Date();
    const currentTimeStr = currentData ? currentData.time : now.toISOString();
    
    // Find closest index for current hour
    let startIndex = 0;
    if (currentTimeStr) {
      const currentHourPrefix = currentTimeStr.slice(0, 13); // "YYYY-MM-DDTHH"
      const matchedIdx = hourlyData.time.findIndex(t => t.startsWith(currentHourPrefix));
      if (matchedIdx >= 0) {
        startIndex = matchedIdx;
      }
    }

    const items = [];
    const maxHours = Math.min(24, hourlyData.time.length - startIndex);

    for (let i = 0; i < maxHours; i++) {
      const idx = startIndex + i;
      const rawIso = hourlyData.time[idx];
      const isFirst = i === 0;

      // Parse hour formatting
      const dateObj = new Date(rawIso);
      let timeLabel = 'Now';

      if (!isFirst) {
        // Format to "1 PM", "2 AM"
        const hours = dateObj.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHour = hours % 12 || 12;
        timeLabel = `${formattedHour} ${ampm}`;
      }

      items.push({
        rawTime: rawIso,
        timeLabel: timeLabel,
        tempC: hourlyData.temperature_2m[idx],
        weatherCode: hourlyData.weather_code[idx],
        isDay: hourlyData.is_day ? hourlyData.is_day[idx] : 1,
        precipProb: hourlyData.precipitation_probability ? hourlyData.precipitation_probability[idx] : 0,
        humidity: hourlyData.relative_humidity_2m ? hourlyData.relative_humidity_2m[idx] : null,
        windSpeed: hourlyData.wind_speed_10m ? hourlyData.wind_speed_10m[idx] : null
      });
    }

    return items;
  },

  /**
   * Process 7-day daily forecast with Apple Weather temperature range spectrum
   */
  processDailyForecast(dailyData, currentTempC) {
    if (!dailyData || !dailyData.time || !dailyData.time.length) {
      return { days: [], globalMin: 0, globalMax: 0 };
    }

    const count = Math.min(7, dailyData.time.length);
    const dayMins = dailyData.temperature_2m_min.slice(0, count);
    const dayMaxs = dailyData.temperature_2m_max.slice(0, count);

    // Calculate global weekly extremes to calibrate the horizontal range bars
    const globalMin = Math.min(...dayMins);
    const globalMax = Math.max(...dayMaxs);
    const rangeSpan = Math.max(1, globalMax - globalMin);

    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < count; i++) {
      const rawDateStr = dailyData.time[i];
      // Note: Parse date string carefully to avoid timezone shift on plain YYYY-MM-DD
      const parts = rawDateStr.split('-');
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);

      const isToday = i === 0;
      const dayName = isToday ? 'Today' : dayNames[dateObj.getDay()];
      const dateLabel = `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;

      const minVal = dayMins[i];
      const maxVal = dayMaxs[i];

      // Apple Weather Spectrum range bar offsets
      const barLeft = Math.max(0, Math.min(100, ((minVal - globalMin) / rangeSpan) * 100));
      const barRight = Math.max(0, Math.min(100, ((maxVal - globalMin) / rangeSpan) * 100));
      const barWidth = Math.max(4, barRight - barLeft);

      // Current temperature dot position (only on Today)
      let dotPercent = null;
      if (isToday && typeof currentTempC === 'number') {
        const rawDot = ((currentTempC - globalMin) / rangeSpan) * 100;
        dotPercent = Math.max(0, Math.min(100, rawDot));
      }

      days.push({
        rawDate: rawDateStr,
        dayName,
        dateLabel,
        isToday,
        minTempC: minVal,
        maxTempC: maxVal,
        weatherCode: dailyData.weather_code[i],
        precipProb: dailyData.precipitation_probability_max ? dailyData.precipitation_probability_max[i] : 0,
        precipSum: dailyData.precipitation_sum ? dailyData.precipitation_sum[i] : 0,
        uvMax: dailyData.uv_index_max ? dailyData.uv_index_max[i] : 0,
        barLeftPercent: barLeft,
        barWidthPercent: barWidth,
        dotPercent: dotPercent
      });
    }

    return {
      days,
      globalMin,
      globalMax
    };
  },

  /**
   * Process Sunrise, Sunset, and Daylight Duration details
   */
  calculateSolarTimes(sunriseIso, sunsetIso) {
    if (!sunriseIso || !sunsetIso) {
      return {
        sunriseFormatted: '--:--',
        sunsetFormatted: '--:--',
        daylightDuration: '--',
        daylightProgressPercent: 50,
        sunPosition: 'Daylight in progress'
      };
    }

    const sunrise = new Date(sunriseIso);
    const sunset = new Date(sunsetIso);
    const now = new Date();

    const formatTime = (d) => {
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const fHours = hours % 12 || 12;
      const fMins = minutes < 10 ? `0${minutes}` : minutes;
      return `${fHours}:${fMins} ${ampm}`;
    };

    const sunriseFormatted = formatTime(sunrise);
    const sunsetFormatted = formatTime(sunset);

    // Calculate daylight duration in hours & minutes
    const diffMs = sunset.getTime() - sunrise.getTime();
    const diffMins = Math.max(0, Math.round(diffMs / 60000));
    const durHours = Math.floor(diffMins / 60);
    const durRemMins = diffMins % 60;
    const daylightDuration = `${durHours}h ${durRemMins}m`;

    // Progress percentage
    const nowMs = now.getTime();
    let daylightProgressPercent = 0;
    let sunPosition = '';

    if (nowMs < sunrise.getTime()) {
      daylightProgressPercent = 0;
      const minsToRise = Math.round((sunrise.getTime() - nowMs) / 60000);
      const hToRise = Math.floor(minsToRise / 60);
      const mToRise = minsToRise % 60;
      sunPosition = `Sunrise in ${hToRise > 0 ? `${hToRise}h ` : ''}${mToRise}m`;
    } else if (nowMs > sunset.getTime()) {
      daylightProgressPercent = 100;
      sunPosition = 'Sun set for today';
    } else {
      const elapsed = nowMs - sunrise.getTime();
      daylightProgressPercent = Math.min(100, Math.max(0, Math.round((elapsed / diffMs) * 100)));
      const minsToSet = Math.round((sunset.getTime() - nowMs) / 60000);
      const hToSet = Math.floor(minsToSet / 60);
      const mToSet = minsToSet % 60;
      sunPosition = `Sunset in ${hToSet > 0 ? `${hToSet}h ` : ''}${mToSet}m`;
    }

    return {
      sunriseFormatted,
      sunsetFormatted,
      daylightDuration,
      daylightProgressPercent,
      sunPosition
    };
  }
};
