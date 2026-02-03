//const { GoogleGenAI } = require("@google/genai");
//const PromptResult = require("../models/PromptResults")
const cloudinary = require("../middleware/cloudinary");
const Client = require("../models/Client")
const PdfDocs = require("../models/PdfDocs")

////
const fs = require("fs");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const vision = require("@google-cloud/vision");
const { Storage } = require("@google-cloud/storage");
const cloudinary = require("../middleware/cloudinary");
const PdfDocs = require("../models/PdfDocs");

const visionClient = new vision.ImageAnnotatorClient();
const storage = new Storage();



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
          if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
          }
      
          // Upload PDF to Cloudinary
          const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "raw",
            folder: "pdf_docs",
          });
      
          await PdfDocs.create({
            title: req.body.title,
            fileUrl: result.secure_url,
            cloudinaryId: result.public_id,
            client: req.params.id,
            user: req.user.id,
          });
      
          console.log("PDF document uploaded");
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