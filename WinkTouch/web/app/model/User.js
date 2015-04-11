Ext.define('WINK.model.User', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Field',
        'WINK.Utilities'    ],

    config: {

        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
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
 ,defaultValue: 0
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
