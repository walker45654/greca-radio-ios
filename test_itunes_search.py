import urllib.request, urllib.parse, json

table = {
    'Α': 'A', 'Β': 'V', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'I', 'Θ': 'TH',
    'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N', 'Ξ': 'X', 'Ο': 'O', 'Π': 'P',
    'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y', 'Φ': 'F', 'Χ': 'CH', 'Ψ': 'PS', 'Ω': 'O'
}
def g2l(s):
    return ''.join(table.get(c, c) for c in s.upper())

def search_itunes(artist, title):
    queries = [
        f'{g2l(artist)} {g2l(title)}',
        f'{artist} {title}'
    ]
    for q in queries:
        url = 'https://itunes.apple.com/search?term=' + urllib.parse.quote(q) + '&entity=song&limit=3'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req, timeout=4) as r:
                res = json.loads(r.read().decode('utf-8'))
                if res.get('results'):
                    for item in res['results']:
                        print(f'Match for "{artist} - {title}": {item.get("artistName")} - {item.get("trackName")} => {item.get("artworkUrl100")}')
                        return
        except Exception as e:
            pass
    print(f'No match for "{artist} - {title}"')

search_itunes('ΝΙΚΟΣ ΠΑΠΑΖΟΓΛΟΥ', 'ΑΧ ΕΛΛΑΔΑ')
search_itunes('ΜΑΤΟΥΛΑ ΖΑΜΑΝΗ', 'ΓΙΑΤΙ ΓΛΥΚΙΑ ΜΟΥ ΚΛΑΙΣ')
search_itunes('ΣΠΥΡΟΣ ΖΑΓΟΡΑΙΟΣ', 'ΠΟΥ ΠΑΣ ΜΕΜΕΤΗ ΜΟΥ')
search_itunes('ΣΤΑΜΑΤΗΣ ΓΟΝΙΔΗΣ', 'ΚΑΙ ΜΕ ΠΙΑΝΟΥΝ ΤΑ ΚΛΑΜΑΤΑ')
search_itunes('ΒΑΣΙΛΗΣ ΚΑΡΡΑΣ', 'ΘΑ ΜΟΥ ΚΛΕΙΣΕΙΣ ΤΟ ΣΠΙΤΙ')

