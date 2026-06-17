import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import path from 'path';
import http from 'http';
import { fork, ChildProcess } from 'child_process';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { v4 as uuidv4 } from 'uuid';
import config from './config';
import { testConnection } from './database';
import { connectRedis } from './redis';
import authRoutes from './auth/routes';
import salasRouter from './api/salas';
import premiosRouter from './api/premios';
import canjesRouter from './api/canjes';
import estadisticasRouter from './api/estadisticas';
import { setupSocketIO } from './socket';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    playerName?: string;
    avatar?: string;
    isGuest?: boolean;
  }
}

const app = express();
const httpServer = new http.Server(app);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use('/', authRoutes);
app.use('/api/salas', salasRouter);
app.use('/api/premios', premiosRouter);
app.use('/api/canjes', canjesRouter);
app.use('/api/estadisticas', estadisticasRouter);

setupSocketIO(httpServer);

app.get('/', (_req: Request, res: Response) => {
  res.render('index');
});

app.get('/login', (_req: Request, res: Response) => {
  res.render('login');
});

app.get('/identificacion', (_req: Request, res: Response) => {
  res.render('identificacion');
});

app.post('/identificacion', (req: Request, res: Response) => {
  const { nombre, avatar } = req.body;
  const trimmed = (nombre || '').trim();

  if (!trimmed || trimmed.length < 1 || trimmed.length > 20 || /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]/.test(trimmed)) {
    return res.status(400).render('identificacion', { error: 'Nombre inválido. Debe tener entre 1 y 20 caracteres sin caracteres especiales.' });
  }

  req.session.userId = uuidv4();
  req.session.playerName = trimmed;
  req.session.avatar = avatar || 'default';
  req.session.isGuest = true;

  res.redirect('/dashboard');
});

app.get('/dashboard', (req: Request, res: Response) => {
  if (!req.session.playerName) {
    return res.redirect('/identificacion');
  }
  res.render('dashboard', {
    playerName: req.session.playerName,
    avatar: req.session.avatar,
  });
});

app.get('/crear-sala', (req: Request, res: Response) => {
  if (!req.session.playerName) {
    return res.redirect('/identificacion');
  }
  res.render('crear-sala');
});

app.get('/sala/:codigo', (req: Request, res: Response) => {
  if (!req.session.playerName) {
    return res.redirect('/identificacion');
  }
  res.render('lobby', { codigo: req.params.codigo });
});

app.get('/canje', (req: Request, res: Response) => {
  if (!req.session.playerName) {
    return res.redirect('/identificacion');
  }
  res.render('canje-premios');
});

app.get('/canje/qr', (_req: Request, res: Response) => {
  res.render('canje-qr');
});

app.get('/perfil', (req: Request, res: Response) => {
  if (!req.session.playerName) {
    return res.redirect('/identificacion');
  }
  res.render('perfil');
});

app.get('/admin/premios', (_req: Request, res: Response) => {
  res.render('admin-premios');
});

app.get('/sala/:codigo/gastos', (_req: Request, res: Response) => {
  res.render('gastos');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

let drinkPartyChild: ChildProcess | null = null;

function startDrinkParty(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const child = fork(path.join(__dirname, 'minijuegos/DrinkParty/server.js'));

    child.on('message', (msg: unknown) => {
      if (msg === 'ready') {
        console.log('DrinkParty child process ready');
        resolve(child);
      }
    });

    child.on('error', (err: Error) => {
      console.error('DrinkParty child process error:', err.message);
      reject(err);
    });

    child.on('exit', (code: number | null) => {
      console.log(`DrinkParty child process exited with code ${code}`);
      drinkPartyChild = null;
    });
  });
}

app.use(
  '/drinkparty',
  createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    ws: true,
  })
);

app.use(
  '/drinkparty/socket.io',
  createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    ws: true,
  })
);

app.use((_req: Request, res: Response) => {
  res.status(404).render('404');
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).render('error', { message: 'Internal server error' });
});

async function start(): Promise<void> {
  const pgOk = await testConnection();
  if (!pgOk) {
    console.warn('PostgreSQL not available, running without database');
  }

  const redisClient = await connectRedis();
  if (!redisClient) {
    console.warn('Redis not available, running without cache');
  }

  try {
    drinkPartyChild = await startDrinkParty();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('DrinkParty failed to start:', msg);
  }

  httpServer.listen(config.port, () => {
    console.log(`RondaCero running on port ${config.port}`);
  });
}

start();
