Ext.define('WINK.view.DatePickerToolbar', {
    extend: 'Ext.Toolbar',
    alias: 'widget.datepickertoolbar',
    config: {
        docked: 'top',
        items: [
            {
                xtype: 'button',
                handler: function(button, event) {
                    var picker = button.up('datepicker');
                    picker.fireEvent('change', picker, null);
                    picker.hide();
                },
                ui: 'decline',
                text: 'Clear'
            },
            {
                xtype: 'button',
                handler: function(button, event) {
                    var picker = button.up('datepicker');
                    picker.fireEvent('change', picker, Ext.DateExtras.clearTime(new Date()));
                },
                ui: 'confirm',
                text: 'Today'
            }
        ]
    }
});


