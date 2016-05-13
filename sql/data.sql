------------------------------------------------------------
--        Insert Data Into DB 
------------------------------------------------------------

DELETE FROM public.application_privilege_group;
DELETE FROM public.application;
DELETE FROM public.group;
DELETE FROM public.privilege;

ALTER SEQUENCE application_application_id_seq RESTART;
ALTER SEQUENCE document_document_id_seq RESTART;
ALTER SEQUENCE group_group_id_seq RESTART;
ALTER SEQUENCE privilege_privilege_id_seq RESTART;

INSERT INTO application(application_name) VALUES ('SearchOpus');

INSERT INTO public.group(group_name) VALUES ('Admin');
INSERT INTO public.group(group_name) VALUES ('Super User');
INSERT INTO public.group(group_name) VALUES ('User');

INSERT INTO privilege(privilege_label) VALUES ('Admin Privilege');
INSERT INTO privilege(privilege_label) VALUES ('Super User Privilege');
INSERT INTO privilege(privilege_label) VALUES ('User Privilege');

INSERT INTO application_privilege_group(group_id, privilege_id, application_id) VALUES (1, 1, 1);
INSERT INTO application_privilege_group(group_id, privilege_id, application_id) VALUES (2, 2, 1);
INSERT INTO application_privilege_group(group_id, privilege_id, application_id) VALUES (3, 3, 1);
