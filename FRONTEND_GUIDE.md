# 프론트엔드 안내서 (Frontend Guide)

## 1. 폴더 구조

- **`frontend/`**: 모든 프론트엔드 관련 코드가 위치하는 루트 폴더입니다.
  - **`public/`**: 정적 파일(이미지 등)이 위치합니다.
  - **`src/`**: 핵심 소스 코드가 위치합니다.
    - **`components/`**: 여러 페이지에서 재사용되는 작은 UI 조각들 (예: `ApartmentCard.jsx`, `BottomNav.jsx`)
    - **`pages/`**: 각 화면(페이지)을 구성하는 메인 컴포넌트들 (예: `HomeScreen.jsx`, `LoginPage.jsx`)
    - **`App.jsx`**: 전체 애플리케이션의 레이아웃과 라우팅(페이지 전환)을 관리하는 최상위 컴포넌트입니다.
    - **`main.tsx`**: React 애플리케이션을 시작하는 진입점 파일입니다.
    - **`index.css`**: Tailwind CSS를 불러오는 글로벌 CSS 파일입니다.
  - **`package.json`**: 필요한 JavaScript 라이브러리 목록과 실행 스크립트를 정의합니다.
  - **`vite.config.js`**: Vite 빌드 도구의 설정 파일 (백엔드 API 프록시 설정 포함).
  - **`tailwind.config.js`**: Tailwind CSS의 설정 파일.
  - **`postcss.config.js`**: PostCSS 설정 파일 (Tailwind CSS 구동에 필요).

## 2. 핵심 컴포넌트 및 데이터 흐름

- **`App.jsx`**:
  - `react-router-dom`을 사용하여 URL 경로에 따라 어떤 페이지 컴포넌트를 보여줄지 결정합니다.
  - `ProtectedRoute`를 통해 로그인한 사용자만 접근할 수 있는 페이지(홈, 프로필 등)를 보호합니다.
  - 모든 페이지에 공통적으로 표시되는 상단 헤더와 하단 네비게이션 바(`BottomNav`)의 레이아웃을 제공합니다.

- **`HomeScreen.jsx`**:
  - 페이지가 로드될 때, 백엔드의 `/api/session_check`와 `/api/recommendations` API를 호출합니다.
  - API로부터 받아온 실시간 사용자 정보와 추천 공고 데이터를 화면에 표시합니다.

- **`LoginPage.jsx` / `RegisterPage.jsx` / `KakaoRegisterPage.jsx`**:
  - 사용자의 입력을 받아, 각각 `/api/login`, `/api/register`, `/api/kakao/finalize` API를 호출하여 백엔드와 통신합니다.

## 3. 실행 방법

1.  **터미널을 열고 `frontend` 폴더로 이동합니다.**
    ```bash
    cd frontend
    ```
2.  **(최초 실행 시) 필요한 라이브러리를 설치합니다.**
    ```bash
    npm install
    ```
3.  **React 개발 서버를 실행합니다.**
    ```bash
    npm run dev
    ```
4.  서버는 `http://localhost:5173` (또는 다른 포트)에서 실행됩니다.
