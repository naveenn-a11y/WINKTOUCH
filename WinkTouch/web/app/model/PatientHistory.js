

Ext.define('WINK.model.PatientHistory', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.association.HasMany'
    ],
    uses: [
        
    ],

    config: {
        fields: [
            {
                name: 'Label'
            },
            {
                name: 'Icon'
            },
            {
                name: 'Date',
                type: 'date'
            },
            {
                name: 'Type',
                type: 'int' //0 is the patient details,1 is exams, 2 is appointments, 3 is photo booth,  4 is an open job, 5 is a closed job
            },
            {
                allowNull: false,
                name: 'ID',
                type: 'int'
            }
        ]
        
    }
});