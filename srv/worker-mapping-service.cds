service WorkerMappingService {
  type WorkAgreementMapping {
    workAgreementId : String;
    validityStartDate : Date;
  }

  function getWorkAgreement(workerId : String) returns WorkAgreementMapping;
}
