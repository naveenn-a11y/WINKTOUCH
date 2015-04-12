/*
 This file is generated and updated by Sencha Cmd. You can edit this file as
 needed for your application, but these edits will have to be merged by
 Sencha Cmd when it performs code generation tasks such as generating new
 models, controllers or views and when running "sencha app upgrade".
 
 Ideally changes to this file would be limited and most work would be done
 in other places (such as Controllers). If Sencha Cmd cannot merge your
 changes and its generated code, it will produce a "merge conflict" that you
 will need to resolve manually.
 */


Ext.define('WINK.Utilities', {
    requires: [
        'Ext.ComponentQuery',
        'Ext.MessageBox'
    ],
    statics: {
        getAccountId: function() {
            return 37;
        },
        getRestURL: function() {
            return '/WinkRESTfull/webresources/';
        },
        showWorking: function() {
            Ext.getCmp('PleaseWait').show({type: 'slide', direction: 'down'});
        },
        hideWorking: function() {
            Ext.getCmp('PleaseWait').hide();
        },
        showAjaxError: function(title, response) {
            if (response.status == 403)
            {
                WINK.Utilities.relogin();
            } else {
                Ext.Msg.alert(title, response.status + " " + response.responseText, Ext.emptyFn);
            }
        },
        relogin: function() {
            var parentView = Ext.ComponentQuery.query('#ParentView')[0];
            var loginView = Ext.ComponentQuery.query('#LoginPanel')[0];

            WINK.Utilities.previousActiveItem = parentView.getActiveItem();
            parentView.setActiveItem(loginView);

        },
        submitForm: function(formPanel, callback) {
            WINK.Utilities.showWorking();
            formPanel.setMasked(true);

            var rec = formPanel.getRecord();
            rec.set(formPanel.getValues());
            var errors = rec.validate();

            if (!errors.isValid()) {
                // at least one error occurred
                var errorMsg = "";
                errors.each(function(errorObj) {
                    errorMsg += errorObj.getField() + ": " + errorObj.getMessage() + "<br>";
                    return false;
                });
                Ext.Msg.alert("Invalid Entry", errorMsg);
                WINK.Utilities.hideWorking();
                formPanel.unmask();

            } else {


                rec.save({
                    success: function(response) {
                        if (callback)
                        {
                            console.info(response.responseText);
                            rec.set(Ext.JSON.decode(response.responseText));
                            callback(rec);
                        }
                    },
                    failure: function(response) {
                        WINK.Utilities.showAjaxError('Add Patient', response);
                    },
                    callback: function(options, success, response) {
                        formPanel.unmask();
                        WINK.Utilities.hideWorking();
                    }
                });

            }
        }

    }
});

Ext.application({
    name: 'WINK',
    requires: [
        'Ext.MessageBox'
    ],
    models: [
        'ApplicationSetting',
        'Appointment',
        'AppointmentType',
        'Barcode',
        'Country',
        'CountrySubdivision',
        'Invoice',
        'InvoiceAttachement',
        'InvoiceItem',
        'JobStatus',
        'Patient',
        'PatientHistory',
        'PatientInvoice',
        'PatientInvoiceItem',
        'PatientNote',
        'PatientPaperFileNumber',
        'PatientPayment',
        'PaymentMethod',
        'Product',
        'ProductCategory',
        'ProductRetailDetail',
        'Store',
        'Supplier',
        'TaxCode',
        'TaxCodeEffectiveDate',
        'Upload',
        'User'
    ],
    stores: [
        'leftNavigationTreeStore',
        'LocationStore',
        'TaxCodeStore',
        'PatientStore',
        'PatientHistoryStore',
        'CountrySubdivisionStore',
        'CountryStore'
    ],
    views: [
        'DatePickerToolbar',
        'PleaseWaitPanel',
        'LoginPanel',
        'MainAppPanel',
        'ParentView',
        'InvoicePanel',
        'InvoiceItemPanel',
        'InvoiceSummary',
        'RxWorksheetPanel',
        'QuickProductSelectionPanel',
        'PrescriptionContainer',
        'InputPrescriptionPanel',
        'MyPowerPicker',
        'PowerSelectField',
        'Main',
        'PatientPanel',
        'MonthPickerFormField',
        'MonthPicker',
        'FindPatientPanel',
        'PatientHistoryPanel'


    ],
    controllers: [
        'ShowHideSideMenuButtonController',
        'LoginController',
        'LockScreenController',
        'MenuController',
        'FavoriteButtonController'
    ],
    icon: {
        '57': 'resources/icons/Icon.png',
        '72': 'resources/icons/Icon~ipad.png',
        '114': 'resources/icons/Icon@2x.png',
        '144': 'resources/icons/Icon~ipad@2x.png'
    },
    isIconPrecomposed: true,
    startupImage: {
        '320x460': 'resources/startup/320x460.jpg',
        '640x920': 'resources/startup/640x920.png',
        '768x1004': 'resources/startup/768x1004.png',
        '748x1024': 'resources/startup/748x1024.png',
        '1536x2008': 'resources/startup/1536x2008.png',
        '1496x2048': 'resources/startup/1496x2048.png'
    },
    launch: function() {
        if (typeof String.prototype.startsWith != 'function') {
            // see below for better implementation!
            String.prototype.startsWith = function(str) {
                return this.indexOf(str) === 0;
            };
        }
        Ext.data.validations.length = function(config, value) {
            var length = value ? value.length : 0,
                    min = config.min,
                    max = config.max;

            if ((min && length < min) || (max && length > max)) {
                return false;
            } else {
                return true;
            }
        }

        Ext.Msg.defaultAllowedConfig.showAnimation = false;

        Ext.JSON.encodeDate = function(d) {
            function f(n) {
                return n < 10 ? '0' + n : n;
            }

            return  "\"" + d.valueOf() + " " +
                    d.getFullYear() + '-' +
                    f(d.getMonth() + 1) + '-' +
                    f(d.getDate()) + ' ' +
                    f(d.getHours()) + ':' +
                    f(d.getMinutes()) + ':' +
                    f(d.getSeconds()) + "\"";
        };

        // Destroy the #appLoadingIndicator element
        Ext.fly('appLoadingIndicator').destroy();

        // Initialize the main view
        Ext.Viewport.add(Ext.create('WINK.view.ParentView'), {fullscreen: true});
        Ext.Viewport.add(Ext.create('WINK.view.PleaseWaitPanel'));
        //Ext.Viewport.add(Ext.create('WINK.view.FindPatientPanel'), {fullscreen: true});
    },
    onUpdated: function() {
        Ext.Msg.confirm(
                "Application Update",
                "This application has just successfully been updated to the latest version. Reload now?",
                function(buttonId) {
                    if (buttonId === 'yes') {
                        window.location.reload();
                    }
                }
        );
    }
});
