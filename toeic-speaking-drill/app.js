(function () {
  "use strict";

  var STORAGE_KEY = "toeicDrill.customSentences";
  var QUESTIONS_PER_ROUND = 10;
  var PART_NAMES = { picture: "사진묘사", question: "질문에 답하기" };

  // ── 상태 (메모리) ──
  // 만능문장 테스트 진행 상태
  var state = {
    screen: "home",           // "home" | "test" | "result" | "manage" | "practice"
    part: "picture",
    queue: [],
    index: 0,
    phase: "typing",
    answers: [],
    round: 1
  };

  // 실전 문제 진행 상태
  var practice = {
    kind: "picture",          // "picture" | "question"
    queue: [],
    index: 0,                 // 현재 문제 번호
    step: 0,                  // 질문에 답하기 세트 안의 질문 번호
    phase: "typing"
  };

  var customSentences = loadCustomSentences();
  var manageTab = "picture";
  var pendingDeleteId = null;

  // ── localStorage ──
  function loadCustomSentences() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (s) {
        return s && typeof s.id === "string" &&
          (s.part === "picture" || s.part === "question") &&
          typeof s.ko === "string" && typeof s.en === "string";
      }).map(function (s) {
        return { id: s.id, part: s.part, ko: s.ko, en: s.en, custom: true };
      });
    } catch (e) {
      return [];
    }
  }

  function saveCustomSentences() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customSentences));
    } catch (e) {
      // 저장 실패 시에도 이번 세션 메모리에서는 계속 동작한다
    }
  }

  // ── 문장 풀 ──
  function getPool(part) {
    return DEFAULT_SENTENCES.concat(customSentences).filter(function (s) {
      return s.part === part;
    });
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  // ── DOM 공통 ──
  function $(id) {
    return document.getElementById(id);
  }

  var screens = {
    home: $("screen-home"),
    test: $("screen-test"),
    result: $("screen-result"),
    manage: $("screen-manage"),
    practice: $("screen-practice")
  };

  function showScreen(name) {
    state.screen = name;
    document.body.setAttribute("data-screen", name);
    Object.keys(screens).forEach(function (key) {
      screens[key].hidden = key !== name;
    });
    blurActive();
  }

  // 단축키가 포커스된 버튼·입력창과 겹치지 않도록 포커스를 해제한다
  function blurActive() {
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
  }

  function makeP(className, text) {
    var p = document.createElement("p");
    p.className = className;
    p.textContent = text;
    return p;
  }

  function showMyAnswer(el, typed) {
    el.textContent = typed || "(입력 없음)";
    el.classList.toggle("empty", !typed);
  }

  // ── 화면 1: 시작 ──
  function renderHome() {
    ["picture", "question"].forEach(function (part) {
      var pool = getPool(part);
      var customCount = pool.filter(function (s) { return s.custom; }).length;
      var text = "문장 " + pool.length + "개";
      if (customCount > 0) text += " · 추가 " + customCount + "개";
      $("count-" + part).textContent = text;
    });
    $("practice-count-picture").textContent = "사진 " + PICTURE_PROBLEMS.length + "개";
    $("practice-count-question").textContent = "문제 " + QUESTION_PROBLEMS.length + "세트 · 질문 3개씩";
    $("stat-sentences").textContent = DEFAULT_SENTENCES.length + customSentences.length;
    $("stat-problems").textContent = PICTURE_PROBLEMS.length + QUESTION_PROBLEMS.length;
    renderStudy();
  }

  // ── 학습 기록 (localStorage) ──
  // 날짜별로 푼 문장 수를 저장한다: { "2026-10-30": 24, ... }
  var LOG_KEY = "toeicDrill.studyLog";
  var GOAL_KEY = "toeicDrill.dailyGoal";
  var studyLog = loadJson(LOG_KEY, {});
  var dailyGoal = Number(loadJson(GOAL_KEY, 20)) || 20;
  var calMonth = new Date();
  calMonth.setDate(1);

  function loadJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var v = JSON.parse(raw);
      return v !== null && typeof v === typeof fallback ? v : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // 저장 실패 시에도 이번 세션 메모리에서는 계속 동작한다
    }
  }

  function dateKey(d) {
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }

  function logStudy() {
    var key = dateKey(new Date());
    studyLog[key] = (studyLog[key] || 0) + 1;
    saveJson(LOG_KEY, studyLog);
  }

  function countOn(d) {
    return studyLog[dateKey(d)] || 0;
  }

  // 오늘(아직 안 했으면 어제)부터 거꾸로 이어진 공부한 날 수
  function getStreak() {
    var d = new Date();
    if (!countOn(d)) d.setDate(d.getDate() - 1);
    var n = 0;
    while (countOn(d) > 0) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  function renderStudy() {
    var today = countOn(new Date());
    var pct = Math.min(100, Math.round(today / dailyGoal * 100));
    $("today-done").textContent = today;
    $("today-goal").textContent = dailyGoal;
    $("today-ring").style.setProperty("--pct", pct);
    $("today-ring").classList.toggle("done", today >= dailyGoal);
    $("today-msg").textContent = today >= dailyGoal
      ? "오늘 목표 달성! 대단해요 🎉"
      : today === 0
        ? "오늘은 아직 시작 전이에요"
        : "목표까지 " + (dailyGoal - today) + "문장 남았어요";
    $("goal-select").value = String(dailyGoal);

    var keys = Object.keys(studyLog);
    $("total-sentences").textContent = keys.reduce(function (sum, k) { return sum + studyLog[k]; }, 0);
    $("total-days").textContent = keys.filter(function (k) { return studyLog[k] > 0; }).length + "일";
    $("streak").textContent = getStreak() + "일";

    renderCalendar();
  }

  function renderCalendar() {
    var y = calMonth.getFullYear();
    var m = calMonth.getMonth();
    var todayKey = dateKey(new Date());
    var box = $("cal-days");
    $("cal-title").textContent = y + "년 " + (m + 1) + "월";
    box.textContent = "";

    var first = new Date(y, m, 1).getDay();
    for (var i = 0; i < first; i++) box.appendChild(document.createElement("span"));

    var last = new Date(y, m + 1, 0).getDate();
    for (var day = 1; day <= last; day++) {
      var d = new Date(y, m, day);
      var n = countOn(d);
      var cell = document.createElement("span");
      cell.className = "cal-day";
      if (n > 0) {
        cell.className += n >= dailyGoal ? " lv3" : n >= dailyGoal / 2 ? " lv2" : " lv1";
        cell.title = (m + 1) + "월 " + day + "일 · " + n + "문장";
      }
      if (dateKey(d) === todayKey) cell.className += " today";
      cell.textContent = day;
      box.appendChild(cell);
    }
  }

  function goHome() {
    renderHome();
    showScreen("home");
  }

  // ── 화면 2: 테스트 ──
  function startTest(part, sentences, round) {
    state.part = part;
    state.queue = sentences;
    state.index = 0;
    state.answers = [];
    state.round = round;
    showScreen("test");
    renderQuestion();
  }

  function startNewRound(part) {
    var queue = shuffle(getPool(part)).slice(0, QUESTIONS_PER_ROUND);
    startTest(part, queue, 1);
  }

  function renderQuestion() {
    var sentence = state.queue[state.index];
    state.phase = "typing";

    $("test-part").textContent = PART_NAMES[state.part];
    $("test-retry-badge").hidden = state.round < 2;
    $("test-progress").textContent = (state.index + 1) + " / " + state.queue.length;
    $("question-ko").textContent = sentence.ko;

    var input = $("answer-input");
    input.value = "";
    input.disabled = false;
    $("typing-actions").hidden = false;
    $("reveal-area").hidden = true;
    input.focus();
  }

  function reveal() {
    if (state.phase !== "typing") return;
    var input = $("answer-input");

    state.phase = "revealed";
    input.disabled = true;
    showMyAnswer($("my-answer"), input.value.trim());
    $("correct-answer").textContent = state.queue[state.index].en;

    $("typing-actions").hidden = true;
    $("reveal-area").hidden = false;
    blurActive();
  }

  function judge(correct) {
    if (state.phase !== "revealed") return;
    state.answers.push({
      sentence: state.queue[state.index],
      typed: $("answer-input").value.trim(),
      correct: correct
    });
    logStudy();
    state.index++;
    if (state.index < state.queue.length) {
      renderQuestion();
    } else {
      showResult();
    }
  }

  // ── 화면 3: 결과 ──
  function getWrongAnswers() {
    return state.answers.filter(function (a) { return !a.correct; });
  }

  function showResult() {
    var wrong = getWrongAnswers();
    var total = state.answers.length;

    $("result-summary").textContent = total + "문장 중 " + (total - wrong.length) + "개 맞음";
    $("result-perfect").hidden = wrong.length > 0;
    $("btn-retry-wrong").hidden = wrong.length === 0;

    var list = $("wrong-list");
    list.innerHTML = "";
    wrong.forEach(function (a) {
      var li = document.createElement("li");
      li.appendChild(makeP("wrong-ko", a.sentence.ko));
      li.appendChild(makeP("wrong-en", a.sentence.en));
      li.appendChild(makeP("wrong-typed", "내 답: " + (a.typed || "(입력 없음)")));
      list.appendChild(li);
    });

    $("result-hint").textContent = wrong.length > 0
      ? "Enter: 틀린 문장만 다시 풀기"
      : "Enter: 같은 파트 새로 풀기";

    showScreen("result");
  }

  function retryWrong() {
    var wrong = getWrongAnswers();
    if (wrong.length === 0) return;
    var queue = shuffle(wrong.map(function (a) { return a.sentence; }));
    startTest(state.part, queue, state.round + 1);
  }

  function onResultEnter() {
    if (getWrongAnswers().length > 0) {
      retryWrong();
    } else {
      startNewRound(state.part);
    }
  }

  // ── 화면 4: 문장 관리 ──
  function goManage() {
    pendingDeleteId = null;
    hideAddError();
    renderManageList();
    showScreen("manage");
  }

  function renderManageList() {
    document.querySelectorAll(".tab").forEach(function (tab) {
      var active = tab.getAttribute("data-tab") === manageTab;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });

    var list = $("sentence-list");
    list.innerHTML = "";
    getPool(manageTab).forEach(function (s) {
      var li = document.createElement("li");

      var tag = document.createElement("span");
      tag.className = s.custom ? "tag tag-custom" : "tag";
      tag.textContent = s.custom ? "추가" : "기본";
      li.appendChild(tag);

      var text = document.createElement("div");
      text.className = "sentence-text";
      text.appendChild(makeP("ko", s.ko));
      text.appendChild(makeP("en", s.en));
      li.appendChild(text);

      if (s.custom) {
        var del = document.createElement("button");
        del.type = "button";
        var confirming = pendingDeleteId === s.id;
        del.className = "btn btn-small btn-danger" + (confirming ? " confirming" : "");
        del.textContent = confirming ? "정말 삭제?" : "삭제";
        del.addEventListener("click", function () {
          onDeleteClick(s.id);
        });
        li.appendChild(del);
      }

      list.appendChild(li);
    });
  }

  function onDeleteClick(id) {
    if (pendingDeleteId === id) {
      customSentences = customSentences.filter(function (s) { return s.id !== id; });
      saveCustomSentences();
      pendingDeleteId = null;
    } else {
      pendingDeleteId = id;
    }
    renderManageList();
  }

  function showAddError(message) {
    var el = $("add-error");
    el.textContent = message;
    el.hidden = false;
  }

  function hideAddError() {
    $("add-error").hidden = true;
  }

  function onAddSubmit(e) {
    e.preventDefault();
    var part = $("add-part").value;
    var ko = $("add-ko").value.trim();
    var en = $("add-en").value.trim();

    if (!ko || !en) {
      showAddError("한글 문장과 영어 문장을 모두 입력하세요.");
      return;
    }

    customSentences.push({
      id: "custom-" + Date.now(),
      part: part,
      ko: ko,
      en: en,
      custom: true
    });
    saveCustomSentences();

    $("add-ko").value = "";
    $("add-en").value = "";
    hideAddError();
    pendingDeleteId = null;
    manageTab = part;
    renderManageList();
  }

  // ── 화면 5: 실전 문제 ──
  function startPractice(kind) {
    practice.kind = kind;
    practice.queue = shuffle(kind === "picture" ? PICTURE_PROBLEMS : QUESTION_PROBLEMS);
    practice.index = 0;
    practice.step = 0;
    showScreen("practice");
    renderPractice();
  }

  function currentPracticeItem() {
    var problem = practice.queue[practice.index];
    if (practice.kind === "picture") {
      return { question: PICTURE_PROMPT, answer: problem.answer };
    }
    return problem.questions[practice.step];
  }

  // 질문에 답하기 세트 안에 다음 질문이 남아 있는지
  function hasNextQuestionInSet() {
    return practice.kind === "question" &&
      practice.step < practice.queue[practice.index].questions.length - 1;
  }

  function isLastPracticeStep() {
    return !hasNextQuestionInSet() && practice.index === practice.queue.length - 1;
  }

  function renderPractice() {
    var problem = practice.queue[practice.index];
    var isPicture = practice.kind === "picture";
    practice.phase = "typing";

    $("practice-part").textContent = PART_NAMES[practice.kind] + " (문제)";
    var progress = "문제 " + (practice.index + 1) + " / " + practice.queue.length;
    if (!isPicture) progress += " · 질문 " + (practice.step + 1) + " / " + problem.questions.length;
    $("practice-progress").textContent = progress;

    var image = $("practice-image");
    image.hidden = !isPicture;
    if (isPicture) {
      image.src = problem.image;
      image.alt = problem.alt;
    }
    $("practice-intro").hidden = isPicture;
    if (!isPicture) $("practice-intro").textContent = problem.intro;

    $("practice-question").textContent = currentPracticeItem().question;

    var input = $("practice-input");
    input.value = "";
    input.disabled = false;
    $("practice-typing-actions").hidden = false;
    $("practice-reveal-area").hidden = true;
    input.focus();
  }

  function revealPractice() {
    if (practice.phase !== "typing") return;
    var input = $("practice-input");

    practice.phase = "revealed";
    input.disabled = true;
    logStudy();
    showMyAnswer($("practice-my-answer"), input.value.trim());
    $("practice-model-answer").textContent = currentPracticeItem().answer;

    var nextLabel = "다음 문제 (Enter)";
    if (isLastPracticeStep()) nextLabel = "처음으로 (Enter)";
    else if (hasNextQuestionInSet()) nextLabel = "다음 질문 (Enter)";
    $("btn-practice-next").textContent = nextLabel;

    $("practice-typing-actions").hidden = true;
    $("practice-reveal-area").hidden = false;
    blurActive();
  }

  function nextPractice() {
    if (practice.phase !== "revealed") return;
    if (isLastPracticeStep()) {
      goHome();
      return;
    }
    if (hasNextQuestionInSet()) {
      practice.step++;
    } else {
      practice.index++;
      practice.step = 0;
    }
    renderPractice();
  }

  // ── 이벤트 연결 ──
  // 화면 1
  document.querySelectorAll(".part-card[data-part]").forEach(function (card) {
    card.addEventListener("click", function () {
      startNewRound(card.getAttribute("data-part"));
    });
  });
  document.querySelectorAll(".part-card[data-practice]").forEach(function (card) {
    card.addEventListener("click", function () {
      startPractice(card.getAttribute("data-practice"));
    });
  });
  $("btn-manage").addEventListener("click", goManage);

  // 화면 2
  $("btn-reveal").addEventListener("click", reveal);
  $("btn-correct").addEventListener("click", function () { judge(true); });
  $("btn-wrong").addEventListener("click", function () { judge(false); });
  $("btn-quit").addEventListener("click", goHome);

  // 화면 3
  $("btn-retry-wrong").addEventListener("click", retryWrong);
  $("btn-new-same").addEventListener("click", function () { startNewRound(state.part); });
  $("btn-result-home").addEventListener("click", goHome);

  // 화면 4
  $("add-form").addEventListener("submit", onAddSubmit);
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      manageTab = tab.getAttribute("data-tab");
      pendingDeleteId = null;
      renderManageList();
    });
  });
  $("btn-manage-home").addEventListener("click", goHome);

  // 화면 5
  $("btn-practice-reveal").addEventListener("click", revealPractice);
  $("btn-practice-next").addEventListener("click", nextPractice);
  $("btn-practice-quit").addEventListener("click", goHome);

  // ── 키보드 단축키 (모든 화면을 여기서 처리) ──
  // 테스트: 입력창 Enter = 정답 확인, 1 = 맞음, 2 = 틀림
  // 결과: Enter = 틀린 문장 다시 풀기 (없으면 같은 파트 새로 풀기)
  // 실전 문제: 입력창 Enter = 정답 확인 (Shift+Enter는 줄바꿈), 확인 후 Enter = 다음
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.altKey || e.metaKey || e.isComposing) return;
    var isEnter = e.key === "Enter" && !e.shiftKey;

    if (state.screen === "test") {
      if (state.phase === "typing") {
        if (isEnter && e.target === $("answer-input")) {
          e.preventDefault();
          reveal();
        }
      } else if (e.key === "1" || e.key === "2") {
        e.preventDefault();
        judge(e.key === "1");
      }
    } else if (state.screen === "result") {
      if (isEnter) {
        e.preventDefault();
        onResultEnter();
      }
    } else if (state.screen === "practice") {
      if (!isEnter) return;
      if (practice.phase === "typing") {
        if (e.target === $("practice-input")) {
          e.preventDefault();
          revealPractice();
        }
      } else {
        e.preventDefault();
        nextPractice();
      }
    }
  });

  $("goal-select").addEventListener("change", function (e) {
    dailyGoal = Number(e.target.value);
    saveJson(GOAL_KEY, dailyGoal);
    renderStudy();
  });
  $("cal-prev").addEventListener("click", function () {
    calMonth.setMonth(calMonth.getMonth() - 1);
    renderCalendar();
  });
  $("cal-next").addEventListener("click", function () {
    calMonth.setMonth(calMonth.getMonth() + 1);
    renderCalendar();
  });

  goHome();
})();
