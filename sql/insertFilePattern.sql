
-- Vider le contenu des tables en rapport avec les fichier si nécessaire
--TRUNCATE TABLE file.folder CASCADE;
--TRUNCATE TABLE file.file CASCADE;
--TRUNCATE TABLE file.version CASCADE;

INSERT INTO file.folder (label, user_id) VALUES ('racine', 1);
INSERT INTO file.folder (parent_id, label, user_id) VALUES ((SELECT folder_id FROM file.folder WHERE label = 'racine'),'indexedDocuments', 1);

INSERT INTO file.file (label, folder_id, user_id) VALUES ('test1', (SELECT folder_id FROM file.folder WHERE label ='indexedDocuments'), 1);

INSERT INTO file.version (file_id, label, path, user_id) VALUES ((SELECT file_id FROM file.file WHERE label ='test1'), 'test version 1', 'indexedDocuments/nomFichier', 1);
