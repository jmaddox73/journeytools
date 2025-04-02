# Action Counter for CIAM JSON Exports

This script analyzes a CIAM (Customer Identity and Access Management) JSON export file and reports:

- The number of procedures (subjourneys)
- The number of `action` objects within each procedure
- The number of `metadata` actions within journey (policy) workflows
- Summary statistics such as the max and average action counts

It supports output in either JSON or CSV format based on user input.

---

## 📁 Directory Structure

Place this script inside your project, e.g.:

```
journeytools/
└── actionReport/
    ├── actionCounter.js
    ├── ciam_mobile.json (your export file)
    └── README.md
```

---

## ✅ Requirements

- [Node.js](https://nodejs.org/) (v14+ recommended)
- NPM package: `json2csv`

You can install the dependency using:

```bash
npm install json2csv
```

---

## ✨ Usage

From the command line, run the script using:

```bash
node actionCounter.js <inputFile.json> <json|csv>
```

### Example

```bash
node actionCounter.js ciam_mobile.json json
node actionCounter.js ciam_mobile.json csv
```

---

## 📟 Arguments

| Argument            | Description                                         |
|---------------------|-----------------------------------------------------|
| `<inputFile.json>`  | Path to the CIAM export file you want to analyze    |
| `json`              | Output results in a JSON file                       |
| `csv`               | Output results in a CSV file                        |
| `-h`, `--help`      | Show help message and usage instructions            |

---

## 📄 Output Files

The output files are saved in the current directory and named using the input filename plus the suffix `_actionCount`.

### JSON Output

If `json` is selected, output is saved to:

```
<inputFile>_actionCount.json
```

The JSON includes:

- Total number of procedures
- Actions per procedure
- Actions per policy
- Summary report:
  - Max procedure
  - Max policy
  - Average actions per procedure
  - Average actions per policy

---

### CSV Output

If `csv` is selected, output is saved to:

```
<inputFile>_actionCount.csv
```

The CSV includes:

| Category   | Name                           | Actions |
|------------|--------------------------------|---------|
| SubJourney | SJ_ENROLL_CUSTOMER_V1         | 22      |
| Journey    | AUTHENTICATION_MFA            | 10      |
| Summary    | Max SubJourney                | ENROLL_PASSCODE (51) |
| Summary    | Avg Journey Actions           | 26.3    |
| ...        | ...                            | ...     |

---

## 🔍 What Does It Analyze?

- **Subjourneys**: Looks for `"action"` keys to determine how many logical steps are defined in each procedure.
- **Journeys (Policies)**: Analyzes the first version of each policy's workflow and counts nodes with `"metadata"` defined.
- Only `"metadata"` and `"action"` objects are considered significant for the counts.

---

## 📦 Example Output (JSON)

```json
{
  "procedureCount": 46,
  "procedureActions": [
    { "procedureName": "SJ_LOGIN", "actionCount": 18 },
    { "procedureName": "SJ_REGISTER", "actionCount": 24 }
  ],
  "actionsUnderPolicies": {
    "LOGIN_POLICY": 10,
    "REGISTER_POLICY": 14
  },
  "report": {
    "maxProcedure": {
      "procedureName": "SJ_REGISTER",
      "actionCount": 24
    },
    "maxPolicy": {
      "policyId": "REGISTER_POLICY",
      "actionCount": 14
    },
    "averageProcedureActions": 21,
    "averagePolicyActions": 12
  }
}
```

---

## 👨‍💻 Author

Jeff Maddox  
MIT License

