Ext.define('WINK.model.RxWorksheetTreatment',{
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
    url: WINK.Utilities.getRestURL() + 'rxworksheettreatments',
            withCredentials: true,
            useDefaultXhrHeader: false,
            cors: true  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'rxworksheet_idrxworksheet'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'product_idproduct'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'price'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'reference'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'comment'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'extraref_r'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'extraref_l'
, type:'string'
 ,defaultValue: ''
}
        ]

 ,belongsTo: [

            {
                model: 'WINK.model.RxWorksheet',
                associatedName: 'fkrxworksheet_idrxworksheet',
                foreignKey: 'rxworksheet_idrxworksheet',
                primaryKey: 'id',
                getterName: 'getFkrxworksheet_idrxworksheet',
                setterName: 'setFkrxworksheet_idrxworksheet'
            }

,
            {
                model: 'WINK.model.Product',
                associatedName: 'fkproduct_idproduct',
                foreignKey: 'product_idproduct',
                primaryKey: 'id',
                getterName: 'getFkproduct_idproduct',
                setterName: 'setFkproduct_idproduct'
            }

        ] 
 ,hasMany: [

        ] 
,validations: [
 { type: 'length', field: 'comment', max: 45,min:0 }
,
 { type: 'length', field: 'extraref_r', max: 45,min:0 }
,
 { type: 'length', field: 'extraref_l', max: 45,min:0 }
]    
}
});
