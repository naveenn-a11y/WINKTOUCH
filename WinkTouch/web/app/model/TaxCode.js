Ext.define('WINK.model.TaxCode',{
extend: 'Ext.data.Model',
requires: [
'Ext.data.Field',
'WINK.Utilities'

        ,'Ext.data.proxy.Rest'

    ],

    config: {

proxy: {
    type: 'rest',
    url: WINK.Utilities.getRestURL() + 'taxcodes'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'code'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'description'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'tax1name'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'tax2name'
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
{ name: 'povonlineid'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'tax1name_fr'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'tax1name_sp'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'tax1name_it'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'tax2name_fr'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'tax2name_sp'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'tax2name_it'
, type:'string'
 ,defaultValue: ''
}
        ]

,validations: [
 { type: 'length', field: 'code', max: 45,min:0 }
,
 { type: 'length', field: 'description', max: 150,min:0 }
,
 { type: 'length', field: 'tax1name', max: 45,min:0 }
,
 { type: 'length', field: 'tax2name', max: 45,min:0 }
,
 { type: 'length', field: 'tax1name_fr', max: 45,min:0 }
,
 { type: 'length', field: 'tax1name_sp', max: 45,min:0 }
,
 { type: 'length', field: 'tax1name_it', max: 45,min:0 }
,
 { type: 'length', field: 'tax2name_fr', max: 45,min:0 }
,
 { type: 'length', field: 'tax2name_sp', max: 45,min:0 }
,
 { type: 'length', field: 'tax2name_it', max: 45,min:0 }
]    
}
});
