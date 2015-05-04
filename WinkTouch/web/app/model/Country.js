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
    url: WINK.Utilities.getRestURL() + 'countries',
            withCredentials: true,
            useDefaultXhrHeader: false,
            cors: true  },
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
        ]

 ,belongsTo: [

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.Store',
                name: 'stores_country_idcountry',
                foreignKey: 'country_idcountry',
                associationKey: 'stores_country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.CountrySubdivision',
                name: 'countrysubdivisions_country_idcountry',
                foreignKey: 'country_idcountry',
                associationKey: 'countrysubdivisions_country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.User',
                name: 'users_country_idcountry',
                foreignKey: 'country_idcountry',
                associationKey: 'users_country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Patient',
                name: 'patients_country_idcountry',
                foreignKey: 'country_idcountry',
                associationKey: 'patients_country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.PatientInvoice',
                name: 'patientinvoices_country_idcountry',
                foreignKey: 'country_idcountry',
                associationKey: 'patientinvoices_country_idcountry',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Supplier',
                name: 'suppliers_country_idcountry',
                foreignKey: 'country_idcountry',
                associationKey: 'suppliers_country_idcountry',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'name', max: 45,min:0 }
]    
}
});
