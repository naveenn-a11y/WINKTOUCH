Ext.define('WINK.model.AppointmentType',{
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
    url: WINK.Utilities.getRestURL() + 'appointmenttypes'
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
,
{ name: 'name_fr'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'name_sp'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'name_it'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'version'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'inactive'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'canbebookedonline'
, type:'boolean'
 ,defaultValue: true
}
,
{ name: 'numberofslotsnew'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'numberofslotsreturning'
, type:'int'
 ,defaultValue: 0
}
        ]

 ,belongsTo: [

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.Appointment',
                name: 'appointment',
                foreignKey: 'appointmenttypes_idappointmenttypes',
                primaryKey: 'id'
            }

,
            {
                model: 'WINK.model.Appointment',
                name: 'appointment',
                foreignKey: 'initialappointmenttypes_idappointmenttypes',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'name', max: 45,min:0 }
,
 { type: 'length', field: 'name_fr', max: 45,min:0 }
,
 { type: 'length', field: 'name_sp', max: 45,min:0 }
,
 { type: 'length', field: 'name_it', max: 45,min:0 }
]    
}
});
