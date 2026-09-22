// Brewlio quiz — data-driven, one question per screen.
// Same 8-question flow as the original quiz.js (brew, grinder, machine[espresso only],
// milk, flavour, roast, skill, pain), same scoring/matching logic — restyled and
// restructured into a single-question-per-screen flow instead of stacked fieldsets.

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

/* ---------- Question data (values match the live scoring exactly) ---------- */

const QUESTIONS = [
  {
    id: 'brew',
    legend: 'How do you mostly brew your coffee?',
    help: 'Pick the one you do most often.',
    options: [
      { value: 'espresso', title: 'Espresso machine', sub: 'Breville, Gaggia and similar' },
      { value: 'manual', title: 'Manual filter', sub: 'V60, AeroPress, pour-over' },
      { value: 'batch', title: 'Batch filter', sub: 'Moccamaster-style brewers' },
      { value: 'body', title: 'Immersion or stovetop', sub: 'French press, moka pot' },
      { value: 'other', title: 'Other or instant', sub: 'No judgement here' }
    ]
  },
  {
    id: 'grinder',
    legend: 'What are you grinding with?',
    help: (a) => a.brew === 'espresso'
      ? 'Hand grinders count — great for filter; espresso is a workout.'
      : 'Hand grinders count — coarser brews are their happy place.',
    options: [
      { value: 'pre-ground', title: 'Pre-ground', sub: 'Or no grinder at all' },
      { value: 'blade', title: 'Blade grinder', sub: 'Inconsistent, but common' },
      { value: 'burr-entry', title: 'Entry-level burr', sub: 'Smart Grinder Pro, Encore' },
      { value: 'burr-good', title: 'Good burr grinder', sub: 'DF64, Niche and similar' },
      { value: 'pro', title: 'High-end or commercial', sub: '078s, EK43' }
    ]
  },
  {
    id: 'machine',
    conditional: 'espresso',
    legend: 'If you make espresso, which machine tier is closest?',
    help: '',
    skipValue: 'not-sure',
    options: [
      { value: 'entry', title: 'Entry-level', sub: 'Bambino, basic single boiler' },
      { value: 'capable', title: 'Capable', sub: 'Gaggia, Silvia' },
      { value: 'advanced', title: 'Advanced', sub: 'Dual boiler or HX' },
      { value: 'elite', title: 'Prosumer or high-end', sub: 'Linea Mini, E61' },
      { value: 'not-sure', title: 'Not sure', sub: 'Totally fine' }
    ]
  },
  {
    id: 'milk',
    legend: 'How do you take your coffee?',
    help: '',
    options: [
      { value: 'black', title: 'Always black', sub: 'No milk' },
      { value: 'sometimes', title: 'Sometimes with milk', sub: 'Depends on the mood' },
      { value: 'always', title: 'Always with milk', sub: 'Flat white energy' }
    ]
  },
  {
    id: 'flavour',
    legend: 'What flavours do you enjoy most?',
    help: '',
    options: [
      { value: 'fruity', title: 'Juicy fruit', sub: 'Berries, citrus, bright cups' },
      { value: 'clean', title: 'Clean & tea-like', sub: 'Light, delicate, crisp' },
      { value: 'chocolate', title: 'Chocolatey & nutty', sub: 'Caramel, cocoa, comfort' },
      { value: 'balanced', title: 'Balanced', sub: 'Nothing too loud' },
      { value: 'bold', title: 'Rich & heavy', sub: 'Big body, low acidity' }
    ]
  },
  {
    id: 'roast',
    legend: 'What roast do you usually enjoy?',
    help: '',
    skipValue: 'any',
    options: [
      { value: 'light', title: 'Light roast', sub: 'More origin character' },
      { value: 'medium', title: 'Medium roast', sub: 'Sweet and balanced' },
      { value: 'medium-dark', title: 'Medium-dark roast', sub: 'Syrupy, comforting' },
      { value: 'dark', title: 'Dark roast', sub: 'Bold, roasty flavours' },
      { value: 'any', title: 'Not sure', sub: 'Happy to be guided' }
    ]
  },
  {
    id: 'skill',
    legend: 'How deep are you into coffee?',
    help: '',
    options: [
      { value: 'beginner', title: 'Beginner', sub: 'I just want it to taste good' },
      { value: 'basic', title: 'Comfortable', sub: 'I follow recipes' },
      { value: 'intermediate', title: 'Intermediate', sub: 'I tweak and adjust' },
      { value: 'advanced', title: 'Advanced', sub: 'Ratios and grind size matter' },
      { value: 'nerd', title: 'Very deep', sub: 'This is a real hobby' }
    ]
  },
  {
    id: 'pain',
    legend: 'What ruins a coffee for you?',
    help: '',
    options: [
      { value: 'sour', title: 'Sour or sharp', sub: 'Too acidic' },
      { value: 'bitter', title: 'Bitter or harsh', sub: 'Overdone' },
      { value: 'weak', title: 'Weak or watery', sub: 'No body' },
      { value: 'muddy', title: 'Muddy or gritty', sub: 'Unpleasant texture' },
      { value: 'inconsistent', title: 'Inconsistent', sub: 'Never tastes the same' }
    ]
  }
];

const KEYS = ['A', 'B', 'C', 'D', 'E'];

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
function labelForRoastPref(v) {
  const map = { light: 'Light roast', medium: 'Medium roast', 'medium-dark': 'Medium-dark roast', dark: 'Dark roast', any: 'Not sure' };
  return map[v] || '—';
}
function labelForSkill(v) {
  const map = { beginner: 'Beginner', basic: 'Comfortable', intermediate: 'Intermediate', advanced: 'Advanced', nerd: 'Very deep' };
  return map[v] || '—';
}
function labelForPain(v) {
  const map = { sour: 'Sour / sharp', bitter: 'Bitter / harsh', weak: 'Weak / watery', muddy: 'Muddy / gritty', inconsistent: 'Inconsistent' };
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

/* ---------- Rendering the active question ---------- */

function renderProgress() {
  const total = activeQuestions.length;
  quizProgress.style.setProperty('--steps', total);
  quizProgress.setAttribute('aria-label', `Question ${currentIndex + 1} of ${total}`);
  quizProgress.innerHTML = Array.from({ length: total }, (_, i) =>
    `<li class="progress__seg${i <= currentIndex ? ' is-done' : ''}"></li>`
  ).join('');
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
    else if (q.id === 'roast') label = labelForRoastPref(value);
    else if (q.id === 'skill') label = labelForSkill(value);
    else if (q.id === 'pain') label = labelForPain(value);
    chips.push(`<p class="chip mono"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>A${i + 1} · ${label.toUpperCase()}</p>`);
  }
  quizChips.innerHTML = chips.join('');
}

function renderOptions(q) {
  quizOptions.setAttribute('role', 'radiogroup');
  quizOptions.innerHTML = q.options.map((opt, i) => {
    const checked = answers[q.id] === opt.value;
    return `<label class="option">
      <input type="radio" name="${q.id}" value="${opt.value}"${checked ? ' checked' : ''}>
      <span class="option__key" aria-hidden="true">${KEYS[i]}</span>
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
  renderProgress();
  renderChips();

  const showPrev = idx > 0;
  prevLink.style.display = showPrev ? '' : 'none';

  quizTitle.textContent = q.legend;
  const helpText = typeof q.help === 'function' ? q.help(answers) : q.help;
  quizHelp.textContent = helpText || '';
  quizHelp.hidden = !helpText;
  renderOptions(q);

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
  }, 150);
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

function pushUnique(arr, msg) {
  if (!arr.includes(msg)) arr.push(msg);
}

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
      guatemala: { name: 'Guatemala', reason: 'cocoa and stone fruit balance, works well with milk' },
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
      sumatra: { name: 'Sumatra', reason: 'earthy, syrupy body perfect for milk drinks' }
    },
    dark: {
      brazil: { name: 'Brazil', reason: 'low acidity handles bold roasting without bitterness' },
      sumatra: { name: 'Sumatra', reason: 'heavy body and earthy notes thrive in dark roasts' },
      india: { name: 'India', reason: 'spice notes and full body hold up to roasting' }
    }
  };

  let category = 'mediumSweet';
  if (roast === 'light') category = 'light';
  else if (roast === 'medium-dark') category = 'mediumDark';
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

function tastingNoteFragment(roast) {
  const map = {
    light: 'Floral, citrus, light body',
    medium: 'Caramel, stone fruit, balanced',
    'medium-dark': 'Chocolate, caramel, syrupy body',
    dark: 'Dark chocolate, roasty, low acidity'
  };
  return map[roast] || map.medium;
}

function grinderFitText(grinder, roastLabel) {
  if (grinder === 'pre-ground' || grinder === 'blade') return `${roastLabel} roasts are the most forgiving choice for pre-ground or blade grinding.`;
  if (grinder === 'burr-entry') return `${roastLabel} roasts are easy to dial in on an entry-level burr.`;
  if (grinder === 'burr-good') return `Your grinder is capable enough to bring out what's good in a ${roastLabel.toLowerCase()}.`;
  return 'A high-end grinder means you can push into more delicate roasts without a fight.';
}

function milkFitText(milk) {
  if (milk === 'always') return 'This style holds its flavour well once milk is added.';
  if (milk === 'sometimes') return "Works black or with milk, so it won't let you down either way.";
  return 'Built to taste good on its own, no milk required.';
}

function tasteFitText(flavour) {
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

function buildResult() {
  const a = answers;
  const brew = a.brew || 'other';
  const grinder = a.grinder || 'pre-ground';
  const machine = a.machine || 'not-sure';
  const milk = a.milk;
  const flavour = a.flavour;
  const skill = a.skill || 'basic';
  const pain = a.pain || 'inconsistent';

  const roastPrefAny = (a.roast === 'any');
  const requestedRoast = (!roastPrefAny && a.roast) ? a.roast : null;
  let roast = requestedRoast || 'medium';

  const strongNotes = [];
  const hasWeakGrinder = ['pre-ground', 'blade', 'burr-entry'].includes(grinder);
  const hasGoodGrinder = (grinder === 'burr-good' || grinder === 'pro');
  const hasAdvancedSkill = (skill === 'advanced' || skill === 'nerd');

  function overrideRoast(newRoast, note) {
    if (roast !== newRoast) {
      roast = newRoast;
      pushUnique(strongNotes, note);
    }
  }

  if (requestedRoast) {
    if (hasWeakGrinder && roast === 'light') {
      overrideRoast('medium-dark', 'Light roasts need consistent grind. With entry-level grinding, they often taste sour. Medium-dark is more reliable.');
    }
    if (milk === 'always' && roast === 'light' && !(hasGoodGrinder && hasAdvancedSkill)) {
      overrideRoast('medium-dark', 'Milk can mask the delicate notes in light roasts. Medium-dark usually gives better body and sweetness with milk.');
    }
    if ((brew === 'manual' || brew === 'batch') && roast === 'dark') {
      overrideRoast('medium', 'Dark roasts in filter can taste harsh or ashy. Medium keeps sweetness and clarity.');
    }
    if (brew === 'espresso' && roast === 'light') {
      if (!hasGoodGrinder) {
        overrideRoast('medium', 'Light roast espresso needs a capable burr grinder to avoid sour, uneven shots. Medium is more forgiving.');
      }
      const entryMachine = (machine === 'entry' || machine === 'not-sure');
      if (entryMachine && !hasAdvancedSkill) {
        overrideRoast('medium', 'Light roasts on entry machines can be uneven. Medium extracts more consistently.');
      }
    }
    if (!hasAdvancedSkill) {
      if (pain === 'sour' && roast === 'light') {
        overrideRoast('medium', 'If sourness bothers you, light roasts can amplify it. Medium is easier to extract sweetly.');
      }
      if (pain === 'bitter' && roast === 'dark') {
        overrideRoast('medium-dark', 'If bitter is the enemy, very dark roasts can make it worse. Medium-dark is often cleaner.');
      }
    }
    if (pain === 'muddy' && hasWeakGrinder) {
      if (roast === 'light') overrideRoast('medium', 'Muddy texture often comes from inconsistent grind. Medium roasts are more forgiving.');
      if (roast === 'dark') overrideRoast('medium-dark', 'Very dark with fines can feel muddy. Medium-dark is usually cleaner.');
    }
  }

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

  let styleLabel = 'balanced & sweet';
  if (flavour === 'fruity') styleLabel = 'juicy fruit';
  if (flavour === 'clean') styleLabel = 'clean, tea-like';
  if (flavour === 'chocolate') styleLabel = 'choc / nut / caramel';
  if (flavour === 'balanced') styleLabel = 'balanced & sweet';
  if (flavour === 'bold') styleLabel = 'rich & heavy';

  return { brew, grinder, machine, milk, flavour, skill, pain, roast, pick, originInfo, displayStyle, styleLabel, strongNotes };
}

/* ---------- Result view ---------- */

let lastResult = null;

const styleTitle = document.getElementById('styleTitle');
const styleDesc = document.getElementById('styleDesc');
const styleBarCount = document.getElementById('styleBarCount');
const specSetup = document.getElementById('specSetup');
const specMilk = document.getElementById('specMilk');
const specTaste = document.getElementById('specTaste');
const fitsList = document.getElementById('fitsList');
const notesSection = document.getElementById('notesSection');
const notesList = document.getElementById('notesList');
const bagRoast = document.getElementById('bagRoast');
const bagNotes = document.getElementById('bagNotes');
const shareBtn = document.getElementById('shareBtn');
const shareStatus = document.getElementById('shareStatus');
const bagOrigins = document.getElementById('bagOrigins');
const bagRoastDate = document.getElementById('bagRoastDate');
const notifyForm = document.getElementById('notifyForm');
const notifyStatus = document.getElementById('notifyStatus');
const notifyStyleField = document.getElementById('notifyStyleField');
const retakeLink = document.getElementById('retakeLink');

const FITS_ICONS = [
  '<svg class="fits__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true"><path d="M8 3h8l-1 5H9z"/><rect x="6" y="8" width="12" height="13"/><path d="M12 12v4"/></svg>',
  '<svg class="fits__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true"><path d="M9 3h6v3l2 4v11H7V10l2-4z"/><path d="M7 13h10"/></svg>',
  '<svg class="fits__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true"><ellipse cx="12" cy="12" rx="6" ry="9" transform="rotate(35 12 12)"/><path d="M8.5 17.5c3.5-3 3.5-8 7-11"/></svg>'
];

const NOTE_ICON = '<svg class="fits__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5" stroke-linecap="round"/><path d="M12 16.5h.01" stroke-linecap="round" stroke-width="2.5"/></svg>';

function finishQuiz() {
  const result = buildResult();
  lastResult = result;

  const total = activeQuestions.length;
  const roastLabel = result.pick.title;
  const styleSlug = slugify(result.styleLabel);

  styleTitle.textContent = styleDisplayName(result.styleLabel);
  styleDesc.textContent = result.displayStyle;
  styleBarCount.textContent = `${total} / ${total} ✓`;

  specSetup.textContent = `${labelForBrew(result.brew)} · ${labelForGrinder(result.grinder)}`;
  specMilk.textContent = labelForMilkSpec(result.milk);
  specTaste.textContent = labelForFlavour(result.flavour);

  const fits = [
    { title: 'Your grinder', text: grinderFitText(result.grinder, roastLabel) },
    { title: 'Your milk', text: milkFitText(result.milk) },
    { title: 'Your taste', text: tasteFitText(result.flavour) }
  ];
  fitsList.innerHTML = fits.map((f, i) => `<li class="fits__item">${FITS_ICONS[i]}<div><h3 class="fits__title">${f.title}</h3><p class="fits__text">${f.text}</p></div></li>`).join('');

  if (result.strongNotes.length > 0) {
    notesList.innerHTML = result.strongNotes.map(note => `<li class="fits__item">${NOTE_ICON}<div><p class="fits__text">${note}</p></div></li>`).join('');
    notesSection.hidden = false;
  } else {
    notesList.innerHTML = '';
    notesSection.hidden = true;
  }

  bagRoast.textContent = roastLabel.replace(' Roast', '');
  bagNotes.textContent = tastingNoteFragment(result.roast);
  bagOrigins.textContent = `${result.originInfo.origin1.name} or ${result.originInfo.origin2.name}`;
  bagRoastDate.textContent = 'Look for something roasted in the last 2–4 weeks.';

  notifyStyleField.value = styleSlug;
  notifyStatus.textContent = "ONE EMAIL WHEN THEY'RE LIVE. NO SPAM.";
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
    pain: result.pain,
    notes: { strong: result.strongNotes }
  }, {
    duration_ms: Math.max(0, nowMs() - quizStartMs),
    match_roast: result.roast,
    match_style: result.styleLabel,
    match_origins: `${result.originInfo.origin1.name}, ${result.originInfo.origin2.name}`,
    answers: {
      brew: result.brew, grinder: result.grinder, machine: result.machine,
      milk: result.milk, flavour: result.flavour, roast_pref: answers.roast || null,
      skill: result.skill, pain: result.pain
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
