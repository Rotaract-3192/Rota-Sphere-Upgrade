import urllib.parse
import re
import requests

def parse_any_maps_input(url_or_query: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }

    raw = url_or_query.strip()
    
    # Check if raw input is just text / place query
    if not raw.startswith("http://") and not raw.startswith("https://"):
        raw_query = raw
    else:
        # Resolve redirect
        try:
            r = requests.get(raw, headers=headers, allow_redirects=True, timeout=10)
            final_url = r.url
            html = r.text
        except Exception:
            final_url = raw
            html = ""

        print(f"Final URL: {final_url}")
        parsed = urllib.parse.urlparse(final_url)
        qs = urllib.parse.parse_qs(parsed.query)

        # Look in query string parameters: q, daddr, destination, query, place, orig
        candidates = []
        for param in ["q", "daddr", "destination", "query", "place"]:
            if param in qs and qs[param]:
                candidates.append(qs[param][0])

        # Look in URL path: /place/..., /dir/.../..., /search/...
        path_parts = parsed.path.split("/")
        for i, part in enumerate(path_parts):
            if part in ["place", "search", "dir"]:
                if i + 1 < len(path_parts) and path_parts[i+1] and not path_parts[i+1].startswith("@"):
                    candidates.append(urllib.parse.unquote_plus(path_parts[i+1]))

        # Look in title / meta
        og_title = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']', html)
        if og_title and "Google Maps" not in og_title.group(1):
            candidates.append(og_title.group(1))

        # Look for coordinates @lat,lng
        coords_match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', final_url)
        if coords_match:
            lat, lng = float(coords_match.group(1)), float(coords_match.group(2))
            print(f"Found Coords in URL: {lat}, {lng}")
            return reverse_geocode(lat, lng, candidates[0] if candidates else "")

        # Look in html for lat lng
        coords_in_html = re.search(r'\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*,\s*\d+\s*\]', html)
        if coords_in_html:
            lat, lng = float(coords_in_html.group(1)), float(coords_in_html.group(2))
            print(f"Found Coords in HTML: {lat}, {lng}")
            return reverse_geocode(lat, lng, candidates[0] if candidates else "")

        raw_query = candidates[0] if candidates else ""

    print(f"Resolving query: '{raw_query}'")
    if not raw_query:
        # If url has geocode parameter or any text
        return {"error": "Could not extract place name from URL"}

    # Search via Nominatim
    return search_geocode(raw_query)

def reverse_geocode(lat, lng, fallback_name=""):
    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}&addressdetails=1"
    res = requests.get(url, headers={"User-Agent": "RotaSphereApp/1.0"}).json()
    addr = res.get("address", {})
    venue = fallback_name or res.get("name") or addr.get("amenity") or addr.get("building") or "Venue Location"
    return {
        "success": True,
        "venueName": venue,
        "streetAddress": f"{addr.get('road', '')} {addr.get('suburb', '')}".strip(),
        "city": addr.get("city") or addr.get("town") or addr.get("county") or "Bengaluru",
        "stateRegion": addr.get("state") or "Karnataka",
        "country": addr.get("country") or "India",
        "pincode": addr.get("postcode") or "",
        "lat": lat,
        "lng": lng
    }

def search_geocode(query):
    clean_q = query.replace("to:", "").replace("from:", "").strip()
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(clean_q)}&format=json&addressdetails=1&limit=1"
    res = requests.get(url, headers={"User-Agent": "RotaSphereApp/1.0"}).json()
    if res and len(res) > 0:
        item = res[0]
        addr = item.get("address", {})
        return {
            "success": True,
            "venueName": clean_q.split(",")[0],
            "streetAddress": f"{addr.get('road', '')} {addr.get('suburb', '')}".strip(),
            "city": addr.get("city") or addr.get("town") or addr.get("county") or "Bengaluru",
            "stateRegion": addr.get("state") or "Karnataka",
            "country": addr.get("country") or "India",
            "pincode": addr.get("postcode") or "",
            "lat": float(item.get("lat")),
            "lng": float(item.get("lon"))
        }
    return {"success": True, "venueName": clean_q.split(",")[0], "city": "Bengaluru", "stateRegion": "Karnataka", "country": "India"}

# Test
print(parse_any_maps_input("https://www.google.com/maps/place/Surat+Diamond+Bourse/@21.127,72.846,15z"))
print(parse_any_maps_input("https://www.google.com/maps?daddr=NIMHANS+Convention+Centre,+Bengaluru"))
print(parse_any_maps_input("Surat International Exhibition and Convention Centre"))
