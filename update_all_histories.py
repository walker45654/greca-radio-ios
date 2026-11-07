import urllib.request
import urllib.parse
import json
import re

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

DEFAULT_COVERS = {
    'main': 'assets/stations/main.png',
    'laiko': 'assets/stations/laiko.jpg',
    'entexno': 'assets/stations/entexno.jpg',
    'erwtiko': 'assets/stations/erwtiko.jpg',
    'party': 'assets/stations/party.jpg',
    'lounge': 'assets/stations/lounge.png',
    'glenti': 'assets/stations/glenti.jpg',
    'xmas': 'assets/stations/xmas.jpg'
}

def fetch_history_for_slug(slug):
    rid = WORDPRESS_RADIO_IDS[slug]
    url = 'https://greca994.gr/wp-admin/admin-ajax.php'
    data = urllib.parse.urlencode({
        'action': 'prsidekick-get-history',
        'radioid': rid,
        'quantity': '8',
        'offset': '0',
        'orderby': 'latest'
    }).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'User-Agent': 'Mozilla/5.0'})
    tracks = []
    seen = set()
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode('utf-8')
            items = json.loads(raw)
            for entry in items:
                s = entry.get('song', entry)
                if not s:
                    continue
                t = (s.get('prsidekick_song') or s.get('title') or '').strip().upper()
                a = (s.get('prsidekick_artist') or s.get('artist') or '').strip().upper()
                playdate = s.get('prsidekick_latest_playdate') or s.get('time') or ''
                time_str = playdate.split(' ')[1][:5] if ' ' in playdate else (playdate[:5] if ':' in playdate else '')
                art = s.get('prsidekick_art') or s.get('image') or ''
                if art and art.startswith('http://'):
                    art = 'https://' + art[7:]
                if not art:
                    art = f"https://greca994.gr/artwork/{'Lounge' if slug == 'lounge' else slug}/artwork.jpg" if slug != 'main' else DEFAULT_COVERS['main']

                # Reject jingles
                if not t or any(k in t for k in ['GRECA FM', 'LIVE STREAM', 'WEB RADIO', '99,4']):
                    continue
                if t in seen:
                    continue
                seen.add(t)
                tracks.append({
                    'title': t,
                    'artist': a or slug.upper(),
                    'time': time_str,
                    'image': art
                })
                if len(tracks) >= 5:
                    break
    except Exception as e:
        print(f"Error fetching {slug}: {e}")
    return tracks

def main():
    # Read existing server_station_history.json
    try:
        with open('server_station_history.json', 'r', encoding='utf-8') as f:
            existing = json.load(f)
    except Exception:
        existing = {}

    all_histories = {}
    for slug in WORDPRESS_RADIO_IDS.keys():
        print(f"Fetching live real-time broadcast history for {slug}...")
        fetched = fetch_history_for_slug(slug)
        if fetched and len(fetched) > 0:
            all_histories[slug] = fetched
            print(f"  -> Got {len(fetched)} tracks for {slug}")
        else:
            all_histories[slug] = existing.get(slug, [])
            print(f"  -> Kept existing {len(all_histories[slug])} tracks for {slug}")

    # Keep main untouched if user requested ("MHN PEIRAJEIS KJATI STON KANONIKO GRECA")
    if existing.get('main'):
        all_histories['main'] = existing['main']

    with open('server_station_history.json', 'w', encoding='utf-8') as f:
        json.dump(all_histories, f, ensure_ascii=False, indent=2)
    print("server_station_history.json updated successfully!")

    # Now update stations-data.js initialHistoriesByStation for web radios
    with open('stations-data.js', 'r', encoding='utf-8') as f:
        sd = f.read()

    # Format the updated initialHistoriesByStation
    for slug, tr_list in all_histories.items():
        if slug == 'main':
            continue  # strictly leave main untouched!
        slug_escaped = re.escape(slug)
        full_slug_pattern = r'"' + slug_escaped + r'":\s*\[[\s\S]*?\](?=,|\n\s*\})'
        replacement = f'"{slug}": ' + json.dumps(tr_list, ensure_ascii=False, indent=8)
        sd = re.sub(full_slug_pattern, replacement, sd)

    with open('stations-data.js', 'w', encoding='utf-8') as f:
        f.write(sd)
    print("stations-data.js initialHistoriesByStation updated for all web radios!")

if __name__ == '__main__':
    main()
