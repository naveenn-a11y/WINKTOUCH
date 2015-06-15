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
        getURLParameter2: function(url, name) {
            return 37;
            var index = url.indexOf("?");
            if(index<0)
                return "";
            
            url = url.substring(index);
            return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(url) || [, ""])[1].replace(/\+/g, '%20')) || null;
        },
        getURLParameter: function(name) {
            return 37;
            return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
        },
        setDefaultValues: function(model) {
            if (model instanceof WINK.model.PatientInvoice) {
                model.set('orderdate', new Date());
                model.set('store_idstore', WINK.Utilities.currentstore.get('id'));
            } else if (model instanceof WINK.model.PatientPayment) {
                model.set('date', new Date());
                model.set('store_idstore', WINK.Utilities.currentstore.get('id'));
                model.set('user_iduser', WINK.Utilities.currentuser.get('id'));
            } else if (model instanceof WINK.model.RxWorksheet) {

                model.set('createdon', new Date());
                model.set('scriptreceivedon', null);
                model.set('createby_iduser', WINK.Utilities.currentuser.get('id'));


            }
        },
        loginSuccess: function(response) {
            WINK.Utilities.currentstore = Ext.create('WINK.model.Store');
            WINK.Utilities.currentuser = Ext.create('WINK.model.User');
            console.log("Set logged In User:" + response.responseText);
            var me = Ext.JSON.decode(response.responseText);

            // alert(me);
            //alert(me.user);
            //alert(me.user.lastname);

            WINK.Utilities.currentuser.set(me.user);
            WINK.Utilities.currentstore.set(me.store);

            console.log("Set logged In User:" + WINK.Utilities.currentuser.get('lastname') + " @ " + WINK.Utilities.currentstore.get('name'));

        },
        hasPhonegap: function() {

            var app = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
            if (app)
                return true;


            return false;

        },
        getDeviceID: function() {
            if (!WINK.Utilities.hasPhonegap())
                return null;

            if (!device)
                return Ext.device.Device.uuid;

            return  device.uuid;
            /*
             if (WINK.Utilities.hasPhonegap())
             return device.uuid;
             
             return 'Unknown';
             */
        },
        showPleaseAuthorize: function(callback) {
            alert("Please Authorize " + WINK.Utilities.getDeviceID() + " Using WINK Desktop"); //needs to be syncrhonous (thread blocking)
            WINK.Utilities.getAccountId(callback);

        },
        loadAllRequiredStores: function(callback) {
            console.log("Utilities.loadAllRequiredStores()");
            if (!WINK.Utilities.currentstore) {
                console.log("Utilities.loadAllRequiredStores() ajax /users/me");
                Ext.Ajax.request({
                    scope: this,
                    url: WINK.Utilities.getRestURL() + 'users/me',
                    method: 'GET',
                    withCredentials: true,
                    useDefaultXhrHeader: false,
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
                    autoLoad: true,
                    proxy: {
                        type: 'rest',
                        url: WINK.Utilities.getRestURL() + 'countries/subdivision/' + WINK.Utilities.getAccountId(),
                        withCredentials: true,
                        useDefaultXhrHeader: false
                    }
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
        getAccountId: function(callbackAccountId) {
            if (!WINK.Utilities.accountid)
            {
                var devid = WINK.Utilities.getDeviceID();
                console.log('deviceid:' + devid);
                if (devid)
                {
                    Ext.Ajax.request({
                        scope: this,
                        url: 'https://server1.downloadwink.com/wink-ecomm/WinkTabletUUID',
                        method: 'POST',
                        async: false,
                        params: {
                            "uuid": devid
                        },
                        success: function(response) {
                            console.log('getAccountId success');
                            console.log("response:" + response.responseText);
                            response.responseText = response.responseText.trim();
                            if (response.responseText.toLowerCase().startsWith("http"))
                            {

                                WINK.Utilities.accountid = WINK.Utilities.getURLParameter2(response.responseText.trim(), 'accountid');
                                if (WINK.Utilities.accountid)
                                {
                                    WINK.Utilities.accountid = WINK.Utilities.accountid.trim();
                                }

                                console.log('got account id from ajax request:' + WINK.Utilities.accountid)
                                if (callbackAccountId)
                                {
                                    callbackAccountId(WINK.Utilities.accountid);
                                }

                            } else {
                                console.log(" calling WINK.Utilities.showPleaseAuthorize");
                                WINK.Utilities.showPleaseAuthorize(callbackAccountId);
                            }
                        },
                        failure: function(response) {
                            console.log('getAccountId failure, calling WINK.Utilities.showPleaseAuthorize');
                            WINK.Utilities.showPleaseAuthorize(callbackAccountId);
                        },
                        callback: function(options, success, response) {


                        }
                    });
                    return -1;

                } else {
                    WINK.Utilities.accountid = WINK.Utilities.getURLParameter("accountid");
                    if (WINK.Utilities.accountid)
                    {
                        WINK.Utilities.accountid = WINK.Utilities.accountid.trim();
                    }
                }

                if (!WINK.Utilities.accountid)
                    WINK.Utilities.accountid = 37;

            }
            if (callbackAccountId)
                callbackAccountId(WINK.Utilities.accountid);

            return WINK.Utilities.accountid;
        },
        getWinkVersion: function() {
            return "2.0";
        },
        getRestURL: function() {
            if (WINK.Utilities.hasPhonegap())
                return 'https://server1.downloadwink.com/WinkRESTfull/webresources/';

            return '/WinkRESTfull/webresources/';
        },
        showWorking: function() {

            Ext.getCmp('PleaseWait').show({type: 'slide', direction: 'down'});
        },
        hideWorking: function() {

            Ext.getCmp('PleaseWait').hide({type: 'slide', direction: 'up', out: true});
        },
        showAjaxError: function(title, response) {

            if (!response) {
                Ext.Msg.alert("Internal Server Error", "Unknown Server Error", Ext.emptyFn);
            } else if (response.status == 403) {
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

            WINK.Utilities.hideWorking();
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