Ext.define('WINK.view.PatientPanel', {
    extend: 'Ext.Panel',
    alias: 'widget.PatientPanel',
    requires: [
        'Ext.TitleBar',
        'Ext.form.FieldSet',
        'Ext.field.Select',
        'Ext.field.Email',
        'Ext.field.Password',
        'Ext.Button',
        'WINK.view.MonthPickerFormField'
    ],
    config: {
        centered: false,
        modal: false,
        scrollable: 'vertical',
        items: [
            {
                xtype: 'toolbar',
                docked: 'top',
                title: 'New Patient',
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
                        text: 'Save',
                        ui: 'action',
                        listeners: {
                            tap: function(c) {

                                alert('save');

                            }
                        }
                    }
                ]

            },
            {
                xtype: 'container',
                items: [
                    {
                        xtype: 'fieldset',
                        title: 'Patient',
                        items: [
                            {
                                xtype: 'textfield',
                                label: 'First Name'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Last Name'
                            },
                            {
                                xtype: 'selectfield',
                                label: 'Gender',
                                options: [
                                    {text: 'Male', value: 'Male'},
                                    {text: 'Female', value: 'Female'}
                                ]
                            },
                            {
                                xtype: 'datepickerfield',
                                label: 'DOB',
                                placeHolder: 'mm/dd/yyyy'
                            }
                        ]
                    },
                    {
                        xtype: 'fieldset',
                        title: 'Contact ',
                        items: [
                            {
                                xtype: 'emailfield',
                                label: 'Email',
                                placeHolder: 'email@example.com'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Home'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Cell'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Work'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Fax'
                            }
                        ]
                    },
                    {
                        xtype: 'fieldset',
                        title: 'Address',
                        items: [
                            {
                                xtype: 'textfield',
                                label: 'Civic Number'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Unit'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Street Name'
                            },
                            {
                                xtype: 'textfield',
                                label: 'City'
                            },
                            {
                                xtype: 'selectfield',
                                label: 'Country'
                            },
                            {
                                xtype: 'selectfield',
                                label: 'Province/St'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Postal/Zip'
                            }
                        ]
                    },
                    {
                        xtype: 'fieldset',
                        title: 'Identification',
                        items: [
                            {
                                xtype: 'textfield',
                                label: 'Medical Card'
                            },
                            {
                                xtype: 'monthpickerfield',
                                label: 'Medical Card Expiry',
                                slotOrder: ['month', 'year'],
                                format: 'F Y'
                            },
                            {
                                xtype: 'textfield',
                                label: 'SIN'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Driver\'s License'
                            }
                        ]
                    }
                ]
            }
        ]
    }


});
