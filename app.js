// ===================================================================
// GRECA FM 99,4 - BULLETPROOF MOBILE & DESKTOP ENGINE
// Real-time Jazler Sync, Zero-Lag Initial Render, Full Playback Sync
// ===================================================================

function initGrecaApp() {
  const DATA = (typeof window !== "undefined" && window.APP_DATA) ? window.APP_DATA : (typeof APP_DATA !== "undefined" ? APP_DATA : { channels: [], initialHistory: [] });
  
  // Audio Element
  const audio = document.getElementById("audioStream");
  let currentStationIdx = 0;
  let isPlaying = false;
  let isBuffering = false;
  let activeFilter = "all";
  const liveWebRadioNowPlaying = {};

  // -----------------------------------------------------------------
  // User Personal Favorites (Local to this user/device only!)
  // -----------------------------------------------------------------
  const FAVORITES_STORAGE_KEY = "greca_user_favorite_tracks_v1";
  const FAVORITES_DETAILS_KEY = "greca_favorites_details_v2";

  function loadFavoritesDetails() {
    try {
      const stored = localStorage.getItem(FAVORITES_DETAILS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  }

  let favoritesDetails = loadFavoritesDetails();

  function saveFavoritesDetails() {
    try {
      localStorage.setItem(FAVORITES_DETAILS_KEY, JSON.stringify(favoritesDetails));
    } catch (e) {}
  }

  function loadUserFavorites() {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY) || localStorage.getItem("greca_fav_ids") || "[]";
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(k => String(k).trim().toUpperCase());
      }
    } catch (e) {
      console.warn("Could not load favorites:", e);
    }
    return [];
  }

  let userFavorites = loadUserFavorites();

  function saveUserFavorites() {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(userFavorites));
      localStorage.setItem("greca_fav_ids", JSON.stringify(userFavorites));
    } catch (e) {
      console.warn("Could not save favorites:", e);
    }
  }

  // -----------------------------------------------------------------
  // Bulletproof Track Text & Error Filtering
  // Strictly rejects ANY real server error code (520, 502, 503, etc.) or Cloudflare errors
  // -----------------------------------------------------------------
  function isServerErrorMessage(text) {
    if (!text || typeof text !== "string") return true;
    const t = text.trim();
    if (t.length === 0) return true;
    return /(?:error\s*code\s*\d{3}|code\s*520\b|520\s*origin\s*error|502\s*bad\s*gateway|503\s*service\s*unavailable|504\s*gateway\s*timeout|cloudflare\s*ray\s*id|web\s*server\s*is\s*down|internal\s*server\s*error)/i.test(t);
  }

  function isValidTrackText(text) {
    if (!text || typeof text !== "string") return false;
    const s = text.trim();
    if (s.length < 2 || s.length > 120) return false;
    if (/<[^>]+>|<!doctype/i.test(s)) return false;
    if (isServerErrorMessage(s)) return false;

    // Reject jingles or station id slogans masquerading as song titles
    if (/(?:greca\s*fm|greca\s*main|99[,.]4|radiohost|cloudstreaming|\blive\s*stream\b)/i.test(s)) {
      return false;
    }
    // Reject strings that are only symbols or replacement chars
    const cleaned = s.replace(/[\ufffd\?\.\-\_\,\s]/g, "");
    if (cleaned.length < 2) return false;

    return true;
  }

  function normalizeSongKey(title) {
    if (!title || typeof title !== "string") return "";
    return title.trim().toUpperCase().replace(/\s+/g, " ");
  }

  function isSongFavorite(title) {
    if (!title || typeof title !== "string" || !isValidTrackText(title)) return false;
    const key = normalizeSongKey(title);
    if (!key || key.length < 2 || key.includes("99,4") || key.includes("99.4") || key.includes("LIVE STREAM") || key.includes("GRECA MAIN") || key === "WEB RADIO") return false;
    return userFavorites.includes(key);
  }

  function toggleSongFavorite(title, artist, artwork) {
    if (!title || typeof title !== "string" || !isValidTrackText(title)) return false;
    const key = normalizeSongKey(title);
    if (!key || key.length < 2 || key.includes("99,4") || key.includes("99.4") || key.includes("LIVE STREAM") || key.includes("GRECA MAIN") || key === "WEB RADIO") {
      showNotification("Το τραγούδι φορτώνει...", "fa-solid fa-rotate");
      return false;
    }
    const exists = isSongFavorite(title);

    if (exists) {
      userFavorites = userFavorites.filter(k => k !== key);
      delete favoritesDetails[key];
      saveUserFavorites();
      saveFavoritesDetails();
      showNotification(`«${title}» αφαιρέθηκε από τα αγαπημένα`, "fa-regular fa-heart");
    } else {
      userFavorites.push(key);
      const ch = (DATA && DATA.channels && DATA.channels[currentStationIdx]) ? DATA.channels[currentStationIdx] : (DATA && DATA.channels ? DATA.channels[0] : null);
      const art = artwork || (liveNowOnAir && liveNowOnAir.artwork ? liveNowOnAir.artwork : getStationDefaultCover(ch));
      favoritesDetails[key] = {
        title: title,
        artist: artist || (ch ? ch.name : "Greca FM 99,4"),
        artwork: art,
        addedAt: Date.now()
      };
      saveUserFavorites();
      saveFavoritesDetails();
      showNotification(`«${title}» προστέθηκε στα αγαπημένα`, "fa-solid fa-heart");
    }
    updateAllFavoriteStates();
    return !exists;
  }

  function updateAllFavoriteStates() {
    // 1. Sync Top Main Player Heart Button
    if (mainHeartBtn) {
      const isFav = isSongFavorite(liveNowOnAir.title);
      const icon = mainHeartBtn.querySelector("i");
      if (isFav) {
        mainHeartBtn.classList.add("active");
        if (icon) icon.className = "fa-solid fa-heart";
      } else {
        mainHeartBtn.classList.remove("active");
        if (icon) icon.className = "fa-regular fa-heart";
      }
    }

    // 2. Sync Recent Tracks List Hearts
    if (recentTracksList) {
      const cards = recentTracksList.querySelectorAll(".recent-track-card");
      cards.forEach(card => {
        const titleElem = card.querySelector(".recent-track-title");
        const heartBtn = card.querySelector(".recent-track-heart-btn");
        if (titleElem && heartBtn) {
          const title = titleElem.innerText;
          const isFav = isSongFavorite(title);
          if (isFav) {
            heartBtn.classList.add("is-fav");
          } else {
            heartBtn.classList.remove("is-fav");
          }
        }
      });
    }

    // 3. Sync Top 30 Chart Hearts
    if (chartTracksList) {
      const chartCards = chartTracksList.querySelectorAll(".chart-track-card");
      chartCards.forEach(card => {
        const titleEl = card.querySelector(".chart-track-title");
        const heartBtn = card.querySelector(".chart-heart-btn");
        if (titleEl && heartBtn) {
          const isFav = isSongFavorite(titleEl.innerText);
          heartBtn.classList.toggle("is-favorite", isFav);
          const icon = heartBtn.querySelector("i");
          if (icon) icon.className = isFav ? "fa-solid fa-heart" : "fa-regular fa-heart";
        }
      });
    }
  }

  let sleepMins = 0;
  let sleepTargetTimestamp = 0;
  let sleepIntervalHandle = null;
  let sleepOriginalVolume = 0.85;

  // Safe DOM Elements
  const mainScroll = document.getElementById("mainScroll");
  const stationsBubbleRow = document.getElementById("stationsBubbleRow");
  const stationsCardsContainer = document.getElementById("stationsCardsContainer");
  const categoryPillsRow = document.getElementById("categoryPillsRow");
  const categoryFilterLabel = document.getElementById("categoryFilterLabel");
  const recentTracksList = document.getElementById("recentTracksList");
  const showsTimelineContainer = document.getElementById("showsTimelineContainer");
  const scheduleDaysNavRow = document.getElementById("scheduleDaysNavRow");
  const scheduleDayBadge = document.getElementById("scheduleDayBadge");
  let selectedScheduleDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Show Details Modal Elements
  const showModalBackdrop = document.getElementById("showModalBackdrop");
  const showModalCloseBtn = document.getElementById("showModalCloseBtn");
  const modalShowImg = document.getElementById("modalShowImg");
  const modalShowTag = document.getElementById("modalShowTag");
  const modalShowTitle = document.getElementById("modalShowTitle");
  const modalShowPresenter = document.getElementById("modalShowPresenter");
  const modalShowShareFab = document.getElementById("modalShowShareFab");
  const modalShowParagraphs = document.getElementById("modalShowParagraphs");
  let currentModalShow = null;

  // Article Reader Modal Elements
  const articleModalBackdrop = document.getElementById("articleModalBackdrop");
  const articleModalCloseBtn = document.getElementById("articleModalCloseBtn");
  const modalArticleImg = document.getElementById("modalArticleImg");
  const modalArticleTag = document.getElementById("modalArticleTag");
  const modalArticleTitle = document.getElementById("modalArticleTitle");
  const modalArticleDate = document.getElementById("modalArticleDate");
  const modalArticleShareFab = document.getElementById("modalArticleShareFab");
  const modalArticleContent = document.getElementById("modalArticleContent");
  const modalArticleWebLink = document.getElementById("modalArticleWebLink");
  let currentModalArticle = null;

  const newsFeedWrapper = document.getElementById("newsFeedWrapper");
  const newsCountPill = document.getElementById("newsCountPill");
  const newsFilterNavRow = document.getElementById("newsFilterNavRow");
  const newsRefreshBtn = document.getElementById("newsRefreshBtn");
  function showNewsLoadingState() {
    if (!newsFeedWrapper) return;
    newsFeedWrapper.innerHTML = `
      <div class="news-loading-state" style="text-align: center; padding: 60px 20px; color: #ffffff;">
        <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 34px; color: #ffffff; margin-bottom: 14px; display: inline-block;"></i>
        <p style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 6px;">Φόρτωση άρθρων...</p>
        <span style="font-size: 13px; color: rgba(255, 255, 255, 0.85);">Συγχρονισμός με greca994.gr</span>
      </div>
    `;
    if (newsPaginationTop) newsPaginationTop.style.display = "none";
    if (newsPaginationBar) newsPaginationBar.style.display = "none";
    if (newsCountPill) newsCountPill.innerText = "Φόρτωση...";
  }
  function loadInitialNews() {
    return [];
  }
  let loadedNewsItems = loadInitialNews();
  let currentNewsFilter = "all";
  let newsCurrentPage = 1;
  const newsPaginationTop = document.getElementById("newsPaginationTop");
  const newsTopPrevBtn = document.getElementById("newsTopPrevBtn");
  const newsTopNextBtn = document.getElementById("newsTopNextBtn");
  const newsTopNumbersWrap = document.getElementById("newsTopNumbersWrap");
  const newsPaginationBar = document.getElementById("newsPaginationBar");
  const newsPagePrevBtn = document.getElementById("newsPagePrevBtn");
  const newsPageNextBtn = document.getElementById("newsPageNextBtn");
  const newsPageNumbersWrap = document.getElementById("newsPageNumbersWrap");
  const cpStationsTiles = document.getElementById("cpStationsTiles");
  const toastMsg = document.getElementById("toastMsg");
  const recentHistoryStationBadge = document.getElementById("recentHistoryStationBadge");

  // Main Player Elements
  const mainTrackCover = document.getElementById("mainTrackCover");
  const mainPlayBtn = document.getElementById("mainPlayBtn");
  const mainSongTitle = document.getElementById("mainSongTitle");
  const mainArtistName = document.getElementById("mainArtistName");
  const mainOnAirBadgeWrap = document.getElementById("mainOnAirBadgeWrap");
  const currentShowBadge = document.getElementById("currentShowBadge");
  const homeMorningShowCard = document.getElementById("homeMorningShowCard");
  const coverEqualizer = document.getElementById("coverEqualizer");
  const mainVolumeSlider = document.getElementById("mainVolumeSlider");
  const mainHeartBtn = document.getElementById("mainHeartBtn");
  const mainSleepTimerBtn = document.getElementById("mainSleepTimerBtn");
  const mainSleepLabel = document.getElementById("mainSleepLabel");
  const mainShareBtn = document.getElementById("mainShareBtn");

  // Floating Mini Player
  const floatingMiniBar = document.getElementById("floatingMiniBar");
  const miniCoverImg = document.getElementById("miniCoverImg");
  const miniTitleText = document.getElementById("miniTitleText");
  const miniArtistText = document.getElementById("miniArtistText");
  const miniPlayBtn = document.getElementById("miniPlayBtn");
  const miniPlayerOpenTouch = document.getElementById("miniPlayerOpenTouch");

  // CarPlay Elements
  const bubbleScrollLeftBtn = document.getElementById("bubbleScrollLeftBtn");
  const bubbleScrollRightBtn = document.getElementById("bubbleScrollRightBtn");
  const cpStationArt = document.getElementById("cpStationArt");
  const cpChannelLabel = document.getElementById("cpChannelLabel");
  const cpTrackTitle = document.getElementById("cpTrackTitle");
  const cpTrackArtist = document.getElementById("cpTrackArtist");
  const cpMainPlayBtn = document.getElementById("cpMainPlayBtn");
  const cpPrevChannel = document.getElementById("cpPrevChannel");
  const cpNextChannel = document.getElementById("cpNextChannel");
  const cpLiveClock = document.getElementById("cpLiveClock");
  const cpExitBtn = document.getElementById("cpExitBtn");

  // Tabs & Controls
  const navTabBtns = document.querySelectorAll(".nav-tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const statusBarClock = document.getElementById("statusBarClock");

  // Top 30 Chart Elements
  const chartTracksList = document.getElementById("chartTracksList");
  const previewAudio = new Audio();
  let activePreviewRank = null;

  // -----------------------------------------------------------------
  // Track History State (Strictly 5 items maximum PER STATION)
  // -----------------------------------------------------------------
  const STORAGE_KEY_RECENT_STATIONS = "greca_recent_by_station_v20";
  const STORAGE_KEY_TRACK_ARTWORKS = "greca_track_artworks_v9";
  const STORAGE_KEY_LAST_PLAYING = "greca_last_playing_track_v6";

  // -----------------------------------------------------------------
  // Fallback Artwork & Genre Resolver (Station Specific!)
  // -----------------------------------------------------------------
  const MAIN_FALLBACK_ART = "assets/Greca Fm 99,4 mayro logo jpg (1).jpg";
  const DEFAULT_FALLBACK_ART = MAIN_FALLBACK_ART;

  function getStationDefaultCover(ch) {
    if (!ch) return MAIN_FALLBACK_ART;
    if (ch.id === "main-hq" || ch.slug === "main") {
      return MAIN_FALLBACK_ART;
    }
    // Web Radios: use their own authentic station logos!
    return ch.image || ch.logo || ch.artworkUrl || MAIN_FALLBACK_ART;
  }

  function getStationFallbackArtist(ch) {
    if (!ch) return "ΜΟΝΟ ΕΠΙΤΥΧΙΕΣ";
    if (ch.id === "main-hq" || ch.slug === "main") {
      return "ΜΟΝΟ ΕΠΙΤΥΧΙΕΣ";
    }
    return (ch.categoryName || ch.category || "ΜΟΥΣΙΚΟ ΚΑΝΑΛΙ").toUpperCase();
  }

  function getCurrentStationSlug() {
    const channel = (DATA.channels && DATA.channels[currentStationIdx]) ? DATA.channels[currentStationIdx] : { slug: "main" };
    return channel.slug || "main";
  }

  // Sanitize Artwork: Station-specific fallback!
  function sanitizeArtworkUrl(url, ch) {
    const station = ch || (DATA.channels && DATA.channels[currentStationIdx]) || (DATA.channels ? DATA.channels[0] : null);
    const isMain = !station || station.id === "main-hq" || station.slug === "main";
    const stationDefault = getStationDefaultCover(station);

    if (!url || typeof url !== "string" || !url.trim()) return stationDefault;
    let clean = url.trim();
    if (clean.startsWith("http://")) {
      clean = "https://" + clean.slice(7);
    }

    if (clean.includes("CurrentAlbumImage.jpg") || clean.includes("notis.png")) {
      return stationDefault;
    }

    // FOR ALL WEB RADIOS: Use artwork URL sent by RadioBoss / WordPress, otherwise clean station fallback!
    if (!isMain) {
      if (clean.includes("main.png") || clean.includes("cropped-greca")) {
        return stationDefault;
      }
      if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("assets/stations/")) {
        return clean;
      }
      return stationDefault;
    }

    // FOR MAIN STATION:
    const webSlugs = ['laiko', 'entexno', 'erwtiko', 'party', 'lounge', 'glenti', 'xmas'];
    if (webSlugs.some(s => clean.includes(`/${s}/`) || clean.includes(`/${s}.`) || clean.includes(`stations/${s}`))) {
      return MAIN_FALLBACK_ART;
    }

    if (clean.includes("main.png")) {
      return MAIN_FALLBACK_ART;
    }

    if (clean.includes("jzSong_") || clean.includes("mzstatic.com") || clean.includes("mayro logo") || clean.includes("cropped-greca") || clean.includes("greca_default_cover") || clean.includes("greca_black_logo")) {
      return clean;
    }

    return MAIN_FALLBACK_ART;
  }

  // -------------------------------------------------------------
  // Clean Web Radio Track List: Remove jingles, duplicates, cut titles & errors
  // -------------------------------------------------------------
  function cleanWebRadioTrackList(list, ch) {
    if (!Array.isArray(list)) return [];
    const cleaned = [];
    const fallbackArtist = getStationFallbackArtist(ch);

    for (const item of list) {
      if (!item || !item.title) continue;
      let t = (item.title || "").replace(/\ufffd/g, "").replace(/\?/g, "").trim().toUpperCase();
      let a = (item.artist || fallbackArtist).replace(/\ufffd/g, "").replace(/\?/g, "").trim().toUpperCase();
      if (!a) a = fallbackArtist;
      
      // Strict validation: Reject ANY error code (520, 502), Cloudflare error, or invalid title/artist
      if (!isValidTrackText(t)) continue;

      let isDuplicateOrCut = false;
      for (let c of cleaned) {
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
      }

      if (!isDuplicateOrCut) {
        const stLogo = (ch && ch.image) || (ch && ch.logo) || getStationDefaultCover(ch);
        const art = (item.image && !item.image.includes("artwork.jpg") && !item.image.includes("main.png")) ? sanitizeArtworkUrl(item.image, ch) : stLogo;
        cleaned.push({
          title: t,
          artist: a,
          time: item.time || "",
          image: art,
          hasResolvedArt: true
        });
      }
    }
    return cleaned.slice(0, 5);
  }

  function loadStationHistories() {
    let histories = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RECENT_STATIONS);
      if (stored) {
        histories = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Storage read error", e);
    }

    if (!histories || typeof histories !== "object") {
      histories = {};
    }

    if (DATA && Array.isArray(DATA.channels)) {
      DATA.channels.forEach(ch => {
        const slug = ch.slug || "main";
        if (!histories[slug] || !Array.isArray(histories[slug])) {
          histories[slug] = [];
        }
        // Purge ANY error tracks (like ERROR CODE 520) from ALL stations including main!
        histories[slug] = (histories[slug] || []).filter(item => {
          if (!item || !item.title) return false;
          return isValidTrackText(item.title) && isValidTrackText(item.artist || "A");
        });
        if (histories[slug].length === 0 && DATA.initialHistoriesByStation && Array.isArray(DATA.initialHistoriesByStation[slug])) {
          histories[slug] = JSON.parse(JSON.stringify(DATA.initialHistoriesByStation[slug]));
        }
        if (slug === "main") {
          // Strictly sanitize artwork for main station: NO web radio covers!
          const mainCh = DATA.channels ? DATA.channels[0] : null;
          histories["main"] = histories["main"].map(item => ({
            ...item,
            image: sanitizeArtworkUrl(item.image, mainCh)
          }));
        } else {
          histories[slug] = cleanWebRadioTrackList(histories[slug], ch);
        }
      });
    }

    return histories;
  }

  function saveStationHistories() {
    try {
      localStorage.setItem(STORAGE_KEY_RECENT_STATIONS, JSON.stringify(stationHistories));
    } catch (e) {
      console.warn("Storage save error", e);
    }
  }

  let stationHistories = loadStationHistories();
  saveStationHistories();

  // Pre-seed liveWebRadioNowPlaying from cached history for WEB RADIOS ONLY!
  if (DATA && Array.isArray(DATA.channels)) {
    DATA.channels.forEach(ch => {
      const s = ch.slug || "main";
      if (s !== "main" && stationHistories[s] && stationHistories[s][0]) {
        const top = stationHistories[s][0];
        if (top && isValidTrackText(top.title) && isValidTrackText(top.artist || "A")) {
          liveWebRadioNowPlaying[s] = {
            artist: top.artist,
            title: top.title,
            image: top.image
          };
        }
      }
    });
  }

  async function seedInitialHistoryIfEmpty() {
    const needsSeed = !stationHistories["main"] || stationHistories["main"].length === 0 ||
      (DATA && Array.isArray(DATA.channels) && DATA.channels.some(ch => !stationHistories[ch.slug] || stationHistories[ch.slug].length === 0));

    if (needsSeed) {
      if (DATA && DATA.initialHistoriesByStation) {
        Object.keys(DATA.initialHistoriesByStation).forEach(slug => {
          if (!stationHistories[slug] || stationHistories[slug].length === 0) {
            const initialList = JSON.parse(JSON.stringify(DATA.initialHistoriesByStation[slug] || []));
            if (slug !== "main") {
              const stCh = DATA.channels ? DATA.channels.find(c => c.slug === slug) : null;
              stationHistories[slug] = initialList.map(item => ({
                ...item,
                image: ((item.image && !item.image.includes("artwork.jpg") && !item.image.includes("main.png")) ? sanitizeArtworkUrl(item.image, stCh) : null) || (stCh && stCh.image) || (stCh && stCh.logo) || getStationDefaultCover(stCh),
                hasResolvedArt: true
              }));
            } else {
              stationHistories[slug] = initialList;
            }
          }
        });
        saveStationHistories();
        renderRecentlyPlayed();
        renderStationsList();
      }
      try {
        const res = await fetch("server_station_history.json").catch(() => null);
        if (res && res.ok) {
          const dH = await res.json();
          if (dH && typeof dH === "object") {
            const stationsObj = dH.stations || dH;
            const mainCh = DATA.channels ? DATA.channels[0] : null;
            Object.keys(stationsObj).forEach(slug => {
              if (Array.isArray(stationsObj[slug]) && (!stationHistories[slug] || stationHistories[slug].length === 0)) {
                const rawList = stationsObj[slug].filter(item => item && isValidTrackText(item.title) && isValidTrackText(item.artist || "A"));
                const stCh = DATA.channels.find(c => c.slug === slug);
                if (slug === "main") {
                  stationHistories["main"] = rawList.slice(0, 5).map(item => ({
                    ...item,
                    image: sanitizeArtworkUrl(item.image, mainCh)
                  }));
                } else {
                  stationHistories[slug] = cleanWebRadioTrackList(rawList, stCh);
                  if (stationHistories[slug][0] && !liveWebRadioNowPlaying[slug]) {
                    liveWebRadioNowPlaying[slug] = {
                      artist: stationHistories[slug][0].artist,
                      title: stationHistories[slug][0].title,
                      image: stationHistories[slug][0].image
                    };
                  }
                }
              }
            });
            saveStationHistories();
            renderRecentlyPlayed();
            renderStationsList();
          }
        }
      } catch (e) {}
    }
  }



  // Clear any corrupted or stale cached tracks from past runs:
  try {
    ['greca_last_playing_track_v1', 'greca_last_playing_track_v2', 'greca_last_playing_track_v3',
     'greca_recent_by_station_v8', 'greca_recent_by_station_v9', 'greca_recent_by_station_v10',
     'greca_recent_by_station_v14', 'greca_recent_by_station_v15', 'greca_recent_by_station_v16',
     'greca_last_playing_track_v4', 'greca_last_playing_track_v5'].forEach(k => {
      localStorage.removeItem(k);
    });
    localStorage.removeItem(STORAGE_KEY_LAST_PLAYING);
  } catch(e) {}

  // -----------------------------------------------------------------
  // Initial Live Track State (Station Name & Logo until Live Sync)
  // -----------------------------------------------------------------
  function loadInitialLiveTrack() {
    return {
      title: "Greca FM 99,4",
      artist: "Μόνο Επιτυχίες",
      artwork: DEFAULT_FALLBACK_ART
    };
  }

  let liveNowOnAir = loadInitialLiveTrack();

  // Save current track to localStorage to prevent refresh flicker
  function saveCurrentLiveTrack() {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_PLAYING, JSON.stringify(liveNowOnAir));
    } catch (e) {}
  }

  // -----------------------------------------------------------------
  // Synchronous DOM Metadata Sync (Hero + Mini + CarPlay)
  // -----------------------------------------------------------------
  function syncLiveMetadata() {
    const channel = (DATA.channels && DATA.channels[currentStationIdx]) ? DATA.channels[currentStationIdx] : DATA.channels[0];
    const isMain = channel.id === "main-hq" || channel.slug === "main";

    let displayTitle = (liveNowOnAir.title || "").trim();
    let displayArtist = (liveNowOnAir.artist || "").trim();

    const isPlaceholder = !displayTitle || 
      displayTitle.toUpperCase() === "GRECA MAIN" || 
      displayTitle.toUpperCase().includes("GRECA MAIN") || 
      displayTitle.includes("99,4") || 
      displayTitle.includes("99.4") || 
      displayTitle.includes("LIVE STREAM") || 
      displayTitle.toUpperCase() === "WEB RADIO" || 
      displayArtist.toUpperCase() === "WEB RADIO" ||
      displayTitle.toUpperCase() === "GRECA WEB RADIO";

    if (isPlaceholder) {
      if (isMain) {
        displayTitle = "Greca FM 99,4";
        displayArtist = "Μόνο Επιτυχίες";
      } else {
        displayTitle = channel.name;
        displayArtist = getStationFallbackArtist(channel);
      }
    }

    const art = sanitizeArtworkUrl(liveNowOnAir.artwork, channel);
    const stationDefault = getStationDefaultCover(channel);

    if (mainSongTitle) mainSongTitle.innerText = displayTitle;
    if (mainArtistName) mainArtistName.innerText = displayArtist;
    if (mainTrackCover) {
      mainTrackCover.onerror = () => { mainTrackCover.src = stationDefault; };
      mainTrackCover.src = art;
    }

    if (miniTitleText) miniTitleText.innerText = displayTitle;
    if (miniArtistText) miniArtistText.innerText = displayArtist;
    if (miniCoverImg) {
      miniCoverImg.onerror = () => { miniCoverImg.src = stationDefault; };
      miniCoverImg.src = art;
    }

    if (cpTrackTitle) cpTrackTitle.innerText = displayTitle.toUpperCase();
    if (cpTrackArtist) cpTrackArtist.innerText = displayArtist.toUpperCase();
    if (cpStationArt) {
      cpStationArt.onerror = () => { cpStationArt.src = stationDefault; };
      cpStationArt.src = art;
    }
    if (cpChannelLabel && channel) cpChannelLabel.innerText = channel.name;

    // For Web Radios: Ensure the top card in "Τελευταία Τραγούδια" matches the player artwork immediately
    if (!isMain && art && !art.includes("main.png")) {
      const firstThumb = document.querySelector(".track-thumb-0");
      if (firstThumb) {
        firstThumb.src = art;
      }
      if (stationHistories[channel.slug] && stationHistories[channel.slug][0]) {
        stationHistories[channel.slug][0].image = art;
      }
    }

    updateAllFavoriteStates();
    saveCurrentLiveTrack();
    updateStationCardSubtitle(getCurrentStationSlug(), displayArtist, displayTitle);
    updateMediaSession();
  }

  // -----------------------------------------------------------------
  // System Media Session & Lockscreen Player (Spotify-like notification)
  // -----------------------------------------------------------------
  // Global Handlers for Native Lockscreen & Notification Controls
  // -----------------------------------------------------------------
  window.grecaTogglePlayback = () => {
    togglePlayback();
  };
  window.grecaNextStation = () => {
    tuneStation(currentStationIdx + 1);
  };
  window.grecaPrevStation = () => {
    tuneStation(currentStationIdx - 1);
  };

  let mediaSessionHandlersRegistered = false;
  function setupMediaSessionHandlers() {
    if (!('mediaSession' in navigator) || mediaSessionHandlersRegistered) return;
    mediaSessionHandlersRegistered = true;
    const actions = [
      ["play", () => { if (!isPlaying) togglePlayback(); }],
      ["pause", () => { if (isPlaying) togglePlayback(); }],
      ["stop", () => { if (isPlaying) togglePlayback(); }],
      ["previoustrack", () => { tuneStation(currentStationIdx - 1); }],
      ["nexttrack", () => { tuneStation(currentStationIdx + 1); }]
    ];
    actions.forEach(([act, fn]) => {
      try {
        navigator.mediaSession.setActionHandler(act, fn);
      } catch (e) {}
    });
  }

  // -----------------------------------------------------------------
  // System Media Session & Lockscreen Player (iOS Lockscreen + Android Notification)
  // Shows full album art, track title, artist, and play/pause/skip buttons
  // -----------------------------------------------------------------
  function updateMediaSession() {
    try {
      const channel = (DATA.channels && DATA.channels[currentStationIdx]) ? DATA.channels[currentStationIdx] : DATA.channels[0];
      const isMain = channel.id === "main-hq" || channel.slug === "main";

      let rawTitle = (liveNowOnAir.title || "").trim();
      let rawArtist = (liveNowOnAir.artist || "").trim();

      const isDefaultState = !rawTitle || 
        rawTitle.toUpperCase() === "GRECA MAIN" || 
        rawTitle.includes("99,4") || 
        rawTitle.includes("99.4") || 
        rawTitle.toUpperCase() === "WEB RADIO";

      let displayTitle = isMain ? "Greca FM 99,4" : channel.name;
      let displayArtist = "";

      if (isDefaultState) {
        displayArtist = isMain ? "Μόνο Επιτυχίες" : getStationFallbackArtist(channel);
      } else {
        // Line 1 says "Greca FM 99,4", and Line 2 (below) says "Καλλιτέχνης - Τραγούδι"
        displayArtist = (rawArtist && rawTitle) ? `${rawArtist} - ${rawTitle}` : (rawTitle || rawArtist);
      }

      let art = sanitizeArtworkUrl(liveNowOnAir.artwork, channel);
      let fullArt = art;
      if (!fullArt.startsWith("http")) {
        // Map relative asset paths to public Greca HTTPS URLs so Android & iOS SystemUI can load them
        if (channel.id === "main-hq" || channel.slug === "main") {
          fullArt = "https://greca994.gr/wp-content/uploads/2020/06/cropped-greca-1-192x192.png";
        } else {
          fullArt = `https://greca994.gr/artwork/${channel.slug}/artwork.jpg`;
        }
      }
      if (fullArt.startsWith("http://")) {
        fullArt = "https://" + fullArt.slice(7);
      }

      // Universal System Document & Audio title fallback
      document.title = `${displayTitle} - ${displayArtist} | Greca FM 99,4`;
      if (audio) {
        audio.title = `${displayTitle} - ${displayArtist}`;
      }

      // 1. Native Capacitor Android Notification with Media Controls & Lockscreen Card
      try {
        const cap = (typeof window !== "undefined" && window.Capacitor) ? window.Capacitor : null;
        if (cap) {
          if (cap.Plugins && cap.Plugins.NativeMediaSession && typeof cap.Plugins.NativeMediaSession.update === "function") {
            cap.Plugins.NativeMediaSession.update({
              title: displayTitle,
              artist: displayArtist,
              station: channel.name,
              artworkUrl: fullArt,
              isPlaying: isPlaying
            });
          } else if (typeof cap.nativePromise === "function") {
            cap.nativePromise("NativeMediaSession", "update", {
              title: displayTitle,
              artist: displayArtist,
              station: channel.name,
              artworkUrl: fullArt,
              isPlaying: isPlaying
            });
          }
        }
      } catch (nativeErr) {}

      // 2. Web & iOS Safari Standard MediaSession (Lockscreen widget, Control Center, Dynamic Island)
      if ('mediaSession' in navigator) {
        setupMediaSessionHandlers();

        navigator.mediaSession.metadata = new MediaMetadata({
          title: displayTitle,
          artist: displayArtist,
          album: channel.name,
          artwork: [
            { src: fullArt, sizes: '96x96' },
            { src: fullArt, sizes: '128x128' },
            { src: fullArt, sizes: '192x192' },
            { src: fullArt, sizes: '256x256' },
            { src: fullArt, sizes: '384x384' },
            { src: fullArt, sizes: '512x512' }
          ]
        });

        navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      }
    } catch (e) {
      console.warn("MediaSession update error:", e);
    }
  }

  // -----------------------------------------------------------------
  // Master Playback State Synchronizer (Updates EVERY button in app!)
  // -----------------------------------------------------------------
  function updatePlayStateUI() {
    const playIcon = '<i class="fa-solid fa-play"></i>';
    const pauseIcon = '<i class="fa-solid fa-pause"></i>';
    const spinnerIcon = '<i class="fa-solid fa-spinner fa-spin"></i>';
    const icon = isBuffering ? spinnerIcon : (isPlaying ? pauseIcon : playIcon);

    // 1. Top Hero Center Play Button
    if (mainPlayBtn) mainPlayBtn.innerHTML = icon;

    // 2. Bottom Floating Mini Player Button
    if (miniPlayBtn) miniPlayBtn.innerHTML = icon;

    // 3. CarPlay Center Play Button
    if (cpMainPlayBtn) cpMainPlayBtn.innerHTML = icon;

    // 4. Hero Equalizer
    if (coverEqualizer) {
      coverEqualizer.style.display = (isPlaying && !isBuffering) ? "flex" : "none";
    }

    // 5. EVERY Station Card in the List (Subtitle & Play button sync)
    if (stationsCardsContainer) {
      const cards = stationsCardsContainer.querySelectorAll(".station-item-card");
      cards.forEach(card => {
        const cardIndex = parseInt(card.dataset.stationIndex, 10);
        const btn = card.querySelector(".station-play-btn-circle");
        const isThisTuned = (cardIndex === currentStationIdx);
        const chItem = (DATA.channels && DATA.channels[cardIndex]) ? DATA.channels[cardIndex] : null;

        if (isThisTuned) {
          if (isPlaying) {
            card.classList.add("is-playing");
            if (btn) btn.innerHTML = isBuffering ? spinnerIcon : pauseIcon;
          } else {
            card.classList.remove("is-playing");
            if (btn) btn.innerHTML = playIcon;
          }
        } else {
          card.classList.remove("is-playing");
          if (btn) btn.innerHTML = playIcon;
        }

        if (chItem) {
          const descEl = card.querySelector(`.station-desc-${chItem.id}`);
          if (descEl) {
            if (isThisTuned && isPlaying && isValidTrackText(liveNowOnAir.title) && isValidTrackText(liveNowOnAir.artist) && liveNowOnAir.artist !== chItem.name) {
              descEl.innerText = `${liveNowOnAir.artist} - ${liveNowOnAir.title}`;
            } else {
              descEl.innerText = chItem.description || getStationFallbackArtist(chItem);
            }
          }
        }
      });
    }

    // 6. Carousel Bubbles Active Highlight
    if (stationsBubbleRow) {
      const bubbles = stationsBubbleRow.querySelectorAll(".station-bubble-item");
      bubbles.forEach((b, idx) => {
        if (idx === currentStationIdx) {
          b.classList.add("active-bubble");
          if (isPlaying) {
            b.classList.add("is-playing-bubble");
          } else {
            b.classList.remove("is-playing-bubble");
          }
        } else {
          b.classList.remove("active-bubble");
          b.classList.remove("is-playing-bubble");
        }
      });
    }

    updateMediaSession();
  }

  // -----------------------------------------------------------------

  // -----------------------------------------------------------------
  // -----------------------------------------------------------------
  // Dynamic Unique Album Artwork Resolver (No duplicate covers on web radios!)
  // -----------------------------------------------------------------
  function greekToLatin(text) {
    if (!text) return "";
    let s = text
      .replace(/ΟΥ/gi, "OU").replace(/ου/g, "ou")
      .replace(/ΕΙ/gi, "EI").replace(/ει/g, "ei")
      .replace(/ΑΙ/gi, "AI").replace(/αι/g, "ai")
      .replace(/ΜΠ/gi, "B").replace(/μπ/g, "b")
      .replace(/ΝΤ/gi, "D").replace(/ντ/g, "d")
      .replace(/ΓΚ/gi, "G").replace(/γκ/g, "g");
    const map = {
      'Α': 'A', 'Β': 'V', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'I', 'Θ': 'TH',
      'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N', 'Ξ': 'X', 'Ο': 'O', 'Π': 'P',
      'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y', 'Φ': 'F', 'Χ': 'CH', 'Ψ': 'PS', 'Ω': 'O',
      'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'i', 'θ': 'th',
      'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p',
      'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o',
      'ά': 'a', 'έ': 'e', 'ή': 'i', 'ί': 'i', 'ό': 'o', 'ύ': 'y', 'ώ': 'o', 'ϊ': 'i', 'ϋ': 'y'
    };
    return s.replace(/[Α-Ωα-ωά-ώϊϋ]/g, c => map[c] || c);
  }

  // Dynamic Unique Album Artwork Resolver (Official high-res album covers for ALL stations)
  const trackArtCache = {};
  try {
    localStorage.removeItem("greca_recent_by_station_v17");
    localStorage.removeItem("greca_recent_by_station_v18");
    localStorage.removeItem("greca_recent_by_station_v19");
    localStorage.removeItem("greca_track_artworks_v8");
    localStorage.removeItem(STORAGE_KEY_TRACK_ARTWORKS);
    const storedArts = localStorage.getItem(STORAGE_KEY_TRACK_ARTWORKS);
    if (storedArts) Object.assign(trackArtCache, JSON.parse(storedArts));
  } catch(e) {}

  function artistMatches(expectedArtist, resultArtist) {
    if (!expectedArtist || !resultArtist) return false;
    const normExp = greekToLatin(expectedArtist).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const normRes = greekToLatin(resultArtist).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normRes.includes(normExp) || normExp.includes(normRes)) return true;
    const words = greekToLatin(expectedArtist).toUpperCase().split(/\s+/).filter(w => w.length >= 3 && !['FEAT', 'LIVE', 'AND', 'WITH', 'THE'].includes(w));
    for (const w of words) {
      if (greekToLatin(resultArtist).toUpperCase().includes(w)) return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // Bulletproof Track Deduplication (Detects cut titles & identical songs)
  // -------------------------------------------------------------
  function isSameTrack(t1, a1, t2, a2) {
    if (!t1 || !t2) return false;
    const raw1 = String(t1).trim().toUpperCase().replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").replace(/-.*/g, "").trim();
    const raw2 = String(t2).trim().toUpperCase().replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").replace(/-.*/g, "").trim();
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

      const words1 = greekToLatin(raw1).toUpperCase().split(/\s+/).filter(w => w.length >= 3 && !['LIVE', 'FEAT', 'RADIO', 'MIX', 'EDIT'].includes(w));
      const words2 = greekToLatin(raw2).toUpperCase().split(/\s+/).filter(w => w.length >= 3 && !['LIVE', 'FEAT', 'RADIO', 'MIX', 'EDIT'].includes(w));
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
  }

  let pendingArtworkTimers = [];
  function clearPendingArtworkTimers() {
    if (pendingArtworkTimers && pendingArtworkTimers.length > 0) {
      pendingArtworkTimers.forEach(t => clearTimeout(t));
      pendingArtworkTimers = [];
    }
  }

  async function resolveTrackArtwork(artist, title, fallbackArt, callback) {
    const curChannel = DATA.channels ? DATA.channels[currentStationIdx] : null;
    const isMainSt = !curChannel || curChannel.id === "main-hq" || curChannel.slug === "main";
    const defaultArt = fallbackArt || (isMainSt ? DEFAULT_FALLBACK_ART : getStationDefaultCover(curChannel));
    
    // Artwork resolver enabled for ALL stations (Web Radios + Main), exactly like normal station!

    if (!title || !isValidTrackText(title) || !isValidTrackText(artist || "A") || title.includes("LIVE STREAM") || title === "GRECA FM 99,4" || title.includes("WEB RADIO")) {
      if (callback) callback(defaultArt);
      return defaultArt;
    }

    const cleanTitle = title.replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").replace(/-.*/g, "").trim();
    const cleanArtist = (artist || "").replace(/GRECA.*/gi, "").replace(/WEB.*/gi, "").trim();
    const cacheKey = `${cleanArtist}_${cleanTitle}`.toUpperCase().replace(/\s+/g, " ");

    if (trackArtCache[cacheKey]) {
      if (callback) callback(trackArtCache[cacheKey]);
      return trackArtCache[cacheKey];
    }

    // ONLY search Artist + Title combinations. NEVER search title alone without artist!
    const queries = [
      `${greekToLatin(cleanArtist)} ${greekToLatin(cleanTitle)}`.trim(),
      `${cleanArtist} ${cleanTitle}`.trim()
    ].filter((q, idx, arr) => q && q.length > 3 && arr.indexOf(q) === idx);

    for (const q of queries) {
      try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=3`);
        if (res.ok) {
          const json = await res.json();
          if (json.results && json.results.length > 0) {
            const matched = json.results.find(r => artistMatches(cleanArtist, r.artistName));
            if (matched && matched.artworkUrl100) {
              const hdArt = matched.artworkUrl100.replace("100x100bb.jpg", "600x600bb.jpg");
              trackArtCache[cacheKey] = hdArt;
              try {
                localStorage.setItem(STORAGE_KEY_TRACK_ARTWORKS, JSON.stringify(trackArtCache));
              } catch(e) {}
              if (callback) callback(hdArt);
              return hdArt;
            }
          }
        }
      } catch(e) {}
    }

    if (callback) callback(defaultArt);
    return defaultArt;
  }

  // Render "Τελευταία Τραγούδια" (Strictly 5 items per station, each with its authentic album art)
  // -----------------------------------------------------------------
  function renderRecentlyPlayed() {
    if (!recentTracksList) return;

    const currentChannel = (DATA.channels && DATA.channels[currentStationIdx]) ? DATA.channels[currentStationIdx] : DATA.channels[0];
    const slug = getCurrentStationSlug();

    if (recentHistoryStationBadge && currentChannel) {
      recentHistoryStationBadge.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${currentChannel.name}`;
    }

    // Guarantee strict uniqueness when rendering Web Radios! (Main station FM 99.4 is 100% untouched)
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
    }

    if (listToRender.length === 0) {
      recentTracksList.innerHTML = "";
      return;
    }

    const defaultFallback = getStationDefaultCover(currentChannel);

    // Prevent ANY wipe/flicker if the tracks rendered in DOM already match the list!
    const existingCards = recentTracksList.querySelectorAll(".recent-track-card");
    const sameItems = (existingCards.length === listToRender.length) && Array.from(existingCards).every((c, i) => {
      const tEl = c.querySelector(".recent-track-title");
      return tEl && tEl.innerText.trim() === listToRender[i].title.trim();
    });

    if (sameItems) {
      updateAllFavoriteStates();
      return;
    }

    recentTracksList.innerHTML = "";

    listToRender.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "recent-track-card";
      const isFav = isSongFavorite(item.title);
      
      // Artwork resolution:
      // For main station (Greca FM 99.4): uses Jazler artwork cache / fallback logo
      // For web radios: past tracks KEEP the exact artwork they had when they were first (#1)!
      const stationLogo = (currentChannel && currentChannel.image) || (currentChannel && currentChannel.logo) || getStationDefaultCover(currentChannel);
      const sanitized = sanitizeArtworkUrl(item.image, currentChannel);
      
      const cleanT = (item.title || "").replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").replace(/-.*/g, "").trim();
      const cleanA = (item.artist || "").replace(/GRECA.*/gi, "").replace(/WEB.*/gi, "").trim();
      const cacheKey = `${cleanA}_${cleanT}`.toUpperCase().replace(/\s+/g, " ");

      let itemArt = defaultFallback;
      if (slug === "main") {
        let mainArt = sanitized;
        if ((!mainArt || mainArt === defaultFallback || mainArt.includes("main.png") || mainArt.includes("mayro logo")) && trackArtCache[cacheKey]) {
          mainArt = trackArtCache[cacheKey];
          item.image = mainArt;
          item.hasResolvedArt = true;
        }
        itemArt = mainArt || defaultFallback;
      } else {
        // Web Radios: Strictly 1-to-1 matching.
        // A card only receives live artwork if its title actually MATCHES what is playing on air!
        const isCurrentStation = (getCurrentStationSlug() === slug);
        const liveTitle = (isCurrentStation && liveNowOnAir && liveNowOnAir.title)
          ? liveNowOnAir.title.trim().toUpperCase().replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").replace(/-.*/g, "").trim()
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
      }

      const hasAuthenticJazlerArt = itemArt && (itemArt.includes("jzSong_") || itemArt.includes("mzstatic.com"));
      if (hasAuthenticJazlerArt || slug !== "main") {
        item.hasResolvedArt = true;
      }

      card.innerHTML = `
        <div class="recent-track-left">
          <img class="recent-track-thumb track-thumb-${idx}" src="${itemArt}" alt="${item.title}" onerror="this.onerror=null;this.src='${slug === 'main' ? defaultFallback : stationLogo}';">
          <div class="recent-track-meta">
            <h4 class="recent-track-title">${item.title}</h4>
            <p class="recent-track-artist">${item.artist}</p>
          </div>
        </div>
        <div class="recent-track-right">
          <span class="recent-track-time">${item.time || ''}</span>
          <button class="recent-track-heart-btn ${isFav ? 'is-fav' : ''}" aria-label="Αγαπημένο" title="Προσθήκη στα αγαπημένα">
            <i class="fa-solid fa-heart"></i>
          </button>
        </div>
      `;

      // Resolve external artwork in background for ALL stations (Web Radios + Main) if image is fallback logo or artwork.jpg!
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
      }

      const heartBtn = card.querySelector(".recent-track-heart-btn");
      if (heartBtn) {
        heartBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleSongFavorite(item.title, item.artist);
        });
      }

      recentTracksList.appendChild(card);
    });

    updateAllFavoriteStates();
  }

  // -----------------------------------------------------------------
  // Apply Newly Detected Track
  // -----------------------------------------------------------------
  function applyNowPlayingTrack(rawTitle, rawArtist, rawArtwork, channel) {
    if (!rawTitle || !rawTitle.trim()) return;
    const normTitle = rawTitle.trim().toUpperCase();
    const ch = channel || (DATA.channels && DATA.channels[currentStationIdx]);
    const slug = (ch && ch.slug) ? ch.slug : "main";
    const defaultCover = getStationDefaultCover(ch);
    const fallbackArtist = getStationFallbackArtist(ch);
    const normArtist = (rawArtist && !rawArtist.includes("99,4") && !rawArtist.includes("99.4") && !rawArtist.includes("GRECA") && rawArtist !== ch.name ? rawArtist : fallbackArtist).trim().toUpperCase();

    // Absolute rejection of error codes, Cloudflare 520, HTML or junk strings
    if (!isValidTrackText(normTitle) || !isValidTrackText(normArtist)) {
      return;
    }

    const isNormalRadio = (slug === "main" || (ch && ch.id === "main-hq"));

    // -------------------------------------------------------------
    // WEB RADIOS ONLY: Jingle & Cut-Title & Duplicate Protection
    // (MAIN STATION IS 100% UNTOUCHED!)
    // -------------------------------------------------------------
    let cleanT = normTitle;
    let cleanA = normArtist;
    if (!isNormalRadio) {
      cleanT = normTitle.replace(/\ufffd/g, "").replace(/\?/g, "").trim();
      cleanA = normArtist.replace(/\ufffd/g, "").replace(/\?/g, "").trim();
      if (cleanT.length < 3 || cleanA.length < 2) return;

      const JINGLE_TERMS = ['GRECA', 'WEB RADIO', 'RADIOHOST', 'CLOUDSTREAMING', 'ENTEXNA', 'LAIKA', 'ERWTIKA', 'PARTY', 'LOUNGE', 'GLENTI', 'XMAS'];
      if (JINGLE_TERMS.some(k => cleanT.includes(k)) || cleanA.includes("GRECA") || cleanA.includes("WEB RADIO")) {
        return;
      }
    }

    // Check if we already have an authentic artwork cached for this song to PREVENT ALL FLICKER
    const cacheTitle = cleanT.replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").replace(/-.*/g, "").trim();
    const cacheArtist = cleanA.replace(/GRECA.*/gi, "").replace(/WEB.*/gi, "").trim();
    const cKey = `${cacheArtist}_${cacheTitle}`.toUpperCase().replace(/\s+/g, " ");
    const cachedArtwork = trackArtCache[cKey];

    let cleanArt = sanitizeArtworkUrl(rawArtwork, ch);
    const hasAuthenticJazlerArt = cleanArt && cleanArt.includes("jzSong_");

    let effectiveArt = cleanArt;
    if (hasAuthenticJazlerArt) {
      effectiveArt = cleanArt;
    } else if (cachedArtwork) {
      effectiveArt = cachedArtwork;
    } else if (!effectiveArt || effectiveArt.includes("main.png")) {
      effectiveArt = defaultCover;
    }

    if (!stationHistories[slug]) {
      stationHistories[slug] = [];
    }
    const historyList = stationHistories[slug];

    // For MAIN STATION (Greca FM 99.4):
    // Real-time track display on player is updated immediately.
    // Broadcast history is strictly synced from Jazler cloud history!
    if (isNormalRadio) {
      if (slug === getCurrentStationSlug()) {
        liveNowOnAir.title = normTitle;
        liveNowOnAir.artist = normArtist;
        liveNowOnAir.artwork = effectiveArt;
        syncLiveMetadata();
        updateAllFavoriteStates();
      }

      // If artwork is not authentic yet, resolve it via iTunes (1-shot) ONLY for main station!
      if (!hasAuthenticJazlerArt && !cachedArtwork) {
        const tId = setTimeout(() => {
          if (getCurrentStationSlug() !== "main") return;
          resolveTrackArtwork(normArtist, normTitle, defaultCover, (foundArt) => {
            if (foundArt && !foundArt.includes("main.png")) {
              trackArtCache[cKey] = foundArt;
              try {
                localStorage.setItem(STORAGE_KEY_TRACK_ARTWORKS, JSON.stringify(trackArtCache));
              } catch(e) {}
              if (getCurrentStationSlug() === "main" && liveNowOnAir.title === normTitle) {
                liveNowOnAir.artwork = foundArt;
                syncLiveMetadata();
              }
            }
          });
        }, 300);
        pendingArtworkTimers.push(tId);
      }
      return;
    }

    // For WEB RADIOS:
    // 1. Anti-truncation protection: Never allow an existing full title to be cut in half!
    if (slug === getCurrentStationSlug() && liveNowOnAir.title) {
      const curLive = liveNowOnAir.title.trim().toUpperCase();
      if (curLive.length > cleanT.length && curLive.startsWith(cleanT)) {
        cleanT = curLive;
      }
    }

    for (let i = 0; i < historyList.length; i++) {
      const oldT = (historyList[i].title || "").toUpperCase().replace(/\ufffd/g, "").trim();
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
    return;
  }

  function updateStationCardSubtitle(slug, artist, title) {
    const ch = DATA.channels.find(c => c.slug === slug);
    if (!ch) return;
    const isCurrent = (slug === getCurrentStationSlug());
    const descEl = document.querySelector(`.station-desc-${ch.id}`);
    if (descEl) {
      if (isCurrent && isPlaying && isValidTrackText(title) && isValidTrackText(artist) && artist !== ch.name) {
        descEl.innerText = `${artist} - ${title}`;
      } else {
        descEl.innerText = ch.description || getStationFallbackArtist(ch);
      }
    }
  }

  // -----------------------------------------------------------------
  // Bulletproof Universal HTTP Fetcher (Capacitor Native Android + Web)
  // Bypasses all browser CORS restrictions on mobile devices!
  // -----------------------------------------------------------------
  // -----------------------------------------------------------------
  // Bulletproof Universal HTTP GET Fetcher (Capacitor Native iOS/Android + Web)
  // Bypasses all browser CORS restrictions on mobile devices via native URLSession!
  // -----------------------------------------------------------------
  async function fetchUniversalText(url) {
    if (!url) return null;

    // 1. Native CapacitorHttp Plugin (Direct OS URLSession on iOS & HttpURLConnection on Android - 0% CORS)
    try {
      const cap = (typeof window !== "undefined" && window.Capacitor) ? window.Capacitor : null;
      const httpPlugin = (typeof window !== "undefined" && window.CapacitorHttp) || (cap && cap.Plugins && cap.Plugins.CapacitorHttp);
      if (httpPlugin && typeof httpPlugin.get === "function") {
        const res = await httpPlugin.get({
          url: url,
          headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
          connectTimeout: 7000,
          readTimeout: 7000
        });
        if (res && res.data) {
          const content = typeof res.data === "string" ? res.data : (typeof res.data === "object" ? JSON.stringify(res.data) : String(res.data));
          if (content && content.trim().length > 0 && !isServerErrorMessage(content)) {
            return content;
          }
        }
      } else if (cap && typeof cap.nativePromise === "function") {
        const res = await cap.nativePromise("CapacitorHttp", "get", {
          url: url,
          headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
          connectTimeout: 7000,
          readTimeout: 7000
        });
        if (res && res.data) {
          const content = typeof res.data === "string" ? res.data : (typeof res.data === "object" ? JSON.stringify(res.data) : String(res.data));
          if (content && content.trim().length > 0 && !isServerErrorMessage(content)) {
            return content;
          }
        }
      }
    } catch (httpErr) {}

    // 2. Direct Web Fetch
    try {
      const sep = url.includes("?") ? "&" : "?";
      const res = await fetch(url + sep + "_t=" + Date.now(), { cache: "no-store" });
      if (res && res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0 && !isServerErrorMessage(text)) {
          return text;
        }
      }
    } catch (webErr) {}

    return null;
  }

  // -----------------------------------------------------------------
  // Bulletproof Universal HTTP POST Fetcher (Capacitor Native iOS/Android + Web)
  // Bypasses all browser CORS restrictions on mobile devices via native URLSession!
  // -----------------------------------------------------------------
  async function fetchUniversalPost(url, postData) {
    if (!url) return null;
    const bodyStr = typeof postData === "string" ? postData : new URLSearchParams(postData).toString();

    // 1. Native CapacitorHttp Plugin (Direct OS URLSession on iOS - 0% CORS)
    try {
      const cap = (typeof window !== "undefined" && window.Capacitor) ? window.Capacitor : null;
      const httpPlugin = (typeof window !== "undefined" && window.CapacitorHttp) || (cap && cap.Plugins && cap.Plugins.CapacitorHttp);
      if (httpPlugin && typeof httpPlugin.post === "function") {
        const res = await httpPlugin.post({
          url: url,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
          },
          data: bodyStr,
          connectTimeout: 7000,
          readTimeout: 7000
        });
        if (res && res.data) {
          if (typeof res.data === "object") return res.data;
          try {
            return JSON.parse(res.data);
          } catch (_) {
            return res.data;
          }
        }
      } else if (cap && typeof cap.nativePromise === "function") {
        const res = await cap.nativePromise("CapacitorHttp", "post", {
          url: url,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
          },
          data: bodyStr,
          connectTimeout: 7000,
          readTimeout: 7000
        });
        if (res && res.data) {
          if (typeof res.data === "object") return res.data;
          try {
            return JSON.parse(res.data);
          } catch (_) {
            return res.data;
          }
        }
      }
    } catch (httpErr) {}

    // 2. Direct Web Fetch
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        body: bodyStr,
        cache: "no-store"
      });
      if (res && res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("json")) {
          return await res.json();
        }
        const txt = await res.text();
        try {
          return JSON.parse(txt);
        } catch (_) {
          return txt;
        }
      }
    } catch (webErr) {}

    return null;
  }

  // -----------------------------------------------------------------
  // Live Official Track History Fetcher (from genuine Jazler broadcast history)
  // Ensures "Τελευταία Τραγούδια" ALWAYS reflects the authentic songs played on air!
  // -----------------------------------------------------------------
  let isFetchingStationHistoryBySlug = {};
  async function fetchLiveStationHistory(slug = "main") {
    if (isFetchingStationHistoryBySlug[slug]) return null;
    isFetchingStationHistoryBySlug[slug] = true;

    try {
      // 1. Fetch real-time broadcast history from WordPress Sidekick API for ALL stations!
      const WORDPRESS_RADIO_IDS = {
        "main": "2968",
        "laiko": "7184",
        "entexno": "7294",
        "erwtiko": "7304",
        "party": "7307",
        "lounge": "44225",
        "glenti": "52965",
        "xmas": "119662"
      };
      const radioId = WORDPRESS_RADIO_IDS[slug] || (slug === "main" ? "2968" : null);

      if (radioId) {
        try {
          const rawItems = await fetchUniversalPost(
            "https://greca994.gr/wp-admin/admin-ajax.php",
            `action=prsidekick-get-history&radioid=${radioId}&quantity=8&offset=0&orderby=latest`
          );

          let itemsList = null;
          if (Array.isArray(rawItems)) {
            itemsList = rawItems;
          } else if (rawItems && typeof rawItems === "object") {
            itemsList = Object.values(rawItems);
          } else if (typeof rawItems === "string" && rawItems.trim().startsWith("[")) {
            try {
              itemsList = JSON.parse(rawItems.trim());
            } catch (_) {}
          }

          if (itemsList && Array.isArray(itemsList) && itemsList.length > 0) {
            const ch = (DATA.channels && DATA.channels.find(c => c.slug === slug)) || (DATA.channels && DATA.channels[0]);
            const defaultCover = getStationDefaultCover(ch);
            const fallbackArtist = (slug === "main") ? "GRECA FM 99,4" : getStationFallbackArtist(ch);
            const tracks = [];
            const seen = new Set();
            for (const entry of itemsList) {
              const s = entry && entry.song ? entry.song : entry;
              if (!s) continue;
              let a = (s.prsidekick_artist || s.artist || fallbackArtist).trim();
              let rawT = (s.prsidekick_song || s.title || "").trim();
              let t = getBestTrackTitle(rawT, a, slug);
              let playdate = s.prsidekick_latest_playdate || s.time || "";
              let timeStr = "";
              if (playdate && playdate.includes(" ")) {
                timeStr = playdate.split(" ")[1].slice(0, 5);
              } else if (playdate && playdate.includes(":")) {
                timeStr = playdate.slice(0, 5);
              }
              let art = s.prsidekick_art || s.image || "";
              if (art && art.startsWith("http://")) {
                art = "https://" + art.slice(7);
              }
              const upT = t.toUpperCase();
              const upA = (a || fallbackArtist).toUpperCase();
              if (isValidTrackText(upT) && isValidTrackText(upA) && !seen.has(upT)) {
                seen.add(upT);
                const stLogo = (ch && ch.image) || (ch && ch.logo) || defaultCover;
                const webradioArt = (art && !art.includes("artwork.jpg") && !art.includes("main.png")) ? sanitizeArtworkUrl(art, ch) : stLogo;
                tracks.push({
                  title: upT,
                  artist: upA,
                  time: timeStr || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
                  image: (slug === "main") ? (sanitizeArtworkUrl(art, ch) || defaultCover) : webradioArt,
                  hasResolvedArt: true
                });
              }
            }
            if (tracks.length >= 1) {
              return tracks;
            }
          }
        } catch (ajaxErr) {}
      }

      // 2. Try server API /api/history (Only in dev environment on localhost:8088)
      const isDevLocalServer = (typeof window !== "undefined") && 
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && 
        (window.location.port === "8088" || window.location.port === "8000");

      if (isDevLocalServer) {
        try {
          const res = await fetch(`/api/history?_t=${Date.now()}`, { cache: "no-store" }).catch(() => null);
          if (res && res.ok) {
            const dH = await res.json();
            const targetList = dH && (dH.stations ? dH.stations[slug] : dH[slug]);
            if (Array.isArray(targetList) && targetList.length > 0) {
              return targetList.slice(0, 5);
            }
          }
        } catch (e) {}
      }

      // 3. Fallback to bundled static server_station_history.json
      try {
        const res = await fetch("server_station_history.json").catch(() => null);
        if (res && res.ok) {
          const dH = await res.json();
          const targetList = dH && (dH.stations ? dH.stations[slug] : dH[slug]);
          if (Array.isArray(targetList) && targetList.length > 0) {
            return targetList.slice(0, 5);
          }
        }
      } catch (e) {}

      // 4. In-memory data schema fallback (Guaranteed 0ms sync on mobile!)
      if (DATA && DATA.initialHistoriesByStation && Array.isArray(DATA.initialHistoriesByStation[slug])) {
        return DATA.initialHistoriesByStation[slug].slice(0, 5);
      }
    } catch (err) {
    } finally {
      isFetchingStationHistoryBySlug[slug] = false;
    }
    return null;
  }

  // -----------------------------------------------------------------
  // Sync Main Station History From Cloud (Online Broadcast Jazler History)
  // Ensures past tracks (Slots 1-4) ALWAYS show the real songs played right before!
  let confirmedNowOnAirTrack = null;
  let confirmedWebNowOnAir = {};
  let lastMainHistorySyncTime = 0;
  let isSyncingMainHistory = false;
  async function syncMainStationHistoryFromCloud(force = false) {
    const now = Date.now();
    if (!force && (now - lastMainHistorySyncTime < 15000)) return;
    if (isSyncingMainHistory) return;
    isSyncingMainHistory = true;
    lastMainHistorySyncTime = now;

    try {
      const liveHistory = await fetchLiveStationHistory("main");
      if (liveHistory && Array.isArray(liveHistory) && liveHistory.length > 0) {
        const isMainActive = (getCurrentStationSlug() === "main");
        const merged = [];

        // Only prepend if confirmedNowOnAirTrack exists and is strictly different from the top item in broadcast history
        const hasLiveOnAir = isMainActive && confirmedNowOnAirTrack && confirmedNowOnAirTrack.title && isValidTrackText(confirmedNowOnAirTrack.title);
        const topHistoryTitle = liveHistory[0] && (liveHistory[0].title || "").trim().toUpperCase();

        if (hasLiveOnAir && confirmedNowOnAirTrack.title !== topHistoryTitle) {
          merged.push({
            title: confirmedNowOnAirTrack.title,
            artist: confirmedNowOnAirTrack.artist || "GRECA FM 99,4",
            time: confirmedNowOnAirTrack.time || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
            image: sanitizeArtworkUrl(confirmedNowOnAirTrack.artwork, DATA.channels[0]),
            hasResolvedArt: true
          });
        }

        // Add authentic songs from Jazler broadcast history
        for (const item of liveHistory) {
          if (merged.length >= 5) break;
          const itemTitle = (item.title || "").trim().toUpperCase();
          if (!merged.some(m => m.title && m.title.trim().toUpperCase() === itemTitle)) {
            merged.push({
              ...item,
              image: sanitizeArtworkUrl(item.image, DATA.channels[0])
            });
          }
        }

        const currentList = stationHistories["main"] || [];
        const oldSignature = currentList.map(t => `${t.title}_${t.time}`).join("|");
        const newSignature = merged.map(t => `${t.title}_${t.time}`).join("|");

        if (oldSignature !== newSignature && merged.length > 0) {
          stationHistories["main"] = merged.slice(0, 5);
          saveStationHistories();
          if (getCurrentStationSlug() === "main") {
            renderRecentlyPlayed();
          }
        }
      }
    } catch (err) {
      console.warn("syncMainStationHistoryFromCloud error", err);
    } finally {
      isSyncingMainHistory = false;
    }
  }

  // -----------------------------------------------------------------
  // Sync Web Radio History From Cloud (Authentic WordPress Sidekick Broadcast History)
  // Ensures past tracks (Slots 1-4) ALWAYS show the real songs played right before on that station!
  let lastWebHistorySyncTimes = {};
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
          const normLiveT = liveTrack.title.trim().toUpperCase().replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").replace(/-.*/g, "").trim();
          const cKey = `${(liveTrack.artist || '').trim()}_${normLiveT}`.toUpperCase().replace(/\s+/g, " ");
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
            const cleanT = (item.title || "").replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").replace(/-.*/g, "").trim();
            const cleanA = (item.artist || "").replace(/GRECA.*/gi, "").replace(/WEB.*/gi, "").trim().toUpperCase();
            const cKey = `${cleanA}_${cleanT}`.toUpperCase().replace(/\s+/g, " ");

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

            // Always adopt the best (longest, complete) title available:
            let songTitle = getBestTrackTitle(item.title, item.artist, slug);

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

  // -----------------------------------------------------------------
  // Dual-Engine Live Sync (Local API Server + Direct Cloud Fallback)
  // -----------------------------------------------------------------
  async function syncStationNowPlayingAndHistory(stationSlug, force = false) {
    const slug = stationSlug || getCurrentStationSlug();
    const channel = DATA.channels.find(c => c.slug === slug) || DATA.channels[0];

    // Helper for clean XML/HTML entity decoding
    const decodeXmlEntities = (s) => {
      if (!s || typeof s !== "string") return "";
      return s.replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&#39;/g, "'")
              .trim();
    };

    // 1. Local API Server (Only used in dev environment on localhost:8088/8000)
    const isDevLocalServer = (typeof window !== "undefined") && 
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && 
      (window.location.port === "8088" || window.location.port === "8000");

    if (isDevLocalServer) {
      try {
        const [resNow, resHist] = await Promise.all([
          fetch(`/api/nowplaying?station=${slug}&_t=${Date.now()}`, { cache: "no-store" }).catch(() => null),
          fetch(`/api/history?_t=${Date.now()}`, { cache: "no-store" }).catch(() => null)
        ]);

        if (resNow && resNow.ok) {
          const dN = await resNow.json();
          if (slug === getCurrentStationSlug() && dN && dN.title && dN.title.trim() && 
              isValidTrackText(dN.title) && isValidTrackText(dN.artist || "A")) {
            applyNowPlayingTrack(dN.title, dN.artist, sanitizeArtworkUrl(dN.artwork, channel), channel);
          }
        }

        if (resHist && resHist.ok) {
          const dH = await resHist.json();
          if (dH && dH.stations) {
            Object.keys(dH.stations).forEach(stSlug => {
              const histList = dH.stations[stSlug];
              if (Array.isArray(histList) && histList.length > 0) {
                if (stSlug === "main") {
                  const mainCh = DATA.channels ? DATA.channels[0] : null;
                  const formatted = histList.map(item => ({
                    ...item,
                    image: sanitizeArtworkUrl(item.image, mainCh)
                  })).filter(item => isValidTrackText(item.title) && isValidTrackText(item.artist || "A"));
                  
                  const isMainActive = (getCurrentStationSlug() === "main");
                  const activeTitle = isMainActive ? (liveNowOnAir.title || "").trim().toUpperCase() : "";
                  const hasValidActive = isMainActive && activeTitle && isValidTrackText(activeTitle);
                  const merged = [];
                  if (hasValidActive) {
                    const currentTop = stationHistories["main"] && stationHistories["main"][0];
                    merged.push({
                      title: activeTitle,
                      artist: liveNowOnAir.artist || "GRECA FM 99,4",
                      time: (currentTop && currentTop.time) ? currentTop.time : `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
                      image: (currentTop && currentTop.image) || liveNowOnAir.artwork,
                      hasResolvedArt: true
                    });
                  }
                  for (const item of formatted) {
                    if (merged.length >= 5) break;
                    if (!hasValidActive || (item.title && item.title.toUpperCase() !== activeTitle)) {
                      merged.push(item);
                    }
                  }
                  stationHistories[stSlug] = merged.slice(0, 5);
                } else {
                  const stChannel = DATA.channels.find(c => c.slug === stSlug);
                  stationHistories[stSlug] = cleanWebRadioTrackList(histList, stChannel);
                }
                const top = stationHistories[stSlug][0];
                if (top && top.title && isValidTrackText(top.title)) {
                  updateStationCardSubtitle(stSlug, top.artist, top.title);
                }
              }
            });
            saveStationHistories();
            if (slug === getCurrentStationSlug()) {
              renderRecentlyPlayed();
            }
          }
        }
      } catch (e) {}
    }

    // 2. Direct Web & Native Mobile Sync (Bypasses CORS via Capacitor Native HTTP)
    try {
      if (slug !== getCurrentStationSlug()) return;
      if (slug === "main") {
        // 1. Fetch current live song from NowOnAir.xml FIRST (Ground truth for real-time live playback)
        let liveXmlTrack = null;
        try {
          const raw = await fetchUniversalText("https://greca994.gr/playlist/NowOnAir.xml");
          if (raw && slug === getCurrentStationSlug()) {
            const mTitle = raw.match(/Song title="([^"]+)"/);
            const mArtist = raw.match(/Artist name="([^"]+)"/);
            const mImg = raw.match(/<CacheImageFile>([^<]+)<\/CacheImageFile>/);
            const mTime = raw.match(/startTime="([^"]+)"/);

            if (mTitle && mTitle[1]) {
              const t = decodeXmlEntities(mTitle[1]);
              const a = (mArtist && mArtist[1]) ? decodeXmlEntities(mArtist[1]) : "GRECA FM 99,4";
              const songTime = (mTime && mTime[1]) ? mTime[1].slice(0, 5) : "";
              if (isValidTrackText(t) && isValidTrackText(a)) {
                let art = getStationDefaultCover(channel);
                if (mImg && mImg[1] && mImg[1].trim().startsWith("jzSong_")) {
                  art = `https://greca994.gr/playlist/AlbumsCache/${mImg[1].trim()}`;
                }
                liveXmlTrack = { title: t, artist: a, artwork: art, time: songTime };
                confirmedNowOnAirTrack = { title: t.trim().toUpperCase(), artist: a.trim().toUpperCase(), artwork: art, time: songTime };
                applyNowPlayingTrack(t, a, art, channel);
              }
            }
          }
        } catch (xmlErr) {}

        // 2. Always sync authentic past broadcast history from Jazler online
        await syncMainStationHistoryFromCloud(false);
      } else {
        const txtUrl = channel.nowPlayingTxt || `https://greca994.gr/artwork/${slug}/nowplaying.txt`;
        const raw = await fetchUniversalText(txtUrl);
        if (raw && slug === getCurrentStationSlug() && !isServerErrorMessage(raw)) {
          const text = raw.trim();
          if (text) {
            let a = channel.name;
            let t = text;
            if (text.includes(" - ")) {
              const parts = text.split(" - ");
              a = parts[0].trim();
              t = parts.slice(1).join(" - ").trim();
            }
            a = decodeXmlEntities(a);
            t = decodeXmlEntities(t);
            if (isValidTrackText(t) && isValidTrackText(a)) {
              const baseArt = channel.artworkUrl || `https://greca994.gr/artwork/${slug === 'lounge' ? 'Lounge' : slug}/artwork.jpg`;
              const art = baseArt.includes("?") ? baseArt : `${baseArt}?t=${Date.now()}`;
              applyNowPlayingTrack(t, a, art, channel);
            }
          }
        }
        // 2. Always sync authentic real broadcast history from WordPress for this web radio!
        await syncWebRadioHistoryFromCloud(slug, force || (slug === getCurrentStationSlug()));
      }
    } catch (err) {}
  }

  // -----------------------------------------------------------------
  // syncAllWebRadiosLive disabled: Station cards always show clean descriptions
  // when not playing, and only show song titles when actively streaming.
  // -----------------------------------------------------------------
  async function syncAllWebRadiosLive() {
    return;
  }

  // -----------------------------------------------------------------
  // Audio Playback & Station Switching Engine (Instant Audio Response!)
  // -----------------------------------------------------------------
  let currentTuneId = 0;
  let bufferTimeout = null;
  let audioSwitchTimeout = null;
  let isSwitchingStation = false;

  function tuneStation(idx, shouldPlay = true) {
    if (idx < 0) idx = DATA.channels.length - 1;
    if (idx >= DATA.channels.length) idx = 0;

    const prevIdx = currentStationIdx;
    const stationChanged = (prevIdx !== idx);

    clearPendingArtworkTimers();
    if (audioSwitchTimeout) {
      clearTimeout(audioSwitchTimeout);
      audioSwitchTimeout = null;
    }
    if (bufferTimeout) {
      clearTimeout(bufferTimeout);
      bufferTimeout = null;
    }

    currentStationIdx = idx;
    const channel = DATA.channels[currentStationIdx];
    const slug = channel.slug || "main";

    // 1. Synchronous Instant UI Switch (0ms Response!)
    const fallbackArtist = getStationFallbackArtist(channel);
    const stationDefaultCover = getStationDefaultCover(channel);

    if (slug === "main") {
      if (confirmedNowOnAirTrack && confirmedNowOnAirTrack.title) {
        liveNowOnAir.title = confirmedNowOnAirTrack.title;
        liveNowOnAir.artist = confirmedNowOnAirTrack.artist;
        liveNowOnAir.artwork = confirmedNowOnAirTrack.artwork || stationDefaultCover;
      } else {
        liveNowOnAir.title = "GRECA FM 99,4";
        liveNowOnAir.artist = "ΜΟΝΟ ΕΠΙΤΥΧΙΕΣ";
        liveNowOnAir.artwork = stationDefaultCover;
      }
    } else {
      const liveTrack = liveWebRadioNowPlaying[slug] || (stationHistories[slug] && stationHistories[slug][0]);
      if (liveTrack && liveTrack.title && isValidTrackText(liveTrack.title)) {
        liveNowOnAir.title = (liveTrack.title || channel.name).trim().toUpperCase();
        liveNowOnAir.artist = (liveTrack.artist || fallbackArtist).trim().toUpperCase();
        liveNowOnAir.artwork = (liveTrack.image && sanitizeArtworkUrl(liveTrack.image, channel)) || channel.artworkUrl || stationDefaultCover;
      } else {
        liveNowOnAir.title = channel.name.toUpperCase();
        liveNowOnAir.artist = fallbackArtist.toUpperCase();
        liveNowOnAir.artwork = channel.artworkUrl || stationDefaultCover;
      }
    }

    syncLiveMetadata();
    updateOnAirPlayerBadge();
    renderBubbles();

    if (stationChanged) {
      renderRecentlyPlayed();
    }

    // 2. Audio Engine with Anti-Deadlock Stream Switching & Watchdog Recovery
    const thisTuneId = ++currentTuneId;

    if (shouldPlay) {
      isBuffering = true;
      isPlaying = true;
      isSwitchingStation = true;
      updatePlayStateUI();

      if (previewAudio && !previewAudio.paused) {
        try { previewAudio.pause(); } catch (e) {}
        activePreviewRank = null;
        updateChartPreviewUI();
      }

      if (audioSwitchTimeout) {
        clearTimeout(audioSwitchTimeout);
        audioSwitchTimeout = null;
      }
      if (bufferTimeout) {
        clearTimeout(bufferTimeout);
        bufferTimeout = null;
      }

      // Pause current audio cleanly
      try { audio.pause(); } catch (e) {}

      // Fast synchronous stream attachment for iOS (keeps User Activation flag active!)
      if (audio.src !== channel.streamUrl) {
        audio.src = channel.streamUrl;
        try { audio.load(); } catch (e) {}
      }
      isSwitchingStation = false;

      // Safety buffer watchdog: if stream doesn't play within 6s, cleanly recover UI
      bufferTimeout = setTimeout(() => {
        if (thisTuneId === currentTuneId && isBuffering) {
          if (channel.backupStreamUrl && audio.src !== channel.backupStreamUrl) {
            console.warn("Primary stream delayed, attempting backup:", channel.backupStreamUrl);
            audio.src = channel.backupStreamUrl;
            try { audio.load(); } catch (e) {}
            audio.play().catch(() => {});
          } else {
            console.warn("Playback buffering timed out, recovering play state");
            isBuffering = false;
            if (audio.paused) {
              isPlaying = false;
            }
            updatePlayStateUI();
          }
        }
      }, 6000);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (thisTuneId !== currentTuneId) return;
          isBuffering = false;
          isPlaying = true;
          if (bufferTimeout) { clearTimeout(bufferTimeout); bufferTimeout = null; }
          updatePlayStateUI();
        }).catch(err => {
          if (thisTuneId !== currentTuneId) return;
          if (err && err.name === "AbortError") {
            return; // Expected when rapidly interrupted by another station switch
          }
          console.warn("Stream playback rejected:", err);
          if (channel.backupStreamUrl && audio.src !== channel.backupStreamUrl) {
            audio.src = channel.backupStreamUrl;
            try { audio.load(); } catch (e) {}
            audio.play().then(() => {
              if (thisTuneId !== currentTuneId) return;
              isBuffering = false;
              isPlaying = true;
              if (bufferTimeout) { clearTimeout(bufferTimeout); bufferTimeout = null; }
              updatePlayStateUI();
            }).catch(() => {
              if (thisTuneId !== currentTuneId) return;
              isBuffering = false;
              isPlaying = false;
              updatePlayStateUI();
            });
          } else {
            isBuffering = false;
            isPlaying = false;
            updatePlayStateUI();
          }
        });
      }
    } else {
      isSwitchingStation = false;
      try { audio.pause(); } catch (e) {}
      audio.src = "";
      isBuffering = false;
      isPlaying = false;
      updatePlayStateUI();
    }

    // 3. Fast background network synchronization only if station changed
    if (stationChanged) {
      setTimeout(() => {
        if (thisTuneId === currentTuneId) {
          syncStationNowPlayingAndHistory(slug, true);
        }
      }, 150);
    }
  }

  function togglePlayback() {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      try { Notification.requestPermission().catch(() => {}); } catch(e) {}
    }

    const actuallyPlaying = (audio && !audio.paused && isPlaying);

    if (actuallyPlaying || (isBuffering && audio && !audio.paused)) {
      tuneStation(currentStationIdx, false);
    } else {
      tuneStation(currentStationIdx, true);
    }
  }

  // Audio Hardware Events for Instant UI Sync (Guarded against stream change aborts)
  let waitingWatchdog = null;

  audio.addEventListener("waiting", () => {
    if (isSwitchingStation || !isPlaying) return;
    isBuffering = true;
    updatePlayStateUI();

    if (waitingWatchdog) clearTimeout(waitingWatchdog);
    waitingWatchdog = setTimeout(() => {
      if (isBuffering && isPlaying) {
        isBuffering = false;
        if (audio.paused) {
          audio.play().catch(() => {
            isPlaying = false;
            updatePlayStateUI();
          });
        } else {
          updatePlayStateUI();
        }
      }
    }, 4500);
  });

  audio.addEventListener("playing", () => {
    isSwitchingStation = false;
    isBuffering = false;
    isPlaying = true;
    if (bufferTimeout) {
      clearTimeout(bufferTimeout);
      bufferTimeout = null;
    }
    if (waitingWatchdog) {
      clearTimeout(waitingWatchdog);
      waitingWatchdog = null;
    }
    updatePlayStateUI();
  });

  audio.addEventListener("canplay", () => {
    isSwitchingStation = false;
    isBuffering = false;
    isPlaying = true;
    if (bufferTimeout) {
      clearTimeout(bufferTimeout);
      bufferTimeout = null;
    }
    if (waitingWatchdog) {
      clearTimeout(waitingWatchdog);
      waitingWatchdog = null;
    }
    updatePlayStateUI();
  });

  audio.addEventListener("timeupdate", () => {
    if (isBuffering && isPlaying) {
      isBuffering = false;
      if (waitingWatchdog) {
        clearTimeout(waitingWatchdog);
        waitingWatchdog = null;
      }
      updatePlayStateUI();
    }
  });

  audio.addEventListener("pause", () => {
    if (isSwitchingStation) return;
    isBuffering = false;
    isPlaying = false;
    if (waitingWatchdog) {
      clearTimeout(waitingWatchdog);
      waitingWatchdog = null;
    }
    updatePlayStateUI();
  });

  audio.addEventListener("ended", () => {
    if (isSwitchingStation) return;
    isBuffering = false;
    isPlaying = false;
    if (waitingWatchdog) {
      clearTimeout(waitingWatchdog);
      waitingWatchdog = null;
    }
    updatePlayStateUI();
  });

  audio.addEventListener("error", (e) => {
    if (isSwitchingStation) return;
    console.warn("Audio hardware error event:", e);
    isBuffering = false;
    isPlaying = false;
    if (bufferTimeout) {
      clearTimeout(bufferTimeout);
      bufferTimeout = null;
    }
    if (waitingWatchdog) {
      clearTimeout(waitingWatchdog);
      waitingWatchdog = null;
    }
    updatePlayStateUI();
  });

  // -----------------------------------------------------------------
  // Render Top Station Bubbles Carousel
  // -----------------------------------------------------------------
  let bubbleHasMoved = false;

  function renderBubbles() {
    if (!stationsBubbleRow) return;

    const carouselCountEl = document.querySelector(".carousel-count");
    if (carouselCountEl && DATA && Array.isArray(DATA.channels)) {
      carouselCountEl.textContent = `${DATA.channels.length} Σταθμοί`;
    }

    const existingBubbles = stationsBubbleRow.querySelectorAll(".station-bubble-item");
    if (existingBubbles.length === DATA.channels.length) {
      existingBubbles.forEach((bubble, idx) => {
        const isCurrent = idx === currentStationIdx;
        bubble.classList.toggle("active-bubble", isCurrent);
        if (!bubble.dataset.hasListener) {
          bubble.dataset.hasListener = "true";
          bubble.addEventListener("click", () => {
            if (bubbleHasMoved) return;
            tuneStation(idx, true);
          });
        }
      });
      return;
    }

    stationsBubbleRow.innerHTML = "";
    DATA.channels.forEach((ch, idx) => {
      const isCurrent = idx === currentStationIdx;
      const isMainStation = ch.id === "main-hq" || idx === 0;
      const bubble = document.createElement("div");
      bubble.className = `station-bubble-item ${isCurrent ? 'active-bubble' : ''} ${isMainStation ? 'main-bubble' : 'webradio-bubble'}`;
      bubble.dataset.hasListener = "true";
      bubble.innerHTML = `
        <div class="bubble-avatar ${isMainStation ? 'main-station-bubble-avatar' : 'webradio-bubble-avatar'}">
          <img src="${ch.logo || ch.image}" alt="${ch.name}" class="${isMainStation ? 'main-avatar-img' : 'webradio-avatar-img'}">
          <span class="bubble-live-tag">LIVE</span>
        </div>
        <span class="bubble-label">${ch.name}</span>
      `;

      bubble.addEventListener("click", () => {
        if (bubbleHasMoved) return;
        tuneStation(idx, true);
      });

      stationsBubbleRow.appendChild(bubble);
    });
  }

  function setupCarouselScrolling() {
    if (bubbleScrollLeftBtn && stationsBubbleRow) {
      bubbleScrollLeftBtn.addEventListener("click", () => {
        stationsBubbleRow.scrollBy({ left: -160, behavior: 'smooth' });
      });
    }

    if (bubbleScrollRightBtn && stationsBubbleRow) {
      bubbleScrollRightBtn.addEventListener("click", () => {
        stationsBubbleRow.scrollBy({ left: 160, behavior: 'smooth' });
      });
    }

    if (stationsBubbleRow) {
      stationsBubbleRow.addEventListener("wheel", (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          stationsBubbleRow.scrollLeft += e.deltaY;
        }
      }, { passive: false });

      let isDown = false;
      let startX = 0;
      let scrollLeftPos = 0;

      stationsBubbleRow.addEventListener('mousedown', (e) => {
        isDown = true;
        bubbleHasMoved = false;
        stationsBubbleRow.classList.add('grabbing');
        startX = e.pageX - stationsBubbleRow.offsetLeft;
        scrollLeftPos = stationsBubbleRow.scrollLeft;
      });

      window.addEventListener('mouseup', () => {
        isDown = false;
        if (stationsBubbleRow) stationsBubbleRow.classList.remove('grabbing');
      });

      stationsBubbleRow.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - stationsBubbleRow.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 5) bubbleHasMoved = true;
        stationsBubbleRow.scrollLeft = scrollLeftPos - walk;
      });
    }
  }

  // -----------------------------------------------------------------
  // Render Stations List with Working Category Filtering
  // -----------------------------------------------------------------
  function renderStationsList() {
    if (!stationsCardsContainer) return;

    const filtered = DATA.channels.filter(ch => {
      if (activeFilter === "all") return true;
      return ch.category === activeFilter;
    });

    if (categoryFilterLabel) {
      categoryFilterLabel.innerText = `${filtered.length} Σταθμοί`;
    }

    const existingCards = stationsCardsContainer.querySelectorAll(".station-item-card");
    if (activeFilter === "all" && existingCards.length === DATA.channels.length) {
      existingCards.forEach((card, idx) => {
        const globalIdx = (card.dataset.stationIndex !== undefined && card.dataset.stationIndex !== "") ? parseInt(card.dataset.stationIndex, 10) : idx;
        const isCurrent = globalIdx === currentStationIdx;
        card.classList.toggle("is-playing", isCurrent && isPlaying);
        const icon = card.querySelector(".station-play-btn-circle i");
        if (icon) {
          icon.className = `fa-solid ${isCurrent && isPlaying ? 'fa-pause' : 'fa-play'}`;
        }
        const chItem = (DATA.channels && DATA.channels[globalIdx]) ? DATA.channels[globalIdx] : null;
        if (chItem) {
          const descEl = card.querySelector(`.station-desc-${chItem.id}`);
          if (descEl) {
            if (isCurrent && isPlaying && isValidTrackText(liveNowOnAir.title) && isValidTrackText(liveNowOnAir.artist) && liveNowOnAir.artist !== chItem.name) {
              descEl.innerText = `${liveNowOnAir.artist} - ${liveNowOnAir.title}`;
            } else {
              descEl.innerText = chItem.description || getStationFallbackArtist(chItem);
            }
          }
        }
        if (!card.dataset.hasListener) {
          card.dataset.hasListener = "true";
          card.addEventListener("click", () => {
            if (globalIdx === currentStationIdx) {
              togglePlayback();
            } else {
              tuneStation(globalIdx, true);
            }
          });
        }
      });
      return;
    }

    stationsCardsContainer.innerHTML = "";

    filtered.forEach(ch => {
      const globalIdx = DATA.channels.findIndex(c => c.id === ch.id);
      const isCurrent = globalIdx === currentStationIdx;
      const isMainStation = ch.id === "main-hq" || globalIdx === 0;

      let subtitleText = ch.description || getStationFallbackArtist(ch);
      if (isCurrent && isPlaying && isValidTrackText(liveNowOnAir.title) && isValidTrackText(liveNowOnAir.artist) && liveNowOnAir.artist !== ch.name) {
        subtitleText = `${liveNowOnAir.artist} - ${liveNowOnAir.title}`;
      }

      const card = document.createElement("div");
      card.dataset.stationIndex = globalIdx;
      card.className = `station-item-card ${isCurrent && isPlaying ? 'is-playing' : ''} ${isMainStation ? 'main-card' : 'webradio-card'}`;
      card.innerHTML = `
        <div class="station-card-logo-box ${isMainStation ? 'main-card-logo-box' : 'webradio-card-box'}">
          <img src="${ch.logo || ch.image}" alt="${ch.name}" class="${isMainStation ? 'main-card-img' : 'webradio-card-img'}">
        </div>
        <div class="station-card-info">
          <h4>${ch.name}</h4>
          <p class="station-card-desc station-desc-${ch.id}">${subtitleText}</p>
          <div class="station-tags-row">
            <span class="tag-mini red-tag">${ch.categoryName || "Web Radio"}</span>
            <span class="tag-mini">${ch.bitrate || "192 kbps"}</span>
          </div>
        </div>
        <button class="station-play-btn-circle" aria-label="Αναπαραγωγή">
          <i class="fa-solid ${isCurrent && isPlaying ? 'fa-pause' : 'fa-play'}"></i>
        </button>
      `;

      card.addEventListener("click", () => {
        if (globalIdx === currentStationIdx) {
          togglePlayback();
        } else {
          tuneStation(globalIdx, true);
        }
      });

      stationsCardsContainer.appendChild(card);
    });
  }

  if (categoryPillsRow) {
    categoryPillsRow.addEventListener("click", (e) => {
      const pill = e.target.closest(".cat-pill");
      if (!pill) return;
      document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      activeFilter = pill.dataset.cat || "all";
      renderStationsList();
    });
  }

  // -----------------------------------------------------------------
  // Shows Timeline & Daily Schedule Engine (Matching Official Site)
  // -----------------------------------------------------------------
  const SCHEDULE_DAYS = {
    1: "ΔΕΥΤΕΡΑ",
    2: "ΤΡΙΤΗ",
    3: "ΤΕΤΑΡΤΗ",
    4: "ΠΕΜΠΤΗ",
    5: "ΠΑΡΑΣΚΕΥΗ",
    6: "ΣΑΒΒΑΤΟ",
    0: "ΚΥΡΙΑΚΗ"
  };

  function renderShows(dayKey) {
    if (!showsTimelineContainer || !DATA.weeklySchedule) return;

    if (dayKey !== undefined && dayKey !== null) {
      selectedScheduleDay = parseInt(dayKey, 10);
    } else {
      selectedScheduleDay = new Date().getDay();
    }

    // 1. Update Day Nav Pills active state
    if (scheduleDaysNavRow) {
      const pills = scheduleDaysNavRow.querySelectorAll(".day-nav-pill");
      pills.forEach(pill => {
        const pDay = parseInt(pill.dataset.day, 10);
        if (pDay === selectedScheduleDay) {
          pill.classList.add("active");
          try {
            pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          } catch (e) {}
        } else {
          pill.classList.remove("active");
        }
      });
    }

    // 2. Update Header Badge label
    if (scheduleDayBadge) {
      scheduleDayBadge.innerText = SCHEDULE_DAYS[selectedScheduleDay] || "GRECA FM 99,4";
    }

    // 3. Select list: Weekdays (1-5: Δευτέρα - Παρασκευή) or Weekend (6, 0: Σάββατο - Κυριακή)
    const isWeekend = (selectedScheduleDay === 6 || selectedScheduleDay === 0);
    const scheduleList = isWeekend ? (DATA.weeklySchedule.weekend || []) : (DATA.weeklySchedule.weekdays || []);

    // 4. Calculate if selected day is TODAY and check which show is currently on air
    const now = new Date();
    const isToday = (now.getDay() === selectedScheduleDay);
    const currentMins = now.getHours() * 60 + now.getMinutes();

    showsTimelineContainer.innerHTML = "";

    scheduleList.forEach(show => {
      const startMins = show.startHour * 60 + (show.startMin || 0);
      let endMins = show.endHour * 60 + (show.endMin || 0);
      if (show.endHour === 24 || (show.endHour === 0 && show.endMin === 0 && startMins > 0)) {
        endMins = 24 * 60;
      }

      let isOnAir = false;
      if (isToday) {
        if (currentMins >= startMins && currentMins < endMins) {
          isOnAir = true;
        }
      }

      const card = document.createElement("div");
      card.className = `show-card-banner ${isOnAir ? 'is-on-air' : ''}`;
      card.title = "Πατήστε για πληροφορίες εκπομπής";
      card.innerHTML = `
        <div class="show-card-image-wrap">
          <img src="${show.image}" alt="${show.title}" class="show-card-img" loading="lazy">
          <div class="show-card-gradient-overlay"></div>
          ${isOnAir ? `
            <div class="show-live-chip">
              <span class="live-dot-pulse"></span>
              <span>NOW ON AIR</span>
            </div>
          ` : ''}
          <div class="show-card-banner-content">
            <span class="show-tag-box">${show.tag || 'NON STOP MUSIC'}</span>
            <h4 class="show-card-title">${show.title}</h4>
            <div class="show-card-time-row">
              <i class="fa-regular fa-clock"></i>
              <span class="show-card-time-text">${show.time}</span>
              ${show.presenter ? `
                <span class="show-presenter-divider">•</span>
                <span class="show-presenter-name">${show.presenter}</span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      // Open show details popup on tap
      card.addEventListener("click", () => {
        openShowModal(show);
      });
      showsTimelineContainer.appendChild(card);
    });

    if (isToday) {
      setTimeout(() => {
        const onAirCard = showsTimelineContainer.querySelector(".show-card-banner.is-on-air");
        if (onAirCard) {
          onAirCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }

  function getCurrentOnAirShow() {
    if (!DATA.weeklySchedule) return null;
    const now = new Date();
    const day = now.getDay();
    const isWeekend = (day === 6 || day === 0);
    const scheduleList = isWeekend ? (DATA.weeklySchedule.weekend || []) : (DATA.weeklySchedule.weekdays || []);
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const currentShow = scheduleList.find(s => {
      const sMins = s.startHour * 60 + (s.startMin || 0);
      let eMins = s.endHour * 60 + (s.endMin || 0);
      if (s.endHour === 24 || (s.endHour === 0 && s.endMin === 0 && sMins > 0)) {
        eMins = 24 * 60;
      }
      return currentMins >= sMins && currentMins < eMins;
    });

    return currentShow || scheduleList[0];
  }

  function updateKonstantarasBadge() {
    const liveChip = document.getElementById("homeKonstantarasLiveChip");
    const banner = document.getElementById("homeMorningShowBanner");
    const now = new Date();
    const day = now.getDay();
    const hr = now.getHours();
    const isWeekDay = (day >= 1 && day <= 5);
    const isOnAir = isWeekDay && (hr >= 8 && hr < 10);

    if (liveChip) {
      liveChip.style.display = isOnAir ? "inline-flex" : "none";
    }
    if (banner) {
      if (isOnAir) {
        banner.classList.add("is-on-air");
      } else {
        banner.classList.remove("is-on-air");
      }
    }
  }

  function updateOnAirPlayerBadge() {
    updateKonstantarasBadge();
    if (!currentShowBadge) return;
    if (currentStationIdx !== 0) {
      // Web radios do not have live shows: hide the badge completely
      if (mainOnAirBadgeWrap) {
        mainOnAirBadgeWrap.style.display = "none";
      }
      return;
    }
    // Main radio (Greca FM 99,4) has live radio shows
    if (mainOnAirBadgeWrap) {
      mainOnAirBadgeWrap.style.display = "";
    }
    const show = getCurrentOnAirShow();
    if (show) {
      currentShowBadge.innerText = `${show.time} ${show.title}`;
    }
  }

  function openShowModal(show) {
    if (!showModalBackdrop || !show) return;
    currentModalShow = show;

    if (modalShowImg) {
      modalShowImg.decoding = "async";
      modalShowImg.loading = "lazy";
      modalShowImg.src = show.image;
    }
    if (modalShowTag) modalShowTag.innerText = show.tag || "SHOW";
    if (modalShowTitle) modalShowTitle.innerText = show.title || "";
    if (modalShowPresenter) modalShowPresenter.innerText = show.presenter || "";

    if (modalShowParagraphs) {
      modalShowParagraphs.innerHTML = "";
      const paras = show.paragraphs || (show.description ? [show.description] : []);
      paras.forEach(pText => {
        const p = document.createElement("p");
        p.innerText = pText;
        modalShowParagraphs.appendChild(p);
      });

      // Quick action: View Full Schedule
      const jumpRow = document.createElement("div");
      jumpRow.className = "modal-schedule-jump-row";
      jumpRow.style.cssText = "margin-top: 24px; text-align: center; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08);";
      jumpRow.innerHTML = `
        <button type="button" class="modal-schedule-jump-btn" style="background: linear-gradient(135deg, #e50914, #b20710); color: #fff; border: none; border-radius: 999px; padding: 12px 22px; font-weight: 700; font-size: 13.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 16px rgba(229,9,20,0.35); transition: transform 0.2s;">
          <i class="fa-solid fa-calendar-days"></i>
          <span>Πλήρες Πρόγραμμα Εκπομπών</span>
        </button>
      `;
      const btn = jumpRow.querySelector(".modal-schedule-jump-btn");
      if (btn) {
        btn.addEventListener("click", () => {
          closeShowModal();
          switchTab("tab-shows");
        });
      }
      modalShowParagraphs.appendChild(jumpRow);
    }

    const scrollContainer = showModalBackdrop.querySelector(".show-modal-scrollable");
    if (scrollContainer) scrollContainer.scrollTop = 0;

    showModalBackdrop.classList.add("is-open");
  }

  function closeShowModal() {
    if (showModalBackdrop) {
      showModalBackdrop.classList.remove("is-open");
    }
  }

  // -----------------------------------------------------------------
  // Article Reader Modal (Pop-up on tap)
  // -----------------------------------------------------------------
  function openArticleModal(article) {
    if (!articleModalBackdrop || !article) return;
    currentModalArticle = article;

    if (modalArticleImg) {
      modalArticleImg.decoding = "async";
      modalArticleImg.loading = "lazy";
      modalArticleImg.src = article.image || "assets/stations/main.png";
      modalArticleImg.onerror = () => { modalArticleImg.src = "assets/stations/main.png"; };
    }
    if (modalArticleTag) modalArticleTag.innerText = article.tag || "ΜΟΥΣΙΚΑ ΝΕΑ";
    if (modalArticleTitle) modalArticleTitle.innerText = article.title || "";
    if (modalArticleDate) modalArticleDate.innerText = article.date || "";

    if (modalArticleContent) {
      let contentHtml = article.content || "<p>Δεν υπάρχει διαθέσιμο κείμενο.</p>";
      if (typeof contentHtml === "string" && contentHtml.includes("<img")) {
        contentHtml = contentHtml.replace(/<img\s+/gi, '<img loading="lazy" decoding="async" ');
      }
      modalArticleContent.innerHTML = contentHtml;
    }

    if (modalArticleWebLink) {
      modalArticleWebLink.href = article.link || "https://greca994.gr";
    }

    const scrollContainer = articleModalBackdrop.querySelector(".show-modal-scrollable");
    if (scrollContainer) scrollContainer.scrollTop = 0;

    articleModalBackdrop.classList.add("is-open");
  }

  function closeArticleModal() {
    if (articleModalBackdrop) {
      articleModalBackdrop.classList.remove("is-open");
    }
  }

  // -----------------------------------------------------------------
  // News Articles Feed & Filtering (Matching Home & Shows Aesthetics)
  // -----------------------------------------------------------------
  // Background Preloader: Preload & Decode all images into memory cache so page changes have 0ms lag
  function preloadAndDecodeNewsImages(items) {
    if (!items || !items.length || typeof Image === "undefined") return;
    items.forEach(item => {
      if (item.image && item.image.startsWith("http")) {
        const preImg = new Image();
        preImg.src = item.image;
        if (preImg.decode) {
          preImg.decode().catch(() => {});
        }
      }
    });
  }

  function updateNewsCountDisplay(totalCount, totalPages) {
    if (!newsCountPill) return;
    if (totalPages > 1) {
      newsCountPill.innerText = `Σελίδα ${newsCurrentPage} από ${totalPages} (${totalCount})`;
    } else {
      newsCountPill.innerText = `${totalCount} Άρθρα`;
    }
  }

  function switchNewsPage(targetPage, totalPages) {
    if (targetPage < 1 || targetPage > totalPages || targetPage === newsCurrentPage) return;
    newsCurrentPage = targetPage;

    // 0ms INSTANT SWITCH: Reveal target container and hide others (images already in DOM!)
    if (newsFeedWrapper) {
      const containers = newsFeedWrapper.querySelectorAll(".news-page-container");
      containers.forEach(cont => {
        const p = parseInt(cont.getAttribute("data-page"), 10);
        cont.style.display = (p === newsCurrentPage) ? "flex" : "none";
      });
    }

    let filteredCount = loadedNewsItems.length;
    if (currentNewsFilter === "89") {
      filteredCount = loadedNewsItems.filter(i => i.isPremiere || (i.categories && i.categories.includes(89))).length;
    } else if (currentNewsFilter === "3") {
      filteredCount = loadedNewsItems.filter(i => !i.isPremiere || (i.categories && i.categories.includes(3))).length;
    }

    updateNewsCountDisplay(filteredCount, totalPages);
    renderPaginationControls(totalPages);
    scrollToNewsTop();
  }

  function renderFilteredNews() {
    if (!newsFeedWrapper) return;
    newsFeedWrapper.innerHTML = "";

    let filtered = [];
    if (currentNewsFilter === "all") {
      filtered = [...loadedNewsItems];
    } else if (currentNewsFilter === "89") {
      filtered = loadedNewsItems.filter(item => item.isPremiere || (item.categories && item.categories.includes(89)));
    } else if (currentNewsFilter === "3") {
      filtered = loadedNewsItems.filter(item => !item.isPremiere || (item.categories && item.categories.includes(3)));
    }

    if (filtered.length === 0) {
      newsFeedWrapper.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #94A3B8;">
          <i class="fa-regular fa-folder-open" style="font-size: 36px; margin-bottom: 12px; display: block; opacity: 0.6;"></i>
          <p style="font-size: 14px; font-weight: 700;">Δεν βρέθηκαν άρθρα σε αυτή την κατηγορία</p>
        </div>
      `;
      if (newsPaginationTop) newsPaginationTop.style.display = "none";
      if (newsPaginationBar) newsPaginationBar.style.display = "none";
      if (newsCountPill) newsCountPill.innerText = "0 Άρθρα";
      return;
    }

    // Preload & decode all images across all pages immediately!
    preloadAndDecodeNewsImages(filtered);

    // Distribute into exactly 3 pages for "Όλα" and "Μουσικά Νέα", 1 page for "Πρώτες Μεταδόσεις"
    const totalPages = (currentNewsFilter === "89") ? 1 : 3;
    const perPage = Math.max(1, Math.ceil(filtered.length / totalPages));

    if (newsCurrentPage > totalPages) newsCurrentPage = totalPages;
    if (newsCurrentPage < 1) newsCurrentPage = 1;

    // Render ALL pages into DOM containers.
    // Page 1 is visible, Page 2 & 3 are loaded in DOM but hidden with display:none.
    // When the user changes page, switching is 100% instantaneous with 0ms image delay!
    for (let p = 1; p <= totalPages; p++) {
      const pageContainer = document.createElement("div");
      pageContainer.className = "news-page-container";
      pageContainer.setAttribute("data-page", String(p));
      pageContainer.style.display = (p === newsCurrentPage) ? "flex" : "none";

      const startIdx = (p - 1) * perPage;
      const pageItems = filtered.slice(startIdx, startIdx + perPage);

      pageItems.forEach(item => {
        const card = document.createElement("article");
        card.className = "news-article-card";
        card.innerHTML = `
          <div class="news-card-image-wrap">
            <img class="news-card-thumb-img" src="${item.image}" alt="${item.title}" loading="eager" decoding="async" onerror="this.src='assets/stations/main.png'">
            <div class="news-card-gradient"></div>
            <div class="news-card-badges-row">
              <span class="news-card-tag ${item.isPremiere ? 'premiere' : 'music'}">
                <i class="fa-solid ${item.isPremiere ? 'fa-star' : 'fa-music'}"></i>
                ${item.tag}
              </span>
              <span class="news-card-date-badge">
                <i class="fa-regular fa-calendar"></i>
                ${item.date}
              </span>
            </div>
          </div>
          <div class="news-card-body">
            <h4 class="news-card-title">${item.title}</h4>
            <p class="news-card-snippet">${item.snippet}</p>
            <div class="news-card-footer">
              <span class="news-card-cta-btn">Διαβάστε το άρθρο <i class="fa-solid fa-arrow-right"></i></span>
            </div>
          </div>
        `;
        card.addEventListener("click", () => openArticleModal(item));
        pageContainer.appendChild(card);
      });

      newsFeedWrapper.appendChild(pageContainer);
    }

    updateNewsCountDisplay(filtered.length, totalPages);
    renderPaginationControls(totalPages);
  }

  function updateSinglePaginationBar(barEl, prevBtn, nextBtn, numbersWrap, totalPages) {
    if (!barEl) return;

    if (totalPages <= 1) {
      barEl.style.display = "none";
      return;
    }

    barEl.style.display = "flex";

    if (prevBtn) {
      prevBtn.disabled = (newsCurrentPage <= 1);
    }
    if (nextBtn) {
      nextBtn.disabled = (newsCurrentPage >= totalPages);
    }

    if (numbersWrap) {
      numbersWrap.innerHTML = "";
      for (let p = 1; p <= totalPages; p++) {
        const numBtn = document.createElement("button");
        numBtn.className = `news-page-num-btn ${p === newsCurrentPage ? 'active' : ''}`;
        numBtn.innerText = p;
        numBtn.setAttribute("aria-label", `Σελίδα ${p}`);
        numBtn.title = `Σελίδα ${p}`;
        numBtn.addEventListener("click", () => {
          switchNewsPage(p, totalPages);
        });
        numbersWrap.appendChild(numBtn);
      }
    }
  }

  function renderPaginationControls(totalPages) {
    updateSinglePaginationBar(newsPaginationTop, newsTopPrevBtn, newsTopNextBtn, newsTopNumbersWrap, totalPages);
    updateSinglePaginationBar(newsPaginationBar, newsPagePrevBtn, newsPageNextBtn, newsPageNumbersWrap, totalPages);
  }

  function scrollToNewsTop() {
    const filterBar = document.querySelector(".news-filter-bar-wrapper");
    if (filterBar) {
      filterBar.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function fetchNewsArticles(isManual = false) {
    if (!newsFeedWrapper) return;
    if (loadedNewsItems.length === 0 || isManual) {
      showNewsLoadingState();
    }

    try {
      let posts = null;
      try {
        const res = await fetch("/api/posts?_t=" + Date.now(), { cache: "no-store" });
        if (res.ok) {
          posts = await res.json();
        }
      } catch (err) {}

      // Standalone direct fallback if local server is bypassed
      if (!posts || posts.length === 0) {
        try {
          const tNow = Date.now();
          async function fetchWpBatch(cat, page) {
            const u = `https://greca994.gr/wp-json/wp/v2/posts?categories=${cat}&_embed=1&per_page=12&page=${page}&_t=${tNow}`;
            try {
              const res = await fetch(u, { cache: "no-store" });
              if (res.ok) return await res.json();
            } catch (e) {}
            try {
              const raw = await fetchUniversalText(u);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
              }
            } catch (e) {}
            return [];
          }

          const [p3_1, p3_2, p3_3, p89] = await Promise.all([
            fetchWpBatch(3, 1),
            fetchWpBatch(3, 2),
            fetchWpBatch(3, 3),
            fetchWpBatch(89, 1)
          ]);

          const seen = new Set();
          posts = [];
          [...p3_1, ...p3_2, ...p3_3, ...p89].forEach(p => {
            if (p && p.id && !seen.has(p.id)) {
              seen.add(p.id);
              posts.push(p);
            }
          });
        } catch (err) {}
      }

      if (posts && posts.length > 0) {
        loadedNewsItems = [];
        const parser = new DOMParser();
        posts.forEach(post => {
          const title = parser.parseFromString(post.title?.rendered || "", "text/html").body.textContent;
          let img = "assets/stations/main.png";
          const media = (post._embedded && post._embedded["wp:featuredmedia"]) ? post._embedded["wp:featuredmedia"][0] : null;
          if (media) {
            const sizes = media.media_details && media.media_details.sizes;
            // Prefer optimized medium_large (768px) or medium (300px) which load instantly (30-50KB vs 4MB full original)
            img = (sizes && sizes.medium_large && sizes.medium_large.source_url)
               || (sizes && sizes.medium && sizes.medium.source_url)
               || media.source_url
               || "assets/stations/main.png";
          } else if (post.meta && post.meta.fifu_image_url) {
            img = post.meta.fifu_image_url;
          } else if (post.featured_media_src_url) {
            img = post.featured_media_src_url;
          }

          const cats = post.categories || [];
          const isPremiere = cats.includes(89);
          const tagText = isPremiere ? "ΠΡΩΤΗ ΜΕΤΑΔΟΣΗ" : "ΜΟΥΣΙΚΑ ΝΕΑ";

          const d = new Date(post.date);
          const dateStr = !isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` : "";
          const snippet = parser.parseFromString(post.excerpt?.rendered || "", "text/html").body.textContent;
          const fullContent = post.content?.rendered || `<p>${snippet}</p>`;

          loadedNewsItems.push({
            title: title,
            image: img,
            tag: tagText,
            isPremiere: isPremiere,
            categories: cats,
            rawDate: post.date,
            date: dateStr,
            snippet: snippet,
            content: fullContent,
            link: post.link || "https://greca994.gr"
          });
        });

        // Strict chronological sorting by date descending (newest articles on top!)
        loadedNewsItems.sort((a, b) => {
          const tA = new Date(a.rawDate || a.date).getTime() || 0;
          const tB = new Date(b.rawDate || b.date).getTime() || 0;
          return tB - tA;
        });

        try {
          localStorage.setItem("greca_cached_news", JSON.stringify(loadedNewsItems));
        } catch (e) {}

        // Background Preloader: Preload all images into memory cache so page 2 & 3 images appear with 0ms lag!
        loadedNewsItems.forEach(item => {
          if (item.image && item.image.startsWith("http")) {
            const preImg = new Image();
            preImg.src = item.image;
          }
        });

        renderFilteredNews();
        if (isManual) showNotification("Τα νέα ενημερώθηκαν", "fa-solid fa-newspaper");
        return;
      }
    } catch (e) {}

    if (DATA.articles) {
      loadedNewsItems = [];
      DATA.articles.forEach(art => {
        const isPremiere = (art.categories && art.categories.includes(89)) || art.category === "ΠΡΩΤΗ ΜΕΤΑΔΟΣΗ";
        loadedNewsItems.push({
          title: art.title,
          image: art.image,
          tag: art.category,
          isPremiere: isPremiere,
          categories: art.categories || (isPremiere ? [89] : [3]),
          rawDate: art.date,
          date: art.date,
          snippet: art.summary,
          content: `<p>${art.summary}</p>`,
          link: art.link || "https://greca994.gr"
        });
      });
      loadedNewsItems.sort((a, b) => {
        const tA = new Date(a.rawDate || a.date).getTime() || 0;
        const tB = new Date(b.rawDate || b.date).getTime() || 0;
        return tB - tA;
      });
      renderFilteredNews();
    }
  }

  // -----------------------------------------------------------------
  // CarPlay Tiles
  // -----------------------------------------------------------------
  function renderCarPlayTiles() {
    if (!cpStationsTiles) return;
    cpStationsTiles.innerHTML = "";

    DATA.channels.forEach((ch, idx) => {
      const tile = document.createElement("div");
      tile.className = "cp-tile-item";
      tile.innerHTML = `
        <img src="${ch.logo || ch.image}" alt="${ch.name}">
        <span>${ch.name}</span>
      `;
      tile.addEventListener("click", () => {
        tuneStation(idx, true);
      });
      cpStationsTiles.appendChild(tile);
    });
  }

  // -----------------------------------------------------------------
  // Top 30 Airplay Chart Manager
  function loadInitialTop30() {
    try {
      const cached = localStorage.getItem("greca_cached_top30");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return (DATA && Array.isArray(DATA.top30)) ? [...DATA.top30] : [];
  }
  let chartDataList = loadInitialTop30();

  function updateChartPreviewUI() {
    if (chartTracksList) {
      chartTracksList.querySelectorAll(".chart-track-card").forEach(card => {
        const r = parseInt(card.dataset.rank, 10);
        const thumb = card.querySelector(".chart-track-thumb");
        const playBtn = card.querySelector(".chart-preview-btn");
        const isThisPlaying = (activePreviewRank === r);

        if (thumb) {
          thumb.classList.toggle("is-playing", isThisPlaying);
          const overlayIcon = thumb.querySelector(".chart-thumb-overlay i");
          if (overlayIcon) overlayIcon.className = isThisPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";
        }

        if (playBtn) {
          playBtn.classList.toggle("is-playing", isThisPlaying);
        }
      });
    }
  }

  function toggleTrackPreview(track) {
    if (!track || !track.audio) {
      showNotification("Δεν υπάρχει διαθέσιμο δείγμα ήχου", "fa-solid fa-circle-exclamation");
      return;
    }

    if (activePreviewRank === track.rank) {
      previewAudio.pause();
      activePreviewRank = null;
      updateChartPreviewUI();
      tuneStation(currentStationIdx, true);
      return;
    }

    // If main live radio stream was playing, pause it
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      updatePlayStateUI();
    }

    previewAudio.pause();
    previewAudio.src = track.audio;
    previewAudio.load();
    activePreviewRank = track.rank;
    updateChartPreviewUI();

    previewAudio.play().catch(e => {
      console.warn("Preview playback error:", e);
      activePreviewRank = null;
      updateChartPreviewUI();
    });
  }

  previewAudio.addEventListener("ended", () => {
    activePreviewRank = null;
    updateChartPreviewUI();
    // Automatically start/resume the live radio station stream
    tuneStation(currentStationIdx, true);
  });

  previewAudio.addEventListener("error", () => {
    activePreviewRank = null;
    updateChartPreviewUI();
  });

  function renderTop30Chart() {
    if (!chartTracksList) return;

    if (!Array.isArray(chartDataList) || chartDataList.length === 0) {
      chartTracksList.innerHTML = `<div class="chart-empty-msg" style="text-align:center; padding:30px 10px; color:#64748B;">Φόρτωση Top 30 Airplay...</div>`;
      return;
    }

    // Render Full List (1 to 30)
    chartTracksList.innerHTML = "";
    chartDataList.forEach(item => {
      const card = document.createElement("div");
      card.className = "chart-track-card";
      card.dataset.rank = item.rank;
      const isFav = isSongFavorite(item.title);

      card.innerHTML = `
        <div class="chart-track-rank">#${item.rank}</div>
        <div class="chart-track-thumb">
          <img src="${item.image || 'assets/stations/main.png'}" alt="${item.title}" onerror="this.src='assets/stations/main.png'">
          ${item.audio ? `
            <div class="chart-thumb-overlay">
              <i class="fa-solid fa-play"></i>
            </div>
          ` : ''}
        </div>
        <div class="chart-track-details">
          <div class="chart-track-title" title="${item.title}">${item.title}</div>
          <div class="chart-track-artist" title="${item.artist}">${item.artist}</div>
        </div>
        <div class="chart-track-actions">
          ${item.audio ? `
            <button class="chart-preview-btn" aria-label="Αναπαραγωγή δείγματος" title="Ακρόαση δείγματος">
              <i class="fa-solid fa-play preview-play-icon"></i>
              <div class="chart-equalizer-mini">
                <span></span><span></span><span></span>
              </div>
            </button>
          ` : ''}
          <button class="chart-heart-btn ${isFav ? 'is-favorite' : ''}" aria-label="Αγαπημένο" title="Προσθήκη στα Αγαπημένα">
            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
          ${item.buyLink ? `
            <a href="${item.buyLink}" target="_blank" rel="noopener noreferrer" class="chart-store-link" aria-label="Apple Music" title="Άνοιγμα στο Apple Music">
              <i class="fa-brands fa-apple"></i>
            </a>
          ` : ''}
        </div>
      `;

      const thumb = card.querySelector(".chart-track-thumb");
      if (thumb && item.audio) {
        thumb.addEventListener("click", () => toggleTrackPreview(item));
      }

      const prevBtn = card.querySelector(".chart-preview-btn");
      if (prevBtn && item.audio) {
        prevBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleTrackPreview(item);
        });
      }

      const heartBtn = card.querySelector(".chart-heart-btn");
      if (heartBtn) {
        heartBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleSongFavorite(item.title, item.artist, item.image);
          const nowFav = isSongFavorite(item.title);
          heartBtn.classList.toggle("is-favorite", nowFav);
          const icon = heartBtn.querySelector("i");
          if (icon) icon.className = nowFav ? "fa-solid fa-heart" : "fa-regular fa-heart";
        });
      }

      chartTracksList.appendChild(card);
    });

    updateChartPreviewUI();
  }

  function parseLiveChartHtml(html) {
    if (!html || typeof html !== "string" || !html.includes("proradio-chart-track")) return null;
    const itemRegex = /<li[^>]*class="[^"]*proradio-chart-track[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
    let m;
    const tracksByRank = {};
    while ((m = itemRegex.exec(html)) !== null) {
      const block = m[1];
      const posM = block.match(/class="proradio-capfont\s*"[^>]*>\s*([0-9]+)\s*</i);
      if (!posM) continue;
      const rank = parseInt(posM[1], 10);
      if (isNaN(rank) || rank < 1 || rank > 30) continue;

      let title = "";
      const titleM = block.match(/data-qtmplayer-title="([^"]+)"/i);
      if (titleM && titleM[1]) {
        title = titleM[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').trim();
      } else {
        const h4M = block.match(/<h[45][^>]*class="[^"]*proradio-cutme-t[^"]*"[^>]*>([\s\S]*?)<\/h[45]>/i);
        if (h4M && h4M[1]) {
          title = h4M[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').trim();
        }
      }

      let artist = "";
      const artistM = block.match(/data-qtmplayer-artist="([^"]+)"/i);
      if (artistM && artistM[1]) {
        artist = artistM[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').trim();
      } else {
        const pM = block.match(/<p[^>]*class="[^"]*proradio-itemmetas[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        if (pM && pM[1]) {
          artist = pM[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').trim();
        }
      }

      let cover = "";
      const coverM = block.match(/data-qtmplayer-cover="([^"]+)"/i);
      if (coverM && coverM[1]) {
        cover = coverM[1].trim();
      } else {
        const imgM = block.match(/<img[^>]*class="[^"]*proradio-chart-cover[^"]*"[^>]*src="([^"]+)"/i) ||
                     block.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*proradio-chart-cover[^"]*"/i);
        if (imgM && imgM[1]) {
          cover = imgM[1].trim();
        }
      }
      if (!cover) cover = "assets/stations/main.png";
      const coverHires = cover.replace(/-100x100\.(jpg|png|jpeg)/i, '.$1');

      const fileM = block.match(/data-qtmplayer-file="([^"]+)"/i);
      const audio = fileM && fileM[1] ? fileM[1].trim() : "";
      const buyM = block.match(/data-qtmplayer-buylink="([^"]+)"/i);
      const buyLink = buyM && buyM[1] ? buyM[1].replace(/&amp;/g, '&').trim() : "";

      if (title) {
        if (tracksByRank[rank] && !audio && tracksByRank[rank].audio) {
          continue;
        }
        tracksByRank[rank] = {
          rank: rank,
          title: title.toUpperCase(),
          artist: artist.toUpperCase(),
          image: coverHires,
          audio: audio,
          buyLink: buyLink
        };
      }
    }

    const keys = Object.keys(tracksByRank).map(k => parseInt(k, 10)).sort((a, b) => a - b);
    if (keys.length >= 10) {
      return keys.map(k => tracksByRank[k]);
    }
    return null;
  }

  async function fetchTop30Chart() {
    try {
      let tracks = null;

      // 1. Try local server API if running (localhost / node / python)
      try {
        const res = await fetch("/api/chart?_t=" + Date.now()).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.tracks) && data.tracks.length > 0) {
            tracks = data.tracks;
          }
        }
      } catch (e) {}

      // 2. Direct Live Scrape from greca994.gr (Works everywhere: Android, iPhone, iPad, Web)
      if (!tracks || tracks.length === 0) {
        try {
          const html = await fetchUniversalText("https://greca994.gr/chart/top-30-airplay/");
          if (html) {
            const parsed = parseLiveChartHtml(html);
            if (parsed && parsed.length > 0) {
              tracks = parsed;
            }
          }
        } catch (e) {}
      }

      // 3. Fallback to packaged top30_data.json
      if (!tracks || tracks.length === 0) {
        try {
          const res = await fetch("top30_data.json?_t=" + Date.now()).catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              tracks = data;
            }
          }
        } catch (e) {}
      }

      // If we got tracks, update state, save to local cache, and re-render!
      if (tracks && tracks.length > 0) {
        chartDataList = tracks;
        try {
          localStorage.setItem("greca_cached_top30", JSON.stringify(tracks));
        } catch (e) {}
        renderTop30Chart();
      }
    } catch (e) {
      console.warn("Chart fetch error:", e);
    }
  }

  function updateClock() {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (statusBarClock) statusBarClock.innerText = timeStr;
    if (cpLiveClock) cpLiveClock.innerText = timeStr;
    updateOnAirPlayerBadge();
  }

  let toastTimerHandle = null;
  function showNotification(msg, iconClass = "fa-solid fa-circle-check") {
    if (!toastMsg) return;
    const toastText = document.getElementById("toastText");
    const toastIcon = document.getElementById("toastIcon");
    if (toastText) {
      toastText.innerText = msg;
    } else {
      toastMsg.innerText = msg;
    }
    if (toastIcon) {
      toastIcon.className = iconClass;
    }
    toastMsg.classList.add("show");
    if (toastTimerHandle) clearTimeout(toastTimerHandle);
    toastTimerHandle = setTimeout(() => {
      toastMsg.classList.remove("show");
    }, 2600);
  }

  // -----------------------------------------------------------------
  // Event Listeners
  // -----------------------------------------------------------------
  if (mainPlayBtn) mainPlayBtn.addEventListener("click", togglePlayback);
  if (miniPlayBtn) miniPlayBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlayback();
  });

  if (scheduleDaysNavRow) {
    scheduleDaysNavRow.addEventListener("click", (e) => {
      const pill = e.target.closest(".day-nav-pill");
      if (pill && pill.dataset.day !== undefined) {
        renderShows(pill.dataset.day);
      }
    });
  }

  // News Category Filter Nav Row
  if (newsFilterNavRow) {
    newsFilterNavRow.addEventListener("click", (e) => {
      const btn = e.target.closest(".news-filter-pill");
      if (!btn) return;
      newsFilterNavRow.querySelectorAll(".news-filter-pill").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      currentNewsFilter = btn.dataset.filter || "all";
      newsCurrentPage = 1;
      renderFilteredNews();
    });
  }

  function goNewsPagePrev() {
    const totalPages = (currentNewsFilter === "89") ? 1 : 3;
    if (newsCurrentPage > 1) {
      switchNewsPage(newsCurrentPage - 1, totalPages);
    }
  }

  function goNewsPageNext() {
    const totalPages = (currentNewsFilter === "89") ? 1 : 3;
    if (newsCurrentPage < totalPages) {
      switchNewsPage(newsCurrentPage + 1, totalPages);
    }
  }

  if (newsPagePrevBtn) newsPagePrevBtn.addEventListener("click", goNewsPagePrev);
  if (newsTopPrevBtn) newsTopPrevBtn.addEventListener("click", goNewsPagePrev);
  if (newsPageNextBtn) newsPageNextBtn.addEventListener("click", goNewsPageNext);
  if (newsTopNextBtn) newsTopNextBtn.addEventListener("click", goNewsPageNext);

  // Show Modal Listeners
  if (showModalCloseBtn) {
    showModalCloseBtn.addEventListener("click", closeShowModal);
  }
  if (showModalBackdrop) {
    showModalBackdrop.addEventListener("click", (e) => {
      if (e.target === showModalBackdrop) closeShowModal();
    });
  }
  if (modalShowShareFab) {
    modalShowShareFab.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!currentModalShow) return;
      if (navigator.share) {
        navigator.share({
          title: currentModalShow.title,
          text: `${currentModalShow.title} στον Greca FM 99,4!`,
          url: "https://greca994.gr"
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(`${currentModalShow.title} στον Greca FM 99,4! https://greca994.gr`);
        showNotification("Ο σύνδεσμος αντιγράφηκε", "fa-solid fa-link");
      }
    });
  }

  // Article Modal Listeners
  if (articleModalCloseBtn) {
    articleModalCloseBtn.addEventListener("click", closeArticleModal);
  }
  if (articleModalBackdrop) {
    articleModalBackdrop.addEventListener("click", (e) => {
      if (e.target === articleModalBackdrop) closeArticleModal();
    });
  }
  if (modalArticleShareFab) {
    modalArticleShareFab.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!currentModalArticle) return;
      const shareUrl = currentModalArticle.link || "https://greca994.gr";
      const shareTitle = currentModalArticle.title || "Greca FM 99,4";
      if (navigator.share) {
        navigator.share({
          title: shareTitle,
          text: `${shareTitle} - Greca FM 99,4`,
          url: shareUrl
        }).catch(() => {});
      } else {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(`${shareTitle} - Greca FM 99,4: ${shareUrl}`);
        }
        showNotification("Ο σύνδεσμος αντιγράφηκε", "fa-solid fa-link");
      }
    });
  }



  if (cpNextChannel) cpNextChannel.addEventListener("click", () => tuneStation(currentStationIdx + 1, isPlaying));
  if (cpPrevChannel) cpPrevChannel.addEventListener("click", () => tuneStation(currentStationIdx - 1, isPlaying));
  if (cpMainPlayBtn) cpMainPlayBtn.addEventListener("click", () => togglePlayback());
  if (cpExitBtn) {
    cpExitBtn.addEventListener("click", () => {
      switchTab("tab-stations");
    });
  }

  if (mainVolumeSlider) {
    mainVolumeSlider.addEventListener("input", (e) => {
      audio.volume = parseFloat(e.target.value);
    });
  }

  if (mainHeartBtn) {
    mainHeartBtn.addEventListener("click", function(e) {
      e.preventDefault();
      toggleSongFavorite(liveNowOnAir.title, liveNowOnAir.artist);
    });
  }

  function updateSleepCountdownDisplay() {
    if (!mainSleepLabel || !sleepTargetTimestamp) return;
    const remainingMs = Math.max(0, sleepTargetTimestamp - Date.now());
    const totalSecs = Math.ceil(remainingMs / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (m >= 1) {
      mainSleepLabel.innerText = `${m}m ${s < 10 ? '0' : ''}${s}s`;
    } else {
      mainSleepLabel.innerText = `${s}s`;
    }
  }

  function stopSleepTimer(notify = false) {
    if (sleepIntervalHandle) {
      clearInterval(sleepIntervalHandle);
      sleepIntervalHandle = null;
    }
    sleepTargetTimestamp = 0;
    sleepMins = 0;
    if (mainSleepLabel) mainSleepLabel.innerText = "Sleep Timer";
    if (mainSleepTimerBtn) mainSleepTimerBtn.classList.remove("active");
    if (notify) showNotification("Sleep Timer: Ανενεργό", "fa-solid fa-clock");
  }

  function startSleepTimer(minutes) {
    if (sleepIntervalHandle) clearInterval(sleepIntervalHandle);
    sleepMins = minutes;
    sleepTargetTimestamp = Date.now() + minutes * 60 * 1000;
    sleepOriginalVolume = (audio && typeof audio.volume === "number") ? audio.volume : 0.85;

    if (mainSleepTimerBtn) mainSleepTimerBtn.classList.add("active");
    updateSleepCountdownDisplay();
    showNotification(`Sleep Timer: ${minutes} λεπτά`, "fa-solid fa-clock");

    sleepIntervalHandle = setInterval(() => {
      const remainingMs = sleepTargetTimestamp - Date.now();
      if (remainingMs <= 0) {
        clearInterval(sleepIntervalHandle);
        sleepIntervalHandle = null;
        if (audio) {
          audio.pause();
          audio.src = "";
          audio.volume = sleepOriginalVolume;
        }
        isPlaying = false;
        isBuffering = false;
        updatePlayStateUI();
        stopSleepTimer(false);
        showNotification("Ο χρονοδιακόπτης απενεργοποίησε την αναπαραγωγή", "fa-solid fa-clock");
      } else {
        if (remainingMs <= 15000 && audio) {
          const factor = Math.max(0, remainingMs / 15000);
          audio.volume = sleepOriginalVolume * factor;
        }
        updateSleepCountdownDisplay();
      }
    }, 1000);
  }

  if (mainSleepTimerBtn) {
    mainSleepTimerBtn.addEventListener("click", () => {
      if (sleepMins === 0) startSleepTimer(15);
      else if (sleepMins === 15) startSleepTimer(30);
      else if (sleepMins === 30) startSleepTimer(45);
      else if (sleepMins === 45) startSleepTimer(60);
      else stopSleepTimer(true);
    });
  }

  if (mainShareBtn) {
    mainShareBtn.addEventListener("click", () => {
      if (navigator.share) {
        navigator.share({
          title: "Greca FM 99,4",
          text: `Ακούω τώρα: ${liveNowOnAir.title} - ${liveNowOnAir.artist} στον Greca FM 99,4!`,
          url: "https://greca994.gr"
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(`Ακούω ${liveNowOnAir.title} - ${liveNowOnAir.artist} στον Greca FM 99,4! https://greca994.gr`);
        showNotification("Ο σύνδεσμος αντιγράφηκε", "fa-solid fa-link");
      }
    });
  }

  if (miniPlayerOpenTouch) {
    miniPlayerOpenTouch.addEventListener("click", () => {
      switchTab("tab-stations");
      if (mainScroll) mainScroll.scrollTop = 0;
      window.scrollTo(0, 0);
    });
  }

  // On-Air Program Badge Tap -> Open Show Details Modal (Main station only)
  if (mainOnAirBadgeWrap) {
    mainOnAirBadgeWrap.addEventListener("click", () => {
      if (currentStationIdx !== 0) return;
      const show = getCurrentOnAirShow();
      if (show) openShowModal(show);
    });
  }

  // Featured Morning Show Banner (Number One Radio Show) Tap -> Open Show Info & Schedule Link
  if (homeMorningShowCard) {
    homeMorningShowCard.addEventListener("click", () => {
      const weekdaysList = (DATA.weeklySchedule && DATA.weeklySchedule.weekdays) ? DATA.weeklySchedule.weekdays : [];
      const show = weekdaysList.find(s => s.id === "number-one-weekdays" || (s.title && s.title.includes("Number One"))) || weekdaysList[0];
      if (show) {
        openShowModal(show);
      } else {
        switchTab("tab-shows");
      }
    });
  }

  function switchTab(targetTab) {
    navTabBtns.forEach(b => {
      if (b.dataset.tab === targetTab) b.classList.add("active");
      else b.classList.remove("active");
    });
    tabPanes.forEach(p => {
      if (p.id === targetTab) p.classList.add("active");
      else p.classList.remove("active");
    });

    // Instant scroll to top of content container
    if (mainScroll) {
      mainScroll.scrollTop = 0;
    }
    window.scrollTo(0, 0);

    if (targetTab === "tab-news") {
      if (loadedNewsItems.length === 0) {
        showNewsLoadingState();
      }
      fetchNewsArticles(false);
    }
    if (targetTab === "tab-chart") {
      renderTop30Chart();
      fetchTop30Chart();
    }
    if (targetTab === "tab-shows") {
      const today = new Date().getDay();
      renderShows(today);
      setTimeout(() => {
        if (scheduleDaysNavRow) {
          const todayPill = scheduleDaysNavRow.querySelector(`.day-nav-pill[data-day="${today}"]`);
          if (todayPill) {
            todayPill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        }
      }, 60);
    }

    // Force scroll position to the very top after content renders and DOM updates
    if (mainScroll) {
      mainScroll.scrollTop = 0;
    }
    requestAnimationFrame(() => {
      if (mainScroll) mainScroll.scrollTop = 0;
      window.scrollTo(0, 0);
    });
    setTimeout(() => {
      if (mainScroll) mainScroll.scrollTop = 0;
    }, 40);
  }

  navTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab);
    });
  });

  // -----------------------------------------------------------------
  // Smooth Dismissal of Animated Splash Screen (Zero Flash, Full Pulse)
  // -----------------------------------------------------------------
  function dismissSplashScreen() {
    const splash = document.getElementById("appSplashScreen");
    if (!splash) return;
    const startT = (typeof window !== "undefined" && window._splashStartTime) ? window._splashStartTime : Date.now();
    const elapsed = Date.now() - startT;
    const minDisplayTime = 1800; // Elegant breathing logo display (~1.8 seconds)
    const delay = Math.max(0, minDisplayTime - elapsed);

    setTimeout(() => {
      splash.classList.add("splash-dismissed");
      splash.style.pointerEvents = "none";
      setTimeout(() => {
        try {
          if (splash) {
            splash.style.display = "none";
            if (splash.parentNode) {
              splash.parentNode.removeChild(splash);
            }
          }
        } catch (e) {}
      }, 700);
    }, delay);
  }

  // -----------------------------------------------------------------
  // INITIALIZATION (0ms Instant Render + Background Live Polling)
  // -----------------------------------------------------------------
  try {
    // 1. Instant Synchronous UI Population (0ms!)
    syncLiveMetadata();
    dismissSplashScreen();
    renderBubbles();
    setupCarouselScrolling();
    renderStationsList();
    renderRecentlyPlayed();
    seedInitialHistoryIfEmpty();
    renderShows(new Date().getDay());
    renderTop30Chart();
    renderCarPlayTiles();
    updateClock();
    updateOnAirPlayerBadge();
    updatePlayStateUI();
    updateAllFavoriteStates();
    setInterval(updateClock, 1000);

    // 2. Immediate live background sync for active station
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
    }

    // 3. Staggered background loading to guarantee 100% network priority for audio streaming
    setTimeout(() => {
      fetchTop30Chart();
    }, 6000);

    setTimeout(() => {
      fetchNewsArticles(false);
    }, 10000);

    // 4. Periodic real-time background sync ONLY for active tuned station
    setInterval(() => {
      if (!isBuffering && !isSwitchingStation) {
        syncStationNowPlayingAndHistory(getCurrentStationSlug());
      }
    }, 5000);

    setInterval(() => {
      if (!isBuffering && !isSwitchingStation) {
        fetchNewsArticles(false);
      }
    }, 60000);

    // 5. Screen unlock / visibility resume synchronizer (Zero-Lag, Audio-Priority Protected)
    let resumeSyncTimer = null;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        // A. Immediate hardware audio state alignment
        if (audio) {
          if (audio.paused && isPlaying) {
            isPlaying = false;
            isBuffering = false;
            isSwitchingStation = false;
            updatePlayStateUI();
          } else if (!audio.paused && !isPlaying) {
            isPlaying = true;
            isBuffering = false;
            updatePlayStateUI();
          }
        }

        // B. Debounce background network sync by 800ms so immediate touch/play actions get 100% bandwidth
        if (resumeSyncTimer) clearTimeout(resumeSyncTimer);
        resumeSyncTimer = setTimeout(() => {
          if (!isBuffering && !isSwitchingStation) {
            const currentSlug = getCurrentStationSlug();
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
            }
          }
        }, 800);
      }
    });
    // 6. Service Worker Registration for Standalone App
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch((err) => {
          console.log("SW registration skipped:", err);
        });
      });
    }
  } catch (err) {
    console.error("Initialization error:", err);
    try { dismissSplashScreen(); } catch(e) {}
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGrecaApp);
} else {
  initGrecaApp();
}

