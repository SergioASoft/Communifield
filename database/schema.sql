CREATE DATABASE IF NOT EXISTS communifield;
USE communifield;

CREATE TABLE USUARIO (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  contraseña_hash VARCHAR(255) NOT NULL,
  tel VARCHAR(20),
  biografia TEXT,
  Tipo ENUM('organizer', 'player', 'admin') NOT NULL,
  foto LONGTEXT,
  posicion VARCHAR(100),
  fk_id_evento INT
);

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

CREATE TABLE ESPACIO (
    id_espacio INT AUTO_INCREMENT PRIMARY KEY,
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

CREATE TABLE PAGO (
  id_pago INT AUTO_INCREMENT PRIMARY KEY,
  total DECIMAL(10,2) NOT NULL,
  metodo VARCHAR(50) NOT NULL,
  estado ENUM('pendiente', 'pagado', 'fallido', 'cancelado') DEFAULT 'pendiente',
  fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
  fk_id_evento INT NOT NULL,

  FOREIGN KEY (fk_id_evento) REFERENCES EVENTO(id_evento)
);

ALTER TABLE USUARIO
ADD CONSTRAINT fk_usuario_evento
FOREIGN KEY (fk_id_evento) REFERENCES EVENTO(id_evento);

ALTER TABLE EVENTO
ADD CONSTRAINT fk_evento_pago
FOREIGN KEY (id_pago) REFERENCES PAGO(id_pago);

CREATE INDEX idx_evento_espacio_fechas 
ON EVENTO(fk_id_espacio, fecha_inic, fecha_fin);

DELIMITER $$

-- 1️⃣ Validar que la fecha de inicio no sea mayor o igual a la de fin
CREATE TRIGGER validar_fechas_evento
BEFORE INSERT ON EVENTO
FOR EACH ROW
BEGIN
    IF NEW.fecha_inic >= NEW.fecha_fin THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La fecha de inicio debe ser menor a la de fin';
    END IF;
END$$


-- 2️⃣ Evitar el solapamiento de horarios al insertar un evento
CREATE TRIGGER prevenir_solapamiento_evento
BEFORE INSERT ON EVENTO
FOR EACH ROW
BEGIN
    DECLARE conteo_conflictos INT;

    SELECT COUNT(*) INTO conteo_conflictos
    FROM EVENTO
    WHERE fk_id_espacio = NEW.fk_id_espacio
    AND (
        (NEW.fecha_inic BETWEEN fecha_inic AND fecha_fin)
        OR
        (NEW.fecha_fin BETWEEN fecha_inic AND fecha_fin)
        OR
        (fecha_inic BETWEEN NEW.fecha_inic AND NEW.fecha_fin)
    );

    IF conteo_conflictos > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La cancha no está disponible en ese horario';
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

    SELECT fecha_activacion, fecha_desact, estado
    INTO f_act, f_desact, est_espacio
    FROM ESPACIO
    WHERE id_espacio = NEW.fk_id_espacio;

    -- Validar que el espacio esté activo
    IF est_espacio != 'activo' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La cancha no está activa o se encuentra en mantenimiento';
    END IF;

    -- Validar límites de fecha (evitando errores si fecha_desact es NULL)
    IF NEW.fecha_inic < f_act OR (f_desact IS NOT NULL AND NEW.fecha_fin > f_desact) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El evento está fuera del rango de fechas permitido para este espacio';
    END IF;
END$$


-- 4️⃣ Evitar solapamiento de horarios al actualizar (UPDATE) un evento existente
CREATE TRIGGER prevenir_solapamiento_evento_update
BEFORE UPDATE ON EVENTO
FOR EACH ROW
BEGIN
    DECLARE conteo_conflictos INT;

    -- Validación básica de consistencia de fechas en el update
    IF NEW.fecha_inic >= NEW.fecha_fin THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La fecha de inicio debe ser menor a la de fin';
    END IF;

    SELECT COUNT(*) INTO conteo_conflictos
    FROM EVENTO
    WHERE fk_id_espacio = NEW.fk_id_espacio
    AND id_evento != OLD.id_evento -- Excluye el mismo evento que se está modificando
    AND (
        (NEW.fecha_inic BETWEEN fecha_inic AND fecha_fin)
        OR
        (NEW.fecha_fin BETWEEN fecha_inic AND fecha_fin)
        OR
        (fecha_inic BETWEEN NEW.fecha_inic AND NEW.fecha_fin)
    );

    IF conteo_conflictos > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Conflicto de horario al actualizar el evento';
    END IF;
END$$

DELIMITER ;

INSERT INTO USUARIO (
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
