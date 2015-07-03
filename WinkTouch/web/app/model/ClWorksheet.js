Ext.define('WINK.model.ClWorksheet',{
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
    url: WINK.Utilities.getRestURL() + 'clworksheets',
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
{ name: 'createby_iduser'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'externaldoctor'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'doctor_iduser'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'tray'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'labinstructions'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'r_qty'
, type:'int'
 ,defaultValue: 1
}
,
{ name: 'l_qty'
, type:'int'
 ,defaultValue: 1
}
,
{ name: 'r_sph'
, type:'string'
 ,defaultValue: "0.00"
}
,
{ name: 'r_cyl'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_axis'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_add'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_bc'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_dia'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_dn'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'r_price'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_sph'
, type:'string'
 ,defaultValue: "0.00"
}
,
{ name: 'l_cyl'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_axis'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_add'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_bc'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_dia'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_dn'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'l_price'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'version'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'rcl_idproduct'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'rbarcode_idbarcode'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'lbarcode_idbarcode'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'isexternaldoctor'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'lcl_idproduct'
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
{ name: 'rpricemanuallyupdated'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'lpricemanuallyupdated'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'supplier_idsupplier'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'createdon'
, type:'date'
 ,defaultValue: new Date(2015,6,2,10,57,18)
}
,
{ name: 'opticianuser_iduser'
, type:'int'
 ,defaultValue: null
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
                model: 'WINK.model.User',
                associatedName: 'fkcreateby_iduser',
                foreignKey: 'createby_iduser',
                primaryKey: 'id',
                getterName: 'getFkcreateby_iduser',
                setterName: 'setFkcreateby_iduser'
            }

,
            {
                model: 'WINK.model.User',
                associatedName: 'fkdoctor_iduser',
                foreignKey: 'doctor_iduser',
                primaryKey: 'id',
                getterName: 'getFkdoctor_iduser',
                setterName: 'setFkdoctor_iduser'
            }

,
            {
                model: 'WINK.model.Product',
                associatedName: 'fkrcl_idproduct',
                foreignKey: 'rcl_idproduct',
                primaryKey: 'id',
                getterName: 'getFkrcl_idproduct',
                setterName: 'setFkrcl_idproduct'
            }

,
            {
                model: 'WINK.model.Barcode',
                associatedName: 'fkrbarcode_idbarcode',
                foreignKey: 'rbarcode_idbarcode',
                primaryKey: 'id',
                getterName: 'getFkrbarcode_idbarcode',
                setterName: 'setFkrbarcode_idbarcode'
            }

,
            {
                model: 'WINK.model.Barcode',
                associatedName: 'fklbarcode_idbarcode',
                foreignKey: 'lbarcode_idbarcode',
                primaryKey: 'id',
                getterName: 'getFklbarcode_idbarcode',
                setterName: 'setFklbarcode_idbarcode'
            }

,
            {
                model: 'WINK.model.Product',
                associatedName: 'fklcl_idproduct',
                foreignKey: 'lcl_idproduct',
                primaryKey: 'id',
                getterName: 'getFklcl_idproduct',
                setterName: 'setFklcl_idproduct'
            }

,
            {
                model: 'WINK.model.Supplier',
                associatedName: 'fksupplier_idsupplier',
                foreignKey: 'supplier_idsupplier',
                primaryKey: 'id',
                getterName: 'getFksupplier_idsupplier',
                setterName: 'setFksupplier_idsupplier'
            }

,
            {
                model: 'WINK.model.User',
                associatedName: 'fkopticianuser_iduser',
                foreignKey: 'opticianuser_iduser',
                primaryKey: 'id',
                getterName: 'getFkopticianuser_iduser',
                setterName: 'setFkopticianuser_iduser'
            }

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.PatientInvoiceItem',
                name: 'patientinvoiceitems_clworksheet_idclworksheet',
                foreignKey: 'clworksheet_idclworksheet',
                associationKey: 'patientinvoiceitems_clworksheet_idclworksheet',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'externaldoctor', max: 45,min:0 }
,
 { type: 'length', field: 'tray', max: 45,min:0 }
,
 { type: 'length', field: 'r_sph', max: 45,min:0 }
,
 { type: 'length', field: 'l_sph', max: 45,min:0 }
,
 { type: 'length', field: 'reference1', max: 45,min:0 }
,
 { type: 'length', field: 'reference2', max: 45,min:0 }
]    
}
});
