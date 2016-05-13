------------------------------------------------------------
--        Script Postgre 
------------------------------------------------------------



------------------------------------------------------------
-- Table: group
------------------------------------------------------------
CREATE TABLE public.group(
	group_id   SERIAL NOT NULL ,
	group_name VARCHAR (25)  ,
	CONSTRAINT prk_constraint_group PRIMARY KEY (group_id)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: application
------------------------------------------------------------
CREATE TABLE public.application(
	application_id   SERIAL NOT NULL ,
	application_name VARCHAR (25) NOT NULL ,
	CONSTRAINT prk_constraint_application PRIMARY KEY (application_id)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: privilege
------------------------------------------------------------
CREATE TABLE public.privilege(
	privilege_id    SERIAL NOT NULL ,
	privilege_label VARCHAR (50)  ,
	CONSTRAINT prk_constraint_privilege PRIMARY KEY (privilege_id)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: document
------------------------------------------------------------
CREATE TABLE public.document(
	document_id    SERIAL NOT NULL ,
	document_name  VARCHAR (100) NOT NULL ,
	application_id INT  NOT NULL ,
	CONSTRAINT prk_constraint_document PRIMARY KEY (document_id)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: application_privilege_group
------------------------------------------------------------
CREATE TABLE public.application_privilege_group(
	group_id       INT  NOT NULL ,
	privilege_id   INT  NOT NULL ,
	application_id INT  NOT NULL ,
	CONSTRAINT prk_constraint_application_privilege_group PRIMARY KEY (group_id,privilege_id,application_id)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: document_privilege
------------------------------------------------------------
CREATE TABLE public.document_privilege(
	privilege_id INT  NOT NULL ,
	document_id  INT  NOT NULL ,
	CONSTRAINT prk_constraint_document_privilege PRIMARY KEY (privilege_id,document_id)
)WITHOUT OIDS;



ALTER TABLE public.document ADD CONSTRAINT FK_document_application_id FOREIGN KEY (application_id) REFERENCES public.application(application_id);
ALTER TABLE public.application_privilege_group ADD CONSTRAINT FK_application_privilege_group_group_id FOREIGN KEY (group_id) REFERENCES public.group(group_id);
ALTER TABLE public.application_privilege_group ADD CONSTRAINT FK_application_privilege_group_privilege_id FOREIGN KEY (privilege_id) REFERENCES public.privilege(privilege_id);
ALTER TABLE public.application_privilege_group ADD CONSTRAINT FK_application_privilege_group_application_id FOREIGN KEY (application_id) REFERENCES public.application(application_id);
ALTER TABLE public.document_privilege ADD CONSTRAINT FK_document_privilege_privilege_id FOREIGN KEY (privilege_id) REFERENCES public.privilege(privilege_id);
ALTER TABLE public.document_privilege ADD CONSTRAINT FK_document_privilege_document_id FOREIGN KEY (document_id) REFERENCES public.document(document_id);
