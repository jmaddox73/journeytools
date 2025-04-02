const exp = require("constants");
const fs = require("fs");
function getJsonFromFile(str) {
  return new Promise((resolve, reject) => {
    fs.readFile(str, "utf8", (err, json) => {
      if (err) {
        console.log("File read failed:", err);
        reject(err);
        return;
      }
      try {
        const config = JSON.parse(json);
        resolve(config);
      } catch (err) {
        console.log("Error parsing JSON string:", err);
      }
    });
  });
}
module.exports = { getJsonFromFile };
