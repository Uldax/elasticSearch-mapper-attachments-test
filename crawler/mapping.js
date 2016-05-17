var mapping = {
    fileMapping: {
        "person": {
            "properties": {
                "my_attachment": {
                    "type": "attachment",
                    "fields": {
                        "content": {
                            "type": "string",
                            "term_vector": "with_positions_offsets",
                            "store": true
                        },
                        //Metadata supported
                        "title": { "store": "yes" },
                        "date": {
                            "store": "yes",
                            "type": "date",
                            "format": "yyyy-MM-dd"
                        },
                        "name": { "store": "yes" },
                        //"author" : {"analyzer" : "myAnalyzer"},
                        "keywords": { "store": "yes" },
                        "content_type": { "store": "yes" },
                        "content_length": { "store": "yes" },
                        "language": { "store": "yes" }
                    }
                }
                ///Custum here
            }
        }
    }
}

module.exports = mapping