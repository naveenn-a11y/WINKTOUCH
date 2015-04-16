/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


Ext.define('WINK.model.BarcodeResponse', {
    extend: 'Ext.data.Model',
    requires: [
        'Ext.data.Field',
        'Ext.data.association.HasMany',
        'Ext.data.association.HasOne',
        'Ext.data.association.BelongsTo',
        'WINK.Utilities',
        'Ext.data.proxy.Rest',
        'WINK.model.Product',
        'WINK.model.Barcode'
    ],
    config: {
        fields: [
            {
                name: 'product_idproduct',
                type: 'int',
                defaultValue: 0
            },
            {
                name: 'storeInventory',
                type: 'int',
                defaultValue: 0
            },
            {
                name: 'entrepriseInventory',
                type: 'int',
                defaultValue: 0
            },
            {
                name: 'isInventory',
                type: 'boolean',
                defaultValue: false
            },
            {
                name: 'barcode_idbarcode',
                type: 'int',
                defaultValue: 0
            }
        ],
        belongsTo: [
            {
                model: 'WINK.model.Product',
                associatedName: 'fkproduct_idproduct',
                foreignKey: 'product_idproduct',
                primaryKey: 'id',
                getterName: 'getFkproduct_idproduct',
                setterName: 'setFkproduct_idproduct'
            },
            {
                model: 'WINK.model.Barcode',
                associatedName: 'fkbarcode_idbarcode',
                foreignKey: 'barcode_idbarcode',
                primaryKey: 'id',
                getterName: 'getFkbarcode_idbarcode',
                setterName: 'setFkbarcode_idbarcode'
            }

        ]

    }
});