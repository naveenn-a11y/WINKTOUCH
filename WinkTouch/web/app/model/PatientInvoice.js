Ext.define('WINK.model.PatientInvoice',{
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
    url: WINK.Utilities.getRestURL() + 'patientinvoices',
            withCredentials: true,
            useDefaultXhrHeader: false,
            cors: true  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'orderdate'
, type:'date'
 ,defaultValue: new Date(2015,4,7,5,9,55)
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
 ,defaultValue: null
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
 ,defaultValue: null
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
 ,defaultValue: null
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
 ,defaultValue: new Date(2015,4,7,5,9,55)
}
,
{ name: 'insurance1_idsupplier'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'insurance2_idsupplier'
, type:'int'
 ,defaultValue: null
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
 ,defaultValue: null
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
 ,defaultValue: null
}
,
{ name: 'unit'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'specials_idspecials'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'recalls_idrecalls'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'shiptoname'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'doctoruser_iduser'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'pickupatstore_idstore'
, type:'int'
 ,defaultValue: null
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
 ,defaultValue: null
}
,
{ name: 'isestimate'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'estimatedate'
, type:'date'
 ,defaultValue: null
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

,
            {
                model: 'WINK.model.User',
                associatedName: 'fkcreateby_iduser',
                foreignKey: 'createby_iduser',
                primaryKey: 'id',
                getterName: 'getFkcreateby_iduser',
                setterName: 'setFkcreateby_iduser'
            }

,
            {
                model: 'WINK.model.User',
                associatedName: 'fksalesrep',
                foreignKey: 'salesrep',
                primaryKey: 'id',
                getterName: 'getFksalesrep',
                setterName: 'setFksalesrep'
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
                associatedName: 'fkinsurance1_idsupplier',
                foreignKey: 'insurance1_idsupplier',
                primaryKey: 'id',
                getterName: 'getFkinsurance1_idsupplier',
                setterName: 'setFkinsurance1_idsupplier'
            }

,
            {
                model: 'WINK.model.Supplier',
                associatedName: 'fkinsurance2_idsupplier',
                foreignKey: 'insurance2_idsupplier',
                primaryKey: 'id',
                getterName: 'getFkinsurance2_idsupplier',
                setterName: 'setFkinsurance2_idsupplier'
            }

,
            {
                model: 'WINK.model.User',
                associatedName: 'fkprovideruser_iduser',
                foreignKey: 'provideruser_iduser',
                primaryKey: 'id',
                getterName: 'getFkprovideruser_iduser',
                setterName: 'setFkprovideruser_iduser'
            }

,
            {
                model: 'WINK.model.Country',
                associatedName: 'fkcountry_idcountry',
                foreignKey: 'country_idcountry',
                primaryKey: 'id',
                getterName: 'getFkcountry_idcountry',
                setterName: 'setFkcountry_idcountry'
            }

,
            {
                model: 'WINK.model.User',
                associatedName: 'fkdoctoruser_iduser',
                foreignKey: 'doctoruser_iduser',
                primaryKey: 'id',
                getterName: 'getFkdoctoruser_iduser',
                setterName: 'setFkdoctoruser_iduser'
            }

,
            {
                model: 'WINK.model.Store',
                associatedName: 'fkpickupatstore_idstore',
                foreignKey: 'pickupatstore_idstore',
                primaryKey: 'id',
                getterName: 'getFkpickupatstore_idstore',
                setterName: 'setFkpickupatstore_idstore'
            }

,
            {
                model: 'WINK.model.User',
                associatedName: 'fkwriteoffbalanceuser_iduser',
                foreignKey: 'writeoffbalanceuser_iduser',
                primaryKey: 'id',
                getterName: 'getFkwriteoffbalanceuser_iduser',
                setterName: 'setFkwriteoffbalanceuser_iduser'
            }

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.PatientPayment',
                name: 'patientpayments_patientinvoice_idpatientinvoice',
                foreignKey: 'patientinvoice_idpatientinvoice',
                associationKey: 'patientpayments_patientinvoice_idpatientinvoice',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.InvoiceAttachement',
                name: 'invoiceattachements_patientinvoice_idpatientinvoice',
                foreignKey: 'patientinvoice_idpatientinvoice',
                associationKey: 'invoiceattachements_patientinvoice_idpatientinvoice',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoiceItem',
                name: 'patientinvoiceitems_patientinvoice_idpatientinvoice',
                foreignKey: 'patientinvoice_idpatientinvoice',
                associationKey: 'patientinvoiceitems_patientinvoice_idpatientinvoice',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.InvoiceAttachement',
                name: 'invoiceattachements_patientinvoice_idpatientinvoice',
                foreignKey: 'patientinvoice_idpatientinvoice',
                associationKey: 'invoiceattachements_patientinvoice_idpatientinvoice',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.RxWorksheet',
                name: 'rxworksheets_patientinvoice_idpatientinvoice',
                foreignKey: 'patientinvoice_idpatientinvoice',
                associationKey: 'rxworksheets_patientinvoice_idpatientinvoice',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.ClWorksheet',
                name: 'clworksheets_patientinvoice_idpatientinvoice',
                foreignKey: 'patientinvoice_idpatientinvoice',
                associationKey: 'clworksheets_patientinvoice_idpatientinvoice',
                primaryKey: 'id'
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
