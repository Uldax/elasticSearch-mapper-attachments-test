var mapping = {
    documentMapping: {
        "document": {
            "properties": {
                "attachment": {
                    "type": "attachment",
                    //Add index -1 pour tout indexer
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
                ///Custum here
                "document_type": {
                    "type": "string"
                },
                "insertDate": {
                    //"store": "yes",
                    "type": "date",
                    "format": "dd/MM/yyyy"
                },
                "document_id": {
                    "type": "long"
                },
                "version_id": {
                    "type": "long"
                }
            }
        }
    },
    pinMapping: {
        "pin": {
            "properties": {
                "layou_label": {
                    "type": "string"
                },
                 "label": {
                        "type": "string"
                 },
                "pin_id": {
                    "type": "long"
                },
                "pin_vote": {
                    "type": "string"
                },
                //Todo remove html from content
                "pin_content": {
                    "type": "string"
                },
                "pinboard_label": {
                    "type": "string"
            },

            
                }
            }
        }
    
}

module.exports = mapping