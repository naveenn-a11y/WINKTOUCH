Ext.define('WINK.model.User',{
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
    url: WINK.Utilities.getRestURL() + 'users',
            withCredentials: true,
            useDefaultXhrHeader: false,
            cors: true  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'type'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'hassystemaccess'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'username'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'firstname'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'lastname'
, type:'string'
 ,defaultValue: ''
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
{ name: 'tel1'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'tel2'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'fax'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'tollfree'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'email'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'comment'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'lastlogindate'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'lasttry'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'numberofinvalidtries'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'inactive'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'version'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'taxcodeaccess'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'storeaccess'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'doctoraccess'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'useraccess'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'advertisingaccess'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'negpos'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'negposdontask'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'calendarusecategories'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'googlecalendarid'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'locale'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'termsofuseversion'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'termsofuseacceptedon'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'termsofusemacaddress'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'googlecalendaruploads_iduploads'
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
{ name: 'providertype'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'prefersgeneric'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'providerlicense'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'country_idcountry'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'locale_fr'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'locale_es'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'locale_it'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'accesscard'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'signatureuploads_iduploads'
, type:'int'
 ,defaultValue: null
}
        ]

 ,belongsTo: [

            {
                model: 'WINK.model.Upload',
                associatedName: 'fkgooglecalendaruploads_iduploads',
                foreignKey: 'googlecalendaruploads_iduploads',
                primaryKey: 'id',
                getterName: 'getFkgooglecalendaruploads_iduploads',
                setterName: 'setFkgooglecalendaruploads_iduploads'
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
                model: 'WINK.model.Upload',
                associatedName: 'fksignatureuploads_iduploads',
                foreignKey: 'signatureuploads_iduploads',
                primaryKey: 'id',
                getterName: 'getFksignatureuploads_iduploads',
                setterName: 'setFksignatureuploads_iduploads'
            }

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.Patient',
                name: 'patients_referringdoctor_iduser',
                foreignKey: 'referringdoctor_iduser',
                associationKey: 'patients_referringdoctor_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientPayment',
                name: 'patientpayments_user_iduser',
                foreignKey: 'user_iduser',
                associationKey: 'patientpayments_user_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoice',
                name: 'patientinvoices_createby_iduser',
                foreignKey: 'createby_iduser',
                associationKey: 'patientinvoices_createby_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoice',
                name: 'patientinvoices_salesrep',
                foreignKey: 'salesrep',
                associationKey: 'patientinvoices_salesrep',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoice',
                name: 'patientinvoices_provideruser_iduser',
                foreignKey: 'provideruser_iduser',
                associationKey: 'patientinvoices_provideruser_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoice',
                name: 'patientinvoices_doctoruser_iduser',
                foreignKey: 'doctoruser_iduser',
                associationKey: 'patientinvoices_doctoruser_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoice',
                name: 'patientinvoices_writeoffbalanceuser_iduser',
                foreignKey: 'writeoffbalanceuser_iduser',
                associationKey: 'patientinvoices_writeoffbalanceuser_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoiceItem',
                name: 'patientinvoiceitems_discountauthorizedbyuser_iduser',
                foreignKey: 'discountauthorizedbyuser_iduser',
                associationKey: 'patientinvoiceitems_discountauthorizedbyuser_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Appointment',
                name: 'appointments_doctor_idpatient',
                foreignKey: 'doctor_idpatient',
                associationKey: 'appointments_doctor_idpatient',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Barcode',
                name: 'barcodes_disabledbyuser_iduser',
                foreignKey: 'disabledbyuser_iduser',
                associationKey: 'barcodes_disabledbyuser_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientNote',
                name: 'patientnotes_user_iduser',
                foreignKey: 'user_iduser',
                associationKey: 'patientnotes_user_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.RxWorksheet',
                name: 'rxworksheets_createby_iduser',
                foreignKey: 'createby_iduser',
                associationKey: 'rxworksheets_createby_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.RxWorksheet',
                name: 'rxworksheets_doctor_iduser',
                foreignKey: 'doctor_iduser',
                associationKey: 'rxworksheets_doctor_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.RxWorksheet',
                name: 'rxworksheets_opticianuser_iduser',
                foreignKey: 'opticianuser_iduser',
                associationKey: 'rxworksheets_opticianuser_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.ClWorksheet',
                name: 'clworksheets_createby_iduser',
                foreignKey: 'createby_iduser',
                associationKey: 'clworksheets_createby_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.ClWorksheet',
                name: 'clworksheets_doctor_iduser',
                foreignKey: 'doctor_iduser',
                associationKey: 'clworksheets_doctor_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.ClWorksheet',
                name: 'clworksheets_opticianuser_iduser',
                foreignKey: 'opticianuser_iduser',
                associationKey: 'clworksheets_opticianuser_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.RxOrderForm',
                name: 'rxorderforms_user_iduser',
                foreignKey: 'user_iduser',
                associationKey: 'rxorderforms_user_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.RxOrderForm',
                name: 'rxorderforms_onlineorderrequesteduser_iduser',
                foreignKey: 'onlineorderrequesteduser_iduser',
                associationKey: 'rxorderforms_onlineorderrequesteduser_iduser',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.RxOrderForm',
                name: 'rxorderforms_emailorderrequesteduser_iduser',
                foreignKey: 'emailorderrequesteduser_iduser',
                associationKey: 'rxorderforms_emailorderrequesteduser_iduser',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'username', max: 45,min:0 }
,
 { type: 'length', field: 'firstname', max: 45,min:0 }
,
 { type: 'length', field: 'lastname', max: 45,min:0 }
,
 { type: 'length', field: 'address1', max: 150,min:0 }
,
 { type: 'length', field: 'address2', max: 150,min:0 }
,
 { type: 'length', field: 'city', max: 45,min:0 }
,
 { type: 'length', field: 'province', max: 45,min:0 }
,
 { type: 'length', field: 'postalcode', max: 45,min:0 }
,
 { type: 'length', field: 'tel1', max: 45,min:0 }
,
 { type: 'length', field: 'tel2', max: 45,min:0 }
,
 { type: 'length', field: 'fax', max: 45,min:0 }
,
 { type: 'length', field: 'tollfree', max: 45,min:0 }
,
 { type: 'length', field: 'email', max: 45,min:0 }
,
 { type: 'length', field: 'googlecalendarid', max: 300,min:0 }
,
 { type: 'length', field: 'locale', max: 300,min:0 }
,
 { type: 'length', field: 'termsofusemacaddress', max: 45,min:0 }
,
 { type: 'length', field: 'reference1', max: 45,min:0 }
,
 { type: 'length', field: 'reference2', max: 45,min:0 }
,
 { type: 'length', field: 'providerlicense', max: 45,min:0 }
,
 { type: 'length', field: 'locale_fr', max: 300,min:0 }
,
 { type: 'length', field: 'locale_es', max: 300,min:0 }
,
 { type: 'length', field: 'locale_it', max: 300,min:0 }
,
 { type: 'length', field: 'accesscard', max: 300,min:0 }
]    
}
});
