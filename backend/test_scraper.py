import requests
import json

def pc_guest_fetch_once(complex_no="111515", trade_type="A1"):
    s = requests.Session()
    s.headers.update({
        "accept": "application/json, text/plain, */*",
        "origin": "https://new.land.naver.com",
        "referer": f"https://new.land.naver.com/complexes/{complex_no}",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    })
    url = (f"https://new.land.naver.com/api/articles/complex/{complex_no}"
           f"?realEstateType=APT%3AABYG%3AJGC%3APRE&tradeType={trade_type}"
           f"&priceMin=0&priceMax=900000000&areaMin=0&areaMax=900000000"
           f"&priceType=RETAIL&page=1&type=list&order=prc&sameAddressGroup=true")
    try:
        r = s.get(url, timeout=(3,10))
        if r.status_code != 200:
            return [], r.status_code, r.text
        data = r.json()
        items = data.get("articleList", [])
        return items, 200, ""
    except requests.RequestException as e:
        return [], e.response.status_code if e.response is not None else 500, str(e)
    except json.JSONDecodeError:
        return [], 200, "JSON decode error"

def mland_fetch_once(complex_no="111515", trade_type="A1"):
    s = requests.Session()
    s.headers.update({
        "accept": "application/json, text/plain, */*",
        "referer": "https://m.land.naver.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    })
    try:
        r = s.get("https://m.land.naver.com/complex/getComplexArticleList",
                  params={"hscpNo": complex_no, "tradTpCd": trade_type, "order": "prc", "page": 1},
                  timeout=(3,10))
        if r.status_code != 200:
            return [], r.status_code, r.text
        j = r.json()
        res = j.get("result", {})
        return (res.get("list", []) or []), 200, ""
    except requests.RequestException as e:
        return [], e.response.status_code if e.response is not None else 500, str(e)
    except json.JSONDecodeError:
        return [], 200, "JSON decode error"

if __name__ == "__main__":
    complex_no, trade_type = "111515", "A1"
    print(f"PC guest 시도: complex={complex_no}, trade={trade_type}")
    rows, code, body = pc_guest_fetch_once(complex_no, trade_type)
    print("PC rows:", len(rows), "status:", code)
    
    if code != 200 or not rows:
        print("→ m.land 폴백")
        rows, code, body = mland_fetch_once(complex_no, trade_type)
        print("m.land rows:", len(rows), "status:", code)
    
    if rows:
        print("--- Success! First article found: ---")
        first = rows[0]
        print(json.dumps(first, indent=2, ensure_ascii=False))
    else:
        print("데이터 없음 / 차단 가능. 응답 본문:")
        print(body[:500])
