-- =====================================================
-- Purge Stale Pending Data (Older than 48 Hours)
-- =====================================================

CREATE OR REPLACE FUNCTION purge_stale_investments()
RETURNS TABLE (deleted_count INT) AS $$
DECLARE
    affected_rows INT;
BEGIN
    -- Delete stale transactions first (foreign key dependency usually handles this but good to be explicit)
    DELETE FROM transactions 
    WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL '48 hours';

    -- Delete stale investments
    DELETE FROM investments 
    WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL '48 hours';
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN QUERY SELECT affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: In a production Supabase environment, you would use pg_cron to schedule this:
-- SELECT cron.schedule('purge-stale', '0 0 * * *', 'SELECT purge_stale_investments()');
