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
        isKeyNull: function(model) {
            if (model.get('id') === 0)
                return true;
            if (typeof model.get('id') === "string")
                if (model.get('id').startsWith("ext-record"))
                    return true;
            return false;
        },
        setDefaultValues: function(model) {
            if (model instanceof WINK.model.PatientInvoice) {
                model.set('orderdate', new Date());
                model.set('store_idstore', WINK.Utilities.currentstore.get('id'));
            } else if (model instanceof WINK.model.PatientPayment) {
                model.set('date', new Date());
                model.set('store_idstore', WINK.Utilities.currentstore.get('id'));
                model.set('user_iduser', WINK.Utilities.currentuser.get('id'));

            }
        },
        loginSuccess: function(response) {
            WINK.Utilities.currentstore = Ext.create('WINK.model.Store', {
                id: 1
            });
            WINK.Utilities.currentuser = Ext.create('WINK.model.User');
            console.log("Set logged In User:" + response.responseText);

            WINK.Utilities.currentuser.set(Ext.JSON.decode(response.responseText));
            console.log("Set logged In User:" + WINK.Utilities.currentuser.get('id'));

        },
        loadAllRequiredStores: function(callback) {
            console.log("Utilities.loadAllRequiredStores()");
            if (!WINK.Utilities.currentstore) {
                console.log("Utilities.loadAllRequiredStores() ajax /users/me");
                Ext.Ajax.request({
                    scope: this,
                    url: WINK.Utilities.getRestURL() + 'users/me',
                    method: 'GET',
                    success: function(response) {
                        WINK.Utilities.loginSuccess(response);
                        WINK.Utilities.loadAllRequiredStores(callback);
                    },
                    failure: function(response) {
                        Ext.Msg.alert('Login Failed', 'Invalid Login...Please try again', Ext.emptyFn);
                        document.location.href = '#login';

                        //TODO, once we login go to the right bookmark
                    },
                    callback: function(options, success, response) {


                    }
                });
                return;

            }

            if (!this.storesLoaded)
            {

                console.log("Utilities.loadAllRequiredStores() loading stores");
                Ext.create('WINK.store.CountrySubdivisionStore', {
                    storeId: 'CountrySubdivisionStore',
                    autoLoad: true
                }); //just to start loading the data
                Ext.create('WINK.store.TaxCodeStore', {
                    storeId: 'TaxCodeStore',
                    autoLoad: true
                }); //just to start loading the data

                Ext.create('WINK.store.PaymentMethodStore', {
                    storeId: 'PaymentMethodForCurrentStore',
                    autoLoad: true,
                    params: {
                        store_idstore: WINK.Utilities.currentstore.get('id')
                    }
                }); //just to start loading the data

                this.storesLoaded = true;
            }

            console.log("Utilities.loadAllRequiredStores() done!");
            if (callback)
                callback();
        },
        getAccountId: function() {
            //return 37;
            return 57;
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