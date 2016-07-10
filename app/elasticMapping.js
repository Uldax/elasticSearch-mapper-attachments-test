var mapping = {
    documentMapping: {
        "document": {
            "properties": {
                "attachment": {
                    "type": "attachment",
                    //Index all content
                    "fields": {
                        "content": {
                            "type": "string",
                            "term_vector": "with_positions_offsets",
                            "store": true
                        },
                        //Metadata supported
                        "title": { "store": "yes" },
                        "name": {
                            "store": "yes",
                            "index_analyzer": "simple"
                        },
                        //"author" : {"analyzer" : "myAnalyzer"},
                        "keywords": { "store": "yes" },
                        "content_type": { "store": "yes" },
                        "content_length": { "store": "yes" },
                        "language": { "store": "yes" }
                    }
                },
                "document_type": {
                    "type": "string"
                },
                "insertDate": {
                    //This means that it will accept dates with optional timestamps,
                    //which conform to the formats supported by strict_date_optional_time or milliseconds-since-the-epoch.
                    "type": "date"
                },
                "file_label": {
                    "type": "string"
                },
                "document_id": {
                    "type": "long"
                },
                "version_id": {
                    "type": "long"
                },
                "groups_ids": {
                    "type": "long"
                },
                "created_by" : {
                    "type": "long"
                }
            }
        }
    },

    pinMapping: {
        "pin": {
            "properties": {
                "layout_label": {
                    "type": "string"
                },
                "pinboard_label": {
                    "type": "string"
                },
                "pin_vote": {
                    "type": "string"
                },
                //Todo remove html from content
                "pin_content": {
                    "type": "string"
                },

                "pin_id": {
                    "type": "long"
                },
                //For pin right
                "pinboard_id": {
                    "type": "long"
                },
                "groups_ids": {
                    "type": "long"
                },
                //For update layout
                "layout_id": {
                    "type": "long"
                },
                 //If pin doesn't have group
                "created_by" : {
                    "type": "long"
                },
                 "insertDate": {
                    "type": "date"
                }

            }
        }
    }
};

module.exports = mapping;