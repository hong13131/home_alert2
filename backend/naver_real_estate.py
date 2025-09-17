import requests
import pandas as pd
import re
import json
import os

# --- Constants and Configuration ---
# NOTE: These headers are minimal and do not require session-specific tokens,
# making them more robust for a server environment.
PC_HEADERS = {
    "accept": "application/json, text/plain, */*",
    "origin": "https://new.land.naver.com",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

MOBILE_HEADERS = {
    "accept": "application/json, text/plain, */*",
    "referer": "https://m.land.naver.com/",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

# --- Data Loading ---

def load_complex_map():
    """Loads the apartment complex mapping from the JSON file."""
    try:
        dir_path = os.path.dirname(os.path.realpath(__file__))
        file_path = os.path.join(dir_path, 'complex_map.json')
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def search_complexes(keyword):
    """Searches for apartment complexes by a keyword."""
    complex_map = load_complex_map()
    if not keyword:
        return complex_map
    return {k: v for k, v in complex_map.items() if keyword in k}

# --- Data Fetching with Fallback ---

def pc_fetch_articles(session, complex_no, trade_type, page=1):
    """Fetches a single page of articles from the PC API."""
    session.headers.update(PC_HEADERS)
    session.headers.update({"referer": f"https://new.land.naver.com/complexes/{complex_no}"})
    url = (f"https://new.land.naver.com/api/articles/complex/{complex_no}"
           f"?realEstateType=APT%3AABYG%3AJGC%3APRE&tradeType={trade_type}"
           f"&priceMin=0&priceMax=900000000&areaMin=0&areaMax=900000000"
           f"&priceType=RETAIL&page={page}&type=list&order=prc&sameAddressGroup=true")
    r = session.get(url, timeout=(3, 10))
    r.raise_for_status()
    return r.json().get("articleList", [])

def mobile_fetch_articles(session, complex_no, trade_type, page=1):
    """Fetches a single page of articles from the Mobile API."""
    session.headers.update(MOBILE_HEADERS)
    r = session.get("https://m.land.naver.com/complex/getComplexArticleList",
                    params={"hscpNo": complex_no, "tradTpCd": trade_type, "order": "prc", "page": page},
                    timeout=(3, 10))
    r.raise_for_status()
    res = r.json().get("result", {})
    return res.get("list", []) or []

def normalize_mobile_article(article):
    """Converts a mobile API article to the PC API format."""
    return {
        "articleName": article.get("atclNm"),
        "buildingName": article.get("bildNm"),
        "tradeTypeName": article.get("tradTpNm"),
        "floorInfo": article.get("flrInfo"),
        "dealOrWarrantPrc": article.get("prcInfo"),
        "areaName": f"{article.get('spc1')}㎡", # Approximate format
        "direction": article.get("direction"),
        "articleConfirmYmd": article.get("cfmYmd"),
        "articleFeatureDesc": article.get("atclFetrDesc"),
        "tagList": article.get("tagList", []),
        # These fields are not available in the mobile API, so we provide defaults
        "realEstateTypeName": article.get("rletTpNm"),
        "sameAddrMaxPrc": article.get("sameAddrMaxPrc"),
        "sameAddrMinPrc": article.get("sameAddrMinPrc"),
        "realtorName": article.get("rltrNm"),
        "PBLANC_NO": article.get("atclNo"), # Use article number as a unique key
    }

def fetch_articles_with_fallback(complex_no, trade_type):
    """
    Fetches all articles for a complex, trying the PC API first and falling back to the Mobile API.
    """
    s = requests.Session()
    all_articles = []
    page = 1
    
    # Try PC API first
    try:
        while True:
            articles = pc_fetch_articles(s, complex_no, trade_type, page)
            if not articles:
                break
            all_articles.extend(articles)
            page += 1
        if all_articles:
            return all_articles
    except requests.RequestException:
        # If PC API fails, reset and try mobile
        pass

    # Fallback to Mobile API
    s = requests.Session() # Reset session for new headers
    all_articles = []
    page = 1
    try:
        while True:
            articles = mobile_fetch_articles(s, complex_no, trade_type, page)
            if not articles:
                break
            normalized_articles = [normalize_mobile_article(art) for art in articles]
            all_articles.extend(normalized_articles)
            page += 1
    except requests.RequestException:
        return [] # Both failed
        
    return all_articles

# --- Data Processing and Analysis (remains the same) ---

def parse_price(price_str):
    """Parses Naver's price string (e.g., '16억 5,000') into a numerical value (in 10,000s)."""
    try:
        price_str = str(price_str).replace(",", "")
        if "억" in price_str:
            parts = price_str.split("억")
            billions = int(parts[0])
            ten_thousands = int(parts[1].strip()) if parts[1].strip() else 0
            return billions * 10000 + ten_thousands
        return int(re.sub(r"[^\d]", "", price_str))
    except (ValueError, IndexError):
        return None

def get_sales_dataframe(articles):
    """Converts a list of articles into a processed Pandas DataFrame."""
    if not articles:
        return pd.DataFrame()
    
    df = pd.DataFrame(articles)
    dedup_cols = ["buildingName", "floorInfo", "areaName", "dealOrWarrantPrc", "direction"]
    df = df.drop_duplicates(subset=dedup_cols, keep="first")
    df["price_num"] = df["dealOrWarrantPrc"].apply(parse_price)
    df = df.dropna(subset=['price_num'])
    
    # Create a new column for grouping by integer area
    df['areaGroup'] = df['areaName'].str.extract(r'(\d+\.?\d*)').astype(float).astype(int).astype(str) + '㎡'
    return df

def _sort_by_area_size(df, area_col='areaGroup'):
    """Helper function to sort dataframes by the numerical part of the area name."""
    df['sort_key'] = df[area_col].str.extract(r'(\d+)').astype(int)
    return df.sort_values(by='sort_key').drop(columns=['sort_key'])

def analyze_area_stats(df):
    """Calculates average price and count per area, grouped by integer area."""
    if df.empty:
        return [], []
        
    mean_prices = df.groupby("areaGroup")["price_num"].mean().reset_index()
    mean_prices_sorted = _sort_by_area_size(mean_prices)
    
    count_by_area = df["areaGroup"].value_counts().reset_index()
    count_by_area.columns = ["areaGroup", "count"]
    count_by_area_sorted = _sort_by_area_size(count_by_area)
    
    # Rename column back to areaName for frontend compatibility
    mean_prices_sorted = mean_prices_sorted.rename(columns={"areaGroup": "areaName"})
    count_by_area_sorted = count_by_area_sorted.rename(columns={"areaGroup": "areaName"})
    
    return mean_prices_sorted.to_dict('records'), count_by_area_sorted.to_dict('records')

def find_bargains(df, threshold=0.95):
    """Finds bargain sales based on a discount threshold from the area's average price."""
    if df.empty or 'price_num' not in df.columns:
        return pd.DataFrame()

    # Group by the integer area for average price calculation
    df["avg_price_by_area"] = df.groupby("areaGroup")["price_num"].transform("mean")
    bargains = df[df["price_num"] < df["avg_price_by_area"] * threshold].copy()
    
    if not bargains.empty:
        bargains["discount_pct"] = (1 - bargains["price_num"] / bargains["avg_price_by_area"]) * 100
    
    return bargains
