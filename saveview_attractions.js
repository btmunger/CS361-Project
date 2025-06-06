const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5005;
app.use(cors());

// Function for writing the attractions to a CSV file
async function writeCSV(attraction) {
    const filePath = path.join(__dirname, 'attractions.csv');

    // Optional: Write header only if the file doesn't exist yet
    if (!fs.existsSync(filePath)) {
        const header = `"Name","Address","Rating"\n`;
        fs.writeFileSync(filePath, header);
    }

    const name = `"${attraction.name?.replace(/"/g, '""') || ''}"`;
    const address = `"${attraction.address?.replace(/"/g, '""') || ''}"`;
    const rating = `"${attraction.rating || ''}"`;

    const row = `${name},${address},${rating}\n`;

    fs.appendFileSync(filePath, row);
}

// Endpoint: /saveattract
app.get('/saveattract', async (req, res) => {
    const attraction = JSON.parse(req.query.attraction);

    try {
        await writeCSV(attraction);
        
        res.json({
            success: true
        });
    } catch (error) {
        console.error("Error saving attractions: " + error);
        res.status(500).json({error: "Internal server error"});
    }

});

// Start server
app.listen(PORT, () => {
  console.log(`Hotel microservice running on http://localhost:${PORT}`);
});