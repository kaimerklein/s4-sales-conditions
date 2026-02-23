sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"pricingapp/test/integration/pages/ConditionRecordsList",
	"pricingapp/test/integration/pages/ConditionRecordsObjectPage"
], function (JourneyRunner, ConditionRecordsList, ConditionRecordsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('pricingapp') + '/test/flp.html#app-preview',
        pages: {
			onTheConditionRecordsList: ConditionRecordsList,
			onTheConditionRecordsObjectPage: ConditionRecordsObjectPage
        },
        async: true
    });

    return runner;
});

