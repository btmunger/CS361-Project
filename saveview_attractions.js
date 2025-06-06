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

// Function to read the CSV
async function viewCSV() {
    const filePath = path.join(__dirname, 'attractions.csv');
    if (!fs.existsSync(filePath)) return [];

    const csvText = fs.readFileSync(filePath, 'utf-8');
    const lines = csvText.trim().split('\n');
    lines.shift(); // Remove header

    const attractions = lines.map(line => {
        const [name, address, rating] = line
            .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
            .map(field => field.replace(/^"|"$/g, '').replace(/""/g, '"'));
        return { name, address, rating };
    });

    return attractions;
}

// Endpoint: /viewattract
app.get('/viewattract', async (req, res) => {
    try {
        const attractions = await viewCSV();
        res.json({
            success: true,
            attractions: attractions
        });
    } catch (error) {
        console.error("Error viewing attractions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint: /saveattract
app.get('/saveattract', async (req, res) => {
    const attraction = JSON.parse(req.query.attraction);

    try {
        await writeCSV(attraction);
        res.json({ success: true });
    } catch (error) {
        console.error("Error saving attraction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Attraction microservice running on http://localhost:${PORT}`);
});
