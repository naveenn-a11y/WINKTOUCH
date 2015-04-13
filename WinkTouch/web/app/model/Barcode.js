Ext.define('WINK.model.Barcode',{
extend: 'Ext.data.Model',
requires: [
'Ext.data.Field',
'WINK.Utilities'

        ,'Ext.data.proxy.Rest'

    ],

    config: {

proxy: {
    type: 'rest',
    url: WINK.Utilities.getRestURL() + 'barcodes'
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
{ name: 'contactlens_idcontactlens'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'stocklens_idstocklens'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'dateprinted'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'removedbyinventoryadjustment_idinventoryadjustment'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'createdbyinventoryadjustment_idinventoryadjustment'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'removedbypatientinvoiceitem_idpatientinvoiceitem'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'createdbypatientinvoiceitem_idpatientinvoiceitem'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'removedbyreceiveproductitem_idreceiveproductitem'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'createdbyreceiveproductitem_idreceiveproductitem'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'lastdatefound'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'disabled'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'disabledon'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'disabledbyuser_iduser'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'reference1'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'reference2'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'createdbyproductob_idproductob'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'datecreated'
, type:'date'
 ,defaultValue: null
}
        ]

,validations: [
]    
}
});
