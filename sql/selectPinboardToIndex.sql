
SELECT pinboard.layout.label AS label_layout, pinboard.pinboard.label AS label_Pinboard, pinboard.pin.label AS label_pin, pinboard.vote_pin.vote FROM pinboard.layout
	INNER JOIN pinboard.pinboard ON pinboard.layout.layout_id = pinboard.pinboard.layout_id
	INNER JOIN pinboard.pin ON pinboard.pinboard.pinboard_id = pinboard.pin.pinboard_id
	INNER JOIN pinboard.vote_pin ON pinboard.pin.pin_id = pinboard.vote_pin.pin_id;
