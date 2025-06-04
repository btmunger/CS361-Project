/* Server file for creating a random string based on passed
   parameters.
   Author: Brian Munger (OSU ID: 934425812)
   Date: 05-18-2025
*/

const express = require('express');
const app = express();
// Port number, feel free to change to whatever you want!
const port = 3000;  

// To handle JSON data in requests
app.use(express.json());

// POST endpoint to generate a random string
app.post('/generate_string', (req, res) => {
    const {stringLength, includeNums, includeUpper} = req.body;

    // Genreate string 
    randString = '';
    possibleChars = 'abcdefghijklmnopqrstuvwxyz';
    if (includeNums) {
        possibleChars += '0123456789';
    }  
    if (includeUpper) {
        possibleChars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }

    for (let index = 0; index < stringLength; index++) {
        randString += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    }

    res.send(randString);
});

app.listen(port, () => { 
    console.log('Server is running on http://localhost:' + port);
});