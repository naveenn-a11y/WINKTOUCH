Ext.define('WINK.model.CountrySubdivision', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Field'
    ],

    config: {
        fields: [

{ name: 'idcountrysubdivision',
 defaultValue: 0
}
,
{ name: 'country_idcountry',
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
