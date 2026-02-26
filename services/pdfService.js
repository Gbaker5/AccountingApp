const fs = require("fs");
const pdfParse = require("pdf-parse");


//Extract text via pdfjs
async function extractPdfText(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  console.log(data.text)

  return {
    text: data.text || "",
    numPages: data.numpages,
  };
}


//Decide if OCR is needed
function needsOCR(text) {
  //console.log("OCR used")
  return text.trim().length < 300;
}

module.exports = {
  extractPdfText,
  needsOCR,
};
