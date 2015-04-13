Ext.define('WINK.model.ProductRetailDetail',{
extend: 'Ext.data.Model',
requires: [
'Ext.data.Field',
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

,validations: [
]    
}
});
