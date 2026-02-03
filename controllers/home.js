//const { GoogleGenAI } = require("@google/genai");
//const PromptResult = require("../models/PromptResults")
const cloudinary = require("../middleware/cloudinary");
const Client = require("../models/Client")
const PdfDocs = require("../models/PdfDocs")

////////////////
const fs = require("fs");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const vision = require("@google-cloud/vision");
const { Storage } = require("@google-cloud/storage");
const cloudinary = require("../middleware/cloudinary");
const PdfDocs = require("../models/PdfDocs");

const visionClient = new vision.ImageAnnotatorClient();
const storage = new Storage();

//Extract text via pdfjs
async function extractPdfText(filePath) {
  const loadingTask = pdfjsLib.getDocument(filePath);
  const pdf = await loadingTask.promise;

  let pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(i => i.str).join(" ");

    pages.push({
      page: i,
      text,
    });
  }

  return pages;
}

//Decide of OCR is needed
function needsOCR(pages) {
  const totalText = pages.map(p => p.text).join("");
  return totalText.length < 300;
}


//OCR GOGGLE VISION
async function runVisionOCR(localPath, bucketName) {
  const fileName = `ocr/${Date.now()}.pdf`;

  await storage.bucket(bucketName).upload(localPath, {
    destination: fileName,
  });

  const request = {
    requests: [
      {
        inputConfig: {
          gcsSource: { uri: `gs://${bucketName}/${fileName}` },
          mimeType: "application/pdf",
        },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        outputConfig: {
          gcsDestination: { uri: `gs://${bucketName}/output/` },
        },
      },
    ],
  };

  const [operation] =
    await visionClient.asyncBatchAnnotateFiles(request);
  await operation.promise();

  const [files] = await storage
    .bucket(bucketName)
    .getFiles({ prefix: "output/" });

  let ocrText = "";

  for (const file of files) {
    const [contents] = await file.download();
    const data = JSON.parse(contents.toString());
    ocrText += data.responses[0].fullTextAnnotation.text;
  }

  return ocrText;
}

//////////////////
module.exports = {
    getIndex: (req,res)=>{
        res.render('index.ejs')
    },

    getProfile: (req,res) => {
        res.render('profile.ejs')
    },
    getNewClient: (req,res) => {
        res.render('newClient.ejs')
    },
    postNewClient: async (req,res) => {
        try{
            console.log(req.body)
            await Client.create({
                firstName: req.body.fName,
                lastName: req.body.lName,
                address: req.body.address,
                phoneNumber: req.body.phoneNumber,
                createdBy: req.user,
            })
           
            console.log("Created Client")
             res.redirect('/getExistingClients')
        }catch (err){
        console.log(err)
     }
    },
    getExistingClients: async (req,res) => {
        console.log(req.user._id)

        const myClients = await Client.find({createdBy: req.user._id})
        console.log(myClients)



        res.render('existingClients.ejs', ({myClients: myClients}))
    },
    getClientPage: async (req,res) => {
        
        //const client = await Client.findById(req.params.id)
        //console.log(client)
        //client: client
    

        res.render('clientPage.ejs', {clientId: req.params.id, })
    },
    getNewDocs: async (req,res) => {
        res.render('newDocs.ejs', {clientId: req.params.id})
    },
    postPdfDocs: async (req, res) => {
        try {
          const localPath = req.file.path;
        
          // 1. Extract text
          const pages = await extractPdfText(localPath);
        
          let finalText = "";
        
          // 2. OCR fallback
          if (needsOCR(pages)) {
            finalText = await runVisionOCR(
              localPath,
              process.env.GCS_BUCKET
            );
          } else {
            finalText = pages.map(p => p.text).join("\n");
          }
      
          // 3. Upload PDF
          const upload = await cloudinary.uploader.upload(localPath, {
            resource_type: "raw",
            folder: "pdf_docs",
          });
      
          // 4. Store metadata + raw text
          await PdfDocs.create({
            title: req.body.title,
            fileUrl: upload.secure_url,
            cloudinaryId: upload.public_id,
            rawText: finalText,
            client: req.params.id,
            user: req.user.id,
          });
      
          fs.unlinkSync(localPath); // cleanup
      
          res.redirect("back");
        } catch (err) {
          console.error(err);
          res.status(500).json({ error: err.message });
        }
        },


    getExistingDocs: async (req,res) => {
        //pDF files by client, sorted by time created
       const Pdfs = await PdfDocs.find({client:req.params.id}).sort({createdAt: "asc"})
       console.log(Pdfs)


        res.render('existingDocs.ejs', {clientId: req.params.id, pdfDocs: Pdfs})
    },
    postAnalyzeDocs: async (req,res) => {
        try{
            const client = req.params.id
            console.log(client)



            console.log("Pdf analyzed")
            res.redirect(`/existingdocs/${req.params.id}`);
        } catch (err) {
            console.log(err)
        }

    },
    getAnalytics: async (req,res) => {
        res.render('analytics.ejs', {clientId: req.params.id})
    },
    getGraphs: async (req,res) => {
        res.render('graphs.ejs', {clientId: req.params.id})
    },




    
    //getPrompt: async (req,res) => {
//
    //    const Prompts = await PromptResult.find().sort({createdAt: "asc"})
    //    //console.log(Prompts)
//
//
    //    res.render('prompt.ejs', {myResults: Prompts})
    //},
//
    //postPrompt: async (req,res) =>{
//
    //    //console.log(req.body.prompt)
    //    const company = req.body.company
    //    const prompt = req.body.prompt
//
    // try{
    //    //contents: `I want to get hired in Tech as a software engineer. I'm using information from employees profiles to craft a message as an introduction to start a conversation and become more familiar with them, I will input information from persons biography or other information and I would like you to give me a few responses, one is super professional and related to something that may have happened with tech or their specific company, second is a witty response based on something personal in the profile, and the third is a reponse that is funny based on pop culture or some recent social media phenomenons. I want it to be a few sentences to a paragraph for each response. seperated by the words 'professional, witty, and funny' followed by each response. Here is the company: ${company} Here is the information: ${prompt}`,
    //    const ai = new GoogleGenAI({apikey: process.env.GOOGLE_API_KEY});
//
    //    async function main() {
    //    const responseOne = await ai.models.generateContent({
    //    model: "gemini-2.5-flash",
    //    contents: `I want to get hired in Tech as a software engineer. I'm using information from employees profiles to craft a message as an introduction to start a conversation and become more familiar with them, I will input information from a persons biography or other information and I would like you to give me a response that is super professional and related to something that may have happened with tech or their specific company. I want it to be a few sentences to a paragraph. Start with the word 'Professional' then respond. Here is the company: ${company} Here is the information: ${prompt}`,
    //    });
//
    //    const responseTwo = await ai.models.generateContent({
    //    model: "gemini-2.5-flash",
    //    contents: `I want to get hired in Tech as a software engineer. I'm using information from employees profiles to craft a message as an introduction to start a conversation and become more familiar with them, I will input information from a persons biography or other information and I would like you to give me a response that is a witty response based on something personal in the profile. I want it to be a few sentences to a paragraph. Start with the word 'Witty' then respond. Here is the company: ${company} Here is the information: ${prompt}`,
    //    });
//
    //    const responseThree = await ai.models.generateContent({
    //    model: "gemini-2.5-flash",
    //    contents: `I want to get hired in Tech as a software engineer. I'm using information from employees profiles to craft a message as an introduction to start a conversation and become more familiar with them, I will input information from a persons biography or other information and I would like you to give me a response that is funny and based on pop culture or some recent social media phenomenons. I want it to be a few sentences to a paragraph. Start with the word 'Funny' then respond. Here is the company: ${company} Here is the information: ${prompt}`,
    //    });
//
    //    console.log(responseOne.text);
    //    console.log(responseTwo.text);
    //    console.log(responseThree.text);
//
//
//
    //    await PromptResult.create({
    //        company: req.body.company,
    //        prompt: req.body.prompt,
    //        name: req.body.personName,
    //        professional: responseOne.text,
    //        witty: responseTwo.text,
    //        funny: responseThree.text,
    //    })
    //    }
//
    //    await main();
//
    //   
    //    res.redirect('/getPrompt')
    //    
//
    // } catch (err){
    //    console.log(err)
    // }
//
//
    //}
}