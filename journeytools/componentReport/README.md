# CIAM Component Export Analyzer

A Node.js tool for analyzing CIAM export JSON files and generating reports about applications, policies, subjourneys, and other provider components.

Stored in the GitHub repository `journeytools` under the folder `componentReport/`.

---

## ✨ Features
- Parses a CIAM component JSON export
- Identifies and counts:
  - Applications by type (web, mobile, API, OIDC, SAML)
  - Providers (email, SMS, authscript, etc.)
  - SubJourneys and Journeys
  - Journey versions (excluding disabled versions)
- Outputs reports in one of the following formats:
  - CSV
  - XLSX (Excel)
  - JSON
  - Plain text (TXT)
- Supports grouped output of journey versions by application and policy

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-org/journeytools.git
cd journeytools/componentReport
```

### 2. Install dependencies
```bash
npm install
```
This installs required packages, including:
- `xlsx` for Excel file generation
- Node.js built-in `fs` and `path` modules are used

---

## 🌐 Requirements
- Node.js v14+ (recommended: v18+)
- A valid CIAM export JSON file (usually containing an `exports` array with applications, providers, etc.)

---

## 🔧 Usage

### Basic command
```bash
node componentCount.js <inputFile.json> <outputType>
```

### Arguments
| Argument           | Description                                                   |
|--------------------|---------------------------------------------------------------|
| `<inputFile.json>` | Path to your CIAM JSON export file                           |
| `<outputType>`     | One of: `csv`, `xlsx`, `json`, `txt`                         |

### Examples
```bash
node componentCount.js ciam_mobile.json csv
node componentCount.js ciam_mobile.json xlsx
```

### Help command
```bash
node componentCount.js -h
node componentCount.js --help
```
Displays usage instructions and argument options.

---

## 📄 Output Files
All output files are named using the input filename + `componentReport`, for example:

For `ciam_mobile.json`:
- `ciam_mobile_componentReport.csv`
- `ciam_mobile_componentReport_counts.csv`
- `ciam_mobile_componentReport_components.csv`
- `ciam_mobile_componentReport.json`
- `ciam_mobile_componentReport.xlsx`
- `ciam_mobile_componentReport.txt`

---

## 📊 Output Structure

### JSON Output Example
```json
{
  "counts": {
    "Applications": 4,
    "Journeys": 3,
    "Journey Versions (enabled only)": 5,
    ...
  },
  "journeyVersionsCount": 5,
  "journeyVersions": [
    { "app": "App1", "policy": "login", "version": "v1" }
  ],
  "journeyVersionsGrouped": {
    "App1": {
      "login": ["v1", "v2"]
    }
  },
  "components": {
    "applications": [...],
    "subJourneys": [...],
    ...
  }
}
```

---

## 📂 Script Reference

### `mainRead.js`
> (Optional dependency if used in your project)
This script is expected to export a helper function to read and parse a JSON file. Example:
```js
module.exports.getJsonFromFile = function(filePath) {
  return fs.promises.readFile(filePath, 'utf8')
    .then(data => JSON.parse(data));
};
```
If `mainRead.js` is not used, the main script handles JSON parsing directly.

### `componentCount.js`
This is the main script that:
- Accepts input JSON and output format as command-line arguments
- Extracts all relevant CIAM components
- Counts and categorizes by type
- Extracts policies and their version mappings
- Filters out disabled versions
- Groups versions under policies and apps
- Generates the output report in the specified format

---

## 🚫 Known Limitations
- Only non-disabled journey versions are counted and mapped
- Assumes structure of JSON export matches typical CIAM schema
- Output folder is current working directory (no custom output path yet)

---

## ✅ Future Improvements
- Add support for multiple formats in one run (e.g. `csv,json`)
- Output to a custom directory
- Group subJourneys by root applications

---

## 🙌 Contributing
Feel free to fork and submit a PR or open issues if you'd like to improve or extend the tool!

---

## 🌟 License
MIT License

