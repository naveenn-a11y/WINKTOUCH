Ext.define('WINK.model.Barcode',{
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
    url: WINK.Utilities.getRestURL() + 'barcodes',
            withCredentials: true,
            useDefaultXhrHeader: false,
            cors: true  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'product_idproduct'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'contactlens_idcontactlens'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'stocklens_idstocklens'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'dateprinted'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'removedbyinventoryadjustment_idinventoryadjustment'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'createdbyinventoryadjustment_idinventoryadjustment'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'removedbypatientinvoiceitem_idpatientinvoiceitem'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'createdbypatientinvoiceitem_idpatientinvoiceitem'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'removedbyreceiveproductitem_idreceiveproductitem'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'createdbyreceiveproductitem_idreceiveproductitem'
, type:'int'
 ,defaultValue: null
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
 ,defaultValue: null
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
 ,defaultValue: null
}
,
{ name: 'datecreated'
, type:'date'
 ,defaultValue: null
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
                model: 'WINK.model.PatientInvoiceItem',
                associatedName: 'fkremovedbypatientinvoiceitem_idpatientinvoiceitem',
                foreignKey: 'removedbypatientinvoiceitem_idpatientinvoiceitem',
                primaryKey: 'id',
                getterName: 'getFkremovedbypatientinvoiceitem_idpatientinvoiceitem',
                setterName: 'setFkremovedbypatientinvoiceitem_idpatientinvoiceitem'
            }

,
            {
                model: 'WINK.model.PatientInvoiceItem',
                associatedName: 'fkcreatedbypatientinvoiceitem_idpatientinvoiceitem',
                foreignKey: 'createdbypatientinvoiceitem_idpatientinvoiceitem',
                primaryKey: 'id',
                getterName: 'getFkcreatedbypatientinvoiceitem_idpatientinvoiceitem',
                setterName: 'setFkcreatedbypatientinvoiceitem_idpatientinvoiceitem'
            }

,
            {
                model: 'WINK.model.User',
                associatedName: 'fkdisabledbyuser_iduser',
                foreignKey: 'disabledbyuser_iduser',
                primaryKey: 'id',
                getterName: 'getFkdisabledbyuser_iduser',
                setterName: 'setFkdisabledbyuser_iduser'
            }

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.PatientInvoiceItem',
                name: 'patientinvoiceitems_barcode_idbarcode',
                foreignKey: 'barcode_idbarcode',
                associationKey: 'patientinvoiceitems_barcode_idbarcode',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.RxWorksheet',
                name: 'rxworksheets_framebarcode_idbarcode',
                foreignKey: 'framebarcode_idbarcode',
                associationKey: 'rxworksheets_framebarcode_idbarcode',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.ClWorksheet',
                name: 'clworksheets_rbarcode_idbarcode',
                foreignKey: 'rbarcode_idbarcode',
                associationKey: 'clworksheets_rbarcode_idbarcode',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.ClWorksheet',
                name: 'clworksheets_lbarcode_idbarcode',
                foreignKey: 'lbarcode_idbarcode',
                associationKey: 'clworksheets_lbarcode_idbarcode',
                primaryKey: 'id'
            }

        ] 
,validations: [
]    
}
});
