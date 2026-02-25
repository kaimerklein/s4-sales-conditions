const cds = require('@sap/cds');
const { getWorkAgreement, getWorkAgreements, getWorkerIdsByAgreements } = require('./lib/worker-mapping');
const { getConditionRecords } = require('./lib/condition-record');
const { getEmployeeDetails } = require('./lib/employee-lookup');
const { getProjectCustomers } = require('./lib/project-lookup');
const { getBusinessPartnerDetails } = require('./lib/business-partner-lookup');

module.exports = class SalesConditionService extends cds.ApplicationService {
  init() {
    this.on('READ', 'Employees', async (req) => {
      const filters = _extractMultiFilters(req.query.SELECT.where);

      // Also extract key from single-entity reads: /Employees(WorkerId='...')
      const fromRef = req.query.SELECT.from?.ref;
      if (fromRef) {
        for (const seg of fromRef) {
          if (seg.where) _walkWhere(seg.where, filters);
        }
      }

      const hasFilter = filters.WorkerId.length || filters.Customer.length ||
                        filters.EngagementProject.length || filters.Mandantengruppe.length;
      if (!hasFilter) return [];

      // Resolve WorkerIds to PersonWorkAgreements
      let workerAgreementMap = new Map(); // workerId → [{workAgreementId, companyCode, companyCodeName}]
      let allAgreementIds = [];

      if (filters.WorkerId.length) {
        workerAgreementMap = await getWorkAgreements(filters.WorkerId);
        for (const mappings of workerAgreementMap.values()) {
          allAgreementIds.push(...mappings.map(m => m.workAgreementId));
        }
      }

      // Query conditions with all filters
      const conditionParams = {};
      if (allAgreementIds.length) conditionParams.workAgreementIds = allAgreementIds;
      if (filters.Customer.length) conditionParams.customers = filters.Customer;
      if (filters.EngagementProject.length) conditionParams.engagementProjects = filters.EngagementProject;
      if (filters.Mandantengruppe.length) conditionParams.mandantengruppen = filters.Mandantengruppe;

      // If we only have non-worker filters, we still need at least one filter for conditions
      if (!Object.keys(conditionParams).length) return [];

      const records = await getConditionRecords(conditionParams);
      if (!records.length) return [];

      // Group by Personnel
      const byPersonnel = new Map();
      for (const r of records) {
        if (!byPersonnel.has(r.Personnel)) byPersonnel.set(r.Personnel, []);
        byPersonnel.get(r.Personnel).push(r);
      }

      // Reverse-map Personnel to WorkerId if we didn't start with WorkerIds
      let personnelToWorker;
      if (!filters.WorkerId.length) {
        const allPersonnel = [...byPersonnel.keys()];
        personnelToWorker = await getWorkerIdsByAgreements(allPersonnel);
      } else {
        // Build reverse map from what we already have
        personnelToWorker = new Map();
        for (const [wid, mappings] of workerAgreementMap) {
          for (const m of mappings) {
            personnelToWorker.set(m.workAgreementId, wid);
          }
        }
      }

      // Enrich with employee details
      const allPersonnelIds = [...byPersonnel.keys()];
      const employeeDetails = await getEmployeeDetails(allPersonnelIds);

      // Group by WorkerId (a worker may have multiple PersonWorkAgreements)
      const workerMap = new Map(); // workerId → { conditions, companyCode, companyCodeName, name, costCenter }
      for (const [personnel, conditions] of byPersonnel) {
        const workerId = personnelToWorker.get(personnel) || personnel;
        const empDetail = employeeDetails.get(personnel) || {};

        if (!workerMap.has(workerId)) {
          // Try to get company info from workerAgreementMap or from the first condition
          let companyCode = '';
          let companyCodeName = '';
          if (workerAgreementMap.has(workerId)) {
            const mapping = workerAgreementMap.get(workerId)[0];
            companyCode = mapping.companyCode || '';
            companyCodeName = mapping.companyCodeName || '';
          }

          workerMap.set(workerId, {
            companyCode,
            companyCodeName,
            name: empDetail.name || '',
            costCenter: empDetail.costCenter || '',
            personnelNumber: personnel,
            conditions: [],
          });
        }

        const entry = workerMap.get(workerId);
        entry.conditions.push(...conditions);
        // If this personnel has a name and we don't yet, update
        if (!entry.name && empDetail.name) entry.name = empDetail.name;
        if (!entry.personnelNumber) entry.personnelNumber = personnel;
      }

      // Build result rows
      const result = [];
      for (const [workerId, data] of workerMap) {
        result.push({
          WorkerId: workerId,
          PersonnelNumber: data.personnelNumber,
          EmployeeName: data.name,
          CostCenter: data.costCenter,
          CompanyCode: data.companyCode,
          CompanyCodeName: data.companyCodeName,
          ConditionCount: data.conditions.length,
          Customer: '',
          EngagementProject: '',
          Mandantengruppe: '',
        });
      }

      return result;
    });

    this.on('READ', 'EmployeeConditions', async (req) => {
      const filters = _extractMultiFilters(req.query.SELECT.where);

      // Also extract key from navigation context: /Employees(WorkerId='...')/Conditions
      const fromRef = req.query.SELECT.from?.ref;
      if (fromRef) {
        for (const seg of fromRef) {
          if (seg.where) _walkWhere(seg.where, filters);
        }
      }

      // WorkerId is required (comes from navigation context)
      if (!filters.WorkerId.length) return [];

      const workerId = filters.WorkerId[0];
      const mappings = await getWorkAgreement(workerId);
      if (!mappings) return [];

      const workAgreementIds = mappings.map(m => m.workAgreementId);
      const records = await getConditionRecords({ workAgreementIds });

      // Enrich: project-level conditions → look up Customer from ProjectSet
      const projectIds = [...new Set(
        records.filter(r => r.PriceLevel === 'Project' && r.EngagementProject)
               .map(r => r.EngagementProject)
      )];
      const projectCustomerMap = projectIds.length
        ? await getProjectCustomers(projectIds)
        : new Map();

      // Populate Customer on project-level records that don't have one
      for (const r of records) {
        if (r.PriceLevel === 'Project' && r.EngagementProject && !r.Customer) {
          r.Customer = projectCustomerMap.get(r.EngagementProject) || '';
        }
      }

      // Collect all unique Customer IDs for business partner lookup
      const allCustomerIds = [...new Set(
        records.filter(r => r.Customer).map(r => r.Customer)
      )];
      const bpMap = allCustomerIds.length
        ? await getBusinessPartnerDetails(allCustomerIds)
        : new Map();

      return records
        .map(r => {
          const bp = bpMap.get(r.Customer);
          return {
            WorkerId: workerId,
            ConditionRecord: r.ConditionRecord,
            ConditionValidityEndDate: r.ConditionValidityEndDate,
            ConditionType: r.ConditionType,
            ConditionTable: r.ConditionTable,
            ConditionValidityStartDate: r.ConditionValidityStartDate,
            ConditionRateValue: r.ConditionRateValue,
            ConditionRateValueUnit: r.ConditionRateValueUnit,
            ConditionQuantityUnit: r.ConditionQuantityUnit,
            ConditionCurrency: r.ConditionCurrency,
            Personnel: r.Personnel,
            Customer: r.Customer,
            EngagementProject: r.EngagementProject,
            Mandantengruppe: r.Mandantengruppe || (bp ? bp.mandantengruppe : ''),
            CustomerName: bp ? bp.name : '',
            PriceLevel: r.PriceLevel,
            PriceLevelOrder: r.PriceLevelOrder,
            ID: _derivePriceLevelId(r),
          };
        })
        .sort((a, b) => a.PriceLevelOrder - b.PriceLevelOrder);
    });

    return super.init();
  }
};

/**
 * Extract multi-value filters from a CDS SELECT.where array.
 * Handles:
 * - Simple equality: {ref:[field]}, '=', {val:value}
 * - In-list: {ref:[field]}, 'in', {list:[...]}
 * - OR groups from Fiori Elements multi-value selections
 */
function _extractMultiFilters(where) {
  const filters = { WorkerId: [], Customer: [], EngagementProject: [], Mandantengruppe: [] };
  if (!where) return filters;

  _walkWhere(where, filters);
  // Deduplicate
  for (const key of Object.keys(filters)) {
    filters[key] = [...new Set(filters[key])];
  }
  return filters;
}

function _walkWhere(where, filters) {
  let i = 0;
  while (i < where.length) {
    const token = where[i];

    // Skip logical operators
    if (token === 'and' || token === 'or') { i++; continue; }

    // Parenthesized group (xpr)
    if (token?.xpr) {
      _walkWhere(token.xpr, filters);
      i++;
      continue;
    }

    // Standard triple: ref, op, val/list
    if (token?.ref && i + 2 < where.length) {
      const field = token.ref[0];
      const op = where[i + 1];
      const right = where[i + 2];

      if (field in filters) {
        if (op === '=' && right?.val !== undefined) {
          filters[field].push(right.val);
        } else if (op === 'in' && right?.list) {
          for (const item of right.list) {
            if (item.val !== undefined) filters[field].push(item.val);
          }
        }
      }
      i += 3;
      continue;
    }

    i++;
  }
}

/**
 * Derive the ID column value based on price level.
 * Shows the identifying value for each level:
 * Project → EngagementProject, Customer → Customer, Mandantengruppe → Mandantengruppe
 */
function _derivePriceLevelId(r) {
  switch (r.PriceLevel) {
    case 'Project':        return r.EngagementProject || '';
    case 'Customer':       return r.Customer || '';
    case 'Mandantengruppe': return r.Mandantengruppe || '';
    default:               return '';
  }
}
