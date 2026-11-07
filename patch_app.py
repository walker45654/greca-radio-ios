import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update fetchUniversalPost
old_post = """    // 1. Native Android Plugin (Direct Java HttpURLConnection - 0% CORS, 100% SUCCESS)
    try {
      const cap = (typeof window !== "undefined" && window.Capacitor) ? window.Capacitor : null;
      if (cap && cap.Plugins && cap.Plugins.NativeMediaSession && typeof cap.Plugins.NativeMediaSession.httpPost === "function") {
        const res = await cap.Plugins.NativeMediaSession.httpPost({ url: url, data: bodyStr });
        if (res && res.data) {
          if (typeof res.data === "object") return res.data;
          try {
            return JSON.parse(res.data);
          } catch (_) {
            return res.data;
          }
        }
      }
    } catch (nativeErr) {}"""

new_post = """    // 1. Native Android Plugin (Direct Java HttpURLConnection - 0% CORS, 100% SUCCESS)
    try {
      const cap = (typeof window !== "undefined" && window.Capacitor) ? window.Capacitor : null;
      if (cap) {
        let res = null;
        if (cap.Plugins && cap.Plugins.NativeMediaSession && typeof cap.Plugins.NativeMediaSession.httpPost === "function") {
          res = await cap.Plugins.NativeMediaSession.httpPost({ url: url, data: bodyStr });
        } else if (typeof cap.nativePromise === "function") {
          res = await cap.nativePromise("NativeMediaSession", "httpPost", { url: url, data: bodyStr });
        }
        if (res && res.data) {
          if (typeof res.data === "object") return res.data;
          try {
            return JSON.parse(typeof res.data === "string" ? res.data.trim() : res.data);
          } catch (_) {
            return res.data;
          }
        }
      }
    } catch (nativeErr) {}"""

if old_post in content:
    content = content.replace(old_post, new_post, 1)
    print("1. fetchUniversalPost updated.")
else:
    print("1. fetchUniversalPost pattern not found.")

# 2. Update fetchLiveStationHistory lock
old_hist = """  let isFetchingLiveStationHistory = false;
  async function fetchLiveStationHistory(slug = "main") {
    if (isFetchingLiveStationHistory) return null;
    isFetchingLiveStationHistory = true;"""

new_hist = """  let isFetchingStationHistoryBySlug = {};
  async function fetchLiveStationHistory(slug = "main") {
    if (isFetchingStationHistoryBySlug[slug]) return null;
    isFetchingStationHistoryBySlug[slug] = true;"""

if old_hist in content:
    content = content.replace(old_hist, new_hist, 1)
    print("2. fetchLiveStationHistory lock updated.")
else:
    print("2. fetchLiveStationHistory lock pattern not found.")

# 3. Update rawItems parsing
old_raw = """          if (rawItems && Array.isArray(rawItems) && rawItems.length > 0) {"""
new_raw = """          let itemsList = null;
          if (Array.isArray(rawItems)) {
            itemsList = rawItems;
          } else if (rawItems && typeof rawItems === "object") {
            itemsList = Object.values(rawItems);
          } else if (typeof rawItems === "string" && rawItems.trim().startsWith("[")) {
            try {
              itemsList = JSON.parse(rawItems.trim());
            } catch (_) {}
          }

          if (itemsList && Array.isArray(itemsList) && itemsList.length > 0) {"""

if old_raw in content:
    content = content.replace(old_raw, new_raw, 1)
    content = content.replace("for (const entry of rawItems) {", "for (const entry of itemsList) {", 1)
    content = content.replace("if (tracks.length >= 2) {", "if (tracks.length >= 1) {", 1)
    print("3. rawItems parsing updated.")
else:
    print("3. rawItems pattern not found.")

# 4. Update finally block
old_fin = """    } finally {
      isFetchingLiveStationHistory = false;
    }"""
new_fin = """    } finally {
      isFetchingStationHistoryBySlug[slug] = false;
    }"""

if old_fin in content:
    content = content.replace(old_fin, new_fin, 1)
    print("4. finally block updated.")
else:
    print("4. finally block pattern not found.")

# 5. Update syncWebRadioHistoryFromCloud
old_syn = """  let lastWebHistorySyncTimes = {};
  let isSyncingWebHistory = {};
  async function syncWebRadioHistoryFromCloud(slug, force = false) {
    if (!slug || slug === "main") return;
    const now = Date.now();
    const lastSync = lastWebHistorySyncTimes[slug] || 0;
    if (!force && (now - lastSync < 15000)) return;
    if (isSyncingWebHistory[slug]) return;
    isSyncingWebHistory[slug] = true;
    lastWebHistorySyncTimes[slug] = now;

    try {
      const liveHistory = await fetchLiveStationHistory(slug);
      if (liveHistory && Array.isArray(liveHistory) && liveHistory.length > 0) {"""

new_syn = """  let lastWebHistorySyncTimes = {};
  let isSyncingWebHistory = {};
  async function syncWebRadioHistoryFromCloud(slug, force = false) {
    if (!slug || slug === "main") return;
    const now = Date.now();
    const lastSync = lastWebHistorySyncTimes[slug] || 0;
    if (!force && (now - lastSync < 8000)) return;
    if (isSyncingWebHistory[slug]) return;
    isSyncingWebHistory[slug] = true;

    try {
      const liveHistory = await fetchLiveStationHistory(slug);
      if (liveHistory && Array.isArray(liveHistory) && liveHistory.length > 0) {
        lastWebHistorySyncTimes[slug] = now;"""

if old_syn in content:
    content = content.replace(old_syn, new_syn, 1)
    print("5. syncWebRadioHistoryFromCloud updated.")
else:
    print("5. syncWebRadioHistoryFromCloud pattern not found.")

# 6. Update syncStationNowPlayingAndHistory signature and call
old_snph = """  async function syncStationNowPlayingAndHistory(stationSlug) {"""
new_snph = """  async function syncStationNowPlayingAndHistory(stationSlug, force = false) {"""

if old_snph in content:
    content = content.replace(old_snph, new_snph, 1)
    print("6. syncStationNowPlayingAndHistory signature updated.")
else:
    print("6. syncStationNowPlayingAndHistory signature pattern not found.")

old_snph_call = """        // 2. Always sync authentic real broadcast history from WordPress for this web radio!
        await syncWebRadioHistoryFromCloud(slug, false);"""
new_snph_call = """        // 2. Always sync authentic real broadcast history from WordPress for this web radio!
        await syncWebRadioHistoryFromCloud(slug, force || (slug === getCurrentStationSlug()));"""

if old_snph_call in content:
    content = content.replace(old_snph_call, new_snph_call, 1)
    print("7. syncStationNowPlayingAndHistory web radio call updated.")
else:
    print("7. syncStationNowPlayingAndHistory web radio call pattern not found.")

# 8. Update tuneStation network sync timeout
old_tune_sync = """    // 3. Fast background network synchronization only if station changed
    if (stationChanged) {
      setTimeout(() => {
        if (thisTuneId === currentTuneId) {
          syncStationNowPlayingAndHistory(slug);
        }
      }, 250);
    }"""

new_tune_sync = """    // 3. Fast background network synchronization only if station changed
    if (stationChanged) {
      setTimeout(() => {
        if (thisTuneId === currentTuneId) {
          syncStationNowPlayingAndHistory(slug, true);
        }
      }, 150);
    }"""

if old_tune_sync in content:
    content = content.replace(old_tune_sync, new_tune_sync, 1)
    print("8. tuneStation sync updated.")
else:
    print("8. tuneStation sync pattern not found.")

# 9. Update initGrecaApp startup sequence
old_init = """    // 2. Immediate live background sync for active station
    syncStationNowPlayingAndHistory(getCurrentStationSlug());

    // 2b. Staggered background sync of authentic live broadcast history for all web radios on app start!
    if (DATA && Array.isArray(DATA.channels)) {
      DATA.channels.forEach((ch, idx) => {
        if (ch.slug && ch.slug !== "main") {
          setTimeout(() => {
            syncWebRadioHistoryFromCloud(ch.slug, true);
          }, 350 + idx * 250);
        }
      });
    }"""

new_init = """    // 2. Immediate live background sync for active station
    syncStationNowPlayingAndHistory(getCurrentStationSlug(), true);

    // 2b. Immediate live broadcast history fetch for all web radios on app start!
    if (DATA && Array.isArray(DATA.channels)) {
      DATA.channels.forEach((ch, idx) => {
        if (ch.slug && ch.slug !== "main") {
          setTimeout(() => {
            syncWebRadioHistoryFromCloud(ch.slug, true);
          }, 100 + idx * 150);
        }
      });
    }"""

if old_init in content:
    content = content.replace(old_init, new_init, 1)
    print("9. initGrecaApp updated.")
else:
    print("9. initGrecaApp pattern not found.")

# 10. Update visibilitychange
old_vis = """            const currentSlug = getCurrentStationSlug();
            syncStationNowPlayingAndHistory(currentSlug);
            if (currentSlug === "main" && typeof syncMainStationHistoryFromCloud === "function") {
              setTimeout(() => {
                if (!isBuffering && !isSwitchingStation) {
                  syncMainStationHistoryFromCloud(false);
                }
              }, 1200);
            } else if (typeof syncWebRadioHistoryFromCloud === "function") {
              setTimeout(() => {
                if (!isBuffering && !isSwitchingStation) {
                  syncWebRadioHistoryFromCloud(currentSlug, true);
                }
              }, 800);
            }"""

new_vis = """            const currentSlug = getCurrentStationSlug();
            syncStationNowPlayingAndHistory(currentSlug, true);
            if (currentSlug === "main" && typeof syncMainStationHistoryFromCloud === "function") {
              setTimeout(() => {
                if (!isBuffering && !isSwitchingStation) {
                  syncMainStationHistoryFromCloud(true);
                }
              }, 800);
            } else if (typeof syncWebRadioHistoryFromCloud === "function") {
              setTimeout(() => {
                if (!isBuffering && !isSwitchingStation) {
                  syncWebRadioHistoryFromCloud(currentSlug, true);
                }
              }, 500);
            }"""

if old_vis in content:
    content = content.replace(old_vis, new_vis, 1)
    print("10. visibilitychange updated.")
else:
    print("10. visibilitychange pattern not found.")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied to app.js successfully!")
