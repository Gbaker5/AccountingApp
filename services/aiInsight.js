const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildClientContext({ client, profile, aggregates }) {
  return `
 You are a financial analysis assistant.

OUTPUT RULES (IMPORTANT):
- Respond ONLY in valid HTML
- Use <p> for paragraphs
- Use <ul><li> for lists
- Do NOT include <html>, <head>, or <body>
- Do NOT use markdown
- Do NOT wrap everything in one paragraph

CONTENT STRUCTURE:
- Section headers using <h3>
- Spacing using separate <p> tags


==============================
CLIENT OVERVIEW
==============================
Name: ${client.firstName} ${client.lastName}

------------------------------
FINANCIAL SNAPSHOT
------------------------------
Monthly Income: $${profile.financialSnapshot?.monthlyIncome ?? "Unknown"}
Monthly Expenses: $${profile.financialSnapshot?.monthlyExpenses ?? "Unknown"}
Risk Tolerance: ${profile.financialSnapshot?.riskTolerance ?? "Unknown"}

------------------------------
AGGREGATE ANALYSIS
------------------------------
Total Income: $${aggregates.summary?.income ?? "N/A"}
Total Expenses: $${aggregates.summary?.expenses ?? "N/A"}
Net Cash Flow: $${aggregates.summary?.net ?? "N/A"}

Top Spending Categories:
${aggregates.categoryTotals?.length
  ? aggregates.categoryTotals.map(c =>
      `- ${c.category}: $${c.total}`
    ).join("\n")
  : "No category data available."
}

Largest Transactions:
${aggregates.largestTransactions?.length
  ? aggregates.largestTransactions.map(tx =>
      `- ${tx.merchant}: $${tx.amount}`
    ).join("\n")
  : "No large transactions found."
}

------------------------------
CLIENT GOALS
------------------------------
${profile.goals?.length
  ? profile.goals.map(goal => `
Goal Type: ${goal.goalType}
Target Amount: $${goal.targetAmount}
Target Date: ${goal.targetDate}
Priority: ${goal.priority}
Notes: ${goal.notes || "None"}
`).join("\n------------------------------\n")
  : "No goals defined."
}

------------------------------
AI INSIGHTS & RECOMMENDATIONS
------------------------------
Provide:
- Observed spending trends
- Risks or red flags
- Actionable recommendations
- Suggestions aligned with the client's goals



Generate clean, readable HTML now.
`;
}

async function getAIInsights(context) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [{ role: "user", content: context }],
    temperature: 0.3,
  });

  return completion.choices[0].message.content;
}

module.exports = {
  buildClientContext,
  getAIInsights,
};
