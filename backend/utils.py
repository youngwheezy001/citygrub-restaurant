def parse_mpesa_callback(payload: dict):
    """
    Parses the STK Callback to determine if payment was successful.
    """
    try:
        stk_callback = payload['Body']['stkCallback']
        result_code = stk_callback['ResultCode'] # 0 = Success, others = Fail/Cancel
        merchant_request_id = stk_callback['MerchantRequestID']
        checkout_request_id = stk_callback['CheckoutRequestID']
        
        metadata = {}
        if result_code == 0:
            # Extract items like Amount, Receipt Number, etc.
            callback_items = stk_callback['CallbackMetadata']['Item']
            for item in callback_items:
                metadata[item['Name']] = item.get('Value')
                
        return {
            "success": result_code == 0,
            "result_desc": stk_callback['ResultDesc'],
            "metadata": metadata, # Contains 'MpesaReceiptNumber', 'Amount', etc.
            "checkout_request_id": checkout_request_id
        }
    except KeyError:
        return {"success": False, "result_desc": "Invalid Payload", "metadata": {}}