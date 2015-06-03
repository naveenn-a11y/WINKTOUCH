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
        fullscreen: true,
        
        style:'background-color: rgba(25,133,208, 0.8)',
        items:[
            {
                xtype:'label',
                 style:'color: #FFFFFF; font-size:40px',
                html:"PLEASE WAIT ...",
                centered:true
            }
        ]
    }

});
