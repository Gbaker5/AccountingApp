//I could add a manual way to enter transactions that occur repeatedly so that the searches are more custom to each client
//  or build an ai that recognizes them.

const MERCHANT_RULES = [
  { match: ["starbucks", "dunkin"], category: "Food" },
  { match: ["uber", "lyft"], category: "Travel" },
  { match: ["netflix", "spotify"], category: "Entertainment" },
  { match: ["walmart", "target"], category: "Shopping" },
  { match: ["venmo", "zelle"], category: "Transfer" }
];

function categorizeByMerchant(tx) {
  const name = tx.merchant.toLowerCase();

  for (const rule of MERCHANT_RULES) {
    if (rule.match.some(k => name.includes(k))) {
      return {
        category: rule.category,
        confidence: 0.95,
        source: "merchant_rule"
      };
    }
  }

  return null;
}

module.exports = { categorizeByMerchant };
