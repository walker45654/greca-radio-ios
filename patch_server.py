with open('server.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_fetch = '''def fetch_live_greca_history():
    try:
        url = 'https://greca994.gr/wp-admin/admin-ajax.php'
        data = urllib.parse.urlencode({
            'action': 'prsidekick-get-history',
            'radioid': '2968',
            'quantity': '5',
            'offset': '0',
            'orderby': 'latest'
        }).encode('utf-8')'''

new_fetch = '''WORDPRESS_RADIO_IDS = {
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
        }).encode('utf-8')'''

if old_fetch in content:
    content = content.replace(old_fetch, new_fetch, 1)
    print("1. fetch_live_greca_history in server.py updated.")
else:
    print("1. fetch_live_greca_history pattern not found.")

old_handle = '''    def handle_history(self, station=None):
        try:
            # Refresh live history for main station from official WordPress Pro Radio / Jazler
            live_main = fetch_live_greca_history()
            with history_lock:
                if live_main:
                    station_history['main'] = live_main'''

new_handle = '''    def handle_history(self, station=None):
        try:
            # Refresh live history for requested station or all stations
            with history_lock:
                target_slugs = [station.lower()] if (station and station.lower() in MONITORED_STATIONS) else MONITORED_STATIONS
                for s in target_slugs:
                    live_t = fetch_live_greca_history(s)
                    if live_t and len(live_t) > 0:
                        station_history[s] = live_t[:5]
                save_history_to_disk()'''

if old_handle in content:
    content = content.replace(old_handle, new_handle, 1)
    print("2. handle_history in server.py updated.")
else:
    print("2. handle_history pattern not found.")

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("server.py updated successfully!")
