{
    "name": "Documents",
    "type": "groupedForm",
    "section": "Form.1",
    "card": true,
    "scrollable": true,
    "isPreExam": true,
    "cardFields": [
        [
            "Documents.Label"
        ]
    ],
    "fields": [
        {
            "name": "Documents",
            "multiValue": true,
            "size": "XL",
            "fields": [
                {
                    "image": "upload",
                    "popup": true,
                    "drawable": false,
                    "multiValue": true,
                    "size": "S",
                    "name": "Document",
                    "label": "",
                    "type": "document"
                },
                {
                    "maxLength": 500,
                    "name": "Notes"
                },
                {
                    "name": "Label",
                    "maxLength": 100,
                    "isLabel": true
                }
            ]
        }
    ],
    "locale": {
        "fr-CA": {
            "label": "Documents",
            "fields": [
                {
                    "name": "Documents",
                    "label": "Documents"
                }
            ]
        }
    }
}