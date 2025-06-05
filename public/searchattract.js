// Function for connecting to the microservice to find attractions
async function connectToMicroserviceC(){
    // Connection URL
    const url = `http://localhost:5004/attract?${}`; // enter parameters here
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
        // Return hotels found
        return data.attractions;
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

        const cityName = document.getElementById("city");

    });
});