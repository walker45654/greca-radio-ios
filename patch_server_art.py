with open('server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Update fetch_live_greca_history artwork logic in server.py
old_s_art = """                    if t and not any(k in t for k in ['GRECA FM', 'LIVE STREAM', 'WEB RADIO']):
                        tracks.append({
                            'title': t,
                            'artist': a or 'GRECA FM 99,4',
                            'time': time_str,
                            'image': art or 'assets/stations/main.png'
                        })"""

new_s_art = """                    default_station_art = f"https://greca994.gr/artwork/{station_slug}/artwork.jpg" if station_slug != 'main' else 'assets/stations/main.png'
                    if t and not any(k in t for k in ['GRECA FM', 'LIVE STREAM', 'WEB RADIO']):
                        tracks.append({
                            'title': t,
                            'artist': a or (station_slug.upper() if station_slug != 'main' else 'GRECA FM 99,4'),
                            'time': time_str,
                            'image': default_station_art if station_slug != 'main' else (art or 'assets/stations/main.png')
                        })"""

if old_s_art in content:
    content = content.replace(old_s_art, new_s_art, 1)
    print("1. server.py fetch_live_greca_history artwork updated.")
else:
    print("WARNING: old_s_art not found!")

# For web radios, do not insert new_item into station_history in update_station_track
old_insert = """        # Truly new distinct song! Prepend and maintain max 5 items
        new_item = {
            "title": clean_title,
            "artist": clean_artist,
            "time": time_str,
            "image": artwork or (f"https://greca994.gr/artwork/{station_slug}/artwork.jpg" if station_slug != 'main' else "assets/stations/main.png")
        }
        hist.insert(0, new_item)
        station_history[station_slug] = hist[:5]
        save_history_to_disk()"""

new_insert = """        # Truly new distinct song!
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
            save_history_to_disk()"""

if old_insert in content:
    content = content.replace(old_insert, new_insert, 1)
    print("2. server.py update_station_track web radio unshift disabled.")
else:
    print("WARNING: old_insert not found!")

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("server.py patched successfully!")
