Ext.define('WINK.model.Product',{
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
    url: WINK.Utilities.getRestURL() + 'products'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: null
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
{ name: 'usebarcode'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'comment'
, type:'string'
 ,defaultValue: ""
}
,
{ name: 'type'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'framebrand'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'framemodel'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'framecolor'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'framea'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'frameb'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'frameed'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'framedbl'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'frametype'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'frameshape'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'contactlensbrand'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'contactlensdesign'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'contactlenstype'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'contactlensmaterial'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'contactlenswearingperiod'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'contactlensreplacement'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'contactlensqtyperbox'
, type:'int'
 ,defaultValue: 1
}
,
{ name: 'finishedlensdesign'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'finsihedlenstype'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'finishedlensissurfaced'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'finishedlensaddfrom'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'finishedlensaddto'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'version'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'inactive'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'productcategory_idproductcategory'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'finishedlensistoric'
, type:'boolean'
 ,defaultValue: true
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
{ name: 'iseyeexam'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'povonlineid'
, type:'int'
 ,defaultValue: 0
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
{ name: 'printas'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'printas_fr'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'printas_sp'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'printas_it'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'framesex'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'finishedlenspricedetailed'
, type:'int'
 ,defaultValue: 1
}
,
{ name: 'code'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'tagcolor'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'discontinuedon'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'msrp'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'publishedwholesalecost'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'frametemple'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'insurancecode'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'preferredsupplier_idsupplier'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'manufacturersupplier_idsupplier'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'donotpreload'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'entrymethod'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'framesdataid'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'bestseller'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'framecolorname'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'framelenscolorcode'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'framelenscolorname'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'upc'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'imageuploads_iduploads'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'framecolorasone'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'lensoptiontype'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'finishedlensisfreefrom'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'lensoptionunit'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'finishedlensmaterialcolor'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'finishedlensmaterialpolarized'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'finishedlensmaterialphotochromic'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'finishedlenscoatinghydrophobe'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'finishedlenscoatingar'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'finishedlenscoatingbackar'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'finishedlenscoatingrae'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'isgeneric'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'finishedlensmaterialname'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'finishedlensistintable'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'finishedlensmaterialindex'
, type:'float'
 ,defaultValue: 0.0
}
        ]

 ,belongsTo: [

            {
                model: 'WINK.model.ProductCategory',
                associatedName: 'fkproductcategory_idproductcategory',
                foreignKey: 'productcategory_idproductcategory',
                primaryKey: 'id',
                getterName: 'getFkproductcategory_idproductcategory',
                setterName: 'setFkproductcategory_idproductcategory'
            }

,
            {
                model: 'WINK.model.Supplier',
                associatedName: 'fkpreferredsupplier_idsupplier',
                foreignKey: 'preferredsupplier_idsupplier',
                primaryKey: 'id',
                getterName: 'getFkpreferredsupplier_idsupplier',
                setterName: 'setFkpreferredsupplier_idsupplier'
            }

,
            {
                model: 'WINK.model.Supplier',
                associatedName: 'fkmanufacturersupplier_idsupplier',
                foreignKey: 'manufacturersupplier_idsupplier',
                primaryKey: 'id',
                getterName: 'getFkmanufacturersupplier_idsupplier',
                setterName: 'setFkmanufacturersupplier_idsupplier'
            }

,
            {
                model: 'WINK.model.Upload',
                associatedName: 'fkimageuploads_iduploads',
                foreignKey: 'imageuploads_iduploads',
                primaryKey: 'id',
                getterName: 'getFkimageuploads_iduploads',
                setterName: 'setFkimageuploads_iduploads'
            }

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.PatientInvoiceItem',
                name: 'patientinvoiceitems_product_idproduct',
                foreignKey: 'product_idproduct',
                associationKey: 'patientinvoiceitems_product_idproduct',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Barcode',
                name: 'barcodes_product_idproduct',
                foreignKey: 'product_idproduct',
                associationKey: 'barcodes_product_idproduct',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.ProductRetailDetail',
                name: 'productretaildetails_product_idproduct',
                foreignKey: 'product_idproduct',
                associationKey: 'productretaildetails_product_idproduct',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.ProductRetailDetail',
                name: 'productretaildetails_lenstreatment_idlenstreatment',
                foreignKey: 'lenstreatment_idlenstreatment',
                associationKey: 'productretaildetails_lenstreatment_idlenstreatment',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.ProductRetailDetail',
                name: 'productretaildetails_lensmaterial_idlensmaterial',
                foreignKey: 'lensmaterial_idlensmaterial',
                associationKey: 'productretaildetails_lensmaterial_idlensmaterial',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'name', max: 300,min:0 }
,
 { type: 'length', field: 'description', max: 150,min:0 }
,
 { type: 'length', field: 'framebrand', max: 100,min:0 }
,
 { type: 'length', field: 'framemodel', max: 100,min:0 }
,
 { type: 'length', field: 'framecolor', max: 100,min:0 }
,
 { type: 'length', field: 'framea', max: 45,min:0 }
,
 { type: 'length', field: 'frameb', max: 45,min:0 }
,
 { type: 'length', field: 'frameed', max: 45,min:0 }
,
 { type: 'length', field: 'framedbl', max: 45,min:0 }
,
 { type: 'length', field: 'contactlensbrand', max: 45,min:0 }
,
 { type: 'length', field: 'contactlensdesign', max: 45,min:0 }
,
 { type: 'length', field: 'finishedlensdesign', max: 45,min:0 }
,
 { type: 'length', field: 'reference1', max: 45,min:0 }
,
 { type: 'length', field: 'reference2', max: 45,min:0 }
,
 { type: 'length', field: 'description_fr', max: 150,min:0 }
,
 { type: 'length', field: 'description_sp', max: 150,min:0 }
,
 { type: 'length', field: 'description_it', max: 150,min:0 }
,
 { type: 'length', field: 'name_fr', max: ***REMOVED***,min:0 }
,
 { type: 'length', field: 'name_sp', max: ***REMOVED***,min:0 }
,
 { type: 'length', field: 'name_it', max: ***REMOVED***,min:0 }
,
 { type: 'length', field: 'printas', max: 100,min:0 }
,
 { type: 'length', field: 'printas_fr', max: 100,min:0 }
,
 { type: 'length', field: 'printas_sp', max: 100,min:0 }
,
 { type: 'length', field: 'printas_it', max: 100,min:0 }
,
 { type: 'length', field: 'code', max: 45,min:0 }
,
 { type: 'length', field: 'frametemple', max: 45,min:0 }
,
 { type: 'length', field: 'insurancecode', max: 45,min:0 }
,
 { type: 'length', field: 'framecolorname', max: 100,min:0 }
,
 { type: 'length', field: 'framelenscolorcode', max: 100,min:0 }
,
 { type: 'length', field: 'framelenscolorname', max: 100,min:0 }
,
 { type: 'length', field: 'upc', max: 45,min:0 }
,
 { type: 'length', field: 'framecolorasone', max: 400,min:0 }
,
 { type: 'length', field: 'finishedlensmaterialcolor', max: 45,min:0 }
,
 { type: 'length', field: 'finishedlensmaterialname', max: 45,min:0 }
]    
}
});
