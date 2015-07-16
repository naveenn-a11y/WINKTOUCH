/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

Ext.define('WINK.view.AddPaymentPanel', {
    extend: 'Ext.form.Panel',
    alias: 'widget.addpaymentpanel',
    requires: [
        'Ext.TitleBar',
        'Ext.form.FieldSet',
        'Ext.field.Select',
        'Ext.field.Email',
        'Ext.field.Password',
        'Ext.Button',
        'WINK.store.PaymentMethodStore',
        'WINK.model.PatientPayment'
    ],
    addPayment:function(){
      
      var patientpaymentmodel = Ext.create('WINK.model.PatientPayment');
       WINK.Utilities.setDefaultValues(patientpaymentmodel);
      patientpaymentmodel.set(this.getValues());
      var paymentPanel = Ext.create('WINK.view.InvoicePaymentPanel');
      paymentPanel.loadItem(patientpaymentmodel);
           this.patientinvoicepanel.addPayment(paymentPanel);
            
        Ext.Viewport.remove(this);
        
    },
    setPatientInvoicePanel:function(patientinvoicepanel){
        this.patientinvoicepanel=patientinvoicepanel;
        this.down('pricefield[name=amount]').setValue(patientinvoicepanel.getPatientBalance());
    },
    config: {
        centered: true,
        fullscreen: false,
        layout: 'fit',
        modal: true, 
        hideOnMaskTap :true,
        scrollable: false,
        width:600,
        height:300,
        items: [
            {
                xtype: 'titlebar',
                docked: 'top',
                title: 'Add Payment'
            },
            {
                xtype: 'container',
                items: [
                    {
                        xtype: 'fieldset',
                        centered: true,
                        height: 212,
                        id: 'LogInFieldSet',
                        width: 550,
                        instructions: '',
                        title: '',
                        items: [
                            {
                                xtype: 'selectfield',
                                label: 'Method',
                                required: true,
                                displayField: 'name',
                                store: 'PaymentMethodForCurrentStore',
                                usePicker: true,
                                valueField: 'id',
                                name:'paymentmethod_idpaymentmethod'
                            },
                            {
                                xtype: 'textfield',
                                label: 'Description',
                                required: false,
                                name:'description'
                              
                            },
                            {
                                xtype: 'pricefield',
                                label: 'Amount',
                                name:'amount',
                                required: true
                              
                            },
                            {
                                xtype: 'button',
                                docked: 'bottom',
                                ui: 'action',
                                text: 'Add Payment',
                                handler:function(btn){
                                    btn.up('addpaymentpanel').addPayment();
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }

});