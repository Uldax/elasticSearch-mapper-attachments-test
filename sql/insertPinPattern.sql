--Supprimer le contenu de toutes les tables en rapport avec les babillards
--TRUNCATE TABLE pinboard.layout CASCADE;
--TRUNCATE TABLE pinboard.pinboard CASCADE;
--TRUNCATE TABLE pinboard.pin CASCADE;

INSERT INTO pinboard.layout(label, width, height, user_id) VALUES ('layoutTest', 200, 200, 1);

INSERT INTO pinboard.pinboard(label, layout_id, user_id) VALUES ('testPinboard', (SELECT layout_id FROM pinboard.layout WHERE label = 'layoutTest'), 1);

INSERT INTO pinboard.pin(pinboard_id, label, user_id) VALUES ((SELECT pinboard_id FROM pinboard.pinboard WHERE label = 'testPinboard'), 'testPin', 1);