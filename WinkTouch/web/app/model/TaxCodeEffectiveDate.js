Ext.define('WINK.model.TaxCodeEffectiveDate',{
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
    url: WINK.Utilities.getRestURL() + 'taxcodeeffectivedates',
            withCredentials: true,
            useDefaultXhrHeader: false,
            cors: true  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'taxcode_idtaxcode'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'tax1percentage'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'tax2percentage'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'piggyback'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'effectivedate'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'povonlineid'
, type:'int'
 ,defaultValue: 0
}
        ]

 ,belongsTo: [

            {
                model: 'WINK.model.TaxCode',
                associatedName: 'fktaxcode_idtaxcode',
                foreignKey: 'taxcode_idtaxcode',
                primaryKey: 'id',
                getterName: 'getFktaxcode_idtaxcode',
                setterName: 'setFktaxcode_idtaxcode'
            }

        ] 
 ,hasMany: [

        ] 
,validations: [
]    
}
});
