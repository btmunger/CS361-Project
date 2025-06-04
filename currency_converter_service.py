#Daanish Khan, CS 361

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import time

#Added CORS to work with my JS project -Brian Munger 06.03.2025
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

#api endpoint we use to get exchange rates
EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/"

#function to get the exchange rate from the api
def get_exchange_rate(from_currency, to_currency):
    try:
        print(f"Calling API for {from_currency} rates")
        #send get request to the API, if its 200 then converts to python dict
        response = requests.get(f"{EXCHANGE_API_URL}{from_currency}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            rates = data.get('rates', {})
            
            #check if currency is in the response
            if to_currency in rates:
                rate = rates[to_currency]
                print(f"API rate: 1 {from_currency} = {rate} {to_currency}")
                return rate
            else:
                print(f"Currency {to_currency} not found in API response")
                return None
        else:
            print(f"API request failed with status {response.status_code}")
            return None
            
    except Exception as e:
        print(f"API call failed: {e}")
        return None

#takes from, to, and amount as query params
@app.route('/convert', methods=['GET'])
def convert():
    
    # Get parameters
    from_curr = request.args.get('from', '').upper()
    to_curr = request.args.get('to', '').upper()
    
    #validates the amount
    try:
        amount = float(request.args.get('amount', 0))
    except (ValueError, TypeError):
        print("Invalid amount provided")
        return jsonify({'error': 'Invalid amount'}), 400
    
    print(f"Request: Convert {amount} {from_curr} → {to_curr}")
    
    # Validates the currencies
    if not from_curr or not to_curr or amount <= 0:
        print("Missing or invalid parameters")
        return jsonify({'error': 'Missing required parameters: from, to, amount'}), 400
    
    # Case if they are the same currencies. Returns the original amount
    if from_curr == to_curr:
        print(f"Same currency conversion: {amount} {from_curr}")
        response = {
            'original_amount': amount,
            'from_currency': from_curr,
            'to_currency': to_curr,
            'exchange_rate': 1.0,
            'converted_amount': amount,
            'api_used': False
        }
        return jsonify(response)
    
    # Gets the real time excchange rate 
    exchange_rate = get_exchange_rate(from_curr, to_curr)
    
    if exchange_rate is None:
        print("Could not get exchange rate")
        return jsonify({'error': f'Unable to convert {from_curr} to {to_curr}'}), 400
    
    # Calculates the conversion
    converted_amount = round(amount * exchange_rate, 2)
    
    #this is the response after converting the currencies
    response = {
        'original_amount': amount,
        'from_currency': from_curr,
        'to_currency': to_curr,
        'exchange_rate': exchange_rate,
        'converted_amount': converted_amount,
        'api_used': True
    }

    return jsonify(response)

#checks if the service is running well or not.
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'message': 'Currency converter is running'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)