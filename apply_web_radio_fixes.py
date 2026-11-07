with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update applyNowPlayingTrack for WEB RADIOS
old_apply_block = """    // For WEB RADIOS: Use RadioBoss artwork and record song transitions cleanly
    let alreadyRecorded = false;
    for (let i = 0; i < historyList.length; i++) {
      const oldT = (historyList[i].title || "").toUpperCase().replace(/\\ufffd/g, "").trim();
      if (oldT === cleanT) {
        alreadyRecorded = true;
        break;
      }
      if (cleanT.length > oldT.length && cleanT.startsWith(oldT)) {
        historyList[i].title = cleanT;
        historyList[i].artist = cleanA;
        saveStationHistories();
        if (slug === getCurrentStationSlug()) {
          renderRecentlyPlayed();
        }
        alreadyRecorded = true;
        break;
      }
      if (oldT.length > cleanT.length && oldT.startsWith(cleanT)) {
        alreadyRecorded = true;
        break;
      }
    }

    if (alreadyRecorded) {
      if (slug === getCurrentStationSlug()) {
        liveNowOnAir.title = cleanT;
        liveNowOnAir.artist = cleanA;
        liveNowOnAir.artwork = effectiveArt;
        syncLiveMetadata();
      }
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    while (historyList.length >= 5) {
      historyList.pop();
    }

    historyList.unshift({
      title: cleanT,
      artist: cleanA,
      time: timeStr,
      image: effectiveArt,
      hasResolvedArt: true
    });

    saveStationHistories();

    if (slug === getCurrentStationSlug()) {
      liveNowOnAir.title = cleanT;
      liveNowOnAir.artist = cleanA;
      liveNowOnAir.artwork = effectiveArt;
      syncLiveMetadata();
      renderRecentlyPlayed();
      updateAllFavoriteStates();
    }"""

new_apply_block = """    // For WEB RADIOS:
    // 1. Anti-truncation protection: Never allow an existing full title to be cut in half!
    if (slug === getCurrentStationSlug() && liveNowOnAir.title) {
      const curLive = liveNowOnAir.title.trim().toUpperCase();
      if (curLive.length > cleanT.length && curLive.startsWith(cleanT)) {
        cleanT = curLive;
      }
    }

    for (let i = 0; i < historyList.length; i++) {
      const oldT = (historyList[i].title || "").toUpperCase().replace(/\\ufffd/g, "").trim();
      if (cleanT.length > oldT.length && cleanT.startsWith(oldT)) {
        historyList[i].title = cleanT;
        historyList[i].artist = cleanA;
        saveStationHistories();
        if (slug === getCurrentStationSlug()) {
          renderRecentlyPlayed();
        }
        break;
      }
      if (oldT.length > cleanT.length && oldT.startsWith(cleanT)) {
        cleanT = oldT; // Retain the longer complete title!
        break;
      }
    }

    // 2. Web Radios: Update player on-air display with live track and clean station artwork
    // NOTE: Broadcast history for web radios is strictly synced from official WordPress broadcast history!
    // We NEVER unshift an ad-hoc track here to prevent irrelevant tracks from appearing on top of recent songs.
    if (slug === getCurrentStationSlug()) {
      liveNowOnAir.title = cleanT;
      liveNowOnAir.artist = cleanA;
      liveNowOnAir.artwork = effectiveArt;
      syncLiveMetadata();
      updateOnAirPlayerBadge();
      updateAllFavoriteStates();
    }
    return;"""

if old_apply_block in content:
    content = content.replace(old_apply_block, new_apply_block, 1)
    print("1. applyNowPlayingTrack web radio block updated successfully!")
else:
    print("WARNING: old_apply_block not found!")

# 2. Update syncWebRadioHistoryFromCloud
old_sync_merge = """        // If the station is active and we have liveWebRadioNowPlaying, prepend if different
        const activeTrack = liveWebRadioNowPlaying[slug] || (isActive ? liveNowOnAir : null);
        const hasLiveOnAir = isActive && activeTrack && activeTrack.title && isValidTrackText(activeTrack.title) && activeTrack.artist !== (ch && ch.name);
        const topHistoryTitle = liveHistory[0] && (liveHistory[0].title || "").trim().toUpperCase();

        if (hasLiveOnAir && activeTrack.title.trim().toUpperCase() !== topHistoryTitle) {
          merged.push({
            title: activeTrack.title.trim().toUpperCase(),
            artist: (activeTrack.artist || fallbackArtist).trim().toUpperCase(),
            time: activeTrack.time || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
            image: sanitizeArtworkUrl(activeTrack.artwork || activeTrack.image, ch) || defaultCover,
            hasResolvedArt: true
          });
        }

        // Add authentic songs from WordPress broadcast history
        for (const item of liveHistory) {
          if (merged.length >= 5) break;
          const itemTitle = (item.title || "").trim().toUpperCase();
          if (!merged.some(m => m.title && m.title.trim().toUpperCase() === itemTitle)) {
            merged.push({
              ...item,
              image: sanitizeArtworkUrl(item.image, ch) || defaultCover,
              hasResolvedArt: true
            });
          }
        }"""

new_sync_merge = """        const webRadioArt = (ch && ch.artworkUrl) || `https://greca994.gr/artwork/${slug === 'lounge' ? 'Lounge' : slug}/artwork.jpg`;

        // Add authentic songs directly from WordPress broadcast history (chronological on-air order)
        // Zero arbitrary tracks injected on top!
        for (const item of liveHistory) {
          if (merged.length >= 5) break;
          const itemTitle = (item.title || "").trim().toUpperCase();
          if (!merged.some(m => m.title && m.title.trim().toUpperCase() === itemTitle)) {
            merged.push({
              ...item,
              image: webRadioArt,
              hasResolvedArt: true
            });
          }
        }"""

if old_sync_merge in content:
    content = content.replace(old_sync_merge, new_sync_merge, 1)
    print("2. syncWebRadioHistoryFromCloud merging updated successfully!")
else:
    print("WARNING: old_sync_merge not found!")

# 3. Update renderRecentlyPlayed artwork for web radios
old_render_art = """      // Keep existing valid artwork (for web radios, RadioBoss artwork or clean station logo fallback)
      const itemArt = sanitizeArtworkUrl(item.image, currentChannel) || defaultFallback;
      const hasAuthenticJazlerArt = itemArt && itemArt.includes("jzSong_");
      const hasItunesArt = itemArt && itemArt.includes("mzstatic.com");

      if (hasAuthenticJazlerArt || hasItunesArt) {
        item.hasResolvedArt = true;
      }"""

new_render_art = """      // Artwork resolution:
      // For main station (Greca FM 99.4): uses Jazler artwork cache / fallback logo
      // For web radios: strictly uses the station artwork URL where it displays when playing! Zero iTunes search!
      const webRadioArt = (currentChannel && currentChannel.artworkUrl) || `https://greca994.gr/artwork/${slug === 'lounge' ? 'Lounge' : slug}/artwork.jpg`;
      const itemArt = (slug === "main") ? (sanitizeArtworkUrl(item.image, currentChannel) || defaultFallback) : webRadioArt;
      const hasAuthenticJazlerArt = itemArt && itemArt.includes("jzSong_");

      if (hasAuthenticJazlerArt || slug !== "main") {
        item.hasResolvedArt = true;
      }"""

if old_render_art in content:
    content = content.replace(old_render_art, new_render_art, 1)
    print("3. renderRecentlyPlayed artwork updated successfully!")
else:
    print("WARNING: old_render_art not found!")

# 4. Update fetchLiveStationHistory track image for web radios
old_fetch_art = """                  image: sanitizeArtworkUrl(art, ch) || defaultCover,"""
new_fetch_art = """                  image: (slug === "main") ? (sanitizeArtworkUrl(art, ch) || defaultCover) : ((ch && ch.artworkUrl) || `https://greca994.gr/artwork/${slug === 'lounge' ? 'Lounge' : slug}/artwork.jpg`),"""

if old_fetch_art in content:
    content = content.replace(old_fetch_art, new_fetch_art, 1)
    print("4. fetchLiveStationHistory artwork updated successfully!")
else:
    print("WARNING: old_fetch_art not found!")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("All web radio fixes applied to app.js!")
