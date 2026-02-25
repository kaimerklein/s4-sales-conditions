using SalesConditionService as service from '../../srv/sales-condition-service';

annotate service.Employees with @(
    UI.HeaderInfo : {
        TypeName       : 'Employee',
        TypeNamePlural : 'Employees',
        Title          : { Value : WorkerId },
        Description    : { Value : EmployeeName }
    },
    UI.SelectionFields : [
        WorkerId,
        Customer,
        EngagementProject,
        Mandantengruppe
    ],
    UI.LineItem : [
        { $Type : 'UI.DataField', Value : WorkerId,        Label : 'Worker ID' },
        { $Type : 'UI.DataField', Value : EmployeeName,    Label : 'Employee Name' },
        { $Type : 'UI.DataField', Value : CostCenter,      Label : 'Cost Center' },
        { $Type : 'UI.DataField', Value : CompanyCodeName,  Label : 'Company' },
        { $Type : 'UI.DataField', Value : ConditionCount,  Label : 'Conditions' }
    ],
    UI.Facets : [
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'ConditionsFacet',
            Label  : 'Pricing Conditions',
            Target : 'Conditions/@UI.PresentationVariant',
        },
    ],
);

annotate service.Employees with {
    WorkerId          @title : 'Worker ID';
    PersonnelNumber   @title : 'Personnel Number';
    EmployeeName      @title : 'Employee Name';
    CostCenter        @title : 'Cost Center';
    CompanyCode       @title : 'Company Code';
    CompanyCodeName   @title : 'Company';
    ConditionCount    @title : 'Conditions';
    Customer          @title : 'Customer';
    EngagementProject @title : 'Engagement Project';
    Mandantengruppe   @title : 'Mandantengruppe';
};

annotate service.EmployeeConditions with @(
    UI.PresentationVariant : {
        SortOrder : [
            { Property : PriceLevelOrder, Descending : false }
        ],
        GroupBy : [ PriceLevel ],
        Visualizations : ['@UI.LineItem'],
    },
    UI.LineItem : [
        { $Type : 'UI.DataField', Value : PriceLevel,                  Label : 'Price Level' },
        { $Type : 'UI.DataField', Value : ConditionValidityStartDate,  Label : 'Valid From' },
        { $Type : 'UI.DataField', Value : ConditionValidityEndDate,    Label : 'Valid To' },
        { $Type : 'UI.DataField', Value : ConditionRateValue,          Label : 'Rate' },
        { $Type : 'UI.DataField', Value : ID,                          Label : 'ID' },
        { $Type : 'UI.DataField', Value : EngagementProject,           Label : 'Project ID' },
        { $Type : 'UI.DataField', Value : Customer,                    Label : 'Customer' },
        { $Type : 'UI.DataField', Value : Mandantengruppe,             Label : 'Mandantengruppe' },
        { $Type : 'UI.DataField', Value : ConditionCurrency,           Label : 'Currency' },
        { $Type : 'UI.DataField', Value : ConditionQuantityUnit,       Label : 'Quantity Unit' }
    ],
);

annotate service.EmployeeConditions with {
    WorkerId                   @title : 'Worker ID';
    ConditionRecord            @title : 'Condition Record';
    ConditionType              @title : 'Condition Type';
    ConditionTable             @title : 'Condition Table';
    ConditionValidityStartDate @title : 'Valid From';
    ConditionValidityEndDate   @title : 'Valid To';
    ConditionRateValue         @title : 'Rate';
    ConditionRateValueUnit     @title : 'Rate Unit';
    ConditionQuantityUnit      @title : 'Quantity Unit';
    ConditionCurrency          @title : 'Currency';
    Personnel                  @title : 'Personnel';
    Customer                   @title : 'Customer';
    EngagementProject          @title : 'Project ID';
    Mandantengruppe            @title : 'Mandantengruppe';
    PriceLevel                 @title : 'Price Level';
    PriceLevelOrder            @title : 'Price Level Order';
    ID                         @title : 'ID';
};
