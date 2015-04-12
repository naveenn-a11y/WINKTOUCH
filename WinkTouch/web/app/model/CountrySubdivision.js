Ext.define('WINK.model.CountrySubdivision', {
    extend: 'Ext.data.Model',
    requires: [
        'Ext.data.Field',
        'WINK.Utilities'],
    config: {
        fields: [
            {name: 'id'
                , type: 'int'
                , defaultValue: 0
            }
            ,
            {name: 'country_idcountry'
                , type: 'int'
                , defaultValue: 0
            }
            ,
            {name: 'name'
                , type: 'string'
                , defaultValue: ''
            }
        ]

    }
});
