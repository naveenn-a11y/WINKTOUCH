Ext.define('WINK.view.PatientPanel', {
    extend: 'Ext.form.Panel',
    alias: 'widget.PatientPanel',
    requires: [
        'WINK.model.Patient',
        'WINK.model.CountrySubdivision',
        'WINK.model.Country',
        'WINK.store.CountrySubdivisionStore',
        'WINK.store.CountryStore',
        'WINK.view.MonthPickerFormField',
        'WINK.view.DatePickerToolbar',
        'WINK.view.PhoneField',
        'Ext.TitleBar',
        'Ext.form.FieldSet',
        'Ext.form.Panel',
        'Ext.field.Select',
        'Ext.field.Email',
        'Ext.field.Password',
        'Ext.Button'
    ],
    patientAdded: function(newPatient) {
     
        document.location.href = '#patient/' + newPatient.get('id');
        return;
    },
    patientSaved: function(savedPatient) {

    },
    addPatient: function(bnt) {

        var formPanel = this;
        WINK.Utilities.submitForm(formPanel, this.patientAdded);


    },
    getEmailAddress: function(){
        return this.down('emailfield[name=email]').getValue();
    },
    savePatient: function(bnt) {
       
        var formPanel = this;
        WINK.Utilities.submitForm(formPanel, this.patientSaved);
        

    },
    initProvinceStore: function() {
        console.log("PatientPanel.initProvinceStore()");
        var subdivisionStore = Ext.create('WINK.store.CountrySubdivisionStore', {
            proxy: {
                type: 'rest',
                url: WINK.Utilities.getRestURL() + 'countries/subdivision/' + WINK.Utilities.getAccountId(),
                withCredentials: true,
                useDefaultXhrHeader: false
            }
        });


        var countrySelect = this.down("selectfield[name=country_idcountry]");
        var subdivisionSelect = this.down("selectfield[name=province_select]");
        var subdivisionText = this.down("textfield[name=province]");
        subdivisionSelect.setStore(subdivisionStore);




        var mainSubdivisionStore = Ext.getStore('CountrySubdivisionStore');
        mainSubdivisionStore.clearFilter();
        console.log("number of provinces in main store" + mainSubdivisionStore.getData().length);
        subdivisionStore.setData(mainSubdivisionStore.getRange());

        return subdivisionStore;
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
            activate: {
                single: true,
                fn: function(value, options) {

                    console.log("PatientPanel.activate()");
                    //alert("PatientPanel.activate()")
                    value.initProvinceStore();
                    value.updateProvinces();
                    var newPatient = new WINK.model.Patient();
                    this.setRecord(newPatient);
                }
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
                        action: 'goBack'
                    },
                    {
                        text: 'Clear',
                        ui: 'decline',
                        handler: function(btn) {
                            var newPatient = new WINK.model.Patient();
                            //btn.up('.PatientPanel').reset();
                            btn.up('.PatientPanel').setRecord(newPatient);
                        }
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
                                    {text: 'Male', value: 0},
                                    {text: 'Female', value: 1}
                                ]
                            },
                            {
                                xtype: 'datepickerfield',
                                label: 'DOB',
                                placeHolder: 'mm/dd/yyyy',
                                name: 'dob',
                                picker: {
                                    yearFrom: new Date().getFullYear()-110,
                                    toolbar: {
                                        xtype: 'datepickertoolbar'
                                    }
                                }
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
                                xtype: 'phonefield',
                                label: 'Home',
                                name: 'home'

                            },
                            {
                                xtype: 'phonefield',
                                label: 'Cell',
                                name: 'cell'
                            },
                            {
                                xtype: 'phonefield',
                                label: 'Work',
                                name: 'work'
                            },
                            {
                                xtype: 'phonefield',
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
                                valueField: 'id',
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
                                usePicker: true,
                                valueField: 'id',
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
