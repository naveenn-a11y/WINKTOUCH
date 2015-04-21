/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

Ext.define('WINK.model.ProductBrowseModel', {
    extend: 'Ext.data.Model',
    requires: [
        'Ext.data.Field',
        'Ext.data.association.HasMany',
        'Ext.data.association.HasOne',
        'Ext.data.association.BelongsTo',
        'WINK.Utilities',
        'Ext.data.proxy.Rest'

    ],
    config: {
        fields: [
            {
                name:'id'
            },
            {
                name: 'name',
                type: 'string',
                defaultValue: ''
            },
            {
                name: 'product_idproduct',
                type: 'int',
                defaultValue: null
            },
            {
                name: 'productcategory_idproductcategory',
                type: 'int',
                defaultValue: null
            },
            {
                name: 'type',
                type: 'int'
            }
        ],
        belongsTo: [
            {
                model: 'WINK.model.ProductCategory',
                associatedName: 'fkproductcategory_idproductcategory',
                foreignKey: 'productcategory_idproductcategory',
                primaryKey: 'id',
                getterName: 'getFkproductcategory_idproductcategory',
                setterName: 'setFkproductcategory_idproductcategory'
            },
            {
                model: 'WINK.model.Product',
                associatedName: 'fkproduct_idproduct',
                foreignKey: 'product_idproduct',
                primaryKey: 'id',
                getterName: 'getFkproduct_idproduct',
                setterName: 'setFkproduct_idproduct'
            }
        ]
    }
});
