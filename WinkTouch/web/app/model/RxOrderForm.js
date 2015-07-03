Ext.define('WINK.model.RxOrderForm',{
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
    url: WINK.Utilities.getRestURL() + 'rxorderforms',
            withCredentials: true,
            useDefaultXhrHeader: false,
            cors: true  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: null
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
{ name: 'supplierreference'
, type:'string'
 ,defaultValue: ''
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
{ name: 'lens_idproduct'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'store_idstore'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'user_iduser'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'shipto'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'reference'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'tostore_idstore'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'tosupplier_idsupplier'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'orderdate'
, type:'date'
 ,defaultValue: new Date(2015,6,2,10,57,18)
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
{ name: 'supplier_idsupplier'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'supplieraccount_idsupplieraccount'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'iscut'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'option'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'version'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'povonlineid'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'framebarcode_idbarcode'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'tracingnumber'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'rxworksheet_idrxworksheet'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'rushdate'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'rxorderform_idrxorderform'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'rxredoreason_idrxredoreason'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'reasonforredocomment'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'supplierinvoice'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'originalinvoicenumber'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'topatient_idpatient'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'onlineorderedon'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'underwarranty'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'createdon'
, type:'date'
 ,defaultValue: new Date(2015,6,2,10,57,18)
}
,
{ name: 'onlineorderrequestedon'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'emailorderrequestedon'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'onlineorderrequesteduser_iduser'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'emailorderrequesteduser_iduser'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'onlineordersuccess'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'emailordersuccess'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'sla'
, type:'int'
 ,defaultValue: 0
}
        ]

 ,belongsTo: [

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
                model: 'WINK.model.Product',
                associatedName: 'fklens_idproduct',
                foreignKey: 'lens_idproduct',
                primaryKey: 'id',
                getterName: 'getFklens_idproduct',
                setterName: 'setFklens_idproduct'
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
                model: 'WINK.model.User',
                associatedName: 'fkuser_iduser',
                foreignKey: 'user_iduser',
                primaryKey: 'id',
                getterName: 'getFkuser_iduser',
                setterName: 'setFkuser_iduser'
            }

,
            {
                model: 'WINK.model.Store',
                associatedName: 'fktostore_idstore',
                foreignKey: 'tostore_idstore',
                primaryKey: 'id',
                getterName: 'getFktostore_idstore',
                setterName: 'setFktostore_idstore'
            }

,
            {
                model: 'WINK.model.Supplier',
                associatedName: 'fktosupplier_idsupplier',
                foreignKey: 'tosupplier_idsupplier',
                primaryKey: 'id',
                getterName: 'getFktosupplier_idsupplier',
                setterName: 'setFktosupplier_idsupplier'
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
                model: 'WINK.model.Barcode',
                associatedName: 'fkframebarcode_idbarcode',
                foreignKey: 'framebarcode_idbarcode',
                primaryKey: 'id',
                getterName: 'getFkframebarcode_idbarcode',
                setterName: 'setFkframebarcode_idbarcode'
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
                model: 'WINK.model.RxOrderForm',
                associatedName: 'fkrxorderform_idrxorderform',
                foreignKey: 'rxorderform_idrxorderform',
                primaryKey: 'id',
                getterName: 'getFkrxorderform_idrxorderform',
                setterName: 'setFkrxorderform_idrxorderform'
            }

,
            {
                model: 'WINK.model.Patient',
                associatedName: 'fktopatient_idpatient',
                foreignKey: 'topatient_idpatient',
                primaryKey: 'id',
                getterName: 'getFktopatient_idpatient',
                setterName: 'setFktopatient_idpatient'
            }

,
            {
                model: 'WINK.model.User',
                associatedName: 'fkonlineorderrequesteduser_iduser',
                foreignKey: 'onlineorderrequesteduser_iduser',
                primaryKey: 'id',
                getterName: 'getFkonlineorderrequesteduser_iduser',
                setterName: 'setFkonlineorderrequesteduser_iduser'
            }

,
            {
                model: 'WINK.model.User',
                associatedName: 'fkemailorderrequesteduser_iduser',
                foreignKey: 'emailorderrequesteduser_iduser',
                primaryKey: 'id',
                getterName: 'getFkemailorderrequesteduser_iduser',
                setterName: 'setFkemailorderrequesteduser_iduser'
            }

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.RxOrderForm',
                name: 'rxorderforms_rxorderform_idrxorderform',
                foreignKey: 'rxorderform_idrxorderform',
                associationKey: 'rxorderforms_rxorderform_idrxorderform',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'r_sph', max: 45,min:0 }
,
 { type: 'length', field: 'supplierreference', max: 45,min:0 }
,
 { type: 'length', field: 'l_sph', max: 45,min:0 }
,
 { type: 'length', field: 'framebrand', max: 45,min:0 }
,
 { type: 'length', field: 'framemodel', max: 45,min:0 }
,
 { type: 'length', field: 'framecolor', max: 45,min:0 }
,
 { type: 'length', field: 'framea', max: 45,min:0 }
,
 { type: 'length', field: 'frameb', max: 45,min:0 }
,
 { type: 'length', field: 'frameed', max: 45,min:0 }
,
 { type: 'length', field: 'framedbl', max: 45,min:0 }
,
 { type: 'length', field: 'reference', max: 45,min:0 }
,
 { type: 'length', field: 'tracingnumber', max: 45,min:0 }
,
 { type: 'length', field: 'reasonforredocomment', max: 100,min:0 }
,
 { type: 'length', field: 'supplierinvoice', max: 45,min:0 }
,
 { type: 'length', field: 'originalinvoicenumber', max: 45,min:0 }
]    
}
});
