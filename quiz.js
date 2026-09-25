// Brewlio quiz — data-driven, one question per screen.
// Asks brew, grinder, machine (espresso only), milk and flavour — 5 questions for
// espresso, 4 for everyone else. Roast preference and skill are no longer asked;
// they're inferred from flavour and setup and fed into the original matching logic.

const SUPABASE_URL = "https://opledkjivawysybvbqxe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_FxH-YkKnC8mZD8R0hSgXEg_mgrR20K_";

let sb = null;
try {
  const ok =
    typeof SUPABASE_URL === "string" && SUPABASE_URL.startsWith("http") && SUPABASE_URL.includes("supabase.co") &&
    typeof SUPABASE_ANON_KEY === "string" && SUPABASE_ANON_KEY.length > 10;
  if (ok && window.supabase?.createClient) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (err) {
  console.warn("Supabase init failed:", err);
}

const sessionId = (() => {
  const key = "brewlio_sid";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2));
    localStorage.setItem(key, id);
  }
  return id;
})();

const nowMs = () => Date.now();
const runIdKey = "brewlio_runId";
const startKey = "brewlio_quizStartMs";
const answersKey = "brewlio_answers";

let runId = sessionStorage.getItem(runIdKey);
if (!runId) {
  runId = crypto.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2));
  sessionStorage.setItem(runIdKey, runId);
}

let quizStartMs = Number(sessionStorage.getItem(startKey));
if (!quizStartMs || Number.isNaN(quizStartMs)) {
  quizStartMs = nowMs();
  sessionStorage.setItem(startKey, String(quizStartMs));
}

async function logFunnelEvent(eventType, data, overrides) {
  data = data || {};
  overrides = overrides || {};
  if (!sb) return;
  try {
    const duration = overrides.duration_ms || Math.max(0, nowMs() - quizStartMs);
    const payload = {
      submission_id: runId,
      session_id: sessionId,
      page: location.pathname,
      quiz_version: "v3.0-redesign",
      duration_ms: duration,
      brew: answers.brew || null,
      grinder: answers.grinder || null,
      machine: answers.brew === 'espresso' ? (answers.machine || null) : null,
      milk: answers.milk || null,
      flavour: answers.flavour || null,
      roast_pref: answers.roast || null,
      skill: answers.skill || null,
      pain: answers.pain || null,
      match_roast: overrides.match_roast || null,
      match_style: overrides.match_style || null,
      match_origins: overrides.match_origins || null,
      answers: overrides.answers || (eventType === 'answer' ? { [data.question || 'unknown']: data.value || null } : null),
      derived: Object.assign({ event_type: eventType }, data)
    };
    const result = await sb.from("quiz_events").insert(payload);
    if (result.error) console.warn("Supabase funnel error:", result.error);
  } catch (err) {
    console.warn("Funnel log failed:", err);
  }
}

/* ---------- Answer icons (inline SVG, same line style as the homepage tiles) ---------- */

const svgIcon = (body) => `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true">${body}</svg>`;

// Ascending bars for tiered answers (grinder, machine): the first `level` of `total` bars are filled.
function tierIcon(level, total) {
  const slot = 18 / total;
  const bars = Array.from({ length: total }, (_, i) => {
    const h = 5 + (i + 1) * (13 / total);
    return `<rect x="${(3 + i * slot).toFixed(1)}" y="${(20 - h).toFixed(1)}" width="${(slot - 1.5).toFixed(1)}" height="${h.toFixed(1)}" fill="${i < level ? 'currentColor' : 'none'}"/>`;
  }).join('');
  return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true">${bars}</svg>`;
}

const CUP = '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16"/>';

const ICONS = {
  espresso: svgIcon('<path d="M4 10h12v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-4z"/><path d="M16 11.5h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5c-.8 1 .8 2 0 3"/><path d="M12 3.5c-.8 1 .8 2 0 3"/>'),
  manual: svgIcon('<path d="M4 5h16l-6 7h-4z"/><path d="M12 12v2"/><path d="M7 21h10l-1.2-7H8.2z"/>'),
  batch: svgIcon('<rect x="4" y="3" width="16" height="5"/><path d="M10 8v2.5h4V8"/><path d="M6.5 13h11l-1.2 8H7.7z"/>'),
  body: svgIcon('<rect x="5" y="8" width="11" height="13"/><path d="M10.5 3v10"/><path d="M7.5 3h6"/><path d="M16 11h2.5v6H16"/>'),
  other: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01" stroke-width="2.6" stroke-linecap="round"/>'),
  black: svgIcon('<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" fill="currentColor"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16"/>'),
  sometimes: svgIcon('<path d="M4 13.5h12v.5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" fill="currentColor" stroke="none"/>' + CUP),
  always: svgIcon(CUP + '<path d="M10 12.2c-.9-.9-2.4-.2-2 .9.4 1 2 2.1 2 2.1s1.6-1.1 2-2.1c.4-1.1-1.1-1.8-2-.9z"/>'),
  fruity: svgIcon('<circle cx="8" cy="16" r="4"/><circle cx="16.5" cy="15.5" r="3.5"/><path d="M8 12c.5-4 2.5-7 6-9"/><path d="M16.5 12c0-3.5-1-6.5-2.5-9"/>'),
  clean: svgIcon('<path d="M5 19C5 10 10 5 19 4c0 9-5 15-14 15z"/><path d="M5 19l8-8"/>'),
  chocolate: svgIcon('<rect x="5" y="3" width="14" height="18"/><path d="M5 9h14"/><path d="M5 15h14"/><path d="M12 3v18"/>'),
  balanced: svgIcon('<path d="M12 4v16"/><path d="M7 20h10"/><path d="M4 7h16"/><path d="M6 7l-3 6h6z"/><path d="M18 7l-3 6h6z"/>'),
  bold: svgIcon('<path d="M12 3c-3.5 5-6 8.5-6 11.5a6 6 0 0 0 12 0C18 11.5 15.5 8 12 3z" fill="currentColor"/>'),
  notSure: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7"/><path d="M12 17h.01" stroke-width="2.6" stroke-linecap="round"/>')
};

/* ---------- Question data (values match the live scoring exactly) ---------- */

const QUESTIONS = [
  {
    id: 'brew',
    legend: 'How do you mostly brew your coffee?',
    help: 'Pick the one you do most often.',
    options: [
      { value: 'espresso', title: 'Espresso machine', sub: 'Breville, Gaggia and similar', icon: ICONS.espresso },
      { value: 'manual', title: 'Manual filter', sub: 'V60, AeroPress, pour-over', icon: ICONS.manual },
      { value: 'batch', title: 'Batch filter', sub: 'Moccamaster-style brewers', icon: ICONS.batch },
      { value: 'body', title: 'Immersion or stovetop', sub: 'French press, moka pot', icon: ICONS.body },
      { value: 'other', title: 'Other or instant', sub: 'No judgement here', icon: ICONS.other }
    ]
  },
  {
    id: 'grinder',
    legend: 'What are you grinding with?',
    help: (a) => a.brew === 'espresso'
      ? 'Hand grinders count — great for filter; espresso is a workout.'
      : 'Hand grinders count — coarser brews are their happy place.',
    options: [
      { value: 'pre-ground', title: 'Pre-ground', sub: 'Or no grinder at all', icon: tierIcon(1, 5) },
      { value: 'blade', title: 'Blade grinder', sub: 'Inconsistent, but common', icon: tierIcon(2, 5) },
      { value: 'burr-entry', title: 'Entry-level burr', sub: 'Smart Grinder Pro, Encore', icon: tierIcon(3, 5) },
      { value: 'burr-good', title: 'Good burr grinder', sub: 'DF64, Niche and similar', icon: tierIcon(4, 5) },
      { value: 'pro', title: 'High-end or commercial', sub: '078s, EK43', icon: tierIcon(5, 5) }
    ]
  },
  {
    id: 'machine',
    conditional: 'espresso',
    legend: 'Which espresso machine is closest to yours?',
    help: 'Steadier machines are more forgiving with lighter roasts.',
    skipValue: 'not-sure',
    options: [
      { value: 'entry', title: 'Entry-level', sub: 'Bambino, basic single boiler', icon: tierIcon(1, 4) },
      { value: 'capable', title: 'Capable', sub: 'Gaggia, Silvia', icon: tierIcon(2, 4) },
      { value: 'advanced', title: 'Advanced', sub: 'Dual boiler or HX', icon: tierIcon(3, 4) },
      { value: 'elite', title: 'Prosumer or high-end', sub: 'Linea Mini, E61', icon: tierIcon(4, 4) },
      { value: 'not-sure', title: 'Not sure', sub: 'Totally fine', icon: ICONS.notSure }
    ]
  },
  {
    id: 'milk',
    legend: 'How do you take your coffee?',
    help: "Milk softens acidity and adds sweetness, so it shifts what we'd suggest.",
    options: [
      { value: 'black', title: 'Always black', sub: 'No milk', icon: ICONS.black },
      { value: 'sometimes', title: 'Sometimes with milk', sub: 'Depends on the mood', icon: ICONS.sometimes },
      { value: 'always', title: 'Always with milk', sub: 'Flat white energy', icon: ICONS.always }
    ]
  },
  {
    id: 'flavour',
    legend: 'What flavours do you enjoy most?',
    help: "This one matters most. Pick what you'd happily order again.",
    options: [
      { value: 'fruity', title: 'Juicy fruit', sub: 'Berries, citrus, bright cups', icon: ICONS.fruity },
      { value: 'clean', title: 'Clean & tea-like', sub: 'Light, delicate, crisp', icon: ICONS.clean },
      { value: 'chocolate', title: 'Chocolatey & nutty', sub: 'Caramel, cocoa, comfort', icon: ICONS.chocolate },
      { value: 'balanced', title: 'Balanced', sub: 'Nothing too loud', icon: ICONS.balanced },
      { value: 'bold', title: 'Rich & heavy', sub: 'Big body, low acidity', icon: ICONS.bold }
    ]
  }
];

function labelForGrinder(v) {
  const map = { 'pre-ground': 'Pre-ground', 'blade': 'Blade grinder', 'burr-entry': 'Entry burr', 'burr-good': 'Good burr', 'pro': 'High-end / commercial' };
  return map[v] || (v ? v.replace(/-/g, ' ') : '—');
}
function labelForBrew(v) {
  const map = { espresso: 'Espresso', manual: 'Manual filter', batch: 'Batch filter', body: 'Immersion / stovetop', other: 'Other / instant' };
  return map[v] || (v || '—');
}
function labelForMachine(v) {
  const map = { entry: 'Entry-level', capable: 'Capable', advanced: 'Advanced', elite: 'Prosumer / high-end', 'not-sure': 'Not sure' };
  return map[v] || '—';
}
function labelForMilk(v) {
  const map = { black: 'Black', sometimes: 'Sometimes milk', always: 'Milk' };
  return map[v] || '—';
}
function labelForMilkSpec(v) {
  const map = { black: 'Black', sometimes: 'Sometimes', always: 'Always' };
  return map[v] || '—';
}
function labelForFlavour(v) {
  const map = { fruity: 'Juicy fruit', clean: 'Clean & tea-like', chocolate: 'Chocolatey & nutty', balanced: 'Balanced', bold: 'Rich & heavy' };
  return map[v] || '—';
}

/* ---------- State ---------- */

function readStoredAnswers() {
  try {
    const raw = sessionStorage.getItem(answersKey);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

let answers = readStoredAnswers();

function persistAnswers() {
  sessionStorage.setItem(answersKey, JSON.stringify(answers));
}

const VALID_BREW_VALUES = QUESTIONS[0].options.map(o => o.value);
const params = new URLSearchParams(location.search);
const brewParam = params.get('brew');
if (brewParam && VALID_BREW_VALUES.includes(brewParam)) {
  answers = { brew: brewParam };
  persistAnswers();
  history.replaceState(null, '', location.pathname);
}

let activeQuestions = [];
let currentIndex = 0;
let hasRenderedOnce = false;

function rebuildActiveQuestions() {
  activeQuestions = QUESTIONS.filter(q => !q.conditional || q.conditional === answers.brew);
}

function firstUnansweredIndex() {
  for (let i = 0; i < activeQuestions.length; i++) {
    if (!answers[activeQuestions[i].id]) return i;
  }
  return activeQuestions.length - 1;
}

/* ---------- DOM refs ---------- */

const quizHeader = document.getElementById('quizHeader');
const resultHeader = document.getElementById('resultHeader');
const quizView = document.getElementById('quizView');
const resultView = document.getElementById('resultView');

const backBtn = document.getElementById('backBtn');
const prevLink = document.getElementById('prevLink');
const quizCount = document.getElementById('quizCount');
const quizProgress = document.getElementById('quizProgress');
const quizChips = document.getElementById('quizChips');
const quizTitle = document.getElementById('quizTitle');
const quizHelp = document.getElementById('quizHelp');
const quizOptions = document.getElementById('quizOptions');
const skipBtn = document.getElementById('skipBtn');
const quizEl = document.querySelector('.quiz');
const quizNum = document.getElementById('quizNum');
const quizNudge = document.getElementById('quizNudge');
const buildStatus = document.getElementById('buildStatus');
const buildSetup = document.getElementById('buildSetup');
const buildMilk = document.getElementById('buildMilk');
const buildTaste = document.getElementById('buildTaste');

/* ---------- Rendering the active question ---------- */

function renderProgress() {
  const total = activeQuestions.length;
  quizProgress.style.setProperty('--steps', total);
  quizProgress.setAttribute('aria-label', `Question ${currentIndex + 1} of ${total}`);
  // Keep the segments between renders so the fill can animate.
  if (quizProgress.children.length !== total) {
    quizProgress.innerHTML = '<li class="progress__seg"></li>'.repeat(total);
  }
  Array.from(quizProgress.children).forEach((seg, i) => seg.classList.toggle('is-done', i <= currentIndex));
}

function nudgeFor(idx, total) {
  if (total > 2 && idx === total - 1) return 'LAST ONE. YOUR STYLE IS NEXT.';
  if (idx === Math.floor(total / 2)) return "HALFWAY. YOUR STYLE'S TAKING SHAPE.";
  return '';
}

function setBuildValue(el, value) {
  const next = value || '—';
  if (el.textContent === next) return;
  el.textContent = next;
  el.classList.toggle('is-empty', !value);
  const row = el.parentElement;
  row.classList.remove('is-new');
  if (value) {
    void row.offsetWidth; // restart the highlight animation
    row.classList.add('is-new');
  }
}

// The "your style so far" card beside the question; fills in as answers come in.
function renderBuild() {
  const setup = [
    answers.brew && labelForBrew(answers.brew),
    answers.grinder && labelForGrinder(answers.grinder),
    answers.brew === 'espresso' && answers.machine && answers.machine !== 'not-sure' && `${labelForMachine(answers.machine)} machine`
  ].filter(Boolean).join(' · ');
  setBuildValue(buildSetup, setup);
  setBuildValue(buildMilk, answers.milk ? labelForMilkSpec(answers.milk) : '');
  setBuildValue(buildTaste, answers.flavour ? labelForFlavour(answers.flavour) : '');
  const answered = activeQuestions.filter(q => answers[q.id]).length;
  buildStatus.textContent = `${answered} / ${activeQuestions.length}`;
}

function playEnter() {
  quizEl.classList.remove('is-entering');
  void quizEl.offsetWidth; // restart the enter animation
  quizEl.classList.add('is-entering');
}

function renderChips() {
  const chips = [];
  for (let i = 0; i < currentIndex; i++) {
    const q = activeQuestions[i];
    const value = answers[q.id];
    if (!value) continue;
    let label = value;
    if (q.id === 'brew') label = labelForBrew(value);
    else if (q.id === 'grinder') label = labelForGrinder(value);
    else if (q.id === 'machine') label = labelForMachine(value);
    else if (q.id === 'milk') label = labelForMilk(value);
    else if (q.id === 'flavour') label = labelForFlavour(value);
    chips.push(`<p class="chip mono"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>${label.toUpperCase()}</p>`);
  }
  quizChips.innerHTML = chips.join('');
}

function renderOptions(q) {
  quizOptions.setAttribute('role', 'radiogroup');
  quizOptions.innerHTML = q.options.map((opt, i) => {
    const checked = answers[q.id] === opt.value;
    return `<label class="option">
      <input type="radio" name="${q.id}" value="${opt.value}"${checked ? ' checked' : ''}>
      <span class="option__icon" aria-hidden="true">${opt.icon || ''}</span>
      <span class="option__text"><span class="option__title">${opt.title}</span><span class="option__sub">${opt.sub}</span></span>
      <span class="option__box" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
    </label>`;
  }).join('');
}

function render(idx, opts) {
  opts = opts || {};
  currentIndex = idx;
  const q = activeQuestions[idx];

  quizCount.textContent = `Q.${String(idx + 1).padStart(2, '0')} / ${String(activeQuestions.length).padStart(2, '0')}`;
  quizNum.textContent = String(idx + 1).padStart(2, '0');
  renderProgress();
  renderChips();
  renderBuild();

  const showPrev = idx > 0;
  prevLink.style.display = showPrev ? '' : 'none';

  const nudge = nudgeFor(idx, activeQuestions.length);
  quizNudge.textContent = nudge;
  quizNudge.hidden = !nudge;

  quizTitle.textContent = q.legend;
  const helpText = typeof q.help === 'function' ? q.help(answers) : q.help;
  quizHelp.textContent = helpText || '';
  quizHelp.hidden = !helpText;
  renderOptions(q);
  playEnter();

  if (hasRenderedOnce && !opts.skipFocus) {
    quizTitle.focus({ preventScroll: false });
  }
  hasRenderedOnce = true;

  logFunnelEvent('view_question', { question_index: idx, total_questions: activeQuestions.length });
}

/* ---------- Navigation ---------- */

let advanceTimer = null;

function scheduleAdvance() {
  if (advanceTimer) clearTimeout(advanceTimer);
  advanceTimer = setTimeout(() => {
    advanceTimer = null;
    goNext();
  }, 260);
}

function goNext() {
  logFunnelEvent('nav_next', { from_index: currentIndex, to_index: currentIndex + 1, total_questions: activeQuestions.length });
  if (currentIndex >= activeQuestions.length - 1) {
    finishQuiz();
  } else {
    render(currentIndex + 1);
  }
}

function goPrev() {
  if (currentIndex <= 0) {
    window.location.href = 'index.html';
    return;
  }
  logFunnelEvent('nav_prev', { from_index: currentIndex, to_index: currentIndex - 1, total_questions: activeQuestions.length });
  render(currentIndex - 1);
}

backBtn.addEventListener('click', (e) => {
  if (currentIndex > 0) {
    e.preventDefault();
    goPrev();
  }
});
prevLink.addEventListener('click', (e) => {
  e.preventDefault();
  goPrev();
});

quizOptions.addEventListener('change', (e) => {
  if (!e.target.matches('input[type="radio"]')) return;
  const q = activeQuestions[currentIndex];
  answers[q.id] = e.target.value;
  persistAnswers();
  logFunnelEvent('answer', { question: q.id, value: e.target.value, question_index: currentIndex, total_questions: activeQuestions.length });
  if (q.id === 'brew') rebuildActiveQuestions();
  renderBuild();
});

quizOptions.addEventListener('click', (e) => {
  // Only advance on an actual activation (mouse click, tap, Enter/Space) — not on
  // arrow-key navigation between radios, which changes selection without a click event.
  if (e.target && e.target.matches && e.target.matches('input[type="radio"]')) {
    scheduleAdvance();
  }
});

skipBtn.addEventListener('click', () => {
  const q = activeQuestions[currentIndex];
  if (q.skipValue) {
    answers[q.id] = q.skipValue;
    persistAnswers();
  }
  goNext();
});

/* ---------- Matching logic (carried over from the previous quiz.js) ---------- */

function getOriginDetails(roast, flavour, brew, milk) {
  const originData = {
    light: {
      ethiopia: { name: 'Ethiopia', reason: 'naturally high acidity and floral notes shine in lighter roasts' },
      kenya: { name: 'Kenya', reason: 'bright berry notes and wine-like clarity when roasted light' },
      costarica: { name: 'Costa Rica', reason: 'clean processing methods preserve delicate fruit notes' },
      rwanda: { name: 'Rwanda', reason: 'sweet citrus and tea-like qualities at lighter roasts' }
    },
    mediumSweet: {
      brazil: { name: 'Brazil', reason: 'naturally low acidity with chocolate and nut sweetness' },
      colombia: { name: 'Colombia', reason: 'balanced body with caramel and mild fruit notes' },
      guatemala: { name: 'Guatemala', reason: 'cocoa and stone fruit balance, good black or with milk' },
      elsalvador: { name: 'El Salvador', reason: 'honey-like sweetness with good body' }
    },
    mediumClean: {
      colombia: { name: 'Colombia', reason: 'clean processing creates bright, balanced cups' },
      costarica: { name: 'Costa Rica', reason: 'clarity and sweetness without sharp acidity' },
      kenya: { name: 'Kenya', reason: 'fruit-forward but sweet when medium roasted' },
      guatemala: { name: 'Guatemala', reason: 'structured sweetness with floral notes' }
    },
    mediumDark: {
      brazil: { name: 'Brazil', reason: 'chocolatey body stands up to darker roasting' },
      colombia: { name: 'Colombia', reason: 'retains sweetness even when pushed darker' },
      guatemala: { name: 'Guatemala', reason: 'caramel and dark chocolate notes develop well' },
      sumatra: { name: 'Sumatra', reason: 'earthy, syrupy body with very low acidity' }
    },
    // Fruit lovers whose setup needs a darker roast: origins whose fruit survives it.
    fruitDeep: {
      ethiopia: { name: 'Ethiopia', reason: 'natural-process Ethiopians keep a jammy berry sweetness at a deeper roast' },
      colombia: { name: 'Colombia', reason: 'red fruit and caramel that hold up well to a deeper roast' },
      guatemala: { name: 'Guatemala', reason: 'stone fruit and cocoa that come together at a deeper roast' },
      elsalvador: { name: 'El Salvador', reason: 'honeyed red fruit that stays sweet at a deeper roast' }
    },
    dark: {
      brazil: { name: 'Brazil', reason: 'low acidity handles bold roasting without bitterness' },
      sumatra: { name: 'Sumatra', reason: 'heavy body and earthy notes thrive in dark roasts' },
      india: { name: 'India', reason: 'spice notes and full body hold up to roasting' }
    }
  };

  let category = 'mediumSweet';
  if (roast === 'light') category = 'light';
  else if (roast === 'medium-dark') category = (flavour === 'fruity') ? 'fruitDeep' : 'mediumDark';
  else if (roast === 'dark') category = 'dark';
  else if (roast === 'medium') category = (flavour === 'chocolate' || flavour === 'bold') ? 'mediumSweet' : 'mediumClean';

  if (brew === 'espresso' && milk === 'always' && roast !== 'dark') category = 'mediumSweet';

  const pool = originData[category];
  const keys = Object.keys(pool);
  const shuffled = keys.sort(() => 0.5 - Math.random());
  const origin1 = pool[shuffled[0]];
  const origin2 = pool[shuffled[1]] || origin1;
  return { origin1, origin2 };
}

function resultStyleLine(roast, flavour, brew, milk) {
  const isMilk = (milk === 'always');
  const isFilter = (brew === 'manual' || brew === 'batch');

  if (roast === 'light') {
    if (flavour === 'chocolate' || flavour === 'bold') return 'Lighter roasts with retained sweetness, not sour-for-fun.';
    if (isMilk) return 'Light roasts with enough body and sweetness to work with milk.';
    return 'Bright, clean cups with clarity and delicate fruit notes.';
  }
  if (roast === 'medium') {
    if (flavour === 'fruity') return 'Sweet, fruit-forward cups without sharp acidity.';
    if (flavour === 'clean') return 'Clean sweetness with clarity, balanced and approachable.';
    if (flavour === 'bold') return 'Fuller-bodied sweetness with comfort flavours.';
    if (isMilk) return 'Sweet, milk-friendly profiles with caramel and chocolate.';
    return "Balanced sweetness that's easy to extract consistently.";
  }
  if (roast === 'medium-dark') {
    if (isFilter) return 'Syrupy sweetness and body without harsh roast bitterness.';
    if (isMilk) return 'Rich, milk-friendly profiles with chocolate and caramel depth.';
    return 'Fuller body with sweet, comforting flavours.';
  }
  if (flavour === 'fruity' || flavour === 'clean') return 'Bold roast flavours with low acidity, no fruit notes.';
  return 'Heavy body, roasty comfort flavours, very low acidity.';
}

function grinderFitText(grinder, roastLabel) {
  if (grinder === 'pre-ground' || grinder === 'blade') return `${roastLabel} roasts are the most forgiving choice for pre-ground or blade grinding.`;
  if (grinder === 'burr-entry') return `${roastLabel} roasts are easy to dial in on an entry-level burr.`;
  if (grinder === 'burr-good') return `Your grinder is capable enough to bring out what's good in a ${roastLabel.toLowerCase()} roast.`;
  return 'A high-end grinder means you can push into more delicate roasts without a fight.';
}

function milkFitText(milk) {
  if (milk === 'always') return 'This style holds its flavour well once milk is added.';
  if (milk === 'sometimes') return "Works black or with milk, so it won't let you down either way.";
  return 'Built to taste good on its own, no milk required.';
}

function tasteFitText(flavour, adjusted) {
  if (adjusted) {
    return `You picked ${labelForFlavour(flavour).toLowerCase()}. We've adjusted it to suit your setup (see trade-offs below).`;
  }
  const map = {
    fruity: 'You picked juicy fruit. This style leans right into it.',
    clean: 'You picked clean and tea-like. This style keeps things light and clear.',
    chocolate: 'You picked chocolatey and nutty. This style leans right into it.',
    balanced: 'You picked balanced. This style keeps things easy-going, nothing too loud.',
    bold: 'You picked rich and heavy. This style brings the body to match.'
  };
  return map[flavour] || map.balanced;
}

function styleDisplayName(styleLabel) {
  const swapped = styleLabel.replace(/ \/ /g, ' & ');
  return swapped.charAt(0).toUpperCase() + swapped.slice(1);
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Roast preference is no longer asked: flavour stands in for it. A skipped flavour
// behaves like the old "Not sure" roast answer.
const ROAST_FROM_FLAVOUR = { fruity: 'light', clean: 'light', balanced: 'medium', chocolate: 'medium', bold: 'medium-dark' };

// Skill is no longer asked: the grinder (and, for espresso, the machine) stands in for it.
function inferSkill(grinder, machine) {
  const map = { 'pre-ground': 'beginner', blade: 'beginner', 'burr-entry': 'basic', 'burr-good': 'intermediate', pro: 'advanced' };
  const skill = map[grinder] || 'basic';
  if (skill === 'intermediate' && (machine === 'advanced' || machine === 'elite')) return 'advanced';
  return skill;
}

function buildResult() {
  const a = answers;
  const brew = a.brew || 'other';
  const grinder = a.grinder || 'pre-ground';
  const machine = a.machine || 'not-sure';
  const milk = a.milk;
  const flavour = a.flavour;
  const skill = inferSkill(grinder, brew === 'espresso' ? machine : null);
  const roastPref = ROAST_FROM_FLAVOUR[flavour] || 'any';

  const roastPrefAny = (roastPref === 'any');
  const requestedRoast = roastPrefAny ? null : roastPref;
  let roast = requestedRoast || 'medium';

  const hasWeakGrinder = ['pre-ground', 'blade', 'burr-entry'].includes(grinder);
  const hasGoodGrinder = (grinder === 'burr-good' || grinder === 'pro');
  const hasAdvancedSkill = (skill === 'advanced' || skill === 'nerd');

  // Where the taste they want and the setup they have pull in different directions.
  // Roast conflicts each name the roast their setup can handle; the darkest of those wins.
  const conflicts = findConflicts({ brew, grinder, machine, milk, flavour, requestedRoast, hasWeakGrinder, hasGoodGrinder, hasAdvancedSkill });
  conflicts.filter(c => c.target).forEach(c => {
    if (ROAST_ORDER.indexOf(c.target) > ROAST_ORDER.indexOf(roast)) roast = c.target;
  });

  if (!requestedRoast || requestedRoast === 'medium') {
    if (milk === 'always' && (flavour === 'bold' || flavour === 'chocolate') && (brew === 'espresso' || brew === 'body') && !hasAdvancedSkill) {
      roast = 'medium-dark';
    }
  }

  if (roastPrefAny) {
    roast = 'medium';
    if (hasGoodGrinder && hasAdvancedSkill && (flavour === 'fruity' || flavour === 'clean')) {
      roast = 'light';
    } else if ((brew === 'espresso' || brew === 'body') && milk === 'always') {
      roast = 'medium-dark';
    }
  }

  const recs = {
    light: { title: 'Light Roast', why: 'More origin character, less roast taste. Bright when extracted well.' },
    medium: { title: 'Medium Roast', why: 'Sweet, forgiving, and works on most setups without drama.' },
    'medium-dark': { title: 'Medium-Dark Roast', why: 'Syrupy body, great with milk, and generally hard to mess up.' },
    dark: { title: 'Dark Roast', why: 'Big roast taste, low acidity, very forgiving (if that is your vibe).' }
  };
  const pick = recs[roast] || recs.medium;

  const originInfo = getOriginDetails(roast, flavour, brew, milk);
  const displayStyle = resultStyleLine(roast, flavour, brew, milk);

  const style = styleFor(flavour, roast);
  conflicts.forEach(c => { if (typeof c.text === 'function') c.text = c.text(ROAST_SHORT[roast].toLowerCase()); });
  const adjusted = conflicts.some(c => c.target);

  return {
    brew, grinder, machine, milk, flavour, skill, roastPref, roast, pick, originInfo, displayStyle,
    styleLabel: style.label, styleNotes: style.notes, conflicts, adjusted
  };
}

const ROAST_ORDER = ['light', 'medium', 'medium-dark', 'dark'];

// The style is named after what their setup can actually brew, not only the flavour
// they picked — a fruit lover moved to a medium-dark gets a jammy style, not "juicy fruit".
function styleFor(flavour, roast) {
  const darker = (roast === 'medium-dark' || roast === 'dark');
  if (flavour === 'fruity') {
    if (roast === 'light') return { label: 'juicy fruit', notes: 'Berries, stone fruit, citrus' };
    if (darker) return { label: 'jammy & rich', notes: 'Berry jam, dark cherry, cocoa' };
    return { label: 'sweet & fruity', notes: 'Red apple, stone fruit, caramel' };
  }
  if (flavour === 'clean') {
    if (roast === 'light') return { label: 'clean & tea-like', notes: 'Florals, citrus, black tea' };
    if (darker) return { label: 'smooth & sweet', notes: 'Caramel, cocoa, toasted nuts' };
    return { label: 'clean & sweet', notes: 'Honey, citrus, milk chocolate' };
  }
  if (flavour === 'chocolate') return { label: 'choc, nut & caramel', notes: 'Milk chocolate, hazelnut, caramel' };
  if (flavour === 'bold') return { label: 'rich & heavy', notes: 'Dark chocolate, molasses, spice' };
  return { label: 'balanced & sweet', notes: 'Caramel, cocoa, gentle fruit' };
}

/* ---------- Conflicts: taste vs setup ---------- */
// Each conflict names the two answers that clash (a, b), what we did about it (text),
// and what would unlock the original preference (fix). `target` is set when the
// conflict forces a darker roast; `text` then takes the final roast as an argument.

function findConflicts(s) {
  const out = [];
  const likes = ['YOU LIKE', labelForFlavour(s.flavour)];
  const grinderPair = ['YOUR GRINDER', labelForGrinder(s.grinder)];
  const espresso = s.brew === 'espresso';

  if (s.requestedRoast === 'light') {
    if (s.hasWeakGrinder) {
      const why = {
        'pre-ground': "Pre-ground can't be dialled in",
        blade: 'Blade grinders are too uneven',
        'burr-entry': "Entry burrs aren't even enough"
      }[s.grinder];
      out.push({
        id: 'light-weak-grinder', target: 'medium-dark', a: likes, b: grinderPair,
        title: 'Light roasts need a better grinder',
        text: (r) => `${why}, so we've gone ${r}${s.flavour === 'fruity' ? ' with a fruity natural' : ''}.`,
        fix: 'A good burr grinder (DF64, Niche).'
      });
    }
    if (s.milk === 'always' && !(s.hasGoodGrinder && s.hasAdvancedSkill)) {
      out.push({
        id: 'light-milk', target: 'medium-dark', a: likes, b: ['YOU DRINK', 'Always with milk'],
        title: 'Milk drowns delicate coffee',
        text: (r) => `We've gone ${r} so it cuts through.`,
        fix: 'Keep a lighter bag for black cups.'
      });
    }
    if (espresso && (s.machine === 'entry' || s.machine === 'not-sure') && !s.hasAdvancedSkill) {
      const unsure = s.machine === 'not-sure';
      out.push({
        id: 'light-entry-machine', target: 'medium',
        a: likes, b: ['YOUR MACHINE', unsure ? 'Not sure' : labelForMachine(s.machine)],
        title: 'Light espresso needs a steadier machine',
        text: (r) => `${unsure ? 'Many home' : 'Entry'} machines can't hold temperature, so we've gone ${r}.`,
        fix: unsure ? 'Got PID temperature control? Try lighter.' : 'A machine with PID temperature control.'
      });
    }
  }

  // Setup conflicts: these don't change the roast, but they limit any coffee.
  if (espresso && s.grinder === 'pre-ground') {
    out.push({
      id: 'espresso-pre-ground', a: ['YOU BREW', 'Espresso'], b: grinderPair,
      title: 'Pre-ground struggles as espresso',
      text: 'It goes stale fast. Buy small bags ground for espresso.',
      fix: 'A burr grinder that grinds for espresso.'
    });
  }
  if (espresso && s.grinder === 'blade') {
    out.push({
      id: 'espresso-blade', a: ['YOU BREW', 'Espresso'], b: grinderPair,
      title: "Blade grinders can't do espresso",
      text: 'Buy it ground for espresso until you upgrade.',
      fix: 'An entry burr that grinds for espresso.'
    });
  }
  const grinderAlreadyFlagged = out.some(c => c.b === grinderPair);
  if (espresso && (s.machine === 'advanced' || s.machine === 'elite') && s.hasWeakGrinder && !grinderAlreadyFlagged) {
    out.push({
      id: 'machine-outruns-grinder', a: ['YOUR MACHINE', labelForMachine(s.machine)], b: grinderPair,
      title: 'Your grinder is holding your machine back',
      text: 'Your shots are only as good as your grind.',
      fix: 'Upgrade the grinder next, not the machine.'
    });
  }
  if (s.flavour === 'clean' && s.brew === 'body') {
    out.push({
      id: 'clean-immersion', a: likes, b: ['YOU BREW', labelForBrew(s.brew)],
      title: 'Plungers and moka pots add body',
      text: 'Expect a heavier cup than filter.',
      fix: 'A paper filter: pour-over or AeroPress.'
    });
  }
  return out;
}

/* ---------- Result view ---------- */

let lastResult = null;

const styleTitle = document.getElementById('styleTitle');
const styleDesc = document.getElementById('styleDesc');
const specSetup = document.getElementById('specSetup');
const specMilk = document.getElementById('specMilk');
const specTaste = document.getElementById('specTaste');
const fitsList = document.getElementById('fitsList');
const shareBtn = document.getElementById('shareBtn');
const shareStatus = document.getElementById('shareStatus');
const notifyForm = document.getElementById('notifyForm');
const notifyStatus = document.getElementById('notifyStatus');
const notifyStyleField = document.getElementById('notifyStyleField');
const retakeLink = document.getElementById('retakeLink');

const FITS_ICONS = [
  '<svg class="fits__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true"><path d="M8 3h8l-1 5H9z"/><rect x="6" y="8" width="12" height="13"/><path d="M12 12v4"/></svg>',
  '<svg class="fits__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true"><path d="M9 3h6v3l2 4v11H7V10l2-4z"/><path d="M7 13h10"/></svg>',
  '<svg class="fits__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true"><ellipse cx="12" cy="12" rx="6" ry="9" transform="rotate(35 12 12)"/><path d="M8.5 17.5c3.5-3 3.5-8 7-11"/></svg>'
];

/* ---------- Trade-offs (conflicts between taste and setup) ---------- */

const conflictsSection = document.getElementById('conflictsSection');
const conflictsList = document.getElementById('conflictsList');
const styleAdjusted = document.getElementById('styleAdjusted');

function renderConflicts(conflicts) {
  conflictsSection.hidden = conflicts.length === 0;
  conflictsList.innerHTML = conflicts.map(c => `
    <li class="conflict">
      <p class="conflict__vs mono">
        <span class="conflict__side">${c.a[0]}<b>${c.a[1]}</b></span>
        <span class="conflict__x" aria-hidden="true">≠</span>
        <span class="conflict__side">${c.b[0]}<b>${c.b[1]}</b></span>
      </p>
      <div class="conflict__body">
        <h3 class="conflict__title">${c.title}</h3>
        <p class="conflict__text">${c.text}</p>
      </div>
      <p class="conflict__fix"><span class="mono">TO UNLOCK IT</span>${c.fix}</p>
    </li>`).join('');
}

/* ---------- Your matches (generic picks until roaster partners are live) ---------- */

const matchesList = document.getElementById('matchesList');
const notifyInput = document.getElementById('notify-email');

const ROAST_SHORT = { light: 'Light', medium: 'Medium', 'medium-dark': 'Medium-dark', dark: 'Dark' };
const PROCESS_FOR_FLAVOUR = { fruity: 'Natural', clean: 'Washed', chocolate: 'Natural', balanced: 'Washed', bold: 'Natural' };
// Keyed by the origin names in getOriginDetails().
const ORIGIN_NOTES = {
  'Ethiopia': 'Jasmine, lemon, blueberry',
  'Kenya': 'Blackcurrant, grapefruit, cane sugar',
  'Costa Rica': 'Honey, citrus, red apple',
  'Rwanda': 'Black tea, orange, cane sugar',
  'Brazil': 'Hazelnut, cocoa, brown sugar',
  'Colombia': 'Caramel, orange, cocoa',
  'Guatemala': 'Cocoa, stone fruit, toffee',
  'El Salvador': 'Honey, milk chocolate, almond',
  'Sumatra': 'Cedar, dark chocolate, earthy spice',
  'India': 'Dark cocoa, spice, malt'
};
// Bright origins taste different at a deeper roast.
const ORIGIN_NOTES_DEEP = { 'Ethiopia': 'Blueberry jam, dark chocolate, spice' };

function originNotes(name, roast) {
  const deep = (roast === 'medium-dark' || roast === 'dark') && ORIGIN_NOTES_DEEP[name];
  return deep || ORIGIN_NOTES[name] || '';
}

function houseFormat(brew, milk) {
  if (brew === 'espresso') {
    return milk === 'black'
      ? { title: 'Single-origin espresso', type: 'Single origin' }
      : { title: 'Seasonal espresso blend', type: 'Blend' };
  }
  if (brew === 'manual' || brew === 'batch') return { title: 'Seasonal filter roast', type: 'Single origin' };
  return { title: 'Everyday house blend', type: 'Blend' };
}

function grinderPhrase(grinder) {
  const map = {
    'pre-ground': 'Forgiving as pre-ground',
    blade: 'Forgiving on a blade grinder',
    'burr-entry': 'Forgiving on an entry burr',
    'burr-good': 'Rewards a good burr grinder',
    pro: 'Made for a high-end grinder'
  };
  return map[grinder] || 'Forgiving to brew';
}

function milkPhrase(milk) {
  const map = { always: 'sweet in milk', sometimes: 'good black or white', black: 'shines without milk' };
  return map[milk] || 'easy to enjoy';
}

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// No grinder, or a blade grinder for espresso: better to buy it ground to suit the brewer.
function buyAsFor(brew, grinder) {
  if (grinder !== 'pre-ground' && !(brew === 'espresso' && grinder === 'blade')) return 'Whole bean';
  if (brew === 'espresso') return 'Espresso grind';
  if (brew === 'manual' || brew === 'batch') return 'Filter grind';
  return 'Pre-ground';
}

function buildMatches(result) {
  const roast = ROAST_SHORT[result.roast] || 'Medium';
  const buyAs = buyAsFor(result.brew, result.grinder);
  const process = PROCESS_FOR_FLAVOUR[result.flavour] || 'Washed';
  const altProcess = process === 'Natural' ? 'Washed' : 'Natural';
  const house = houseFormat(result.brew, result.milk);
  const { origin1, origin2 } = result.originInfo;

  return [
    {
      tag: 'BEST MATCH', best: true,
      title: house.title,
      notes: result.styleNotes,
      spec: [['ROAST', roast], ['TYPE', house.type], ['BUY AS', buyAs]],
      why: `${grinderPhrase(result.grinder)}, and ${milkPhrase(result.milk)}.`,
      cta: "Notify me when it's live"
    },
    {
      tag: 'SINGLE ORIGIN',
      title: `${origin1.name}, ${process.toLowerCase()}`,
      notes: originNotes(origin1.name, result.roast),
      spec: [['ROAST', roast], ['PROCESS', process], ['BUY AS', buyAs]],
      why: `${capitalise(origin1.reason)}.`,
      cta: 'Roaster coming soon'
    },
    {
      tag: 'TRY NEXT',
      title: `${origin2.name}, ${altProcess.toLowerCase()}`,
      notes: originNotes(origin2.name, result.roast),
      spec: [['ROAST', roast], ['PROCESS', altProcess], ['BUY AS', buyAs]],
      why: `${capitalise(origin2.reason)}.`,
      cta: 'Roaster coming soon'
    }
  ];
}

const BAG_ICON = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true"><path d="M7 3h10l1.5 4v14h-13V7z"/><path d="M5.5 7h13"/><rect x="9" y="11" width="6" height="5"/></svg>';
const TICK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const DOWN_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M12 5v14"/><path d="M6 13l6 6 6-6"/></svg>';

function renderMatches(result) {
  matchesList.innerHTML = buildMatches(result).map((m, i) => `
    <article class="match${m.best ? ' match--best' : ''}" aria-labelledby="match-title-${i}">
      <div class="match__top">
        <div class="match__img">${BAG_ICON}</div>
        <div class="match__head">
          <p class="mono match__tag">${m.tag}</p>
          <p class="mono match__source">AUSTRALIAN ROASTER · COMING SOON</p>
          <h3 class="match__title" id="match-title-${i}">${m.title}</h3>
          <p class="match__notes">${m.notes}</p>
        </div>
      </div>
      <dl class="match__spec">${m.spec.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      <p class="match__why">${TICK_ICON}<span>${m.why}</span></p>
      <a class="match__cta" href="#notify" data-match="${i}">${m.cta}${DOWN_ICON}</a>
    </article>`).join('');
}

// Every match button leads to the email form; clicks show which picks people want most.
matchesList.addEventListener('click', (e) => {
  const cta = e.target.closest('.match__cta');
  if (!cta) return;
  e.preventDefault();
  const i = Number(cta.dataset.match);
  logFunnelEvent('match_click', { match_index: i, match_title: matchesList.querySelectorAll('.match__title')[i].textContent });
  notifyInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  notifyInput.focus({ preventScroll: true });
});

function finishQuiz() {
  const result = buildResult();
  lastResult = result;

  const styleSlug = slugify(result.styleLabel);

  styleTitle.textContent = styleDisplayName(result.styleLabel);
  styleDesc.textContent = result.displayStyle;
  styleAdjusted.hidden = !result.adjusted;

  specSetup.textContent = `${labelForBrew(result.brew)} · ${labelForGrinder(result.grinder)}`;
  specMilk.textContent = labelForMilkSpec(result.milk);
  specTaste.textContent = labelForFlavour(result.flavour);

  const fits = [
    { title: 'Your grinder', text: grinderFitText(result.grinder, ROAST_SHORT[result.roast]) },
    { title: 'Your milk', text: milkFitText(result.milk) },
    { title: 'Your taste', text: tasteFitText(result.flavour, result.adjusted) }
  ];
  fitsList.innerHTML = fits.map((f, i) => `<li class="fits__item">${FITS_ICONS[i]}<div><h3 class="fits__title">${f.title}</h3><p class="fits__text">${f.text}</p></div></li>`).join('');

  renderConflicts(result.conflicts);
  renderMatches(result);

  notifyStyleField.value = styleSlug;
  notifyStatus.textContent = 'NO SPAM. UNSUBSCRIBE ANYTIME.';
  shareStatus.textContent = '';

  const shareUrl = `${location.origin}${location.pathname}?style=${styleSlug}`;
  history.replaceState(null, '', `?style=${styleSlug}`);
  shareBtn.dataset.shareUrl = shareUrl;
  shareBtn.dataset.shareText = `I'm a "${styleDisplayName(result.styleLabel)}" coffee drinker — find your style at Brewlio.`;

  quizHeader.hidden = true;
  quizView.hidden = true;
  resultHeader.hidden = false;
  resultView.hidden = false;
  styleTitle.setAttribute('tabindex', '-1');
  styleTitle.focus({ preventScroll: false });

  logFunnelEvent('complete', {
    roast: result.roast,
    styleLabel: result.styleLabel,
    origins: `${result.originInfo.origin1.name}, ${result.originInfo.origin2.name}`,
    brew: result.brew,
    grinder: result.grinder,
    machine: result.brew === 'espresso' ? result.machine : null,
    skill: result.skill,
    roast_pref: result.roastPref,
    inferred: ['roast_pref', 'skill'],
    conflicts: result.conflicts.map(c => c.id)
  }, {
    duration_ms: Math.max(0, nowMs() - quizStartMs),
    match_roast: result.roast,
    match_style: result.styleLabel,
    match_origins: `${result.originInfo.origin1.name}, ${result.originInfo.origin2.name}`,
    answers: {
      brew: result.brew, grinder: result.grinder, machine: result.machine,
      milk: result.milk, flavour: result.flavour
    }
  });
}

let shareStatusTimer = null;
function setShareStatus(msg) {
  if (shareStatusTimer) clearTimeout(shareStatusTimer);
  shareStatus.textContent = msg;
  if (msg) shareStatusTimer = setTimeout(() => { shareStatus.textContent = ''; }, 8000);
}

// navigator.clipboard needs a secure context (https, or localhost) — falls back to
// the older execCommand approach so copying still works over plain http or file://.
async function copyToClipboard(text) {
  if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {}
  }
  try {
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.setAttribute('readonly', '');
    temp.style.position = 'fixed';
    temp.style.top = '-1000px';
    document.body.appendChild(temp);
    temp.select();
    temp.setSelectionRange(0, temp.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(temp);
    return ok;
  } catch (e) {
    return false;
  }
}

shareBtn.addEventListener('click', async () => {
  const url = shareBtn.dataset.shareUrl;
  const text = shareBtn.dataset.shareText;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'My Brewlio coffee style', text, url });
      logFunnelEvent('share', { platform: 'native' });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return; // user closed the share sheet
      // otherwise fall through to the copy-link fallback below
    }
  }

  const copied = await copyToClipboard(url);
  if (copied) {
    setShareStatus('Link copied.');
    logFunnelEvent('share', { platform: 'copy_link' });
  } else {
    setShareStatus(`Couldn't copy automatically — here's your link: ${url}`);
    logFunnelEvent('share', { platform: 'copy_failed' });
  }
});

notifyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('notify-email');
  const email = input.value.trim();
  logFunnelEvent('email_submit', {});

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    notifyStatus.textContent = "That email doesn't look right. Check it and try again.";
    input.setAttribute('aria-invalid', 'true');
    logFunnelEvent('email_fail', { reason: 'invalid_email' });
    return;
  }
  input.removeAttribute('aria-invalid');

  const btn = notifyForm.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    if (!sb) throw new Error('no backend configured');
    const result = await sb.from('email_signups').insert({
      email,
      session_id: sessionId,
      submission_id: runId,
      source: 'quiz_result',
      style: notifyStyleField.value
    });
    if (result.error) throw result.error;
    notifyStatus.textContent = "You're on the list.";
    notifyForm.reset();
    logFunnelEvent('email_success', {});
  } catch (err) {
    console.warn('Email signup failed:', err);
    notifyStatus.textContent = 'Something went wrong. Try again in a moment.';
    logFunnelEvent('email_fail', { reason: 'insert_failed' });
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
});

retakeLink.addEventListener('click', () => {
  sessionStorage.removeItem(answersKey);
  sessionStorage.removeItem(runIdKey);
  sessionStorage.removeItem(startKey);
});

/* ---------- Init ---------- */

rebuildActiveQuestions();
currentIndex = firstUnansweredIndex();
render(currentIndex, { skipFocus: true });
logFunnelEvent('start', { question_index: currentIndex, total_questions: activeQuestions.length });
