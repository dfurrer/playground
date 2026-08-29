# Wall Dashboard

A lightweight, no-build, static dashboard designed for a phone mounted on the
wall in **portrait orientation** (built with a Galaxy S11 Ultra in mind, but
works on any modern mobile browser). No backend, no build step, no API keys —
just open `index.html`.

## What's on it

- **Clock & date** — large, readable from across the room.
- **Weather** — current conditions, high/low, and a 5-hour strip, from the
  free [Open-Meteo](https://open-meteo.com) API (no key required). Location is
  fixed to Helper Esweg, Groningen — no setup step needed.
- **Today's tasks** — a simple checklist saved to the device (`localStorage`),
  good for a shared household to-do list.
- **Daily quote** strip at the bottom.
- **Auto day/night theme** — light 7am–8pm, dark otherwise (or pin it to
  always-light / always-dark in Settings).
- Keeps the screen awake via the Wake Lock API while the tab is visible, and
  caches the app shell with a service worker so it still loads if wifi drops.

## Setting it up on the S11 Ultra

1. Host the `wall-dashboard/` folder somewhere reachable from the phone —
   easiest is a static host (GitHub Pages, Netlify, Vercel, or a Raspberry
   Pi / home server running any static file server). You can also test
   locally on your dev machine first:
   ```bash
   cd wall-dashboard
   python3 -m http.server 8080
   ```
2. On the phone, open the URL in **Chrome** or **Samsung Internet**.
3. Add it to the home screen: browser menu → **Add to Home screen** →
   **Install**. This makes it launch full-screen (no browser chrome) via the
   PWA manifest.
4. Launch it from the home screen icon, then mount the phone in its wall
   dock/case in portrait orientation.
5. In Android **Settings → Display → Screen timeout**, set it to the longest
   option (or "Never" if your device/kiosk case supports staying plugged in
   permanently) — the page's own wake lock only holds while it's the active,
   visible tab.
6. Optional but recommended for a dedicated wall panel: install a kiosk
   browser such as **Fully Kiosk Browser** and point it at the same URL —
   it handles auto-launch on boot, screen-always-on, and crash recovery
   better than a stock browser left open.

## Customizing

- Colors/tokens live at the top of `styles.css` under `:root` and
  `[data-theme="dark"]`.
- Swap `icons/icon.svg` for your own app icon.
- The task list and settings are per-device (`localStorage`) — clearing site
  data resets them.
- Day/night theme switch times are set in `applyAutoTheme()` in `app.js`
  (currently 7:00–20:00 = light).
- The home location (`HOME_LAT`/`HOME_LON`/`HOME_PLACE` at the top of
  `app.js`) is hardcoded to Helper Esweg, Groningen — change those three
  constants to move the dashboard elsewhere.
