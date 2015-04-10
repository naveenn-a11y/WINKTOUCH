Ext.define('WINK.model.Patient', {
    extend: 'Ext.data.Model',
    requires: [
        'Ext.data.Field'
    ],
    config: {
        fields: [
            {name: 'idpatient',
                defaultValue: 0
            }
            ,
            {name: 'referredby_idpatient',
                defaultValue: 0
            }
            ,
            {name: 'firstname',
                defaultValue: "chirs"
            }
            ,
            {name: 'lastname',
                defaultValue: null
            }
            ,
            {name: 'address1',
                defaultValue: null
            }
            ,
            {name: 'address2',
                defaultValue: null
            }
            ,
            {name: 'city',
                defaultValue: null
            }
            ,
            {name: 'province',
                defaultValue: null
            }
            ,
            {name: 'postalcode',
                defaultValue: null
            }
            ,
            {name: 'home',
                defaultValue: null
            }
            ,
            {name: 'cell',
                defaultValue: null
            }
            ,
            {name: 'work',
                defaultValue: null
            }
            ,
            {name: 'fax',
                defaultValue: null
            }
            ,
            {name: 'mainnumber',
                defaultValue: 1
            }
            ,
            {name: 'email',
                defaultValue: null
            }
            ,
            {name: 'dob',
                defaultValue: null
            }
            ,
            {name: 'sex',
                defaultValue: 0
            }
            ,
            {name: 'medialcard',
                defaultValue: null
            }
            ,
            {name: 'drivers',
                defaultValue: null
            }
            ,
            {name: 'version',
                defaultValue: 0
            }
            ,
            {name: 'inactive',
                defaultValue: false
            }
            ,
            {name: 'note',
                defaultValue: null
            }
            ,
            {name: 'reference1',
                defaultValue: null
            }
            ,
            {name: 'reference2',
                defaultValue: null
            }
            ,
            {name: 'unit',
                defaultValue: null
            }
            ,
            {name: 'country_idcountry',
                defaultValue: 0
            }
            ,
            {name: 'title',
                defaultValue: 0
            }
            ,
            {name: 'language',
                defaultValue: 0
            }
            ,
            {name: 'lasteyeexam',
                defaultValue: null
            }
            ,
            {name: 'referringdoctor_iduser',
                defaultValue: 0
            }
            ,
            {name: 'nocall',
                defaultValue: false
            }
            ,
            {name: 'notxt',
                defaultValue: false
            }
            ,
            {name: 'nofax',
                defaultValue: false
            }
            ,
            {name: 'noemail',
                defaultValue: false
            }
            ,
            {name: 'wearscl',
                defaultValue: false
            }
            ,
            {name: 'wearsprogressives',
                defaultValue: false
            }
            ,
            {name: 'wearsbifocal',
                defaultValue: false
            }
            ,
            {name: 'lastee',
                defaultValue: 0
            }
            ,
            {name: 'nextee',
                defaultValue: 0
            }
            ,
            {name: 'totalspending',
                defaultValue: 0
            }
            ,
            {name: 'avgspending',
                defaultValue: 0
            }
            ,
            {name: 'createddate',
                defaultValue: 1428698793445
            }
            ,
            {name: 'lastpurchasedate',
                defaultValue: null
            }
            ,
            {name: 'lastcontactlenspurchasedate',
                defaultValue: null
            }
            ,
            {name: 'lasteyeglasspurchasedate',
                defaultValue: null
            }
            ,
            {name: 'store_idstore',
                defaultValue: 0
            }
            ,
            {name: 'enteredinstore_idstore',
                defaultValue: 0
            }
            ,
            {name: 'recall1',
                defaultValue: null
            }
            ,
            {name: 'recall2',
                defaultValue: null
            }
            ,
            {name: 'passedaway',
                defaultValue: false
            }
            ,
            {name: 'passedawayon',
                defaultValue: null
            }
            ,
            {name: 'totalamountinvoices',
                defaultValue: 0.0
            }
            ,
            {name: 'totalamountcreditnotes',
                defaultValue: 0.0
            }
            ,
            {name: 'totalamountee',
                defaultValue: 0.0
            }
            ,
            {name: 'totalinvoices',
                defaultValue: 0
            }
            ,
            {name: 'totalcreditnotes',
                defaultValue: 0
            }
            ,
            {name: 'totalinvoicesatzero',
                defaultValue: 0
            }
            ,
            {name: 'primaryinsurer',
                defaultValue: null
            }
            ,
            {name: 'primaryinsureraccountnumber',
                defaultValue: null
            }
            ,
            {name: 'primaryinsurergroupnumber',
                defaultValue: null
            }
            ,
            {name: 'primaryinsurerplanname',
                defaultValue: null
            }
            ,
            {name: 'supplementalinsurer',
                defaultValue: null
            }
            ,
            {name: 'supplementalinsureraccountnumber',
                defaultValue: null
            }
            ,
            {name: 'supplementalinsurergroupnumber',
                defaultValue: null
            }
            ,
            {name: 'supplementalinsurerplanname',
                defaultValue: null
            }
            ,
            {name: 'primaryinsurerother',
                defaultValue: null
            }
            ,
            {name: 'supplementalinsurerother',
                defaultValue: null
            }
            ,
            {name: 'patientprivacyconsentformsignedon',
                defaultValue: 0
            }
            ,
            {name: 'patientprivacyconsentacceptads',
                defaultValue: false
            }
            ,
            {name: 'patientprivacyconsentmethod',
                defaultValue: 0
            }
            ,
            {name: 'patientprivacyconsentipaddress',
                defaultValue: null
            }
            ,
            {name: 'sin',
                defaultValue: null
            }
            ,
            {name: 'referalmethods_idreferalmethods',
                defaultValue: 0
            }
            ,
            {name: 'medialcardexpiry',
                defaultValue: null
            }
        ],
        validations: [
            {type: 'length', field: 'firstname', max: 45}
            ,
            {type: 'length', field: 'lastname', max: 45}
            ,
            {type: 'length', field: 'address1', max: 45}
            ,
            {type: 'length', field: 'address2', max: 45}
            ,
            {type: 'length', field: 'city', max: 45}
            ,
            {type: 'length', field: 'province', max: 45}
            ,
            {type: 'length', field: 'postalcode', max: 45}
            ,
            {type: 'length', field: 'home', max: 45}
            ,
            {type: 'length', field: 'cell', max: 45}
            ,
            {type: 'length', field: 'work', max: 45}
            ,
            {type: 'length', field: 'fax', max: 45}
            ,
            {type: 'length', field: 'email', max: 45}
            ,
            {type: 'length', field: 'medialcard', max: 45}
            ,
            {type: 'length', field: 'drivers', max: 45}
            ,
            {type: 'length', field: 'Reference1', max: 45}
            ,
            {type: 'length', field: 'Reference2', max: 45}
            ,
            {type: 'length', field: 'unit', max: 45}
            ,
            {type: 'length', field: 'PrimaryInsurer', max: 45}
            ,
            {type: 'length', field: 'PrimaryInsurerAccountNumber', max: 45}
            ,
            {type: 'length', field: 'PrimaryInsurerGroupNumber', max: 45}
            ,
            {type: 'length', field: 'PrimaryInsurerPlanName', max: 45}
            ,
            {type: 'length', field: 'SupplementalInsurer', max: 45}
            ,
            {type: 'length', field: 'SupplementalInsurerAccountNumber', max: 45}
            ,
            {type: 'length', field: 'SupplementalInsurerGroupNumber', max: 45}
            ,
            {type: 'length', field: 'SupplementalInsurerPlanName', max: 45}
            ,
            {type: 'length', field: 'PatientPrivacyConsentIPAddress', max: 45}
            ,
            {type: 'length', field: 'sin', max: 45}
            ,
            {type: 'length', field: 'medialcardexpiry', max: 45}
        ]}
});
