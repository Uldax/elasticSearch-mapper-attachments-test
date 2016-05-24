DROP TABLE IF EXISTS public.update;
CREATE TABLE public.update(
	update_id    SERIAL NOT NULL ,
	op CHAR NOT NULL,
	updated TIMESTAMP NOT NULL,
	CONSTRAINT prk_constraint_update PRIMARY KEY (update_id)
)WITHOUT OIDS;