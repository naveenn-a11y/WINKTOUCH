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
        'WINK.model.Product',
        'WINK.model.ProductBrowseModel'
    ],
    browse: function() {

        var s = Ext.create('Ext.data.TreeStore', {
            model: 'WINK.model.ProductBrowseModel',
            defaultRootProperty: 'items',
            root: {
            },
            proxy: {
                type: 'ajax',
                url: WINK.Utilities.getRestURL() + 'products/browse',
                withCredentials: true,
                useDefaultXhrHeader: false,
                cors: true
            }
        });
        this.down('nestedlist[winkname=browseproduct]').setStore(s);
        this.setActiveItem(this.down('nestedlist[winkname=browseproduct]'));
    },
    getStore: function() {
        if (!this.winkProductStore)
        {
            this.winkProductStore = Ext.create('WINK.store.BarcodeResponseStore');
            this.down('dataview').setStore(this.winkProductStore);
        }
        return this.winkProductStore;
    },
    selectProduct: function(product, barcode) {
        this.setMasked(true);
        product.productretaildetails_product_idproduct().load({
            scope: this,
            callback: function(records, operation, success) {
                console.log('Loaded product retails pricing ');
                this.up('InvoicePanel').addProductToInvoice(product, barcode);
                this.setMasked(false);
            }});
    },
    find: function(query) {
        WINK.Utilities.showWorking();
        this.setMasked(true);

        this.setActiveItem(this.down('list[winkname=searchproduct]'));
        this.getStore().setData([]);

        Ext.Ajax.request({
            url: WINK.Utilities.getRestURL() + 'products/find/' + encodeURIComponent(query),
            method: 'GET',
            scope: this,
            withCredentials: true,
            useDefaultXhrHeader: false,
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


                    this.selectProduct(product, barcode);
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
        layout: 'card',
        cls: 'productListDataViewContainer',
        items: [
            {
                xtype: 'list',
                //cls: 'productListDataViewContainer',
                winkname: 'searchproduct',
                indexBar: false,
                grouped: true,
                pinHeaders: true,
                itemTpl: '{fkproduct_idproduct.name}',
                listeners: {
                    itemtap: function(dataview, index, target, record, e, eOpts) {
                        //dataview.up('PatientHistoryPanel').openHistoryItem(record);
                    }
                },
                onItemDisclosure: function(bResponse, btn, index) {
                    //  alert('disclosure');
                    var product = bResponse.getFkproduct_idproduct();
                    var barcode = bResponse.getFkbarcode_idbarcode();
                    btn.up('productsearchresultspanel').selectProduct(product, barcode);

                }

            },
            {
                xtype: 'nestedlist',
                //cls: 'productListDataViewContainer',
                winkname: 'browseproduct',
                displayField: 'name',
                listeners: {
                    itemtap: function(dataview, index, target, record, e, eOpts) {
                        //dataview.up('PatientHistoryPanel').openHistoryItem(record);
                    },
                    leafitemtap: function(me, list, index, item) {
                        var item = list.getStore().getAt(index);
                        if (item.get('type') === 2)
                        {
                            var product = item.getFkproduct_idproduct();
                            //var barcode = bResponse.getFkbarcode_idbarcode();
                            list.up('productsearchresultspanel').selectProduct(product);
                        }
                    }
                },
                getItemTextTpl: function(recordnode)
                {
                    return '<div class="item-title">{name}</div><tpl if="leaf === true"><div class="x-list-disclosure"></div></tpl>';
                }
                /*onItemDisclosure: function(bResponse, btn, index) {
                 if (bResponse.get('type') === 2)
                 {
                 var product = bResponse.getFkproduct_idproduct();
                 //var barcode = bResponse.getFkbarcode_idbarcode();
                 btn.up('productsearchresultspanel').selectProduct(product);
                 }
                 
                 }*/

            }
        ]
    }
});