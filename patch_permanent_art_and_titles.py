import sys

path = r'C:\Users\user\.gemini\antigravity-ide\scratch\greca-radio-app\app.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update storage keys
content = content.replace(
    'const STORAGE_KEY_RECENT_STATIONS = "greca_recent_by_station_v19";',
    'const STORAGE_KEY_RECENT_STATIONS = "greca_recent_by_station_v20";\n  const STORAGE_KEY_TRACK_ARTWORKS = "greca_track_artworks_v9";'
)
old_storage_purge = '''    localStorage.removeItem("greca_recent_by_station_v17");
    localStorage.removeItem("greca_recent_by_station_v18");'''
new_storage_purge = '''    localStorage.removeItem("greca_recent_by_station_v17");
    localStorage.removeItem("greca_recent_by_station_v18");
    localStorage.removeItem("greca_recent_by_station_v19");
    localStorage.removeItem("greca_track_artworks_v8");'''
assert old_storage_purge in content, 'old_storage_purge not found'
content = content.replace(old_storage_purge, new_storage_purge, 1)

# 2. Add getBestTrackTitle right after isSameTrack
old_is_same_track_end = '''      const words1 = greekToLatin(raw1).toUpperCase().split(/\\s+/).filter(w => w.length >= 3 && !['LIVE', 'FEAT', 'RADIO', 'MIX', 'EDIT'].includes(w));
      const words2 = greekToLatin(raw2).toUpperCase().split(/\\s+/).filter(w => w.length >= 3 && !['LIVE', 'FEAT', 'RADIO', 'MIX', 'EDIT'].includes(w));
      if (words1.length > 0 && words2.length > 0 && words1.some(w => words2.includes(w))) return true;
    }
    return false;
  }'''

new_is_same_track_end = '''      const words1 = greekToLatin(raw1).toUpperCase().split(/\\s+/).filter(w => w.length >= 3 && !['LIVE', 'FEAT', 'RADIO', 'MIX', 'EDIT'].includes(w));
      const words2 = greekToLatin(raw2).toUpperCase().split(/\\s+/).filter(w => w.length >= 3 && !['LIVE', 'FEAT', 'RADIO', 'MIX', 'EDIT'].includes(w));
      if (words1.length > 0 && words2.length > 0 && words1.some(w => words2.includes(w))) return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // Anti-Truncation Engine: Always preserve the longest complete title!
  // Prevents WordPress cut-offs from overriding authentic titles.
  // -------------------------------------------------------------
  function getBestTrackTitle(newTitle, artist, slug) {
    if (!newTitle) return "";
    let best = String(newTitle).trim().toUpperCase();

    // 1. Check live track on air
    if (liveNowOnAir && liveNowOnAir.title) {
      const liveT = liveNowOnAir.title.trim().toUpperCase();
      if (liveT.length > best.length && isSameTrack(liveT, liveNowOnAir.artist, best, artist)) {
        best = liveT;
      }
    }

    // 2. Check confirmedWebNowOnAir
    if (confirmedWebNowOnAir && slug && confirmedWebNowOnAir[slug] && confirmedWebNowOnAir[slug].title) {
      const confT = confirmedWebNowOnAir[slug].title.trim().toUpperCase();
      if (confT.length > best.length && isSameTrack(confT, confirmedWebNowOnAir[slug].artist, best, artist)) {
        best = confT;
      }
    }

    // 3. Check existing histories
    if (stationHistories && slug && Array.isArray(stationHistories[slug])) {
      for (const item of stationHistories[slug]) {
        const oldT = (item && item.title) ? item.title.trim().toUpperCase() : "";
        if (oldT.length > best.length && isSameTrack(oldT, item.artist, best, artist)) {
          best = oldT;
          break;
        }
      }
    }
    return best;
  }'''
assert old_is_same_track_end in content, 'old_is_same_track_end not found'
content = content.replace(old_is_same_track_end, new_is_same_track_end, 1)

# 3. In resolveTrackArtwork: remove the web radio blocker so all stations can resolve authentic covers!
old_resolve_blocker = '''    // Strictly do not query external iTunes for any web radio!
    if (!isMainSt) {
      if (callback) callback(defaultArt);
      return defaultArt;
    }'''
new_resolve_blocker = '''    // Artwork resolver enabled for ALL stations (Web Radios + Main), exactly like normal station!'''
assert old_resolve_blocker in content, 'old_resolve_blocker not found'
content = content.replace(old_resolve_blocker, new_resolve_blocker, 1)

# 4. In renderRecentlyPlayed: enable background resolution for Web Radios so tracks never lose their covers when going to #2, #3, #4, #5!
old_render_art_res = '''      // For Web Radios: Strictly use RadioBoss or station default, zero external iTunes requests!
      if (slug !== "main") {
        item.hasResolvedArt = true;
      }

      // Only resolve external artwork in background for main station if image is totally missing or main fallback logo
      if (slug === "main" && !item.hasResolvedArt && (!itemArt || itemArt.includes("mayro logo") || itemArt === defaultFallback)) {
        const thumbEl = card.querySelector(`.track-thumb-${idx}`);
        const tId = setTimeout(() => {
          if (getCurrentStationSlug() !== "main") return;
          resolveTrackArtwork(item.artist, item.title, defaultFallback, (foundArt) => {
            item.hasResolvedArt = true;
            if (foundArt && foundArt !== defaultFallback && thumbEl) {
              thumbEl.src = foundArt;
              item.image = foundArt;
              saveStationHistories();

              if (idx === 0 && getCurrentStationSlug() === "main" && liveNowOnAir.title === item.title) {
                liveNowOnAir.artwork = foundArt;
                syncLiveMetadata();
              }
            }
          });
        }, 150 + idx * 250);
        pendingArtworkTimers.push(tId);
      }'''

new_render_art_res = '''      // Resolve external artwork in background for ALL stations (Web Radios + Main) if image is fallback logo or artwork.jpg!
      // This guarantees tracks at positions 2, 3, 4, 5 KEEP their authentic covers forever, exactly like normal station!
      const currentStationCoverFallback = (slug === "main") ? defaultFallback : stationLogo;
      const needsArtworkResolution = !item.hasResolvedArt || 
        !itemArt || 
        itemArt === currentStationCoverFallback || 
        itemArt.includes("main.png") || 
        itemArt.includes("mayro logo") || 
        itemArt.includes("assets/stations/") ||
        itemArt.includes("artwork.jpg");

      if (needsArtworkResolution) {
        const thumbEl = card.querySelector(`.track-thumb-${idx}`);
        const itemSlug = slug;
        const itemTitle = item.title;
        const itemArtist = item.artist;
        const tId = setTimeout(() => {
          if (getCurrentStationSlug() !== itemSlug) return;
          const fallbackToUse = (itemSlug === "main") ? defaultFallback : stationLogo;
          resolveTrackArtwork(itemArtist, itemTitle, fallbackToUse, (foundArt) => {
            item.hasResolvedArt = true;
            if (foundArt && foundArt !== fallbackToUse && !foundArt.includes("main.png")) {
              if (thumbEl) thumbEl.src = foundArt;
              item.image = foundArt;
              saveStationHistories();

              if (idx === 0 && getCurrentStationSlug() === itemSlug && liveNowOnAir.title === itemTitle) {
                liveNowOnAir.artwork = foundArt;
                syncLiveMetadata();
              }
            }
          });
        }, 150 + idx * 250);
        pendingArtworkTimers.push(tId);
      }'''
assert old_render_art_res in content, 'old_render_art_res not found'
content = content.replace(old_render_art_res, new_render_art_res, 1)

# 5. In applyNowPlayingTrack: also resolve authentic cover in background for Web Radios!
old_apply_end = '''    if (slug === getCurrentStationSlug()) {
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

    // If artwork is dynamic artwork.jpg or missing, resolve authentic permanent album cover in background!
    if (!cachedArtwork && (effectiveArt.includes("artwork.jpg") || effectiveArt.includes("main.png") || effectiveArt === defaultCover)) {
      const targetSlug = slug;
      const targetTitle = cleanT;
      const targetArtist = cleanA;
      const tId = setTimeout(() => {
        resolveTrackArtwork(targetArtist, targetTitle, defaultCover, (foundArt) => {
          if (foundArt && !foundArt.includes("main.png") && foundArt !== defaultCover) {
            trackArtCache[cKey] = foundArt;
            try {
              localStorage.setItem(STORAGE_KEY_TRACK_ARTWORKS, JSON.stringify(trackArtCache));
            } catch(e) {}
            if (confirmedWebNowOnAir[targetSlug]) {
              confirmedWebNowOnAir[targetSlug].artwork = foundArt;
            }
            if (getCurrentStationSlug() === targetSlug && liveNowOnAir.title === targetTitle) {
              liveNowOnAir.artwork = foundArt;
              syncLiveMetadata();
            }
            if (stationHistories[targetSlug] && stationHistories[targetSlug][0] && isSameTrack(stationHistories[targetSlug][0].title, stationHistories[targetSlug][0].artist, targetTitle, targetArtist)) {
              stationHistories[targetSlug][0].image = foundArt;
              saveStationHistories();
              if (getCurrentStationSlug() === targetSlug) {
                renderRecentlyPlayed();
              }
            }
          }
        });
      }, 300);
      pendingArtworkTimers.push(tId);
    }
    return;'''
assert old_apply_end in content, 'old_apply_end not found'
content = content.replace(old_apply_end, new_apply_end, 1)

# 6. In syncWebRadioHistoryFromCloud: use getBestTrackTitle so cut titles are never adopted
old_song_title = '''            // Prefer the longer, full live title if this item matches the live track:
            let songTitle = item.title;
            if (isSameAsTop && item === liveHistory[0] && liveTrack && liveTrack.title && liveTrack.title.length > songTitle.length) {
              songTitle = liveTrack.title;
            }'''

new_song_title = '''            // Always adopt the best (longest, complete) title available:
            let songTitle = getBestTrackTitle(item.title, item.artist, slug);'''
assert old_song_title in content, 'old_song_title not found'
content = content.replace(old_song_title, new_song_title, 1)

# In fetchLiveStationHistory: also use getBestTrackTitle
old_fetch_title = '''              let t = (s.prsidekick_song || s.title || "").trim();
              let a = (s.prsidekick_artist || s.artist || fallbackArtist).trim();'''
new_fetch_title = '''              let a = (s.prsidekick_artist || s.artist || fallbackArtist).trim();
              let rawT = (s.prsidekick_song || s.title || "").trim();
              let t = getBestTrackTitle(rawT, a, slug);'''
assert old_fetch_title in content, 'old_fetch_title not found'
content = content.replace(old_fetch_title, new_fetch_title, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js successfully patched with permanent artwork resolution and anti-truncation engine!')

