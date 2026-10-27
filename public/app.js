const socket = window.io();
const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
if (!app || !toast) throw new Error('Nie znaleziono elementów strony.');
const identityKey = 'quiz-live-identity';

let questionCount = 10;
let roomState = null;
let identity = readIdentity();
let toastTimeout;
let timerRenderTimeout;

function readIdentity() {
  try {
    return JSON.parse(localStorage.getItem(identityKey) || 'null');
  } catch {
    return null;
  }
}

function saveIdentity(nextIdentity) {
  identity = nextIdentity;
  localStorage.setItem(identityKey, JSON.stringify(nextIdentity));
}

function clearIdentity() {
  identity = null;
  localStorage.removeItem(identityKey);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 3600);
}

function emit(event, payload) {
  return new Promise((resolve) => {
    socket.emit(event, payload, (response) => {
      if (!response?.ok) {
        showToast(response?.error || 'Nie udało się wykonać tej akcji.');
        resolve(null);
        return;
      }
      resolve(response);
    });
  });
}

function render() {
  if (roomState && identity) {
    if (roomState.phase === 'lobby') renderLobby();
    else if (roomState.phase === 'finished') renderFinished();
    else renderQuestion();
    return;
  }
  renderHome();
}

function renderHome() {
  const roomFromUrl = new URLSearchParams(location.search).get('room') || '';
  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow"><span class="sparkle">✦</span> Twoja ekipa. Jedna gra.</span>
        <h1>Myśl szybko.<br><span>Graj razem.</span></h1>
        <p>Stwórz quiz, zaproś znajomych i zobacz, kto zgarnie pierwsze miejsce.</p>
        <div class="hero-points">
          <span><span class="check">✓</span> Działa na telefonie</span>
          <span><span class="check">✓</span> Bez kont i aplikacji</span>
        </div>
      </div>
      <div class="home-cards">
        <button class="host-card" data-action="open-builder">
          <span class="card-icon host-icon">✎</span>
          <span class="card-text"><strong>Stwórz quiz</strong><small>Ty prowadzisz, inni grają</small></span>
          <span class="card-arrow">↗</span>
        </button>
        <form class="join-card" data-action="join">
          <div class="join-card-heading"><span class="card-icon join-icon">⌁</span><span><strong>Dołącz do gry</strong><small>Masz kod od prowadzącego?</small></span></div>
          <label class="sr-only" for="room-code">Kod pokoju</label>
          <input id="room-code" class="code-input" name="code" placeholder="KOD GRY" maxlength="5" autocomplete="one-time-code" value="${escapeHtml(roomFromUrl.toUpperCase())}" required>
          <label class="sr-only" for="player-name">Twój nick</label>
          <input id="player-name" class="name-input" name="name" placeholder="Jak mamy Cię nazywać?" maxlength="20" required>
          <button class="button button-primary full-width" type="submit">Dołącz do gry <span>→</span></button>
        </form>
        <div class="home-footnote"><span class="shield">◇</span> Darmowa rozgrywka. Bez kluczy API.</div>
      </div>
    </section>
    <section class="how-it-works">
      <div><span class="step-number">01</span><div><strong>Wybierz liczbę pytań</strong><small>Resztę wylosuje quiz.</small></div></div>
      <span class="step-connector"></span>
      <div><span class="step-number">02</span><div><strong>Udostępnij kod</strong><small>Znajomi dołączają z telefonu.</small></div></div>
      <span class="step-connector"></span>
      <div><span class="step-number">03</span><div><strong>Wygraj rundę</strong><small>Szybka odpowiedź = więcej punktów.</small></div></div>
    </section>`;
}

function renderBuilder() {
  app.innerHTML = `
    <section class="builder-page">
      <button class="back-link" type="button" data-action="home">← Wróć</button>
      <div class="builder-header"><span class="eyebrow">NOWA ROZGRYWKA</span><h1>Ty wybierasz <span>ile.</span></h1><p>Pytania i kolejność odpowiedzi wylosujemy z puli.</p></div>
      <form data-action="create-room" class="builder-form">
        <label class="field-label question-count-label" for="question-count">Liczba pytań
          <select id="question-count" class="question-count-select" name="questionCount">
            ${[5, 10, 15, 20, 25].map((count) => `<option value="${count}" ${questionCount === count ? 'selected' : ''}>${count} pytań</option>`).join('')}
          </select>
        </label>
        <div class="random-quiz-note"><span class="sparkle">✦</span><span><strong>Każda gra jest inna</strong><small>Pytania nie powtarzają się w jednej rozgrywce.</small></span></div>
        <div class="builder-submit"><span>Możesz od razu zaprosić graczy.</span><button class="button button-primary" type="submit">Losuj i utwórz pokój <span>→</span></button></div>
      </form>
    </section>`;
}

function renderLobby() {
  const isHost = identity.role === 'host';
  const connectedPlayers = roomState.ranking.filter((player) => player.connected);
  app.innerHTML = `
    <section class="lobby-page">
      <div class="lobby-top"><span class="eyebrow"><span class="online-dot"></span> ${isHost ? 'POKÓJ GOTOWY' : 'DOŁĄCZONO DO GRY'}</span><button class="back-link" data-action="leave" type="button">Opuść pokój</button></div>
      <div class="lobby-layout">
        <div class="lobby-main">
          <span class="eyebrow">QUIZ</span><h1>${escapeHtml(roomState.title)}</h1>
          <p>${isHost ? 'Pokaż kod ekipie. Gdy wszyscy będą gotowi — startujemy!' : 'Czekasz na prowadzącego. Za chwilę zaczynamy!'}</p>
          ${isHost ? `<div class="room-code-card"><span>KOD DOŁĄCZENIA</span><strong>${escapeHtml(roomState.code)}</strong><button class="copy-code" data-action="copy" type="button">Kopiuj kod</button></div>
          <div class="qr-card"><img class="qr-image" alt="Kod QR do dołączenia do pokoju" src="/api/qr/${encodeURIComponent(roomState.code)}"><span><strong>Zeskanuj i dołącz</strong><small>Otwórz aparat w telefonie</small></span></div>
          <button class="button button-primary start-button" data-action="start" type="button" ${connectedPlayers.length === 0 ? 'disabled' : ''}>Rozpocznij quiz <span>→</span></button>`
          : `<div class="waiting-pulse"><span class="pulse-ring"></span><span>Jesteś na liście graczy</span></div>`}
          <div class="lobby-meta"><span>${roomState.totalQuestions} pytań</span><span>·</span><span>15 sekund na odpowiedź</span></div>
        </div>
        <aside class="players-panel"><div class="players-title"><div><h2>Gracze</h2><p>Ekipa w pokoju</p></div><span class="player-count">${connectedPlayers.length}</span></div>
          ${connectedPlayers.length ? `<ol class="player-list">${connectedPlayers.map((player, index) => `<li><span class="player-avatar avatar-${index % 5}">${escapeHtml(player.name.slice(0, 1).toUpperCase())}</span><span>${escapeHtml(player.name)}</span><span class="player-ready">●</span></li>`).join('')}</ol>`
          : '<div class="empty-players"><span>♧</span><strong>Tu zaraz będzie tłoczno</strong><small>Udostępnij kod i poczekaj na graczy.</small></div>'}
        </aside>
      </div>
    </section>`;
}

function renderQuestion() {
  clearTimeout(timerRenderTimeout);
  const question = roomState.question;
  if (!question) return render();
  const isHost = identity.role === 'host';
  const revealed = roomState.phase === 'reveal';
  const remaining = Math.max(0, Math.ceil((question.endsAt - Date.now()) / 1000));
  const choices = question.options.map((option, index) => {
    const correct = revealed && index === question.correctIndex;
    const wrong = revealed && index !== question.correctIndex;
    return `<div class="answer-tile tile-${index} ${correct ? 'correct-tile' : ''} ${wrong ? 'dimmed-tile' : ''}">
      <span class="tile-letter">${String.fromCharCode(65 + index)}</span><span class="tile-text">${escapeHtml(option)}</span>
      ${correct ? '<span class="tile-mark">✓</span>' : ''}
      ${!isHost && !revealed ? `<button data-action="answer" data-index="${index}" type="button" aria-label="Odpowiedź: ${escapeHtml(option)}" ${roomState.hasAnswered ? 'disabled' : ''}></button>` : ''}
    </div>`;
  }).join('');
  app.innerHTML = `
    <section class="game-page">
      <div class="game-top"><a class="brand" href="/"><span class="brand-mark">Q</span><span>quiz<span class="brand-accent">live</span></span></a><span class="game-room-code">POKÓJ <strong>${escapeHtml(roomState.code)}</strong></span><span class="question-progress">PYTANIE ${roomState.currentIndex + 1} <span>/ ${roomState.totalQuestions}</span></span></div>
      <div class="game-summary"><span class="eyebrow">${escapeHtml(roomState.title)}</span><span>${isHost ? `${roomState.playersAnswered} / ${roomState.playerCount} odpowiedzi` : (roomState.hasAnswered ? 'Odpowiedź zapisana!' : 'Wybierz odpowiedź')}</span></div>
      <div class="timer-bar"><span style="width:${revealed ? 0 : Math.max(0, Math.min(100, (remaining / 15) * 100))}%"></span></div>
      <div class="question-stage ${isHost ? 'presenter-stage' : ''}">
        <div class="timer-badge ${remaining <= 5 && !revealed ? 'timer-urgent' : ''}">${revealed ? '✓' : remaining}</div>
        <h1>${escapeHtml(question.text)}</h1>
        ${isHost ? '<p class="game-instruction">Gracze wybierają odpowiedź na swoich telefonach</p>' : ''}
        <div class="answer-grid">${choices}</div>
        ${revealed ? `<div class="reveal-panel"><span class="reveal-icon">✦</span><div><strong>Prawidłowa odpowiedź</strong><p>${escapeHtml(question.options[question.correctIndex])}</p></div></div>
          <div class="round-footer">${rankingPreview()}${isHost ? '<button class="button button-primary" data-action="next" type="button">Dalej <span>→</span></button>' : '<span class="waiting-next">Czekamy na kolejne pytanie…</span>'}</div>`
        : (!isHost && roomState.hasAnswered ? '<div class="answer-sent"><span>✓</span> Dobra robota! Odpowiedź zapisana.</div>' : '')}
      </div>
    </section>`;
  if (!revealed) {
    const questionId = question.id;
    timerRenderTimeout = setTimeout(() => {
      if (roomState?.phase === 'question' && roomState.question?.id === questionId) renderQuestion();
    }, 1000);
  }
}

function rankingPreview() {
  const top = roomState.ranking.slice(0, 3);
  return `<div class="round-ranking"><span>RANKING</span>${top.map((player, index) => `<div><span class="rank-medal">${['🥇', '🥈', '🥉'][index]}</span><strong>${escapeHtml(player.name)}</strong><small>${player.score} pkt</small></div>`).join('')}</div>`;
}

function renderFinished() {
  const winner = roomState.ranking[0];
  app.innerHTML = `
    <section class="finished-page">
      <div class="confetti confetti-one"></div><div class="confetti confetti-two"></div>
      <span class="eyebrow"><span class="sparkle">✦</span> TO BYŁA DOBRA GRA</span>
      <h1>Quiz <span>ukończony!</span></h1><p>${escapeHtml(roomState.title)} · ${roomState.totalQuestions} pytań · ${roomState.playerCount} graczy</p>
      ${winner ? `<div class="winner-card"><span class="winner-crown">♛</span><span class="winner-avatar">${escapeHtml(winner.name.slice(0, 1).toUpperCase())}</span><span class="winner-name">${escapeHtml(winner.name)}</span><span class="winner-score">${winner.score} <small>pkt</small></span><span class="winner-label">ZWYCIĘZCA</span></div>` : ''}
      <div class="final-ranking"><div class="final-ranking-title"><h2>Końcowy ranking</h2><span>${roomState.ranking.length} graczy</span></div>
        ${roomState.ranking.map((player, index) => `<div class="final-row ${index === 0 ? 'first-place' : ''}"><span class="final-rank">${String(index + 1).padStart(2, '0')}</span><span class="player-avatar avatar-${index % 5}">${escapeHtml(player.name.slice(0, 1).toUpperCase())}</span><strong>${escapeHtml(player.name)}</strong><span class="final-score">${player.score} pkt</span></div>`).join('')}
      </div>
      <button class="button button-primary" data-action="home" type="button">Zagraj ponownie <span>→</span></button>
    </section>`;
}

function setRoomIdentity(role, code, token) {
  saveIdentity({ role, code, token });
  roomState = null;
  history.replaceState(null, '', `/?room=${encodeURIComponent(code)}`);
}

function showHome() {
  roomState = null;
  clearIdentity();
  history.replaceState(null, '', '/');
  render();
}

app.addEventListener('submit', async (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches('form[data-action]')) return;
  const form = event.target;
  event.preventDefault();

  if (form.dataset.action === 'join') {
    const formData = new FormData(form);
    const response = await emit('player:join', {
      code: String(formData.get('code') || '').toUpperCase(),
      name: formData.get('name')
    });
    if (response) setRoomIdentity('player', response.code, response.playerToken);
  }

  if (form.dataset.action === 'create-room') {
    const formData = new FormData(form);
    questionCount = Number(formData.get('questionCount'));
    const response = await emit('host:create', { questionCount });
    if (response) setRoomIdentity('host', response.code, response.hostToken);
  }
});

app.addEventListener('click', async (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest('button[data-action]');
  if (!(button instanceof HTMLButtonElement)) return;

  if (button.dataset.action === 'open-builder') {
    renderBuilder();
    return;
  }

  if (button.dataset.action === 'home') {
    if (identity && roomState) {
      const response = await emit('room:leave', { code: identity.code });
      if (!response) return;
    }
    showHome();
    return;
  }

  if (button.dataset.action === 'start') {
    await emit('quiz:start', { code: identity.code });
    return;
  }

  if (button.dataset.action === 'answer') {
    button.disabled = true;
    const response = await emit('player:answer', {
      code: identity.code,
      playerToken: identity.token,
      answerIndex: Number(button.dataset.index)
    });
    if (!response) button.disabled = false;
    return;
  }

  if (button.dataset.action === 'next') {
    await emit('quiz:next', { code: identity.code });
    return;
  }

  if (button.dataset.action === 'copy') {
    try {
      await navigator.clipboard.writeText(identity.code);
      showToast('Kod pokoju skopiowany.');
    } catch {
      showToast(`Kod pokoju: ${identity.code}`);
    }
    return;
  }

  if (button.dataset.action === 'leave') {
    const response = await emit('room:leave', { code: identity.code });
    if (response) showHome();
  }
});

async function resumeRoom() {
  if (!identity) return;
  const event = identity.role === 'host' ? 'host:resume' : 'player:resume';
  const payload = identity.role === 'host'
    ? { code: identity.code, hostToken: identity.token }
    : { code: identity.code, playerToken: identity.token };
  const response = await emit(event, payload);
  if (!response) showHome();
}

socket.on('connect', resumeRoom);
socket.on('disconnect', () => showToast('Połączenie przerwane. Próbujemy połączyć ponownie…'));
socket.on('connect_error', () => showToast('Nie można połączyć z serwerem. Sprawdź połączenie internetowe.'));
socket.on('room:state', (state) => {
  roomState = state;
  if (identity) history.replaceState(null, '', `/?room=${encodeURIComponent(state.code)}`);
  render();
});
socket.on('room:closed', () => {
  clearIdentity();
  roomState = null;
  history.replaceState(null, '', '/');
  showToast('Prowadzący zamknął pokój.');
  render();
});

if (socket.connected) resumeRoom();
render();
