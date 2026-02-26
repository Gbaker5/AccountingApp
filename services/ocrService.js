const vision = require("@google-cloud/vision");
const { Storage } = require("@google-cloud/storage");
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
const visionClient = new vision.ImageAnnotatorClient(credentials);
const storage = new Storage(credentials);


//OCR GOGGLE VISION
async function runVisionOCR(localPath, bucketName) {
  console.log("OCR used")
  const timestamp = Date.now();
  const inputName = `ocr/input-${timestamp}.pdf`;
  const outputPrefix = `ocr/output-${timestamp}/`;

  // 1️⃣ Upload PDF
  await storage.bucket(bucketName).upload(localPath, {
    destination: inputName,
    contentType: "application/pdf",
  });

  // 2️⃣ OCR request
  const request = {
    requests: [
      {
        inputConfig: {
          gcsSource: { uri: `gs://${bucketName}/${inputName}` },
          mimeType: "application/pdf",
        },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        outputConfig: {
          gcsDestination: {
            uri: `gs://${bucketName}/${outputPrefix}`,
          },
        },
      },
    ],
  };

  const [operation] =
    await visionClient.asyncBatchAnnotateFiles(request);
  await operation.promise();

  // 3️⃣ Read OCR output files
  const [files] = await storage
    .bucket(bucketName)
    .getFiles({ prefix: outputPrefix });

  let ocrText = "";

  for (const file of files) {
    const [contents] = await file.download();
    const json = JSON.parse(contents.toString());

    if (!json.responses) continue;

    for (const res of json.responses) {
      if (res.fullTextAnnotation?.text) {
        ocrText += res.fullTextAnnotation.text + "\n";
      }
    }
  }

  return ocrText.trim();
}

module.exports = { runVisionOCR };