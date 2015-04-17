Ext.define('WINK.model.Patient',{
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
    url: WINK.Utilities.getRestURL() + 'patients'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'referredby_idpatient'
, type:'int'
 ,defaultValue: 0
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
{ name: 'home'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'cell'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'work'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'fax'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'mainnumber'
, type:'int'
 ,defaultValue: 1
}
,
{ name: 'email'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'dob'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'sex'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'medialcard'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'drivers'
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
,
{ name: 'note'
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
{ name: 'unit'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'country_idcountry'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'title'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'language'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'lasteyeexam'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'referringdoctor_iduser'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'nocall'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'notxt'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'nofax'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'noemail'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'wearscl'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'wearsprogressives'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'wearsbifocal'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'lastee'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'nextee'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'totalspending'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'avgspending'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'createddate'
, type:'string'
 ,defaultValue: 1429227895483
}
,
{ name: 'lastpurchasedate'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'lastcontactlenspurchasedate'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'lasteyeglasspurchasedate'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'store_idstore'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'enteredinstore_idstore'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'recall1'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'recall2'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'passedaway'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'passedawayon'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'totalamountinvoices'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'totalamountcreditnotes'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'totalamountee'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'totalinvoices'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'totalcreditnotes'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'totalinvoicesatzero'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'primaryinsurer'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'primaryinsureraccountnumber'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'primaryinsurergroupnumber'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'primaryinsurerplanname'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'supplementalinsurer'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'supplementalinsureraccountnumber'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'supplementalinsurergroupnumber'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'supplementalinsurerplanname'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'primaryinsurerother'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'supplementalinsurerother'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'patientprivacyconsentformsignedon'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'patientprivacyconsentacceptads'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'patientprivacyconsentmethod'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'patientprivacyconsentipaddress'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'sin'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'referalmethods_idreferalmethods'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'medialcardexpiry'
, type:'string'
 ,defaultValue: ''
}
        ]

 ,belongsTo: [

            {
                model: 'WINK.model.Patient',
                associatedName: 'fkreferredby_idpatient',
                foreignKey: 'referredby_idpatient',
                primaryKey: 'id',
                getterName: 'getFkreferredby_idpatient',
                setterName: 'setFkreferredby_idpatient'
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
                associatedName: 'fkreferringdoctor_iduser',
                foreignKey: 'referringdoctor_iduser',
                primaryKey: 'id',
                getterName: 'getFkreferringdoctor_iduser',
                setterName: 'setFkreferringdoctor_iduser'
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
                model: 'WINK.model.Store',
                associatedName: 'fkenteredinstore_idstore',
                foreignKey: 'enteredinstore_idstore',
                primaryKey: 'id',
                getterName: 'getFkenteredinstore_idstore',
                setterName: 'setFkenteredinstore_idstore'
            }

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.Patient',
                name: 'patients_referredby_idpatient',
                foreignKey: 'referredby_idpatient',
                associationKey: 'patients_referredby_idpatient',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientPayment',
                name: 'patientpayments_patient_idpatient',
                foreignKey: 'patient_idpatient',
                associationKey: 'patientpayments_patient_idpatient',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoice',
                name: 'patientinvoices_patient_idpatient',
                foreignKey: 'patient_idpatient',
                associationKey: 'patientinvoices_patient_idpatient',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Appointment',
                name: 'appointments_patient_idpatient',
                foreignKey: 'patient_idpatient',
                associationKey: 'appointments_patient_idpatient',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientNote',
                name: 'patientnotes_patient_idpatient',
                foreignKey: 'patient_idpatient',
                associationKey: 'patientnotes_patient_idpatient',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientPaperFileNumber',
                name: 'patientpaperfilenumbers_patient_idpatient',
                foreignKey: 'patient_idpatient',
                associationKey: 'patientpaperfilenumbers_patient_idpatient',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'firstname', max: 45,min:0 }
,
 { type: 'length', field: 'lastname', max: 45,min:0 }
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
 { type: 'length', field: 'home', max: 45,min:0 }
,
 { type: 'length', field: 'cell', max: 45,min:0 }
,
 { type: 'length', field: 'work', max: 45,min:0 }
,
 { type: 'length', field: 'fax', max: 45,min:0 }
,
 { type: 'length', field: 'email', max: 45,min:0 }
,
 { type: 'length', field: 'medialcard', max: 45,min:0 }
,
 { type: 'length', field: 'drivers', max: 45,min:0 }
,
 { type: 'length', field: 'reference1', max: 45,min:0 }
,
 { type: 'length', field: 'reference2', max: 45,min:0 }
,
 { type: 'length', field: 'unit', max: 45,min:0 }
,
 { type: 'length', field: 'primaryinsurer', max: 45,min:0 }
,
 { type: 'length', field: 'primaryinsureraccountnumber', max: 45,min:0 }
,
 { type: 'length', field: 'primaryinsurergroupnumber', max: 45,min:0 }
,
 { type: 'length', field: 'primaryinsurerplanname', max: 45,min:0 }
,
 { type: 'length', field: 'supplementalinsurer', max: 45,min:0 }
,
 { type: 'length', field: 'supplementalinsureraccountnumber', max: 45,min:0 }
,
 { type: 'length', field: 'supplementalinsurergroupnumber', max: 45,min:0 }
,
 { type: 'length', field: 'supplementalinsurerplanname', max: 45,min:0 }
,
 { type: 'length', field: 'patientprivacyconsentipaddress', max: 45,min:0 }
,
 { type: 'length', field: 'sin', max: 45,min:0 }
,
 { type: 'length', field: 'medialcardexpiry', max: 45,min:0 }
]    
}
});
