/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


Ext.define('WINK.model.JobStatusWrapper', {
    extend: 'Ext.data.Model',
    requires: [
        'Ext.data.Field',
        'Ext.data.association.HasMany',
        'Ext.data.association.HasOne',
        'Ext.data.association.BelongsTo',
        'WINK.Utilities',
        'WINK.model.JobStatus'

    ],
    config: {
        fields: [
            {
                name: 'date',
                type: 'date',
                dateFormat:'time'
            },
            {
                name: 'statusid',
                type: 'int'
            },
            {
                name: 'status',
                type: 'string'
            },
            {
                name: 'comment',
                type: 'string'
            },
            {
                name: 'user',
                type: 'string'
            },
            {
                name: 'jobstatus_idjobstatus',
                type: 'int'
            },
            {
                name: 'reference',
                type: 'string'
            }
        ],
        belongsTo: [
            {
                model: 'WINK.model.JobStatus',
                associatedName: 'fkjobstatus_idjobstatus',
                foreignKey: 'jobstatus_idjobstatus',
                primaryKey: 'id',
                getterName: 'getFkjobstatus_idjobstatus',
                setterName: 'setFkjobstatus_idjobstatus'
            }
            
        ],
        hasMany: [
        ]
    }
});