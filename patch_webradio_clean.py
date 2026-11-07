import sys

path = r'C:\Users\user\.gemini\antigravity-ide\scratch\greca-radio-app\app.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update storage keys
content = content.replace(
    'const STORAGE_KEY_RECENT_STATIONS = "greca_recent_by_station_v17";',
    'const STORAGE_KEY_RECENT_STATIONS = "greca_recent_by_station_v18";\n  const STORAGE_KEY_TRACK_ARTWORKS = "greca_track_artworks_v8";'
)

# 2. Fix cleanWebRadioTrackList artwork fallback
old_cut = '''        if (t.length > ct.length && t.startsWith(ct)) {
          c.title = t;
          c.artist = a;
          c.image = (ch && ch.artworkUrl) || sanitizeArtworkUrl(item.image, ch);
          isDuplicateOrCut = true;
          break;
        }'''
new_cut = '''        if (t.length > ct.length && t.startsWith(ct)) {
          c.title = t;
          c.artist = a;
          const stLogo = (ch && ch.image) || (ch && ch.logo) || getStationDefaultCover(ch);
          c.image = (item.image && !item.image.includes("artwork.jpg") && !item.image.includes("main.png")) ? sanitizeArtworkUrl(item.image, ch) : stLogo;
          isDuplicateOrCut = true;
          break;
        }'''
assert old_cut in content, 'old_cut not found'
content = content.replace(old_cut, new_cut, 1)

# 3. Update trackArtCache init
old_cache_init = '''  const trackArtCache = {};
  try {
    const storedArts = localStorage.getItem("greca_track_artworks_v7");
    if (storedArts) Object.assign(trackArtCache, JSON.parse(storedArts));
  } catch(e) {}'''

new_cache_init = '''  const trackArtCache = {};
  try {
    localStorage.removeItem("greca_recent_by_station_v17");
    localStorage.removeItem("greca_track_artworks_v7");
    const storedArts = localStorage.getItem(STORAGE_KEY_TRACK_ARTWORKS);
    if (storedArts) Object.assign(trackArtCache, JSON.parse(storedArts));
  } catch(e) {}'''
assert old_cache_init in content, 'old_cache_init not found'
content = content.replace(old_cache_init, new_cache_init, 1)

# Replace all other instances of greca_track_artworks_v7
content = content.replace('"greca_track_artworks_v7"', 'STORAGE_KEY_TRACK_ARTWORKS')

# 4. Update renderRecentlyPlayed Web Radios block
old_rend_block = '''      } else {
        // Web Radios:
        // Slot 0 (currently playing track on that webradio) MUST display the EXACT same artwork as the player!
        const isCurrentStation = (getCurrentStationSlug() === slug);
        const onAirArt = sanitizeArtworkUrl(liveNowOnAir.artwork, currentChannel);
        const savedArt = trackArtCache[cacheKey];
        const existingImg = (item.image && !item.image.includes("mayro logo") && item.image !== stationLogo) ? item.image : null;
        
        if (idx === 0 && isCurrentStation && onAirArt && !onAirArt.includes("main.png") && !onAirArt.includes("mayro logo")) {
          itemArt = onAirArt;
          item.image = onAirArt;
          if (cacheKey) {
            trackArtCache[cacheKey] = onAirArt;
            try { localStorage.setItem(STORAGE_KEY_TRACK_ARTWORKS, JSON.stringify(trackArtCache)); } catch(e) {}
          }
        } else if (idx === 0 && liveWebRadioNowPlaying[slug] && liveWebRadioNowPlaying[slug].image && !liveWebRadioNowPlaying[slug].image.includes("main.png")) {
          itemArt = liveWebRadioNowPlaying[slug].image;
          item.image = liveWebRadioNowPlaying[slug].image;
          if (cacheKey) {
            trackArtCache[cacheKey] = itemArt;
            try { localStorage.setItem(STORAGE_KEY_TRACK_ARTWORKS, JSON.stringify(trackArtCache)); } catch(e) {}
          }
        } else if (savedArt) {
          // Keep the exact cover this song had when it was first!
          itemArt = savedArt;
          item.image = savedArt;
        } else if (existingImg) {
          // Keep its existing cover!
          itemArt = existingImg;
        } else if (sanitized && !sanitized.includes("artwork.jpg") && !sanitized.includes("main.png") && !sanitized.includes("mayro logo")) {
          itemArt = sanitized;
        } else {
          itemArt = stationLogo;
        }
      }'''

new_rend_block = '''      } else {
        // Web Radios: Strictly 1-to-1 matching.
        // A card only receives live artwork if its title actually MATCHES what is playing on air!
        const isCurrentStation = (getCurrentStationSlug() === slug);
        const liveTitle = (isCurrentStation && liveNowOnAir && liveNowOnAir.title)
          ? liveNowOnAir.title.trim().toUpperCase().replace(/\\(.*?\\)/g, "").replace(/\\[.*?\\]/g, "").replace(/-.*/g, "").trim()
          : "";
        const cardTitle = cleanT.toUpperCase();
        const isMatchLive = liveTitle && (cardTitle === liveTitle || cardTitle.includes(liveTitle) || liveTitle.includes(cardTitle));

        if (isMatchLive && liveNowOnAir.artwork && !liveNowOnAir.artwork.includes("main.png") && !liveNowOnAir.artwork.includes("mayro logo")) {
          itemArt = liveNowOnAir.artwork;
          item.image = liveNowOnAir.artwork;
          if (cacheKey && !liveNowOnAir.artwork.includes("artwork.jpg")) {
            trackArtCache[cacheKey] = itemArt;
            try { localStorage.setItem(STORAGE_KEY_TRACK_ARTWORKS, JSON.stringify(trackArtCache)); } catch(e) {}
          }
        } else if (sanitized && !sanitized.includes("artwork.jpg") && !sanitized.includes("main.png") && sanitized !== stationLogo) {
          itemArt = sanitized;
        } else if (trackArtCache[cacheKey]) {
          itemArt = trackArtCache[cacheKey];
        } else {
          itemArt = stationLogo;
        }
      }'''
assert old_rend_block in content, 'old_rend_block not found'
content = content.replace(old_rend_block, new_rend_block, 1)

# 5. Add confirmedWebNowOnAir tracking in applyNowPlayingTrack
old_apply_end = '''    if (slug === getCurrentStationSlug()) {
      liveNowOnAir.title = cleanT;
      liveNowOnAir.artist = cleanA;
      liveNowOnAir.artwork = effectiveArt;
      syncLiveMetadata();
      updateOnAirPlayerBadge();
      updateAllFavoriteStates();
    }
    return;'''

new_apply_end = '''    if (slug === getCurrentStationSlug()) {
      liveNowOnAir.title = cleanT;
      liveNowOnAir.artist = cleanA;
      liveNowOnAir.artwork = effectiveArt;
      syncLiveMetadata();
      updateOnAirPlayerBadge();
      updateAllFavoriteStates();
    }
    confirmedWebNowOnAir[slug] = {
      title: cleanT,
      artist: cleanA,
      artwork: effectiveArt,
      time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
    };
    return;'''
assert old_apply_end in content, 'old_apply_end not found'
content = content.replace(old_apply_end, new_apply_end, 1)

# Declare confirmedWebNowOnAir near confirmedNowOnAirTrack
old_conf = 'let confirmedNowOnAirTrack = null;'
new_conf = 'let confirmedNowOnAirTrack = null;\n  let confirmedWebNowOnAir = {};'
assert old_conf in content, 'old_conf not found'
content = content.replace(old_conf, new_conf, 1)

# 6. Update syncWebRadioHistoryFromCloud
start_marker = '  async function syncWebRadioHistoryFromCloud(slug, force = false) {'
end_marker = '  // -----------------------------------------------------------------\n  // Dual-Engine Live Sync (Local API Server + Direct Cloud Fallback)'
start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)
assert start_idx != -1 and end_idx != -1, 'syncWebRadioHistoryFromCloud boundaries not found'

new_sync_func = '''  async function syncWebRadioHistoryFromCloud(slug, force = false) {
    if (!slug || slug === "main") return;
    const now = Date.now();
    const lastSync = lastWebHistorySyncTimes[slug] || 0;
    if (!force && (now - lastSync < 8000)) return;
    if (isSyncingWebHistory[slug]) return;
    isSyncingWebHistory[slug] = true;

    try {
      const liveHistory = await fetchLiveStationHistory(slug);
      if (liveHistory && Array.isArray(liveHistory) && liveHistory.length > 0) {
        lastWebHistorySyncTimes[slug] = now;
        const isActive = (getCurrentStationSlug() === slug);
        const ch = (DATA.channels && DATA.channels.find(c => c.slug === slug)) || (DATA.channels && DATA.channels[0]);
        const fallbackArtist = getStationFallbackArtist(ch);
        const stLogo = (ch && ch.image) || (ch && ch.logo) || getStationDefaultCover(ch);
        const merged = [];

        // Identify current live on-air track for this web radio (from nowplaying.txt / RadioBoss)
        const liveTrack = confirmedWebNowOnAir[slug] || (isActive && liveNowOnAir && liveNowOnAir.title ? {
          title: liveNowOnAir.title,
          artist: liveNowOnAir.artist || fallbackArtist,
          artwork: liveNowOnAir.artwork,
          time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
        } : null);

        const hasLiveOnAir = liveTrack && liveTrack.title && isValidTrackText(liveTrack.title);
        const topHistoryTitle = liveHistory[0] && (liveHistory[0].title || "").trim().toUpperCase();

        const normLiveT = hasLiveOnAir ? liveTrack.title.trim().toUpperCase().replace(/\\(.*?\\)/g, "").replace(/\\[.*?\\]/g, "").replace(/-.*/g, "").trim() : "";
        const normTopT = topHistoryTitle ? topHistoryTitle.replace(/\\(.*?\\)/g, "").replace(/\\[.*?\\]/g, "").replace(/-.*/g, "").trim() : "";

        const isSameAsTop = normLiveT && normTopT && (normLiveT === normTopT || normLiveT.includes(normTopT) || normTopT.includes(normLiveT));

        // 1. If live on-air song is actively playing and WordPress history has not registered it yet:
        // PREPEND it to the top! (Just like Greca FM 99.4 does with confirmedNowOnAirTrack!)
        if (hasLiveOnAir && !isSameAsTop) {
          const liveArt = (liveTrack.artwork && !liveTrack.artwork.includes("main.png")) ? sanitizeArtworkUrl(liveTrack.artwork, ch) : stLogo;
          merged.push({
            title: liveTrack.title.trim().toUpperCase(),
            artist: (liveTrack.artist || fallbackArtist).trim().toUpperCase(),
            time: liveTrack.time || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
            image: liveArt,
            hasResolvedArt: true
          });
          const cKey = `${(liveTrack.artist || '').trim()}_${normLiveT}`.toUpperCase().replace(/\\s+/g, " ");
          if (liveArt && liveArt !== stLogo && !liveArt.includes("artwork.jpg")) {
            trackArtCache[cKey] = liveArt;
            try { localStorage.setItem(STORAGE_KEY_TRACK_ARTWORKS, JSON.stringify(trackArtCache)); } catch(e) {}
          }
        }

        // 2. Add authentic songs from WordPress broadcast history:
        for (const item of liveHistory) {
          if (merged.length >= 5) break;
          const itemTitle = (item.title || "").trim().toUpperCase();
          const normItemTitle = itemTitle.replace(/\\(.*?\\)/g, "").replace(/\\[.*?\\]/g, "").replace(/-.*/g, "").trim();

          if (!merged.some(m => {
            const mTitle = (m.title || "").trim().toUpperCase().replace(/\\(.*?\\)/g, "").replace(/\\[.*?\\]/g, "").replace(/-.*/g, "").trim();
            return mTitle === normItemTitle;
          })) {
            const cleanT = normItemTitle;
            const cleanA = (item.artist || "").replace(/GRECA.*/gi, "").replace(/WEB.*/gi, "").trim().toUpperCase();
            const cKey = `${cleanA}_${cleanT}`.toUpperCase().replace(/\\s+/g, " ");

            let itemArt = stLogo;
            // A. If WordPress provided an authentic album artwork (prsidekick_art):
            if (item.image && !item.image.includes("artwork.jpg") && !item.image.includes("main.png") && item.image !== stLogo) {
              itemArt = sanitizeArtworkUrl(item.image, ch);
            }
            // B. Or if we have a verified cached artwork for THIS EXACT track:
            else if (trackArtCache[cKey]) {
              itemArt = trackArtCache[cKey];
            }
            // C. Or if this history item IS the current live on-air song:
            else if (isSameAsTop && item === liveHistory[0] && liveTrack && liveTrack.artwork && !liveTrack.artwork.includes("main.png")) {
              itemArt = sanitizeArtworkUrl(liveTrack.artwork, ch);
              trackArtCache[cKey] = itemArt;
              try { localStorage.setItem(STORAGE_KEY_TRACK_ARTWORKS, JSON.stringify(trackArtCache)); } catch(e) {}
            }
            // D. Otherwise: Clean station logo. NEVER steal another song's artwork!
            else {
              itemArt = stLogo;
            }

            merged.push({
              ...item,
              image: itemArt,
              hasResolvedArt: true
            });
          }
        }

        // 3. Guarantee ALWAYS 5 songs! Pad with existing items if WordPress returned fewer than 5 (e.g. party)
        const existingList = stationHistories[slug] || [];
        if (merged.length < 5) {
          for (const oldItem of existingList) {
            if (merged.length >= 5) break;
            const oldTitle = (oldItem.title || "").trim().toUpperCase().replace(/\\(.*?\\)/g, "").replace(/\\[.*?\\]/g, "").replace(/-.*/g, "").trim();
            if (!merged.some(m => (m.title || "").trim().toUpperCase().replace(/\\(.*?\\)/g, "").replace(/\\[.*?\\]/g, "").replace(/-.*/g, "").trim() === oldTitle)) {
              merged.push(oldItem);
            }
          }
        }

        const currentList = stationHistories[slug] || [];
        const oldSignature = currentList.map(t => `${t.title}_${t.time}`).join("|");
        const newSignature = merged.map(t => `${t.title}_${t.time}`).join("|");

        if (oldSignature !== newSignature && merged.length > 0) {
          stationHistories[slug] = merged.slice(0, 5);
          saveStationHistories();
          if (getCurrentStationSlug() === slug) {
            renderRecentlyPlayed();
          }
          if (stationHistories[slug][0]) {
            liveWebRadioNowPlaying[slug] = {
              artist: stationHistories[slug][0].artist,
              title: stationHistories[slug][0].title,
              image: stationHistories[slug][0].image
            };
          }
        }
      }
    } catch (err) {
      console.warn("syncWebRadioHistoryFromCloud error", err);
    } finally {
      isSyncingWebHistory[slug] = false;
    }
  }

'''

content = content[:start_idx] + new_sync_func + content[end_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js successfully updated!')
