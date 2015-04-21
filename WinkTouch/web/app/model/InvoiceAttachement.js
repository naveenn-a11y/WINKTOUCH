Ext.define('WINK.model.InvoiceAttachement',{
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
    url: WINK.Utilities.getRestURL() + 'invoiceattachements'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'patientinvoice_idpatientinvoice'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'uploads_iduploads'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'name'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'description'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'version'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'inactive'
, type:'boolean'
 ,defaultValue: false
}
        ]

 ,belongsTo: [

            {
                model: 'WINK.model.PatientInvoice',
                associatedName: 'fkpatientinvoice_idpatientinvoice',
                foreignKey: 'patientinvoice_idpatientinvoice',
                primaryKey: 'id',
                getterName: 'getFkpatientinvoice_idpatientinvoice',
                setterName: 'setFkpatientinvoice_idpatientinvoice'
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
 { type: 'length', field: 'name', max: 45,min:0 }
]    
}
});
