Ext.define('WINK.model.Product', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Field'
    ],

    config: {
        fields: [

{ name: 'idproduct',
 defaultValue: 0
}
,
{ name: 'name',
 defaultValue: null
}
,
{ name: 'description',
 defaultValue: null
}
,
{ name: 'usebarcode',
 defaultValue: false
}
,
{ name: 'comment',
 defaultValue: ""
}
,
{ name: 'type',
 defaultValue: 0
}
,
{ name: 'framebrand',
 defaultValue: null
}
,
{ name: 'framemodel',
 defaultValue: null
}
,
{ name: 'framecolor',
 defaultValue: null
}
,
{ name: 'framea',
 defaultValue: null
}
,
{ name: 'frameb',
 defaultValue: null
}
,
{ name: 'frameed',
 defaultValue: null
}
,
{ name: 'framedbl',
 defaultValue: null
}
,
{ name: 'frametype',
 defaultValue: 0
}
,
{ name: 'frameshape',
 defaultValue: 0
}
,
{ name: 'contactlensbrand',
 defaultValue: null
}
,
{ name: 'contactlensdesign',
 defaultValue: null
}
,
{ name: 'contactlenstype',
 defaultValue: 0
}
,
{ name: 'contactlensmaterial',
 defaultValue: 0
}
,
{ name: 'contactlenswearingperiod',
 defaultValue: 0
}
,
{ name: 'contactlensreplacement',
 defaultValue: 0
}
,
{ name: 'contactlensqtyperbox',
 defaultValue: 1
}
,
{ name: 'finishedlensdesign',
 defaultValue: null
}
,
{ name: 'finsihedlenstype',
 defaultValue: 0
}
,
{ name: 'finishedlensissurfaced',
 defaultValue: false
}
,
{ name: 'finishedlensaddfrom',
 defaultValue: 0.0
}
,
{ name: 'finishedlensaddto',
 defaultValue: 0.0
}
,
{ name: 'version',
 defaultValue: 0
}
,
{ name: 'inactive',
 defaultValue: false
}
,
{ name: 'productcategory_idproductcategory',
 defaultValue: 0
}
,
{ name: 'finishedlensistoric',
 defaultValue: true
}
,
{ name: 'reference1',
 defaultValue: null
}
,
{ name: 'reference2',
 defaultValue: null
}
,
{ name: 'iseyeexam',
 defaultValue: false
}
,
{ name: 'povonlineid',
 defaultValue: 0
}
,
{ name: 'description_fr',
 defaultValue: null
}
,
{ name: 'description_sp',
 defaultValue: null
}
,
{ name: 'description_it',
 defaultValue: null
}
,
{ name: 'name_fr',
 defaultValue: null
}
,
{ name: 'name_sp',
 defaultValue: null
}
,
{ name: 'name_it',
 defaultValue: null
}
,
{ name: 'printas',
 defaultValue: null
}
,
{ name: 'printas_fr',
 defaultValue: null
}
,
{ name: 'printas_sp',
 defaultValue: null
}
,
{ name: 'printas_it',
 defaultValue: null
}
,
{ name: 'framesex',
 defaultValue: 0
}
,
{ name: 'finishedlenspricedetailed',
 defaultValue: 1
}
,
{ name: 'code',
 defaultValue: null
}
,
{ name: 'tagcolor',
 defaultValue: 0
}
,
{ name: 'discontinuedon',
 defaultValue: null
}
,
{ name: 'msrp',
 defaultValue: 0.0
}
,
{ name: 'publishedwholesalecost',
 defaultValue: 0.0
}
,
{ name: 'frametemple',
 defaultValue: null
}
,
{ name: 'insurancecode',
 defaultValue: null
}
,
{ name: 'preferredsupplier_idsupplier',
 defaultValue: 0
}
,
{ name: 'manufacturersupplier_idsupplier',
 defaultValue: 0
}
,
{ name: 'donotpreload',
 defaultValue: false
}
,
{ name: 'entrymethod',
 defaultValue: 0
}
,
{ name: 'framesdataid',
 defaultValue: 0
}
,
{ name: 'bestseller',
 defaultValue: false
}
,
{ name: 'framecolorname',
 defaultValue: null
}
,
{ name: 'framelenscolorcode',
 defaultValue: null
}
,
{ name: 'framelenscolorname',
 defaultValue: null
}
,
{ name: 'upc',
 defaultValue: null
}
,
{ name: 'imageuploads_iduploads',
 defaultValue: 0
}
,
{ name: 'framecolorasone',
 defaultValue: null
}
,
{ name: 'lensoptiontype',
 defaultValue: 0
}
,
{ name: 'finishedlensisfreefrom',
 defaultValue: false
}
,
{ name: 'lensoptionunit',
 defaultValue: 0
}
,
{ name: 'finishedlensmaterialcolor',
 defaultValue: null
}
,
{ name: 'finishedlensmaterialpolarized',
 defaultValue: false
}
,
{ name: 'finishedlensmaterialphotochromic',
 defaultValue: false
}
,
{ name: 'finishedlenscoatinghydrophobe',
 defaultValue: false
}
,
{ name: 'finishedlenscoatingar',
 defaultValue: false
}
,
{ name: 'finishedlenscoatingbackar',
 defaultValue: false
}
,
{ name: 'finishedlenscoatingrae',
 defaultValue: false
}
,
{ name: 'isgeneric',
 defaultValue: false
}
,
{ name: 'finishedlensmaterialname',
 defaultValue: null
}
,
{ name: 'finishedlensistintable',
 defaultValue: false
}
,
{ name: 'finishedlensmaterialindex',
 defaultValue: 0.0
}
        ],
validations: [
 { type: 'length', field: 'name', max: 300 }
,
 { type: 'length', field: 'description', max: 150 }
,
 { type: 'length', field: 'frameBrand', max: 100 }
,
 { type: 'length', field: 'frameModel', max: 100 }
,
 { type: 'length', field: 'frameColor', max: 100 }
,
 { type: 'length', field: 'frameA', max: 45 }
,
 { type: 'length', field: 'frameB', max: 45 }
,
 { type: 'length', field: 'frameED', max: 45 }
,
 { type: 'length', field: 'frameDBL', max: 45 }
,
 { type: 'length', field: 'contactLensBrand', max: 45 }
,
 { type: 'length', field: 'contactLensDesign', max: 45 }
,
 { type: 'length', field: 'finishedLensDesign', max: 45 }
,
 { type: 'length', field: 'reference1', max: 45 }
,
 { type: 'length', field: 'reference2', max: 45 }
,
 { type: 'length', field: 'description_fr', max: 150 }
,
 { type: 'length', field: 'description_sp', max: 150 }
,
 { type: 'length', field: 'description_it', max: 150 }
,
 { type: 'length', field: 'name_fr', max: ***REMOVED*** }
,
 { type: 'length', field: 'name_sp', max: ***REMOVED*** }
,
 { type: 'length', field: 'name_it', max: ***REMOVED*** }
,
 { type: 'length', field: 'printAs', max: 100 }
,
 { type: 'length', field: 'printAs_fr', max: 100 }
,
 { type: 'length', field: 'printAs_sp', max: 100 }
,
 { type: 'length', field: 'printAs_it', max: 100 }
,
 { type: 'length', field: 'code', max: 45 }
,
 { type: 'length', field: 'frameTemple', max: 45 }
,
 { type: 'length', field: 'insuranceCode', max: 45 }
,
 { type: 'length', field: 'frameColorName', max: 100 }
,
 { type: 'length', field: 'frameLensColorCode', max: 100 }
,
 { type: 'length', field: 'frameLensColorName', max: 100 }
,
 { type: 'length', field: 'UPC', max: 45 }
,
 { type: 'length', field: 'frameColorAsOne', max: 400 }
,
 { type: 'length', field: 'finishedLensMaterialColor', max: 45 }
,
 { type: 'length', field: 'finishedLensMaterialName', max: 45 }
]    }
});
