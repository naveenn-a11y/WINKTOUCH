Ext.define('WINK.model.Appointment',{
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
    url: WINK.Utilities.getRestURL() + 'appointments',
            withCredentials: true,
            useDefaultXhrHeader: false,
            cors: true  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'fromold'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'toold'
, type:'date'
 ,defaultValue: null
}
,
{ name: 'status'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'comment'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'version'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'store_idstore'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'doctor_idpatient'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'patient_idpatient'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'isbusy'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'inactive'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'appointmenttypes_idappointmenttypes'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'initialappointmenttypes_idappointmenttypes'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'googlecalendarversion'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'outlookcalendarversion'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'maccalendarversion'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'googleeventid'
, type:'string'
 ,defaultValue: ''
}
,
{ name: 'fromdate'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'todate'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'ishistorical'
, type:'boolean'
 ,defaultValue: false
}
,
{ name: 'emailversion'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'emailsenton'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'smsversion'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'smssenton'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'emailconfirmationversion'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'emailconfirmationsenton'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'smsconfirmationversion'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'smsconfirmationsenton'
, type:'string'
 ,defaultValue: 0
}
,
{ name: 'appointments_idappointments'
, type:'int'
 ,defaultValue: null
}
,
{ name: 'doublebooked'
, type:'boolean'
 ,defaultValue: false
}
        ]

 ,belongsTo: [

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
                associatedName: 'fkdoctor_idpatient',
                foreignKey: 'doctor_idpatient',
                primaryKey: 'id',
                getterName: 'getFkdoctor_idpatient',
                setterName: 'setFkdoctor_idpatient'
            }

,
            {
                model: 'WINK.model.Patient',
                associatedName: 'fkpatient_idpatient',
                foreignKey: 'patient_idpatient',
                primaryKey: 'id',
                getterName: 'getFkpatient_idpatient',
                setterName: 'setFkpatient_idpatient'
            }

,
            {
                model: 'WINK.model.AppointmentType',
                associatedName: 'fkappointmenttypes_idappointmenttypes',
                foreignKey: 'appointmenttypes_idappointmenttypes',
                primaryKey: 'id',
                getterName: 'getFkappointmenttypes_idappointmenttypes',
                setterName: 'setFkappointmenttypes_idappointmenttypes'
            }

,
            {
                model: 'WINK.model.AppointmentType',
                associatedName: 'fkinitialappointmenttypes_idappointmenttypes',
                foreignKey: 'initialappointmenttypes_idappointmenttypes',
                primaryKey: 'id',
                getterName: 'getFkinitialappointmenttypes_idappointmenttypes',
                setterName: 'setFkinitialappointmenttypes_idappointmenttypes'
            }

,
            {
                model: 'WINK.model.Appointment',
                associatedName: 'fkappointments_idappointments',
                foreignKey: 'appointments_idappointments',
                primaryKey: 'id',
                getterName: 'getFkappointments_idappointments',
                setterName: 'setFkappointments_idappointments'
            }

        ] 
 ,hasMany: [

            {
                model: 'WINK.model.Appointment',
                name: 'appointments_appointments_idappointments',
                foreignKey: 'appointments_idappointments',
                associationKey: 'appointments_appointments_idappointments',
                primaryKey: 'id'
            }

        ] 
,validations: [
 { type: 'length', field: 'googleeventid', max: 300,min:0 }
]    
}
});
