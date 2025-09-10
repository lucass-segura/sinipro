-- Función para resetear avisos automáticamente 15 días antes del vencimiento
CREATE OR REPLACE FUNCTION reset_expired_notices()
RETURNS void AS $$
BEGIN
    -- Resetear avisos pagados que están a 15 días o menos del vencimiento
    UPDATE policy_notices 
    SET status = 'avisar'
    WHERE status = 'pagado' 
    AND due_date <= CURRENT_DATE + INTERVAL '15 days';
END;
$$ LANGUAGE plpgsql;

-- Crear un trigger que se ejecute diariamente (esto requeriría configuración adicional en producción)
-- Por ahora, esta función se puede llamar manualmente o mediante un cron job
