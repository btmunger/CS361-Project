/* Client (test file) file for creating a random string based on 
   passed parameters.
   Author: Brian Munger (OSU ID: 934425812)
   Date: 05-18-2025
*/

import fetch from 'node-fetch';
// Port number, feel free to change to whatever you want!
const port = 3000;

// Example way of asking data, replace with you logic
const data = {
    stringLength : 10,
    includeNums : false,
    includeUpper : true
}

fetch('http://localhost:' + port + '/generate_string', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
})
    .then(res => res.text())
    .then(response => {
        console.log('Random string:', response);
});