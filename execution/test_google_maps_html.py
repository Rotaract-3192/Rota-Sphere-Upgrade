import urllib.parse
import re
import requests

def test_fetch_maps(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }
    
    try:
        r = requests.get(url, headers=headers, allow_redirects=True, timeout=10)
        final_url = r.url
        html = r.text
        print(f"Final URL: {final_url}")
        
        # 1. Look for og:title or title in HTML
        og_title = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']', html)
        og_desc = re.search(r'<meta\s+property=["\']og:description["\']\s+content=["\']([^"\']+)["\']', html)
        title_tag = re.search(r'<title>([^<]+)</title>', html)
        
        print("og:title:", og_title.group(1) if og_title else None)
        print("og:desc:", og_desc.group(1) if og_desc else None)
        print("title:", title_tag.group(1) if title_tag else None)

        # 2. Look for coordinates in HTML or final URL
        coords = re.findall(r'\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]', html)
        print(f"Found {len(coords)} coordinate pairs in HTML")
        if coords:
            print("First 3 coords:", coords[:3])

    except Exception as e:
        print(f"Error: {e}")

test_fetch_maps("https://www.google.com/maps?um=1&ie=UTF-8&fb=1&gl=in&sa=X&geocode=KW_BbjemFq47MU9NMCRJa8m")
