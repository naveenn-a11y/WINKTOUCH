Ext.define('WINK.model.PatientNote',{
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
 ,defaultValue: new Date(2015,3,13,10,9,10)
}
,
{ name: 'version'
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
                model: 'WINK.model.User',
                associatedName: 'fkuser_iduser',
                foreignKey: 'user_iduser',
                primaryKey: 'id',
                getterName: 'getFkuser_iduser',
                setterName: 'setFkuser_iduser'
            }

,
            {
                model: 'WINK.model.Upload',
                associatedName: 'fkuploads_iduploads',
                foreignKey: 'uploads_iduploads',
                primaryKey: 'id',
                getterName: 'getFkuploads_iduploads',
                setterName: 'setFkuploads_iduploads'
            }

        ] 
 ,hasMany: [

        ] 
,validations: [
]    
}
});
