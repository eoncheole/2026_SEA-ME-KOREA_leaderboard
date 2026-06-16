# 2026 SEA:ME Hackathon Leaderboard

해커톤 대회용 실시간 리더보드 웹앱입니다. 팀별 기록을 표시하고, 대회용 정확한 카운트다운 타이머(3분·5분)를 제공합니다.

## 주요 기능

- **리더보드** — 최대 30팀(10팀 × 3열)을 한 화면에 표시, 기록 기준 자동 정렬
- **팀명 가리기** — 평소엔 `*******`로 가려두고, `Hold to Show Team Names` 버튼을 누르는 동안만 공개 (이름 길이 추측 불가)
- **대회용 타이머** — 시작 버튼 하나로 3분·5분 타이머를 동시에 시작. `performance.now()` 기준 종료 시각을 고정해 누적 오차가 없습니다. 0초 도달 시 비프음 + 디스플레이 점멸
- **다크/라이트 테마** — `Switch to Light/Dark Theme` 버튼으로 전환
- **관리자 페이지** (`/admin`) — 기록 추가·수정·삭제, 팀명 공개 여부 토글

## 요구 사항

- Python 3.9 이상
- Flask 3.1.1 (`requirements.txt`)

## 설치

```bash
# 1. 저장소로 이동
cd seame_web

# 2. 가상환경 생성 및 활성화 (권장)
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. 의존성 설치
pip install -r requirements.txt
```

## 실행

```bash
python app.py
```

브라우저에서 접속:

- 리더보드: <http://127.0.0.1:5001/>
- 관리자 페이지: <http://127.0.0.1:5001/admin>

> 기본 포트는 **5001**입니다.

## 환경 변수 (선택)

값을 바꾸려면 실행 시 환경 변수로 지정합니다.

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `5001` | 서버 포트 |
| `HOST` | `0.0.0.0` | 바인딩 호스트 |
| `DEBUG` | `False` | 디버그 모드 (`true`/`false`) |
| `CSV_FILE` | `leaderboard_data.csv` | 데이터 파일 경로 |
| `SECRET_KEY` | `dev-secret-key-...` | Flask 세션 시크릿 (운영 시 반드시 변경) |

예시:

```bash
PORT=8080 DEBUG=true python app.py
```

## 데이터

리더보드 기록은 `leaderboard_data.csv`에 저장됩니다. 형식:

```csv
Name,Time1,Time2
DEFAULT,첫번째 시도: 03:03.2,두번째 시도: 07:08.1
```

기록은 관리자 페이지에서 추가·수정하거나 CSV를 직접 편집할 수 있습니다.

## 프로젝트 구조

```
seame_web/
├── app.py                      # Flask 앱 진입점
├── requirements.txt
├── leaderboard_data.csv        # 기록 데이터
├── config/
│   └── settings.py             # 설정 (포트, 경로, 환경 변수)
├── models/
│   └── leaderboard.py          # CSV 읽기/쓰기 모델
├── routes/
│   └── leaderboard_routes.py   # 라우트 + API 엔드포인트
├── templates/
│   ├── leaderboard.html        # 메인 화면
│   └── admin.html              # 관리자 화면
└── static/
    ├── css/styles.css
    └── js/
        ├── leaderboard.js      # 리더보드 렌더링
        └── timers.js           # 카운트다운 타이머
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/leaderboard` | 전체 리더보드 조회 |
| `POST` | `/api/leaderboard` | 리더보드 전체 덮어쓰기 |
| `POST` | `/api/leaderboard/entry` | 기록 추가 |
| `PUT` | `/api/leaderboard/entry/<index>` | 기록 수정 |
| `DELETE` | `/api/leaderboard/entry/<index>` | 기록 삭제 |
| `POST` | `/api/toggle-names` | 팀명 공개 여부 전환 |
| `GET` | `/api/names-visibility` | 팀명 공개 여부 조회 |
