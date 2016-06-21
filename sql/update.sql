DROP TABLE IF EXISTS public.update;
CREATE TABLE public.update(
	update_id INT NOT NULL ,
	type_id   INT NOT NULL  ,
	op        CHAR (1)  NOT NULL ,
	updated   TIMESTAMP  NOT NULL ,
	CONSTRAINT prk_constraint_update PRIMARY KEY (update_id,type_id,op)
)WITHOUT OIDS;


ALTER TABLE public.update ADD CONSTRAINT FK_update_type_id FOREIGN KEY (type_id) REFERENCES content.type(type_id);

-- be sur every type are set

INSERT into content.type(
  table_schema,
  table_name,
  application_id,
  name_token_id,
  function_name_to_notify_groups_about_an_event
  ) VALUES(
      'pinboard',
      'vote_pin',
      6,
      16,
      'pinboard.get_groups_to_notify_about_pin'
  );


------------------------------------------------------------
-- Trigger: version change
------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_change()
  RETURNS trigger AS
$BODY$
DECLARE
    up_id integer;
    t_id  integer;
    opcode Char(1);
BEGIN    
    --tableKey := 'pin_id';
    IF TG_OP = 'DELETE' OR TG_OP = 'TRUNCATE' THEN
        opcode := 'D';
    ELSIF TG_OP = 'UPDATE' THEN 
        opcode := 'U';
    ELSIF TG_OP = 'INSERT' THEN
        opcode := 'I';    
    END IF;
       
    IF NEW.log_data_id IS NULL THEN
        up_id := OLD.log_data_id;
    ELSE 
        up_id := NEW.log_data_id;
    END IF;
    -- Check if there is already an update or insert 
    IF EXISTS (SELECT public.update.op FROM public.update
        JOIN content.type ON type.type_id = public.update.type_id 
        WHERE update_id = up_id AND content.type.table_name = TG_TABLE_NAME ) 
        THEN
        UPDATE public.update SET op=opcode, updated=now() WHERE update_id=up_id;
    ELSE
        -- test here ?
        -- type_id because couple update_id and type_id is unique
        SELECT content.type.type_id INTO t_id FROM content.type WHERE table_name = TG_TABLE_NAME;
        INSERT INTO public.update (update_id, type_id, op, updated) VALUES (up_id,t_id,opcode, now());
    END IF;
        
    RETURN NULL;
END;

$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION on_change()
  OWNER TO superopus;






CREATE OR REPLACE FUNCTION on_pin_change()
  RETURNS trigger AS
$BODY$
DECLARE
    up_id integer;
    t_id  integer;
    opcode Char(1);
    old_opcode Char(1);
BEGIN    
    --tableKey := 'pin_id';
    IF TG_OP = 'DELETE' OR TG_OP = 'TRUNCATE' THEN
        opcode := 'D';
    ELSIF TG_OP = 'UPDATE' THEN 
        opcode := 'U';
    ELSIF TG_OP = 'INSERT' THEN
        opcode := 'I';    
    END IF;
       
    IF NEW.pin_id IS NULL THEN
        up_id := OLD.pin_id;
    ELSE 
        up_id := NEW.pin_id;
    END IF;
    -- Check if there si already an update or insert 
    IF EXISTS (SELECT public.update.op FROM public.update
        JOIN content.type ON type.type_id = public.update.type_id 
        WHERE log_data_id = up_id AND content.type.table_name = TG_TABLE_NAME ) 
        THEN
        UPDATE public.update SET op=opcode, updated=now() WHERE log_data_id=up_id;
    ELSE
        -- test here ?
        -- type_id because couple log_data_id and type_id is unique
        SELECT content.type.type_id INTO t_id FROM content.type WHERE table_name = TG_TABLE_NAME;
        INSERT INTO public.update (log_data_id, type_id, op, updated) VALUES (up_id,t_id,opcode, now());
    END IF;
        
    RETURN NULL;
END;

$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION on_pin_change()
  OWNER TO superopus;
  

-- version trigger

CREATE OR REPLACE FUNCTION on_version_change()
  RETURNS trigger AS
$BODY$
DECLARE
    up_id integer;
    t_id  integer;
    opcode Char(1);
BEGIN
     
    IF TG_OP = 'UPDATE' THEN 
        opcode := 'U';
    ELSIF TG_OP = 'INSERT' THEN
        opcode := 'I';    
    END IF;
    
    up_id := NEW.version_id;
    -- Check if there is already an update  
    IF EXISTS (SELECT 1 FROM public.update
        JOIN content.type ON type.type_id = public.update.type_id 
        WHERE log_data_id = up_id AND content.type.table_name = TG_TABLE_NAME ) 
        THEN
        UPDATE public.update SET op=opcode, updated=now() WHERE log_data_id=up_id;
    ELSE
        -- type_id because couple log_data_id and type_id is unique
        SELECT content.type.type_id INTO t_id FROM content.type WHERE table_name = TG_TABLE_NAME;
        INSERT INTO public.update (log_data_id, type_id, op, updated) VALUES (up_id,t_id,opcode, now());
    END IF;
        
    RETURN NULL;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION on_version_change()
  OWNER TO superopus;


-- document_ groupe triger
CREATE OR REPLACE FUNCTION on_document_group_change()
  RETURNS trigger AS
$BODY$
DECLARE
    up_id integer;
    t_id  integer;
    opcode Char(1);
BEGIN
     
    --tableKey := 'pin_id';
    IF TG_OP = 'DELETE' OR TG_OP = 'TRUNCATE' THEN
        opcode := 'D';
    ELSIF TG_OP = 'UPDATE' THEN 
        opcode := 'U';
    ELSIF TG_OP = 'INSERT' THEN
        opcode := 'I';    
    END IF;
    IF NEW.file_id IS NULL THEN
        up_id := OLD.file_id;
    ELSE 
        up_id := NEW.file_id;
    END IF;

    SELECT content.type.type_id INTO t_id FROM content.type WHERE table_name = TG_TABLE_NAME;
    INSERT INTO public.update (log_data_id, type_id, op, updated) VALUES (up_id,t_id,opcode, now());
        
    RETURN NULL;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION on_document_group_change()
  OWNER TO superopus;




--pinboard trigger

CREATE OR REPLACE FUNCTION on_pinboard_change()
  RETURNS trigger AS
$BODY$
DECLARE
    up_id integer;
    t_id  integer;
    opcode Char(1);
BEGIN
     
    --tableKey := 'pin_id';
    IF TG_OP = 'DELETE' OR TG_OP = 'TRUNCATE' THEN
        opcode := 'D';
    ELSIF TG_OP = 'UPDATE' THEN 
        opcode := 'U';
    ELSIF TG_OP = 'INSERT' THEN
        opcode := 'I';    
    END IF;
    IF NEW.pinboard_id IS NULL THEN
        up_id := OLD.pinboard_id;
    ELSE 
        up_id := NEW.pinboard_id;
    END IF;
    -- Check if there si already an update  
    IF EXISTS (SELECT 1 FROM public.update
        JOIN content.type ON type.type_id = public.update.type_id 
        WHERE log_data_id = up_id 
        AND content.type.table_name = TG_TABLE_NAME
        AND public.update.op = opcode ) 
        THEN
        UPDATE public.update SET op=opcode, updated=now() WHERE log_data_id=up_id;
    ELSE
        -- test here ?
        -- type_id because couple log_data_id and type_id is unique
        SELECT content.type.type_id INTO t_id FROM content.type WHERE table_name = TG_TABLE_NAME;
        INSERT INTO public.update (log_data_id, type_id, op, updated) VALUES (up_id,t_id,opcode, now());
    END IF;
        
    RETURN NULL;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION on_pinboard_change()
  OWNER TO superopus;

--layout trigger

CREATE OR REPLACE FUNCTION on_layout_change()
  RETURNS trigger AS
$BODY$
DECLARE
    up_id integer;
    t_id  integer;
    opcode Char(1);
BEGIN
     
    --tableKey := 'pin_id';
    IF TG_OP = 'DELETE' OR TG_OP = 'TRUNCATE' THEN
        opcode := 'D';
    ELSIF TG_OP = 'UPDATE' THEN 
        opcode := 'U';
    ELSIF TG_OP = 'INSERT' THEN
        opcode := 'I';    
    END IF;
    IF NEW.layout_id IS NULL THEN
        up_id := OLD.layout_id;
    ELSE 
        up_id := NEW.layout_id;
    END IF;
    -- Check if there si already an update  
    IF EXISTS (SELECT 1 FROM public.update
        JOIN content.type ON type.type_id = public.update.type_id 
        WHERE log_data_id = up_id AND content.type.table_name = TG_TABLE_NAME ) 
        THEN
        UPDATE public.update SET op=opcode, updated=now() WHERE log_data_id=up_id;
    ELSE
        -- test here ?
        -- type_id because couple log_data_id and type_id is unique
        SELECT content.type.type_id INTO t_id FROM content.type WHERE table_name = TG_TABLE_NAME;
        INSERT INTO public.update (log_data_id, type_id, op, updated) VALUES (up_id,t_id,opcode, now());
    END IF;
        
    RETURN NULL;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION on_layout_change()
  OWNER TO superopus;





-- set triger
DROP TRIGGER IF EXISTS version_change_trigger ON file.version;
DROP TRIGGER IF EXISTS pinboard_change_trigger ON pinboard.pinboard;
DROP TRIGGER IF EXISTS pin_change_trigger ON pinboard.pin;
DROP TRIGGER IF EXISTS layout_change_trigger ON pinboard.layout;
DROP TRIGGER IF EXISTS vote_change_trigger ON pinboard.vote_pin;
DROP TRIGGER IF EXISTS document_group_change_trigger ON file.file_group;
DROP TRIGGER IF EXISTS pinboard_group_change_trigger ON pinboard.pinboard_group;



CREATE TRIGGER version_change_trigger 
AFTER INSERT OR UPDATE  
ON file.version  
FOR EACH ROW  
EXECUTE PROCEDURE on_change();


CREATE TRIGGER document_group_change_trigger 
AFTER INSERT OR DELETE  
ON file.file_group  
FOR EACH ROW  
EXECUTE PROCEDURE on_change();


CREATE TRIGGER pinboard_change_trigger 
AFTER UPDATE  
ON pinboard.pinboard  
FOR EACH ROW  
EXECUTE PROCEDURE on_change();


CREATE TRIGGER pin_change_trigger 
AFTER INSERT OR UPDATE  
ON pinboard.pin 
FOR EACH ROW  
EXECUTE PROCEDURE on_change();

CREATE TRIGGER layout_change_trigger 
AFTER UPDATE  
ON pinboard.layout
FOR EACH ROW  
EXECUTE PROCEDURE on_change();

CREATE TRIGGER vote_change_trigger 
AFTER INSERT OR UPDATE  
ON pinboard.vote_pin
FOR EACH ROW  
EXECUTE PROCEDURE on_change();

CREATE TRIGGER pinboard_group_change_trigger 
AFTER INSERT OR DELETE  
ON pinboard.pinboard_group
FOR EACH ROW  
EXECUTE PROCEDURE on_change();


