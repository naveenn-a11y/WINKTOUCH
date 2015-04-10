Ext.define('WINK.model.User', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Field'
    ],

    config: {
        fields: [

{ name: 'iduser',
 defaultValue: 0
}
,
{ name: 'type',
 defaultValue: 0
}
,
{ name: 'hassystemaccess',
 defaultValue: false
}
,
{ name: 'username',
 defaultValue: null
}
,
{ name: 'firstname',
 defaultValue: "chirs"
}
,
{ name: 'lastname',
 defaultValue: null
}
,
{ name: 'address1',
 defaultValue: null
}
,
{ name: 'address2',
 defaultValue: null
}
,
{ name: 'city',
 defaultValue: null
}
,
{ name: 'province',
 defaultValue: null
}
,
{ name: 'postalcode',
 defaultValue: null
}
,
{ name: 'tel1',
 defaultValue: null
}
,
{ name: 'tel2',
 defaultValue: null
}
,
{ name: 'fax',
 defaultValue: null
}
,
{ name: 'tollfree',
 defaultValue: null
}
,
{ name: 'email',
 defaultValue: null
}
,
{ name: 'comment',
 defaultValue: null
}
,
{ name: 'lastlogindate',
 defaultValue: null
}
,
{ name: 'lasttry',
 defaultValue: null
}
,
{ name: 'numberofinvalidtries',
 defaultValue: 0
}
,
{ name: 'inactive',
 defaultValue: false
}
,
{ name: 'version',
 defaultValue: 0
}
,
{ name: 'taxcodeaccess',
 defaultValue: 0
}
,
{ name: 'storeaccess',
 defaultValue: 0
}
,
{ name: 'doctoraccess',
 defaultValue: 0
}
,
{ name: 'useraccess',
 defaultValue: 0
}
,
{ name: 'advertisingaccess',
 defaultValue: 0
}
,
{ name: 'negpos',
 defaultValue: false
}
,
{ name: 'negposdontask',
 defaultValue: false
}
,
{ name: 'calendarusecategories',
 defaultValue: false
}
,
{ name: 'googlecalendarid',
 defaultValue: null
}
,
{ name: 'locale',
 defaultValue: null
}
,
{ name: 'termsofuseversion',
 defaultValue: 0
}
,
{ name: 'termsofuseacceptedon',
 defaultValue: 0
}
,
{ name: 'termsofusemacaddress',
 defaultValue: null
}
,
{ name: 'googlecalendaruploads_iduploads',
 defaultValue: 0
}
,
{ name: 'reference1',
 defaultValue: null
}
,
{ name: 'reference2',
 defaultValue: null
}
,
{ name: 'providertype',
 defaultValue: 0
}
,
{ name: 'prefersgeneric',
 defaultValue: false
}
,
{ name: 'providerlicense',
 defaultValue: null
}
,
{ name: 'country_idcountry',
 defaultValue: 0
}
,
{ name: 'locale_fr',
 defaultValue: null
}
,
{ name: 'locale_es',
 defaultValue: null
}
,
{ name: 'locale_it',
 defaultValue: null
}
,
{ name: 'accesscard',
 defaultValue: null
}
        ],
validations: [
 { type: 'length', field: 'username', max: 45 }
,
 { type: 'length', field: 'firstname', max: 45 }
,
 { type: 'length', field: 'lastname', max: 45 }
,
 { type: 'length', field: 'address1', max: 150 }
,
 { type: 'length', field: 'address2', max: 150 }
,
 { type: 'length', field: 'city', max: 45 }
,
 { type: 'length', field: 'province', max: 45 }
,
 { type: 'length', field: 'postalcode', max: 45 }
,
 { type: 'length', field: 'tel1', max: 45 }
,
 { type: 'length', field: 'tel2', max: 45 }
,
 { type: 'length', field: 'fax', max: 45 }
,
 { type: 'length', field: 'tollfree', max: 45 }
,
 { type: 'length', field: 'email', max: 45 }
,
 { type: 'length', field: 'GoogleCalendarID', max: 300 }
,
 { type: 'length', field: 'locale', max: 300 }
,
 { type: 'length', field: 'termsOfUseMacAddress', max: 45 }
,
 { type: 'length', field: 'reference1', max: 45 }
,
 { type: 'length', field: 'reference2', max: 45 }
,
 { type: 'length', field: 'providerLicense', max: 45 }
,
 { type: 'length', field: 'locale_fr', max: 300 }
,
 { type: 'length', field: 'locale_es', max: 300 }
,
 { type: 'length', field: 'locale_it', max: 300 }
,
 { type: 'length', field: 'accessCard', max: 300 }
]    }
});
