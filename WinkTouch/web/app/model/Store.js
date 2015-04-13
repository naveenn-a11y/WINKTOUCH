Ext.define('WINK.model.Store',{
extend: 'Ext.data.Model',
requires: [
'Ext.data.Field',
'WINK.Utilities'

        ,'Ext.data.proxy.Rest'

    ],

    config: {

proxy: {
    type: 'rest',
    url: WINK.Utilities.getRestURL() + 'stores'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'companyname'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'name'
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
{ name: 'website'
, type:'string'
 ,defaultValue: ''
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
{ name: 'taxnumber1'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'taxnumber2'
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
{ name: 'povonlineid'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'onlineversion'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'quickbooksfile_idquickbooksfile'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'timezone'
, type:'string'
 ,defaultValue: "America/New_York"
}
,
{ name: 'smsgatewayprotocol'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'name_fr'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'name_sp'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'name_it'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'useasdefaultaddress'
, type:'boolean'
 ,defaultValue: true
}
,
{ name: 'epayaccounts_idepayaccounts'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'edgemountcapacity'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'cariesstocklenses'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'icdrevision'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'defaultlanguage'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'defaultinvoicenote'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'rxverificationbeforeorderrequired'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'rxverificationbeforedeliveryrequired'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'inclusiveoftax'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'openingbalancedate'
, type:'date'
 ,defaultValue: new Date(2015,3,12,0,0,0)
}
,
{ name: 'openingbalanceclosedon'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'defaultpairlenspricing'
, type:'boolean'
 ,defaultValue: false
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
{ name: 'companylegalname'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'bookscloseddate'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'edgeatstore_idstore'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'edgeatsupplier_idsupplier'
, type:'int'
 ,defaultValue: 0
}
        ]

,validations: [
 { type: 'length', field: 'companyname', max: 45,min:0 }
,
 { type: 'length', field: 'name', max: 45,min:0 }
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
 { type: 'length', field: 'website', max: 150,min:0 }
,
 { type: 'length', field: 'taxnumber1', max: 45,min:0 }
,
 { type: 'length', field: 'taxnumber2', max: 45,min:0 }
,
 { type: 'length', field: 'unit', max: 45,min:0 }
,
 { type: 'length', field: 'timezone', max: 45,min:0 }
,
 { type: 'length', field: 'name_fr', max: 45,min:0 }
,
 { type: 'length', field: 'name_sp', max: 45,min:0 }
,
 { type: 'length', field: 'name_it', max: 45,min:0 }
,
 { type: 'length', field: 'icdrevision', max: 45,min:0 }
,
 { type: 'length', field: 'defaultinvoicenote', max: 150,min:0 }
,
 { type: 'length', field: 'reference1', max: 45,min:0 }
,
 { type: 'length', field: 'reference2', max: 45,min:0 }
,
 { type: 'length', field: 'companylegalname', max: 300,min:0 }
]    
}
});
