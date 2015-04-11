Ext.define('WINK.model.Country', {
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
{ name: 'name'
, type:'string'
 ,defaultValue: ''
}
        ]

,validations: [
 { type: 'length', field: 'name', max: 45,min:0 }
]    
}
});
