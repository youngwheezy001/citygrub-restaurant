import httpx
import base64
from datetime import datetime
import json
import os
from typing import Optional

class DarajaClient:
    def __init__(self, consumer_key: str, consumer_secret: str, shortcode: str, passkey: str, base_url: str = "https://sandbox.safaricom.co.ke"):
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self.shortcode = shortcode
        self.passkey = passkey
        self.base_url = base_url

    async def get_access_token(self) -> str:
        """
        Authenticates with Daraja to get a Bearer Token.
        """
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url, 
                auth=(self.consumer_key, self.consumer_secret)
            )
            
        if response.status_code != 200:
            raise Exception(f"Daraja Auth Failed: {response.text}")
            
        return response.json().get("access_token")

    def generate_password(self) -> tuple[str, str]:
        """
        Generates the Base64 encoded password required for STK Push.
        Returns: (password, timestamp)
        """
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        data_to_encode = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(data_to_encode.encode()).decode("utf-8")
        return password, timestamp

    async def initiate_stk_push(self, phone_number: str, amount: int, callback_url: str, reference: str, description: str = "Payment"):
        """
        Triggers the STK Push to the customer's phone[cite: 113].
        """
        access_token = await self.get_access_token()
        password, timestamp = self.generate_password()
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone_number,  # Customer sending money
            "PartyB": self.shortcode, # Business receiving money
            "PhoneNumber": phone_number,
            "CallBackURL": callback_url, # Where Safaricom posts the result [cite: 114]
            "AccountReference": reference, # e.g., Order ID or Restaurant Name
            "TransactionDesc": description
        }
        
        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            
        return response.json()