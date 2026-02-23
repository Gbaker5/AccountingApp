const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const { categorizeByMerchant } = require("./categorizationService");
const { categorizeWithAI } = require("./categoryAiService");



///OPENAI analyzing raw text and sending back json
async function analyzeTransactions(rawText) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini", // fast + cheap + accurate
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are an accounting assistant that extracts structured financial data.",
      },
      {
        role: "user",
        content: `
        Extract all financial transactions from the text below.

        For EACH transaction, return an object with ALL of the following fields:
              
        - date: ISO format YYYY-MM-DD
        - merchant: the business or payee name
        - amount: number (no currency symbols)
        - deposit: boolean
        - withdrawal: boolean
        - category: string (use "Uncategorized")
 
              
        Category rules:
        
              
        Deposit / Withdrawal rules:
        - deposit MUST be true if the transaction represents money coming IN
        - withdrawal MUST be true if the transaction represents money going OUT
        - Exactly ONE of deposit or withdrawal must be true
        - The other MUST be false
        - Never set both to true
        - Never set both to false
              
        Merchant rules:
        - merchant MUST ALWAYS be present
        - If unclear, infer the most likely merchant
        - If it cannot be inferred, use "Unknown"
              
        General rules:
        - Do NOT omit any field
        - Do NOT merge transactions
        - Do NOT invent transactions
        - Return ONLY valid JSON
        - No markdown
        - No explanations
              
        Text:
        """
        ${rawText}
        """

                `,
              },
            ],
          });
      
          const content = response.choices[0].message.content;
      
          return JSON.parse(content);
        }


// 2️⃣ FULL PIPELINE — extraction + rules + AI categorization

async function processTransactions(rawText) {
  // 1️⃣ Call your existing extraction function
  const transactions = await analyzeTransactions(rawText);
  console.log("EXTRACTED TX COUNT:", transactions?.length);
  console.log("EXTRACTED TX SAMPLE:", transactions?.[0]);

  // 2️⃣ Loop through extracted transactions
  for (const tx of transactions) {
    // Try merchant rules first
    const ruleResult = categorizeByMerchant(tx);

    if (ruleResult) {
      tx.category = ruleResult.category;
      tx.confidence = ruleResult.confidence;
      continue;
    }

    // 3️⃣ If still Uncategorized → second AI call
    if (tx.category === "Uncategorized") {
      const aiResult = await categorizeWithAI(tx);
      tx.category = aiResult.category;
      tx.confidence = aiResult.confidence;
    }
  }

  return transactions;
}

module.exports = {
  analyzeTransactions,   // optional / internal use
  processTransactions    // THIS is what your app should call
};