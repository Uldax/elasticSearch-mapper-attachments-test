-- Function: on_account_change()

-- DROP FUNCTION on_account_change();

CREATE OR REPLACE FUNCTION on_account_change()
  RETURNS trigger AS
$BODY$
DECLARE
    opcode CHAR;
BEGIN

    IF TG_OP = 'DELETE' OR TG_OP = 'TRUNCATE' THEN
       opcode := 'D';
    ELSIF TG_OP = 'UPDATE' THEN
       opcode := 'U';
    ELSE
       opcode := 'I';
    END IF;

    -- Insert the updated account into the staging table
     IF EXISTS (SELECT 1 FROM public.update WHERE update_id = NEW.document_id) THEN
        UPDATE public.update SET op=opcode, updated=now() WHERE update_id=NEW.document_id;

    ELSE
        INSERT INTO public.update (update_id, op, updated) VALUES (NEW.document_id, opcode, now());
    END IF;

    -- Notify that the account table has been updated
    PERFORM pg_notify('file_watcher', ''||NEW.document_id);

    RETURN NULL;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION on_account_change()
  OWNER TO superopus;