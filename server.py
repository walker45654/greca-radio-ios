import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import re
import os
import threading
import time
from datetime import datetime
import concurrent.futures
import html

PORT = 8088
HISTORY_FILE = "server_station_history.json"
history_lock = threading.RLock()

MONITORED_STATIONS = ['main', 'laiko', 'entexno', 'erwtiko', 'party', 'lounge', 'glenti', 'xmas']

STATION_CUSTOM_CONFIG = {
    'party': {
        'txt': 'https://greca994.gr/artwork/party/nowplaying.txt',
        'artwork': 'https://greca994.gr/artwork/party/artwork.jpg'
    },
    'lounge': {
        'txt': 'https://greca994.gr/artwork/Lounge/nowplaying.txt',
        'artwork': 'https://greca994.gr/artwork/Lounge/artwork.jpg'
    },
    'glenti': {
        'txt': 'https://greca994.gr/artwork/glenti/nowplaying.txt',
        'artwork': 'https://greca994.gr/artwork/glenti/artwork.jpg'
    },
    'xmas': {
        'txt': 'https://greca994.gr/artwork/xmas/nowplaying.txt',
        'artwork': 'https://greca994.gr/artwork/xmas/artwork.jpg'
    },
    'entexno': {
        'txt': 'https://greca994.gr/artwork/entexno/nowplaying.txt',
        'artwork': 'https://greca994.gr/artwork/entexno/artwork.jpg'
    },
    'laiko': {
        'txt': 'https://greca994.gr/artwork/laiko/nowplaying.txt',
        'artwork': 'https://greca994.gr/artwork/laiko/artwork.jpg'
    },
    'erwtiko': {
        'txt': 'https://greca994.gr/artwork/erwtiko/nowplaying.txt',
        'artwork': 'https://greca994.gr/artwork/erwtiko/artwork.jpg'
    }
}

# In-memory station history store (strictly 5 tracks max per station)
station_history = {s: [] for s in MONITORED_STATIONS}

def get_current_time_str():
    # Greek local time format HH:MM
    now = datetime.now()
    return f"{now.hour:02d}:{now.minute:02d}"

def load_initial_history():
    global station_history
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    with history_lock:
                        for s in MONITORED_STATIONS:
                            if s in data and isinstance(data[s], list):
                                station_history[s] = data[s][:5]
            print(f"Loaded existing history from {HISTORY_FILE}")
            return
        except Exception as e:
            print(f"Error loading {HISTORY_FILE}: {e}")

    # Default seeds if no history file exists yet
    t_now = get_current_time_str()
    station_history['main'] = [
        {"title": "ΚΑΝΤΑΔΑ", "artist": "APON", "time": t_now, "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_76646.jpg"},
        {"title": "ΜΕΣΑ ΣΟΥ", "artist": "STAVENTO", "time": t_now, "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_59231.jpg"},
        {"title": "ΣΗΜΑΔΙ", "artist": "ΜΙΧΑΛΗΣ ΚΑΡΑΓΚΟΥΝΗΣ", "time": t_now, "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_76684.jpg"},
        {"title": "ΟΧΙ ΓΙΑΤΙ", "artist": "ΑΝΝΑ ΒΙΣΣΗ", "time": t_now, "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_76687.jpg"},
        {"title": "ΜΕ ΣΕΝΑ ΠΛΑΙ ΜΟΥ", "artist": "ΣΤΕΛΙΟΣ ΡΟΚΚΟΣ", "time": t_now, "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_76241.jpg"}
    ]
    save_history_to_disk()

def save_history_to_disk():
    try:
        with history_lock:
            with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump(station_history, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving history: {e}")

WORDPRESS_RADIO_IDS = {
    'main': '2968',
    'laiko': '7184',
    'entexno': '7294',
    'erwtiko': '7304',
    'party': '7307',
    'lounge': '44225',
    'glenti': '52965',
    'xmas': '119662'
}

def fetch_live_greca_history(station_slug='main'):
    radio_id = WORDPRESS_RADIO_IDS.get(station_slug, '2968')
    try:
        url = 'https://greca994.gr/wp-admin/admin-ajax.php'
        data = urllib.parse.urlencode({
            'action': 'prsidekick-get-history',
            'radioid': radio_id,
            'quantity': '8',
            'offset': '0',
            'orderby': 'latest'
        }).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                'User-Agent': 'Mozilla/5.0',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        )
        with urllib.request.urlopen(req, timeout=10) as res:
            raw = res.read().decode('utf-8')
            items = json.loads(raw)
            if isinstance(items, list) and len(items) > 0:
                tracks = []
                for entry in items:
                    song = entry.get('song', {})
                    if not song:
                        continue
                    t = song.get('prsidekick_song', '').strip().upper()
                    a = song.get('prsidekick_artist', '').strip().upper()
                    playdate = song.get('prsidekick_latest_playdate', '')
                    time_str = playdate.split(' ')[1][:5] if ' ' in playdate else ''
                    art = song.get('prsidekick_art', '')
                    if art and art.startswith('http://'):
                        art = 'https://' + art[7:]
                    default_station_art = f"https://greca994.gr/artwork/{station_slug}/artwork.jpg" if station_slug != 'main' else 'assets/Greca Fm 99,4 mayro logo jpg (1).jpg'
                    if t and not any(k in t for k in ['GRECA FM', 'LIVE STREAM', 'WEB RADIO']):
                        tracks.append({
                            'title': t,
                            'artist': a or (station_slug.upper() if station_slug != 'main' else 'GRECA FM 99,4'),
                            'time': time_str,
                            'image': (art or default_station_art) if station_slug != 'main' else (art or 'assets/Greca Fm 99,4 mayro logo jpg (1).jpg')
                        })
                if len(tracks) >= 2:
                    return tracks[:5]
    except Exception as e:
        print("fetch_live_greca_history error:", e)
    return None

def update_station_track(station_slug, title, artist, artwork):
    if not title or not title.strip():
        return
    title = title.strip().upper()

    # -------------------------------------------------------------
    # 1. MAIN RADIO (Greca FM 99,4): 100% UNTOUCHED (Exact Original)
    # -------------------------------------------------------------
    if station_slug in ['main', 'greca-994', '', 'none']:
        if title in ["GRECA FM 99.4 LIVE", "LIVE STREAM", "GRECA WEB RADIO", "WEB RADIO"]:
            return
        artist = (artist or "GRECA FM 99.4").strip().upper()
        artwork = artwork or "assets/stations/main.png"
        time_str = get_current_time_str()

        changed = False
        with history_lock:
            hist = station_history.get('main', [])
            if hist and hist[0].get('title', '').upper() == title:
                if artwork and hist[0].get('image') != artwork:
                    curr_img = hist[0].get('image', '')
                    is_authentic = ('jzSong_' in curr_img or 'mzstatic' in curr_img)
                    if not (is_authentic and 'main.png' in artwork):
                        hist[0]['image'] = artwork
                        changed = True
            else:
                new_item = {
                    "title": title,
                    "artist": artist,
                    "time": time_str,
                    "image": artwork
                }
                hist.insert(0, new_item)
                station_history['main'] = hist[:5]
                changed = True
                print(f"[{time_str}] New track on 'main': {artist} - {title}")
        if changed:
            save_history_to_disk()
        return

    # 2. WEB RADIOS: History is strictly governed by official WordPress broadcast history!
    # Do not mutate or overwrite web radio history from background poller
    if station_slug != 'main':
        return

    # Ignore jingles & station promos on web radios
    JINGLE_TERMS = ['GRECA', 'WEB RADIO', 'RADIOHOST', 'CLOUDSTREAMING', 'LIVE STREAM', '99,4', '99.4', 'ENTEXNA', 'LAIKA', 'ERWTIKA', 'PARTY', 'LOUNGE', 'GLENTI', 'XMAS']
    if any(k in clean_title for k in JINGLE_TERMS) or any(k in clean_artist for k in ['GRECA', 'WEB RADIO', 'RADIOHOST', 'CLOUDSTREAMING']):
        return

    time_str = get_current_time_str()
    if station_slug == 'xmas':
        artwork = artwork or "assets/stations/xmas.jpg"
    else:
        artwork = artwork or f"https://greca994.gr/artwork/{station_slug}/artwork.jpg"

    changed = False
    with history_lock:
        hist = station_history.get(station_slug, [])

        # Check existing tracks to prevent duplicate tracks and fix cut titles
        for item in hist:
            old_t = item.get('title', '').upper().replace('\ufffd', '').strip()

            # Exact match - already recorded in recent tracks!
            if old_t == clean_title:
                if artwork and item.get('image') != artwork:
                    item['image'] = artwork
                    changed = True
                    save_history_to_disk()
                return

            # If current title is longer and starts with old_t (e.g. old was cut "Η ΠΑΛ", new is full "Η ΠΑΛΙΑ ΑΓΟΡΑ")
            if len(clean_title) > len(old_t) and clean_title.startswith(old_t):
                item['title'] = clean_title
                item['artist'] = clean_artist
                if artwork: item['image'] = artwork
                changed = True
                print(f"[{time_str}] Fixed cut title on '{station_slug}': {old_t} -> {clean_title}")
                save_history_to_disk()
                return

            # If old_t is longer and starts with clean_title (e.g. old is full "Η ΠΑΛΙΑ ΑΓΟΡΑ", incoming is cut "Η ΠΑΛ")
            if len(old_t) > len(clean_title) and old_t.startswith(clean_title):
                return # Ignore incoming cut fragment!

            # Fuzzy match (one is contained in another)
            if (len(clean_title) >= 5 and clean_title in old_t) or (len(old_t) >= 5 and old_t in clean_title):
                if len(clean_title) > len(old_t):
                    item['title'] = clean_title
                    item['artist'] = clean_artist
                    changed = True
                    save_history_to_disk()
                return # Do not insert duplicate!

        # Truly new distinct song!
        # For main station only: maintain transition history
        # For web radios: broadcast history is strictly synced from official WordPress broadcast history!
        if station_slug == 'main':
            new_item = {
                "title": clean_title,
                "artist": clean_artist,
                "time": time_str,
                "image": artwork or "assets/stations/main.png"
            }
            hist.insert(0, new_item)
            station_history['main'] = hist[:5]
            changed = True
            print(f"[{time_str}] New track on 'main': {clean_artist} - {clean_title}")

    if changed:
        save_history_to_disk()

def extract_jazler_nowplaying(raw_bytes):
    title = "GRECA FM 99.4 LIVE"
    artist = "ΕΛΛΗΝΙΚΕΣ ΕΠΙΤΥΧΙΕΣ"
    img_name = ""

    text = raw_bytes.decode('utf-8', errors='replace')

    m_title = re.search(r'Song title="([^"]+)"', text)
    if m_title and m_title.group(1).strip():
        title = m_title.group(1).strip()

    m_artist = re.search(r'Artist name="([^"]+)"', text)
    if m_artist and m_artist.group(1).strip():
        artist = m_artist.group(1).strip()

    m_img = re.search(r'<CacheImageFile>([^<]+)</CacheImageFile>', text)
    if m_img and m_img.group(1).strip():
        img_name = m_img.group(1).strip()

    DEFAULT_MAIN_ART = "assets/Greca Fm 99,4 mayro logo jpg (1).jpg"
    art_url = f"https://greca994.gr/playlist/AlbumsCache/{img_name}" if (img_name and img_name.strip() and img_name.startswith("jzSong_")) else DEFAULT_MAIN_ART

    return {
        "station": "main",
        "title": title.upper(),
        "artist": artist.upper(),
        "artwork": art_url,
        "status": "online"
    }

def fetch_webradio_nowplaying(station_slug):
    cfg = STATION_CUSTOM_CONFIG.get(station_slug, {})
    url = cfg.get('txt', f"https://greca994.gr/artwork/{station_slug}/nowplaying.txt")
    default_art = cfg.get('artwork', f"https://greca994.gr/artwork/{station_slug}/artwork.jpg")

    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    raw = urllib.request.urlopen(req, timeout=4).read()
    try:
        text = raw.decode('utf-8').strip()
    except Exception:
        text = raw.decode('cp1253', errors='replace').strip()
    if '\ufffd' in text:
        try:
            alt = raw.decode('cp1253', errors='ignore').strip()
            if alt and '\ufffd' not in alt:
                text = alt
        except Exception:
            pass

    GENRES = {
        'main': 'Μόνο Επιτυχίες',
        'entexno': 'Έντεχνα',
        'laiko': 'Λαϊκά',
        'erwtiko': 'Ερωτικά',
        'party': 'Party / Dance',
        'lounge': 'Chill & Lounge',
        'glenti': 'Παραδοσιακά',
        'xmas': 'Χριστουγεννιάτικα'
    }
    TITLES = {
        'main': 'Greca FM 99,4',
        'entexno': 'Greca Έντεχνο',
        'laiko': 'Greca Λαϊκό',
        'erwtiko': 'Greca Ερωτικό',
        'party': 'Greca Party',
        'lounge': 'Greca Lounge',
        'glenti': 'Greca Γλέντι',
        'xmas': 'Greca Christmas'
    }

    if not text or '<html' in text.lower() or '<!doctype' in text.lower():
        return {
            "station": station_slug,
            "title": TITLES.get(station_slug, "Greca FM 99,4"),
            "artist": GENRES.get(station_slug, "Μόνο Επιτυχίες"),
            "artwork": default_art,
            "status": "fallback"
        }

    text = text.replace('\ufffd', '').strip()

    if ' - ' in text:
        parts = text.split(' - ', 1)
        artist = parts[0].strip().upper()
        title = parts[1].strip().upper()
    else:
        # Non-music jingle or station identifier: DO NOT record as track!
        return {
            "station": station_slug,
            "title": TITLES.get(station_slug, "Greca FM 99,4"),
            "artist": GENRES.get(station_slug, "Μόνο Επιτυχίες"),
            "artwork": default_art,
            "status": "jingle",
            "is_jingle": True
        }

    # If title or artist contains station name or is too short, it's a jingle
    JINGLE_TERMS = ['GRECA', 'WEB RADIO', 'LIVE STREAM', '99,4', '99.4', 'RADIOHOST', 'CLOUDSTREAMING']
    if any(k in title for k in JINGLE_TERMS) or any(k in artist for k in ['GRECA', 'WEB RADIO', 'RADIOHOST', 'CLOUDSTREAMING']) or len(title) < 3 or len(artist) < 2:
        return {
            "station": station_slug,
            "title": TITLES.get(station_slug, "Greca FM 99,4"),
            "artist": GENRES.get(station_slug, "Μόνο Επιτυχίες"),
            "artwork": default_art,
            "status": "jingle",
            "is_jingle": True
        }

    track_hash = abs(hash(f"{station_slug}_{artist}_{title}")) % 10000000
    art_with_bust = f"{default_art}?v={track_hash}"

    return {
        "station": station_slug,
        "title": title,
        "artist": artist,
        "artwork": art_with_bust,
        "status": "online",
        "is_jingle": False
    }

def fetch_live_station_info(station):
    if station in ['main', 'greca-994', '', 'none']:
        req = urllib.request.Request(
            'https://greca994.gr/playlist/NowOnAir.xml',
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        raw = urllib.request.urlopen(req, timeout=4).read()
        return extract_jazler_nowplaying(raw)
    else:
        return fetch_webradio_nowplaying(station)

# Background daemon thread: continuously polls all stations to maintain fresh history 24/7!
def background_history_poller():
    print("Background history poller started (checking all stations 24/7)...")
    while True:
        try:
            for slug in MONITORED_STATIONS:
                try:
                    data = fetch_live_station_info(slug)
                    if data and data.get("title") and not data.get("is_jingle"):
                        update_station_track(
                            slug,
                            data.get("title"),
                            data.get("artist"),
                            data.get("artwork")
                        )
                except Exception:
                    pass
                time.sleep(0.5)
        except Exception as e:
            print("Poller error:", e)
chart_cache_lock = threading.RLock()
chart_cached_tracks = []
chart_last_fetch = 0
CHART_CACHE_TTL = 300  # 5 minutes: auto-refreshes from greca994.gr

def fetch_live_chart_tracks():
    global chart_cached_tracks, chart_last_fetch
    chart_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "top30_data.json")
    now = time.time()
    
    with chart_cache_lock:
        if chart_cached_tracks and (now - chart_last_fetch < CHART_CACHE_TTL):
            return chart_cached_tracks

    # Attempt live scrape from greca994.gr
    try:
        url = 'https://greca994.gr/chart/top-30-airplay/'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=8) as resp:
            page_html = resp.read().decode('utf-8', errors='replace')
        
        pattern = r'<li[^>]*class="[^"]*proradio-chart-track[^"]*"[^>]*>(.*?)</li>'
        items = re.findall(pattern, page_html, re.DOTALL)
        
        tracks_by_rank = {}
        for idx, it in enumerate(items, 1):
            pos_m = re.search(r'class="proradio-capfont\s*"[^>]*>\s*([0-9]+)\s*<', it)
            rank = int(pos_m.group(1)) if pos_m else None
            if not rank or rank < 1 or rank > 30:
                continue

            data_title = re.search(r'data-qtmplayer-title="([^"]+)"', it)
            data_artist = re.search(r'data-qtmplayer-artist="([^"]+)"', it)
            data_cover = re.search(r'data-qtmplayer-cover="([^"]+)"', it)
            data_file = re.search(r'data-qtmplayer-file="([^"]+)"', it)
            data_buy = re.search(r'data-qtmplayer-buylink="([^"]+)"', it)

            if data_title:
                title = html.unescape(data_title.group(1)).strip()
            else:
                title_m = re.search(r'<h[45][^>]*class="[^"]*proradio-cutme-t[^"]*"[^>]*>(.*?)</h[45]>', it, re.DOTALL)
                title = html.unescape(re.sub(r'<[^>]+>', '', title_m.group(1))).strip() if title_m else ""

            if data_artist:
                artist = html.unescape(data_artist.group(1)).strip()
            else:
                art_m = re.search(r'<p[^>]*class="[^"]*proradio-itemmetas[^"]*"[^>]*>(.*?)</p>', it, re.DOTALL)
                artist = html.unescape(re.sub(r'<[^>]+>', '', art_m.group(1))).strip() if art_m else ""

            cover = ""
            if data_cover and data_cover.group(1).strip():
                cover = data_cover.group(1).strip()
            else:
                img_match = re.search(r'<img[^>]*class="[^"]*proradio-chart-cover[^"]*[^>]*>', it)
                if not img_match:
                    img_match = re.search(r'<img[^>]*src="[^"]*"[^>]*class="[^"]*proradio-chart-cover[^"]*[^>]*>', it)
                if img_match:
                    src_m = re.search(r'src="([^"]+)"', img_match.group(0))
                    if src_m:
                        cover = src_m.group(1).strip()

            if not cover:
                cover = "assets/stations/main.png"

            audio_preview = data_file.group(1).strip() if data_file else ""
            buy_link = html.unescape(data_buy.group(1)).strip() if data_buy else ""

            if not title:
                continue

            cover_hires = re.sub(r'-100x100\.(jpg|png|jpeg)', r'.\1', cover)

            track_obj = {
                "rank": rank,
                "title": title.upper(),
                "artist": artist.upper(),
                "image": cover_hires,
                "audio": audio_preview,
                "buyLink": buy_link
            }

            if rank not in tracks_by_rank or (audio_preview and not tracks_by_rank[rank]["audio"]):
                tracks_by_rank[rank] = track_obj
            elif rank in tracks_by_rank and not tracks_by_rank[rank]["audio"] and audio_preview:
                tracks_by_rank[rank] = track_obj

        fresh_tracks = [tracks_by_rank[r] for r in sorted(tracks_by_rank.keys())]

        if fresh_tracks and len(fresh_tracks) >= 20:
            with chart_cache_lock:
                chart_cached_tracks = fresh_tracks
                chart_last_fetch = now
                try:
                    with open(chart_file, "w", encoding="utf-8") as f:
                        json.dump(fresh_tracks, f, ensure_ascii=False, indent=2)
                except Exception as fe:
                    print("Could not update top30_data.json on disk:", fe)
            return fresh_tracks
    except Exception as e:
        print("Live chart scrape warning:", e)

    # Fallback to cached tracks or file on disk
    with chart_cache_lock:
        if chart_cached_tracks:
            return chart_cached_tracks
        if os.path.exists(chart_file):
            try:
                with open(chart_file, "r", encoding="utf-8") as f:
                    chart_cached_tracks = json.load(f)
                    chart_last_fetch = now
                    return chart_cached_tracks
            except Exception as fe:
                print("Failed to read fallback chart file:", fe)
        return []

class RadioAppHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/nowplaying':
            query = urllib.parse.parse_qs(parsed.query)
            station = query.get('station', ['main'])[0].lower()
            self.handle_nowplaying(station)
        elif parsed.path == '/api/history':
            query = urllib.parse.parse_qs(parsed.query)
            station = query.get('station', [None])[0]
            self.handle_history(station)
        elif parsed.path.startswith('/api/posts'):
            self.handle_posts()
        elif parsed.path in ['/api/chart', '/api/top30']:
            self.handle_chart()
        else:
            super().do_GET()

    def handle_nowplaying(self, station='main'):
        try:
            resp_data = fetch_live_station_info(station)
            # Also update track history immediately
            if resp_data and resp_data.get('title') and not resp_data.get('is_jingle'):
                slug = 'main' if station in ['main', 'greca-994', '', 'none'] else station
                update_station_track(slug, resp_data.get('title'), resp_data.get('artist'), resp_data.get('artwork'))

            body = json.dumps(resp_data, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            GENRES = {
                'main': 'Μόνο Επιτυχίες',
                'entexno': 'Έντεχνα',
                'laiko': 'Λαϊκά',
                'erwtiko': 'Ερωτικά',
                'party': 'Party / Dance',
                'lounge': 'Chill & Lounge',
                'glenti': 'Παραδοσιακά',
                'xmas': 'Χριστουγεννιάτικα'
            }
            TITLES = {
                'main': 'Greca FM 99,4',
                'entexno': 'Greca Έντεχνο',
                'laiko': 'Greca Λαϊκό',
                'erwtiko': 'Greca Ερωτικό',
                'party': 'Greca Party',
                'lounge': 'Greca Lounge',
                'glenti': 'Greca Γλέντι',
                'xmas': 'Greca Christmas'
            }
            fallback = {
                "station": station,
                "title": TITLES.get(station, "Greca FM 99,4"),
                "artist": GENRES.get(station, "Μόνο Επιτυχίες"),
                "artwork": "assets/Greca Fm 99,4 mayro logo jpg (1).jpg",
                "error": str(e)
            }
            body = json.dumps(fallback, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    def handle_history(self, station=None):
        try:
            # Refresh live history for requested station or all stations
            with history_lock:
                target_slugs = [station.lower()] if (station and station.lower() in MONITORED_STATIONS) else MONITORED_STATIONS
                for s in target_slugs:
                    live_t = fetch_live_greca_history(s)
                    if live_t and len(live_t) > 0:
                        station_history[s] = live_t[:5]
                save_history_to_disk()
                if station and station.lower() in station_history:
                    slug = station.lower()
                    data = {
                        "status": "ok",
                        "station": slug,
                        "history": station_history[slug][:5]
                    }
                else:
                    data = {
                        "status": "ok",
                        "stations": {k: v[:5] for k, v in station_history.items()}
                    }

            body = json.dumps(data, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            err_body = json.dumps({"status": "error", "message": str(e)}).encode('utf-8')
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(err_body)))
            self.end_headers()
            self.wfile.write(err_body)

    def handle_posts(self):
        try:
            posts = []
            seen_ids = set()
            t_now = int(time.time())
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }

            urls = [
                f'https://greca994.gr/wp-json/wp/v2/posts?categories=3&_embed=1&per_page=12&page=1&_t={t_now}',
                f'https://greca994.gr/wp-json/wp/v2/posts?categories=3&_embed=1&per_page=12&page=2&_t={t_now}',
                f'https://greca994.gr/wp-json/wp/v2/posts?categories=3&_embed=1&per_page=12&page=3&_t={t_now}',
                f'https://greca994.gr/wp-json/wp/v2/posts?categories=89&_embed=1&per_page=12&page=1&_t={t_now}'
            ]

            def fetch_single_page(u):
                try:
                    req = urllib.request.Request(u, headers=headers)
                    res = urllib.request.urlopen(req, timeout=5)
                    return json.loads(res.read().decode('utf-8'))
                except Exception as err:
                    print(f"Error fetching {u}: {err}")
                    return []

            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                batches = list(executor.map(fetch_single_page, urls))

            for batch in batches:
                if isinstance(batch, list):
                    for p in batch:
                        if p.get('id') and p.get('id') not in seen_ids:
                            seen_ids.add(p['id'])
                            posts.append(p)

            # Sort all posts together purely by date descending (newest on top)
            posts.sort(key=lambda x: str(x.get('date', '')), reverse=True)

            body = json.dumps(posts, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception:
            body = json.dumps([], ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()

    def handle_chart(self):
        try:
            tracks = fetch_live_chart_tracks()
            data = {"status": "ok", "tracks": tracks}
            body = json.dumps(data, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'public, max-age=60')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            err = json.dumps({"status": "error", "message": str(e), "tracks": []}).encode('utf-8')
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(err)))
            self.end_headers()
            self.wfile.write(err)

def run_server_instance(port):
    try:
        httpd = http.server.ThreadingHTTPServer(("", port), RadioAppHandler)
        print(f"Serving on port {port} (threaded)...")
        httpd.serve_forever()
    except Exception as e:
        print(f"Port {port} error: {e}")

if __name__ == '__main__':
    load_initial_history()
    # Start poller thread
    t = threading.Thread(target=background_history_poller, daemon=True)
    t.start()

    # Start secondary port 8080 thread
    t8080 = threading.Thread(target=run_server_instance, args=(8080,), daemon=True)
    t8080.start()

    # Run primary port 8088
    run_server_instance(8088)
