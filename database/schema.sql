CREATE DATABASE IF NOT EXISTS communifield;
USE communifield;

-- =====================================================================
-- 👤 1. TABLA USUARIO
-- =====================================================================
CREATE TABLE USUARIO (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  email_verificado BOOLEAN DEFAULT FALSE,
  token_verificacion VARCHAR(255) NULL,
  reset_token VARCHAR(255) NULL,
  reset_token_expira DATETIME NULL,
  contraseña_hash VARCHAR(255) NOT NULL,
  tel VARCHAR(20),
  biografia TEXT,
  Tipo ENUM('organizer', 'player', 'admin') NOT NULL,
  foto LONGTEXT NULL,
  posicion VARCHAR(100),
  fk_id_evento INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 🤝 2. TABLAS DE COMUNIDAD (AMISTAD)
-- =====================================================================
CREATE TABLE AMISTAD (
    id_amistad INT AUTO_INCREMENT PRIMARY KEY,
    id_dueño INT NOT NULL,
    id_amigo INT NOT NULL,
    estado ENUM('pendiente', 'aceptada', 'rechazada', 'bloqueada') DEFAULT 'pendiente',
    FOREIGN KEY (id_dueño) REFERENCES USUARIO(id_usuario),
    FOREIGN KEY (id_amigo) REFERENCES USUARIO(id_usuario)
);

CREATE TABLE AMISTAD_USUARIO (
    id_amistad_id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_dueño INT NOT NULL,
    fk_id_amigo INT NOT NULL,
    FOREIGN KEY (fk_id_dueño) REFERENCES USUARIO(id_usuario),
    FOREIGN KEY (fk_id_amigo) REFERENCES USUARIO(id_usuario)
);

-- =====================================================================
-- 🏟️ 3. TABLA ESPACIO
-- =====================================================================
CREATE TABLE ESPACIO (
    id_espacio INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_dueño INT NULL,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(100) NOT NULL,                  
    ubicacion VARCHAR(255) NOT NULL,
    distancia VARCHAR(50) NULL,                  
    superficie VARCHAR(100) NULL,                
    descripcion JSON NULL,                       
    precio_hora DECIMAL(10,2) DEFAULT 0.00,
    rating DECIMAL(2,1) DEFAULT 0.0,
    total_resenas INT DEFAULT 0,
    disponible_hoy BOOLEAN DEFAULT TRUE,
    imagen_principal TEXT NULL,
    imagenes JSON NULL,                          
    caracteristicas JSON NULL,                  
    horarios JSON NULL,                          
    resenas JSON NULL,                            
    estado ENUM('activo', 'inactivo', 'mantenimiento') DEFAULT 'activo',
    fecha_activacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_desact DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================================
-- 📅 4. TABLA EVENTO
-- =====================================================================
CREATE TABLE EVENTO (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_espacio INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    fecha_inic DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    max_jugadores INT NOT NULL,
    evento_datos TEXT,
    id_pago INT,
    FOREIGN KEY (fk_id_espacio) REFERENCES ESPACIO(id_espacio)
);

-- =====================================================================
-- 💳 5. TABLA PAGO
-- =====================================================================
CREATE TABLE PAGO (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    total DECIMAL(10,2) NOT NULL,
    metodo VARCHAR(50) NOT NULL,
    referencia_externa VARCHAR(255) NULL,
    estado ENUM('pendiente', 'pagado', 'fallido', 'cancelado') DEFAULT 'pendiente',
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    fk_id_evento INT NOT NULL,
    FOREIGN KEY (fk_id_evento) REFERENCES EVENTO(id_evento)
);

-- =====================================================================
-- 6. TABLAS DE SUSCRIPCIONES
-- =====================================================================
CREATE TABLE SUSCRIPCION_GESTOR (
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

CREATE TABLE PAGO_SUSCRIPCION (
  id_pago_suscripcion INT AUTO_INCREMENT PRIMARY KEY,
  fk_id_suscripcion INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  metodo VARCHAR(50) NOT NULL,
  estado ENUM('pendiente', 'pagado', 'fallido', 'cancelado') DEFAULT 'pendiente',
  fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fk_id_suscripcion) REFERENCES SUSCRIPCION_GESTOR(id_suscripcion)
);

-- =====================================================================
-- 7. TABLAS DE ESPACIOS ABIERTOS
-- =====================================================================

CREATE TABLE ESPACIO_ABIERTO (
    id_espacio_abierto INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_evento INT NOT NULL,
    fk_id_gestor INT NOT NULL,
    estado ENUM('abierto', 'completo', 'cancelado') DEFAULT 'abierto',
    precio_total DECIMAL(10,2) NOT NULL,
    cuota_participante DECIMAL(10,2) NOT NULL,
    max_participantes INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (fk_id_evento)
        REFERENCES EVENTO(id_evento),

    FOREIGN KEY (fk_id_gestor)
        REFERENCES USUARIO(id_usuario)
);

CREATE TABLE ESPACIO_ABIERTO_PARTICIPANTE (
    id_participacion INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_espacio_abierto INT NOT NULL,
    fk_id_usuario INT NOT NULL,
    fk_id_pago INT NOT NULL,

    estado ENUM('pendiente', 'pagado', 'cancelado')
        DEFAULT 'pagado',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_espacio_abierto_usuario (
        fk_id_espacio_abierto,
        fk_id_usuario
    ),

    FOREIGN KEY (fk_id_espacio_abierto)
        REFERENCES ESPACIO_ABIERTO(id_espacio_abierto),

    FOREIGN KEY (fk_id_usuario)
        REFERENCES USUARIO(id_usuario),

    FOREIGN KEY (fk_id_pago)
        REFERENCES PAGO(id_pago)
);

-- =====================================================================
-- 🔗 8. LLAVES FORÁNEAS CIRCULARES Y ALTERACIONES
-- =====================================================================
ALTER TABLE USUARIO ADD CONSTRAINT fk_usuario_evento FOREIGN KEY (fk_id_evento) REFERENCES EVENTO(id_evento);
ALTER TABLE EVENTO ADD CONSTRAINT fk_evento_pago FOREIGN KEY (id_pago) REFERENCES PAGO(id_pago);
ALTER TABLE ESPACIO ADD CONSTRAINT fk_espacio_dueno FOREIGN KEY (fk_id_dueño) REFERENCES USUARIO(id_usuario);

-- ÍNDICES DE RENDIMIENTO
CREATE INDEX idx_evento_espacio_fechas ON EVENTO(fk_id_espacio, fecha_inic, fecha_fin);
CREATE INDEX idx_pago_referencia_externa ON PAGO(referencia_externa);
CREATE INDEX idx_pago_estado_fecha ON PAGO(estado, fecha_pago);
CREATE INDEX idx_pago_suscripcion_fecha_estado ON PAGO_SUSCRIPCION(fecha_pago, estado);
CREATE INDEX idx_suscripcion_gestor_estado ON SUSCRIPCION_GESTOR(fk_id_gestor, estado);
CREATE INDEX idx_espacio_abierto_evento
ON ESPACIO_ABIERTO(fk_id_evento);

CREATE INDEX idx_participante_espacio_estado
ON ESPACIO_ABIERTO_PARTICIPANTE(fk_id_espacio_abierto, estado);
-- =====================================================================
-- 🔒 8. TRIGGERS DE VALIDACIÓN
-- =====================================================================
DELIMITER $$

-- 1️⃣ Validar que la fecha de inicio no sea mayor o igual a la de fin
CREATE TRIGGER validar_fechas_evento
BEFORE INSERT ON EVENTO
FOR EACH ROW
BEGIN
    IF NEW.fecha_inic >= NEW.fecha_fin THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La fecha de inicio debe ser menor a la de fin';
    END IF;
END$$

-- 2️⃣ Evitar el solapamiento de horarios al insertar un evento
CREATE TRIGGER prevenir_solapamiento_evento
BEFORE INSERT ON EVENTO
FOR EACH ROW
BEGIN
    DECLARE conteo_conflictos INT;

    SELECT COUNT(*) INTO conteo_conflictos
    FROM EVENTO e
    INNER JOIN PAGO p ON p.id_pago = e.id_pago
    WHERE e.fk_id_espacio = NEW.fk_id_espacio
      AND p.estado IN ('pendiente', 'pagado')
      AND e.fecha_inic < NEW.fecha_fin
      AND e.fecha_fin > NEW.fecha_inic;

    IF conteo_conflictos > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cancha no esta disponible en ese horario';
    END IF;
END$$

-- 3️⃣ Validar estado del espacio y vigencia de fechas
CREATE TRIGGER validar_disponibilidad_espacio
BEFORE INSERT ON EVENTO
FOR EACH ROW
BEGIN
    DECLARE f_act DATETIME;
    DECLARE f_desact DATETIME;
    DECLARE est_espacio VARCHAR(50);

    SELECT fecha_activacion, fecha_desact, estado INTO f_act, f_desact, est_espacio
    FROM ESPACIO WHERE id_espacio = NEW.fk_id_espacio;

    IF est_espacio != 'activo' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cancha no está activa o se encuentra en mantenimiento';
    END IF;

    IF NEW.fecha_inic < f_act OR (f_desact IS NOT NULL AND NEW.fecha_fin > f_desact) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El evento está fuera del rango de fechas permitido para este espacio';
    END IF;
END$$

-- 4️⃣ Evitar solapamiento de horarios al actualizar (UPDATE) un evento existente
CREATE TRIGGER prevenir_solapamiento_evento_update
BEFORE UPDATE ON EVENTO
FOR EACH ROW
BEGIN
    DECLARE conteo_conflictos INT;

    IF NEW.fecha_inic >= NEW.fecha_fin THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La fecha de inicio debe ser menor a la de fin';
    END IF;

    SELECT COUNT(*) INTO conteo_conflictos
    FROM EVENTO e
    INNER JOIN PAGO p ON p.id_pago = e.id_pago
    WHERE e.fk_id_espacio = NEW.fk_id_espacio
      AND e.id_evento != OLD.id_evento
      AND p.estado IN ('pendiente', 'pagado')
      AND e.fecha_inic < NEW.fecha_fin
      AND e.fecha_fin > NEW.fecha_inic;

    IF conteo_conflictos > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Conflicto de horario al actualizar el evento';
    END IF;
END$$

DELIMITER ;

-- =====================================================================
-- 🧪 9. POBLACIÓN DE DATOS DE PRUEBA (SEED DATA)
-- =====================================================================
-- APAGAR LA VERIFICACIÓN DE LLAVES FORÁNEAS PARA LA INSERCIÓN INICIAL
SET FOREIGN_KEY_CHECKS = 0;

-- Canchas con vigencia amplia para correcto funcionamiento de los triggers
INSERT INTO ESPACIO (id_espacio, nombre, tipo, ubicacion, superficie, precio_hora, estado, disponible_hoy, fecha_activacion, fecha_desact) VALUES 
(1, 'Maracaná 5', 'Fútbol 5', 'Av. Principal #450', 'Sintética Premium', 50.00, 'activo', TRUE, '2025-01-01 00:00:00', '2030-12-31 23:59:59'),
(2, 'Camp Nou 7', 'Fútbol 7', 'Av. Principal #450', 'Césped Natural', 70.00, 'activo', TRUE, '2025-01-01 00:00:00', '2030-12-31 23:59:59');

-- Inserción segura del Administrador (Previene duplicidad de Primary Key en ejecuciones repetidas)
INSERT INTO USUARIO (
    id_usuario,
    nombre, 
    email, 
    contraseña_hash, 
    tel, 
    biografia, 
    Tipo, 
    foto, 
    posicion, 
    fk_id_evento
) VALUES (
    1,
    'Administrador Central',
    'admin@ejemplo.com',
    '$2a$10$JascO//eTcWAb7MMTNJgRO9qVmD6p6KFd6XavR4hTbGJXs/FSKHTm', -- 'Admin123*' en BCrypt
    '+123456789',
    'Cuenta de administrador para pruebas del sistema.',
    'admin',
    'perfil_admin.png',
    'Director Técnico',
    NULL
) ON DUPLICATE KEY UPDATE
    `contraseña_hash` = VALUES(`contraseña_hash`),
    nombre = VALUES(nombre),
    tel = VALUES(tel),
    biografia = VALUES(biografia),
    Tipo = VALUES(Tipo),
    foto = VALUES(foto),
    posicion = VALUES(posicion);

-- Usuarios de prueba adicionales
INSERT INTO USUARIO (id_usuario, nombre, email, contraseña_hash, Tipo, posicion) VALUES
(2, 'Carlos Tévez', 'carlos@ejemplo.com', '$2a$10$X...', 'player', 'Delantero'),
(3, 'Juan Román', 'roman@ejemplo.com', '$2a$10$X...', 'organizer', 'Mediocampista'),
(4, 'Diego Armando', 'diego@ejemplo.com', '$2a$10$X...', 'player', 'Enganche');

-- Histórico Completo de EVENTOS y PAGOS

-- LUNES
INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (10, 1, 50.00, '2026-05-04 18:00:00', '2026-05-04 19:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (10, 50.00, 'tarjeta', 'pagado', '2026-05-04 17:30:00', 10);

INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (11, 1, 50.00, '2026-05-11 19:00:00', '2026-05-11 20:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (11, 50.00, 'efectivo', 'pagado', '2026-05-11 19:00:00', 11);

-- MARTES
INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (20, 1, 50.00, '2026-05-05 20:00:00', '2026-05-05 21:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (20, 50.00, 'transferencia', 'pagado', '2026-05-05 19:45:00', 20);

-- MIÉRCOLES
INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (30, 1, 50.00, '2026-05-06 19:00:00', '2026-05-06 20:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (30, 50.00, 'tarjeta', 'pagado', '2026-05-06 18:15:00', 30);

INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (31, 1, 50.00, '2026-05-13 21:00:00', '2026-05-13 22:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (31, 50.00, 'tarjeta', 'pagado', '2026-05-13 20:50:00', 31);

-- JUEVES
INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (40, 1, 50.00, '2026-05-07 18:00:00', '2026-05-07 20:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (40, 100.00, 'transferencia', 'pagado', '2026-05-07 17:00:00', 40);

INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (41, 1, 50.00, '2026-05-14 20:00:00', '2026-05-14 22:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (41, 100.00, 'efectivo', 'pagado', '2026-05-14 20:00:00', 41);

-- VIERNES
INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (50, 1, 55.00, '2026-05-01 18:00:00', '2026-05-01 20:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (50, 110.00, 'tarjeta', 'pagado', '2026-05-01 15:20:00', 50);

INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (51, 1, 55.00, '2026-05-08 20:00:00', '2026-05-08 22:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (51, 110.00, 'transferencia', 'pagado', '2026-05-08 19:10:00', 51);

INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (52, 1, 55.00, '2026-05-15 22:00:00', '2026-05-15 23:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (52, 55.00, 'tarjeta', 'pagado', '2026-05-15 21:40:00', 52);

-- SÁBADO
INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (60, 1, 60.00, '2026-05-02 14:00:00', '2026-05-02 16:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (60, 120.00, 'tarjeta', 'pagado', '2026-05-02 11:00:00', 60);

INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (61, 1, 65.00, '2026-05-02 17:00:00', '2026-05-02 19:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (61, 130.00, 'tarjeta', 'pagado', '2026-05-02 16:45:00', 61);

INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (62, 1, 65.00, '2026-05-09 19:00:00', '2026-05-09 21:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (62, 130.00, 'transferencia', 'pagado', '2026-05-08 22:00:00', 62);

-- DOMINGO
INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (70, 1, 50.00, '2026-05-03 10:00:00', '2026-05-03 12:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (70, 100.00, 'efectivo', 'pagado', '2026-05-03 12:00:00', 70);

INSERT INTO EVENTO (id_evento, fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores) VALUES (71, 1, 50.00, '2026-05-10 16:00:00', '2026-05-10 18:00:00', 10);
INSERT INTO PAGO (id_pago, total, metodo, estado, fecha_pago, fk_id_evento) VALUES (71, 100.00, 'tarjeta', 'pagado', '2026-05-10 15:30:00', 71);

-- =====================================================================
-- 🔄 10. ACTUALIZAR LAS RELACIONES CRUZADAS (LLAVES CIRCULARES)
-- =====================================================================
UPDATE EVENTO SET id_pago = 10 WHERE id_evento = 10;
UPDATE EVENTO SET id_pago = 11 WHERE id_evento = 11;
UPDATE EVENTO SET id_pago = 20 WHERE id_evento = 20;
UPDATE EVENTO SET id_pago = 30 WHERE id_evento = 30;
UPDATE EVENTO SET id_pago = 31 WHERE id_evento = 31;
UPDATE EVENTO SET id_pago = 40 WHERE id_evento = 40;
UPDATE EVENTO SET id_pago = 41 WHERE id_evento = 41;
UPDATE EVENTO SET id_pago = 50 WHERE id_evento = 50;
UPDATE EVENTO SET id_pago = 51 WHERE id_evento = 51;
UPDATE EVENTO SET id_pago = 52 WHERE id_evento = 52;
UPDATE EVENTO SET id_pago = 60 WHERE id_evento = 60;
UPDATE EVENTO SET id_pago = 61 WHERE id_evento = 61;
UPDATE EVENTO SET id_pago = 62 WHERE id_evento = 62;
UPDATE EVENTO SET id_pago = 70 WHERE id_evento = 70;
UPDATE EVENTO SET id_pago = 71 WHERE id_evento = 71;

-- REACTIVAR LA VERIFICACIÓN DE LLAVES FORÁNEAS
SET FOREIGN_KEY_CHECKS = 1;
