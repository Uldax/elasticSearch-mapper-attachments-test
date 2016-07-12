var elasticStructure = {
    "settings": {
        "number_of_shards": 1,
        "analysis": {
            "filter": {
                "nGram_filter": {
                    "type": "nGram",
                    "min_gram": 2,
                    "max_gram": 20,
                    "token_chars": [
                        "letter",
                        "digit",
                        "punctuation",
                        "symbol"
                    ]
                }
            },
            "analyzer": {
                //Same as withspace and add ngram filter
                "nGram_analyzer": {
                    "type": "custom",
                    "tokenizer": "whitespace",
                    "filter": [
                        "lowercase",
                        "asciifolding",
                        "nGram_filter"
                    ]
                },
                //splits text on whitespace, 
                "whitespace_analyzer": {
                    "type": "custom",
                    "tokenizer": "whitespace",
                    //normalizes all the tokens to lower-case
                    //cleans up non-standard characters 
                    "filter": [
                        "lowercase",
                        "asciifolding"
                    ]
                }
            }
        }
    },
    "mappings": {
  
        "document": {
                  "_all": {
                "analyzer": "nGram_analyzer",
                "search_analyzer": "whitespace_analyzer"
            },
            "properties": {
                "attachment": {
                    "type": "attachment",
                    //Index all content
                    "fields": {
                        "content": {
                            "type": "string",
                            //For highlight
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
                    "type": "long",
                     "index": "no"
                },
                "version_id": {
                    "type": "long",
                    "index": "no"
                },
                "groups_ids": {
                    "type": "long",
                    "index": "no"
                },
                "created_by": {
                    "type": "long",
                    "index": "no"
                }
            }
        },
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
                    "type": "long",
                     "index": "no"
                },
                //For pin right
                "pinboard_id": {
                    "type": "long",
                     "index": "no"
                },
                "groups_ids": {
                    "type": "long",
                     "index": "no"
                },
                //For update layout
                "layout_id": {
                    "type": "long",
                     "index": "no"
                },
                //If pin doesn't have group
                "created_by": {
                    "type": "long",
                     "index": "no"
                },
                "insertDate": {
                    "type": "date"
                },
                "document_type": {
                    "type": "string"
                },

            }
        }
    }
};

module.exports = elasticStructure;