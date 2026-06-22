USE communifield;

CREATE TABLE IF NOT EXISTS ESPACIO_ABIERTO (
  id_espacio_abierto INT AUTO_INCREMENT PRIMARY KEY,
  fk_id_evento INT NOT NULL,
  fk_id_gestor INT NOT NULL,
  estado ENUM('abierto', 'completo', 'cancelado') DEFAULT 'abierto',
  precio_total DECIMAL(10,2) NOT NULL,
  cuota_participante DECIMAL(10,2) NOT NULL,
  max_participantes INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (fk_id_evento) REFERENCES EVENTO(id_evento),
  FOREIGN KEY (fk_id_gestor) REFERENCES USUARIO(id_usuario)
);

CREATE TABLE IF NOT EXISTS ESPACIO_ABIERTO_PARTICIPANTE (
  id_participacion INT AUTO_INCREMENT PRIMARY KEY,
  fk_id_espacio_abierto INT NOT NULL,
  fk_id_usuario INT NOT NULL,
  fk_id_pago INT NOT NULL,
  estado ENUM('pendiente', 'pagado', 'cancelado') DEFAULT 'pagado',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_espacio_abierto_usuario (fk_id_espacio_abierto, fk_id_usuario),
  FOREIGN KEY (fk_id_espacio_abierto) REFERENCES ESPACIO_ABIERTO(id_espacio_abierto),
  FOREIGN KEY (fk_id_usuario) REFERENCES USUARIO(id_usuario),
  FOREIGN KEY (fk_id_pago) REFERENCES PAGO(id_pago)
);

CREATE INDEX idx_espacio_abierto_evento ON ESPACIO_ABIERTO(fk_id_evento);
CREATE INDEX idx_participante_espacio_estado ON ESPACIO_ABIERTO_PARTICIPANTE(fk_id_espacio_abierto, estado);
