Ext.define('WINK.model.PatientPayment',{
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
    url: WINK.Utilities.getRestURL() + 'patientpayments',
            withCredentials: true,
            useDefaultXhrHeader: false,
            cors: true  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'store_idstore'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'patientinvoice_idpatientinvoice'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'patient_idpatient'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'date'
, type:'date'
 ,defaultValue: new Date(2015,4,7,5,9,55)
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
 ,defaultValue: null
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
 ,defaultValue: null
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
 ,defaultValue: null
}
,
{ name: 'quickbookstype'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'evotransactionlog_idevotransactionlog'
, type:'int'
 ,defaultValue: null
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
 ,defaultValue: null
}
,
{ name: 'epayaccounts_idepayaccounts'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'paidbyinsurancesupplier_idsupplier'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'insurancepayment_idinsurancepayment'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'receiveproductitem_idreceiveproductitem'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'patientinvoiceitem_idpatientinvoiceitem'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'cardholdername'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'signatureuploads_iduploads'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'chargebackamount'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'user_iduser'
, type:'int'
 ,defaultValue: null
}
        ]

 ,belongsTo: [

            {
                model: 'WINK.model.Store',
                associatedName: 'fkstore_idstore',
                foreignKey: 'store_idstore',
                primaryKey: 'id',
                getterName: 'getFkstore_idstore',
                setterName: 'setFkstore_idstore'
            }

,
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
                model: 'WINK.model.Patient',
                associatedName: 'fkpatient_idpatient',
                foreignKey: 'patient_idpatient',
                primaryKey: 'id',
                getterName: 'getFkpatient_idpatient',
                setterName: 'setFkpatient_idpatient'
            }

,
            {
                model: 'WINK.model.PaymentMethod',
                associatedName: 'fkpaymentmethod_idpaymentmethod',
                foreignKey: 'paymentmethod_idpaymentmethod',
                primaryKey: 'id',
                getterName: 'getFkpaymentmethod_idpaymentmethod',
                setterName: 'setFkpaymentmethod_idpaymentmethod'
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

,
            {
                model: 'WINK.model.Supplier',
                associatedName: 'fkpaidbyinsurancesupplier_idsupplier',
                foreignKey: 'paidbyinsurancesupplier_idsupplier',
                primaryKey: 'id',
                getterName: 'getFkpaidbyinsurancesupplier_idsupplier',
                setterName: 'setFkpaidbyinsurancesupplier_idsupplier'
            }

,
            {
                model: 'WINK.model.PatientInvoiceItem',
                associatedName: 'fkpatientinvoiceitem_idpatientinvoiceitem',
                foreignKey: 'patientinvoiceitem_idpatientinvoiceitem',
                primaryKey: 'id',
                getterName: 'getFkpatientinvoiceitem_idpatientinvoiceitem',
                setterName: 'setFkpatientinvoiceitem_idpatientinvoiceitem'
            }

,
            {
                model: 'WINK.model.Upload',
                associatedName: 'fksignatureuploads_iduploads',
                foreignKey: 'signatureuploads_iduploads',
                primaryKey: 'id',
                getterName: 'getFksignatureuploads_iduploads',
                setterName: 'setFksignatureuploads_iduploads'
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

        ] 
 ,hasMany: [

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
