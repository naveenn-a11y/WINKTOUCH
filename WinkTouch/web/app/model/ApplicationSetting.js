Ext.define('WINK.model.ApplicationSetting',{
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
    url: WINK.Utilities.getRestURL() + 'applicationsettings',
            withCredentials: true,
            useDefaultXhrHeader: false,
            cors: true  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'setting'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'value'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'date'
, type:'date'
 ,defaultValue: null
}
        ]

 ,belongsTo: [

        ] 
 ,hasMany: [

        ] 
,validations: [
 { type: 'length', field: 'setting', max: 45,min:0 }
,
 { type: 'length', field: 'value', max: 350,min:0 }
]    
}
});
