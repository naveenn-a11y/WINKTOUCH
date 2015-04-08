Ext.define('WINK.view.PatientPanel', {
    extend: 'Ext.form.Panel',
    alias: 'widget.PatientPanel',
    requires: [
        'Ext.TitleBar',
        'Ext.form.FieldSet',
        'Ext.form.Panel',
        'Ext.field.Select',
        'Ext.field.Email',
        'Ext.field.Password',
        'Ext.Button',
        'WINK.view.MonthPickerFormField'
    ],
    addPatient: function(bnt) {
        var formPanel = this;
        WINK.Utilities.showWorking();

        Ext.Ajax.request({
            url: WINK.Utilities.getRestURL() + 'patients',
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            params: Ext.JSON.encode(formPanel.getValues()),
            success: function(response) {
                alert('added');
                WINK.Utilities.hideWorking();
            },
            failure: function(response) {

                WINK.Utilities.hideWorking();

                WINK.Utilities.showAjaxError('Add Patient', response);
            },
            callback: function(options, success, response) {


            }

        });
    },
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
                        handler: function(btn) {
                            btn.up('.PatientPanel').addPatient(btn);

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
                                label: 'First Name',
                                name: 'firstname'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Last Name',
                                name: 'lastname'
                            },
                            {
                                xtype: 'selectfield',
                                label: 'Gender',
                                name: 'ismale',
                                options: [
                                    {text: 'Male', value: false},
                                    {text: 'Female', value: true}
                                ]
                            },
                            {
                                xtype: 'datepickerfield',
                                label: 'DOB',
                                placeHolder: 'mm/dd/yyyy',
                                name: 'dob'
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
