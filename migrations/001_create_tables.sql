CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_jugador VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    avatar_url VARCHAR(10) DEFAULT '🎮',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_comercial (
    id_local UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_comercial VARCHAR(100) NOT NULL,
    rut_empresa VARCHAR(12) UNIQUE NOT NULL,
    direccion VARCHAR(200),
    admin_email VARCHAR(100) UNIQUE NOT NULL,
    admin_password_hash VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tipo_moneda_local (
    id_moneda UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_local UUID NOT NULL REFERENCES local_comercial(id_local) ON DELETE RESTRICT,
    nombre_moneda VARCHAR(50) NOT NULL,
    UNIQUE(id_local, nombre_moneda)
);

CREATE TABLE IF NOT EXISTS billetera_local (
    id_billetera UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_moneda UUID NOT NULL REFERENCES tipo_moneda_local(id_moneda) ON DELETE RESTRICT,
    saldo_actual INTEGER DEFAULT 0 CHECK (saldo_actual >= 0),
    UNIQUE(id_usuario, id_moneda)
);

CREATE TABLE IF NOT EXISTS transaccion (
    id_transaccion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_billetera UUID NOT NULL REFERENCES billetera_local(id_billetera) ON DELETE RESTRICT,
    monto INTEGER NOT NULL CHECK (monto != 0),
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('credito', 'debito')),
    tipo_transaccion VARCHAR(30) NOT NULL,
    descripcion VARCHAR(200),
    referencia_id UUID,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS premio (
    id_premio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_local UUID NOT NULL REFERENCES local_comercial(id_local) ON DELETE RESTRICT,
    nombre_premio VARCHAR(100) NOT NULL,
    descripcion VARCHAR(300),
    imagen_url VARCHAR(255),
    costo_monedas INTEGER NOT NULL CHECK (costo_monedas > 0),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS canje_premio (
    id_canje UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    id_premio UUID NOT NULL REFERENCES premio(id_premio) ON DELETE RESTRICT,
    id_local UUID NOT NULL REFERENCES local_comercial(id_local) ON DELETE RESTRICT,
    id_transaccion UUID REFERENCES transaccion(id_transaccion),
    qr_code TEXT,
    qr_jwt VARCHAR(500),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'expirado', 'rechazado')),
    fecha_canje TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sesion_juego (
    id_sesion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_local UUID REFERENCES local_comercial(id_local) ON DELETE SET NULL,
    codigo_sala VARCHAR(5) UNIQUE NOT NULL,
    nombre_sala VARCHAR(30),
    configuracion JSONB DEFAULT '{}',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'lobby', 'jugando', 'finalizada', 'cancelada'))
);

CREATE TABLE IF NOT EXISTS participacion_sesion (
    id_participacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_sesion UUID NOT NULL REFERENCES sesion_juego(id_sesion) ON DELETE CASCADE,
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    es_anfitrion BOOLEAN DEFAULT false,
    puntaje_final INTEGER DEFAULT 0,
    monedas_ganadas INTEGER DEFAULT 0,
    tragos INTEGER DEFAULT 0,
    rondas_jugadas INTEGER DEFAULT 0,
    respuestas_correctas INTEGER DEFAULT 0,
    fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_sesion, id_usuario)
);
