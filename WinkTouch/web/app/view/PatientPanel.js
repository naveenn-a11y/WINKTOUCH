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
        'WINK.view.MonthPickerFormField',
        'WINK.store.CountrySubdivisionStore',
        'WINK.store.CountryStore',
        'WINK.model.Patient'
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
    initProvinceStore: function(obj, options) {
        console.log("PatientPanel.initProvinceStore()");
        var countrySelect = this.down("selectfield[name=country_idcountry]");
        var subdivisionSelect = this.down("selectfield[name=province_select]");
        var subdivisionText = this.down("textfield[name=province]");

        var subdivisionStore = subdivisionSelect.getStore();
        var mainSubdivisionStore = Ext.getStore('CountrySubdivisionStore');
        mainSubdivisionStore.clearFilter();
        subdivisionStore.loadData(mainSubdivisionStore.getRange(), false);

    },
    updateProvinces: function(obj, options) {
        console.log("PatientPanel.updateProvinces()");
        var countrySelect = this.down("selectfield[name=country_idcountry]");
        var subdivisionSelect = this.down("selectfield[name=province_select]");
        var subdivisionText = this.down("textfield[name=province]");
        var selectedCountryId = countrySelect.getValue();
        var subdivisionStore = subdivisionSelect.getStore();
        subdivisionStore.clearFilter();
        subdivisionStore.filter("country_idcountry", selectedCountryId);
        if (subdivisionStore.getData().length === 0)
        {
            subdivisionText.show();
            subdivisionSelect.hide();
        } else {
            subdivisionText.hide();
            subdivisionSelect.show();
        }
    },
    config: {
        centered: false,
        modal: false,
        scrollable: 'vertical',
        listeners: {
            activate: function(value, options) {
                value.initProvinceStore();
                value.updateProvinces();
                var newPatient = new WINK.model.Patient();
                this.setRecord(newPatient);
            }

        },
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
                                name: 'sex',
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
                                placeHolder: 'email@example.com',
                                name: 'email'

                            },
                            {
                                xtype: 'textfield',
                                label: 'Home',
                                name: 'home'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Cell',
                                name: 'cell'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Work',
                                name: 'work'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Fax',
                                name: 'fax'
                            }
                        ]
                    },
                    {
                        xtype: 'fieldset',
                        title: 'Address',
                        items: [
                            {
                                xtype: 'textfield',
                                label: 'Civic Number',
                                name: 'address1'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Unit',
                                name: 'unit'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Street Name',
                                name: 'address2'
                            },
                            {
                                xtype: 'textfield',
                                label: 'City',
                                name: 'city'
                            },
                            {
                                xtype: 'selectfield',
                                label: 'Country',
                                name: 'country_idcountry',
                                required: true,
                                displayField: 'name',
                                store: 'CountryStore',
                                usePicker: true,
                                valueField: 'idcountry',
                                listeners: {
                                    change: function(field, value) {

                                        field.up('PatientPanel').updateProvinces();
                                    }
                                }


                            },
                            {
                                xtype: 'selectfield',
                                label: 'Province/St',
                                name: 'province_select',
                                required: true,
                                displayField: 'name',
                                store: Ext.create('WINK.store.CountrySubdivisionStore',
                                        {
                                            autoLoad: false
                                        }),
                                usePicker: true,
                                valueField: 'idcountrysubdivision',
                                listeners: {
                                    change: function(field, value) {
                                        var provinceText = field.up('PatientPanel').down("textfield[name=province]");

                                        console.log('country selection changed ');
                                        if (field.getRecord())
                                        {
                                            value = field.getRecord().get(field.getDisplayField());

                                            console.log('country selection changed to ' + value);
                                            provinceText.setValue(value);
                                        } else {
                                            
                                            console.log('country selection clear');
                                            provinceText.setValue("");
                                        }
                                    }
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'Province/St',
                                name: 'province',
                                hidden: false
                            },
                            {
                                xtype: 'textfield',
                                label: 'Postal/Zip',
                                name: 'postalcode'
                            }
                        ]
                    },
                    {
                        xtype: 'fieldset',
                        title: 'Identification',
                        items: [
                            {
                                xtype: 'textfield',
                                label: 'Medical Card',
                                name: 'medialcard'
                            },
                            {
                                xtype: 'monthpickerfield',
                                label: 'Medical Card Expiry',
                                slotOrder: ['month', 'year'],
                                format: 'F Y',
                                name: 'medialcardexpiry'
                            },
                            {
                                xtype: 'textfield',
                                label: 'SIN',
                                name: 'sin'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Driver\'s License',
                                name: 'drivers'
                            }
                        ]
                    }
                ]
            }
        ]
    }


});
