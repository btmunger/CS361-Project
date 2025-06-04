function confirmDelete(itinerary, event) {
    event.stopPropagation();  // Prevent event from bubbling up to the card click event
    const confirmDelete = confirm("Are you sure you want to delete this itinerary forever?");
    if (confirmDelete) {
        document.getElementById("createnew" + itinerary).style.visibility = "visible";
        document.getElementById("card" + itinerary).className = "card empty";
        document.getElementById("card" + itinerary + "_content").style.visibility = "hidden";
        document.getElementById("title" + itinerary).innerText = "";
        document.getElementById("desc" + itinerary).innerText = "";

        localStorage.setItem("itinerary" + itinerary, "");
        localStorage.setItem("itinerary" + itinerary + "_desc", "");

        window.location.href = "welcome_view.html";
    }
}

function viewItinerary(itinerary, event) {
    event.stopPropagation();  // Prevent event from propagating to the card click
    localStorage.setItem("curr_itinerary", itinerary);
    window.location.href = "viewplan.html";
}

document.addEventListener("DOMContentLoaded", function () {
    // Loop through the 5 possible itinerary cards
    for (let i = 1; i <= 5; i++) {
        const card = document.getElementById("card" + i);
        const title = localStorage.getItem("itinerary" + i);
        
        // If there's no title (i.e., empty card)
        if (!title || title.length === 0) {
            card.className = "card empty";
            document.getElementById("card" + i + "_content").style.visibility = "hidden";

            // When an empty card is clicked, redirect to the "create new" page
            card.addEventListener("click", function(event) {
                // Prevent the view button's event from being triggered
                event.stopPropagation();
                window.location.href = "createnew.html";
            });
        } else {
            // If the card has data, mark it as a saved card
            card.className = "card saved";
            document.getElementById("createnew" + i).style.visibility = "hidden";
            document.getElementById("card" + i + "_content").style.visibility = "visible";
            document.getElementById("title" + i).innerText = title;
            document.getElementById("desc" + i).innerText = localStorage.getItem("itinerary" + i + "_desc");

            // Add event listener to the "view" button inside the card
            const viewButton = document.getElementById("view" + i);
            if (viewButton) {
                viewButton.addEventListener("click", function(event) {
                    event.stopPropagation();  // Prevent the card's click event from firing
                    viewItinerary(i, event);  // Pass event to prevent other actions
                });
            }
        }
    }
});
