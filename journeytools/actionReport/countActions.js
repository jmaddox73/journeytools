// Import modules
const fs = require("fs");
const path = require("path");
const { parse } = require("json2csv");

// === Parse CLI arguments ===
const args = process.argv.slice(2);

if (args.length < 2 || args.includes("-h") || args.includes("--help")) {
  console.log(`\nUsage: node actionCounter.js <inputFile.json> <json|csv>\n`);
  console.log(`Arguments:`);
  console.log(`  <inputFile.json>     The CIAM export JSON file to analyze.`);
  console.log(`  json                 Output the results as a JSON file.`);
  console.log(`  csv                  Output the results as a CSV file.`);
  console.log(`  -h, --help           Show this help message.`);
  process.exit(0);
}

const inputFile = args[0];
const outputType = args[1];
const baseName = path.basename(inputFile, ".json");
const outputFile = baseName + "_actionCount.json";
const csvFile = baseName + "_actionCount.csv";

if (!["json", "csv"].includes(outputType)) {
  console.error("\n❌ Error: Output format must be either 'json' or 'csv'.\n");
  process.exit(1);
}

// Function to count 'metadata'-based actions inside policy workflows
function countActionsUnderPolicies(data) {
  const actionCounts = {}; // Object to track action counts per policy

  data.forEach((exportItem) => {
    if (
      exportItem.data &&
      exportItem.data.policies &&
      Array.isArray(exportItem.data.policies)
    ) {
      const policies = exportItem.data.policies;

      policies.forEach((policy) => {
        const workflow = policy.versions[0].workflow; // Only checking first version
        const policyId = policy.policy_id;

        function countActionsRecursive(obj) {
          let count = 0;
          if (obj && typeof obj === "object") {
            if (obj.metadata) {
              count += 1; // Count when 'metadata' key exists
            }
            // Traverse nested properties
            for (const key in obj) {
              count += countActionsRecursive(obj[key]);
            }
          }
          return count;
        }

        const actionCount = countActionsRecursive(workflow); // Count actions in this workflow

        // Accumulate action count per policy ID
        if (!actionCounts[policyId]) {
          actionCounts[policyId] = 0;
        }
        actionCounts[policyId] += actionCount;
      });
    }
  });

  return actionCounts; // Return mapping of policy ID => action count
}

// Function to count 'action'-based objects inside a procedure
function countActionsInProcedure(procedure) {
  let actionCount = 0;

  function countActionsRecursive(obj) {
    if (obj && typeof obj === "object") {
      if (obj.action) {
        actionCount += 1; // Count when 'action' key exists
      }
      for (const key in obj) {
        countActionsRecursive(obj[key]);
      }
    }
  }
  countActionsRecursive(procedure);
  return actionCount; // Return total count of actions found
}

// Count total number of procedure objects across all exports
function countProcedureObjects(data) {
  let totalObjects = 0;
  data.exports.forEach((exportItem) => {
    if (
      exportItem.data &&
      exportItem.data.procedures &&
      Array.isArray(exportItem.data.procedures)
    ) {
      totalObjects += exportItem.data.procedures.length;
    }
  });
  return totalObjects;
}

// Load and parse the JSON file, extract key counts and lists
function getJsonFromFile(filepath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, "utf8", (err, json) => {
      if (err) {
        console.log("File read failed:", err);
        reject(err);
        return;
      }
      try {
        const config = JSON.parse(json);
        const exports = config.exports;
        const procedureCount = countProcedureObjects(config);

        // Count actions in each procedure
        const procedureActions = exports.reduce((acc, exportItem) => {
          if (
            exportItem.data &&
            exportItem.data.procedures &&
            Array.isArray(exportItem.data.procedures)
          ) {
            exportItem.data.procedures.forEach((procedure) => {
              const actionCount = countActionsInProcedure(procedure);
              acc.push({ procedureName: procedure.name, actionCount });
            });
          }
          return acc;
        }, []);

        // Return key pieces of structured data
        resolve({ procedureCount, exports, procedureActions });
      } catch (err) {
        console.log("Error parsing JSON string:", err);
        reject(err);
      }
    });
  });
}

// Generate summary statistics for procedures and policies
function calculateReport(procedureActions, actionsUnderPolicies) {
  const maxProcedure = procedureActions.reduce(
    (max, current) => {
      return current.actionCount > max.actionCount ? current : max;
    },
    { procedureName: "", actionCount: 0 }
  );

  const maxPolicy = Object.entries(actionsUnderPolicies).reduce(
    (max, [policyId, actionCount]) => {
      return actionCount > max.actionCount ? { policyId, actionCount } : max;
    },
    { policyId: "", actionCount: 0 }
  );

  const totalProcedureActions = procedureActions.reduce(
    (sum, current) => sum + current.actionCount,
    0
  );
  const averageProcedureActions =
    procedureActions.length > 0
      ? totalProcedureActions / procedureActions.length
      : 0;

  const policyEntries = Object.entries(actionsUnderPolicies);
  const totalPolicyActions = policyEntries.reduce(
    (sum, [policyId, actionCount]) => sum + actionCount,
    0
  );
  const averagePolicyActions =
    policyEntries.length > 0 ? totalPolicyActions / policyEntries.length : 0;

  return {
    maxProcedure,
    maxPolicy,
    averageProcedureActions,
    averagePolicyActions,
  };
}

// Orchestrates full workflow: load, analyze, write results
function main() {
  getJsonFromFile(inputFile)
    .then(({ procedureCount, procedureActions, exports }) => {
      const actionsUnderPolicies = countActionsUnderPolicies(exports);
      const report = calculateReport(procedureActions, actionsUnderPolicies);

      const results = {
        procedureCount,
        procedureActions,
        actionsUnderPolicies,
        report,
      };

      if (outputType === "json") {
        fs.writeFile(outputFile, JSON.stringify(results, null, 2), (err) => {
          if (err) throw err;
          console.log(`Data written to ${outputFile}`);
        });
      } else if (outputType === "csv") {
        const csvData = [];

        procedureActions.forEach((p) => {
          csvData.push({
            Category: "SubJourney",
            Name: p.procedureName,
            Actions: p.actionCount,
          });
        });

        Object.entries(actionsUnderPolicies).forEach(
          ([policyId, actionCount]) => {
            csvData.push({
              Category: "Journey",
              Name: policyId,
              Actions: actionCount,
            });
          }
        );

        csvData.push({
          Category: "Summary",
          Name: "Max SubJourney",
          Actions: `${report.maxProcedure.procedureName} (${report.maxProcedure.actionCount})`,
        });
        csvData.push({
          Category: "Summary",
          Name: "Max Journey",
          Actions: `${report.maxPolicy.policyId} (${report.maxPolicy.actionCount})`,
        });
        csvData.push({
          Category: "Summary",
          Name: "Avg SubJourney Actions",
          Actions: report.averageProcedureActions,
        });
        csvData.push({
          Category: "Summary",
          Name: "Avg Journey Actions",
          Actions: report.averagePolicyActions,
        });

        const finalCSV = parse(csvData);

        fs.writeFile(csvFile, finalCSV, (err) => {
          if (err) throw err;
          console.log(`CSV written to ${csvFile}`);
        });
      }
    })
    .catch((err) => {
      console.error("Error building policy ID array:", err);
    });
}

// Start the script
main();
