Ext.define('WINK.model.ProductCategory',{
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
    url: WINK.Utilities.getRestURL() + 'productcategories'
  },
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
,
{ name: 'description'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'comment'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'inactive'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'version'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'name_fr'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'name_sp'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'name_it'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'description_fr'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'description_sp'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'description_it'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'reference1'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'reference2'
, type:'string'
 ,defaultValue: ''
}
        ]

 ,belongsTo: [

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.Product',
                name: 'products',
                foreignKey: 'productcategory_idproductcategory',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'name', max: 45,min:0 }
,
 { type: 'length', field: 'description', max: 150,min:0 }
,
 { type: 'length', field: 'name_fr', max: 45,min:0 }
,
 { type: 'length', field: 'name_sp', max: 45,min:0 }
,
 { type: 'length', field: 'name_it', max: 45,min:0 }
,
 { type: 'length', field: 'description_fr', max: 150,min:0 }
,
 { type: 'length', field: 'description_sp', max: 150,min:0 }
,
 { type: 'length', field: 'description_it', max: 150,min:0 }
,
 { type: 'length', field: 'reference1', max: 45,min:0 }
,
 { type: 'length', field: 'reference2', max: 45,min:0 }
]    
}
});
