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
    loadPatient: function(patient) {
        console.log('PatientHistoryPanel.loadPatient()' + patient.get('id'));
        this.patient = patient;
        var toolbar = this.down('toolbar');
        toolbar.setTitle(patient.get('lastname') + " " + patient.get('firstname'));

        var invoicesStore = patient.patientinvoices();

        invoicesStore.load({
            scope: this,
            callback: function(records, operation, success) {
                console.log('Loaded invoices ');
                this.loadPatientHistoryStore();
            }
        });


    },
    loadPatientHistoryStore: function() {
        var patient = this.patient;
        console.log('PatientHistoryPanel.loadPatientHistoryStore()' + patient.get('id'));

        var invoicesStore = patient.patientinvoices();
        var historyStore = Ext.create('WINK.store.PatientHistoryStore');
        var fullName = patient.get('lastname') + " " + patient.get('firstname');
        console.log('PatientHistoryPanel.loadPatientHistoryStore() fullname:' + fullName);

        this.down('list').setStore(historyStore);

        {
            var patientItem = Ext.create('WINK.model.PatientHistoryTree', {
                type: 0,
                id: patient.get('id'),
                label: fullName,
                icon: '',
                date: ''
            });


            historyStore.add(patientItem);
        }
        {

            invoicesStore.each(function(item, index, length) {
                var type = 4;
                if (item.get('delivereddate'))
                    type = 5;
                var invoiceItem = Ext.create('WINK.model.PatientHistoryTree', {
                    type: type,
                    id: item.get('id'),
                    label: item.get('orderdate').getFullYear() + '-' + item.get('orderdate').getMonth() + "-" + item.get('orderdate').getDate(),
                    icon: '',
                    date: item.get('orderdate')
                });
                historyStore.add(invoiceItem);
            }, this);
        }




        this.unmask();
    },
    openHistoryItem: function(record) {
        this.setMasked(true);
        var patient = this.patient;
        var type = record.get('type');
        var id = record.get('id');
        console.log('PatientHistoryPanel.openHistoryItem()' + type + "." + id);

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
            var patientView = Ext.create('WINK.view.InvoicePanel');
            myContainer.setActiveItem(patientView);
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
                        action: 'goToMainScreen'
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
                                    hideOnMaskTap: true,
                                    showAnimation: {
                                        type: 'popIn',
                                        duration: 250,
                                        easing: 'ease-out'
                                    },
                                    hideAnimation: {
                                        type: 'popOut',
                                        easing: 'ease-out',
                                        duration: 250
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
                                                {title: 'Exam'},
                                                {title: 'Invoice'},
                                                {title: 'Attachment'},
                                                {title: 'Photo'}
                                            ]

                                        }
                                    ]


                                });
                                Ext.Viewport.add(myOverlay);
                                myOverlay.showBy(c);
                            }
                        }
                    },
                    {
                        text: 'Open',
                        ui: 'forward',
                        listeners: {
                            tap: function(c) {

                                alert('Open');
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
                layout: 'card',
                winkname: 'patientmaincontainer'
            }
        ]

    }



});