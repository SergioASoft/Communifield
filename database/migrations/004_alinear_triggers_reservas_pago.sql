USE communifield;

DROP TRIGGER IF EXISTS prevenir_solapamiento_evento;
DROP TRIGGER IF EXISTS prevenir_solapamiento_evento_update;

DELIMITER $$

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
