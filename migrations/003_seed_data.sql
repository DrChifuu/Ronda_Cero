INSERT INTO local_comercial (nombre_comercial, rut_empresa, direccion, admin_email, admin_password_hash) VALUES
('Bar 404', '76.123.456-7', 'Av. Providencia 1234, Santiago', 'admin@bar404.cl', '$2b$10$rOXBjzj8y1nXqK1pGmVOkuGfX0eN1JqyGkH3sLgEJGpHqEJGKxOy'),
('Café Central', '76.987.654-3', 'Calle Moneda 567, Santiago', 'admin@central.cl', '$2b$10$rOXBjzj8y1nXqK1pGmVOkuGfX0eN1JqyGkH3sLgEJGpHqEJGKxOy')
ON CONFLICT (rut_empresa) DO NOTHING;

INSERT INTO tipo_moneda_local (id_local, nombre_moneda)
SELECT id_local, '404Coins' FROM local_comercial WHERE nombre_comercial = 'Bar 404'
ON CONFLICT (id_local, nombre_moneda) DO NOTHING;

INSERT INTO tipo_moneda_local (id_local, nombre_moneda)
SELECT id_local, 'CentralCoins' FROM local_comercial WHERE nombre_comercial = 'Café Central'
ON CONFLICT (id_local, nombre_moneda) DO NOTHING;

INSERT INTO premio (id_local, nombre_premio, descripcion, costo_monedas, stock)
SELECT id_local, 'Cerveza artesanal', 'Cerveza artesanal de la casa 500ml', 500, 100
FROM local_comercial WHERE nombre_comercial = 'Bar 404'
ON CONFLICT DO NOTHING;

INSERT INTO premio (id_local, nombre_premio, descripcion, costo_monedas, stock)
SELECT id_local, 'Pizza personal', 'Pizza personal a elección', 1000, 50
FROM local_comercial WHERE nombre_comercial = 'Bar 404'
ON CONFLICT DO NOTHING;

INSERT INTO premio (id_local, nombre_premio, descripcion, costo_monedas, stock)
SELECT id_local, 'Shot de tequila', 'Shot de tequila premium', 300, 200
FROM local_comercial WHERE nombre_comercial = 'Bar 404'
ON CONFLICT DO NOTHING;

INSERT INTO premio (id_local, nombre_premio, descripcion, costo_monedas, stock)
SELECT id_local, 'Café especial', 'Café de especialidad', 200, 100
FROM local_comercial WHERE nombre_comercial = 'Café Central'
ON CONFLICT DO NOTHING;

INSERT INTO premio (id_local, nombre_premio, descripcion, costo_monedas, stock)
SELECT id_local, 'Postre del día', 'Postre artesanal del día', 400, 60
FROM local_comercial WHERE nombre_comercial = 'Café Central'
ON CONFLICT DO NOTHING;
