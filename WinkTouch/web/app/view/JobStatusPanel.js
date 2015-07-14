/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

Ext.define('WINK.view.JobStatusPanel', {
    extend: 'Ext.Panel',
    alias: 'widget.jobstatuspanel',
    requires: [
        'Ext.SegmentedButton',
        'Ext.Button',
        'Ext.field.Select',
        'Ext.field.Spinner',
        'Ext.dataview.DataView',
        'WINK.store.ProductStore',
        'WINK.model.BarcodeResponse',
        'WINK.model.Barcode',
        'WINK.model.Product'
    ],
    getStore: function() {
        if (!this.winkStore) {
            this.winkStore = Ext.create('WINK.store.JobStatusStore');
            this.down('dataview').setStore(this.winkStore);
        }
        return  this.winkStore;
    },
    loadStatusOnce: function() {
        console.log('JobStatusPanel loadStatusOnce()');
        if (!this.alreadyLoaded)
        {
            this.alreadyLoaded = true;
            this.setMasked(true);
            var invoicePanel = this.up('InvoicePanel');
            var patientInvoiceModel = invoicePanel.patientinvoice;
            console.log('Jobstatuspanel loadStatusOnce idpatientinvoice ' + patientInvoiceModel.get('id'));
            this.getStore().load({
                scope:this,
                params: {
                    idpatientinvoice: patientInvoiceModel.get('id')
                },
                callback: function(records, operation, success) {
                    console.log('loaded job status records');
                      this.setMasked(false);
                }
            });

        }

    },
    config: {
        layout: 'fit',
        items: [
            {
                xtype: 'list',
                indexBar: false,
                grouped: false,
                pinHeaders: false,
                itemTpl: '{date:date("Y-m-d H:i")} ({reference}) {user} {status} {comment}',
                listeners: {
                    itemtap: function(dataview, index, target, record, e, eOpts) {
                        //dataview.up('PatientHistoryPanel').openHistoryItem(record);
                    }
                }


            }
        ]
    }
});