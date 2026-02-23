sap.ui.define([
    "sap/ui/test/opaQunit",
    "./pages/JourneyRunner"
], function (opaTest, runner) {
    "use strict";

    function journey() {
        QUnit.module("First journey");

        opaTest("Start application", function (Given, When, Then) {
            Given.iStartMyApp();

            Then.onTheConditionRecordsList.iSeeThisPage();
            Then.onTheConditionRecordsList.onFilterBar().iCheckFilterField("Worker ID");
            Then.onTheConditionRecordsList.onFilterBar().iCheckFilterField("Customer");
            Then.onTheConditionRecordsList.onTable().iCheckColumns(7, {"ConditionRecord":{"header":"Condition Record"},"WorkAgreement":{"header":"Work Agreement"},"Customer":{"header":"Customer"},"ConditionRateValue":{"header":"Rate Value"},"ConditionRateValueUnit":{"header":"Rate Unit"},"ConditionValidityStartDate":{"header":"Valid From"},"ConditionValidityEndDate":{"header":"Valid To"}});

        });


        opaTest("Navigate to ObjectPage", function (Given, When, Then) {
            // Note: this test will fail if the ListReport page doesn't show any data
            
            When.onTheConditionRecordsList.onFilterBar().iExecuteSearch();
            
            Then.onTheConditionRecordsList.onTable().iCheckRows();

            When.onTheConditionRecordsList.onTable().iPressRow(0);
            Then.onTheConditionRecordsObjectPage.iSeeThisPage();

        });

        opaTest("Teardown", function (Given, When, Then) { 
            // Cleanup
            Given.iTearDownMyApp();
        });
    }

    runner.run([journey]);
});