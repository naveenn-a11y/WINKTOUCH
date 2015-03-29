/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


Ext.define('WINK.view.MonthPickerFormField', {
    extend: 'Ext.form.DatePicker',
    alias: 'widget.monthpickerfield',
    getDatePicker: function() {
        if (!this.datePicker) {
            if (this.picker instanceof WINK.view.MonthPicker) {
                this.datePicker = this.picker;
            } else {
                this.datePicker = new WINK.view.MonthPicker(Ext.apply(this.picker || {}));
            }

            this.datePicker.setValue(this.value || null);

            this.datePicker.on({
                scope: this,
                change: this.onPickerChange,
                hide: this.onPickerHide
            });
        }

        return this.datePicker;
    }
});
