/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

Ext.define('WINK.view.ProductSearchResultsPanel', {
    extend: 'Ext.Panel',
    requires: [
        'Ext.SegmentedButton',
        'Ext.Button',
        'Ext.field.Select',
        'Ext.field.Spinner',
        'Ext.dataview.DataView',
        'WINK.store.ProductStore',
        'WINK.model.BarcodeResponse',
        'WINK.model.Barcode',
        'WINK.model.Product'
    ],
    getStore: function() {
        if (!this.winkProductStore)
        {
            this.winkProductStore = Ext.create('WINK.store.ProductStore');
            this.down('dataview').setStore(this.winkProductStore);
        }
        return this.winkProductStore;
    },
    selectProduct: function(product) {

    },
    find: function(query) {
        WINK.Utilities.showWorking();
        this.setMasked(true);
        this.getStore().setData([]);

        Ext.Ajax.request({
            url: WINK.Utilities.getRestURL() + 'products/find/' + query,
            method: 'GET',
            scope: this,
            success: function(response) {

                console.log('product lookup success ' + response.responseText);

                var productArray = Ext.JSON.decode(response.responseText);

                console.log('product lookup success products returned:' + productArray.length);
                if (productArray.length === 0)
                {
                    Ext.Msg.alert('Product Lookup', 'No Products Found For:' + query, Ext.emptyFn);

                } else if (productArray.length === 1) {
                    var bResponse = Ext.create('WINK.model.BarcodeResponse', productArray[0]);

                    this.selectProduct(bResponse.getFkproduct_idproduct());
                } else {
                    for (var i = 0; i < productArray.length; i++)
                    {
                        var bResponse = Ext.create('WINK.model.BarcodeResponse', productArray[i]);

                        this.getStore().add(bResponse.getFkproduct_idproduct());
                    }
                }
                WINK.Utilities.hideWorking();
                this.unmask();

            },
            failure: function(response) {
                WINK.Utilities.hideWorking();
                WINK.Utilities.showAjaxError(response, 'Product Lookup');
            },
            callback: function(options, success, response) {


            }
        });


    },
    config: {
        layout: 'fit',
        cls: 'productListDataViewContainer',
        items: [
            {
                xtype: 'dataview',
                cls: 'productListDataViewContainer',
                itemTpl: "<div class='mainMenuButton productListDataView' >{name} is  years old</div>"
            }
        ]
    }
});