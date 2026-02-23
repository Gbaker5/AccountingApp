const PdfDocs = require("../models/PdfDocs");

async function computeAnalytics(clientId) {

    // 1️⃣ Unwind transactions
  const basePipeline = [
    { $match: { client: clientId } },
    { $unwind: "$transactions" },
  ];

        // 2️⃣ Income vs Expenses (overall)

  const summaryPipeline = [
    ...basePipeline,
    {
      $group: {
        _id: null,
        income: {
          $sum: {
            $cond: ["$transactions.deposit", "$transactions.amount", 0],
          },
        },
        expenses: {
          $sum: {
            $cond: ["$transactions.withdrawal", "$transactions.amount", 0],
          },
        },
      },
    },
    {
      $addFields: {
        net: { $subtract: ["$income", "$expenses"] },
      },
    },
  ];

  const [summaryResult] = await PdfDocs.aggregate(summaryPipeline);
  const summary = summaryResult || { income: 0, expenses: 0, net: 0 };

        // 3️⃣ Expenses by category

  const categoryPipeline = [
    ...basePipeline,
    { $match: { "transactions.withdrawal": true } },
    {
      $group: {
        _id: "$transactions.category",
        total: { $sum: "$transactions.amount" },
      },
    },
    { $sort: { total: -1 } },
  ];

  const categoryTotals = await PdfDocs.aggregate(categoryPipeline);

      // 4️⃣ Largest expenses

  const largestPipeline = [
    ...basePipeline,
    { $match: { "transactions.withdrawal": true } },
    { $sort: { "transactions.amount": -1 } },
    { $limit: 10 },
  ];

  const largestTransactions = await PdfDocs.aggregate(largestPipeline);

        // 5️⃣ Monthly trend

  const trendPipeline = [
    ...basePipeline,
    {
      $addFields: {
        month: { $substr: ["$transactions.date", 0, 7] },
      },
    },
    {
      $group: {
        _id: "$month",
        income: {
          $sum: {
            $cond: ["$transactions.deposit", "$transactions.amount", 0],
          },
        },
        expenses: {
          $sum: {
            $cond: ["$transactions.withdrawal", "$transactions.amount", 0],
          },
        },
      },
    },
    {
      $addFields: {
        net: { $subtract: ["$income", "$expenses"] },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const trends = await PdfDocs.aggregate(trendPipeline);

  return {
    summary,
    categoryTotals,
    largestTransactions,
    trends,
  };
}

module.exports = { computeAnalytics };
