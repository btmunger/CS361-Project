async function connectToMicroserviceC(){
    
}

// On page load
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("attractSearchForm");
  if (!form) {
    console.error("Attraction search form not found.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cityName = document.getElementById("city");

  });
});