Ext.define('WINK.model.CountrySubdivision',{
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
    url: WINK.Utilities.getRestURL() + 'countries/subdivision',
            withCredentials: true,
            useDefaultXhrHeader: false,
            cors: true  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'country_idcountry'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'name'
, type:'string'
 ,defaultValue: ''
}
        ]

 ,belongsTo: [

            {
                model: 'WINK.model.Country',
                associatedName: 'fkcountry_idcountry',
                foreignKey: 'country_idcountry',
                primaryKey: 'id',
                getterName: 'getFkcountry_idcountry',
                setterName: 'setFkcountry_idcountry'
            }

        ] 
 ,hasMany: [

        ] 
,validations: [
 { type: 'length', field: 'name', max: 45,min:0 }
]    
}
});
