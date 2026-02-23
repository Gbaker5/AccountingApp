document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("generateInsights");
  if (!btn) return;

  const clientId = btn.dataset.clientId;
  const output = document.getElementById("aiOutput");

  btn.addEventListener("click", async () => {
    try {
      btn.disabled = true;
      btn.innerText = "Generating…";
      output.innerHTML = "<p>Thinking…</p>";

      const res = await fetch(
        `/analytics/${clientId}/ai-insight`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await res.json();

      output.innerHTML = data.insights;
      btn.innerText = "Regenerate AI Insights";
      btn.disabled = false;

    } catch (err) {
      console.error(err);
      output.innerHTML = "<p>Failed to generate insights.</p>";
      btn.disabled = false;
      btn.innerText = "Generate AI Insights";
    }
  });
});
