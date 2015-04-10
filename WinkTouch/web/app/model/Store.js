Ext.define('WINK.model.Store', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Field'
    ],

    config: {
        fields: [

{ name: 'idstore',
 defaultValue: 0
}
,
{ name: 'companyname',
 defaultValue: null
}
,
{ name: 'name',
 defaultValue: null
}
,
{ name: 'address1',
 defaultValue: null
}
,
{ name: 'address2',
 defaultValue: null
}
,
{ name: 'city',
 defaultValue: null
}
,
{ name: 'province',
 defaultValue: null
}
,
{ name: 'postalcode',
 defaultValue: null
}
,
{ name: 'tel1',
 defaultValue: null
}
,
{ name: 'tel2',
 defaultValue: null
}
,
{ name: 'fax',
 defaultValue: null
}
,
{ name: 'tollfree',
 defaultValue: null
}
,
{ name: 'email',
 defaultValue: null
}
,
{ name: 'website',
 defaultValue: null
}
,
{ name: 'inactive',
 defaultValue: false
}
,
{ name: 'version',
 defaultValue: 0
}
,
{ name: 'taxnumber1',
 defaultValue: null
}
,
{ name: 'taxnumber2',
 defaultValue: null
}
,
{ name: 'unit',
 defaultValue: null
}
,
{ name: 'country_idcountry',
 defaultValue: 0
}
,
{ name: 'povonlineid',
 defaultValue: 0
}
,
{ name: 'onlineversion',
 defaultValue: 0
}
,
{ name: 'quickbooksfile_idquickbooksfile',
 defaultValue: 0
}
,
{ name: 'timezone',
 defaultValue: "America/New_York"
}
,
{ name: 'smsgatewayprotocol',
 defaultValue: 0
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
{ name: 'useasdefaultaddress',
 defaultValue: true
}
,
{ name: 'epayaccounts_idepayaccounts',
 defaultValue: 0
}
,
{ name: 'edgemountcapacity',
 defaultValue: 0
}
,
{ name: 'cariesstocklenses',
 defaultValue: false
}
,
{ name: 'icdrevision',
 defaultValue: null
}
,
{ name: 'defaultlanguage',
 defaultValue: 0
}
,
{ name: 'defaultinvoicenote',
 defaultValue: null
}
,
{ name: 'rxverificationbeforeorderrequired',
 defaultValue: false
}
,
{ name: 'rxverificationbeforedeliveryrequired',
 defaultValue: false
}
,
{ name: 'inclusiveoftax',
 defaultValue: false
}
,
{ name: 'openingbalancedate',
 defaultValue: "2015-04-10"
}
,
{ name: 'openingbalanceclosedon',
 defaultValue: null
}
,
{ name: 'defaultpairlenspricing',
 defaultValue: false
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
{ name: 'companylegalname',
 defaultValue: null
}
,
{ name: 'bookscloseddate',
 defaultValue: null
}
,
{ name: 'edgeatstore_idstore',
 defaultValue: 0
}
,
{ name: 'edgeatsupplier_idsupplier',
 defaultValue: 0
}
        ],
validations: [
 { type: 'length', field: 'CompanyName', max: 45 }
,
 { type: 'length', field: 'name', max: 45 }
,
 { type: 'length', field: 'address1', max: 150 }
,
 { type: 'length', field: 'address2', max: 150 }
,
 { type: 'length', field: 'city', max: 45 }
,
 { type: 'length', field: 'province', max: 45 }
,
 { type: 'length', field: 'postalcode', max: 45 }
,
 { type: 'length', field: 'tel1', max: 45 }
,
 { type: 'length', field: 'tel2', max: 45 }
,
 { type: 'length', field: 'fax', max: 45 }
,
 { type: 'length', field: 'tollfree', max: 45 }
,
 { type: 'length', field: 'email', max: 45 }
,
 { type: 'length', field: 'website', max: 150 }
,
 { type: 'length', field: 'taxnumber1', max: 45 }
,
 { type: 'length', field: 'taxnumber2', max: 45 }
,
 { type: 'length', field: 'unit', max: 45 }
,
 { type: 'length', field: 'timeZone', max: 45 }
,
 { type: 'length', field: 'name_fr', max: 45 }
,
 { type: 'length', field: 'name_sp', max: 45 }
,
 { type: 'length', field: 'name_it', max: 45 }
,
 { type: 'length', field: 'ICDRevision', max: 45 }
,
 { type: 'length', field: 'defaultInvoiceNote', max: 150 }
,
 { type: 'length', field: 'Reference1', max: 45 }
,
 { type: 'length', field: 'Reference2', max: 45 }
,
 { type: 'length', field: 'companyLegalName', max: 300 }
]    }
});
