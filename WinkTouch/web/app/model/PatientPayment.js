Ext.define('WINK.model.PatientPayment',{
extend: 'Ext.data.Model',
requires: [
'Ext.data.Field',
'WINK.Utilities'

        ,'Ext.data.proxy.Rest'

    ],

    config: {

proxy: {
    type: 'rest',
    url: WINK.Utilities.getRestURL() + 'patientpayments'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'store_idstore'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'patientinvoice_idpatientinvoice'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'patient_idpatient'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'date'
, type:'date'
 ,defaultValue: new Date(2015,3,12,20,13,13)
}
,
{ name: 'amount'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'version'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'paymentmethod_idpaymentmethod'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'description'
, type:'string'
 ,defaultValue: ''
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
{ name: 'quickbookslistid'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'quickbookssequencenumber'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'quickbooksversionid'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'quickbooksfile_idquickbooksfile'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'quickbookstype'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'evotransactionlog_idevotransactionlog'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'entrymethod'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'cardnumber'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'cardexpiraydate'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'cardtype'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'paylater'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'epayentrymethod'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'customervault_idcustomervault'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'epayaccounts_idepayaccounts'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'paidbyinsurancesupplier_idsupplier'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'insurancepayment_idinsurancepayment'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'receiveproductitem_idreceiveproductitem'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'patientinvoiceitem_idpatientinvoiceitem'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'cardholdername'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'signatureuploads_iduploads'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'chargebackamount'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'user_iduser'
, type:'int'
 ,defaultValue: 0
}
        ]

,validations: [
 { type: 'length', field: 'description', max: 45,min:0 }
,
 { type: 'length', field: 'reference1', max: 45,min:0 }
,
 { type: 'length', field: 'reference2', max: 45,min:0 }
,
 { type: 'length', field: 'quickbookslistid', max: 45,min:0 }
,
 { type: 'length', field: 'quickbookssequencenumber', max: 45,min:0 }
,
 { type: 'length', field: 'cardnumber', max: 45,min:0 }
,
 { type: 'length', field: 'cardexpiraydate', max: 45,min:0 }
,
 { type: 'length', field: 'cardholdername', max: 200,min:0 }
]    
}
});
