CREATE DATABASE IF NOT EXISTS communifield;
USE communifield;

-- =========================
-- 👤 USERS
-- =========================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    type ENUM('organizer', 'player', 'admin') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 💳 PAYMENT
-- =========================
CREATE TABLE payment (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    total DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    payment_date DATETIME
);

-- =========================
-- 🏟️ SPACE
-- =========================
CREATE TABLE space (
    space_id INT PRIMARY KEY AUTO_INCREMENT,
    venue VARCHAR(200) NOT NULL,
    status VARCHAR(50) NOT NULL,
    activation_date DATETIME,
    deactivation_date DATETIME
);

-- =========================
-- 📅 EVENT
-- =========================
CREATE TABLE event (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    space_id INT NOT NULL,
    payment_id INT,
    event_data JSON,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    max_players INT,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (space_id) REFERENCES space(space_id),
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
);



-- =========================
-- 🤝 FRIENDS (COMUNIDAD)
-- =========================
CREATE TABLE friends (
    friendship_id INT PRIMARY KEY AUTO_INCREMENT,
    requester_id INT NOT NULL,
    addressee_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'blocked') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (requester_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (addressee_id) REFERENCES users(user_id) ON DELETE CASCADE,

    UNIQUE KEY unique_friendship (requester_id, addressee_id)
);

-- =========================
-- ⚡ ÍNDICES (RENDIMIENTO)
-- =========================
CREATE INDEX idx_event_space_dates 
ON event(space_id, start_date, end_date);

-- =========================
-- 🔒 TRIGGERS
-- =========================

DELIMITER $$

-- ✅ Validar fechas básicas
CREATE TRIGGER validate_event_dates
BEFORE INSERT ON event
FOR EACH ROW
BEGIN
    IF NEW.start_date >= NEW.end_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La fecha de inicio debe ser menor a la de fin';
    END IF;
END$$

-- 🚫 Evitar solapamiento
CREATE TRIGGER prevent_event_overlap
BEFORE INSERT ON event
FOR EACH ROW
BEGIN
    DECLARE conflict_count INT;

    SELECT COUNT(*) INTO conflict_count
    FROM event
    WHERE space_id = NEW.space_id
    AND (
        (NEW.start_date BETWEEN start_date AND end_date)
        OR
        (NEW.end_date BETWEEN start_date AND end_date)
        OR
        (start_date BETWEEN NEW.start_date AND NEW.end_date)
    );

    IF conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La cancha no está disponible en ese horario';
    END IF;
END$$

-- 🏟️ Validar disponibilidad del espacio
CREATE TRIGGER validate_space_availability
BEFORE INSERT ON event
FOR EACH ROW
BEGIN
    DECLARE act_date DATETIME;
    DECLARE deact_date DATETIME;
    DECLARE space_status VARCHAR(50);

    SELECT activation_date, deactivation_date, status
    INTO act_date, deact_date, space_status
    FROM space
    WHERE space_id = NEW.space_id;

    IF space_status != 'active' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La cancha no está activa';
    END IF;

    IF NEW.start_date < act_date OR NEW.end_date > deact_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El evento está fuera del rango del espacio';
    END IF;
END$$

-- 🔁 Validar en UPDATE
CREATE TRIGGER prevent_event_overlap_update
BEFORE UPDATE ON event
FOR EACH ROW
BEGIN
    DECLARE conflict_count INT;

    SELECT COUNT(*) INTO conflict_count
    FROM event
    WHERE space_id = NEW.space_id
    AND event_id != OLD.event_id
    AND (
        (NEW.start_date BETWEEN start_date AND end_date)
        OR
        (NEW.end_date BETWEEN start_date AND end_date)
        OR
        (start_date BETWEEN NEW.start_date AND NEW.end_date)
    );

    IF conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Conflicto de horario al actualizar';
    END IF;
END$$

DELIMITER ;