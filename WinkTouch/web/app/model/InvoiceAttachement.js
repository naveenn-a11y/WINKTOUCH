Ext.define('WINK.model.InvoiceAttachement',{
extend: 'Ext.data.Model',
requires: [
'Ext.data.Field',
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
 ,defaultValue: 0
}
,
{ name: 'patientinvoice_idpatientinvoice'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'uploads_iduploads'
, type:'int'
 ,defaultValue: 0
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

,validations: [
 { type: 'length', field: 'name', max: 45,min:0 }
]    
}
});
