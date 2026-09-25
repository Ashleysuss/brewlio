// Respect reduced motion
(function handleReducedMotion() {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) return;
  document.querySelectorAll('video').forEach(v => {
    try {
      v.pause();
      v.removeAttribute('autoplay');
      v.preload = 'none';
    } catch (e) {}
  });
})();

// Greeting
(() => {
  const el = document.getElementById('greeting');
  if (el) {
    el.innerHTML = '<strong>Let\'s find what actually fits.</strong><span class="tip">About a minute. Pick what sounds like you. No jargon. No account.</span>';
  }
})();

// Supabase
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

const form = document.getElementById('coffeeQuiz');
const allQuestions = Array.from(document.querySelectorAll('.question'));
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const progress = document.querySelector('.progress');
const progressBar = document.getElementById('progressBar');
const results = document.getElementById('results');
const recommendation = document.getElementById('recommendation');
const stepText = document.getElementById('stepText');
const stepHint = document.getElementById('stepHint');
const errorText = document.getElementById('errorText');
const retakeBtn = document.getElementById('retakeBtn');
const grinderHint = document.getElementById('grinderHint');

function getAnswer(name) {
  return form.querySelector('input[name="' + name + '"]:checked')?.value || null;
}

async function logFunnelEvent(eventType, data, overrides) {
  data = data || {};
  overrides = overrides || {};
  
  if (!sb) return;

  try {
    const brew = getAnswer('brew') || null;
    const grinder = getAnswer('grinder') || null;
    const machine = brew === 'espresso' ? (getAnswer('machine') || null) : null;

    const duration = overrides.duration_ms || Math.max(0, nowMs() - quizStartMs);

    const payload = {
      submission_id: runId,
      session_id: sessionId,
      page: location.pathname,
      quiz_version: "v2.6-enhanced",
      duration_ms: duration,

      brew: brew,
      grinder: grinder,
      machine: machine,

      milk: getAnswer('milk') || null,
      flavour: getAnswer('flavour') || null,
      roast_pref: getAnswer('roast') || null,
      skill: getAnswer('skill') || null,
      pain: getAnswer('pain') || null,

      match_roast: overrides.match_roast || null,
      match_style: overrides.match_style || null,
      match_origins: overrides.match_origins || null,

      answers: overrides.answers || (
        eventType === 'answer'
          ? { [data.question || 'unknown']: data.value || null }
          : null
      ),

      derived: Object.assign({ event_type: eventType }, data)
    };

    const result = await sb.from("quiz_events").insert(payload);
    if (result.error) console.warn("Supabase funnel error:", result.error);
  } catch (err) {
    console.warn("Funnel log failed:", err);
  }
}

<<<<<<< Updated upstream
function setGrinderHint(brew) {
  if (!grinderHint) return;
  grinderHint.textContent = (brew === 'espresso')
    ? "Hand grinders count — great for filter; espresso is a workout."
    : "Hand grinders count — coarser brews are their happy place.";
}
=======
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
>>>>>>> Stashed changes

function labelForGrinder(v) {
  const map = {
    "pre-ground": "Pre-ground",
    "blade": "Blade grinder",
    "burr-entry": "Entry burr",
    "burr-good": "Good burr",
    "pro": "High-end / commercial"
  };
  return map[v] || (v ? v.replace(/-/g, ' ') : "—");
}

function labelForBrew(v) {
  const map = {
    "espresso": "Espresso",
    "manual": "Manual filter",
    "batch": "Batch filter",
    "body": "Immersion / stovetop",
    "other": "Other / instant"
  };
  return map[v] || (v ? v : "—");
}

function labelForMilk(v) {
  const map = {
    "black": "Black",
    "sometimes": "Sometimes milk",
    "always": "Milk"
  };
  return map[v] || "—";
}

function labelForFlavour(v) {
  const map = {
    "fruity": "Juicy fruit",
    "clean": "Clean & tea-like",
    "chocolate": "Chocolatey & nutty",
    "balanced": "Balanced",
    "bold": "Rich & heavy"
  };
  return map[v] || "—";
}

function labelForPain(v) {
  const map = {
    "sour": "Sour / sharp",
    "bitter": "Bitter / harsh",
    "weak": "Weak / watery",
    "muddy": "Muddy / gritty",
    "inconsistent": "Inconsistent"
  };
  return map[v] || "—";
}

function labelForRoast(v) {
  const map = {
    "light": "Light Roast",
    "medium": "Medium Roast",
    "medium-dark": "Medium-Dark Roast",
    "dark": "Dark Roast"
  };
  return map[v] || "Medium Roast";
}

let currentIndex = 0;
let activeQuestions = [];
let isSubmitting = false;

results.hidden = true;
form.hidden = false;

function rebuildActiveQuestions() {
  const brew = getAnswer('brew');
  activeQuestions = allQuestions.filter(q => {
    const cond = q.getAttribute('data-conditional');
    return !cond || cond === brew;
  });

  const machine = allQuestions.find(q => q.getAttribute('data-q') === 'machine');
  if (machine) {
    const inputs = machine.querySelectorAll('input[type="radio"]');
    const isActive = activeQuestions.includes(machine);
    inputs.forEach(i => i.required = isActive);
    if (!isActive) inputs.forEach(i => i.checked = false);
  }

  currentIndex = Math.min(currentIndex, activeQuestions.length - 1);
}

function total() {
  return activeQuestions.length;
}

<<<<<<< Updated upstream
function isAnswered(idx) {
  return !!activeQuestions[idx]?.querySelector('input[type="radio"]:checked');
}

function setButtons() {
  prevBtn.disabled = currentIndex === 0;

  const last = currentIndex === total() - 1;
  const answered = isAnswered(currentIndex);

  nextBtn.classList.toggle('hidden', last);
  submitBtn.classList.toggle('hidden', !last);

  nextBtn.disabled = !answered;
  submitBtn.disabled = !answered;

  stepText.textContent = 'Question ' + (currentIndex + 1) + ' of ' + total();
  stepHint.textContent = answered ? 'Nice — continue' : 'Pick one to continue';
=======
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
      <span class="option__text"><span class="option__title">${opt.title}</span><span class="option__sub">${opt.sub}</span></span>
      <span class="option__box" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
    </label>`;
  }).join('');
>>>>>>> Stashed changes
}

function pauseAllQuestionVideos() {
  document.querySelectorAll('video.q-video').forEach(v => {
    try {
      v.pause();
    } catch (e) {}
  });
}

function playActiveQuestionVideo(activeEl) {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const v = activeEl?.querySelector('video.q-video');
  if (!v) return;
  try {
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch (e) {}
}

function setProgressAria(percent) {
  if (!progressBar) return;
  const safe = Math.max(0, Math.min(100, Math.round(percent)));
  progressBar.setAttribute('aria-valuenow', String(safe));
}

function showQuestion(idx) {
  allQuestions.forEach(q => q.classList.remove('active'));
  activeQuestions[idx].classList.add('active');

  pauseAllQuestionVideos();
  playActiveQuestionVideo(activeQuestions[idx]);

  errorText.textContent = '';
  const pct = ((idx + 1) / total()) * 100;
  progress.style.width = pct + '%';
  setProgressAria(pct);

  setButtons();

  logFunnelEvent('view_question', {
    question_index: idx,
    total_questions: total()
  });

  activeQuestions[idx].scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

form.addEventListener('change', (e) => {
  if (!e.target.matches('input[type="radio"]')) return;

  logFunnelEvent('answer', {
    question: e.target.name,
    value: e.target.value,
    question_index: currentIndex,
    total_questions: total()
  });

  if (e.target.name === 'brew') {
    const brew = getAnswer('brew') || 'other';
    setGrinderHint(brew);
    rebuildActiveQuestions();
    showQuestion(currentIndex);
    return;
  }

  setButtons();
});

nextBtn.addEventListener('click', () => {
  if (!isAnswered(currentIndex)) {
    errorText.textContent = 'Pick an option to continue.';
    return;
  }
  logFunnelEvent('nav_next', {
    from_index: currentIndex,
    to_index: currentIndex + 1,
    total_questions: total()
  });
  currentIndex++;
  showQuestion(currentIndex);
});

prevBtn.addEventListener('click', () => {
  logFunnelEvent('nav_prev', {
    from_index: currentIndex,
    to_index: currentIndex - 1,
    total_questions: total()
  });
  currentIndex--;
  showQuestion(currentIndex);
});

function getOriginDetails(roast, flavour, brew, milk) {
  const originData = {
    light: {
      ethiopia: {
        name: "Ethiopia",
        reason: "naturally high acidity and floral notes shine in lighter roasts"
      },
      kenya: {
        name: "Kenya",
        reason: "bright berry notes and wine-like clarity when roasted light"
      },
      costarica: {
        name: "Costa Rica",
        reason: "clean processing methods preserve delicate fruit notes"
      },
      rwanda: {
        name: "Rwanda",
        reason: "sweet citrus and tea-like qualities at lighter roasts"
      }
    },
    mediumSweet: {
      brazil: {
        name: "Brazil",
        reason: "naturally low acidity with chocolate and nut sweetness"
      },
      colombia: {
        name: "Colombia",
        reason: "balanced body with caramel and mild fruit notes"
      },
      guatemala: {
        name: "Guatemala",
        reason: "cocoa and stone fruit balance, works well with milk"
      },
      elsalvador: {
        name: "El Salvador",
        reason: "honey-like sweetness with good body"
      }
    },
    mediumClean: {
      colombia: {
        name: "Colombia",
        reason: "clean processing creates bright, balanced cups"
      },
      costarica: {
        name: "Costa Rica",
        reason: "clarity and sweetness without sharp acidity"
      },
      kenya: {
        name: "Kenya",
        reason: "fruit-forward but sweet when medium roasted"
      },
      guatemala: {
        name: "Guatemala",
        reason: "structured sweetness with floral notes"
      }
    },
    mediumDark: {
      brazil: {
        name: "Brazil",
        reason: "chocolatey body stands up to darker roasting"
      },
      colombia: {
        name: "Colombia",
        reason: "retains sweetness even when pushed darker"
      },
      guatemala: {
        name: "Guatemala",
        reason: "caramel and dark chocolate notes develop well"
      },
      sumatra: {
        name: "Sumatra",
        reason: "earthy, syrupy body perfect for milk drinks"
      }
    },
    dark: {
      brazil: {
        name: "Brazil",
        reason: "low acidity handles bold roasting without bitterness"
      },
      sumatra: {
        name: "Sumatra",
        reason: "heavy body and earthy notes thrive in dark roasts"
      },
      india: {
        name: "India",
        reason: "spice notes and full body hold up to roasting"
      }
    }
  };

  let category = 'mediumSweet';

  if (roast === 'light') category = 'light';
  else if (roast === 'medium-dark') category = 'mediumDark';
  else if (roast === 'dark') category = 'dark';
  else if (roast === 'medium') {
    if (flavour === 'chocolate' || flavour === 'bold') category = 'mediumSweet';
    else category = 'mediumClean';
  }

  if (brew === 'espresso' && milk === 'always' && roast !== 'dark') {
    category = 'mediumSweet';
  }

  const pool = originData[category];
  const keys = Object.keys(pool);
  const shuffled = keys.sort(() => 0.5 - Math.random());

  const origin1 = pool[shuffled[0]];
  const origin2 = pool[shuffled[1]] || origin1;

  return {
    origin1: origin1,
    origin2: origin2
  };
}

function pushUnique(arr, msg) {
  if (!arr.includes(msg)) arr.push(msg);
}

function resultStyleLine(roast, flavour, brew, milk) {
  const isMilk = (milk === 'always');
  const isFilter = (brew === 'manual' || brew === 'batch');

  if (roast === 'light') {
    if (flavour === 'chocolate' || flavour === 'bold') return "lighter roasts with retained sweetness, not sour-for-fun";
    if (isMilk) return "light roasts with enough body and sweetness to work with milk";
    return "bright, clean cups with clarity and delicate fruit notes";
  }

  if (roast === 'medium') {
    if (flavour === 'fruity') return "sweet, fruit-forward cups without sharp acidity";
    if (flavour === 'clean') return "clean sweetness with clarity, balanced and approachable";
    if (flavour === 'bold') return "fuller-bodied sweetness with comfort flavours";
    if (isMilk) return "sweet, milk-friendly profiles with caramel and chocolate";
    return "balanced sweetness that's easy to extract consistently";
  }

  if (roast === 'medium-dark') {
<<<<<<< Updated upstream
    if (isFilter) return "syrupy sweetness and body without harsh roast bitterness";
    if (isMilk) return "rich, milk-friendly profiles with chocolate and caramel depth";
    return "fuller body with sweet, comforting flavours";
=======
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
>>>>>>> Stashed changes
  }

  if (flavour === 'fruity' || flavour === 'clean') return "bold roast flavours with low acidity, no fruit notes";
  return "heavy body, roasty comfort flavours, very low acidity";
}

function createSocialShare(roast, brew, grinder, milk) {
  const milkLabel = milk === 'black' ? 'black only' : milk === 'always' ? 'always with milk' : 'sometimes milk';
  const shareText = 'I am a ' + roast + ' roast person. My coffee profile: ' + labelForBrew(brew) + ', ' + labelForGrinder(grinder) + ', ' + milkLabel + '. Find your match at brewlio.com.au';
  const shareUrl = 'https://brewlio.com.au/quiz.html';

  return '<div class="social-share">' +
    '<p class="social-share-title">Share your coffee profile</p>' +
    '<div class="social-buttons">' +
    '<button class="social-btn" onclick="shareOnTwitter(\'' + encodeURIComponent(shareText) + '\', \'' + shareUrl + '\')">Share on 𝕏</button>' +
    '<button class="social-btn" onclick="shareOnReddit(\'' + encodeURIComponent(shareText) + '\', \'' + shareUrl + '\')">Share on Reddit</button>' +
    '<button class="social-btn" id="copyLinkBtn" onclick="copyLink(\'' + shareUrl + '\', \'' + encodeURIComponent(shareText) + '\')">Copy link</button>' +
    '</div>' +
    '</div>';
}

<<<<<<< Updated upstream
window.shareOnTwitter = function(text, url) {
  const twitterUrl = 'https://twitter.com/intent/tweet?text=' + text + '&url=' + url;
  window.open(twitterUrl, '_blank', 'width=550,height=420');
  logFunnelEvent('share', {
    platform: 'twitter'
=======
const styleTitle = document.getElementById('styleTitle');
const styleDesc = document.getElementById('styleDesc');
const specSetup = document.getElementById('specSetup');
const specMilk = document.getElementById('specMilk');
const specTaste = document.getElementById('specTaste');
const fitsList = document.getElementById('fitsList');
const notesSection = document.getElementById('notesSection');
const notesList = document.getElementById('notesList');
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

const NOTE_ICON = '<svg class="fits__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5" stroke-linecap="round"/><path d="M12 16.5h.01" stroke-linecap="round" stroke-width="2.5"/></svg>';

function finishQuiz() {
  const result = buildResult();
  lastResult = result;

  const roastLabel = result.pick.title;
  const styleSlug = slugify(result.styleLabel);

  styleTitle.textContent = styleDisplayName(result.styleLabel);
  styleDesc.textContent = result.displayStyle;

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
>>>>>>> Stashed changes
  });
};

window.shareOnReddit = function(text, url) {
  const redditUrl = 'https://reddit.com/submit?title=' + text + '&url=' + url;
  window.open(redditUrl, '_blank', 'width=850,height=600');
  logFunnelEvent('share', {
    platform: 'reddit'
  });
};

window.copyLink = function(url, text) {
  const fullText = decodeURIComponent(text) + ' ' + url;
  navigator.clipboard.writeText(fullText).then(() => {
    const btn = document.getElementById('copyLinkBtn');
    const originalText = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('copied');
    }, 2000);
    logFunnelEvent('share', {
      platform: 'copy_link'
    });
  });
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isSubmitting) return;
  if (!isAnswered(currentIndex)) {
    errorText.textContent = 'Pick an option to see your result.';
    return;
  }

  isSubmitting = true;
  submitBtn.disabled = true;
  const originalSubmitText = submitBtn.textContent;
  submitBtn.textContent = "Saving…";

  const submissionId = runId;

  try {
    const formData = new FormData(form);
    const a = Object.fromEntries(formData);

    const brew = a.brew || 'other';
    const grinder = a.grinder || 'pre-ground';
    const machine = a.machine || 'not-sure';
    const skill = a.skill || 'basic';
    const pain = a.pain || 'inconsistent';
    const roastPrefAny = (a.roast === 'any');

    const requestedRoast = (!roastPrefAny && a.roast) ? a.roast : null;
    let roast = requestedRoast || 'medium';

    const strongNotes = [];

    let styleLabel = 'balanced & sweet';
    if (a.flavour === 'fruity') styleLabel = 'juicy fruit';
    if (a.flavour === 'clean') styleLabel = 'clean, tea-like';
    if (a.flavour === 'chocolate') styleLabel = 'choc / nut / caramel';
    if (a.flavour === 'balanced') styleLabel = 'balanced & sweet';
    if (a.flavour === 'bold') styleLabel = 'rich & heavy';

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
        overrideRoast('medium-dark', "Light roasts need consistent grind. With entry-level grinding, they often taste sour. Medium-dark is more reliable.");
      }

      if (a.milk === 'always' && roast === 'light' && !(hasGoodGrinder && hasAdvancedSkill)) {
        overrideRoast('medium-dark', "Milk can mask the delicate notes in light roasts. Medium-dark usually gives better body and sweetness with milk.");
      }

      if ((brew === 'manual' || brew === 'batch') && roast === 'dark') {
        overrideRoast('medium', "Dark roasts in filter can taste harsh or ashy. Medium keeps sweetness and clarity.");
      }

      if (brew === 'espresso' && roast === 'light') {
        if (!hasGoodGrinder) {
          overrideRoast('medium', "Light roast espresso needs a capable burr grinder to avoid sour, uneven shots. Medium is more forgiving.");
        }
        const entryMachine = (machine === 'entry' || machine === 'not-sure');
        if (entryMachine && !hasAdvancedSkill) {
          overrideRoast('medium', "Light roasts on entry machines can be uneven. Medium extracts more consistently.");
        }
      }

      if (!hasAdvancedSkill) {
        if (pain === 'sour' && roast === 'light') {
          overrideRoast('medium', "If sourness bothers you, light roasts can amplify it. Medium is easier to extract sweetly.");
        }
        if (pain === 'bitter' && roast === 'dark') {
          overrideRoast('medium-dark', "If bitter is the enemy, very dark roasts can make it worse. Medium-dark is often cleaner.");
        }
      }

      if (pain === 'muddy' && hasWeakGrinder) {
        if (roast === 'light') overrideRoast('medium', "Muddy texture often comes from inconsistent grind. Medium roasts are more forgiving.");
        if (roast === 'dark') overrideRoast('medium-dark', "Very dark with fines can feel muddy. Medium-dark is usually cleaner.");
      }
    }

    if (!requestedRoast || requestedRoast === 'medium') {
      if (a.milk === 'always' && (a.flavour === 'bold' || a.flavour === 'chocolate') && (brew === 'espresso' || brew === 'body') && !hasAdvancedSkill) {
        roast = 'medium-dark';
      }
    }

    if (roastPrefAny) {
      roast = 'medium';
      if (hasGoodGrinder && hasAdvancedSkill && (a.flavour === 'fruity' || a.flavour === 'clean')) {
        roast = 'light';
      } else if ((brew === 'espresso' || brew === 'body') && a.milk === 'always') {
        roast = 'medium-dark';
      }
    }

    const recs = {
      light: {
        title: 'Light Roast',
        why: 'More origin character, less roast taste. Bright when extracted well.'
      },
      medium: {
        title: 'Medium Roast',
        why: 'Sweet, forgiving, and works on most setups without drama.'
      },
      'medium-dark': {
        title: 'Medium-Dark Roast',
        why: 'Syrupy body, great with milk, and generally hard to mess up.'
      },
      dark: {
        title: 'Dark Roast',
        why: 'Big roast taste, low acidity, very forgiving (if that is your vibe).'
      }
    };

    const pick = recs[roast] || recs.medium;

    const originInfo = getOriginDetails(roast, a.flavour, brew, a.milk);
    const displayStyle = resultStyleLine(roast, a.flavour, brew, a.milk);

    const brewText = ({
      espresso: 'espresso',
      manual: 'manual filter',
      batch: 'batch filter',
      body: 'immersion / stovetop',
      other: 'other'
    }[brew] || brew);

    const milkText = (a.milk === 'black') ? 'black' : (a.milk === 'always') ? 'with milk' : 'either';

    const durationMs = Math.max(0, nowMs() - quizStartMs);

    const profileHTML = '<div class="why-box why-box--profile">' +
      '<p class="why-title">Your profile</p>' +
      '<p class="why-meta"><strong>Brew:</strong> ' + labelForBrew(brew) + '</p>' +
      '<p class="why-meta"><strong>Milk:</strong> ' + labelForMilk(a.milk) + '</p>' +
      '<p class="why-meta"><strong>Grinder:</strong> ' + labelForGrinder(grinder) + '</p>' +
      '<p class="why-meta"><strong>Taste:</strong> ' + labelForFlavour(a.flavour) + '</p>' +
      '<p class="why-meta"><strong>Deal-breaker:</strong> ' + labelForPain(pain) + '</p>' +
      '</div>';

    let html = '<div class="result-card">' +
      '<p class="rec-title">Your coffee style:</p>' +
      '<h3>' + pick.title + '</h3>' +
      '<p class="result-line">You will enjoy <strong>' + displayStyle + '</strong>.</p>' +
      '<p class="result-line">Look for beans from <strong>' + originInfo.origin1.name + ' or ' + originInfo.origin2.name + '</strong>.</p>' +
      '<p class="origin-detail">→ ' + originInfo.origin1.name + ': ' + originInfo.origin1.reason + '</p>' +
      '<p class="origin-detail">→ ' + originInfo.origin2.name + ': ' + originInfo.origin2.reason + '</p>' +
      profileHTML +
      '<div class="why-box">' +
      '<p class="why-title">Why this fits you</p>' +
      '<p>' + pick.why + '</p>' +
      '<p class="why-meta">Built for <strong>' + brewText + '</strong>, drinking it <strong>' + milkText + '</strong>, with a <strong>' + grinder.replace(/-/g, ' ') + '</strong> grinder.</p>' +
      '<p class="why-meta">Prioritises consistency over perfection — on purpose.</p>' +
      '</div>';

    if (strongNotes.length > 0) {
      html += '<div class="why-box why-box--note">' +
        '<p class="why-title">A note from experience</p>' +
        '<ul class="note-list">' +
        strongNotes.map(n => '<li>' + n + '</li>').join('') +
        '</ul>' +
        '</div>';
    }

    html += createSocialShare(labelForRoast(roast), brew, grinder, a.milk);

    html += '<div class="why-box cta-panel cta-panel--results">' +
      '<p class="why-title cta-title">Want matched coffees when we launch?</p>' +
      '<p class="cta-copy">We are building partnerships with Australian roasters. Join the list to get notified when we have coffees that actually match your profile.</p>' +
      '<ul class="note-list" style="margin: 16px 0 20px;">' +
      '<li>Early access to roaster partnerships</li>' +
      '<li>Your profile saved for when matches are ready</li>' +
      '<li>No spam — just a heads up when it is ready</li>' +
      '</ul>' +
      '<form id="emailForm" class="email-form">' +
      '<label class="sr-only" for="userEmail">Your email address</label>' +
      '<input type="email" id="userEmail" name="email" placeholder="your@email.com" required autocomplete="email" inputmode="email" class="email-input" />' +
      '<button type="submit" class="quiz-btn primary email-submit">Notify me when ready</button>' +
      '</form>' +
      '<p class="email-footnote">Pilot phase. No daily emails. Unsubscribe anytime.</p>' +
      '</div>';

    html += '</div>';

    recommendation.innerHTML = html;

    results.hidden = false;
    form.hidden = true;

    results.focus({
      preventScroll: true
    });
    results.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    await logFunnelEvent('complete', {
      roast: roast,
      styleLabel: styleLabel,
      origins: originInfo.origin1.name + ', ' + originInfo.origin2.name,
      brew: brew,
      grinder: grinder,
      machine: brew === 'espresso' ? machine : null,
      skill: skill,
      pain: pain,
      buy_source: null,
      notes: {
        strong: strongNotes
      }
    }, {
      duration_ms: durationMs,
      match_roast: roast || null,
      match_style: styleLabel || null,
      match_origins: (originInfo.origin1.name + ', ' + originInfo.origin2.name) || null,
      answers: a
    });

    const emailForm = document.getElementById('emailForm');
    if (emailForm && sb) {
      emailForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const emailInput = document.getElementById('userEmail');
        const email = emailInput?.value.trim();
        emailInput?.classList.remove('input-error');

        logFunnelEvent('email_submit', {});

        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          emailInput.classList.add('input-error');
          logFunnelEvent('email_fail', {
            reason: 'invalid_email'
          });
          return;
        }

        const btn = emailForm.querySelector('button[type="submit"]');
        const origText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Saving…';

        try {
          const result = await sb.from('email_signups').insert({
            email: email,
            session_id: sessionId,
            submission_id: submissionId,
            source: 'quiz_result'
          });
          if (result.error) throw result.error;

          logFunnelEvent('email_success', {});
          emailForm.innerHTML = '<p class="email-success">You are on the list — we will reach out when roaster partnerships are ready.</p>';
          return;
        } catch (err) {
          console.warn('Email signup failed:', err);
          logFunnelEvent('email_fail', {
            reason: 'insert_failed'
          });
          btn.textContent = 'Try again';
        } finally {
          if (!btn || !btn.isConnected) return;
          btn.disabled = false;
          if (origText) btn.textContent = origText;
        }
      });
    }

  } catch (err) {
    console.warn("Submit failed:", err);
  } finally {
    submitBtn.textContent = originalSubmitText;
  }
});

retakeBtn.addEventListener('click', () => {
  isSubmitting = false;

  runId = crypto.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2));
  sessionStorage.setItem(runIdKey, runId);

  quizStartMs = nowMs();
  sessionStorage.setItem(startKey, String(quizStartMs));

  form.reset();
  results.hidden = true;
  form.hidden = false;

  currentIndex = 0;
  rebuildActiveQuestions();
  setGrinderHint(getAnswer('brew') || 'other');
  showQuestion(currentIndex);

  logFunnelEvent('start', {
    question_index: 0,
    total_questions: total(),
    retake: true
  });
});

rebuildActiveQuestions();
setGrinderHint(getAnswer('brew') || 'other');
showQuestion(0);
logFunnelEvent('start', {
  question_index: 0,
  total_questions: total()
});