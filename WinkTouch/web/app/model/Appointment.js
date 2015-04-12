Ext.define('WINK.model.Appointment', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Field',
        'WINK.Utilities'    ],

    config: {

proxy: {
    type: 'rest',
    url: WINK.Utilities.getRestURL() + 'appointments'
  },
        fields: [

{ name: 'id'
, type:'int'
 ,defaultValue: 0
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
 ,defaultValue: 0
}
,
{ name: 'doctor_idpatient'
, type:'int'
 ,defaultValue: 0
}
,
{ name: 'patient_idpatient'
, type:'int'
 ,defaultValue: 0
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
 ,defaultValue: 0
}
,
{ name: 'initialappointmenttypes_idappointmenttypes'
, type:'int'
 ,defaultValue: 0
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
 ,defaultValue: 0
}
,
{ name: 'doublebooked'
, type:'boolean'
 ,defaultValue: false
}
        ]

,validations: [
 { type: 'length', field: 'googleeventid', max: 300,min:0 }
]    
}
});
