(() => {
  'use strict';

  const STORAGE_KEY = 'wall-dashboard-settings-v1';
  const TASKS_KEY = 'wall-dashboard-tasks-v1';

  // Fixed home location: Helper Esweg 11A, 9722RP Groningen, Netherlands.
  const HOME_LAT = 53.1975;
  const HOME_LON = 6.5780;
  const HOME_PLACE = 'Helper Esweg, Groningen';

  const defaultSettings = {
    theme: 'auto',       // auto | light | dark
    units: 'c',          // f | c
    lat: HOME_LAT,
    lon: HOME_LON,
    place: HOME_PLACE,
  };

  const settings = Object.assign({}, defaultSettings, loadJSON(STORAGE_KEY, {}));
  // Location is fixed, not user-configurable - never let a stored value override it.
  settings.lat = HOME_LAT;
  settings.lon = HOME_LON;
  settings.place = HOME_PLACE;
  let tasks = loadJSON(TASKS_KEY, []);

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function saveSettings() { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
  function saveTasks() { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); }

  // ---------- Clock & date ----------
  const clockEl = document.getElementById('clock');
  const clockSecEl = document.getElementById('clock-seconds');
  const dayNameEl = document.getElementById('day-name');
  const fullDateEl = document.getElementById('full-date');

  function tickClock() {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    clockEl.textContent = `${h}:${m}`;
    clockSecEl.textContent = `${s}s · ${ampm}`;

    dayNameEl.textContent = now.toLocaleDateString(undefined, { weekday: 'long' });
    fullDateEl.textContent = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

    applyAutoTheme(now);
  }

  // ---------- Theme (auto day/night, or manual) ----------
  function applyAutoTheme(now) {
    if (settings.theme !== 'auto') return;
    const hour = now.getHours();
    const isDay = hour >= 7 && hour < 20;
    document.documentElement.setAttribute('data-theme', isDay ? 'light' : 'dark');
  }
  function applyTheme() {
    if (settings.theme === 'auto') {
      applyAutoTheme(new Date());
    } else {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }

  // ---------- Weather ----------
  const WMO_ICON = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌧️', 53: '🌧️', 55: '🌧️',
    56: '🌨️', 57: '🌨️',
    61: '🌧️', 63: '🌧️', 65: '🌧️',
    66: '🌨️', 67: '🌨️',
    71: '🌨️', 73: '🌨️', 75: '❄️', 77: '❄️',
    80: '🌦️', 81: '🌦️', 82: '⛈️',
    85: '🌨️', 86: '🌨️',
    95: '⛈️', 96: '⛈️', 99: '⛈️',
  };
  const WMO_DESC = {
    0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    56: 'Freezing drizzle', 57: 'Freezing drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    66: 'Freezing rain', 67: 'Freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers',
    85: 'Snow showers', 86: 'Snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Thunderstorm w/ hail',
  };

  const wxIconEl = document.getElementById('wx-icon');
  const wxTempEl = document.getElementById('wx-temp');
  const wxDescEl = document.getElementById('wx-desc');
  const wxHiEl = document.getElementById('wx-hi');
  const wxLoEl = document.getElementById('wx-lo');
  const wxPlaceEl = document.getElementById('wx-place');
  const hourlyStripEl = document.getElementById('hourly-strip');

  const WEATHER_CACHE_KEY = 'wall-dashboard-weather-cache-v1';

  function unitSuffix() { return settings.units === 'c' ? 'C' : 'F'; }

  function renderWeather(data) {
    const tempUnit = settings.units === 'c' ? 'temperature_2m' : null;
    const cur = data.current;
    const daily = data.daily;
    wxIconEl.textContent = WMO_ICON[cur.weather_code] || '⛅';
    wxTempEl.textContent = `${Math.round(cur.temperature_2m)}°${unitSuffix()}`;
    wxDescEl.textContent = WMO_DESC[cur.weather_code] || '—';
    wxHiEl.textContent = `${Math.round(daily.temperature_2m_max[0])}°`;
    wxLoEl.textContent = `${Math.round(daily.temperature_2m_min[0])}°`;
    wxPlaceEl.textContent = settings.place || 'Current location';

    hourlyStripEl.innerHTML = '';
    const nowIso = new Date().toISOString().slice(0, 13);
    let startIdx = data.hourly.time.findIndex((t) => t.slice(0, 13) === nowIso);
    if (startIdx < 0) startIdx = 0;
    for (let i = startIdx; i < startIdx + 5 && i < data.hourly.time.length; i++) {
      const t = new Date(data.hourly.time[i]);
      const tile = document.createElement('div');
      tile.className = 'hour-tile';
      tile.innerHTML = `
        <div class="h-time">${t.getHours() % 12 || 12}${t.getHours() >= 12 ? 'p' : 'a'}</div>
        <div class="h-icon">${WMO_ICON[data.hourly.weather_code[i]] || '⛅'}</div>
        <div class="h-temp">${Math.round(data.hourly.temperature_2m[i])}°</div>`;
      hourlyStripEl.appendChild(tile);
    }
  }

  async function fetchWeather() {
    const tempUnitParam = settings.units === 'c' ? 'celsius' : 'fahrenheit';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${settings.lat}&longitude=${settings.lon}` +
      `&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min&temperature_unit=${tempUnitParam}` +
      `&timezone=auto&forecast_days=1`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('weather fetch failed');
      const data = await res.json();
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
      renderWeather(data);
    } catch (err) {
      const cached = loadJSON(WEATHER_CACHE_KEY, null);
      if (cached) {
        renderWeather(cached.data);
        wxDescEl.textContent += ' (offline)';
      } else {
        wxDescEl.textContent = 'Weather unavailable';
      }
    }
  }

  // ---------- Tasks ----------
  const taskListEl = document.getElementById('task-list');
  const taskEmptyEl = document.getElementById('task-empty');
  const tasksCardEl = document.querySelector('.tasks-card');

  function renderTasks() {
    taskListEl.innerHTML = '';
    tasksCardEl.classList.toggle('empty', tasks.length === 0);
    tasks.forEach((task, idx) => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.done ? ' done' : '');
      li.innerHTML = `
        <button class="task-check" aria-label="Toggle done">${task.done ? '✓' : ''}</button>
        <span class="task-text"></span>
        <button class="task-remove" aria-label="Remove">&times;</button>`;
      li.querySelector('.task-text').textContent = task.text;
      li.querySelector('.task-check').addEventListener('click', () => {
        tasks[idx].done = !tasks[idx].done;
        saveTasks();
        renderTasks();
      });
      li.querySelector('.task-remove').addEventListener('click', () => {
        tasks.splice(idx, 1);
        saveTasks();
        renderTasks();
      });
      taskListEl.appendChild(li);
    });
  }

  document.getElementById('add-task-btn').addEventListener('click', () => {
    const text = prompt('New task:');
    if (text && text.trim()) {
      tasks.push({ text: text.trim(), done: false });
      saveTasks();
      renderTasks();
    }
  });

  // ---------- Quote of the day ----------
  const QUOTES = [
    'Small steps every day.',
    'Home is where the wifi connects automatically.',
    'A tidy list makes a tidy mind.',
    'Drink some water.',
    'Today is a good day to do one hard thing.',
    'Family first.',
    'Slow down, it’s not a race.',
    'Take a breath before you react.',
  ];
  function renderQuote() {
    const dayIndex = Math.floor(Date.now() / 86400000);
    document.getElementById('quote-strip').textContent = QUOTES[dayIndex % QUOTES.length];
  }

  // ---------- Settings modal ----------
  const backdrop = document.getElementById('settings-backdrop');
  const themeSelect = document.getElementById('theme-select');
  const unitsSelect = document.getElementById('units-select');

  function openSettings() {
    themeSelect.value = settings.theme;
    unitsSelect.value = settings.units;
    backdrop.classList.add('open');
  }
  function closeSettings() { backdrop.classList.remove('open'); }

  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('close-settings-btn').addEventListener('click', closeSettings);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeSettings(); });

  document.getElementById('save-settings-btn').addEventListener('click', () => {
    settings.theme = themeSelect.value;
    settings.units = unitsSelect.value;
    saveSettings();
    applyTheme();
    closeSettings();
    fetchWeather();
  });

  // ---------- Wake Lock (keep the wall display awake) ----------
  let wakeLock = null;
  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch {
      // Wake lock unavailable (e.g. low battery, unsupported browser) - ignore.
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestWakeLock();
  });

  // ---------- Service worker (offline shell) ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // ---------- Init ----------
  applyTheme();
  renderTasks();
  renderQuote();
  tickClock();
  setInterval(tickClock, 1000);
  requestWakeLock();

  const cached = loadJSON(WEATHER_CACHE_KEY, null);
  if (cached) renderWeather(cached.data);
  fetchWeather();
  setInterval(fetchWeather, 15 * 60 * 1000);
})();
