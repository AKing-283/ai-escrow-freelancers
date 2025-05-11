from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
import json
from web3 import Web3
import os

app = Flask(__name__)
CORS(app)

# Web3 and contract setup
w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
with open(os.path.join(os.path.dirname(__file__), 'WillEscrow.json')) as f:
    contract_json = json.load(f)
    abi = contract_json['abi']

contract_address = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
contract = w3.eth.contract(address=contract_address, abi=abi)

# Use the first Hardhat account for backend transactions
PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
ACCOUNT = w3.eth.account.from_key(PRIVATE_KEY)

def init_db():
    conn = sqlite3.connect('escrow.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_address TEXT NOT NULL,
            beneficiary_address TEXT NOT NULL,
            amount REAL NOT NULL,
            release_time INTEGER NOT NULL,
            transaction_type TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/log-deposit', methods=['POST'])
def log_deposit():
    data = request.json
    conn = sqlite3.connect('escrow.db')
    c = conn.cursor()
    c.execute('''
        INSERT INTO transactions (owner_address, beneficiary_address, amount, release_time, transaction_type)
        VALUES (?, ?, ?, ?, ?)
    ''', (data['owner'], data['beneficiary'], data['amount'], data['releaseTime'], 'deposit'))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/log-release', methods=['POST'])
def log_release():
    data = request.json
    conn = sqlite3.connect('escrow.db')
    c = conn.cursor()
    c.execute('''
        INSERT INTO transactions (owner_address, beneficiary_address, amount, release_time, transaction_type)
        VALUES (?, ?, ?, ?, ?)
    ''', (data['owner'], data['beneficiary'], data['amount'], data['releaseTime'], 'release'))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/history/<address>', methods=['GET'])
def get_history(address):
    conn = sqlite3.connect('escrow.db')
    c = conn.cursor()
    c.execute('''
        SELECT * FROM transactions 
        WHERE owner_address = ? OR beneficiary_address = ?
        ORDER BY timestamp DESC
    ''', (address, address))
    transactions = c.fetchall()
    conn.close()
    
    result = []
    for tx in transactions:
        result.append({
            'id': tx[0],
            'owner_address': tx[1],
            'beneficiary_address': tx[2],
            'amount': tx[3],
            'release_time': tx[4],
            'transaction_type': tx[5],
            'timestamp': tx[6]
        })
    return jsonify(result)

@app.route('/escrow/deposit', methods=['POST'])
def deposit():
    data = request.json
    beneficiary = data['beneficiary']
    release_time = int(data['releaseTime'])
    amount = w3.to_wei(data['amount'], 'ether')

    nonce = w3.eth.get_transaction_count(ACCOUNT.address)
    txn = contract.functions.deposit(beneficiary, release_time).build_transaction({
        'from': ACCOUNT.address,
        'value': amount,
        'nonce': nonce,
        'gas': 500000,
        'gasPrice': w3.to_wei('10', 'gwei')
    })
    signed_txn = w3.eth.account.sign_transaction(txn, private_key=PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return jsonify({'status': 'success', 'txHash': tx_hash.hex()})

@app.route('/escrow/details/<owner>', methods=['GET'])
def get_escrow_details(owner):
    details = contract.functions.getEscrowDetails(owner).call()
    return jsonify({
        'beneficiary': details[0],
        'releaseTime': details[1],
        'amount': w3.from_wei(details[2], 'ether'),
        'released': details[3]
    })

@app.route('/escrow/release', methods=['POST'])
def release_funds():
    data = request.json
    owner = data['owner']
    nonce = w3.eth.get_transaction_count(ACCOUNT.address)
    txn = contract.functions.releaseFunds(owner).build_transaction({
        'from': ACCOUNT.address,
        'nonce': nonce,
        'gas': 500000,
        'gasPrice': w3.to_wei('10', 'gwei')
    })
    signed_txn = w3.eth.account.sign_transaction(txn, private_key=PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return jsonify({'status': 'success', 'txHash': tx_hash.hex()})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5001) 