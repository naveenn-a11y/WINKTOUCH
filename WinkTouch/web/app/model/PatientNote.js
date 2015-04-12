Ext.define('WINK.model.PatientNote', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Field',
        'WINK.Utilities'    ],

    config: {

proxy: {
    type: 'rest',
    url: WINK.Utilities.getRestURL() + 'patientnotes'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'patient_idpatient'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'user_iduser'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'uploads_iduploads'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'note'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'postedon'
, type:'date'
 ,defaultValue: new Date(2015,3,11,21,47,40)
}
,
{ name: 'version'
, type:'int'
 ,defaultValue: 0
}
        ]

,validations: [
]    
}
});
