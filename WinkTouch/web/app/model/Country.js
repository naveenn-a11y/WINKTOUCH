Ext.define('WINK.model.Country',{
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
    url: WINK.Utilities.getRestURL() + 'countries'
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
        ]

 ,belongsTo: [

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.Store',
                name: 'store',
                foreignKey: 'country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.CountrySubdivision',
                name: 'countrysubdivision',
                foreignKey: 'country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.User',
                name: 'user',
                foreignKey: 'country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Patient',
                name: 'patient',
                foreignKey: 'country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoice',
                name: 'patientinvoice',
                foreignKey: 'country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Supplier',
                name: 'supplier',
                foreignKey: 'country_idcountry',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'name', max: 45,min:0 }
]    
}
});
