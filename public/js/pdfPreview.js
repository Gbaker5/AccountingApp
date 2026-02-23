document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("rawTextModal");
  const closeBtn = document.getElementById("closeModal");
  const content = document.getElementById("rawTextContent");
  const title = document.getElementById("modalTitle");

  document.querySelectorAll(".view-raw-text").forEach(button => {
    button.addEventListener("click", async () => {
      const pdfId = button.dataset.pdfId;

      content.textContent = "Loading...";
      title.textContent = "";

      modal.classList.remove("hidden");

      try {
        const res = await fetch(`/pdf/${pdfId}/raw-text`);
        const data = await res.json();

        title.textContent = data.title;
        content.textContent = data.rawText || "No raw text available.";
      } catch (err) {
        content.textContent = "Failed to load raw text.";
      }
    });
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
});
