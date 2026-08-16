import urllib.parse
import re
import requests

def parse_maps_url(url: str):
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    # Resolve redirect if shortlink
    final_url = url
    if "goo.gl" in url or "maps.app" in url:
        try:
            r = requests.head(url, allow_redirects=True, headers=headers, timeout=5)
            final_url = r.url
        except Exception:
            pass

    print(f"Final URL: {final_url}")
    
    # 1. Look for /place/Place+Name/@lat,lng
    place_match = re.search(r'/place/([^/@]+)', final_url)
    coords_match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', final_url)
    q_coords_match = re.search(r'[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)', final_url)
    q_text_match = re.search(r'[?&]q=([^&]+)', final_url)

    venue_name = ""
    if place_match:
        venue_name = urllib.parse.unquote_plus(place_match.group(1)).split(",")[0]
    elif q_text_match and not q_coords_match:
        venue_name = urllib.parse.unquote_plus(q_text_match.group(1)).split(",")[0]

    lat, lng = None, None
    if coords_match:
        lat, lng = float(coords_match.group(1)), float(coords_match.group(2))
    elif q_coords_match:
        lat, lng = float(q_coords_match.group(1)), float(q_coords_match.group(2))

    print(f"Extracted Venue: {venue_name}, Lat: {lat}, Lng: {lng}")

    # Reverse geocode if coordinates found
    if lat and lng:
        geo_url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}&addressdetails=1"
        try:
            res = requests.get(geo_url, headers={"User-Agent": "RotaSphereMapsParser/1.0"}, timeout=5).json()
            addr = res.get("address", {})
            return {
                "venueName": venue_name or res.get("name") or addr.get("amenity") or addr.get("building") or "Venue",
                "streetAddress": f"{addr.get('road', '')} {addr.get('suburb', '')}".strip(),
                "city": addr.get("city") or addr.get("town") or addr.get("county") or "Bengaluru",
                "stateRegion": addr.get("state") or "Karnataka",
                "country": addr.get("country") or "India",
                "pincode": addr.get("postcode") or "",
                "lat": lat,
                "lng": lng
            }
        except Exception as e:
            print(f"Geocoding error: {e}")

    # Fallback to search if venue name
    if venue_name:
        search_url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(venue_name)}&format=json&addressdetails=1&limit=1"
        try:
            res = requests.get(search_url, headers={"User-Agent": "RotaSphereMapsParser/1.0"}, timeout=5).json()
            if res and len(res) > 0:
                addr = res[0].get("address", {})
                return {
                    "venueName": venue_name,
                    "streetAddress": f"{addr.get('road', '')} {addr.get('suburb', '')}".strip(),
                    "city": addr.get("city") or addr.get("town") or addr.get("county") or "Bengaluru",
                    "stateRegion": addr.get("state") or "Karnataka",
                    "country": addr.get("country") or "India",
                    "pincode": addr.get("postcode") or "",
                    "lat": float(res[0].get("lat")),
                    "lng": float(res[0].get("lon"))
                }
        except Exception as e:
            print(f"Search error: {e}")

    return {"venueName": venue_name or "Venue Location"}

# Test standard google maps place URL
test_url = "https://www.google.com/maps/place/NIMHANS+Convention+Centre/@12.9373,77.5937,17z/data=!3m1!4b1"
result = parse_maps_url(test_url)
print("\nParsed Result:", result)
