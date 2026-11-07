import sys

path = r'C:\Users\user\.gemini\antigravity-ide\scratch\greca-radio-app\app.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update storage key to v19
content = content.replace(
    'const STORAGE_KEY_RECENT_STATIONS = "greca_recent_by_station_v18";',
    'const STORAGE_KEY_RECENT_STATIONS = "greca_recent_by_station_v19";'
)
content = content.replace(
    'localStorage.removeItem("greca_recent_by_station_v17");',
    'localStorage.removeItem("greca_recent_by_station_v17");\n    localStorage.removeItem("greca_recent_by_station_v18");'
)

# 2. Add isSameTrack right after artistMatches
old_artist_matches_end = '''    for (const w of words) {
      if (greekToLatin(resultArtist).toUpperCase().includes(w)) return true;
    }
    return false;
  }'''

new_artist_matches_end = '''    for (const w of words) {
      if (greekToLatin(resultArtist).toUpperCase().includes(w)) return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // Bulletproof Track Deduplication (Detects cut titles & identical songs)
  // -------------------------------------------------------------
  function isSameTrack(t1, a1, t2, a2) {
    if (!t1 || !t2) return false;
    const raw1 = String(t1).trim().toUpperCase().replace(/\\(.*?\\)/g, "").replace(/\\[.*?\\]/g, "").replace(/-.*/g, "").trim();
    const raw2 = String(t2).trim().toUpperCase().replace(/\\(.*?\\)/g, "").replace(/\\[.*?\\]/g, "").replace(/-.*/g, "").trim();
    if (!raw1 || !raw2) return false;
    if (raw1 === raw2) return true;

    const norm1 = greekToLatin(raw1).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const norm2 = greekToLatin(raw2).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!norm1 || !norm2) return false;
    if (norm1 === norm2) return true;

    if (norm1.length >= 5 && (norm2.includes(norm1) || norm1.includes(norm2))) return true;

    const sameArtist = artistMatches(a1, a2);
    if (sameArtist) {
      const minLen = Math.min(norm1.length, norm2.length);
      const prefLen = Math.min(minLen, 5);
      if (prefLen >= 4 && norm1.slice(0, prefLen) === norm2.slice(0, prefLen)) return true;

      const words1 = greekToLatin(raw1).toUpperCase().split(/\\s+/).filter(w => w.length >= 3 && !['LIVE', 'FEAT', 'RADIO', 'MIX', 'EDIT'].includes(w));
      const words2 = greekToLatin(raw2).toUpperCase().split(/\\s+/).filter(w => w.length >= 3 && !['LIVE', 'FEAT', 'RADIO', 'MIX', 'EDIT'].includes(w));
      if (words1.length > 0 && words2.length > 0 && words1.some(w => words2.includes(w))) return true;
    }
    return false;
  }'''
assert old_artist_matches_end in content, 'old_artist_matches_end not found'
content = content.replace(old_artist_matches_end, new_artist_matches_end, 1)

# 3. Update cleanWebRadioTrackList to use isSameTrack
old_clean_loop = '''      for (let c of cleaned) {
        const ct = c.title.toUpperCase();
        if (ct === t) {
          isDuplicateOrCut = true;
          break;
        }
        if (t.length > ct.length && t.startsWith(ct)) {
          c.title = t;
          c.artist = a;
          const stLogo = (ch && ch.image) || (ch && ch.logo) || getStationDefaultCover(ch);
          c.image = (item.image && !item.image.includes("artwork.jpg") && !item.image.includes("main.png")) ? sanitizeArtworkUrl(item.image, ch) : stLogo;
          isDuplicateOrCut = true;
          break;
        }
        if (ct.length > t.length && ct.startsWith(t)) {
          isDuplicateOrCut = true;
          break;
        }
        if ((t.length >= 5 && t.includes(ct)) || (ct.length >= 5 && ct.includes(t))) {
          if (t.length > ct.length) {
            c.title = t;
            c.artist = a;
            const stLogo = (ch && ch.image) || (ch && ch.logo) || getStationDefaultCover(ch);
            c.image = (item.image && !item.image.includes("artwork.jpg") && !item.image.includes("main.png")) ? sanitizeArtworkUrl(item.image, ch) : stLogo;
          }
          isDuplicateOrCut = true;
          break;
        }
      }'''

new_clean_loop = '''      for (let c of cleaned) {
        if (isSameTrack(c.title, c.artist, t, a)) {
          if (t.length > (c.title || "").length) {
            c.title = t;
            c.artist = a;
            const stLogo = (ch && ch.image) || (ch && ch.logo) || getStationDefaultCover(ch);
            c.image = (item.image && !item.image.includes("artwork.jpg") && !item.image.includes("main.png")) ? sanitizeArtworkUrl(item.image, ch) : stLogo;
          }
          isDuplicateOrCut = true;
          break;
        }
      }'''
assert old_clean_loop in content, 'old_clean_loop not found'
content = content.replace(old_clean_loop, new_clean_loop, 1)

# 4. Update renderRecentlyPlayed deduplication
old_render_list = '''    const listToRender = (stationHistories[slug] || []).slice(0, 5);'''
new_render_list = '''    // Guarantee strict uniqueness when rendering Web Radios! (Main station FM 99.4 is 100% untouched)
    const rawList = (stationHistories[slug] || []);
    let listToRender = [];
    if (slug === "main") {
      listToRender = rawList.slice(0, 5);
    } else {
      for (const t of rawList) {
        if (listToRender.length >= 5) break;
        if (!listToRender.some(m => isSameTrack(m.title, m.artist, t.title, t.artist))) {
          listToRender.push(t);
        }
      }
    }'''
assert old_render_list in content, 'old_render_list not found'
content = content.replace(old_render_list, new_render_list, 1)

# 5. Update syncWebRadioHistoryFromCloud with isSameTrack
old_sync_webradio = '''        // Identify current live on-air track for this web radio (from nowplaying.txt / RadioBoss)
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
            const mTitle = (m.title || "").trim().toUpperCase().replace(/\\(.*?\\)/g, "").replace(/\[.*?\]/g, "").replace(/-.*/g, "").trim();
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
        }'''

new_sync_webradio = '''        // Identify current live on-air track for this web radio (from nowplaying.txt / RadioBoss)
        const liveTrack = confirmedWebNowOnAir[slug] || (isActive && liveNowOnAir && liveNowOnAir.title ? {
          title: liveNowOnAir.title,
          artist: liveNowOnAir.artist || fallbackArtist,
          artwork: liveNowOnAir.artwork,
          time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
        } : null);

        const hasLiveOnAir = liveTrack && liveTrack.title && isValidTrackText(liveTrack.title);
        const topHistoryTitle = liveHistory[0] && (liveHistory[0].title || "").trim();
        const topHistoryArtist = liveHistory[0] && (liveHistory[0].artist || "").trim();

        // Check if the live on-air track is already registered at the top of WordPress history
        const isSameAsTop = hasLiveOnAir && isSameTrack(liveTrack.title, liveTrack.artist, topHistoryTitle, topHistoryArtist);

        // 1. If live on-air song is actively playing and WordPress history has not registered it yet:
        // PREPEND it to the top!
        if (hasLiveOnAir && !isSameAsTop) {
          const liveArt = (liveTrack.artwork && !liveTrack.artwork.includes("main.png")) ? sanitizeArtworkUrl(liveTrack.artwork, ch) : stLogo;
          merged.push({
            title: liveTrack.title.trim().toUpperCase(),
            artist: (liveTrack.artist || fallbackArtist).trim().toUpperCase(),
            time: liveTrack.time || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
            image: liveArt,
            hasResolvedArt: true
          });
          const normLiveT = liveTrack.title.trim().toUpperCase().replace(/\\(.*?\\)/g, "").replace(/\\[.*?\\]/g, "").replace(/-.*/g, "").trim();
          const cKey = `${(liveTrack.artist || '').trim()}_${normLiveT}`.toUpperCase().replace(/\\s+/g, " ");
          if (liveArt && liveArt !== stLogo && !liveArt.includes("artwork.jpg")) {
            trackArtCache[cKey] = liveArt;
            try { localStorage.setItem(STORAGE_KEY_TRACK_ARTWORKS, JSON.stringify(trackArtCache)); } catch(e) {}
          }
        }

        // 2. Add authentic songs from WordPress broadcast history:
        for (const item of liveHistory) {
          if (merged.length >= 5) break;

          // STRICT DEDUPLICATION: If this song is already in merged (under any spelling/cut-off), DO NOT ADD IT!
          const alreadyInMerged = merged.some(m => isSameTrack(m.title, m.artist, item.title, item.artist));
          if (!alreadyInMerged) {
            const cleanT = (item.title || "").replace(/\\(.*?\\)/g, "").replace(/\\[.*?\\]/g, "").replace(/-.*/g, "").trim();
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

            // Prefer the longer, full live title if this item matches the live track:
            let songTitle = item.title;
            if (isSameAsTop && item === liveHistory[0] && liveTrack && liveTrack.title && liveTrack.title.length > songTitle.length) {
              songTitle = liveTrack.title;
            }

            merged.push({
              ...item,
              title: songTitle,
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
            const alreadyInMerged = merged.some(m => isSameTrack(m.title, m.artist, oldItem.title, oldItem.artist));
            if (!alreadyInMerged) {
              merged.push(oldItem);
            }
          }
        }'''
assert old_sync_webradio in content, 'old_sync_webradio not found'
content = content.replace(old_sync_webradio, new_sync_webradio, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js successfully patched with strict track deduplication!')

