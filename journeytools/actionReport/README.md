# actionCounter

This tool analyzes a CIAM (Customer Identity and Access Management) export JSON file and calculates metrics related to subjourney (procedure) and journey (policy) complexity — specifically the number of actions configured inside each.

---

## 📦 Features

- Counts all **subjourneys** and **journeys** (policies)
- Recursively counts actions in each subjourney (`action` key)
- Recursively counts actions in each policy workflow (`metadata` key)
- **Ignores disabled journey (policy) versions** — only enabled versions are considered
- Outputs to either **JSON** or **CSV**
- Displays summary metrics:
  - Total procedure count
  - Max actions in a subjourney
  - Max actions in a journey
  - Average action counts across all

---

## 🧰 Requirements

- Node.js (v14+ recommended)
- NPM modules:
  - `json2csv` for CSV export

Install dependencies by running:

```bash
npm install json2csv
```

---

## 🚀 Usage

From within the `actionCounter/` directory:

```bash
node actionCounter.js <inputFile.json> <json|csv>
```

### Arguments

| Argument             | Description                                                  |
|----------------------|--------------------------------------------------------------|
| `<inputFile.json>`   | CIAM export file to process                                  |
| `json`               | Output results as a `.json` file                             |
| `csv`                | Output results as a `.csv` file                              |
| `-h`, `--help`       | Display usage instructions                                   |

---

## 📂 Output

- If `json` is selected:  
  Outputs a structured JSON with counts, lists, and summary:

  ```json
  {
    "procedureCount": 46,
    "procedureActions": [...],
    "actionsUnderPolicies": {...},
    "report": {
      "maxProcedure": {...},
      "maxPolicy": {...},
      "averageProcedureActions": ...,
      "averagePolicyActions": ...
    }
  }
  ```

- If `csv` is selected:  
  Output includes one flat CSV file with columns:
  ```
  Category, Name, Actions
  ```

---

## 📝 Notes

- For journeys, only versions with `"state" !== "disabled"` are considered.
- Each `"metadata"` object in a workflow is counted as a policy action.
- Each `"action"` key in a subjourney is counted as a subjourney action.

---

## 📁 Example

```bash
node actionCounter.js ciam_mobile.json json
# ➜ creates: ciam_mobile_actionCount.json

node actionCounter.js ciam_mobile.json csv
# ➜ creates: ciam_mobile_actionCount.csv
```

---

## 📌 License

MIT
