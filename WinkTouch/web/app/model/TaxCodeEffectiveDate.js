Ext.define('WINK.model.TaxCodeEffectiveDate', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Field',
        'WINK.Utilities'    ],

    config: {

proxy: {
    type: 'rest',
    url: WINK.Utilities.getRestURL() + 'taxcodeeffectivedates'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'taxcode_idtaxcode'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'tax1percentage'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'tax2percentage'
, type:'float'
 ,defaultValue: 0.0
}
,
{ name: 'piggyback'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'effectivedate'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'povonlineid'
, type:'int'
 ,defaultValue: 0
}
        ]

,validations: [
]    
}
});
