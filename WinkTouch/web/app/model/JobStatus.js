Ext.define('WINK.model.JobStatus',{
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
    url: WINK.Utilities.getRestURL() + 'jobstatuses'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'rxorderform_idrxorderform'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'rxworksheet_idrxworksheet'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'clworksheet_idclworksheet'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'patientinvoice_idpatientinvoice'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'user_iduser'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'date'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'status'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'supplier_idsupplier'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'shipment_idshipment'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'store_idstore'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'remiderdate'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'comment'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'sharewithpatient'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'reminderemailsenton'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'workflowstages_idworkflowstages'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'datecompletedon'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'holdreasons_idholdreasons'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'inactive'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'extusername'
, type:'string'
 ,defaultValue: ''
}
        ]

 ,belongsTo: [

        ] 
 ,hasMany: [

        ] 
,validations: [
 { type: 'length', field: 'comment', max: 200,min:0 }
,
 { type: 'length', field: 'extusername', max: 45,min:0 }
]    
}
});
