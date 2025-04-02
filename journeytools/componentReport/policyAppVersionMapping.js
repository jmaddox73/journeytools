const fs = require("fs");
const getJsonFromFile = require("./mainRead");
const f = "./ciam_mobile.json";

function buildPolicyIdArray() {
  return new Promise((resolve, reject) => {
    getJsonFromFile
      .getJsonFromFile(f)
      .then((obj) => {
        obj = obj.exports;
        let results = [];

        obj.forEach((item) => {
          if (item.data && item.data.hasOwnProperty("policies")) {
            let appId = item.data.id;
            let pols = item.data.policies;

            pols.forEach((p) => {
              let policyId = p.policy_id;
              let ver = p.versions;

              ver.forEach((v) => {
                if (v.state !== "disabled") {
                  results.push({
                    appId,
                    policyId,
                    versionId: v.version_id,
                  });
                }
              });
            });
          }
        });

        resolve(results);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

// Convert to CSV
function convertToCSV(data) {
  const headers = ["appId", "policyId", "versionId"];
  const rows = data.map((row) => [row.appId, row.policyId, row.versionId]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

buildPolicyIdArray()
  .then((data) => {
    const csv = convertToCSV(data);
    fs.writeFile("policyAppVersionMapping.csv", csv, (err) => {
      if (err) throw err;
      console.log("CSV file written successfully!");
    });
  })
  .catch((err) => {
    console.error("Error building policy ID array:", err);
  });
