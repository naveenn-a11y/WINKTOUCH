/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


Ext.define('WINK.view.PhoneField', {
    extend: 'Ext.field.Text',
    alias: 'widget.phonefield',
    config: {
        component: {
            xtype: 'input',
            type: 'tel'
        }
    }
});