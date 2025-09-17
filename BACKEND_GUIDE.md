# 백엔드 안내서 (Backend Guide)

## 1. 폴더 구조

- **`backend/`**: 모든 백엔드 관련 코드가 위치하는 루트 폴더입니다.
  - **`instance/`**: `database.db` 파일이 저장되는 폴더입니다. (자동 생성)
  - **`app.py`**: Flask 애플리케이션의 메인 파일. 모든 API 로직과 설정이 포함됩니다.
  - **`create_db.py`**: 데이터베이스 스키마를 생성/리셋하기 위한 유틸리티 스크립트입니다.
  - **`requirements.txt`**: 필요한 Python 라이브러리 목록입니다.
  - **`.env`**: API 키 등 민감한 환경 변수를 저장하는 파일입니다.

## 2. 데이터베이스 모델 (`app.py`)

- **`User`**: 사용자 정보를 저장합니다.
  - `id`: 고유 ID (Primary Key)
  - `username`: 사용자 이름 (Unique)
  - `password_hash`: 비밀번호 (암호화하여 저장)
  - `kakao_id`: 카카오 고유 ID (Unique)
  - `address`: 사용자가 설정한 관심 지역
  - `tier`: 구독 등급 ('free' 또는 'premium')

- **`Notification`**: 사용자에게 발송된 알림 내역을 저장합니다.
  - `id`: 고유 ID
  - `user_id`: 알림을 받은 사용자 ID (Foreign Key)
  - `message`: 알림 메시지 내용
  - `is_read`: 사용자가 읽었는지 여부
  - `created_at`: 알림 생성 시간
  - `pblanc_url`: 관련 공고 URL

- **`Favorite`**: 사용자가 '찜'한 공고를 저장합니다. (현재는 모델만 정의됨)
  - `id`: 고유 ID
  - `user_id`: 사용자 ID (Foreign Key)
  - `house_manage_no`: 공고의 고유 관리 번호

## 3. 주요 API 명세서 (`app.py`)

- **`POST /api/register`**: 일반 회원가입
- **`POST /api/login`**: 일반 로그인
- **`GET /api/kakao/login`**: 카카오 로그인 시작 (카카오 인증 페이지로 리디렉션)
- **`GET /api/kakao/callback`**: 카카오 인증 후, 토큰 교환 및 사용자 정보 처리
- **`POST /api/kakao/finalize`**: 신규 카카오 사용자의 최종 회원가입 처리
- **`POST /api/logout`**: 로그아웃
- **`GET /api/session_check`**: 현재 로그인 상태 확인
- **`GET /api/recommendations`**: 로그인한 사용자를 위한 맞춤 추천 공고 목록 반환
- **`GET /api/profile`**: 로그인한 사용자의 프로필 정보 조회
- **`POST /api/profile`**: 로그인한 사용자의 프로필 정보 업데이트
- **`GET /api/calendar_events`**: 캘린더에 표시할 전국 청약 일정 반환
- **`GET /api/notifications`**: 로그인한 사용자의 모든 알림 내역 반환

## 4. 실행 방법

1.  **터미널을 열고 `backend` 폴더로 이동합니다.**
    ```bash
    cd backend
    ```
2.  **필요한 라이브러리를 설치합니다.**
    ```bash
    pip install -r requirements.txt
    ```
3.  **(최초 실행 시) 데이터베이스를 생성합니다.**
    ```bash
    python create_db.py
    ```
4.  **API 서버를 실행합니다.**
    ```bash
    python app.py
    ```
5.  서버는 `http://localhost:5001` 에서 실행됩니다.
