Ext.define('WINK.model.PatientPaperFileNumber',{
extend: 'Ext.data.Model',
requires: [
'Ext.data.Field',
'Ext.data.association.HasMany',
'Ext.data.association.HasOne',
'Ext.data.association.BelongsTo',
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
 ,defaultValue: null
}
,
{ name: 'patient_idpatient'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'store_idstore'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'number'
, type:'int'
 ,defaultValue: 0
}
        ]

 ,belongsTo: [

            {
                model: 'WINK.model.Patient',
                associatedName: 'fkpatient_idpatient',
                foreignKey: 'patient_idpatient',
                primaryKey: 'id',
                getterName: 'getFkpatient_idpatient',
                setterName: 'setFkpatient_idpatient'
            }

,
            {
                model: 'WINK.model.Store',
                associatedName: 'fkstore_idstore',
                foreignKey: 'store_idstore',
                primaryKey: 'id',
                getterName: 'getFkstore_idstore',
                setterName: 'setFkstore_idstore'
            }

        ] 
 ,hasMany: [

        ] 
,validations: [
]    
}
});
