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


Ext.application({
    name: 'WINK',
    requires: [
        'Ext.MessageBox',
        'WINK.Utilities'
    ],
    models: [
        'JobStatusWrapper',
        'BarcodeResponse',
        'ApplicationSetting',
        'Appointment',
        'AppointmentType',
        'Barcode',
        'Country',
        'CountrySubdivision',
        'InvoiceAttachement',
        'JobStatus',
        'Patient',
        'PatientInvoice',
        'PatientInvoiceItem',
        'PatientHistoryTree',
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
        'User',
        'ProductBrowseModel'
    ],
    stores: [
        'ProductStore',
        'leftNavigationTreeStore',
        'LocationStore',
        'TaxCodeStore',
        'PatientStore',
        'PatientHistoryStore',
        'CountrySubdivisionStore',
        'CountryStore',
        'JobStatusStore',
        'PaymentMethodStore'
    ],
    views: [
        'JobStatusPanel',
        'PhoneField',
        'PriceField',
        'IntField',
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
        'PatientHistoryPanel',
        'ProductSearchResultsPanel',
        'AddPaymentPanel',
        'InvoicePaymentPanel'

    ],
    controllers: [
        'ShowHideSideMenuButtonController',
        'LoginController',
        'LockScreenController',
        'MenuController'
        
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
        };

        Ext.Msg.defaultAllowedConfig.showAnimation = false;


                  
        Ext.JSON.encodeDate = function(d) {
            console.log('WINK.JSON, encode date');
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

        Ext.data.writer.Json.override({
            /*
             * This function overrides the default implementation of json writer. Any hasMany relationships will be submitted
             * as nested objects. When preparing the data, only children which have been newly created, modified or marked for
             * deletion will be added. To do this, a depth first bottom -> up recursive technique was used.
             */
            getRecordData: function(record) {
                //Setup variables
                console.log("getRecordData");

                var me = this, i, association, childStore, data = record.data;

                //Iterate over all the hasMany associations
                for (i = 0; i < record.associations.length; i++) {
                    association = record.associations.get(i);
                    var name = association.getName();
                    console.log(i + " association " + name + " " + association.getType());

                    if (association.getType() === 'hasmany') {
                        console.log(name + " " + association.getAssociationKey( ));
                        data[name] = null;
                        childStore = record[name]();
                        console.log("child store:" + childStore);

                        //Iterate over all the children in the current association
                        childStore.each(function(childRecord) {
                            console.log("childStore.each():" + childRecord);
                            if (!data[name]) {
                                data[name] = [];
                            }

                            //Recursively get the record data for children (depth first)
                            var childData = this.getRecordData.call(this, childRecord);

                            /*
                             * If the child was marked dirty or phantom it must be added. If there was data returned that was neither
                             * dirty or phantom, this means that the depth first recursion has detected that it has a child which is
                             * either dirty or phantom. For this child to be put into the prepared data, it's parents must be in place whether
                             * they were modified or not.
                             */
                            if (childRecord.dirty | childRecord.phantom | (childData != null)) {
                                data[name].push(childData);
                                record.setDirty();
                            }
                        }, me);

                        /*
                         * Iterate over all the removed records and add them to the preparedData. Set a flag on them to show that
                         * they are to be deleted
                         */
                        Ext.each(childStore.getRemovedRecords( ), function(removedChildRecord) {
                            //Set a flag here to identify removed records
                            if (!data[name]) {
                                data[name] = [];
                            }
                            removedChildRecord.set('forDeletion', true);
                            var removedChildData = this.getRecordData.call(this, removedChildRecord);
                            data[name].push(removedChildData);
                            record.setDirty();
                        }, me);
                    }
                }

                //Only return data if it was dirty, new or marked for deletion.
                if (record.dirty | record.phantom | record.get('forDeletion')) {
                    return data;
                }
            }
        });

        // Destroy the #appLoadingIndicator element
        Ext.fly('appLoadingIndicator').destroy();

        // Initialize the main view
        Ext.Viewport.add(Ext.create('WINK.view.ParentView'), {fullscreen: true});
        Ext.Viewport.add(Ext.create('WINK.view.PleaseWaitPanel'));
        //Ext.Viewport.add(Ext.create('WINK.view.FindPatientPanel'), {fullscreen: true});
    }
    ,
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
