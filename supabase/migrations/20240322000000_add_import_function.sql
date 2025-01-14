-- Drop existing function if it exists
DROP FUNCTION IF EXISTS import_revolut_transactions(jsonb[], date, uuid);

-- Create the import function
CREATE OR REPLACE FUNCTION import_revolut_transactions(
  p_transactions jsonb[],
  p_month date,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_import_session_id uuid;
  v_transaction record;
  v_valid_count integer := 0;
  v_total_count integer := 0;
BEGIN
  -- Start transaction
  BEGIN
    -- Create import session
    INSERT INTO import_sessions (user_id, month, transaction_count, valid_transaction_count, status)
    VALUES (p_user_id, p_month, array_length(p_transactions, 1), 0, 'completed')
    RETURNING id INTO v_import_session_id;

    -- Delete existing transactions for the month
    DELETE FROM transactions 
    WHERE user_id = p_user_id 
    AND date_trunc('month', date) = date_trunc('month', p_month);

    -- Insert new transactions
    FOR v_transaction IN SELECT * FROM jsonb_array_elements(array_to_json(p_transactions)::jsonb)
    LOOP
      v_total_count := v_total_count + 1;
      
      IF (v_transaction.value->>'is_valid')::boolean THEN
        v_valid_count := v_valid_count + 1;
      END IF;

      INSERT INTO transactions (
        user_id,
        amount,
        category,
        description,
        date,
        type,
        import_session_id,
        original_description,
        is_valid,
        invalid_reason
      ) VALUES (
        p_user_id,
        (v_transaction.value->>'amount')::numeric,
        v_transaction.value->>'category',
        v_transaction.value->>'description',
        (v_transaction.value->>'date')::date,
        'expense',
        v_import_session_id,
        v_transaction.value->>'original_description',
        (v_transaction.value->>'is_valid')::boolean,
        v_transaction.value->>'invalid_reason'
      );
    END LOOP;

    -- Update import session with final counts
    UPDATE import_sessions 
    SET transaction_count = v_total_count,
        valid_transaction_count = v_valid_count
    WHERE id = v_import_session_id;

    -- Return success response
    RETURN jsonb_build_object(
      'success', true,
      'import_session_id', v_import_session_id,
      'total_count', v_total_count,
      'valid_count', v_valid_count
    );
  EXCEPTION WHEN OTHERS THEN
    -- Update import session status to failed
    UPDATE import_sessions 
    SET status = 'failed'
    WHERE id = v_import_session_id;
    
    RAISE;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION import_revolut_transactions TO authenticated;