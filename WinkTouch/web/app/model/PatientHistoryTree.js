

Ext.define('WINK.model.PatientHistoryTree', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.association.HasMany'
    ],
    uses: [
        
    ],

    config: {
        fields: [
            {
                name: 'modelid'
            },
            {
                name: 'icon'
            },
            {
                name: 'label',
                type: 'string'
            },
            {
                name: 'date',
                type: 'date'
            },
            {
                name: 'type',
                type: 'int' //0 is the patient details,1 is exams, 2 is appointments, 3 is photo booth,  4 is an open job, 5 is a closed job
            }
        ]
        
    }
});