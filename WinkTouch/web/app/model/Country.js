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
                name: 'stores',
                foreignKey: 'country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.CountrySubdivision',
                name: 'countrysubdivisions',
                foreignKey: 'country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.User',
                name: 'users',
                foreignKey: 'country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Patient',
                name: 'patients',
                foreignKey: 'country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoice',
                name: 'patientinvoices',
                foreignKey: 'country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Supplier',
                name: 'suppliers',
                foreignKey: 'country_idcountry',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'name', max: 45,min:0 }
]    
}
});
