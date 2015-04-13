Ext.define('WINK.view.FindPatientPanel', {
    extend: 'Ext.Panel',
    alias: 'widget.FindPatientPanel',
    requires: [
        'Ext.TitleBar',
        'Ext.form.FieldSet',
        'Ext.field.Select',
        'Ext.field.Email',
        'Ext.field.Password',
        'Ext.Button',
        'Ext.form.FormPanel',
        'WINK.view.MonthPickerFormField'
    ],
    config: {
        fullscreen: true,
        layout: 'hbox',
        id: 'FindPatientPanel',
        items: [
            {
                docked: 'top',
                xtype: 'toolbar',
                title: 'Find Patient',
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
                        action: 'doNewPatient'
                    },
                    {
                        text: 'Open',
                        ui: 'forward',
                        handler:function(btn){
                            btn.up('FindPatientPanel').openSelectedPatient(btn);
                        }
                    }
                ]

            },
            {
                xtype: 'container',
                width: '250px',
                scrollable: false,
                layout: 'vbox',
                items: [
                    {
                        xtype: 'formpanel',
                        scrollable: true,
                        id: 'FindPatientForm',
                        flex: 1,
                        items: [
                            {
                                xtype: 'fieldset',
                                title: 'Find Patient',
                                instructions: 'Please enter any of the fields above to find your patient',
                                defaults: {
                                    labelWidth: '35%',
                                    labelAlign: 'top'
                                },
                                items: [
                                    {
                                        xtype: "textfield",
                                        name: "name",
                                        label: "Name"
                                    },
                                    {
                                        xtype: "textfield",
                                        name: "phone",
                                        label: "Phone Number"
                                    },
                                    {
                                        xtype: "textfield",
                                        name: "medicalcard",
                                        label: "Medical Card"
                                    },
                                    {
                                        xtype: "textfield",
                                        name: "email",
                                        label: "EMail"
                                    },
                                    {
                                        xtype: "textfield",
                                        name: "address",
                                        label: "Address"
                                    },
                                    {
                                        xtype: "datepickerfield",
                                        name: "dob",
                                        label: "Date of Birth"
                                    },
                                    {
                                        xtype: "textfield",
                                        name: "frame",
                                        label: "Frame"
                                    }

                                ]
                            },
                            {
                                xtype: 'fieldset',
                                title: 'Quick Find',
                                // instructions: 'Please enter any of the fields above to find your patient',
                                defaults: {
                                    labelWidth: '35%',
                                    labelAlign: 'top'
                                },
                                items: [
                                    {
                                        xtype: "textfield",
                                        name: "winkfile",
                                        label: "Wink File (R/O/I/Z/S)"
                                    },
                                    {
                                        xtype: "textfield",
                                        name: "paperfile",
                                        label: "Patient Folder"
                                    },
                                    {
                                        xtype: "textfield",
                                        name: "tray",
                                        label: "Tray"
                                    }

                                ]
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        flex: 0,
                        height: "100px",
                        defaults: {
                            xtype: 'button',
                            flex: 1,
                            margin: '10px'
                        },
                        items: [
                            {
                                text: "Find",
                                ui: "confirm",
                                handler: function(btn) {
                                    Ext.getCmp('FindPatientPanel').findFunction(btn);
                                }
                            },
                            {
                                text: "Clear",
                                handler: function(btn) {
                                    Ext.getCmp('FindPatientForm').reset();
                                }
                            }
                        ]
                    }
                ]
            },
            {
                xtype: 'list',
                indexBar: true,
                grouped: true,
                pinHeaders: true,
                flex: 1,
                store: 'PatientStore',
                itemTpl: '{lastname} {firstname}'
            }
        ]
    },
    openSelectedPatient: function(btn){
        var list = this.down("list");
        if(list.getSelectionCount()>0)
        {
            var selectedPatient = list.getSelection()[0];
            window.location.href="#patient/"+selectedPatient.get('id');
                   
        }
    },
    findFunction: function(btn) {

        var FindPatientPanelThis = this;
        WINK.Utilities.showWorking();

        Ext.Ajax.request({
            url: WINK.Utilities.getRestURL() + 'patients/find',
            method: 'GET',
            form: 'FindPatientForm',
            params: {
                'limit': 100
            },
            success: function(response) {
                //console.log(response.responseText);
                FindPatientPanelThis.down('list').getStore().loadData(Ext.JSON.decode(response.responseText), false);
                WINK.Utilities.hideWorking();
            },
            failure: function(response) {

                WINK.Utilities.hideWorking();

                WINK.Utilities.showAjaxError('Find Patient', response);
            },
            callback: function(options, success, response) {


            }

        });
    }

});