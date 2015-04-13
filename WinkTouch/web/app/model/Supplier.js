Ext.define('WINK.model.Supplier',{
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
    url: WINK.Utilities.getRestURL() + 'suppliers'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'povonlineid'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'name'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'maincontact'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'address1'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'address2'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'city'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'province'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'postalcode'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'tel1'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'tel2'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'fax'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'tollfree'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'email'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'website'
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
{ name: 'taxnumber1'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'taxnumber2'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'cooppercentage'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'unit'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'country_idcountry'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'isinsuranceprovider'
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
{ name: 'isfinishinglab'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'issurfacinglab'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'iorderdriver'
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

            {
                model: 'WINK.model.Country',
                associatedName: 'fkcountry_idcountry',
                foreignKey: 'country_idcountry',
                primaryKey: 'id',
                getterName: 'getFkcountry_idcountry',
                setterName: 'setFkcountry_idcountry'
            }

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.Store',
                name: 'store',
                foreignKey: 'edgeatsupplier_idsupplier',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Product',
                name: 'product',
                foreignKey: 'preferredsupplier_idsupplier',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Product',
                name: 'product',
                foreignKey: 'manufacturersupplier_idsupplier',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientPayment',
                name: 'patientpayment',
                foreignKey: 'paidbyinsurancesupplier_idsupplier',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoice',
                name: 'patientinvoice',
                foreignKey: 'insurance1_idsupplier',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoice',
                name: 'patientinvoice',
                foreignKey: 'insurance2_idsupplier',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'name', max: 45,min:0 }
,
 { type: 'length', field: 'maincontact', max: 150,min:0 }
,
 { type: 'length', field: 'address1', max: 150,min:0 }
,
 { type: 'length', field: 'address2', max: 150,min:0 }
,
 { type: 'length', field: 'city', max: 45,min:0 }
,
 { type: 'length', field: 'province', max: 45,min:0 }
,
 { type: 'length', field: 'postalcode', max: 45,min:0 }
,
 { type: 'length', field: 'tel1', max: 45,min:0 }
,
 { type: 'length', field: 'tel2', max: 45,min:0 }
,
 { type: 'length', field: 'fax', max: 45,min:0 }
,
 { type: 'length', field: 'tollfree', max: 45,min:0 }
,
 { type: 'length', field: 'email', max: 45,min:0 }
,
 { type: 'length', field: 'website', max: 150,min:0 }
,
 { type: 'length', field: 'taxnumber1', max: 45,min:0 }
,
 { type: 'length', field: 'taxnumber2', max: 45,min:0 }
,
 { type: 'length', field: 'unit', max: 45,min:0 }
,
 { type: 'length', field: 'iorderdriver', max: 300,min:0 }
,
 { type: 'length', field: 'reference1', max: 45,min:0 }
,
 { type: 'length', field: 'reference2', max: 45,min:0 }
]    
}
});
