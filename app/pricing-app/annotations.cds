using SalesConditionService as service from '../../srv/sales-condition-service';

annotate service.ConditionRecords with @(
    UI.HeaderInfo : {
        TypeName       : 'Sales Price Condition',
        TypeNamePlural : 'Sales Price Conditions',
        Title          : { Value : ConditionRecord }
    },
    UI.SelectionFields : [
        WorkerId,
        Customer,
        EngagementProject
    ],
    UI.LineItem : [
        { $Type : 'UI.DataField', Value : ConditionRecord,             Label : 'Condition Record' },
        { $Type : 'UI.DataField', Value : Personnel,                   Label : 'Personnel' },
        { $Type : 'UI.DataField', Value : Customer,                    Label : 'Customer' },
        { $Type : 'UI.DataField', Value : EngagementProject,           Label : 'Engagement Project' },
        { $Type : 'UI.DataField', Value : ConditionRateValue,          Label : 'Rate Value' },
        { $Type : 'UI.DataField', Value : ConditionRateValueUnit,      Label : 'Rate Unit' },
        { $Type : 'UI.DataField', Value : ConditionCurrency,           Label : 'Currency' },
        { $Type : 'UI.DataField', Value : ConditionValidityStartDate,  Label : 'Valid From' },
        { $Type : 'UI.DataField', Value : ConditionValidityEndDate,    Label : 'Valid To' }
    ],
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            { $Type : 'UI.DataField', Value : ConditionRecord },
            { $Type : 'UI.DataField', Value : ConditionSequentialNumber },
            { $Type : 'UI.DataField', Value : ConditionTable },
            { $Type : 'UI.DataField', Value : ConditionType },
            { $Type : 'UI.DataField', Value : ConditionValidityStartDate },
            { $Type : 'UI.DataField', Value : ConditionValidityEndDate },
            { $Type : 'UI.DataField', Value : ConditionRateValue },
            { $Type : 'UI.DataField', Value : ConditionRateValueUnit },
            { $Type : 'UI.DataField', Value : ConditionCurrency },
            { $Type : 'UI.DataField', Value : Personnel },
            { $Type : 'UI.DataField', Value : Customer },
            { $Type : 'UI.DataField', Value : EngagementProject },
            { $Type : 'UI.DataField', Value : WorkerId },
        ],
    },
    UI.Facets : [
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'GeneratedFacet1',
            Label  : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
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
    ConditionCurrency          @title : 'Currency';
    Personnel                  @title : 'Personnel';
    Customer                   @title : 'Customer';
    EngagementProject          @title : 'Engagement Project';
    WorkerId                   @title : 'Worker ID';
};
