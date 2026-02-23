using SalesConditionService as service from '../../srv/sales-condition-service';
annotate service.ConditionRecords with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : ConditionRecord,
            },
            {
                $Type : 'UI.DataField',
                Value : ConditionSequentialNumber,
            },
            {
                $Type : 'UI.DataField',
                Value : ConditionTable,
            },
            {
                $Type : 'UI.DataField',
                Value : ConditionType,
            },
            {
                $Type : 'UI.DataField',
                Value : ConditionValidityStartDate,
            },
            {
                $Type : 'UI.DataField',
                Value : ConditionValidityEndDate,
            },
            {
                $Type : 'UI.DataField',
                Value : ConditionRateValue,
            },
            {
                $Type : 'UI.DataField',
                Value : ConditionRateValueUnit,
            },
            {
                $Type : 'UI.DataField',
                Value : WorkAgreement,
            },
            {
                $Type : 'UI.DataField',
                Value : Customer,
            },
            {
                $Type : 'UI.DataField',
                Value : WorkerId,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
);

