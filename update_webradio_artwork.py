import json
import re

# Update stations-data.js so web radio tracks use their live artwork.jpg link
with open('stations-data.js', 'r', encoding='utf-8') as f:
    sd = f.read()

# Load server_station_history.json
with open('server_station_history.json', 'r', encoding='utf-8') as f:
    hist = json.load(f)

ARTWORK_URLS = {
    'entexno': 'https://greca994.gr/artwork/entexno/artwork.jpg',
    'laiko': 'https://greca994.gr/artwork/laiko/artwork.jpg',
    'erwtiko': 'https://greca994.gr/artwork/erwtiko/artwork.jpg',
    'party': 'https://greca994.gr/artwork/party/artwork.jpg',
    'lounge': 'https://greca994.gr/artwork/Lounge/artwork.jpg',
    'glenti': 'https://greca994.gr/artwork/glenti/artwork.jpg',
    'xmas': 'https://greca994.gr/artwork/xmas/artwork.jpg'
}

# Update server_station_history.json for web radios
for slug, art_url in ARTWORK_URLS.items():
    if slug in hist and isinstance(hist[slug], list):
        for item in hist[slug]:
            item['image'] = art_url

with open('server_station_history.json', 'w', encoding='utf-8') as f:
    json.dump(hist, f, ensure_ascii=False, indent=2)
print("Updated server_station_history.json artwork URLs for web radios!")

# Update stations-data.js
for slug, art_url in ARTWORK_URLS.items():
    if slug in hist:
        slug_escaped = re.escape(slug)
        full_slug_pattern = r'"' + slug_escaped + r'":\s*\[[\s\S]*?\](?=,|\n\s*\})'
        replacement = f'"{slug}": ' + json.dumps(hist[slug], ensure_ascii=False, indent=8)
        sd = re.sub(full_slug_pattern, replacement, sd)

with open('stations-data.js', 'w', encoding='utf-8') as f:
    f.write(sd)
print("Updated stations-data.js artwork URLs for web radios!")
