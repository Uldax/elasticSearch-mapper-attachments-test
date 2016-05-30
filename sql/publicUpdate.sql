DROP TABLE IF EXISTS public.update;
CREATE TABLE public.update(
	update_id SERIAL NOT NULL ,
	type_id   INT   ,
	op        CHAR (25)  NOT NULL ,
	updated   TIMESTAMP  NOT NULL ,
	CONSTRAINT prk_constraint_update PRIMARY KEY (update_id,type_id)
)WITHOUT OIDS;


ALTER TABLE public.update ADD CONSTRAINT FK_update_type_id FOREIGN KEY (type_id) REFERENCES content.type(type_id);


------------------------------------------------------------
-- Trigger: version change
------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_version_change()
  RETURNS trigger AS
$BODY$
DECLARE
    up_id integer;
    t_id  integer;
    tableKey Char(25);
BEGIN

    tableKey := version_id;
    IF NEW.tableKey IS NULL THEN
        up_id := OLD.tableKey;
    ELSE 
        up_id := NEW.tableKey;
    END IF;
    -- Check if there si already an update  
    IF EXISTS (SELECT 1 FROM public.update 
        JOIN content.type ON public.type_id
        WHERE update_id = up_id AND content.type.table_name = TG_TABLE_NAME ) 
        THEN
        UPDATE public.update SET op=TG_OP, updated=now() WHERE update_id=up_id;
    ELSE
        -- test here ?
        
        SELECT (type_id) INTO t_id FROM content.type WHERE table_name = TG_TABLE_NAME;
        INSERT INTO public.update (update_id, t_id, op, updated) VALUES (up_id,t_id,TG_OP, now());
    END IF;
        
    RETURN NULL;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION on_version_change()
  OWNER TO superopus;


-- set triger
DROP TRIGGER IF EXISTS version_change_trigger ON file.version;
CREATE TRIGGER version_change_trigger 
AFTER INSERT OR UPDATE OR DELETE  
ON file.version  
FOR EACH ROW  
EXECUTE PROCEDURE on_version_change()