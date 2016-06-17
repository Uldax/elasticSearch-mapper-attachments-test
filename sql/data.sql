
--On supprime le contenu des tables
TRUNCATE TABLE public.update;
TRUNCATE TABLE file.folder CASCADE;
TRUNCATE TABLE file.file CASCADE;
TRUNCATE TABLE file.version CASCADE;

--On crée les dossiers où sont stockés nos fichiers
INSERT INTO file.folder (label, user_id) VALUES ('root', 1);
INSERT INTO file.folder (parent_id, label, user_id) VALUES ((SELECT folder_id FROM file.folder WHERE label='root'), 'paul', 1);
INSERT INTO file.folder (parent_id, label, user_id) VALUES ((SELECT folder_id FROM file.folder WHERE label='root'), 'cedric', 1);

--On crée les fichiers qu'on associe avec le bon dossier
INSERT INTO file.file (label, folder_id, user_id) VALUES ('departM2.pdf', (SELECT folder_id FROM file.folder WHERE label='cedric'), 1);
INSERT INTO file.file (label, folder_id, user_id) VALUES ('MORA_Cedric_Cover_letter_Sherbrooke.docx', (SELECT folder_id FROM file.folder WHERE label='cedric'), 1);
INSERT INTO file.file (label, folder_id, user_id) VALUES ('MORA_Cedric_English_CV.docx', (SELECT folder_id FROM file.folder WHERE label='cedric'), 1);
INSERT INTO file.file (label, folder_id, user_id) VALUES ('MORA_Cedric_Lettre_motiv_Canada.docx', (SELECT folder_id FROM file.folder WHERE label='paul'), 1);
INSERT INTO file.file (label, folder_id, user_id) VALUES ('MORACedric_Cover_letter_Sherbrooke.pdf', (SELECT folder_id FROM file.folder WHERE label='paul'), 1);
INSERT INTO file.file (label, folder_id, user_id) VALUES ('MORACedric_English_CV.pdf', (SELECT folder_id FROM file.folder WHERE label='paul'), 1);

--On crée les versions qu'on associe avec le bon fichier
INSERT INTO file.version (file_id, label, path, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='departM2.pdf'), 'first version', 'indexedDocuments/cedric/departM2.pdf', 1);
INSERT INTO file.version (file_id, label, path, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='MORA_Cedric_Cover_letter_Sherbrooke.docx'), 'first version', 'indexedDocuments/cedric/MORA_Cedric_Cover_letter_Sherbrooke.docx', 1);
INSERT INTO file.version (file_id, label, path, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='MORA_Cedric_English_CV.docx'), 'first version', 'indexedDocuments/cedric/MORA_Cedric_English_CV.docx', 1);
INSERT INTO file.version (file_id, label, path, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='MORA_Cedric_Lettre_motiv_Canada.docx'), 'first version', 'indexedDocuments/paul/MORA_Cedric_Lettre_motiv_Canada.docx', 1);
INSERT INTO file.version (file_id, label, path, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='MORACedric_Cover_letter_Sherbrooke.pdf'), 'first version', 'indexedDocuments/paul/MORACedric_Cover_letter_Sherbrooke.pdf', 1);
INSERT INTO file.version (file_id, label, path, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='MORACedric_English_CV.pdf'), 'first version', 'indexedDocuments/paul/MORACedric_English_CV.pdf', 1);

------------------------------------------------------------------------------------
--                     BABILLARDS
------------------------------------------------------------------------------------

--On supprime le contenu des tables
TRUNCATE TABLE pinboard.layout CASCADE;
TRUNCATE TABLE pinboard.pinboard CASCADE;
TRUNCATE TABLE pinboard.pin CASCADE;
TRUNCATE TABLE pinboard.vote_pin CASCADE;

--On crée un layout
INSERT INTO pinboard.layout (label, width, height, user_id) VALUES ('layoutTest', 200, 200, 1);

--On crée les pinboard qu'on associe avec le layout
INSERT INTO pinboard.pinboard (label, layout_id, user_id) VALUES ('firstPinboard', (SELECT layout_id FROM pinboard.layout WHERE label='layoutTest'), 1);
INSERT INTO pinboard.pinboard (label, layout_id, user_id) VALUES ('secondPinboard', (SELECT layout_id FROM pinboard.layout WHERE label='layoutTest'), 1);

--On crée les pin qu'on associe avec le bon pinboard
INSERT INTO pinboard.pin (pinboard_id, label, user_id) VALUES ((SELECT pinboard_id FROM pinboard.pinboard WHERE label='firstPinboard'), 'firstPin', 1);
INSERT INTO pinboard.pin (pinboard_id, label, user_id) VALUES ((SELECT pinboard_id FROM pinboard.pinboard WHERE label='firstPinboard'), 'secondPin', 1);
INSERT INTO pinboard.pin (pinboard_id, label, user_id) VALUES ((SELECT pinboard_id FROM pinboard.pinboard WHERE label='firstPinboard'), 'thirdPin', 1);
INSERT INTO pinboard.pin (pinboard_id, label, user_id) VALUES ((SELECT pinboard_id FROM pinboard.pinboard WHERE label='secondPinboard'), 'fourthPin', 1);
INSERT INTO pinboard.pin (pinboard_id, label, user_id) VALUES ((SELECT pinboard_id FROM pinboard.pinboard WHERE label='secondPinboard'), 'fifthPin', 1);
INSERT INTO pinboard.pin (pinboard_id, label, user_id) VALUES ((SELECT pinboard_id FROM pinboard.pinboard WHERE label='secondPinboard'), 'sixthPin', 1);

--On crée les votes associés aux pins
INSERT INTO pinboard.vote_pin (pin_id, vote, user_id) VALUES ((SELECT pin_id FROM pinboard.pin WHERE label='firstPin'), 5, 1);
INSERT INTO pinboard.vote_pin (pin_id, vote, user_id) VALUES ((SELECT pin_id FROM pinboard.pin WHERE label='secondPin'), 3, 1);
INSERT INTO pinboard.vote_pin (pin_id, vote, user_id) VALUES ((SELECT pin_id FROM pinboard.pin WHERE label='thirdPin'), 1, 1);
INSERT INTO pinboard.vote_pin (pin_id, vote, user_id) VALUES ((SELECT pin_id FROM pinboard.pin WHERE label='fourthPin'), 8, 1);
INSERT INTO pinboard.vote_pin (pin_id, vote, user_id) VALUES ((SELECT pin_id FROM pinboard.pin WHERE label='fifthPin'), 7, 1);
INSERT INTO pinboard.vote_pin (pin_id, vote, user_id) VALUES ((SELECT pin_id FROM pinboard.pin WHERE label='sixthPin'), 10, 1);

------------------------------------------------------------------------------------
--                  GROUPS/DROITS
------------------------------------------------------------------------------------

--On supprime les groupe s'ils existent
DELETE FROM public.groups WHERE label='groupe 1';
DELETE FROM public.groups WHERE label='groupe 2';
DELETE FROM public.groups WHERE label='groupe 3';

--On crée les groupes
INSERT INTO public.groups (label, user_id) VALUES ('groupe 1', 1);
INSERT INTO public.groups (label, user_id) VALUES ('groupe 2', 1);
INSERT INTO public.groups (label, user_id) VALUES ('groupe 3', 1);

--On vide la table file_group
TRUNCATE TABLE file.file_group;

--On associe les fichiers aux groupes
INSERT INTO file.file_group (file_id, group_id, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='departM2.pdf'),(SELECT group_id FROM public.groups WHERE label='groupe 1'), 1);
INSERT INTO file.file_group (file_id, group_id, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='departM2.pdf'),(SELECT group_id FROM public.groups WHERE label='groupe 3'), 1);
INSERT INTO file.file_group (file_id, group_id, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='MORA_Cedric_Cover_letter_Sherbrooke.docx'),(SELECT group_id FROM public.groups WHERE label='groupe 1'), 1);
INSERT INTO file.file_group (file_id, group_id, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='MORA_Cedric_Cover_letter_Sherbrooke.docx'),(SELECT group_id FROM public.groups WHERE label='groupe 2'), 1);
INSERT INTO file.file_group (file_id, group_id, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='MORA_Cedric_English_CV.docx'),(SELECT group_id FROM public.groups WHERE label='groupe 3'), 1);
INSERT INTO file.file_group (file_id, group_id, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='MORA_Cedric_Lettre_motiv_Canada.docx'),(SELECT group_id FROM public.groups WHERE label='groupe 2'), 1);
INSERT INTO file.file_group (file_id, group_id, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='MORA_Cedric_Lettre_motiv_Canada.docx'),(SELECT group_id FROM public.groups WHERE label='groupe 3'), 1);
INSERT INTO file.file_group (file_id, group_id, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='MORACedric_Cover_letter_Sherbrooke.pdf'),(SELECT group_id FROM public.groups WHERE label='groupe 1'), 1);
INSERT INTO file.file_group (file_id, group_id, user_id) VALUES ((SELECT file_id FROM file.file WHERE label='MORACedric_English_CV.pdf'),(SELECT group_id FROM public.groups WHERE label='groupe 3'), 1);
