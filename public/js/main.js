
const form = document.getElementById("uploadForm");
const loading = document.getElementById("loading");

if (form && loading) {
  form.addEventListener("submit", () => {
    loading.classList.remove("hidden");
  });
}

///////CHARTS

