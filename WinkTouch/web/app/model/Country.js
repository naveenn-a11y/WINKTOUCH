Ext.define('WINK.model.Country', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Field'
    ],

    config: {
        fields: [

{ name: 'idcountry',
 defaultValue: 0
}
,
{ name: 'name',
 defaultValue: null
}
        ],
validations: [
 { type: 'length', field: 'name', max: 45 }
]    }
});
