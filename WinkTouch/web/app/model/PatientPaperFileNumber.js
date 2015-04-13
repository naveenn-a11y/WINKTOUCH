Ext.define('WINK.model.PatientPaperFileNumber',{
extend: 'Ext.data.Model',
requires: [
'Ext.data.Field',
'WINK.Utilities'

        ,'Ext.data.proxy.Rest'

    ],

    config: {

proxy: {
    type: 'rest',
    url: WINK.Utilities.getRestURL() + 'patientpaperfilenumbers'
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
{ name: 'store_idstore'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'number'
, type:'int'
 ,defaultValue: 0
}
        ]

,validations: [
]    
}
});
