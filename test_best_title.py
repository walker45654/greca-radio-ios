# Verify getBestTrackTitle logic
def is_same_track(t1, a1, t2, a2):
    if not t1 or not t2: return False
    import re
    def g2l(s):
        table = {'Α':'A','Β':'V','Γ':'G','Δ':'D','Ε':'E','Ζ':'Z','Η':'I','Θ':'TH','Ι':'I','Κ':'K','Λ':'L','Μ':'M','Ν':'N','Ξ':'X','Ο':'O','Π':'P','Ρ':'R','Σ':'S','Τ':'T','Υ':'Y','Φ':'F','Χ':'CH','Ψ':'PS','Ω':'O'}
        return ''.join(table.get(c, c) for c in s.upper())
    c1 = re.sub(r'[^A-Z0-9]', '', g2l(str(t1)).upper())
    c2 = re.sub(r'[^A-Z0-9]', '', g2l(str(t2)).upper())
    if not c1 or not c2: return False
    if c1 == c2 or (len(c1) >= 5 and c1 in c2) or (len(c2) >= 5 and c2 in c1):
        return True
    return False

def get_best_track_title(new_title, artist, live_title, live_artist):
    best = new_title.strip().upper()
    if live_title and len(live_title) > len(best) and is_same_track(live_title, live_artist, best, artist):
        best = live_title.strip().upper()
    return best

res = get_best_track_title('ΓΙΑΤΙ ΓΛΥΚΙ', 'ΜΑΤΟΥΛΑ ΖΑΜΑΝΗ', 'ΓΙΑΤΙ ΓΛΥΚΙΑ ΜΟΥ ΚΛΑΙΣ', 'ΜΑΤΟΥΛΑ ΖΑΜΑΝΗ')
print('Result of get_best_track_title:', res)
assert res == 'ΓΙΑΤΙ ΓΛΥΚΙΑ ΜΟΥ ΚΛΑΙΣ'
print('Test passed successfully!')

