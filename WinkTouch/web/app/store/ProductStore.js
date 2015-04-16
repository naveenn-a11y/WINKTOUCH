/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


Ext.define('WINK.store.ProductStore', {
    extend: 'Ext.data.Store',
    requires: [
        'WINK.model.Product',
        'WINK.model.Barcode',
        'WINK.model.BarcodeResponse',
        
    ],
    config: {
        autoLoad: false,
        data: [
        ],
        model: 'WINK.model.Product',
    
        sorters: [
            {
                property: "name",
                direction: "ASC"
            }
        ]
    }
});