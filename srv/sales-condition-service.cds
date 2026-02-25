using { API_SLSPRICINGCONDITIONRECORD_SRV as external } from './external/API_SLSPRICINGCONDITIONRECORD_SRV';

service SalesConditionService {
  @readonly entity Employees {
    key WorkerId               : String;
        PersonnelNumber        : String;
        EmployeeName           : String;
        CostCenter             : String;
        CompanyCode            : String;
        CompanyCodeName        : String;
        ConditionCount         : Integer;
        Customer               : String;
        EngagementProject      : String;
        Mandantengruppe        : String;
        Conditions             : Composition of many EmployeeConditions
                                   on Conditions.WorkerId = $self.WorkerId;
  }

  @readonly entity EmployeeConditions {
    key WorkerId                   : String;
    key ConditionRecord            : String;
    key ConditionValidityEndDate   : Date;
        ConditionType              : String;
        ConditionTable             : String;
        ConditionValidityStartDate : Date;
        ConditionRateValue         : Decimal;
        ConditionRateValueUnit     : String;
        ConditionCurrency          : String;
        Personnel                  : String;
        Customer                   : String;
        EngagementProject          : String;
        Mandantengruppe            : String;
        PriceLevel                 : String;
        PriceLevelOrder            : Integer;
  }
}
