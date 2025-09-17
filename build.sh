#!/bin/bash

# 스크립트 실행 중 오류가 발생하면 즉시 중단
set -e

# 백엔드 의존성 설치
pip install -r backend/requirements.txt

# 프론트엔드 의존성 설치 및 빌드
npm --prefix frontend install
npm --prefix frontend run build

# (선택사항) 데이터베이스 마이그레이션 또는 초기화
# Flask-Migrate를 사용하는 경우 여기에 마이그레이션 명령 추가
# 예: flask db upgrade
# 현재 프로젝트는 create_db.py를 사용하므로 필요시 수동 실행 또는 아래 주석 해제
# python backend/create_db.py
