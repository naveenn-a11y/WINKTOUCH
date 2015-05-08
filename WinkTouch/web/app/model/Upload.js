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
    url: WINK.Utilities.getRestURL() + 'uploads',
            withCredentials: true,
            useDefaultXhrHeader: false,
            cors: true  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'datetime'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'data'
, type:'string'
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
                name: 'products_imageuploads_iduploads',
                foreignKey: 'imageuploads_iduploads',
                associationKey: 'products_imageuploads_iduploads',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.User',
                name: 'users_googlecalendaruploads_iduploads',
                foreignKey: 'googlecalendaruploads_iduploads',
                associationKey: 'users_googlecalendaruploads_iduploads',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientPayment',
                name: 'patientpayments_uploads_iduploads',
                foreignKey: 'uploads_iduploads',
                associationKey: 'patientpayments_uploads_iduploads',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientPayment',
                name: 'patientpayments_signatureuploads_iduploads',
                foreignKey: 'signatureuploads_iduploads',
                associationKey: 'patientpayments_signatureuploads_iduploads',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoice',
                name: 'patientinvoices_uploads_iduploads',
                foreignKey: 'uploads_iduploads',
                associationKey: 'patientinvoices_uploads_iduploads',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.InvoiceAttachement',
                name: 'invoiceattachements_uploads_iduploads',
                foreignKey: 'uploads_iduploads',
                associationKey: 'invoiceattachements_uploads_iduploads',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.InvoiceAttachement',
                name: 'invoiceattachements_uploads_iduploads',
                foreignKey: 'uploads_iduploads',
                associationKey: 'invoiceattachements_uploads_iduploads',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientNote',
                name: 'patientnotes_uploads_iduploads',
                foreignKey: 'uploads_iduploads',
                associationKey: 'patientnotes_uploads_iduploads',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.RxWorksheet',
                name: 'rxworksheets_uploads_iduploads',
                foreignKey: 'uploads_iduploads',
                associationKey: 'rxworksheets_uploads_iduploads',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'mimetype', max: 45,min:0 }
]    
}
});
