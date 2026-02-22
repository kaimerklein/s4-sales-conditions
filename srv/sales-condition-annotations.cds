using SalesConditionService as service from './sales-condition-service';

annotate service.ConditionRecords with @(
  UI.HeaderInfo : {
    TypeName       : 'Sales Price Condition',
    TypeNamePlural : 'Sales Price Conditions',
    Title          : { Value : ConditionRecord }
  },
  UI.SelectionFields : [
    WorkerId,
    Customer
  ],
  UI.LineItem : [
    { Value : ConditionRecord,             Label : 'Condition Record' },
    { Value : WorkAgreement,               Label : 'Work Agreement' },
    { Value : Customer,                    Label : 'Customer' },
    { Value : ConditionRateValue,          Label : 'Rate Value' },
    { Value : ConditionRateValueUnit,      Label : 'Rate Unit' },
    { Value : ConditionValidityStartDate,  Label : 'Valid From' },
    { Value : ConditionValidityEndDate,    Label : 'Valid To' }
  ]
);

annotate service.ConditionRecords with {
  ConditionRecord            @title : 'Condition Record';
  ConditionSequentialNumber  @title : 'Sequence Number';
  ConditionTable             @title : 'Condition Table';
  ConditionType              @title : 'Condition Type';
  ConditionValidityStartDate @title : 'Valid From';
  ConditionValidityEndDate   @title : 'Valid To';
  ConditionRateValue         @title : 'Rate Value';
  ConditionRateValueUnit     @title : 'Rate Unit';
  WorkAgreement              @title : 'Work Agreement';
  Customer                   @title : 'Customer';
  WorkerId                   @title : 'Worker ID';
};
