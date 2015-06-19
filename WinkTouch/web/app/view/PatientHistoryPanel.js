/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


Ext.define('WINK.view.PatientHistoryPanel', {
    extend: 'Ext.Panel',
    alias: 'widget.PatientHistoryPanel',
    requires: [
        'Ext.tab.Panel',
        'Ext.field.Text',
        'Ext.Button',
        'Ext.SegmentedButton',
        'Ext.Label',
        'Ext.tab.Bar',
        'Ext.Panel',
        'WINK.store.PatientHistoryStore'
    ],
    newPhoto: function() {

    },
    newAttachment: function() {

    },
    newInvoice: function() {
        var historyStore = this.getHistoryList().getStore();
        var item = Ext.create('WINK.model.PatientInvoice');
        WINK.Utilities.setDefaultValues(item);
        item.set('patient_idpatient', this.patient.get('id'));
        this.patient.patientinvoices_patient_idpatient().add(item);
        console.log('New Invoice ID:' + item.get('id'));
        var invoiceItem = Ext.create('WINK.model.PatientHistoryTree', {
            type: 4,
            modelid: item.get('id'),
            label: item.get('orderdate').getFullYear() + '-' + (item.get('orderdate').getMonth() + 1) + "-" + item.get('orderdate').getDate(),
            icon: '',
            date: item.get('orderdate')
        });
        historyStore.add(invoiceItem);
        this.openHistoryItem(invoiceItem);

    },
    updateInvoiceId: function(previousInvoiceId, newInvoice) {
        var newInvoiceId = newInvoice.get('id');
        var invoiceHistoryStore = this.patient.patientinvoices_patient_idpatient();
        var oldInvoiceModel = invoiceHistoryStore.getById(previousInvoiceId);
        if (oldInvoiceModel)
            invoiceHistoryStore.remove(oldInvoiceModel);
        invoiceHistoryStore.add(newInvoice);
        var historyStore = this.getHistoryList().getStore();
        historyStore.each(function(item, index, length) {
            if ((item.get('type') === 4 || item.get('type') === 5))
                if (item.get('modelid') === previousInvoiceId)
                {
                    item.set('modelid', newInvoiceId);
                }
        }, this);
        if (!this['invoicePanels' + previousInvoiceId.toString()]) {
            this['invoicePanels' + newInvoiceId.toString()] = this['invoicePanels' + previousInvoiceId.toString()];
            this['invoicePanels' + previousInvoiceId.toString()] = null;
        }

    },
    updateInvoiceHistoryItem: function(historyItem, invoiceModel) {
        var type = 4;
        if (invoiceModel.get('delivereddate'))
            type = 5;
        historyItem.set('type', type);
        historyItem.set('label', invoiceModel.get('orderdate').getFullYear() + '-' + (invoiceModel.get('orderdate').getMonth() + 1) + "-" + invoiceModel.get('orderdate').getDate());
        historyItem.set('date', invoiceModel.get('orderdate'));
        historyItem.set('modelid', invoiceModel.get('id'));

    },
    invoiceSaved: function(invoicePanel) {
        var historyStore = this.getHistoryList().getStore();
        var invoiceId = invoicePanel.getRecord().get('id');
        var invoice = invoicePanel.getRecord();
        console.log('invoiceSaved:' + invoiceId);
        historyStore.each(function(item, index, length) {
            if ((item.get('type') === 4 || item.get('type') === 5) && item.get('modelid') === invoiceId)
            {
                this.updateInvoiceHistoryItem(item, invoice);
            }
        }, this);
        historyStore.sortHistory();
    },
    newExam: function() {

    },
    saveClicked: function() {
        if (this.patientView)
        {
            this.patientView.savePatient();
        }
    },
    loadPatient: function(patient) {
        console.log('PatientHistoryPanel.loadPatient()' + patient.get('id'));
        this.patient = patient;
        var toolbar = this.down('toolbar');
        toolbar.setTitle(patient.get('lastname') + " " + patient.get('firstname'));

        var invoicesStore = patient.patientinvoices_patient_idpatient();

        invoicesStore.load({
            scope: this,
            callback: function(records, operation, success) {
                console.log('Loaded invoices ');
                this.loadPatientHistoryStore();
            }
        });


    },
    getHistoryList: function() {
        return this.down('list');
    },
    loadPatientHistoryStore: function() {
        var patient = this.patient;
        console.log('PatientHistoryPanel.loadPatientHistoryStore()' + patient.get('id'));

        var invoicesStore = patient.patientinvoices_patient_idpatient();
        var historyStore = Ext.create('WINK.store.PatientHistoryStore');
        var fullName = patient.get('lastname') + " " + patient.get('firstname');
        console.log('PatientHistoryPanel.loadPatientHistoryStore() fullname:' + fullName);

        this.getHistoryList().setStore(historyStore);


        var patientItem = Ext.create('WINK.model.PatientHistoryTree', {
            type: 0,
            modelid: patient.get('id'),
            label: fullName,
            icon: '',
            date: ''
        });


        historyStore.add(patientItem);

        {

            invoicesStore.each(function(item, index, length) {

                //until WINK Touch supports estimates, we hide them
                if (item.get('isestimate') === false) {
                    var invoiceItem = Ext.create('WINK.model.PatientHistoryTree');
                    this.updateInvoiceHistoryItem(invoiceItem, item);

                    historyStore.add(invoiceItem);
                }
            }, this);
        }
        historyStore.sortHistory();
        this.openHistoryItem(patientItem);
    },
    getEmailAddress: function(){
         if (this.patientView)
         {
             return this.patientView.getEmailAddress();
         }
         return this.patient.get('email');
    },
    openHistoryItem: function(record) {
        this.setMasked(true);
        var patient = this.patient;
        var list = this.getHistoryList();
        var type = record.get('type');
        var id = record.get('modelid');
        console.log('PatientHistoryPanel.openHistoryItem()' + type + "." + id);


        list.select(record, false, true);
        var myContainer = this.down('container[winkname=patientmaincontainer]');

        if (type === 0) {
            var justLoaded = false;
            if (!this.patientView)
            {
                this.patientView = Ext.create('WINK.view.PatientPanel');
                this.patientView.down('toolbar').hide();
                justLoaded = true;
            }
            myContainer.setActiveItem(this.patientView);
            if (justLoaded === true)
            {
                this.patientView.setRecord(patient); //has to run after myContainer.activate event
            }
        } else if ((type === 4) || (type === 5)) {
            var patientView = null;
            var justLoaded = false;
            if (!this['invoicePanels' + id.toString()])
            {
                patientView = Ext.create('WINK.view.InvoicePanel');
                this['invoicePanels' + id.toString()] = patientView;
                justLoaded = true;
            } else {
                patientView = this['invoicePanels' + id.toString()];
            }
            myContainer.setActiveItem(patientView);
            if (justLoaded) {
                var patientInvoiceModel = patient.patientinvoices_patient_idpatient().getById(id);
 this['invoicePanels' + id.toString()].setPatientHistoryPanel(this);
                this['invoicePanels' + id.toString()].loadPatientInvoice(patientInvoiceModel);
            }
        }



        this.unmask();
    },
    config: {
        listeners: {
            activate: {
                scope: this,
                fn: function() {


                }

            }
        },
        scrollable: false,
        layout: 'hbox',
        masked: true,
        items: [
            {
                docked: 'top',
                xtype: 'toolbar',
                title: 'Loading Patient...',
                items: [
                    {
                        text: 'Back',
                        ui: 'back',
                        action: 'goBack'
                    },
                    {
                        xtype: 'spacer'
                    },
                    {
                        text: 'New',
                        ui: 'confirm',
                        listeners: {
                            tap: function(c) {

                                var myOverlay = Ext.create('Ext.Panel', {
                                    modal: true,
                                    winkname: 'newoverlay',
                                    hideOnMaskTap: true,
                                    showAnimation: {
                                        type: 'popIn',
                                        duration: 250,
                                       easing: 'ease-in',
                                       out: false
                                    },
                                    width: '200px',
                                    height: '300px',
                                    scrollable: true,
                                    layout: 'vbox',
                                    items: [
                                        {
                                            docked: 'top',
                                            xtype: 'toolbar',
                                            title: 'New'
                                        },
                                        {
                                            xtype: 'list',
                                            indexBar: false,
                                            grouped: false,
                                            pinHeaders: true,
                                            flex: 1,
                                            itemTpl: '{title}',
                                            data: [
                                                // {title: 'Exam'},
                                                {title: 'Invoice'},
                                                // {title: 'Attachment'},
                                                // {title: 'Photo'}
                                            ],
                                            listeners: {
                                                itemtap: function(dataview, index, target, record, e, eOpts) {
                                                    dataview.up("panel[winkname=newoverlay]").hide();
                                                    var historyPanel = Ext.ComponentQuery.query('PatientHistoryPanel')[0];
                                                    if (index === 0)
                                                    {
                                                        historyPanel.newInvoice();
                                                        //historyPanel.newExam();
                                                    } else if (index === 1) {

                                                        //historyPanel.newInvoice();
                                                    } else if (index === 2) {

                                                        historyPanel.newAttachment();

                                                    } else if (index === 3) {

                                                        historyPanel.newPhoto();


                                                    }
                                                }
                                            }

                                        }
                                    ]


                                });
                                
                                myOverlay.showBy(c);
                            }
                        }
                    },
                    {
                        text: 'Save',
                        ui: 'action',
                        listeners: {
                            tap: function(c) {
                                c.up('PatientHistoryPanel').saveClicked();

                            }
                        }
                    }
                ]

            },
            {
                xtype: 'list',
                width: '200px',
                indexBar: false,
                grouped: true,
                pinHeaders: true,
                itemTpl: '{label}',
                border: '0 1 0 0',
                style: 'border-style:solid; border-color: darkgrey;',
                listeners: {
                    itemtap: function(dataview, index, target, record, e, eOpts) {
                        dataview.up('PatientHistoryPanel').openHistoryItem(record);
                    }
                }
            },
            {
                xtype: 'container',
                flex: 1,
                layout: {
                    type: 'card',
                    animation: 'slide'
                },
                winkname: 'patientmaincontainer'
            }
        ]

    }



});