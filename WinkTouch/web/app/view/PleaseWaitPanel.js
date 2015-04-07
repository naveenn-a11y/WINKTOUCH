/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
Ext.define('WINK.view.PleaseWaitPanel', {
    extend: 'Ext.Container',
    alias: 'widget.PleaseWaitPanel',
    requires: [
        'Ext.Container',
        'Ext.Panel'
    ],
    config: {
        itemId: 'PleaseWait',
        id: 'PleaseWait',
        hidden: true,
        height: '50px',
        items: [
            {
                xtype: 'titlebar',
                docked: 'top',
                title: 'Please Wait',
            }
        ]
    }

});
