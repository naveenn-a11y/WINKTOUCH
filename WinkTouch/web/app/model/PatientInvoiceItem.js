Ext.define('WINK.model.PatientInvoiceItem',{
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
    url: WINK.Utilities.getRestURL() + 'patientinvoiceitems',
            withCredentials: true,
            useDefaultXhrHeader: false,
            cors: true  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'patientinvoice_idpatientinvoice'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'qty'
, type:'int'
 ,defaultValue: 1
}
,
{ name: 'unitprice'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'tax1amount'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'tax2amount'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'taxcode_idtaxcode'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'product_idproduct'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'rxworksheet_idrxworksheet'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'description'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'clworksheet_idclworksheet'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'worksheetflag'
, type:'string'
 ,defaultValue: ''
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
{ name: 'barcode_idbarcode'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'discountauthorizedbyuser_iduser'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'icd_idicd'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'insurance1amount'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'insurance1tax1amount'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'insurance1tax2amount'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'insurance2amount'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'insurance2tax1amount'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'insurance2tax2amount'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'discountamount'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'prediscount_unitprice'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'refundofpatientinvoiceitem_idpatientinvoiceitem'
, type:'int'
 ,defaultValue: null
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
,
{ name: 'dateposted'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'datediscountposted'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'isestimate'
, type:'boolean'
 ,defaultValue: false
}
        ]

 ,belongsTo: [

            {
                model: 'WINK.model.PatientInvoice',
                associatedName: 'fkpatientinvoice_idpatientinvoice',
                foreignKey: 'patientinvoice_idpatientinvoice',
                primaryKey: 'id',
                getterName: 'getFkpatientinvoice_idpatientinvoice',
                setterName: 'setFkpatientinvoice_idpatientinvoice'
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
                associatedName: 'fkproduct_idproduct',
                foreignKey: 'product_idproduct',
                primaryKey: 'id',
                getterName: 'getFkproduct_idproduct',
                setterName: 'setFkproduct_idproduct'
            }

,
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
                model: 'WINK.model.ClWorksheet',
                associatedName: 'fkclworksheet_idclworksheet',
                foreignKey: 'clworksheet_idclworksheet',
                primaryKey: 'id',
                getterName: 'getFkclworksheet_idclworksheet',
                setterName: 'setFkclworksheet_idclworksheet'
            }

,
            {
                model: 'WINK.model.Barcode',
                associatedName: 'fkbarcode_idbarcode',
                foreignKey: 'barcode_idbarcode',
                primaryKey: 'id',
                getterName: 'getFkbarcode_idbarcode',
                setterName: 'setFkbarcode_idbarcode'
            }

,
            {
                model: 'WINK.model.User',
                associatedName: 'fkdiscountauthorizedbyuser_iduser',
                foreignKey: 'discountauthorizedbyuser_iduser',
                primaryKey: 'id',
                getterName: 'getFkdiscountauthorizedbyuser_iduser',
                setterName: 'setFkdiscountauthorizedbyuser_iduser'
            }

,
            {
                model: 'WINK.model.PatientInvoiceItem',
                associatedName: 'fkrefundofpatientinvoiceitem_idpatientinvoiceitem',
                foreignKey: 'refundofpatientinvoiceitem_idpatientinvoiceitem',
                primaryKey: 'id',
                getterName: 'getFkrefundofpatientinvoiceitem_idpatientinvoiceitem',
                setterName: 'setFkrefundofpatientinvoiceitem_idpatientinvoiceitem'
            }

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.PatientPayment',
                name: 'patientpayments_patientinvoiceitem_idpatientinvoiceitem',
                foreignKey: 'patientinvoiceitem_idpatientinvoiceitem',
                associationKey: 'patientpayments_patientinvoiceitem_idpatientinvoiceitem',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoiceItem',
                name: 'patientinvoiceitems_refundofpatientinvoiceitem_idpatientinvoiceitem',
                foreignKey: 'refundofpatientinvoiceitem_idpatientinvoiceitem',
                associationKey: 'patientinvoiceitems_refundofpatientinvoiceitem_idpatientinvoiceitem',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Barcode',
                name: 'barcodes_removedbypatientinvoiceitem_idpatientinvoiceitem',
                foreignKey: 'removedbypatientinvoiceitem_idpatientinvoiceitem',
                associationKey: 'barcodes_removedbypatientinvoiceitem_idpatientinvoiceitem',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Barcode',
                name: 'barcodes_createdbypatientinvoiceitem_idpatientinvoiceitem',
                foreignKey: 'createdbypatientinvoiceitem_idpatientinvoiceitem',
                associationKey: 'barcodes_createdbypatientinvoiceitem_idpatientinvoiceitem',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'description', max: 150,min:0 }
,
 { type: 'length', field: 'worksheetflag', max: 45,min:0 }
,
 { type: 'length', field: 'reference1', max: 45,min:0 }
,
 { type: 'length', field: 'reference2', max: 45,min:0 }
]    
}
});
