//const { GoogleGenAI } = require("@google/genai");
//const PromptResult = require("../models/PromptResults")
const fs = require("fs");
const cloudinary = require("../middleware/cloudinary");
const Client = require("../models/Client")
const PdfDocs = require("../models/PdfDocs")
const {extractPdfText,needsOCR,} = require("../services/pdfService");
const { runVisionOCR } = require("../services/ocrService");
const { processTransactions } = require("../services/aiService");
const ClientProfile = require("../models/ClientProfile")
const {
  buildClientContext,
  getAIInsights
} = require("../services/aiInsight");
const {computeAnalytics} = require("../services/computeAnalytics");


//////////////////
module.exports = {
    getIndex: (req,res)=>{
        console.log("Index Page Loaded")
        res.render('index.ejs')
    },

    getProfile: (req,res) => {
        console.log("Profile Page Loaded")
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
        const client = await Client.findById(req.params.id)
        console.log(client)

        const myClients = await Client.find({createdBy: req.user._id})
        console.log(myClients)



        res.render('existingClients.ejs', ({myClients: myClients, client:client}))
    },
    getClientPage: async (req,res) => {
       console.log("Client Page Loaded");

  const client = await Client.findById(req.params.id);
  if (!client) {
    console.log("CLIENT NOT FOUND");
    return res.status(404).send("Client not found");
  }

  const profile = await ClientProfile.findOne({
    client: client._id
  });

  console.log("PROFILE FOUND:", profile);


        res.render('clientPage.ejs', {clientId: req.params.id, client: client, profile: profile})
    },
    updateClientPage: async (req, res) => {
  try {
    const clientId = req.params.id;
    console.log(clientId)

    const update = {
      $set: {
        client: clientId,
      }
    };

    // CONTACT INFO
    if (req.body.contact) {
      update.$set.contact = req.body.contact;
    }

    // FINANCIAL SNAPSHOT
    if (req.body.financialSnapshot) {
      update.$set.financialSnapshot = req.body.financialSnapshot;
    }

    // GOALS (append)
    if (req.body.goal) {
      update.$push = {
        goals: req.body.goal
      };
    }

    const updatedProfile = await ClientProfile.findOneAndUpdate(
      { client: clientId },
      update,
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    console.log("UPDATED PROFILE:", updatedProfile);

    res.status(200).json(updatedProfile);

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: "Failed to update client profile" });
  }
}
,
deleteGoal: async (req,res) =>{
    try {
    const clientId = req.params.id;
    const goalId = req.params.goalId;

    await ClientProfile.findOneAndUpdate(
      { client: clientId },
      {
        $pull: {
          goals: { _id: goalId }
        }
      }
    );

    res.redirect(`/clientPage/${clientId}`);

  } catch (err) {
    console.error("DELETE GOAL ERROR:", err);
    res.status(500).send("Failed to delete goal");
  }

},
    getNewDocs: async (req,res) => {
        const client = await Client.findById(req.params.id)
        console.log(client)
        
        res.render('newDocs.ejs', {clientId: req.params.id, client:client })
    },
    postPdfDocs: async (req, res) => {
        try {
          if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
          }
      
          const localPath = req.file.path;
      
          // Extract text via pdf-parse
          const { text } = await extractPdfText(localPath);
      
          let finalText = text;
      
          //  OCR fallback (Vision)
          if (needsOCR(text)) {
            finalText = await runVisionOCR(
              localPath,
              process.env.GCS_BUCKET_NAME
            );
          }
      
          //  Upload PDF to Cloudinary
          const result = await cloudinary.uploader.upload(localPath, {
            resource_type: "raw",
            folder: "pdf_docs",
          });
      
          //  Save document
         const pdfDoc = await PdfDocs.create({
            title: req.body.title,
            fileUrl: result.secure_url,
            cloudinaryId: result.public_id,
            client: req.params.id,
            user: req.user.id,
            rawText: finalText,
          });
      
      
          console.log("PDF uploaded + text extracted");


          //

            const transactions = await processTransactions(finalText);

            await PdfDocs.findByIdAndUpdate(pdfDoc._id, {
              transactions,
              analyzed: true,
            });

            console.log('File Analyzed')

        fs.unlinkSync(localPath);

        req.flash("success", "Document processed successfully ✔");

          res.redirect("back");
        } catch (err) {
          console.error(err);
          req.flash("error", "Failed to process document");
          res.status(500).json({ error: err.message });
        }
        },



    getExistingDocs: async (req,res) => {
        const client = await Client.findById(req.params.id)
        console.log(client)
        //pDF files by client, sorted by time created
       const Pdfs = await PdfDocs.find({client:req.params.id}).sort({createdAt: "asc"})
       //console.log(Pdfs)


        res.render('existingDocs.ejs', {clientId: req.params.id, pdfDocs: Pdfs, client:client})
    },
    getRawText: async (req, res) => {
  try {
    const pdf = await PdfDocs.findById(req.params.id).select("rawText title");

    if (!pdf) {
      return res.status(404).json({ error: "PDF not found" });
    }

    res.json({
      title: pdf.title,
      rawText: pdf.rawText,
    });
  } catch (err) {
    console.error("RAW TEXT ERROR:", err);
    res.status(500).json({ error: "Failed to load raw text" });
  }
},
   
    getAnalytics: async (req,res) => {
        
        try {

            const clientId = req.params.id;

            const client = await Client.findById(clientId)
            console.log(client)
            const profile = await ClientProfile.findOne({ client: clientId });


      
        const aggregates = await computeAnalytics(clientId);




      res.render("analytics.ejs", {
        //summary,                // income / expenses / net
        //categoryTotals,         // category totals
        //largestTransactions,    // biggest expenses
        //trends,                 // month-by-month
        ...aggregates,
        clientId: req.params.id,
        client:client,
        profile,
        //insights,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Analytics error");
    }




       
    },
    postAiInsight: async(req,res) =>{

    
  try {
    const clientId = req.params.id;

    const client = await Client.findById(clientId);
    const profile = await ClientProfile.findOne({ client: clientId });

    
    //const aggregates = {
    //  summary,
    //  categoryTotals,
    //  largestTransactions,
    //  trends,
    //};

    const aggregates = await computeAnalytics(clientId);


    const context = buildClientContext({
      client,
      profile,
      aggregates,
    });

    const insights = await getAIInsights(context);
    console.log(insights)

    res.json({ insights });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "Failed to generate AI insights" });
  }




    },
    getGraphs: async (req,res) => {
        const client = await Client.findById(req.params.id)
        console.log(client)


        res.render('graphs.ejs', {clientId: req.params.id, client:client})
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