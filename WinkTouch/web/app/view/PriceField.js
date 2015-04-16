/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


Ext.define('WINK.view.PriceField', {
    extend: 'Ext.form.Number',
    alias: 'widget.pricefield',
    applyValue: function(value) {
        var minValue = this.getMinValue(),
                maxValue = this.getMaxValue();

        if (Ext.isNumber(minValue) && Ext.isNumber(value)) {
            value = Math.max(value, minValue);
        }

        if (Ext.isNumber(maxValue) && Ext.isNumber(value)) {
            value = Math.min(value, maxValue);
        }

        value = parseFloat(value).toFixed(2); // where 2 is your decimal precision value
        return (isNaN(value)) ? '' : value;
    },
    config: {
        component: {
            xtype: 'input',
            type: 'number'
        },
        stepValue: 0.01
    }
});