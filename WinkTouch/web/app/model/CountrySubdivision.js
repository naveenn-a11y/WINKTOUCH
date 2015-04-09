Ext.define('WINK.model.CountrySubdivision', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Field'
    ],

    config: {
        fields: [

{ name: 'idcountrysubdivision'}
,
{ name: 'country_idcountry'}
,
{ name: 'name'}
        ]
    }
});
