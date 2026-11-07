import urllib.request
import urllib.parse
import json

def greek_to_latin(text):
    if not text:
        return ""
    s = text.upper()
    replacements = [
        ('ΟΥ', 'OU'), ('ΕΙ', 'EI'), ('ΑΙ', 'AI'),
        ('ΜΠ', 'B'), ('ΝΤ', 'D'), ('ΓΚ', 'G'),
        ('Α', 'A'), ('Β', 'V'), ('Γ', 'G'), ('Δ', 'D'), ('Ε', 'E'), ('Ζ', 'Z'),
        ('Η', 'I'), ('Θ', 'TH'), ('Ι', 'I'), ('Κ', 'K'), ('Λ', 'L'), ('Μ', 'M'),
        ('Ν', 'N'), ('Ξ', 'X'), ('Ο', 'O'), ('Π', 'P'), ('Ρ', 'R'), ('Σ', 'S'),
        ('Τ', 'T'), ('Υ', 'Y'), ('Φ', 'F'), ('Χ', 'CH'), ('Ψ', 'PS'), ('Ω', 'O'),
        ('Ά', 'A'), ('Έ', 'E'), ('Ή', 'I'), ('Ί', 'I'), ('Ό', 'O'), ('Ύ', 'Y'), ('Ώ', 'O')
    ]
    for gr, lat in replacements:
        s = s.replace(gr, lat)
    return s

tracks = [
    ('APON', 'ΚΑΝΤΑΔΑ'),
    ('ΝΑΤΑΣΑ ΘΕΟΔΩΡΙΔΟΥ', 'ΑΠΕΝΑΝΤΙ'),
    ('ΠΕΓΚΥ ΖΗΝΑ', 'ΣΟΥ ΤΟ ΟΡΚΙΖΟΜΑΙ'),
    ('ΝΙΚΟΣ ΑΠΕΡΓΗΣ FEAT DAPHNE LAWRENCE', 'ΙΣΩΣ ΑΥΡΙΟ'),
    ('ΡΙΑ ΕΛΛΗΝΙΔΟΥ', 'SAFARI'),
    ('STAVENTO', 'ΜΕΣΑ ΣΟΥ'),
    ('ΜΙΧΑΛΗΣ ΚΑΡΑΓΚΟΥΝΗΣ', 'ΣΗΜΑΔΙ'),
    ('ΑΝΝΑ ΒΙΣΣΗ', 'ΟΧΙ ΓΙΑΤΙ'),
    ('ΣΤΕΛΙΟΣ ΡΟΚΚΟΣ', 'ΜΕ ΣΕΝΑ ΠΛΑΙ ΜΟΥ')
]

for artist, title in tracks:
    clean_title = title.split('(')[0].split('[')[0].strip()
    clean_artist = artist.replace('FEAT', '').replace('GRECA', '').strip()
    queries = [
        f"{clean_artist} {clean_title}",
        f"{greek_to_latin(clean_artist)} {greek_to_latin(clean_title)}",
        f"{clean_title}",
        f"{greek_to_latin(clean_title)}"
    ]
    found = None
    for q in queries:
        try:
            url = f"https://itunes.apple.com/search?term={urllib.parse.quote(q)}&entity=song&limit=1"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data.get('results'):
                    res = data['results'][0]
                    found = (q, res.get('artistName'), res.get('trackName'), res.get('artworkUrl100'))
                    break
        except Exception as e:
            pass
    if found:
        print(f"[{artist} - {title}] => FOUND via '{found[0]}': {found[1]} - {found[2]}")
    else:
        print(f"[{artist} - {title}] => NOT FOUND")
