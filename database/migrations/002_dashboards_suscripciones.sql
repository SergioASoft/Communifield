USE communifield;

ALTER TABLE USUARIO
ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS SUSCRIPCION_GESTOR (
  id_suscripcion INT AUTO_INCREMENT PRIMARY KEY,
  fk_id_gestor INT NOT NULL,
  plan VARCHAR(80) NOT NULL DEFAULT 'mensual',
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  estado ENUM('activa', 'vencida', 'cancelada') DEFAULT 'activa',
  fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_fin DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fk_id_gestor) REFERENCES USUARIO(id_usuario)
);

CREATE TABLE IF NOT EXISTS PAGO_SUSCRIPCION (
  id_pago_suscripcion INT AUTO_INCREMENT PRIMARY KEY,
  fk_id_suscripcion INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  metodo VARCHAR(50) NOT NULL,
  estado ENUM('pendiente', 'pagado', 'fallido', 'cancelado') DEFAULT 'pendiente',
  fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fk_id_suscripcion) REFERENCES SUSCRIPCION_GESTOR(id_suscripcion)
);

CREATE INDEX idx_pago_suscripcion_fecha_estado
ON PAGO_SUSCRIPCION(fecha_pago, estado);

CREATE INDEX idx_suscripcion_gestor_estado
ON SUSCRIPCION_GESTOR(fk_id_gestor, estado);
