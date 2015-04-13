Ext.define('WINK.model.ProductRetailDetail',{
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
    url: WINK.Utilities.getRestURL() + 'productretaildetails'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'product_idproduct'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'store_idstore'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'taxcode_idtaxcode'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'retailpricefrom'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'retailpriceto'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'finishedlensavaillibility_idfinishedlensavaillibility'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'contactlensavaillibility_idcontactlensavaillibility'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'lenstreatment_idlenstreatment'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'hasextras'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'lensmaterial_idlensmaterial'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'taxincluded'
, type:'boolean'
 ,defaultValue: false
}
        ]

 ,belongsTo: [

            {
                model: 'WINK.model.Product',
                associatedName: 'fkproduct_idproduct',
                foreignKey: 'product_idproduct',
                primaryKey: 'id',
                getterName: 'getFkproduct_idproduct',
                setterName: 'setFkproduct_idproduct'
            }

,
            {
                model: 'WINK.model.Store',
                associatedName: 'fkstore_idstore',
                foreignKey: 'store_idstore',
                primaryKey: 'id',
                getterName: 'getFkstore_idstore',
                setterName: 'setFkstore_idstore'
            }

,
            {
                model: 'WINK.model.TaxCode',
                associatedName: 'fktaxcode_idtaxcode',
                foreignKey: 'taxcode_idtaxcode',
                primaryKey: 'id',
                getterName: 'getFktaxcode_idtaxcode',
                setterName: 'setFktaxcode_idtaxcode'
            }

,
            {
                model: 'WINK.model.Product',
                associatedName: 'fklenstreatment_idlenstreatment',
                foreignKey: 'lenstreatment_idlenstreatment',
                primaryKey: 'id',
                getterName: 'getFklenstreatment_idlenstreatment',
                setterName: 'setFklenstreatment_idlenstreatment'
            }

,
            {
                model: 'WINK.model.Product',
                associatedName: 'fklensmaterial_idlensmaterial',
                foreignKey: 'lensmaterial_idlensmaterial',
                primaryKey: 'id',
                getterName: 'getFklensmaterial_idlensmaterial',
                setterName: 'setFklensmaterial_idlensmaterial'
            }

        ] 
 ,hasMany: [

        ] 
,validations: [
]    
}
});
