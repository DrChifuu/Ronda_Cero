document.addEventListener('DOMContentLoaded', () => {
  const roomCode = document.getElementById('roomCode')?.value || window.location.pathname.split('/').pop();
  const playerName = document.getElementById('playerName')?.value || '';
  const avatar = document.getElementById('playerAvatar')?.value || '🎮';

  socket.emit('join_room', { roomCode, playerName, avatar });

  socket.on('player_joined', (data) => {
    updatePlayerGrid(data.players);
  });

  socket.on('player_left', (data) => {
    updatePlayerGrid(data.players);
  });

  socket.on('game_started', (data) => {
    window.location.href = '/sala/' + roomCode + '/game';
  });

  function updatePlayerGrid(players) {
    const grid = document.getElementById('playerGrid');
    if (!grid) return;
    grid.innerHTML = '';
    players.forEach((player) => {
      const card = document.createElement('div');
      card.className = 'player-card fade-in';
      card.innerHTML =
        '<div class="player-avatar">' + sanitizeHTML(player.avatar) + '</div>' +
        '<div class="player-name">' + sanitizeHTML(player.name) + '</div>';
      grid.appendChild(card);
    });
  }

  document.getElementById('startBtn')?.addEventListener('click', () => {
    socket.emit('start_game', { roomCode });
  });

  document.getElementById('leaveBtn')?.addEventListener('click', () => {
    socket.emit('leave_room', { roomCode });
    window.location.href = '/dashboard';
  });
});
