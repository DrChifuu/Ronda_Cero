interface Config {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
  };
  redis: {
    url: string;
    host: string;
    port: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    qrExpiresIn: string;
  };
  session: {
    secret: string;
  };
  renderUrl: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://rondacero_user:rondacero_pass@localhost:5432/rondacero',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    qrExpiresIn: process.env.QR_JWT_EXPIRES_IN || '5m',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
  },
  renderUrl: process.env.RENDER_EXTERNAL_URL || '',
};

export default config;
