# 배포 안내 — Vercel

> 결론: **Vercel로 바로 배포할 수 있고, Supabase는 지금은 필요 없습니다.**
> 아래 "내가 할 일"만 따라 하면 됩니다. 코드 수정은 필요 없습니다.

---

## 1. Supabase가 필요한가? → 필요 없음

이 앱은 **정적 사이트**입니다. 서버나 데이터베이스와 통신하는 코드가 전혀 없습니다.

| 데이터 | 저장 위치 | 서버(DB) 필요? |
|---|---|---|
| 기본 만능문장 200개, 실전 문제, 그림 | 코드 파일 안 (`sentences.js`, `problems.js`, `images/`) | 아니요 |
| 내가 추가한 문장 | 브라우저 저장소 (localStorage) | 아니요 |
| 테스트 진행 상태, 맞음/틀림 | 메모리 (새로고침하면 사라짐, 의도된 동작) | 아니요 |

또 설계서(`SPEC.md` 1장)에서 **로그인·서버·DB·학습 기록 저장은 만들지 않기로** 정했습니다. 그래서 지금 Supabase를 붙이면 쓸 곳이 없습니다.

### 나중에 Supabase가 필요해지는 경우

아래 중 하나라도 원하게 되면 그때 Supabase(로그인 + DB)가 필요합니다.

- **추가한 문장을 PC와 휴대폰에서 똑같이** 보고 싶다
- **학습 기록·통계**(언제, 몇 개 맞혔는지)를 남기고 싶다
- **여러 사람**이 각자 계정으로 쓰게 하고 싶다

이 기능들은 설계서의 "범위 밖"에 있어서, 하려면 **설계서부터 고쳐야** 합니다. 그때 내가 할 일은 Supabase 가입·프로젝트 생성, 그리고 프로젝트 URL과 `anon` 키 전달 정도입니다.
⚠️ `service_role` 키는 절대 앱 코드나 채팅에 넣지 마세요.

---

## 2. Vercel 배포 — 내가 할 일

GitHub 저장소 `yeaji1220/gu`를 Vercel에 연결하는 방식입니다. 한 번만 설정하면 됩니다.

### ① Vercel 가입
1. https://vercel.com 접속 → **Sign Up**
2. **Continue with GitHub** 선택 → **yeaji1220** 계정으로 로그인
3. 플랜은 **Hobby (무료)** 선택. 개인·비상업용이면 충분합니다

### ② 저장소 가져오기
1. 대시보드에서 **Add New… → Project**
2. **Import Git Repository** 목록에 `gu`가 안 보이면 **Adjust GitHub App Permissions**를 누릅니다
   - **Only select repositories** → `gu`만 선택 → **Save** (다른 저장소까지 열어줄 필요 없음)
3. 목록에 나온 `gu` 옆의 **Import** 클릭

### ③ 설정 (⭐ 여기만 주의)
| 항목 | 값 |
|---|---|
| Project Name | 원하는 이름 (예: `toeic-speaking-drill`) → 주소가 됩니다 |
| Framework Preset | **Other** |
| Root Directory | **Edit** 눌러서 **`toeic-speaking-drill`** 선택 ⭐ |
| Build Command / Output Directory | 건드리지 않음 (비워 둠) |
| Environment Variables | 없음 |

> **Root Directory를 꼭 바꿔야 하는 이유:** `index.html`이 저장소 맨 위가 아니라 `toeic-speaking-drill` 폴더 안에 있습니다. 안 바꾸면 접속했을 때 404(빈 페이지)가 뜹니다.

### ④ 배포
1. **Deploy** 클릭 → 1분 이내에 끝납니다
2. 완료 화면의 주소(예: `https://toeic-speaking-drill.vercel.app`)를 눌러 확인

### ⑤ 배포 후 확인할 것
- [ ] 시작 화면에 "문장 100개"가 두 번, 실전 문제 카드 2개가 보인다
- [ ] 만능문장 테스트를 하나 풀어본다 (Enter / 1 / 2)
- [ ] 사진묘사 (문제)에서 그림이 나온다
- [ ] 휴대폰에서도 주소로 열린다

---

## 3. 알아둘 점

- **자동 배포:** GitHub `main`에 새로 올리면(push) Vercel이 **자동으로 다시 배포**합니다. 따로 할 일이 없습니다.
- **추가한 문장은 주소·기기마다 따로 저장됩니다.**
  - PC에서 `index.html`을 더블클릭해서 추가한 문장은 Vercel 주소에서 안 보입니다. 반대도 마찬가지입니다.
  - PC와 휴대폰도 서로 공유되지 않습니다. 공유가 필요하면 위 1장의 "Supabase가 필요해지는 경우"에 해당합니다.
- **주소는 공개됩니다.** 주소를 아는 사람은 누구나 열 수 있습니다. 개인 정보는 없으니 문제는 없습니다.
- **비용:** Hobby 플랜 무료 범위 안에서 충분합니다. 결제 정보 입력은 필요 없습니다.
- **도메인 연결(선택):** 내 도메인이 있으면 Vercel 프로젝트 → **Settings → Domains**에서 추가할 수 있습니다.

---

## 4. 막히면

| 증상 | 원인 / 해결 |
|---|---|
| 접속하면 404 | Root Directory가 `toeic-speaking-drill`이 아님 → **Settings → Build and Deployment → Root Directory** 수정 후 **Redeploy** |
| Import 목록에 `gu`가 없음 | GitHub 앱 권한 → ②-2 다시 |
| 다른 GitHub 계정으로 로그인됨 | Vercel에서 로그아웃 → github.com에서도 로그아웃 → yeaji1220으로 다시 로그인 |
| 화면이 깨지거나 그림이 안 나옴 | 배포 주소와 함께 알려주면 원인을 확인해 드립니다 |
