# 토익스피킹 만능문장 암기 테스트 — 기획·설계서

> 이 문서는 Claude Code가 읽고 바로 구현할 수 있도록 작성한 설계서입니다.
> 구현 시 이 문서의 내용을 우선하고, 문서에 없는 기능은 임의로 추가하지 않습니다.

---

## 1. 개요

| 항목 | 내용 |
|---|---|
| 배경 | 토익스피킹 준비생은 스피킹 연습 상대가 없고, 실력이 늘었는지 확인하기 어렵다. 우선 시험에 자주 쓰는 **만능문장**을 확실히 외우는 것부터 돕는다. |
| 사용자 | 토익스피킹 준비생 1명 (기획자 본인이 테스트). 학습자 화면만 존재하며 강사·관리자 화면은 없음 |
| 사용 환경 | PC 브라우저 (Chrome 기준), 키보드 타이핑 |
| 핵심 동작 | 한글 문장을 보고 → 영어로 타이핑 → 정답 확인 → 학습자가 직접 **맞음 / 틀림** 판단 → 틀린 문장만 다시 풀기 |
| 범위 밖 (만들지 않음) | 로그인, 결제, 서버, DB, 녹음, AI 채점, 자동 채점, 힌트, 학습 기록·통계 저장 |

---

## 2. 기술 설계

### 2.1 스택
- **순수 HTML + CSS + JavaScript** (프레임워크·빌드 도구·npm 패키지 없음)
- 실행 방법: `index.html`을 더블클릭해서 브라우저로 연다 (`file://`로 동작해야 함)

### 2.2 파일 구조
```
toeic-speaking-drill/
├── index.html      # 화면 4개의 마크업 (섹션으로 나누고 하나만 보이게)
├── styles.css      # 스타일
├── sentences.js    # 기본 만능문장 데이터 (아래 5장)
├── problems.js     # 실전 문제 데이터 (4.5장)
├── images/         # 사진묘사 문제용 그림 (SVG)
└── app.js          # 상태 관리, 화면 전환, 테스트 로직, localStorage
```

### 2.3 구현 시 주의사항
- `file://`에서 열리므로 **ES 모듈(`type="module"`, `import`)과 `fetch`를 쓰지 않는다.** 일반 `<script>` 태그로 `sentences.js` → `app.js` 순서로 불러온다.
- `sentences.js`는 전역 상수 `DEFAULT_SENTENCES`를 선언한다.
- `alert`, `confirm`, `prompt` 같은 브라우저 대화상자를 쓰지 않는다. 확인이 필요하면 화면 안에서 처리한다.
- localStorage 읽기·쓰기는 `try/catch`로 감싸고, 실패해도 기본 문장만으로 동작해야 한다.
- 외부 CDN·폰트·이미지를 쓰지 않는다 (오프라인 동작).

---

## 3. 데이터 설계

### 3.1 문장 데이터 형식
```js
{
  id: "pic-01",            // 기본 문장: "pic-NN" / "qna-NN", 추가 문장: "custom-<timestamp>"
  part: "picture",         // "picture"(사진묘사) | "question"(질문에 답하기)
  ko: "한글 문장",
  en: "English sentence.",
  custom: false            // 학습자가 추가한 문장이면 true
}
```

### 3.2 저장 정책
| 데이터 | 저장 위치 | 유지 여부 |
|---|---|---|
| 기본 만능문장 | `sentences.js` (코드에 포함) | 항상 |
| 학습자가 추가한 문장 | localStorage 키 `toeicDrill.customSentences` (배열 JSON) | **창을 닫아도 유지** |
| 테스트 진행 상태, 맞음/틀림 결과 | 메모리 (JS 변수) | 창을 닫거나 새로고침하면 사라짐 (매번 새로 시작) |

- 문장 풀 = `DEFAULT_SENTENCES` + localStorage의 추가 문장
- 기본 문장은 삭제할 수 없고, 추가한 문장만 삭제할 수 있다.

### 3.3 테스트 상태 (메모리)
```js
state = {
  screen: "home" | "test" | "result" | "manage" | "practice",
  part: "picture" | "question",
  queue: [/* 이번 라운드 문장 배열 */],
  index: 0,                 // 현재 문제 번호 (0부터)
  phase: "typing" | "revealed",
  answers: [/* { sentence, typed, correct: true|false } */],
  round: 1                  // 1 = 첫 풀이, 2 이상 = 틀린 문장 다시 풀기
}

// 실전 문제 (4.5장)
practice = {
  kind: "picture" | "question",
  queue: [/* 섞은 문제 배열 */],
  index: 0,                 // 현재 문제 번호
  step: 0,                  // 질문에 답하기 세트 안의 질문 번호 (0~2)
  phase: "typing" | "revealed"
}
```

---

## 4. 화면 설계

화면은 5개이며, 한 번에 하나만 보인다. 상단에 앱 이름 "토익스피킹 만능문장"을 항상 표시한다.

```
[1 시작] ──파트 선택──▶ [2 테스트] ──10문장 완료──▶ [3 결과]
   │  ▲                                              │
   │  └──────────────── 처음으로 ◀───────────────────┤
   │                                                 └─틀린 문장만 다시 풀기─▶ [2 테스트]
   ├──문장 관리──▶ [4 문장 관리] ──처음으로──▶ [1 시작]
   └──실전 문제 선택──▶ [5 실전 문제] ──마지막 문제 / 그만하기──▶ [1 시작]
```

### 4.1 화면 1 — 시작
- **만능문장 암기** 영역: 파트 카드 2개 **사진묘사**, **질문에 답하기**. 각 카드에 문장 수 표시 (예: "문장 20개 · 추가 2개")
- **실전 문제** 영역: 카드 2개 (4.5장)
- 카드 클릭 → 해당 파트로 테스트 시작
- **문장 관리** 버튼 → 화면 4

### 4.2 화면 2 — 테스트
- 상단: 파트 이름, 진행률 `3 / 10`, 다시 풀기 라운드면 "틀린 문장 다시 풀기" 배지 표시
- 가운데: 한글 문장 (크게)
- 입력창: 영어 타이핑. 화면 진입 시 자동 포커스
- **typing 단계**
  - `Enter` 또는 **정답 확인** 버튼 → revealed 단계로
  - 빈칸으로 Enter해도 넘어간다 (모르는 문장일 때)
- **revealed 단계**
  - 입력창은 비활성화하고, **내 답**과 **정답**을 위아래로 나란히 보여준다
  - 버튼 2개: **맞음 (1)**, **틀림 (2)** — 키보드 `1` / `2`로도 누를 수 있다
  - 누르면 결과를 기록하고 다음 문장으로. 마지막 문장이면 화면 3으로
- **그만하기** 버튼: 기록 없이 화면 1로 돌아간다
- 출제 규칙
  - 첫 라운드: 선택한 파트의 문장 풀에서 **랜덤 10개** (중복 없음). 풀이 10개 미만이면 전부를 섞어서 낸다
  - 셔플은 Fisher–Yates 사용

### 4.3 화면 3 — 결과
- 요약: **"10문장 중 7개 맞음"**
- 틀린 문장 목록: 각 항목에 한글 / 정답 영어 / 내가 쓴 답
- 버튼
  - **틀린 문장만 다시 풀기**: 이번 라운드에서 틀린 문장만 랜덤으로 섞어 화면 2로 (round + 1)
  - **같은 파트 새로 풀기**: 새 랜덤 10문장으로 화면 2
  - **처음으로**: 화면 1
- 틀린 문장이 0개면 "모두 맞혔어요!" 메시지를 보여주고 **틀린 문장만 다시 풀기** 버튼은 숨긴다
- 키보드: `Enter` = 틀린 문장이 있으면 다시 풀기, 없으면 같은 파트 새로 풀기

### 4.4 화면 4 — 문장 관리
- 추가 폼: 파트 선택(사진묘사/질문에 답하기), 한글 문장, 영어 문장, **추가** 버튼
  - 한글·영어 모두 비어 있지 않아야 추가된다 (앞뒤 공백 제거 후 검사). 비어 있으면 입력창 아래에 안내 문구 표시
  - 추가하면 localStorage에 저장하고 폼을 비운다
- 문장 목록: 파트 탭(사진묘사 / 질문에 답하기)으로 나눠 보여준다
  - 기본 문장은 "기본" 표시, 삭제 버튼 없음
  - 추가 문장은 "추가" 표시와 **삭제** 버튼. 삭제는 버튼을 한 번 더 누르면 확정되는 방식(첫 클릭 시 "정말 삭제?"로 바뀜)으로 처리
- **처음으로** 버튼

### 4.5 화면 5 — 실전 문제
- 시작 화면의 파트 카드 아래에 카드 2개 추가: **사진묘사 (문제)**, **질문에 답하기 (문제)**
- 데이터: `problems.js`의 전역 상수 `PICTURE_PROBLEMS`(그림 + 모범답안), `QUESTION_PROBLEMS`(상황 설명 + 질문 3개 + 질문별 모범답안)
  - 사진은 `images/`의 SVG 그림을 `<img>`로 보여준다 (오프라인 동작)
- 출제: 카드를 누르면 전체 문제를 섞어서 하나씩 낸다. 질문에 답하기는 한 세트의 질문 3개를 순서대로 낸다
- 답 입력: 여러 줄 입력창. `Enter` 또는 **정답 확인** → 내 답과 **모범답안**을 위아래로 비교 (`Shift+Enter`는 줄바꿈)
- 비교 후 `Enter` 또는 **다음 질문 / 다음 문제** 버튼. 마지막 문제 뒤에는 **처음으로**
- 채점, 맞음/틀림, 시간 제한, 기록 저장은 없다. **그만하기**로 언제든 화면 1로 돌아간다

---

## 5. 기본 만능문장 데이터 (`sentences.js`)

```js
const DEFAULT_SENTENCES = [
  // ── 사진묘사 (picture) ──
  { id: "pic-01", part: "picture", ko: "이 사진은 공원에서 찍힌 것 같습니다.", en: "This picture seems to have been taken in a park.", custom: false },
  { id: "pic-02", part: "picture", ko: "이 사진에서 가장 먼저 눈에 띄는 것은 테이블에 앉아 있는 두 사람입니다.", en: "The first thing I notice in this picture is two people sitting at a table.", custom: false },
  { id: "pic-03", part: "picture", ko: "사진 가운데에 한 여자가 노트북으로 일하고 있습니다.", en: "In the middle of the picture, a woman is working on a laptop.", custom: false },
  { id: "pic-04", part: "picture", ko: "사진 왼쪽에는 한 남자가 서류를 보고 있습니다.", en: "On the left side of the picture, a man is looking at some documents.", custom: false },
  { id: "pic-05", part: "picture", ko: "사진 오른쪽에는 몇몇 사람들이 줄을 서서 기다리고 있습니다.", en: "On the right side of the picture, some people are waiting in line.", custom: false },
  { id: "pic-06", part: "picture", ko: "사진 앞쪽에는 테이블 위에 커피 컵 몇 개가 있습니다.", en: "In the foreground, there are some coffee cups on the table.", custom: false },
  { id: "pic-07", part: "picture", ko: "사진 뒤쪽에는 높은 건물들이 보입니다.", en: "In the background, I can see some tall buildings.", custom: false },
  { id: "pic-08", part: "picture", ko: "사진 위쪽에는 간판 하나가 걸려 있습니다.", en: "At the top of the picture, a sign is hanging.", custom: false },
  { id: "pic-09", part: "picture", ko: "그녀는 흰 셔츠와 청바지를 입고 있습니다.", en: "She is wearing a white shirt and jeans.", custom: false },
  { id: "pic-10", part: "picture", ko: "그는 손에 휴대폰을 들고 있습니다.", en: "He is holding a phone in his hand.", custom: false },
  { id: "pic-11", part: "picture", ko: "그들은 무언가에 대해 이야기하고 있는 것 같습니다.", en: "They seem to be talking about something.", custom: false },
  { id: "pic-12", part: "picture", ko: "그들은 회의를 하고 있는 것처럼 보입니다.", en: "It looks like they are having a meeting.", custom: false },
  { id: "pic-13", part: "picture", ko: "몇몇 사람들이 거리를 따라 걷고 있습니다.", en: "Some people are walking along the street.", custom: false },
  { id: "pic-14", part: "picture", ko: "차 몇 대가 길가에 주차되어 있습니다.", en: "Several cars are parked along the street.", custom: false },
  { id: "pic-15", part: "picture", ko: "날씨가 화창하고 맑아 보입니다.", en: "The weather looks sunny and clear.", custom: false },
  { id: "pic-16", part: "picture", ko: "전반적으로 사람들이 바빠 보입니다.", en: "Overall, the people look busy.", custom: false },
  { id: "pic-17", part: "picture", ko: "전반적으로 편안하고 평화로운 분위기인 것 같습니다.", en: "Overall, it seems like a relaxing and peaceful atmosphere.", custom: false },
  { id: "pic-18", part: "picture", ko: "이것이 이 사진에 대해 제가 말할 수 있는 전부입니다.", en: "That's all I can say about this picture.", custom: false },

  // ── 질문에 답하기 (question) ──
  { id: "qna-01", part: "question", ko: "저는 보통 일주일에 두세 번 그것을 합니다.", en: "I usually do it two or three times a week.", custom: false },
  { id: "qna-02", part: "question", ko: "마지막으로 그것을 한 것은 지난 주말이었습니다.", en: "The last time I did it was last weekend.", custom: false },
  { id: "qna-03", part: "question", ko: "저는 집 근처에 있는 곳을 선호합니다.", en: "I prefer a place near my house.", custom: false },
  { id: "qna-04", part: "question", ko: "그곳까지 걸어서 10분 정도 걸립니다.", en: "It takes about ten minutes to walk there.", custom: false },
  { id: "qna-05", part: "question", ko: "가장 큰 이유는 시간을 많이 절약해 주기 때문입니다.", en: "The main reason is that it saves me a lot of time.", custom: false },
  { id: "qna-06", part: "question", ko: "무엇보다도 그것이 더 편리합니다.", en: "Most of all, it is more convenient.", custom: false },
  { id: "qna-07", part: "question", ko: "게다가 저는 돈을 아낄 수 있습니다.", en: "In addition, I can save money.", custom: false },
  { id: "qna-08", part: "question", ko: "예를 들어, 저는 온라인에서 쉽게 정보를 찾을 수 있습니다.", en: "For example, I can easily find information online.", custom: false },
  { id: "qna-09", part: "question", ko: "그것은 제가 스트레스를 푸는 데 도움이 됩니다.", en: "It helps me relieve stress.", custom: false },
  { id: "qna-10", part: "question", ko: "그것은 제 건강에 좋습니다.", en: "It is good for my health.", custom: false },
  { id: "qna-11", part: "question", ko: "저는 친구들과 시간을 보내는 것을 좋아합니다.", en: "I like spending time with my friends.", custom: false },
  { id: "qna-12", part: "question", ko: "요즘에는 많은 사람들이 스마트폰을 사용합니다.", en: "These days, many people use smartphones.", custom: false },
  { id: "qna-13", part: "question", ko: "저는 그것이 좋은 생각이라고 생각합니다.", en: "I think it's a good idea.", custom: false },
  { id: "qna-14", part: "question", ko: "하지만 단점도 있습니다.", en: "However, there are some disadvantages too.", custom: false },
  { id: "qna-15", part: "question", ko: "그것이 제가 그것을 선호하는 이유입니다.", en: "That's why I prefer it.", custom: false },
  { id: "qna-16", part: "question", ko: "저는 그것을 다른 사람들에게 추천하고 싶습니다.", en: "I would like to recommend it to others.", custom: false },
  { id: "qna-17", part: "question", ko: "그래서 저는 앞으로도 계속 그것을 할 것입니다.", en: "So I will keep doing it in the future.", custom: false },
  { id: "qna-18", part: "question", ko: "솔직히 말하면, 저는 그것에 대해 많이 생각해 본 적이 없습니다.", en: "To be honest, I haven't thought about it much.", custom: false }
];
```

---

## 6. 디자인 가이드

- PC 기준, 가운데 정렬된 카드 레이아웃 (최대 폭 약 720px)
- 한글 문제 문장은 크게(약 24px), 입력창도 크게(약 20px)
- 정답 확인 후: 정답 문장은 강조 색, 내 답은 회색 톤
- 맞음 버튼은 초록 계열, 틀림 버튼은 빨강 계열. 버튼에 단축키 `(1)`, `(2)` 표기
- 한국어 UI. 글꼴은 시스템 글꼴 (`-apple-system, "Malgun Gothic", sans-serif`)

---

## 7. 구현 순서 (단계별로 만들고 확인)

1. **뼈대**: 파일 4개 생성, 화면 전환(시작 ↔ 문장 관리)만 동작
2. **테스트 화면**: 파트 선택 → 랜덤 10문장 → 타이핑 → 정답 확인 → 맞음/틀림 → 다음 문장
3. **결과 화면**: 정답 개수, 틀린 문장 목록, 다시 풀기 / 새로 풀기 / 처음으로
4. **문장 관리**: 추가·삭제, localStorage 저장·불러오기
5. **키보드 조작**: Enter, 1, 2 단축키와 자동 포커스
6. **디자인 정리 및 완료 기준 점검** (8장)

---

## 8. 완료 기준 (전부 통과하면 "다 만들었다")

- [ ] `index.html`을 더블클릭하면 설치 없이 바로 열린다
- [ ] 시작 화면에서 파트를 고르면 해당 파트 문장 **10개가 랜덤**으로, 중복 없이 나온다
- [ ] 한글을 보고 영어를 타이핑한 뒤 정답을 확인하고 **맞음 / 틀림**을 누를 수 있다
- [ ] 10문장을 끝내면 결과 화면에 **정답 개수와 틀린 문장 목록**이 보인다
- [ ] **틀린 문장만 다시 풀기**를 누르면 틀린 문장만으로 다시 테스트하고, 다 맞힐 때까지 반복할 수 있다
- [ ] 문장 관리 화면에서 문장을 **추가·삭제**할 수 있고, 새로고침하거나 창을 닫았다 열어도 **추가한 문장이 남아 있다**
- [ ] 추가한 문장이 해당 파트 테스트에 실제로 출제된다
- [ ] 기본 만능문장이 **파트별 15개 이상**(현재 100개씩, 전체 목록은 `sentences.js`) 들어 있다
- [ ] 마우스 없이 **Enter / 1 / 2 키만으로** 한 세트를 끝까지 풀 수 있다
- [ ] 테스트 기록은 새로고침하면 사라진다 (의도된 동작)
- [ ] 브라우저 콘솔에 오류가 없다
