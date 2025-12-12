const state = {
  notes: '',
  summary: '',
  quiz: [],
  answers: {},
  history: [],
  streak: 0,
  studyMinutes: 0,
  questionPaper: null,
};

const qs = (id) => document.getElementById(id);

// Persistence
const loadState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) Object.assign(state, JSON.parse(saved));
};
const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

// Router
const router = {
  currentPage: 'home',
  navigate(page) {
    this.currentPage = page;
    this.render();
    window.history.pushState({ page }, '', `#${page}`);
  },
  render() {
    const content = qs('app-content');
    if (!content) return;
    
    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.dataset.page === this.currentPage) {
        link.classList.add('text-indigo-300', 'font-semibold');
      } else {
        link.classList.remove('text-indigo-300', 'font-semibold');
      }
    });

    // Render page
    switch(this.currentPage) {
      case 'home': content.innerHTML = getHomePage(); break;
      case 'upload': content.innerHTML = getUploadPage(); initUploadPage(); break;
      case 'summary': content.innerHTML = getSummaryPage(); initSummaryPage(); break;
      case 'quiz': content.innerHTML = getQuizPage(); initQuizPage(); break;
      case 'dashboard': content.innerHTML = getDashboardPage(); initDashboardPage(); break;
      case 'pomodoro': content.innerHTML = getPomodoroPage(); initPomodoroPage(); break;
      case 'admin': content.innerHTML = getAdminPage(); initAdminPage(); break;
      case 'predictor': content.innerHTML = getPredictorPage(); initPredictorPage(); break;
      default: content.innerHTML = getHomePage();
    }
  }
};



// Handle browser back/forward
window.onpopstate = (e) => {
  if (e.state) {
    router.currentPage = e.state.page;
    router.render();
  }
};

// Navigation links
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      router.navigate(link.dataset.page);
    };
  });

  // Mobile menu
  const mobileMenuBtn = qs('mobile-menu-btn');
  const mobileMenu = qs('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.onclick = () => {
      mobileMenu.classList.toggle('hidden');
    };
  }

  // Initial render
  const hash = window.location.hash.slice(1) || 'home';
  router.currentPage = hash;
  router.render();
});

// Page Templates
function getHomePage() {
  const attempts = state.history.length;
  const avg = attempts ? Math.round(state.history.reduce((s,h)=>s+h.score,0)/attempts) : 0;
  return `
    <div class="space-y-10">
      <section class="glass rounded-3xl p-8 border border-white/5">
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <div class="space-y-4">
            <p class="text-xs uppercase tracking-[0.3em] text-indigo-300">Revise faster. Learn smarter.</p>
            <h2 class="text-3xl md:text-4xl font-bold text-white">Upload notes, get summaries, generate quizzes, track progress, stay consistent.</h2>
            <p class="text-slate-300">AI summaries, MCQs by difficulty, performance analytics, and a Pomodoro timer—everything in one place.</p>
            <div class="flex flex-wrap gap-3">
              <button onclick="router.navigate('upload')" class="px-4 py-2 rounded-lg gradient text-slate-900 font-semibold hover:opacity-90 transition">Get Started</button>
              <button onclick="router.navigate('dashboard')" class="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-slate-100 hover:bg-white/20 transition">View Dashboard</button>
            </div>
          </div>
          <div class="glass border border-indigo-500/30 rounded-2xl p-6 bg-indigo-500/5">
            <p class="text-sm text-indigo-200 mb-3">Quick Summary</p>
            <p class="text-slate-100 text-sm leading-6">${state.summary || 'No summary yet. Upload your notes to begin.'}</p>
            <div class="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-200">
              <div class="bg-white/5 rounded-lg p-3">
                <p class="text-slate-400">Quizzes</p>
                <p class="text-lg font-semibold">${attempts}</p>
              </div>
              <div class="bg-white/5 rounded-lg p-3">
                <p class="text-slate-400">Avg Score</p>
                <p class="text-lg font-semibold">${avg}%</p>
              </div>
              <div class="bg-white/5 rounded-lg p-3">
                <p class="text-slate-400">Streak</p>
                <p class="text-lg font-semibold">${state.streak} days</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div class="grid md:grid-cols-3 gap-6">
        <div onclick="router.navigate('upload')" class="glass rounded-2xl p-6 border border-white/5 cursor-pointer hover:border-indigo-400/50 transition">
          <p class="text-indigo-300 text-sm mb-2">Step 1</p>
          <h3 class="text-xl font-bold text-white mb-2">Upload Notes</h3>
          <p class="text-slate-300 text-sm">Upload up to 5 files or paste text to get started</p>
        </div>
        <div onclick="router.navigate('summary')" class="glass rounded-2xl p-6 border border-white/5 cursor-pointer hover:border-indigo-400/50 transition">
          <p class="text-indigo-300 text-sm mb-2">Step 2</p>
          <h3 class="text-xl font-bold text-white mb-2">AI Summary</h3>
          <p class="text-slate-300 text-sm">Get concise, structured summaries of your notes</p>
        </div>
        <div onclick="router.navigate('quiz')" class="glass rounded-2xl p-6 border border-white/5 cursor-pointer hover:border-indigo-400/50 transition">
          <p class="text-indigo-300 text-sm mb-2">Step 3</p>
          <h3 class="text-xl font-bold text-white mb-2">Practice Quiz</h3>
          <p class="text-slate-300 text-sm">Generate MCQs by difficulty and test your knowledge</p>
        </div>
      </div>
    </div>
  `;
}

function getUploadPage() {
  return `
    <section class="glass rounded-3xl p-8 border border-white/5">
      <div class="flex items-center justify-between mb-6">
        <div>
          <p class="text-xs text-indigo-300 uppercase tracking-[0.3em]">Step 1</p>
          <h3 class="text-2xl font-bold text-white">Upload & Extract</h3>
          <p class="text-slate-300 text-sm">PDF / text / image. Upload up to 5 files.</p>
        </div>
        <span class="px-3 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">Secure · Private</span>
      </div>
      <div class="grid md:grid-cols-2 gap-4 mb-4">
        <label class="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col gap-3 items-center justify-center cursor-pointer hover:border-indigo-400/50 transition min-h-[200px]">
          <input id="file-input" type="file" class="hidden" accept=".pdf,.txt,image/*" multiple />
          <svg class="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p class="text-slate-200 font-semibold text-center">Drop your notes or click to upload</p>
          <p class="text-slate-400 text-sm text-center">Upload up to 5 files (PDF, TXT, or images for OCR)</p>
        </label>
        <div class="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
          <p class="text-sm text-slate-200 font-semibold">Or paste text</p>
          <textarea id="text-input" class="w-full h-32 bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Paste your notes here..."></textarea>
          <button id="btn-process" class="w-full py-2 rounded-lg gradient text-slate-900 font-semibold hover:opacity-90 transition">Process Notes</button>
          <p class="text-[11px] text-slate-400">Backend integration will handle AI processing.</p>
        </div>
      </div>
      <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
        <p class="text-sm text-slate-200 font-semibold mb-2">Selected files</p>
        <ul id="file-list" class="text-sm text-slate-300 space-y-1">
          <li class="text-slate-500">No files selected.</li>
        </ul>
      </div>
    </section>
  `;
}

function getSummaryPage() {
  return `
    <section class="glass rounded-3xl p-8 border border-white/5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs text-indigo-300 uppercase tracking-[0.3em]">Step 2</p>
          <h3 class="text-2xl font-bold text-white">AI Summary Generator</h3>
          <p class="text-slate-300 text-sm">Structured, concise, topic-aware summaries.</p>
        </div>
        <button id="btn-refresh-summary" class="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm hover:bg-white/20 transition">Regenerate</button>
      </div>
      <div id="summary-content" class="bg-slate-900/50 border border-white/10 rounded-2xl p-5 text-sm text-slate-200 min-h-[400px] whitespace-pre-line leading-relaxed">
        ${state.summary || 'No summary yet. Upload notes to generate.'}
      </div>
      ${state.summary ? '<div class="mt-4"><button onclick="router.navigate(\'quiz\')" class="px-4 py-2 rounded-lg gradient text-slate-900 font-semibold hover:opacity-90 transition">Generate Quiz from Summary</button></div>' : ''}
    </section>
  `;
}

function getQuizPage() {
  return `
    <section class="glass rounded-3xl p-8 border border-white/5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs text-indigo-300 uppercase tracking-[0.3em]">Step 3</p>
          <h3 class="text-2xl font-bold text-white">AI Quiz Generator</h3>
          <p class="text-slate-300 text-sm">MCQs with explanations by difficulty.</p>
        </div>
        <div class="flex flex-wrap gap-2 items-center">
          <select id="difficulty" class="bg-slate-900/70 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
          <input id="mcq-count" type="number" min="1" max="10" value="5" class="w-24 bg-slate-900/70 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" title="Number of MCQs (1-10)" />
          <input id="quiz-timer-min" type="number" min="5" max="120" value="25" class="w-24 bg-slate-900/70 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" title="Quiz timer minutes" />
          <button id="btn-generate-quiz" class="px-4 py-2 rounded-lg gradient text-slate-900 font-semibold hover:opacity-90 transition">Generate</button>
        </div>
      </div>
      <div class="flex items-center gap-3 mb-3">
        <div class="text-sm text-slate-300">Quiz Timer: <span id="quiz-timer-display" class="font-semibold text-white">--:--</span></div>
        <button id="quiz-timer-start" class="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm hover:bg-white/20 transition">Start/Reset</button>
      </div>
      <div id="quiz-area" class="space-y-4"></div>
      <div id="quiz-feedback" class="mt-4 text-sm text-slate-200 space-y-2"></div>
      <p id="quiz-score" class="text-slate-200 mt-2"></p>
      <div class="flex gap-3 mt-4 justify-center">
        <button id="btn-submit-quiz" class="px-4 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 transition">Submit</button>
        <button id="btn-reattempt" class="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">Reattempt</button>
        <button id="btn-reset-quiz" class="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 hover:bg-red-500/20 transition">Reset</button>
      </div>
    </section>
  `;
}

function getDashboardPage() {
  const attempts = state.history.length;
  const avg = attempts ? Math.round(state.history.reduce((s,h)=>s+h.score,0)/attempts) : 0;
  return `
    <section class="glass rounded-3xl p-8 border border-white/5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs text-indigo-300 uppercase tracking-[0.3em]">Analytics</p>
          <h3 class="text-2xl font-bold text-white">Progress Dashboard</h3>
          <p class="text-slate-300 text-sm">Accuracy, weak topics, streaks, study time.</p>
        </div>
        <button id="btn-reset-data" class="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-200 hover:bg-red-500/20 transition">Reset</button>
      </div>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-indigo-400/30 transition">
          <p class="text-slate-400 text-sm">Avg Score</p>
          <p id="dash-avg" class="text-2xl font-bold text-white">${avg}%</p>
        </div>
        <div class="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-indigo-400/30 transition">
          <p class="text-slate-400 text-sm">Attempts</p>
          <p id="dash-attempts" class="text-2xl font-bold text-white">${attempts}</p>
        </div>
        <div class="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-indigo-400/30 transition">
          <p class="text-slate-400 text-sm">Streak</p>
          <p id="dash-streak" class="text-2xl font-bold text-white">${state.streak} days</p>
        </div>
      </div>
      <div class="mt-4 bg-white/5 rounded-2xl p-4 border border-white/10">
        <p class="text-slate-300 text-sm mb-2">Study time (Pomodoro)</p>
        <p id="dash-time" class="text-lg font-semibold text-white">${state.studyMinutes} min</p>
      </div>
    </section>
  `;
}

function getPomodoroPage() {
  return `
    <section class="glass rounded-3xl p-8 border border-white/5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs text-indigo-300 uppercase tracking-[0.3em]">Focus</p>
          <h3 class="text-2xl font-bold text-white">Pomodoro Timer</h3>
          <p class="text-slate-300 text-sm">25/50 focus, short/long breaks; logs time to dashboard.</p>
        </div>
        <select id="session-type" class="bg-slate-900/70 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
          <option value="25">Focus 25m</option>
          <option value="50">Focus 50m</option>
          <option value="5">Short Break 5m</option>
          <option value="15">Long Break 15m</option>
        </select>
      </div>
      <div class="flex items-center gap-4">
        <div class="w-32 h-32 rounded-full border-4 border-indigo-400/60 flex items-center justify-center text-3xl font-bold" id="timer-display">25:00</div>
        <div class="space-x-2">
          <button id="btn-start" class="px-4 py-2 rounded-lg gradient text-slate-900 font-semibold hover:opacity-90 transition">Start</button>
          <button id="btn-pause" class="px-4 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 transition">Pause</button>
          <button id="btn-reset" class="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">Reset</button>
        </div>
      </div>
      <p id="timer-status" class="text-slate-300 text-sm mt-3">Ready to focus.</p>
    </section>
  `;
}

function getAdminPage() {
  const totalUsers = 1; // Mock data
  const totalQuizzes = state.history.length;
  const totalStudyTime = state.studyMinutes;
  return `
    <section class="glass rounded-3xl p-8 border border-white/5">
      <div class="mb-6">
        <p class="text-xs text-purple-300 uppercase tracking-[0.3em]">Administration</p>
        <h3 class="text-2xl font-bold text-white">Admin Panel</h3>
        <p class="text-slate-300 text-sm">Manage system settings and view analytics.</p>
      </div>
      <div class="grid md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
          <p class="text-slate-400 text-sm">Total Users</p>
          <p class="text-2xl font-bold text-white">${totalUsers}</p>
        </div>
        <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
          <p class="text-slate-400 text-sm">Total Quizzes</p>
          <p class="text-2xl font-bold text-white">${totalQuizzes}</p>
        </div>
        <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
          <p class="text-slate-400 text-sm">Total Study Time</p>
          <p class="text-2xl font-bold text-white">${totalStudyTime} min</p>
        </div>
      </div>
      <div class="space-y-4">
        <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h4 class="text-lg font-semibold text-white mb-3">System Settings</h4>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-slate-300">Max file uploads per user</span>
              <input type="number" value="5" class="w-20 bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1 text-sm" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-300">Max MCQs per quiz</span>
              <input type="number" value="10" class="w-20 bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1 text-sm" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-300">Enable email notifications</span>
              <input type="checkbox" class="w-5 h-5" />
            </div>
          </div>
        </div>
        <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h4 class="text-lg font-semibold text-white mb-3">Recent Activity</h4>
          <div class="space-y-2 text-sm text-slate-300">
            ${state.history.slice(-5).reverse().map(h => `
              <div class="flex justify-between py-2 border-b border-white/5">
                <span>Quiz completed - ${h.score}%</span>
                <span class="text-slate-400">${new Date(h.ts).toLocaleDateString()}</span>
              </div>
            `).join('') || '<p class="text-slate-500">No recent activity</p>'}
          </div>
        </div>
      </div>
    </section>
  `;
}

// Mock functions
const generateSummary = async (text) => {
  if (!text.trim()) return 'No content found.';
  await new Promise(resolve => setTimeout(resolve, 1000));
  const words = text.split(/\s+/).slice(0, 50).join(' ');
  return `• Key Concepts: ${words}...\n• Main Topics: Extracted from your notes\n• Important Points: Review these sections for better understanding\n• Study Tips: Practice with quizzes to reinforce learning`;
};

const generateQuiz = async (summary, difficulty) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const baseQuestions = [
    { q: 'What is the main concept discussed in the notes?', a: ['Concept A', 'Main concept from summary', 'Concept C', 'Concept D'], correct: 1, exp: 'The main concept is clearly outlined in the summary.' },
    { q: 'Which topic requires more attention?', a: ['Topic 1', 'Topic 2', 'Both topics need review', 'None'], correct: 2, exp: 'Both topics appear to need additional study time.' },
    { q: 'What is the recommended study approach?', a: ['Skip it', 'Cram everything', 'Practice with quizzes', 'Ignore'], correct: 2, exp: 'Regular practice with quizzes helps reinforce learning.' },
    { q: 'Which section is most important?', a: ['Section A', 'Section B', 'All sections are important', 'Section D'], correct: 2, exp: 'All sections contribute to understanding the topic.' },
    { q: 'How should you review the material?', a: ['Once is enough', 'Multiple times with breaks', 'Never review', 'Only before exam'], correct: 1, exp: 'Spaced repetition with breaks improves retention.' },
  ];
  if (difficulty === 'Hard') {
    baseQuestions.forEach(q => { q.q = q.q.replace('main', 'complex').replace('important', 'critical'); });
  } else if (difficulty === 'Easy') {
    baseQuestions.forEach(q => { q.q = q.q.replace('requires', 'needs').replace('recommended', 'suggested'); });
  }
  return baseQuestions.map((o, i) => ({ ...o, id: i, difficulty }));
};

// Page Initializers
let fileQueue = [];
let predictorFileQueue = [];
let quizTimer = null, quizRemaining = 0;
let timer = null, remaining = 25*60, running = false;

function initUploadPage() {
  const fileInput = qs('file-input');
  const textInput = qs('text-input');
  const fileListEl = qs('file-list');
  
  const renderFileList = (files) => {
    if (!fileListEl) return;
    if (!files.length) {
      fileListEl.innerHTML = '<li class="text-slate-500">No files selected.</li>';
      return;
    }
    fileListEl.innerHTML = files.map((f, idx) => 
      `<li class="flex justify-between gap-2"><span>${idx + 1}. ${f.name}</span><span class="text-xs text-slate-400">${Math.round(f.size/1024)} KB</span></li>`
    ).join('');
  };

  fileInput.onchange = () => {
    const newFiles = Array.from(fileInput.files || []);
    if (!newFiles.length) return;
    const beforeCount = fileQueue.length;
    fileQueue = [...fileQueue, ...newFiles].slice(0, 5);
    if (fileQueue.length === 5 && beforeCount < 5) {
      alert('You reached the 5-file limit. Extra files were ignored.');
    }
    renderFileList(fileQueue);
  };

  qs('btn-process').onclick = async () => {
    let text = textInput.value.trim();
    const fileTexts = await Promise.all(fileQueue.map(async (file) => {
      if (file.type === 'text/plain') return await file.text();
      return `[Placeholder] Extracted text from file "${file.name}" via OCR/Parser.`;
    }));
    const combinedFileText = fileTexts.map((content, idx) => `--- File ${idx + 1}: ${fileQueue[idx].name} ---\n${content}`).join('\n\n');
    const finalText = [text, combinedFileText].filter(Boolean).join('\n\n');
    if (!finalText) return alert('Please upload or paste notes.');
    state.notes = finalText;
    const summary = await generateSummary(finalText);
    state.summary = summary;
    persist();
    router.navigate('summary');
  };
}

function initSummaryPage() {
  qs('btn-refresh-summary').onclick = async () => {
    if (!state.notes) return alert('Upload notes first.');
    const summary = await generateSummary(state.notes);
    state.summary = summary;
    persist();
    router.render();
  };
}

function initQuizPage() {
  const quizArea = qs('quiz-area');
  const scoreEl = qs('quiz-score');
  const difficultySelect = qs('difficulty');
  const mcqCountInput = qs('mcq-count');
  const quizTimerMinInput = qs('quiz-timer-min');
  const quizTimerDisplay = qs('quiz-timer-display');
  const quizTimerStartBtn = qs('quiz-timer-start');
  const quizFeedback = qs('quiz-feedback');

  const renderQuiz = () => {
    quizArea.innerHTML = '';
    state.quiz.forEach((q) => {
      const card = document.createElement('div');
      card.className = 'bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2';
      card.innerHTML = `<p class="text-slate-100 font-semibold">${q.q}</p>`;
      q.a.forEach((opt, idx) => {
        const label = document.createElement('label');
        label.className = 'flex gap-2 items-center text-sm text-slate-200 cursor-pointer hover:text-white transition';
        label.innerHTML = `<input type="radio" name="q-${q.id}" value="${idx}" ${state.answers[q.id] == idx ? 'checked' : ''} onchange="state.answers[${q.id}]=${idx}"> ${opt}`;
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
    const items = [];
    state.quiz.forEach(q => {
      const ans = Number(state.answers[q.id]);
      const ok = ans === q.correct;
      if (ok) correct++;
      const userAnswer = Number.isNaN(ans) ? 'Not answered' : q.a[ans];
      const correctAnswer = q.a[q.correct];
      items.push(`<div class="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2"><p class="font-semibold text-slate-100">${q.q}</p><p class="text-sm ${ok ? 'text-emerald-300' : 'text-red-300'}">Your answer: ${userAnswer || '—'} ${ok ? '✓ Correct' : '✗ Incorrect'}</p><p class="text-sm text-slate-300">Correct answer: ${correctAnswer}</p><p class="text-sm text-slate-400 italic">Explanation: ${q.exp}</p></div>`);
    });
    const score = Math.round((correct / state.quiz.length) * 100);
    scoreEl.textContent = `Score: ${score}% (${correct}/${state.quiz.length} correct)`;
    scoreEl.className = score >= 70 ? 'text-emerald-300 font-semibold mt-2' : score >= 50 ? 'text-yellow-300 font-semibold mt-2' : 'text-red-300 font-semibold mt-2';
    state.history.push({ score, ts: Date.now(), diff: difficultySelect.value, breakdown: [] });
    persist();
    if (quizFeedback) quizFeedback.innerHTML = '<p class="text-slate-300 font-semibold mb-2">Detailed Feedback:</p>' + items.join('');
  };

  qs('btn-reattempt').onclick = () => {
    state.answers = {};
    renderQuiz();
    scoreEl.textContent = '';
    scoreEl.className = 'text-slate-200 mt-2';
    if (quizFeedback) quizFeedback.innerHTML = '';
  };

  qs('btn-reset-quiz').onclick = () => {
    if (!confirm('Reset quiz? This will clear all questions and answers.')) return;
    state.quiz = [];
    state.answers = {};
    renderQuiz();
    scoreEl.textContent = '';
    scoreEl.className = 'text-slate-200 mt-2';
    if (quizFeedback) quizFeedback.innerHTML = '';
    persist();
  };

  const formatQuizTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const updateQuizTimerDisplay = () => {
    if (quizTimerDisplay) {
      quizTimerDisplay.textContent = quizRemaining > 0 ? formatQuizTime(quizRemaining) : '--:--';
      quizTimerDisplay.className = quizRemaining < 60 ? 'font-semibold text-red-300' : 'font-semibold text-white';
    }
  };
  const clearQuizTimer = () => { if (quizTimer) clearInterval(quizTimer); quizTimer = null; };
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
        if (!scoreEl.textContent) {
          scoreEl.textContent = 'Time is up! Please submit your answers.';
          scoreEl.className = 'text-yellow-300 font-semibold mt-2';
        }
        return;
      }
      updateQuizTimerDisplay();
    }, 1000);
  };
  if (quizTimerStartBtn) quizTimerStartBtn.onclick = () => { if (!state.quiz.length) { alert('Generate a quiz first.'); return; } startQuizTimer(); };
  renderQuiz();
}

function initDashboardPage() {
  qs('btn-reset-data').onclick = () => {
    if (!confirm('Reset all progress? This cannot be undone.')) return;
    Object.assign(state, {notes:'',summary:'',quiz:[],answers:{},history:[],streak:0,studyMinutes:0});
    persist();
    router.render();
  };
}

function initPomodoroPage() {
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
    if (remaining <= 0) {
      clearInterval(timer);
      running = false;
      statusEl.textContent = 'Session complete! Great work!';
      statusEl.className = 'text-emerald-300 text-sm mt-3';
      const minutes = Number(sessionType.value);
      state.studyMinutes += minutes;
      state.streak = Math.max(1, state.streak);
      persist();
      return;
    }
    remaining--;
    timerDisplay.textContent = formatTime(remaining);
    if (remaining < 60) timerDisplay.className = 'w-32 h-32 rounded-full border-4 border-red-400/60 flex items-center justify-center text-3xl font-bold';
  };
  qs('btn-start').onclick = () => {
    if (running) return;
    running = true;
    statusEl.textContent = 'In session... Stay focused!';
    statusEl.className = 'text-indigo-300 text-sm mt-3';
    timerDisplay.className = 'w-32 h-32 rounded-full border-4 border-indigo-400/60 flex items-center justify-center text-3xl font-bold';
    timer = setInterval(tick, 1000);
  };
  qs('btn-pause').onclick = () => {
    running = false;
    clearInterval(timer);
    statusEl.textContent = 'Paused. Click Start to continue.';
    statusEl.className = 'text-yellow-300 text-sm mt-3';
  };
  qs('btn-reset').onclick = () => {
    running = false;
    clearInterval(timer);
    setRemainingFromType();
    statusEl.textContent = 'Ready to focus.';
    statusEl.className = 'text-slate-300 text-sm mt-3';
    timerDisplay.className = 'w-32 h-32 rounded-full border-4 border-indigo-400/60 flex items-center justify-center text-3xl font-bold';
  };
  setRemainingFromType();
}

function getPredictorPage() {
  return `
    <section class="glass rounded-3xl p-8 border border-white/5">
      <div class="flex items-center justify-between mb-6">
        <div>
          <p class="text-xs text-emerald-300 uppercase tracking-[0.3em]">AI Feature</p>
          <h3 class="text-2xl font-bold text-white">Question Paper Predictor</h3>
          <p class="text-slate-300 text-sm">Upload past papers or question images to predict likely exam questions.</p>
        </div>
        <span class="px-3 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">AI-Powered</span>
      </div>
      <div class="grid md:grid-cols-2 gap-4 mb-4">
        <label class="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col gap-3 items-center justify-center cursor-pointer hover:border-emerald-400/50 transition min-h-[200px]">
          <input id="predictor-file-input" type="file" class="hidden" accept=".pdf,image/*" multiple />
          <svg class="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p class="text-slate-200 font-semibold text-center">Upload past papers or question images</p>
          <p class="text-slate-400 text-sm text-center">PDF or image files (JPG, PNG)</p>
        </label>
        <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
          <p class="text-sm text-slate-200 font-semibold mb-2">Uploaded files</p>
          <ul id="predictor-file-list" class="text-sm text-slate-300 space-y-1 mb-4">
            <li class="text-slate-500">No files selected.</li>
          </ul>
          <button id="btn-predict" class="w-full py-2 rounded-lg gradient text-slate-900 font-semibold hover:opacity-90 transition">Predict Questions</button>
          <p class="text-[11px] text-slate-400 mt-2">AI will analyze patterns and predict likely exam questions.</p>
        </div>
      </div>
      <div id="predictor-results" class="bg-slate-900/50 border border-white/10 rounded-2xl p-5 min-h-[200px]">
        <p class="text-slate-400 text-sm">Predicted questions will appear here after analysis...</p>
      </div>
    </section>
  `;
}

function initPredictorPage() {
  const predictorFileInput = qs('predictor-file-input');
  const predictorFileList = qs('predictor-file-list');
  const predictorResults = qs('predictor-results');
  predictorFileQueue = [];

  const renderPredictorFileList = (files) => {
    if (!predictorFileList) return;
    if (!files.length) {
      predictorFileList.innerHTML = '<li class="text-slate-500">No files selected.</li>';
      return;
    }
    predictorFileList.innerHTML = files.map((f, idx) => 
      `<li class="flex justify-between gap-2 items-center">
        <span>${idx + 1}. ${f.name}</span>
        <span class="text-xs text-slate-400">${Math.round(f.size/1024)} KB</span>
        <button onclick="removePredictorFile(${idx})" class="text-red-400 hover:text-red-300 text-xs px-1">×</button>
      </li>`
    ).join('');
  };

  window.removePredictorFile = (idx) => {
    predictorFileQueue = predictorFileQueue.filter((_, i) => i !== idx);
    renderPredictorFileList(predictorFileQueue);
  };

  predictorFileInput.onchange = () => {
    const newFiles = Array.from(predictorFileInput.files || []);
    if (!newFiles.length) return;
    predictorFileQueue = [...predictorFileQueue, ...newFiles].slice(0, 10);
    renderPredictorFileList(predictorFileQueue);
  };

  qs('btn-predict').onclick = async () => {
    if (!predictorFileQueue.length) return alert('Please upload at least one file.');
    predictorResults.innerHTML = '<p class="text-slate-300">Analyzing patterns and predicting questions...</p>';
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock predicted questions
    const predictedQuestions = [
      'Explain the concept of photosynthesis and its importance in plant biology.',
      'Calculate the derivative of f(x) = x² + 3x - 5.',
      'Describe the process of DNA replication in eukaryotic cells.',
      'Solve the quadratic equation: 2x² - 7x + 3 = 0',
      'What are the main causes and effects of climate change?',
      'Analyze the themes in Shakespeare\'s "Romeo and Juliet".',
      'Compare and contrast mitosis and meiosis.',
      'Explain Newton\'s three laws of motion with examples.',
    ];
    
    const randomQuestions = predictedQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);
    
    predictorResults.innerHTML = `
      <div class="space-y-3">
        <p class="text-emerald-300 font-semibold mb-3">Predicted Questions (Based on ${predictorFileQueue.length} file(s)):</p>
        ${randomQuestions.map((q, idx) => `
          <div class="bg-white/5 border border-white/10 rounded-xl p-3">
            <p class="text-slate-200"><span class="text-emerald-300 font-semibold">Q${idx + 1}:</span> ${q}</p>
          </div>
        `).join('')}
        <p class="text-slate-400 text-sm mt-4 italic">These predictions are based on pattern analysis of uploaded materials. Review all topics for comprehensive preparation.</p>
      </div>
    `;
    
    state.questionPaper = { files: predictorFileQueue.map(f => f.name), questions: randomQuestions, timestamp: Date.now() };
    persist();
  };
}

function initAdminPage() {
  // Admin page is mostly static but can add functionality here
}

loadState();
