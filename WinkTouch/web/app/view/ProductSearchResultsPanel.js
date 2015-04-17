/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

Ext.define('WINK.view.ProductSearchResultsPanel', {
    extend: 'Ext.Panel',
     alias: 'widget.productsearchresultspanel',
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
            this.winkProductStore = Ext.create('WINK.store.BarcodeResponseStore');
            this.down('dataview').setStore(this.winkProductStore);
        }
        return this.winkProductStore;
    },
    selectProduct: function(product,barcode) {
       
        product.productretaildetails_product_idproduct().load({
            scope: this,
            callback: function(records, operation, success) {
                console.log('Loaded product retails pricing ');
                this.up('InvoicePanel').addProductToInvoice(product,barcode);
            }});
    },
    find: function(query) {
        WINK.Utilities.showWorking();
        this.setMasked(true);
        this.getStore().setData([]);

        Ext.Ajax.request({
            url: WINK.Utilities.getRestURL() + 'products/find/' + encodeURIComponent(query),
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
                    console.log('product lookup returned 1 product');
                    var bResponse = Ext.create('WINK.model.BarcodeResponse', productArray[0]);
                    var product = bResponse.getFkproduct_idproduct();
                    var barcode = bResponse.getFkbarcode_idbarcode();
                    console.log('product:' + product.get('id') + ' ' + product.get('name'));


                    this.selectProduct(product,barcode);
                } else {
                    for (var i = 0; i < productArray.length; i++)
                    {
                        var bResponse = Ext.create('WINK.model.BarcodeResponse', productArray[i]);

                        this.getStore().add(bResponse);
                    }
                    this.getStore().sortList();
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
                xtype: 'list',
                //cls: 'productListDataViewContainer',

                indexBar: false,
                grouped: true,
                pinHeaders: true,
                itemTpl: '{fkproduct_idproduct.name}',
                listeners: {
                    itemtap: function(dataview, index, target, record, e, eOpts) {
                        //dataview.up('PatientHistoryPanel').openHistoryItem(record);
                    }
                },
                onItemDisclosure:function(bResponse,btn,index){
                  //  alert('disclosure');
                     var product = bResponse.getFkproduct_idproduct();
                    var barcode = bResponse.getFkbarcode_idbarcode();
                     btn.up('productsearchresultspanel').selectProduct(product,barcode);
                   
                }

            }
        ]
    }
});