document.addEventListener("DOMContentLoaded", () => {
  const data = window.ANALYTICS_DATA;
  if (!data) return;

   // 🔥 NORMALIZE largestTransactions HERE
  const largestTxs = (data.largestTransactions || [])
    .map(doc => doc.transactions)
    .filter(tx => tx && typeof tx.amount === "number");

  // Expose if you want to reuse elsewhere
  data._largestTxs = largestTxs;

  // Toggle helper
  window.toggleChart = function (id) {
    const el = document.getElementById(id);
    el.style.display = el.style.display === "none" ? "block" : "none";
  };

  // Income vs Expenses
  new Chart(document.getElementById("incomeExpenseChart"), {
    type: "bar",
    data: {
      labels: ["Income", "Expenses"],
      datasets: [{
        data: [data.summary.income, data.summary.expenses],
      }],
    },
  });

  // Category Breakdown
  new Chart(document.getElementById("categoryChart"), {
    type: "pie",
    data: {
      labels: data.categoryTotals.map(c => c._id),
      datasets: [{
        data: data.categoryTotals.map(c => c.total),
      }],
    },
  });

  // Trend Chart
  new Chart(document.getElementById("trendChart"), {
    type: "line",
    data: {
      labels: data.trends.map(t => t._id),
      datasets: [
        {
          label: "Income",
          data: data.trends.map(t => t.income),
        },
        {
          label: "Expenses",
          data: data.trends.map(t => t.expenses),
        },
      ],
    },
  });

  // ✅ LARGEST EXPENSES CHART (MOVED INSIDE)
  if (data._largestTxs.length) {
  const labels = data._largestTxs.map(tx =>
    `${tx.merchant} (${tx.date})`
  );

  const amounts = data._largestTxs.map(tx => tx.amount);

    new Chart(document.getElementById("largestExpensesChart"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Largest Expenses",
            data: amounts,
          },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: {
          legend: { display: false },
        },
      },
    });
  }
});
