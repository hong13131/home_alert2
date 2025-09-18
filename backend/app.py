import os
import requests
from flask import Flask, jsonify, request, session, redirect, send_from_directory
from dotenv import load_dotenv
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import telegram
import logging
import asyncio
import naver_real_estate as nre
from sqlalchemy import text

# --- 로깅 설정 ---
logging.basicConfig(level=logging.INFO)

# --- 초기화 ---
load_dotenv()
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(backend_dir, '..'))
# 현재 파일의 절대 경로를 기준으로 static_folder의 절대 경로를 계산합니다.
static_folder_path = os.path.join(project_root, 'frontend', 'dist')
app = Flask(__name__, static_folder=static_folder_path, static_url_path='/')
# CORS: 프론트 도메인만 허용 (기본은 로컬 개발 도메인)
CORS(app, supports_credentials=True, origins=[os.environ.get('FRONTEND_ORIGIN', 'http://localhost:5173')])

# --- 설정 ---
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a-very-secret-key')
# DATABASE_URL이 있으면 우선 사용, 없으면 로컬 SQLite로 폴백
database_url = os.environ.get('DATABASE_URL')
if database_url:
    # 호환성 처리: postgres:// → postgresql://
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    # psycopg3를 사용하도록 드라이버를 명시 (기본값이 psycopg2일 수 있음)
    if database_url.startswith('postgresql://') and '+psycopg' not in database_url:
        database_url = database_url.replace('postgresql://', 'postgresql+psycopg://', 1)
    # Supabase 기본 SSL 요구 사항
    if 'supabase.co' in database_url and 'sslmode=' not in database_url:
        database_url = database_url + ('&' if '?' in database_url else '?') + 'sslmode=require'
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # 데이터베이스 경로를 절대 경로로 설정하여 실행 위치에 관계없이 동일한 파일을 사용하도록 합니다.
    db_path = os.path.join(project_root, 'instance', 'database.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
API_KEY = os.environ.get('CHUNGYAK_API_KEY')
KAKAO_REST_API_KEY = os.environ.get('KAKAO_REST_API_KEY')
KAKAO_CLIENT_SECRET = os.environ.get('KAKAO_CLIENT_SECRET')
KAKAO_REDIRECT_URI = os.environ.get('KAKAO_REDIRECT_URI', 'http://localhost:5001/api/kakao/callback')
FRONTEND_ORIGIN = os.environ.get('FRONTEND_ORIGIN', 'http://localhost:5173')
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')

# --- 확장 ---
db = SQLAlchemy(app)
login_manager = LoginManager(app)

# --- 모델 ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=True)
    kakao_id = db.Column(db.String(200), unique=True, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    telegram_chat_id = db.Column(db.String(100), unique=True, nullable=True)
    address = db.Column(db.String(200), nullable=True)
    tier = db.Column(db.String(50), nullable=False, default='free')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    url = db.Column(db.String(512), nullable=True)

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# --- API 헬퍼 함수 ---
API_URL_DETAIL = 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail'
def get_apartments_by_region(region):
    params = {'serviceKey': API_KEY, 'page': 1, 'perPage': 100, 'returnType': 'JSON'}
    if region:
        params['cond[SUBSCRPT_AREA_CODE_NM::EQ]'] = region
    try:
        response = requests.get(API_URL_DETAIL, params=params, timeout=10)
        response.raise_for_status()
        return response.json().get('data', [])
    except Exception:
        return []

def filter_apts_by_date(apts_list):
    filtered = []
    today = date.today()
    for apt in apts_list:
        try:
            end_date_str = apt.get('RCEPT_ENDDE')
            if end_date_str:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                if today <= end_date:
                    filtered.append(apt)
        except (ValueError, TypeError):
            continue
    return filtered

# --- API 라우트 ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 409
    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    if user and user.password_hash and user.check_password(password):
        login_user(user, remember=True)
        return jsonify({"message": "Logged in successfully"})
    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/api/kakao/login')
def kakao_login():
    auth_url = f"https://kauth.kakao.com/oauth/authorize?client_id={KAKAO_REST_API_KEY}&redirect_uri={KAKAO_REDIRECT_URI}&response_type=code"
    return redirect(auth_url)

@app.route('/api/kakao/callback')
def kakao_callback():
    code = request.args.get('code')
    if not code: return "Authorization code not found.", 400
    
    token_url = "https://kauth.kakao.com/oauth/token"
    token_data = {'grant_type': 'authorization_code', 'client_id': KAKAO_REST_API_KEY, 'redirect_uri': KAKAO_REDIRECT_URI, 'code': code, 'client_secret': KAKAO_CLIENT_SECRET}
    token_res = requests.post(token_url, data=token_data)
    access_token = token_res.json().get('access_token')
    if not access_token: return "Failed to get access token.", 400

    user_info_url = "https://kapi.kakao.com/v2/user/me"
    headers = {'Authorization': f'Bearer {access_token}'}
    user_info_res = requests.get(user_info_url, headers=headers)
    user_info = user_info_res.json()
    
    kakao_id = str(user_info['id'])
    nickname = user_info['properties']['nickname']

    user = User.query.filter_by(kakao_id=kakao_id).first()
    if user:
        login_user(user, remember=True)
        return redirect(f"{FRONTEND_ORIGIN}/")
    else:
        session['kakao_id'] = kakao_id
        session['kakao_nickname'] = nickname
        return redirect(f'{FRONTEND_ORIGIN}/register/kakao?nickname={nickname}')

@app.route('/api/kakao/finalize', methods=['POST'])
def kakao_finalize():
    if 'kakao_id' not in session:
        return jsonify({"message": "Kakao login process not started."}), 400
    
    data = request.get_json()
    username = data.get('username')

    if not username:
        return jsonify({"message": "Username is required."}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists."}), 409

    new_user = User(username=username, kakao_id=session['kakao_id'])
    db.session.add(new_user)
    db.session.commit()

    session.pop('kakao_id', None)
    session.pop('kakao_nickname', None)

    login_user(new_user, remember=True)
    return jsonify({"message": "User registered and logged in successfully."})

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"})

@app.route('/api/session_check', methods=['GET'])
def session_check():
    if current_user.is_authenticated:
        return jsonify({"is_logged_in": True, "user": {"username": current_user.username, "tier": current_user.tier}})
    return jsonify({"is_logged_in": False})

@app.route('/api/recommendations')
@login_required
def recommendations():
    target_region = None
    # 사용자가 주소를 설정했고, 그 값이 '전국'이 아닌 경우에만 지역 필터링
    if current_user.address and current_user.address != '전국':
        target_region = current_user.address
    
    # target_region이 None이면 (주소를 설정 안 했거나 '전국'을 선택한 경우) 전국 공고 조회
    recommended_apts = filter_apts_by_date(get_apartments_by_region(target_region))
    return jsonify(recommended_apts)

@app.route('/api/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if request.method == 'GET':
        return jsonify({
            "username": current_user.username,
            "address": current_user.address,
            "tier": current_user.tier,
            "email": current_user.email,
            "telegram_chat_id": current_user.telegram_chat_id
        })
    if request.method == 'POST':
        data = request.get_json()
        current_user.address = data.get('address', current_user.address)
        current_user.email = data.get('email', current_user.email)
        current_user.telegram_chat_id = data.get('telegram_chat_id', current_user.telegram_chat_id)
        db.session.commit()
        return jsonify({"message": "Profile updated successfully"})

@app.route('/api/calendar_events')
def calendar_events():
    events = []
    all_apts = get_apartments_by_region(None)
    for apt in all_apts:
        if apt.get('RCEPT_BGNDE') and apt.get('RCEPT_ENDDE'):
            events.append({
                'title': apt['HOUSE_NM'],
                'start': apt['RCEPT_BGNDE'],
                'end': apt['RCEPT_ENDDE'],
                'url': apt.get('PBLANC_URL', '#')
            })
    return jsonify(events)

@app.route('/api/notifications')
@login_required
def get_notifications():
    notifications = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).all()
    return jsonify([{
        'id': notif.id,
        'message': notif.message,
        'is_read': notif.is_read,
        'created_at': notif.created_at.isoformat(),
        'url': notif.url
    } for notif in notifications])

# --- 부동산 급매 API 라우트 ---

@app.route('/api/apartments/search')
def search_apartments():
    keyword = request.args.get('keyword', '')
    if not keyword:
        return jsonify({"error": "A keyword is required."}), 400
    
    matched_complexes = nre.search_complexes(keyword)
    # Convert to a list of dicts for JSON response
    results = [{"name": name, "id": complex_id} for name, complex_id in matched_complexes.items()]
    return jsonify(results)

@app.route('/api/apartments/<complex_no>/sales')
def get_apartment_sales(complex_no):
    trade_type = request.args.get('trade_type', 'A1') # A1: 매매, B1: 전세
    articles = nre.fetch_articles_with_fallback(complex_no, trade_type)
    df = nre.get_sales_dataframe(articles)
    
    # Convert DataFrame to JSON, handling potential NaN values
    return df.to_json(orient='records')

@app.route('/api/apartments/<complex_no>/analysis')
def get_apartment_analysis(complex_no):
    trade_type = request.args.get('trade_type', 'A1')
    articles = nre.fetch_articles_with_fallback(complex_no, trade_type)
    df = nre.get_sales_dataframe(articles)
    
    if df.empty:
        return jsonify({
            "mean_prices": [],
            "count_by_area": [],
            "bargains": []
        })

    mean_prices, count_by_area = nre.analyze_area_stats(df)
    bargains_df = nre.find_bargains(df)
    
    return jsonify({
        "all_sales": df.to_dict(orient='records'),
        "mean_prices": mean_prices,
        "count_by_area": count_by_area,
        "bargains": bargains_df.to_dict(orient='records')
    })

# --- React 앱 서빙 ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# --- 헬스체크 ---
@app.route('/api/health/db')
def health_db():
    try:
        db.session.execute(text('SELECT 1'))
        uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        engine = 'postgresql' if 'postgresql' in uri else ('sqlite' if 'sqlite' in uri else 'unknown')
        return jsonify({"ok": True, "engine": engine}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)[:200]}), 500

# --- 텔레그램 알림 작업 ---
async def async_send_telegram_notifications():
    """
    (비동기) 새로운 청약 공고를 확인하고 조건에 맞는 사용자에게 텔레그램 알림을 보냅니다.
    """
    with app.app_context():
        logging.info("Running async job: async_send_telegram_notifications")
        
        if not TELEGRAM_BOT_TOKEN:
            logging.warning("TELEGRAM_BOT_TOKEN is not set. Skipping notification job.")
            return

        try:
            bot = telegram.Bot(token=TELEGRAM_BOT_TOKEN)
            all_new_apts = filter_apts_by_date(get_apartments_by_region(None))
            logging.info(f"Found {len(all_new_apts)} new apartments.")

            users_to_notify = User.query.filter(User.telegram_chat_id.isnot(None), User.address.isnot(None)).all()
            logging.info(f"Found {len(users_to_notify)} users to notify.")

            if not all_new_apts or not users_to_notify:
                logging.info("No new apartments or no users to notify. Job finished.")
                return

            for user in users_to_notify:
                user_region = None
                if '서울' in user.address:
                    user_region = '서울'
                elif '경기' in user.address:
                    user_region = '경기'
                
                if not user_region:
                    logging.warning(f"Skipping user {user.id} because their address '{user.address}' is not '서울' or '경기'.")
                    continue
                
                logging.info(f"Processing user {user.id} for region {user_region}.")
                sent_count = 0
                for apt in all_new_apts:
                    if apt.get('SUBSCRPT_AREA_CODE_NM') == user_region:
                        message = f"🔔 신규 청약 알림 ({user.address})\n\n" \
                                  f"단지명: {apt['HOUSE_NM']}\n" \
                                  f"접수기간: {apt['RCEPT_BGNDE']} ~ {apt['RCEPT_ENDDE']}\n" \
                                  f"공고 URL: {apt.get('PBLANC_URL', 'N/A')}"
                        try:
                            await bot.send_message(chat_id=user.telegram_chat_id, text=message)
                            
                            # Save notification to DB
                            new_notif = Notification(
                                user_id=user.id,
                                message=message,
                                url=apt.get('PBLANC_URL', '#')
                            )
                            db.session.add(new_notif)
                            
                            logging.info(f"SUCCESS: Sent notification to user {user.id} for apt {apt['HOUSE_NM']}")
                            sent_count += 1
                        except Exception as e:
                            logging.error(f"FAILED to send message to user {user.id}: {e}")
            
            if sent_count > 0:
                db.session.commit()
                logging.info("Committed new notifications to the database.")
                if sent_count == 0:
                    logging.info(f"No matching apartments found for user {user.id} in region {user_region}.")

        except Exception as e:
            logging.error(f"An error occurred in the notification job: {e}")

def send_telegram_notifications_job():
    """APScheduler가 호출할 동기 래퍼 함수."""
    logging.info("Scheduler triggered. Running async job via asyncio.run().")
    asyncio.run(async_send_telegram_notifications())


# --- 스케줄러 설정 ---
# waitress 같은 프로덕션 서버에서 실행될 때 스케줄러를 시작합니다.
# Flask 개발 서버의 reloader는 스케줄러를 두 번 실행할 수 있으므로,
# if __name__ == '__main__' 블록 밖에서, debug=False 환경을 가정하고 설정합니다.
if os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
    scheduler = BackgroundScheduler(daemon=True)
    # 매일 오전 9시에 실행되도록 설정 (테스트를 위해 간격을 줄일 수 있음)
    scheduler.add_job(send_telegram_notifications_job, 'cron', hour=9)
    # 즉시 1회 실행 (테스트용)
    scheduler.add_job(send_telegram_notifications_job, 'date', run_date=datetime.now() + timedelta(seconds=10))
    scheduler.start()
    logging.info("Scheduler started.")


if __name__ == '__main__':
    # 개발 환경에서는 스케줄러를 여기서 실행하지 않습니다.
    # (Flask의 reloader가 두 번 실행하는 것을 방지)
    app.run(host='0.0.0.0', port=5001, debug=True)
