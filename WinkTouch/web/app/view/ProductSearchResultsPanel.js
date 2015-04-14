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
        'Ext.dataview.DataView'
    ],
    config: {
        layout: 'fit',
        cls: 'productListDataViewContainer',
        items: [
            {
                xtype: 'dataview',
                cls: 'productListDataViewContainer',
                store: 'CountryStore',
                itemTpl: "<div class='mainMenuButton productListDataView' >{name} is  years old</div>"
            }
        ]
    }
});