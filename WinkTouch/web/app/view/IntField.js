/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


Ext.define('WINK.view.IntField', {
    extend: 'Ext.form.Number',
    alias: 'widget.intfield',
    applyValue1: function(value) {
       // console.log(this.name + ' applyValue1: ' + value);

        var minValue = this.getMinValue(),
                maxValue = this.getMaxValue();

        if (Ext.isNumber(minValue) && Ext.isNumber(value)) {
            value = Math.max(value, minValue);
        }

        if (Ext.isNumber(maxValue) && Ext.isNumber(value)) {
            value = Math.min(value, maxValue);
        }

        value = Math.round(value); // where 2 is your decimal precision value
       
        value = (isNaN(value)) ? '' : value;
      
        return value;
    },
   
    setValue1: function(myValue) {
        
       var formattedValue = this.applyValue1(myValue);
         console.log(myValue + ' formattedTo  ' + formattedValue);
       this.superclass.setValue.call(this,formattedValue);
    },
    parseStringToFloat: function(string) {
        string = string.replace(/[^0-9.]/g, ""); //regex to delete all non digits and periods
        return parseFloat(string);
    },
    config: {
        component: {
            xtype: 'input',
            type: 'number'
        },
        value:0,
        maxValue: 999,
        minValue: -999,
        stepValue: 1

    }
});