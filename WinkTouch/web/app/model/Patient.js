Ext.define('WINK.model.Patient', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Field'
    ],

    config: {
        fields: [

{ name: 'idpatient'}
,
{ name: 'referredby_idpatient'}
,
{ name: 'firstname'}
,
{ name: 'lastname'}
,
{ name: 'address1'}
,
{ name: 'address2'}
,
{ name: 'city'}
,
{ name: 'province'}
,
{ name: 'postalcode'}
,
{ name: 'home'}
,
{ name: 'cell'}
,
{ name: 'work'}
,
{ name: 'fax'}
,
{ name: 'mainnumber'}
,
{ name: 'email'}
,
{ name: 'dob'}
,
{ name: 'sex'}
,
{ name: 'medialcard'}
,
{ name: 'drivers'}
,
{ name: 'version'}
,
{ name: 'inactive'}
,
{ name: 'note'}
,
{ name: 'reference1'}
,
{ name: 'reference2'}
,
{ name: 'unit'}
,
{ name: 'country_idcountry'}
,
{ name: 'title'}
,
{ name: 'language'}
,
{ name: 'lasteyeexam'}
,
{ name: 'referringdoctor_iduser'}
,
{ name: 'nocall'}
,
{ name: 'notxt'}
,
{ name: 'nofax'}
,
{ name: 'noemail'}
,
{ name: 'wearscl'}
,
{ name: 'wearsprogressives'}
,
{ name: 'wearsbifocal'}
,
{ name: 'lastee'}
,
{ name: 'nextee'}
,
{ name: 'totalspending'}
,
{ name: 'avgspending'}
,
{ name: 'createddate'}
,
{ name: 'lastpurchasedate'}
,
{ name: 'lastcontactlenspurchasedate'}
,
{ name: 'lasteyeglasspurchasedate'}
,
{ name: 'store_idstore'}
,
{ name: 'enteredinstore_idstore'}
,
{ name: 'recall1'}
,
{ name: 'recall2'}
,
{ name: 'passedaway'}
,
{ name: 'passedawayon'}
,
{ name: 'totalamountinvoices'}
,
{ name: 'totalamountcreditnotes'}
,
{ name: 'totalamountee'}
,
{ name: 'totalinvoices'}
,
{ name: 'totalcreditnotes'}
,
{ name: 'totalinvoicesatzero'}
,
{ name: 'primaryinsurer'}
,
{ name: 'primaryinsureraccountnumber'}
,
{ name: 'primaryinsurergroupnumber'}
,
{ name: 'primaryinsurerplanname'}
,
{ name: 'supplementalinsurer'}
,
{ name: 'supplementalinsureraccountnumber'}
,
{ name: 'supplementalinsurergroupnumber'}
,
{ name: 'supplementalinsurerplanname'}
,
{ name: 'primaryinsurerother'}
,
{ name: 'supplementalinsurerother'}
,
{ name: 'patientprivacyconsentformsignedon'}
,
{ name: 'patientprivacyconsentacceptads'}
,
{ name: 'patientprivacyconsentmethod'}
,
{ name: 'patientprivacyconsentipaddress'}
,
{ name: 'sin'}
,
{ name: 'referalmethods_idreferalmethods'}
,
{ name: 'medialcardexpiry'}
        ]
    }
});
