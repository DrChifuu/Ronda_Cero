const socket = io('/', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected to RondaCero');
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
  showToast('Error de conexión. Reintentando...', 'error');
});

socket.on('disconnect', () => {
  console.log('Disconnected');
  showToast('Desconectado. Reconectando...', 'warning');
});
