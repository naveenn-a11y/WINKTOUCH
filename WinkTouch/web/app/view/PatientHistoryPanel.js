/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


Ext.define('WINK.view.PatientHistoryPanel', {
    extend: 'Ext.Panel',
    alias: 'widget.InvoicePanel',
    requires: [
        'WINK.store.PatientHistoryStore',
        'WINK.model.PatientHistory',
        'Ext.tab.Panel',
        'Ext.field.Text',
        'Ext.Button',
        'Ext.SegmentedButton',
        'Ext.Label',
        'Ext.tab.Bar',
        'Ext.Panel'
    ],
    config: {
        scrollable: true,
        layout: 'hbox',
                items: [
                    {
                        docked: 'top',
                        xtype: 'toolbar',
                        title: 'Christian Mokbel',
                        items: [
                            {
                                text: 'Back',
                                ui: 'back',
                                action: 'goToMainScreen'
                            },
                            {
                                xtype: 'spacer'
                            },
                            {
                                text: 'New',
                                ui: 'confirm',
                                listeners: {
                                    tap: function(c) {

                                        var myOverlay = Ext.create('Ext.Panel', {
                                            modal: true,
                                            hideOnMaskTap: true,
                                            showAnimation: {
                                                type: 'popIn',
                                                duration: 250,
                                                easing: 'ease-out'
                                            },
                                            hideAnimation: {
                                                type: 'popOut',
                                                easing: 'ease-out',
                                                duration: 250
                                            },
                                            width: '200px',
                                            height: '300px',
                                            scrollable: true,
                                            layout: 'vbox',
                                            items: [
                                                {
                                                    docked: 'top',
                                                    xtype: 'toolbar',
                                                    title: 'New'
                                                },
                                                {
                                                    xtype: 'list',
                                                    indexBar: false,
                                                    grouped: false,
                                                    pinHeaders: true,
                                                    flex:1,
                                                    itemTpl: '{title}',
                                                    data: [
                                                        {title: 'Exam'},
                                                        {title: 'Invoice'},
                                                        {title: 'Attachment'},
                                                        {title: 'Photo'}
                                                    ]

                                                }
                                            ]


                                        });
                                        Ext.Viewport.add(myOverlay);
                                        myOverlay.showBy(c);
                                    }
                                }
                            },
                            {
                                text: 'Open',
                                ui: 'forward',
                                listeners: {
                                    tap: function(c) {

                                        alert('Open');
                                    }
                                }
                            }
                        ]

                    },
                    {
                        xtype: 'list',
                        width: '200px',
                        indexBar: false,
                        grouped: true,
                        pinHeaders: true,
                        store: 'PatientHistoryStore',
                        itemTpl: '{Label}'
                    },
                    {
                        xtype: 'container',
                        flex: 1
                    }
                ]

    }



});