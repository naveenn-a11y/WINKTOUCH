/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

Ext.define('WINK.view.MonthPicker', {
    extend: 'Ext.DatePicker',
    onSlotPick: function(slot, value) {
        Ext.DatePicker.superclass.onSlotPick.apply(this, arguments);
    },
    getValue: function() {
        var value = Ext.DatePicker.superclass.getValue.call(this);

        return new Date(value.year, value.month - 1, 1);
    }
});



