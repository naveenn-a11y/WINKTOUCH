Ext.define('WINK.model.Patienthistory', {
    extend: 'Ext.data.Model',
    requires: [
        'Ext.data.association.HasMany',
        'Ext.data.association.HasOne',
        'Ext.data.Field',
        'WINK.model.PatientInvoice',
        'WINK.model.Patient',
        'WINK.Utilities'
    ],
    config: {
        proxy: {
            type: 'rest',
            url: WINK.Utilities.getRestURL() + 'patient/history'
        },
        fields: [
            {
                name: 'id',
                type: 'int'
            }
        ],
        hasOne: [
            {
                model: 'WINK.model.Patient',
                name: 'patient',
                foreignKey: 'id',
                primaryKey: 'id'
            }
        ],
        hasMany: [
            {
                model: 'WINK.model.PatientInvoice',
                name: 'invoices',
                foreignKey: 'patient_idpatient',
                primaryKey: 'id'
            }
        ]
    }

});