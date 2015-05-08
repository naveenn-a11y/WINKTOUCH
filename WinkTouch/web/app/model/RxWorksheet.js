Ext.define('WINK.model.RxWorksheet',{
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
    url: WINK.Utilities.getRestURL() + 'rxworksheets',
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
{ name: 'r'
, type:'boolean'
 ,defaultValue: true
}
,
{ name: 'l'
, type:'boolean'
 ,defaultValue: true
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
{ name: 'r_prism1'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_prism1b'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'r_prism2'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_prism2b'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'prism'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'r_farpd'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_closepd'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_height'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_price'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'labinstructions'
, type:'string'
 ,defaultValue: ''
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
{ name: 'l_prism1'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_prism1b'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'l_prism2'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_prism2b'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'l_farpd'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_closepd'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_height'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_price'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'underwarranty'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'framesrc'
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
{ name: 'framea'
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
{ name: 'frameprice'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_bc'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_bc'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'frame_idproduct'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'framebarcode_idbarcode'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'version'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'frame_idtaxcode'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'isexternaldoctor'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'lens_idproduct'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'lensmaterial_idlensmaterial'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'lenstreatment_idlenstreatment'
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
{ name: 'framepricemanuallyupdated'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'supplier_idsupplier'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'uploads_iduploads'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'uploadname'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'rxworksheet_idrxworksheet'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'reasonforredocomment'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'rxredoreason_idrxredoreason'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'rxreasonforpurchase_idrxreasonforpurchase'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'ispatientownlenses'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'r_price_material'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_price_coating'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_price_material'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_price_coating'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'rpricecoatingmanuallyupdated'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'rpricematerialmanuallyupdated'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'lpricecoatingmanuallyupdated'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'lpricematerialmanuallyupdated'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'createdon'
, type:'date'
 ,defaultValue: new Date(2015,4,7,5,9,55)
}
,
{ name: 'scriptreceivedon'
, type:'date'
 ,defaultValue: new Date(2015,4,7,5,9,55)
}
,
{ name: 'opticianuser_iduser'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'r_va'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'l_va'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'r_add2'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_add2'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_thickness'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_ec'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'l_thickness'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_ec'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'r_vertex'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'r_vertexadjust'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_vertex'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'l_vertextadjust'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'perpairlenspricing'
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
                associatedName: 'fkframe_idproduct',
                foreignKey: 'frame_idproduct',
                primaryKey: 'id',
                getterName: 'getFkframe_idproduct',
                setterName: 'setFkframe_idproduct'
            }

,
            {
                model: 'WINK.model.Barcode',
                associatedName: 'fkframebarcode_idbarcode',
                foreignKey: 'framebarcode_idbarcode',
                primaryKey: 'id',
                getterName: 'getFkframebarcode_idbarcode',
                setterName: 'setFkframebarcode_idbarcode'
            }

,
            {
                model: 'WINK.model.TaxCode',
                associatedName: 'fkframe_idtaxcode',
                foreignKey: 'frame_idtaxcode',
                primaryKey: 'id',
                getterName: 'getFkframe_idtaxcode',
                setterName: 'setFkframe_idtaxcode'
            }

,
            {
                model: 'WINK.model.Product',
                associatedName: 'fklens_idproduct',
                foreignKey: 'lens_idproduct',
                primaryKey: 'id',
                getterName: 'getFklens_idproduct',
                setterName: 'setFklens_idproduct'
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
                model: 'WINK.model.Supplier',
                associatedName: 'fksupplier_idsupplier',
                foreignKey: 'supplier_idsupplier',
                primaryKey: 'id',
                getterName: 'getFksupplier_idsupplier',
                setterName: 'setFksupplier_idsupplier'
            }

,
            {
                model: 'WINK.model.Upload',
                associatedName: 'fkuploads_iduploads',
                foreignKey: 'uploads_iduploads',
                primaryKey: 'id',
                getterName: 'getFkuploads_iduploads',
                setterName: 'setFkuploads_iduploads'
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
                name: 'patientinvoiceitems_rxworksheet_idrxworksheet',
                foreignKey: 'rxworksheet_idrxworksheet',
                associationKey: 'patientinvoiceitems_rxworksheet_idrxworksheet',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.RxWorksheet',
                name: 'rxworksheets_rxworksheet_idrxworksheet',
                foreignKey: 'rxworksheet_idrxworksheet',
                associationKey: 'rxworksheets_rxworksheet_idrxworksheet',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.RxWorksheetTreatment',
                name: 'rxworksheettreatments_rxworksheet_idrxworksheet',
                foreignKey: 'rxworksheet_idrxworksheet',
                associationKey: 'rxworksheettreatments_rxworksheet_idrxworksheet',
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
 { type: 'length', field: 'framebrand', max: 45,min:0 }
,
 { type: 'length', field: 'framemodel', max: 45,min:0 }
,
 { type: 'length', field: 'framecolor', max: 45,min:0 }
,
 { type: 'length', field: 'frameb', max: 45,min:0 }
,
 { type: 'length', field: 'frameed', max: 45,min:0 }
,
 { type: 'length', field: 'framedbl', max: 45,min:0 }
,
 { type: 'length', field: 'framea', max: 45,min:0 }
,
 { type: 'length', field: 'reference1', max: 45,min:0 }
,
 { type: 'length', field: 'reference2', max: 45,min:0 }
,
 { type: 'length', field: 'uploadname', max: 100,min:0 }
,
 { type: 'length', field: 'reasonforredocomment', max: 100,min:0 }
,
 { type: 'length', field: 'r_va', max: 45,min:0 }
,
 { type: 'length', field: 'l_va', max: 45,min:0 }
]    
}
});
