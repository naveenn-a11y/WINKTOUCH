Ext.define('WINK.model.ApplicationSetting', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Field',
        'WINK.Utilities'    ],

    config: {

proxy: {
    type: 'rest',
    url: WINK.Utilities.getRestURL() + 'applicationsettings'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
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

,validations: [
 { type: 'length', field: 'setting', max: 45,min:0 }
,
 { type: 'length', field: 'value', max: 350,min:0 }
]    
}
});
