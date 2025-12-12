const STORAGE_KEY = 'study-assistant-v1';
const state = {
  notes: '',
  summary: '',
  quiz: [],
  answers: {},
  history: [],
  streak: 0,
  studyMinutes: 0,
  user: null,
  profile: { photoURL: '', bio: '' },
};

// Inbuilt API keys/config (replace with your real keys)
const GEMINI_API_KEY = 'AIzaSyApl4GRa9yXGG2X6pibEJWEOJr3_2p3sVs';
// Use a GA model name that matches your API key's access; adjust if needed.
const GEMINI_MODEL = "models/gemini-2.0-flash-lite";

// TODO: Replace with your Firebase project credentials
const firebaseConfig = {
  apiKey: 'REPLACE_WITH_FIREBASE_API_KEY',
  authDomain: 'REPLACE_WITH_FIREBASE_AUTH_DOMAIN',
  projectId: 'REPLACE_WITH_FIREBASE_PROJECT_ID',
  appId: 'REPLACE_WITH_FIREBASE_APP_ID',
  // Optional extras:
  // storageBucket: 'your-bucket.appspot.com',
  // messagingSenderId: '1234567890',
};

const qs = (id) => document.getElementById(id);

// Persistence
const loadState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) Object.assign(state, JSON.parse(saved));
  updateUIFromState();
};
const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

// --- Gemini helpers ---
const geminiRequest = async (prompt, { apiKey, model, asJson = false }) => {
  if (!apiKey) throw new Error('Missing API key.');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, topK: 32, topP: 0.9 },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error: ${res.status} ${text}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (asJson) {
    try {
      const cleaned = text.trim().replace(/```json/gi, '').replace(/```/g, '');
      return JSON.parse(cleaned);
    } catch (e) {
      throw new Error('Failed to parse JSON from model response.');
    }
  }
  return text.trim();
};

// Summary via Gemini with graceful fallback
const generateSummary = async (text) => {
  if (!text.trim()) return 'No content found.';
  if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith('REPLACE')) {
    return `• Key idea: ${text.slice(0, 120)}...\n• Concepts: (add in-code API key for live summaries)\n• Actions: Review examples, practice quiz`;
  }
  const prompt = `You are a concise study-note summarizer. Given the user's raw notes, produce a short, structured summary using bullet points. Keep it under 120 words. Respond in plain text bullets.\n\nNotes:\n${text}`;
  return geminiRequest(prompt, { apiKey: GEMINI_API_KEY, model: GEMINI_MODEL, asJson: false });
};

// Quiz generation via Gemini with fallback
const generateQuiz = async (summary, difficulty) => {
  const fallback = [
    { q: 'What is the main idea?', a: ['Detail 1', 'Main idea', 'Detail 2', 'Detail 3'], correct: 1, exp: 'The summary highlights the main idea.' },
    { q: 'Which topic is weak?', a: ['Topic A', 'Topic B', 'Both', 'None'], correct: 2, exp: 'Both topics appear as gaps.' },
    { q: 'Next action?', a: ['Ignore', 'Cram', 'Review examples', 'Stop'], correct: 2, exp: 'Examples reinforce understanding.' },
  ].map((o, i) => ({ ...o, id: i, difficulty }));

  if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith('REPLACE')) return fallback;

  const prompt = `Create 5 multiple-choice questions from this summary. Each question must include exactly four options and one correct index. Return strict JSON array, no prose, in the shape:
[
 { "question": "...", "options": ["A","B","C","D"], "correctIndex": 1, "explanation": "..." }
]
Difficulty: ${difficulty}
Summary:\n${summary}`;

  try {
    const quizJson = await geminiRequest(prompt, { apiKey: GEMINI_API_KEY, model: GEMINI_MODEL, asJson: true });
    const normalized = Array.isArray(quizJson) ? quizJson : [];
    if (!normalized.length) throw new Error('Empty quiz');
    return normalized.slice(0, 10).map((q, i) => ({
      id: i,
      q: q.question,
      a: q.options,
      correct: q.correctIndex,
      exp: q.explanation || 'Review the concept.',
      difficulty,
    }));
  } catch (err) {
    console.error(err);
    return fallback;
  }
};

// Elements
const fileInput = qs('file-input');
const textInput = qs('text-input');
const summaryBox = qs('summary-content');
const heroSummary = qs('hero-summary');
const quizArea = qs('quiz-area');
const scoreEl = qs('quiz-score');
const difficultySelect = qs('difficulty');
const mcqCountInput = qs('mcq-count');
const quizTimerMinInput = qs('quiz-timer-min');
const quizTimerDisplay = qs('quiz-timer-display');
const quizTimerStartBtn = qs('quiz-timer-start');
const btnLogin = qs('btn-login');
const btnLogout = qs('btn-logout');
const userChip = qs('user-chip');
const fileListEl = qs('file-list');
const quizFeedback = qs('quiz-feedback');
// File selection queue (append up to 5)
let fileQueue = [];

const syncFileInputFromQueue = () => {
  const dt = new DataTransfer();
  fileQueue.slice(0, 5).forEach(f => dt.items.add(f));
  fileInput.files = dt.files;
};

const renderFileList = (files) => {
  if (!fileListEl) return;
  if (!files.length) {
    fileListEl.innerHTML = '<li class="text-slate-500">No files selected.</li>';
    return;
  }
  fileListEl.innerHTML = files
    .map((f, idx) => `<li class="flex justify-between gap-2"><span>${idx + 1}. ${f.name}</span><span class="text-xs text-slate-400">${Math.round(f.size/1024)} KB</span></li>`)
    .join('');
};

fileInput.onchange = () => {
  const newFiles = Array.from(fileInput.files || []);
  if (!newFiles.length) return;
  // Append to queue, enforce max 5
  fileQueue = [...fileQueue, ...newFiles].slice(0, 5);
  if (fileQueue.length === 5 && newFiles.length + (fileQueue.length - newFiles.length) > 5) {
    alert('You reached the 5-file limit. Extra files were ignored.');
  }
  syncFileInputFromQueue();
  renderFileList(fileQueue);
};
const loginModal = qs('login-modal');
const loginClose = qs('login-close');
const loginGoogle = qs('login-google');
const loginEmail = qs('login-email');
const loginPassword = qs('login-password');
const loginPhoto = qs('login-photo');
const loginBio = qs('login-bio');
const loginEmailSubmit = qs('login-email-submit');
const loginError = qs('login-error');

// Upload + Summary
qs('btn-process').onclick = async () => {
  let text = textInput.value.trim();
  if (fileQueue.length > 5) {
    fileQueue = fileQueue.slice(0,5);
    syncFileInputFromQueue();
    alert('Please upload up to 5 files.');
  }
  renderFileList(fileQueue);

  const fileTexts = await Promise.all(
    fileQueue.map(async (file) => {
      if (file.type === 'text/plain') {
        return await file.text();
      }
      // Placeholder until OCR/parser integration
      return `[Placeholder] Extracted text from file "${file.name}" via OCR/Parser.`;
    })
  );

  const combinedFileText = fileTexts
    .map((content, idx) => `--- File ${idx + 1}: ${fileQueue[idx].name} ---\n${content}`)
    .join('\n\n');

  const finalText = [text, combinedFileText].filter(Boolean).join('\n\n');

  if (!finalText) return alert('Please upload or paste notes.');

  state.notes = finalText;
  summaryBox.textContent = 'Generating summary...';
  try {
    const summary = await generateSummary(finalText);
    state.summary = summary;
    summaryBox.textContent = summary;
    heroSummary.textContent = summary;
    persist();
  } catch (err) {
    summaryBox.textContent = 'Failed to generate summary. Check API key or try again.';
    console.error(err);
  }
};

qs('btn-refresh-summary').onclick = async () => {
  if (!state.notes) return alert('Upload notes first.');
  summaryBox.textContent = 'Regenerating...';
  try {
    const summary = await generateSummary(state.notes);
    state.summary = summary;
    summaryBox.textContent = summary;
    heroSummary.textContent = summary;
    persist();
  } catch (err) {
    summaryBox.textContent = 'Failed to regenerate summary. Check API key.';
    console.error(err);
  }
};

// Quiz render
const renderQuiz = () => {
  quizArea.innerHTML = '';
  state.quiz.forEach((q) => {
    const card = document.createElement('div');
    card.className = 'bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2';
    const title = document.createElement('p');
    title.className = 'text-slate-100 font-semibold';
    title.textContent = q.q;
    card.appendChild(title);
    q.a.forEach((opt, idx) => {
      const label = document.createElement('label');
      label.className = 'flex gap-2 items-center text-sm text-slate-200';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'q-' + q.id;
      input.value = idx;
      input.checked = state.answers[q.id] == idx;
      input.onchange = () => state.answers[q.id] = idx;
      label.appendChild(input);
      label.appendChild(document.createTextNode(opt));
      card.appendChild(label);
    });
    quizArea.appendChild(card);
  });
};

qs('btn-generate-quiz').onclick = async () => {
  if (!state.summary) return alert('Generate a summary first.');
  const diff = difficultySelect.value;
  const desiredCount = Math.min(Math.max(Number(mcqCountInput.value) || 5, 1), 10);
  scoreEl.textContent = 'Generating quiz...';
  const quiz = await generateQuiz(state.summary, diff);
  state.quiz = quiz.slice(0, desiredCount);
  state.answers = {};
  renderQuiz();
  scoreEl.textContent = '';
  persist();
  startQuizTimer();
};

qs('btn-submit-quiz').onclick = () => {
  if (!state.quiz.length) return alert('Generate a quiz first.');
  let correct = 0;
  const breakdown = [];
  const items = [];
  state.quiz.forEach(q => {
    const ans = Number(state.answers[q.id]);
    const ok = ans === q.correct;
    if (ok) correct++;
    breakdown.push({ q: q.q, correct: ok, exp: q.exp });
    const userAnswer = Number.isNaN(ans) ? 'Not answered' : q.a[ans];
    const correctAnswer = q.a[q.correct];
    items.push(`
      <div class="bg-white/5 border border-white/10 rounded-xl p-3">
        <p class="font-semibold text-slate-100">${q.q}</p>
        <p class="text-sm ${ok ? 'text-emerald-300' : 'text-red-300'}">Your answer: ${userAnswer || '—'} ${ok ? '(Correct)' : '(Incorrect)'}</p>
        <p class="text-sm text-slate-300">Correct answer: ${correctAnswer}</p>
        <p class="text-sm text-slate-400">Explanation: ${q.exp}</p>
      </div>
    `);
  });
  const score = Math.round((correct / state.quiz.length) * 100);
  scoreEl.textContent = `Score: ${score}%`;
  state.history.push({ score, ts: Date.now(), diff: difficultySelect.value, breakdown });
  updateDashboard();
  persist();
  if (quizFeedback) {
    quizFeedback.innerHTML = items.join('');
  }
};

qs('btn-reattempt').onclick = () => {
  state.answers = {};
  renderQuiz();
  scoreEl.textContent = '';
  if (quizFeedback) quizFeedback.innerHTML = '';
};

// Quiz timer (Pomodoro-style for quizzes)
let quizTimer = null;
let quizRemaining = 0;

const formatQuizTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

const updateQuizTimerDisplay = () => {
  if (quizTimerDisplay) quizTimerDisplay.textContent = quizRemaining > 0 ? formatQuizTime(quizRemaining) : '--:--';
};

const clearQuizTimer = () => {
  if (quizTimer) clearInterval(quizTimer);
  quizTimer = null;
};

const startQuizTimer = () => {
  const minutes = Math.min(Math.max(Number(quizTimerMinInput.value) || 25, 5), 180);
  quizRemaining = minutes * 60;
  clearQuizTimer();
  updateQuizTimerDisplay();
  quizTimer = setInterval(() => {
    quizRemaining -= 1;
    if (quizRemaining <= 0) {
      quizRemaining = 0;
      updateQuizTimerDisplay();
      clearQuizTimer();
      scoreEl.textContent = scoreEl.textContent || 'Time is up. You can submit or reattempt.';
      return;
    }
    updateQuizTimerDisplay();
  }, 1000);
};

if (quizTimerStartBtn) {
  quizTimerStartBtn.onclick = () => {
    if (!state.quiz.length) {
      alert('Generate a quiz first.');
      return;
    }
    startQuizTimer();
  };
}

// Dashboard
const updateDashboard = () => {
  const attempts = state.history.length;
  const avg = attempts ? Math.round(state.history.reduce((s,h)=>s+h.score,0)/attempts) : 0;
  qs('dash-avg').textContent = avg + '%';
  qs('dash-attempts').textContent = attempts;
  qs('dash-weak').textContent = attempts ? 'Topics: practice areas in last quiz explanations.' : '—';
  qs('dash-streak').textContent = state.streak + ' days';
  qs('dash-time').textContent = state.studyMinutes + ' min';
  qs('stat-quiz-count').textContent = attempts;
  qs('stat-avg-score').textContent = avg + '%';
  qs('stat-streak').textContent = state.streak + ' days';
};

qs('btn-reset-data').onclick = () => {
  if (!confirm('Reset all progress?')) return;
  Object.assign(state, {notes:'',summary:'',quiz:[],answers:{},history:[],streak:0,studyMinutes:0});
  persist(); updateUIFromState();
};

// Pomodoro
let timer = null, remaining = 25*60, running = false;
const timerDisplay = qs('timer-display');
const sessionType = qs('session-type');
const statusEl = qs('timer-status');

const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const setRemainingFromType = () => {
  remaining = Number(sessionType.value)*60;
  timerDisplay.textContent = formatTime(remaining);
};
sessionType.onchange = setRemainingFromType;

const tick = () => {
  if (remaining <= 0) { clearInterval(timer); running=false; statusEl.textContent='Session complete!'; logStudy(); return; }
  remaining--; timerDisplay.textContent = formatTime(remaining);
};

const logStudy = () => {
  const minutes = Number(sessionType.value);
  state.studyMinutes += minutes;
  state.streak = Math.max(1, state.streak); // placeholder for real streak logic
  updateDashboard(); persist();
};

qs('btn-start').onclick = () => {
  if (running) return;
  running = true; statusEl.textContent='In session...';
  timer = setInterval(tick, 1000);
};
qs('btn-pause').onclick = () => {
  running = false; clearInterval(timer); statusEl.textContent='Paused.';
};
qs('btn-reset').onclick = () => {
  running = false; clearInterval(timer); setRemainingFromType(); statusEl.textContent='Ready to focus.';
};

// UI sync
const updateUIFromState = () => {
  summaryBox.textContent = state.summary || 'No summary yet. Upload notes to generate.';
  heroSummary.textContent = state.summary || 'No summary yet. Upload your notes to begin.';
  renderQuiz();
  updateDashboard();
  setRemainingFromType();
  updateUserUI();
};

qs('cta-start').onclick = () => qs('upload').scrollIntoView({behavior:'smooth'});


const updateUserUI = () => {
  const user = state.user;
  if (user) {
    userChip.classList.remove('hidden');
    btnLogout.classList.remove('hidden');
    userChip.textContent = user.displayName || user.email || 'Logged in';
    btnLogin.textContent = 'Logged in';
  } else {
    userChip.classList.add('hidden');
    btnLogout.classList.add('hidden');
    btnLogin.textContent = 'Login';
  }
};

btnLogin.onclick = () => {
  loginModal.classList.remove('hidden');
  loginModal.classList.add('flex');
  loginError.textContent = '';
};

loginClose.onclick = () => {
  loginModal.classList.add('hidden');
  loginModal.classList.remove('flex');
};

let firebaseApp = null;
let firebaseAuth = null;

const initFirebase = () => {
  if (!window.firebase) throw new Error('Firebase SDK not loaded.');
  if (firebaseApp) return firebaseApp;
  if (!firebaseConfig.apiKey) throw new Error('Please set firebaseConfig in app.js');
  firebaseApp = firebase.initializeApp(firebaseConfig);
  firebaseAuth = firebase.auth();
  firebaseAuth.onAuthStateChanged((user) => {
    state.user = user ? { uid: user.uid, displayName: user.displayName, email: user.email, photoURL: user.photoURL } : null;
    persist();
    updateUserUI();
  });
  return firebaseApp;
};

const attachProfileToState = (photoURL, bio) => {
  const isValidPhoto = (url) => {
    if (!url) return '';
    const lower = url.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) return url;
    return '';
  };
  state.profile.photoURL = isValidPhoto(photoURL);
  state.profile.bio = bio || '';
  persist();
};

loginGoogle.onclick = async () => {
  try {
    initFirebase();
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebaseAuth.signInWithPopup(provider);
    attachProfileToState(loginPhoto.value, loginBio.value);
    loginModal.classList.add('hidden');
    loginModal.classList.remove('flex');
  } catch (err) {
    console.error(err);
    loginError.textContent = 'Google login failed: ' + err.message;
  }
};

loginEmailSubmit.onclick = async () => {
  try {
    initFirebase();
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    if (!email || !password) {
      loginError.textContent = 'Email and password required.';
      return;
    }
    await firebaseAuth.signInWithEmailAndPassword(email, password);
    attachProfileToState(loginPhoto.value, loginBio.value);
    loginModal.classList.add('hidden');
    loginModal.classList.remove('flex');
  } catch (err) {
    // If user not found, optionally create
    if (err.code === 'auth/user-not-found') {
      try {
        await firebaseAuth.createUserWithEmailAndPassword(loginEmail.value.trim(), loginPassword.value);
        attachProfileToState(loginPhoto.value, loginBio.value);
        loginModal.classList.add('hidden');
        loginModal.classList.remove('flex');
        return;
      } catch (e2) {
        loginError.textContent = e2.message;
        return;
      }
    }
    console.error(err);
    loginError.textContent = err.message;
  }
};

btnLogout.onclick = async () => {
  try {
    if (firebaseAuth) {
      await firebaseAuth.signOut();
    }
  } catch (err) {
    console.error(err);
    alert('Logout failed: ' + err.message);
  }
};

// Init
loadState();