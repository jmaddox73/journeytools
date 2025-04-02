// Required modules
const fs = require("fs").promises;
const XLSX = require("xlsx");
const path = require("path");
// Show usage instructions if -h or --help is passed
if (process.argv.includes("-h") || process.argv.includes("--help")) {
  console.log(`
Usage:
  node componentCount.js <inputFile.json> <outputType>

Arguments:
  <inputFile.json>   Path to your CIAM export JSON file
  <outputType>       One of: csv, xlsx, json, txt

Examples:
  node componentCount.js ciam_mobile.json csv
  node componentCount.js ciam_mobile.json xlsx

This will generate one or more files like:
  - ciam_mobile_componentReport.xlsx
  - ciam_mobile_componentReport_counts.csv
  - ciam_mobile_componentReport_components.csv
  - ciam_mobile_componentReport.json
  - ciam_mobile_componentReport.txt
`);
  process.exit(0);
}

// CLI ARGUMENT HANDLING
// ----------------------
// node componentCount.js ciam_mobile.json csv
const inputFile = process.argv[2]; // e.g. ciam_mobile.json
const outputType = process.argv[3]; // e.g. csv | xlsx | json | txt

if (!inputFile || !outputType) {
  console.error(
    "Usage: node componentCount.js <inputFile.json> <csv|xlsx|json|txt>"
  );
  process.exit(1);
}

// Used to name output files like "ciam_mobile_componentReport.csv"
const baseFilename = path.basename(inputFile, ".json");
const reportPrefix = `${baseFilename}_componentReport`;

// GLOBAL ARRAYS FOR COMPONENT TYPES
// ---------------------------------
const wrList = [];
const journeyList = [];
const subJourneyList = [];
const authscriptList = [];
const applicationList = [];
const serverApiList = [];
const webAppList = [];
const mobileAppList = [];
const samlAppList = [];
const oidcAppList = [];
const emailProviderList = [];
const idStoreProviderList = [];
const otpGeneratorList = [];
const smsProviderList = [];
const journeyVersionsList = []; // to store version mappings

// READ JSON EXPORT FILE & EXTRACT COMPONENTS
function getJsonFromFile() {
  return fs
    .readFile(inputFile, "utf8")
    .then((json) => {
      const config = JSON.parse(json);
      const exports = config.exports;

      for (const item of exports) {
        // Only check root-level objects with a 'path' key
        if (item.path?.includes("providers")) {
          isProvider(item);
        }

        if (item.path?.includes("applications")) {
          console.log("✅ saw path = applications");
          isApplication(item);
        }

        // Traverse .data object for subjourneys only
        if (item.data) {
          getObjects(item.data);
        }
      }
    })
    .catch((err) => {
      console.error("File read failed:", err);
      throw err;
    });
}

// RECURSIVELY SCAN OBJECTS FOR SUBJOURNEYS
function getObjects(node) {
  if (Array.isArray(node)) {
    node.forEach(getObjects);
  } else if (typeof node === "object" && node !== null) {
    if (Array.isArray(node.procedures)) {
      isSubJourney(node.procedures);
    }

    for (const key in node) {
      getObjects(node[key]);
    }
  }
}

// PARSE APPLICATION OBJECT AND CATEGORIZE BY TYPE
function isApplication(obj) {
  if (obj.category === "application") {
    const name = obj.data.name;
    const type = obj.data.type;
    // Populate applicationList with name and type
    applicationList.push(`${name}  type:  ${type}`);
    if (type === "web") webAppList.push(name);
    else if (type === "service") serverApiList.push(name);
    else if (type === "mobile") mobileAppList.push(name);
    else if (type === "oidc") oidcAppList.push(name);
    else if (type === "saml") samlAppList.push(name);
    // Check for policies array in the application
    if (Array.isArray(obj.data.policies)) {
      console.log(
        `✅ Found policies for ${name}:`,
        obj.data.policies.map((p) => p.policy_id)
      );
      isJourney(obj.data.policies, name);
    }
  }
}

// PARSE PROVIDER OBJECT AND CATEGORIZE BY TYPE
function isProvider(obj) {
  const type = obj.data.provider_type;
  const name = obj.data.name;

  if (type === "function-web-request") wrList.push(name);
  else if (["function-authscript", "form-authscript"].includes(type))
    authscriptList.push(name);
  else if (["email-local", "email-external"].includes(type))
    emailProviderList.push(name);
  else if (type === "user-external") idStoreProviderList.push(name);
  else if (type === "otp-external") otpGeneratorList.push(name);
  else if (type === "sms-external") smsProviderList.push(name);
}

// ADD SUBJOURNEY PROCEDURE NAMES
function isSubJourney(procedures) {
  procedures.forEach((proc) => subJourneyList.push(proc.name));
}

// ADD JOURNEY POLICY IDS (SCOPED TO APPLICATION)
function isJourney(policies, appName = "") {
  for (const policy of policies) {
    const journeyId = policy.policy_id;

    // Track the journey name with the app
    if (appName) {
      journeyList.push(`${appName}: ${journeyId}`);
    } else {
      journeyList.push(journeyId);
    }

    // Now handle non-disabled versions
    if (Array.isArray(policy.versions)) {
      policy.versions.forEach((v) => {
        if (v.state !== "disabled") {
          journeyVersionsList.push({
            app: appName,
            policy: journeyId,
            version: v.version_id,
          });
        }
      });
    }
  }
}

// OUTPUT SELECTED FORMAT
function exportReports() {
  // Build data for reports
  const counts = [
    ["Category", "Count"],
    ["Applications", applicationList.length],
    ["Server API Applications", serverApiList.length],
    ["Web Applications", webAppList.length],
    ["Mobile Applications", mobileAppList.length],
    ["OIDC Applications", oidcAppList.length],
    ["SAML Applications", samlAppList.length],
    ["Web Request ECs", wrList.length],
    ["AuthScript ECs", authscriptList.length],
    ["Journeys", journeyList.length],
    ["Journey Versions (enabled only)", journeyVersionsList.length],
    ["SubJourneys", subJourneyList.length],
    ["Email Provider ECs", emailProviderList.length],
    ["Identity Store ECs", idStoreProviderList.length],
    ["OTP Generator ECs", otpGeneratorList.length],
    ["SMS Providers", smsProviderList.length],
  ];

  const components = [["Category", "Name/Mapping"]];
  const appendList = (label, list) =>
    list.forEach((item) => components.push([label, item]));

  appendList("Applications", applicationList);
  appendList("Server API", serverApiList);
  appendList("Web App", webAppList);
  appendList("Mobile App", mobileAppList);
  appendList("OIDC App", oidcAppList);
  appendList("SAML App", samlAppList);
  appendList("Web Request EC", wrList);
  appendList("AuthScript EC", authscriptList);
  appendList("Journey", journeyList);
  appendList("SubJourney", subJourneyList);
  appendList("Email Provider", emailProviderList);
  appendList("Identity Store", idStoreProviderList);
  appendList("OTP Generator", otpGeneratorList);
  appendList("SMS Provider", smsProviderList);
  journeyVersionsList.forEach((v) => {
    components.push([
      "Journey Version",
      `${v.app}: ${v.policy} (v${v.version})`,
    ]);
  });

  // === XLSX Export ===
  if (outputType === "xlsx") {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(counts),
      "Counts"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(components),
      "Components"
    );
    XLSX.writeFile(workbook, `${reportPrefix}.xlsx`);
    console.log(`Wrote ${reportPrefix}.xlsx`);
  }

  // === CSV Export ===
  if (outputType === "csv") {
    const csvCounts = counts.map((row) => row.join(",")).join("\n");
    const csvComponents = components.map((row) => row.join(",")).join("\n");
    fs.writeFile(`${reportPrefix}_counts.csv`, csvCounts);
    fs.writeFile(`${reportPrefix}_components.csv`, csvComponents);
    console.log(`Wrote ${reportPrefix}_counts.csv and _components.csv`);
  }

  // === JSON Export ===
  if (outputType === "json") {
    // === Build grouped journey version map ===
    const groupedJourneyVersions = {};

    journeyVersionsList.forEach(({ app, policy, version }) => {
      if (!groupedJourneyVersions[app]) {
        groupedJourneyVersions[app] = {};
      }
      if (!groupedJourneyVersions[app][policy]) {
        groupedJourneyVersions[app][policy] = [];
      }
      groupedJourneyVersions[app][policy].push(version);
    });

    const jsonOutput = {
      counts: Object.fromEntries(counts.slice(1)), // remove header row
      journeyVersionsCount: journeyVersionsList.length,
      journeyVersions: journeyVersionsList,
      journeyVersionsGrouped: groupedJourneyVersions,
      components: {
        applications: applicationList,
        serverApi: serverApiList,
        webApp: webAppList,
        mobileApp: mobileAppList,
        oidcApp: oidcAppList,
        samlApp: samlAppList,
        webRequestEC: wrList,
        authScriptEC: authscriptList,
        journeys: journeyList,
        subJourneys: subJourneyList,
        emailProviders: emailProviderList,
        idStoreProviders: idStoreProviderList,
        otpGenerators: otpGeneratorList,
        smsProviders: smsProviderList,
      },
    };
    fs.writeFile(`${reportPrefix}.json`, JSON.stringify(jsonOutput, null, 2));
    console.log(`Wrote ${reportPrefix}.json`);
  }

  // === Plain Text Export ===
  if (outputType === "txt") {
    const logMessages = [];
    // wrapper function "push" that populates logMessages array
    const push = (label, list) => {
      logMessages.push(`Number of ${label}: ${list.length}`);
      //logMessages.push(`${label}: ${list.join(", ")}`);
    };

    push("Applications", applicationList);
    push("Server API Applications", serverApiList);
    push("Web Applications", webAppList);
    push("Mobile Applications", mobileAppList);
    push("OIDC Applications", oidcAppList);
    push("SAML Applications", samlAppList);
    push("Web Request ECs", wrList);
    push("AuthScript ECs", authscriptList);
    push("Journeys", journeyList);
    logMessages.push(
      `Number of Journey Versions (enabled only): ${journeyVersionsList.length}`
    );
    push("SubJourneys", subJourneyList);
    push("Email Provider ECs", emailProviderList);
    push("Identity Store ECs", idStoreProviderList);
    push("OTP Generator ECs", otpGeneratorList);
    push("SMS Providers", smsProviderList);
    const txtOutput = logMessages.join("\n") + "\n";
    fs.writeFile(`${reportPrefix}.txt`, txtOutput);
    console.log(`Wrote ${reportPrefix}.txt`);
  }
}

// MAIN EXECUTION
function main() {
  getJsonFromFile().then(() => {
    exportReports();
  });
}

main();
