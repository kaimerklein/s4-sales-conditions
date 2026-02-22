service WorkerMappingService {
  type WorkAgreementMapping {
    workAgreementId : String;
    companyCode     : String;
    companyCodeName : String;
    company         : String;
    startDate       : Date;
    endDate         : Date;
  }

  function getWorkAgreement(workerId : String) returns array of WorkAgreementMapping;
}
