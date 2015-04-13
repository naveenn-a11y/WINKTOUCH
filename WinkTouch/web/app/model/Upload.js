Ext.define('WINK.model.Upload',{
extend: 'Ext.data.Model',
requires: [
'Ext.data.Field',
'WINK.Utilities'

        ,'Ext.data.proxy.Rest'

    ],

    config: {

proxy: {
    type: 'rest',
    url: WINK.Utilities.getRestURL() + 'uploads'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'datetime'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'data'
 ,defaultValue: "null"
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
{ name: 'filename'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'mimetype'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'size'
, type:'int'
 ,defaultValue: 0
}
        ]

,validations: [
 { type: 'length', field: 'mimetype', max: 45,min:0 }
]    
}
});
