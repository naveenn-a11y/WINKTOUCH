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
                        action : 'doNewPatient'
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
                xtype: 'formpanel',
                scrollable: true,
                width: '250px',
                id: 'FindPatientForm',
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
                                name: "Name",
                                label: "Name"
                            },
                            {
                                xtype: "textfield",
                                name: "Phone",
                                label: "Phone Number"
                            },
                            {
                                xtype: "textfield",
                                name: "MedicalCard",
                                label: "Medical Card"
                            },
                            {
                                xtype: "textfield",
                                name: "Email",
                                label: "EMail"
                            },
                            {
                                xtype: "textfield",
                                name: "Address",
                                label: "Address"
                            },
                            {
                                xtype: "datepickerfield",
                                name: "dob",
                                label: "Date of Birth"
                            },
                            {
                                xtype: "textfield",
                                name: "Frame",
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
                                name: "WinkFile",
                                label: "Wink File (R/O/I/Z/S)"
                            },
                            {
                                xtype: "textfield",
                                name: "PatientFolder",
                                label: "Patient Folder"
                            },
                            {
                                xtype: "textfield",
                                name: "Tray",
                                label: "Tray"
                            }

                        ]
                    },
                    {
                        xtype: 'container',
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
                itemTpl: '{LastName} {FirstName}'
            }
        ]
    }
});