const socket = io('/drinkparty', { path: '/drinkparty/socket.io' });

let myPlayerId = null;
let myRoomCode = null;
let myPlayerName = null;
let myAvatar = null;
let isHost = false;
let players = [];
let currentMode = '';
let currentQuestionId = '';
let timerInterval = null;
let chatVisible = false;

const EXTRA_AVATARS = ['🎮', '🎯', '🎲', '🎭', '🙅', '🧠', '💀', '🌟', '🎪', '🎨', '🎬', '🏆', '💎', '🦊', '🌈', '⭐', '🍷', '🥳', '🎤', '🃏'];

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const target = $(`#${id}`);
  if (target) target.classList.add('active');
}

function showToast(msg, type = 'info') {
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3000);
}

function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer(seconds, container) {
  clearTimer();
  let remaining = seconds;
  const timerEl = document.createElement('div');
  timerEl.className = 'timer-display';
  timerEl.textContent = remaining;
  container.prepend(timerEl);

  timerInterval = setInterval(() => {
    remaining--;
    timerEl.textContent = remaining;
    if (remaining <= 5) {
      timerEl.classList.add('urgent');
    }
    if (remaining <= 0) {
      clearTimer();
      timerEl.textContent = '0';
    }
  }, 1000);
}

function initAvatarGrid() {
  const grid = $('#avatar-grid');
  EXTRA_AVATARS.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'avatar-option';
    btn.dataset.avatar = emoji;
    btn.textContent = emoji;
    grid.appendChild(btn);
  });

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.avatar-option');
    if (!btn) return;
    $$('.avatar-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    myAvatar = btn.dataset.avatar;
  });
}

function joinGame() {
  const name = $('#player-name').value.trim();
  const code = $('#room-code').value.trim().toUpperCase();

  if (!name) {
    showToast('Escribe tu nombre', 'warning');
    return;
  }
  if (!myAvatar) {
    showToast('Elige un avatar', 'warning');
    return;
  }
  if (!code) {
    showToast('Ingresa un código de sala', 'warning');
    return;
  }

  myPlayerName = name;
  myRoomCode = code;

  socket.emit('join_game', {
    roomCode: code,
    playerName: name,
    avatar: myAvatar
  });
}

function renderPlayersList() {
  const list = $('#players-list');
  const count = $('#player-count');
  list.innerHTML = '';
  count.textContent = players.length;

  players.forEach(p => {
    const chip = document.createElement('div');
    chip.className = 'player-chip';
    chip.innerHTML = `<span class="avatar">${sanitize(p.avatar)}</span><span>${sanitize(p.nombre)}</span>`;
    list.appendChild(chip);
  });

  const startBtn = $('#btn-start');
  if (isHost) {
    startBtn.style.display = '';
  } else {
    startBtn.style.display = 'none';
  }
}

function showModeSelector() {
  const overlay = $('#modal-overlay');
  const content = $('#modal-content');

  content.innerHTML = `
    <h3>Elige el modo de juego</h3>
    <div class="mode-selector">
      <div class="mode-option" data-mode="trivia">
        <span class="mode-icon">🧠</span>
        Trivia
        <span class="mode-name">Preguntas</span>
      </div>
      <div class="mode-option" data-mode="reto">
        <span class="mode-icon">🎯</span>
        Retos
        <span class="mode-name">Desafíos</span>
      </div>
      <div class="mode-option" data-mode="yonunca">
        <span class="mode-icon">🙅</span>
        Yo Nunca
        <span class="mode-name">Confesiones</span>
      </div>
      <div class="mode-option" data-mode="verdadoroto">
        <span class="mode-icon">🔥</span>
        Verdad o Reto
        <span class="mode-name">Clásico</span>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" id="btn-cancel-mode">Cancelar</button>
    </div>
  `;

  overlay.classList.add('active');

  content.querySelectorAll('.mode-option').forEach(opt => {
    opt.addEventListener('click', () => {
      content.querySelectorAll('.mode-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  $('#btn-cancel-mode').addEventListener('click', () => {
    overlay.classList.remove('active');
  });

  content.querySelectorAll('.mode-option').forEach(opt => {
    opt.addEventListener('dblclick', () => {
      const mode = opt.dataset.mode;
      overlay.classList.remove('active');
      socket.emit('start_round', { roomCode: myRoomCode, mode });
    });
  });

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-primary';
  confirmBtn.textContent = 'Jugar';
  confirmBtn.addEventListener('click', () => {
    const selected = content.querySelector('.mode-option.selected');
    if (!selected) {
      showToast('Selecciona un modo', 'warning');
      return;
    }
    const mode = selected.dataset.mode;
    overlay.classList.remove('active');
    socket.emit('start_round', { roomCode: myRoomCode, mode });
  });
  content.querySelector('.modal-actions').appendChild(confirmBtn);
}

function renderTrivia(data) {
  const content = $('#game-content');
  currentQuestionId = data.questionId;

  const labels = ['A', 'B', 'C', 'D'];
  let optionsHtml = '';
  data.opciones.forEach((opt, i) => {
    optionsHtml += `<button class="trivia-option" data-index="${i}"><strong>${labels[i]}.</strong> ${sanitize(opt)}</button>`;
  });

  content.innerHTML = `
    <div class="glass-card trivia-card">
      <div class="trivia-question">${sanitize(data.pregunta)}</div>
      <div class="trivia-options">${optionsHtml}</div>
    </div>
  `;

  startTimer(15, content);

  content.querySelectorAll('.trivia-option').forEach(btn => {
    btn.addEventListener('click', () => {
      content.querySelectorAll('.trivia-option').forEach(b => b.classList.add('disabled'));
      btn.style.borderColor = 'var(--primary)';
      btn.style.background = 'rgba(255, 107, 53, 0.15)';
      socket.emit('trivia_answer', {
        roomCode: myRoomCode,
        playerId: myPlayerId,
        answer: parseInt(btn.dataset.index),
        questionId: currentQuestionId
      });
    });
  });
}

function renderReto(data) {
  const content = $('#game-content');
  const isMyTurn = data.jugadorAsignado === myPlayerId;
  const assignedPlayer = players.find(p => p.id === data.jugadorAsignado);

  content.innerHTML = `
    <div class="glass-card reto-card">
      <p style="color: var(--text-secondary); margin-bottom: 8px;">
        ${isMyTurn ? '¡Es tu turno!' : `Turno de: <strong>${sanitize(assignedPlayer?.nombre || '???')}</strong>`}
      </p>
      <div class="reto-description">${sanitize(data.reto)}</div>
      <span class="reto-difficulty ${data.dificultad}">${data.dificultad.toUpperCase()}</span>
      ${isMyTurn ? `
        <div class="reto-actions" style="margin-top: 16px;">
          <button class="btn btn-accent" id="btn-accept-reto">✅ Aceptar</button>
          <button class="btn btn-danger" id="btn-reject-reto">❌ Rechazar</button>
        </div>
      ` : `
        <div class="vote-progress" style="margin-top: 16px;">
          <p style="color: var(--text-secondary);">Esperando respuesta...</p>
        </div>
        <div class="reto-actions" style="margin-top: 12px;">
          <button class="btn btn-accent btn-sm" id="btn-vote-yes">👍 Votar sí</button>
          <button class="btn btn-danger btn-sm" id="btn-vote-no">👎 Votar no</button>
        </div>
      `}
    </div>
  `;

  if (isMyTurn) {
    $('#btn-accept-reto').addEventListener('click', () => {
      socket.emit('challenge_action', { roomCode: myRoomCode, playerId: myPlayerId, accepted: true });
      content.querySelectorAll('.btn').forEach(b => b.disabled = true);
    });
    $('#btn-reject-reto').addEventListener('click', () => {
      socket.emit('challenge_action', { roomCode: myRoomCode, playerId: myPlayerId, accepted: false });
      content.querySelectorAll('.btn').forEach(b => b.disabled = true);
    });
  } else {
    $('#btn-vote-yes').addEventListener('click', () => {
      socket.emit('vote', { roomCode: myRoomCode, playerId: myPlayerId, vote: true });
      showToast('Voto enviado', 'success');
      $('#btn-vote-yes').disabled = true;
      $('#btn-vote-no').disabled = true;
    });
    $('#btn-vote-no').addEventListener('click', () => {
      socket.emit('vote', { roomCode: myRoomCode, playerId: myPlayerId, vote: false });
      showToast('Voto enviado', 'success');
      $('#btn-vote-yes').disabled = true;
      $('#btn-vote-no').disabled = true;
    });
  }
}

function renderYoNunca(data) {
  const content = $('#game-content');

  content.innerHTML = `
    <div class="glass-card yonunca-card">
      <div class="yonunca-text">${sanitize(data.afirmacion)}</div>
      <div class="yonunca-actions">
        <button class="btn btn-danger yonunca-btn" id="btn-yo-si">🍺 YO SÍ</button>
        <button class="btn btn-accent yonunca-btn" id="btn-yo-nunca">✨ YO NUNCA</button>
      </div>
      <div class="yonunca-results" id="yonunca-results"></div>
    </div>
  `;

  $('#btn-yo-si').addEventListener('click', () => {
    socket.emit('respuesta_yonunca', { roomCode: myRoomCode, playerId: myPlayerId, hizoAccion: true });
    $('#btn-yo-si').disabled = true;
    $('#btn-yo-nunca').disabled = true;
    $('#btn-yo-si').style.opacity = '1';
    $('#btn-yo-nunca').style.opacity = '0.4';
  });

  $('#btn-yo-nunca').addEventListener('click', () => {
    socket.emit('respuesta_yonunca', { roomCode: myRoomCode, playerId: myPlayerId, hizoAccion: false });
    $('#btn-yo-si').disabled = true;
    $('#btn-yo-nunca').disabled = true;
    $('#btn-yo-nunca').style.opacity = '1';
    $('#btn-yo-si').style.opacity = '0.4';
  });
}

function renderVerdadOReto(data) {
  const content = $('#game-content');
  const isMyTurn = data.jugadorAsignado === myPlayerId;
  const assignedPlayer = players.find(p => p.id === data.jugadorAsignado);

  content.innerHTML = `
    <div class="glass-card verdadoroto-card">
      <div class="verdadoroto-prompt">
        ${isMyTurn ? '¡Es tu turno!' : `Turno de: ${sanitize(assignedPlayer?.nombre || '???')}`}
      </div>
      ${isMyTurn ? `
        <div class="verdadoroto-actions">
          <button class="btn btn-secondary verdadoroto-btn" id="btn-verdad">
            <span class="icon">💬</span>
            VERDAD
          </button>
          <button class="btn btn-danger verdadoroto-btn" id="btn-reto-vr">
            <span class="icon">🔥</span>
            RETO
          </button>
        </div>
      ` : `
        <p style="color: var(--text-secondary);">Esperando elección...</p>
      `}
    </div>
  `;

  if (isMyTurn) {
    $('#btn-verdad').addEventListener('click', () => {
      socket.emit('seleccion_verdadoroto', { roomCode: myRoomCode, playerId: myPlayerId, eleccion: 'verdad' });
      content.querySelectorAll('.btn').forEach(b => b.disabled = true);
    });
    $('#btn-reto-vr').addEventListener('click', () => {
      socket.emit('seleccion_verdadoroto', { roomCode: myRoomCode, playerId: myPlayerId, eleccion: 'reto' });
      content.querySelectorAll('.btn').forEach(b => b.disabled = true);
    });
  }
}

function updateScores(scores) {
  const container = $('#game-scores-mini');
  container.innerHTML = '';
  const sorted = [...scores].sort((a, b) => b.puntaje - a.puntaje);
  sorted.forEach(p => {
    const chip = document.createElement('div');
    chip.className = 'score-chip';
    chip.innerHTML = `${sanitize(p.avatar)} ${sanitize(p.nombre)} <span class="pts">${p.puntaje}pts</span> <span class="trg">${p.tragos}🍺</span>`;
    container.appendChild(chip);
  });
}

function updateBarra(value) {
  const fill = $('#barra-fill');
  fill.style.width = `${Math.min(value, 100)}%`;
}

function renderResults(scores) {
  showScreen('screen-results');
  clearTimer();

  const sorted = [...scores].sort((a, b) => b.puntaje - a.puntaje);
  const podium = $('#podium');
  const rankingList = $('#ranking-list');

  podium.innerHTML = '';
  const medals = ['🥇', '🥈', '🥉'];
  const classes = ['first', 'second', 'third'];
  const top3 = sorted.slice(0, 3);

  top3.forEach((p, i) => {
    const place = document.createElement('div');
    place.className = `podium-place ${classes[i]}`;
    place.innerHTML = `
      <div class="podium-avatar">${sanitize(p.avatar)}</div>
      <div class="podium-name">${sanitize(p.nombre)}</div>
      <div class="podium-score">${p.puntaje} pts</div>
      <div class="podium-bar">${medals[i]}</div>
    `;
    podium.appendChild(place);
  });

  rankingList.innerHTML = '';
  sorted.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'ranking-item';
    item.innerHTML = `
      <span class="ranking-position">${i + 1}</span>
      <span class="ranking-avatar">${sanitize(p.avatar)}</span>
      <span class="ranking-name">${sanitize(p.nombre)}</span>
      <div class="ranking-stats">
        <div class="pts">${p.puntaje} pts</div>
        <div class="trg">${p.tragos} 🍺</div>
      </div>
    `;
    rankingList.appendChild(item);
  });

  if (sorted.length > 0 && sorted[0].puntaje > 0) {
    launchConfetti();
  }
}

function launchConfetti() {
  const colors = ['#ff6b35', '#ffd166', '#06d6a0', '#ef476f', '#ffffff'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 2}s`;
    piece.style.animationDuration = `${2 + Math.random() * 2}s`;
    document.body.appendChild(piece);
    setTimeout(() => {
      if (piece.parentNode) piece.parentNode.removeChild(piece);
    }, 5000);
  }
}

function addChatMessage(playerName, msg, timestamp) {
  const container = $('#chat-messages');
  const el = document.createElement('div');
  el.className = 'chat-msg';
  const time = new Date(timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  el.innerHTML = `<span class="sender">${sanitize(playerName)}</span><span class="text">${sanitize(msg)}</span> <small style="color:var(--text-muted)">${time}</small>`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function toggleChat() {
  chatVisible = !chatVisible;
  const panel = $('#chat-panel');
  if (chatVisible) {
    panel.classList.add('active');
  } else {
    panel.classList.remove('active');
  }
}

function sendChat() {
  const input = $('#chat-input');
  const msg = input.value.trim();
  if (!msg || !myRoomCode) return;
  socket.emit('chat_message', {
    roomCode: myRoomCode,
    msg: msg.substring(0, 200),
    playerName: myPlayerName
  });
  input.value = '';
}

socket.on('connect', () => {
  console.log('Conectado al servidor DrinkParty');
});

socket.on('disconnect', () => {
  showToast('Desconectado del servidor', 'error');
});

socket.on('joined', (data) => {
  myPlayerId = data.playerId;
  myRoomCode = data.roomCode;
  isHost = players.length === 0 || players[0]?.id === myPlayerId;
  showScreen('screen-lobby');
  $('#lobby-room-code').textContent = myRoomCode;
  showToast('¡Te uniste a la sala!', 'success');
});

socket.on('player_list', (playerList) => {
  const wasEmpty = players.length === 0;
  players = playerList;
  if (wasEmpty && players.length > 0 && players[0].id === myPlayerId) {
    isHost = true;
  }
  if (myPlayerId && players.length > 0) {
    const firstJoined = players[0];
    if (firstJoined && firstJoined.id === myPlayerId) {
      isHost = true;
    }
  }
  renderPlayersList();
});

socket.on('round_started', (result) => {
  clearTimer();
  showScreen('screen-game');
  currentMode = result.type;

  const modeBadge = $('#mode-badge');
  const modeNames = {
    trivia: '🧠 Trivia',
    reto: '🎯 Reto',
    yonunca: '🙅 Yo Nunca',
    verdadero_falso: '✅❓ Verdadero/Falso',
    verdadoroto: '🔥 Verdad o Reto'
  };
  modeBadge.textContent = modeNames[result.type] || result.type;

  if (result.data && result.data.ronda) {
    $('#round-number').textContent = result.data.ronda;
  }

  switch (result.type) {
    case 'trivia':
      renderTrivia(result.data);
      break;
    case 'reto':
      renderReto(result.data);
      break;
    case 'yonunca':
    case 'verdadero_falso':
      renderYoNunca(result.data);
      break;
    case 'verdadoroto':
      renderVerdadOReto(result.data);
      break;
  }
});

socket.on('trivia_result', (result) => {
  clearTimer();
  const options = $$('.trivia-option');
  options.forEach((btn, i) => {
    btn.classList.add('disabled');
    if (i === result.correctAnswer) {
      btn.classList.add('correct');
    }
  });

  if (!result.correct) {
    const selected = document.querySelector('.trivia-option[style*="border-color"]');
    if (selected && !selected.classList.contains('correct')) {
      selected.classList.add('incorrect');
    }
  }

  if (result.correct) {
    showToast('¡Correcto! +10 pts', 'success');
  } else {
    showToast('Incorrecto. +1 🍺', 'error');
  }

  if (result.todosBeben) {
    showToast('¡BARRA LLENA! ¡Todos beben! 🍺🍺🍺', 'warning');
  }
});

socket.on('scores_update', (data) => {
  players = data.scores;
  updateScores(data.scores);
  if (data.barraColectiva !== undefined) {
    updateBarra(data.barraColectiva);
  }
});

socket.on('challenge_result', (result) => {
  const content = $('#game-content');
  if (result.resultado) {
    if (result.resultado.aceptado) {
      showToast(`${result.resultado.jugador} aceptó el reto! +${result.resultado.puntosGanados} pts`, 'success');
    } else {
      showToast(`${result.resultado.jugador} rechazó el reto. +${result.resultado.tragos} 🍺`, 'warning');
    }
  }
});

socket.on('vote_result', (result) => {
  if (result.aprobada) {
    showToast(`¡Votación aprobada! (${result.resultado.votosAprobados}/${result.resultado.votosTotales})`, 'success');
  } else {
    showToast(`Votación rechazada (${result.resultado.votosAprobados}/${result.resultado.votosTotales})`, 'error');
  }
});

socket.on('vote_received', () => {
  showToast('Voto registrado', 'info');
});

socket.on('yonunca_result', (result) => {
  if (result.resultados) {
    const r = result.resultados;
    const resultsDiv = $('#yonunca-results');
    if (resultsDiv) {
      const entry = document.createElement('p');
      entry.style.cssText = 'color: var(--text-secondary); font-size: 0.9rem; margin-top: 8px;';
      if (r.hizoAccion) {
        entry.textContent = `${r.jugador} lo ha hecho 🍺`;
      } else {
        entry.textContent = `${r.jugador} nunca lo ha hecho ✨`;
      }
      resultsDiv.appendChild(entry);
    }
  }
});

socket.on('verdadoroto_result', (result) => {
  if (result.data) {
    const content = $('#game-content');
    const d = result.data;
    if (d.tipo === 'verdad') {
      content.innerHTML = `
        <div class="glass-card verdadoroto-card">
          <p style="color: var(--text-secondary); margin-bottom: 8px;">${sanitize(d.jugador)} eligió VERDAD 💬</p>
          <div class="reto-description" style="color: var(--accent);">${sanitize(d.pregunta)}</div>
        </div>
      `;
    } else {
      content.innerHTML = `
        <div class="glass-card verdadoroto-card">
          <p style="color: var(--text-secondary); margin-bottom: 8px;">${sanitize(d.jugador)} eligió RETO 🔥</p>
          <div class="reto-description" style="color: var(--danger);">${sanitize(d.reto)}</div>
        </div>
      `;
    }
  }
});

socket.on('todos_beben', () => {
  showToast('¡BARRA COLECTIVA LLENA! ¡Todos beben! 🍺🍺🍺', 'warning');
  updateBarra(0);
});

socket.on('chat_message', (data) => {
  addChatMessage(data.playerName, data.msg, data.timestamp);
});

document.addEventListener('DOMContentLoaded', () => {
  initAvatarGrid();

  $('#btn-join').addEventListener('click', joinGame);

  $('#player-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinGame();
  });

  $('#room-code').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  $('#room-code').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinGame();
  });

  $('#btn-start').addEventListener('click', () => {
    if (players.length < 2) {
      showToast('Se necesitan al menos 2 jugadores', 'warning');
      return;
    }
    showModeSelector();
  });

  $('#btn-next-round').addEventListener('click', () => {
    if (isHost) {
      showModeSelector();
    } else {
      showToast('Esperando al anfitrión...', 'info');
    }
  });

  $('#btn-new-game').addEventListener('click', () => {
    showScreen('screen-home');
    myRoomCode = null;
    players = [];
    isHost = false;
    $('#chat-messages').innerHTML = '';
    $('#game-content').innerHTML = '';
    $('#game-scores-mini').innerHTML = '';
    updateBarra(0);
  });

  $('#chat-toggle').addEventListener('click', toggleChat);
  $('#chat-close').addEventListener('click', toggleChat);

  $('#btn-send-chat').addEventListener('click', sendChat);
  $('#chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChat();
  });
});
