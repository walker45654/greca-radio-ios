with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update sanitizeArtworkUrl for web radios
old_san = """    // FOR ALL WEB RADIOS: Use RadioBoss artwork URL if provided, otherwise clean station fallback!
    if (!isMain) {
      if (clean.includes("main.png")) {
        return stationDefault;
      }
      if (clean.includes("/artwork/") || clean.includes("greca994.gr") || clean.startsWith("assets/stations/")) {
        return clean;
      }
      return stationDefault;
    }"""

new_san = """    // FOR ALL WEB RADIOS: Use artwork URL sent by RadioBoss / WordPress, otherwise clean station fallback!
    if (!isMain) {
      if (clean.includes("main.png") || clean.includes("cropped-greca")) {
        return stationDefault;
      }
      if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("assets/stations/")) {
        return clean;
      }
      return stationDefault;
    }"""

if old_san in content:
    content = content.replace(old_san, new_san, 1)
    print("1. sanitizeArtworkUrl updated to allow RadioBoss artworks.")
else:
    print("WARNING: old_san not found!")

# 2. Update renderRecentlyPlayed artwork in app.js
old_rend = """      // Artwork resolution:
      // For main station (Greca FM 99.4): uses Jazler artwork cache / fallback logo
      // For web radios: strictly uses the station artwork URL where it displays when playing! Zero iTunes search!
      const webRadioArt = (currentChannel && currentChannel.artworkUrl) || `https://greca994.gr/artwork/${slug === 'lounge' ? 'Lounge' : slug}/artwork.jpg`;
      const itemArt = (slug === "main") ? (sanitizeArtworkUrl(item.image, currentChannel) || defaultFallback) : webRadioArt;
      const hasAuthenticJazlerArt = itemArt && itemArt.includes("jzSong_");

      if (hasAuthenticJazlerArt || slug !== "main") {
        item.hasResolvedArt = true;
      }"""

new_rend = """      // Artwork resolution:
      // For main station (Greca FM 99.4): uses Jazler artwork cache / fallback logo
      // For web radios: strictly uses the artwork sent by RadioBoss (item.image), falling back to the live station artwork link! Zero iTunes search!
      const webRadioFallback = (currentChannel && currentChannel.artworkUrl) || `https://greca994.gr/artwork/${slug === 'lounge' ? 'Lounge' : slug}/artwork.jpg`;
      const sanitized = sanitizeArtworkUrl(item.image, currentChannel);
      const itemArt = (slug === "main")
        ? (sanitized || defaultFallback)
        : ((sanitized && !sanitized.includes("main.png")) ? sanitized : (webRadioFallback || defaultFallback));
      const hasAuthenticJazlerArt = itemArt && itemArt.includes("jzSong_");

      if (hasAuthenticJazlerArt || slug !== "main") {
        item.hasResolvedArt = true;
      }"""

if old_rend in content:
    content = content.replace(old_rend, new_rend, 1)
    print("2. renderRecentlyPlayed updated to display RadioBoss artwork.")
else:
    print("WARNING: old_rend not found!")

# 3. Update fetchLiveStationHistory in app.js
old_fetch = """                  image: (slug === "main") ? (sanitizeArtworkUrl(art, ch) || defaultCover) : ((ch && ch.artworkUrl) || `https://greca994.gr/artwork/${slug === 'lounge' ? 'Lounge' : slug}/artwork.jpg`),"""
new_fetch = """                  image: (slug === "main") ? (sanitizeArtworkUrl(art, ch) || defaultCover) : ((sanitizeArtworkUrl(art, ch) && !sanitizeArtworkUrl(art, ch).includes("main.png")) ? sanitizeArtworkUrl(art, ch) : ((ch && ch.artworkUrl) || defaultCover)),"""

if old_fetch in content:
    content = content.replace(old_fetch, new_fetch, 1)
    print("3. fetchLiveStationHistory updated to preserve RadioBoss artwork.")
else:
    print("WARNING: old_fetch not found!")

# 4. Update syncWebRadioHistoryFromCloud in app.js
old_syn = """        const webRadioArt = (ch && ch.artworkUrl) || `https://greca994.gr/artwork/${slug === 'lounge' ? 'Lounge' : slug}/artwork.jpg`;

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

new_syn = """        const webRadioFallback = (ch && ch.artworkUrl) || `https://greca994.gr/artwork/${slug === 'lounge' ? 'Lounge' : slug}/artwork.jpg`;

        // Add authentic songs directly from WordPress broadcast history (chronological on-air order)
        // Preserves the distinct artwork sent by RadioBoss for each song! Zero arbitrary tracks injected on top!
        for (const item of liveHistory) {
          if (merged.length >= 5) break;
          const itemTitle = (item.title || "").trim().toUpperCase();
          if (!merged.some(m => m.title && m.title.trim().toUpperCase() === itemTitle)) {
            const itemArt = sanitizeArtworkUrl(item.image, ch);
            const finalArt = (itemArt && !itemArt.includes("main.png")) ? itemArt : webRadioFallback;
            merged.push({
              ...item,
              image: finalArt,
              hasResolvedArt: true
            });
          }
        }"""

if old_syn in content:
    content = content.replace(old_syn, new_syn, 1)
    print("4. syncWebRadioHistoryFromCloud updated to preserve RadioBoss artwork.")
else:
    print("WARNING: old_syn not found!")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js updated successfully!")
