// Log for confirming the itinerary number
console.log("Current Itinerary:" + localStorage.getItem("curr_itinerary"))

// Functions for opening/closing the help modal
function openModal() {
    document.getElementById("helpModal").style.display = "block";
}
function closeModal() {
    document.getElementById("helpModal").style.display = "none";
}
window.onclick = function(event) {
    const helpModal = document.getElementById("helpModal");
    const exchangeModal = document.getElementById("exchangeModal");

    if (event.target === helpModal) {
        helpModal.style.display = "none";
    }

    if (event.target === exchangeModal) {
        closeExchangeModal();
    }
};

// Functions for opening/closing the currency exchange modal
function openExchangeModal() {
    document.getElementById("exchangeModal").style.display = "block";
}
function closeExchangeModal() {
    document.getElementById("exchangeModal").style.display = "none";
    document.getElementById("usdAmount").value = "";
    document.getElementById("convertedResult").innerText = "";
}

// Function for converting the currency 
function convertCurrency() {
    const usd = parseFloat(document.getElementById("usdAmount").value);
    if (!isNaN(usd)) {
      const eur = (usd * exchangeRate).toFixed(2);
      document.getElementById("convertedResult").innerText = `${usd} USD = ${eur} EUR`;
    } else {
      document.getElementById("convertedResult").innerText = "Please enter a valid number.";
    }
}

// Function for returning the user to the welcome screen
function returnHome() {
    window.location.href = "welcome_view.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const itineraryKey = localStorage.getItem("curr_itinerary");
    // Departure / Arrival flight raw information
    const depRaw = localStorage.getItem("itinerary" + itineraryKey + "_flightdep");
    const arrivRaw = localStorage.getItem("itinerary" + itineraryKey + "_flightarriv");
    // Console log the flight raw information
    console.log("depRaw:", depRaw);
    console.log("arrivRaw:", arrivRaw);

    // If a flight has been chosen (with both the departure and arrival chosen)
    if (depRaw && arrivRaw) {
        try {
            // Attempt to parse the flight information
            const dep = JSON.parse(depRaw);
            const arriv = JSON.parse(arrivRaw);

            // Format time 
            const formatTime = (iso) => {
                const date = new Date(iso);
                return date.toLocaleString(undefined, {
                    weekday: "short", year: "numeric", month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit"
                });
            };

            // Define departure / arrival text
            const depText = `
                Outbound Flight:
                Airline: ${dep.airline}
                From: ${dep.from} at ${formatTime(dep.fromTime)}
                To: ${dep.to} at ${formatTime(dep.toTime)}
                Price: $${dep.price}
            `.trim();
            const arrivText = `
                Return Flight:
                Airline: ${arriv.airline}
                From: ${arriv.from} at ${formatTime(arriv.fromTime)}
                To: ${arriv.to} at ${formatTime(arriv.toTime)}
                Price: $${arriv.price}
            `.trim();

            // Set the element text to the parsed flight information
            document.getElementById("flightinfo").innerText = `${depText}\n\n${arrivText}`;
        } catch (e) {
            // An error occured parsing the flight information
            console.error("Failed to parse flight data:", e);
            document.getElementById("flightinfo").innerText = "Error loading flight information.";
        }
    } else {
        // No flight has been chosen yet
        document.getElementById("flightinfo").innerText = "No flights selected yet.";
    }
});
