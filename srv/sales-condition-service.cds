using { API_SLSPRICINGCONDITIONRECORD_SRV as external } from './external/API_SLSPRICINGCONDITIONRECORD_SRV';

service SalesConditionService {
  type ConditionRecord {
    ConditionRecord            : String;
    ConditionSequentialNumber  : String;
    ConditionTable             : String;
    ConditionType              : String;
    ConditionValidityStartDate : Date;
    ConditionValidityEndDate   : Date;
    ConditionRateValue         : Decimal;
    ConditionRateValueUnit     : String;
    WorkAgreement              : String;
    Customer                   : String;
  }

  function getConditionRecords(workerId : String, customer : String)
    returns array of ConditionRecord;
}
