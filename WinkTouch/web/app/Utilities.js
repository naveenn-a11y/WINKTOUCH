/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

Ext.define('WINK.Utilities', {
    requires: [
        'Ext.ComponentQuery',
        'Ext.MessageBox'
    ],
    statics: {
        setDefaultValues: function(model) {
            if (model instanceof WINK.model.PatientInvoice) {
                model.set('orderdate', new Date());
                model.set('store_idstore', WINK.Utilities.currentstore.get('id'));
            }
        },
        loadAllRequiredStores: function() {
            if (!WINK.Utilities.currentstore) {
                WINK.Utilities.currentstore = Ext.create('WINK.model.Store', {
                    id: 1
                });
            }
            if (!this.storesLoaded)
            {

                Ext.create('WINK.store.CountrySubdivisionStore', {
                    storeId: 'CountrySubdivisionStore',
                    autoLoad: true
                }); //just to start loading the data
                Ext.create('WINK.store.TaxCodeStore', {
                    storeId: 'TaxCodeStore',
                    autoLoad: true
                }); //just to start loading the data

                this.storesLoaded = true;
            }
        },
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