Ext.define('WINK.model.Upload',{
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
    url: WINK.Utilities.getRestURL() + 'uploads'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'datetime'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'data'
 ,defaultValue: "null"
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
,
{ name: 'filename'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'mimetype'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'size'
, type:'int'
 ,defaultValue: 0
}
        ]

 ,belongsTo: [

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.Product',
                name: 'product',
                foreignKey: 'imageuploads_iduploads',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.User',
                name: 'user',
                foreignKey: 'googlecalendaruploads_iduploads',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientPayment',
                name: 'patientpayment',
                foreignKey: 'uploads_iduploads',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientPayment',
                name: 'patientpayment',
                foreignKey: 'signatureuploads_iduploads',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoice',
                name: 'patientinvoice',
                foreignKey: 'uploads_iduploads',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.InvoiceAttachement',
                name: 'invoiceattachement',
                foreignKey: 'uploads_iduploads',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientNote',
                name: 'patientnote',
                foreignKey: 'uploads_iduploads',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'mimetype', max: 45,min:0 }
]    
}
});
