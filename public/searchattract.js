// Function for connecting to the microservice to find attractions
async function connectToMicroserviceC(cityName){
    // Connection URL
    const url = `http://localhost:5004/attract?city=${cityName}`; 
    try {
        const response = await fetch(url, {
        method: 'GET'
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Attraction search error:", errorData);
            return null;
        }

        const data = await response.json();
       
        if (data.success)
            console.log("Found attractions!");
    // Connection to microservice failed
    } catch (error) {
        console.error("Failed to fetch attraction data:", error);
        return null;
    }
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

        const cityName = document.getElementById("city").value.trim();
        connectToMicroserviceC(cityName);
    });
});