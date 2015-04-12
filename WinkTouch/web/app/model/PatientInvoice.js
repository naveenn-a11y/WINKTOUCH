Ext.define('WINK.model.PatientInvoice', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Field',
        'WINK.Utilities'    ],

    config: {

proxy: {
    type: 'rest',
    url: WINK.Utilities.getRestURL() + 'patientinvoices'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'orderdate'
, type:'date'
 ,defaultValue: new Date(2015,3,11,21,47,40)
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
{ name: 'promisseddate'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'delivereddate'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'createby_iduser'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'version'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'noteoninvoice'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'balance'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'salesrep'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'reference1'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'reference2'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'uploads_iduploads'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'uploadname'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'quickbookslistid'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'quickbooksversionid'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'quickbookssequenceid'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'quickbooksfile_idquickbooksfile'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'quickbooksiscreditmemo'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'subtotal'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'tax1'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'tax2'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'eyeexam'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'createdon'
, type:'date'
 ,defaultValue: new Date(2015,3,11,21,47,40)
}
,
{ name: 'insurance1_idsupplier'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'insurance2_idsupplier'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'subtotal_insurance1'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'tax1_insurance1'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'tax2_insurance1'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'subtotal_insurance2'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'tax1_insurance2'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'tax2_insurance2'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'provideruser_iduser'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'patientpayments'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'shipto'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'address1'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'address2'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'city'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'province'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'postalcode'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'country_idcountry'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'unit'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'specials_idspecials'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'recalls_idrecalls'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'shiptoname'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'doctoruser_iduser'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'pickupatstore_idstore'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'writeoffbalanceamount'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'writeoffbalancedate'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'writeoffbalanceuser_iduser'
, type:'int'
 ,defaultValue: 0
}
        ]

,validations: [
 { type: 'length', field: 'noteoninvoice', max: 150,min:0 }
,
 { type: 'length', field: 'reference1', max: 45,min:0 }
,
 { type: 'length', field: 'reference2', max: 45,min:0 }
,
 { type: 'length', field: 'uploadname', max: 100,min:0 }
,
 { type: 'length', field: 'quickbookslistid', max: 45,min:0 }
,
 { type: 'length', field: 'quickbookssequenceid', max: 45,min:0 }
,
 { type: 'length', field: 'address1', max: 45,min:0 }
,
 { type: 'length', field: 'address2', max: 45,min:0 }
,
 { type: 'length', field: 'city', max: 45,min:0 }
,
 { type: 'length', field: 'province', max: 45,min:0 }
,
 { type: 'length', field: 'postalcode', max: 45,min:0 }
,
 { type: 'length', field: 'unit', max: 45,min:0 }
,
 { type: 'length', field: 'shiptoname', max: 45,min:0 }
]    
}
});
