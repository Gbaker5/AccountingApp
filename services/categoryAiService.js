const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function categorizeWithAI(tx) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a financial transaction categorization engine."
      },
      {
        role: "user",
        content: `
Categorize the following bank transaction.

Rules:
- You MUST choose exactly ONE category
- You may ONLY choose from the list
- "Other" is allowed ONLY if no reasonable category applies
- If unsure, choose the MOST LIKELY category
- NEVER default to "Other"

Transaction:
merchant: ${tx.merchant}
amount: ${tx.amount}
direction: ${tx.withdrawal ? "withdrawal" : "deposit"}

Categories:
Food, Travel, Entertainment, Utilities, Shopping, Income, Transfer, Fees, Bill, Other

Return JSON ONLY:
{
  "category": "",
  "confidence": 0.0
}
`
      }
    ]
  });

  //return JSON.parse(response.choices[0].message.content);

  let content = response.choices[0].message.content;

content = content
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

return JSON.parse(content);

}

module.exports = { categorizeWithAI };
