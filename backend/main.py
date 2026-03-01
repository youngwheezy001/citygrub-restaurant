from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import re 
import shutil
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# --- Imports from your files ---
from models import Base, Order, OrderStatus, MenuItem, OrderItem, Staff, LoginLog
from middleware import TenantGuardMiddleware
from daraja import DarajaClient 
from utils import parse_mpesa_callback

# --- Database Setup ---
from database import engine, SessionLocal
Base.metadata.create_all(bind=engine) 

# ==========================================
# 1. APP INITIALIZATION (MUST BE FIRST)
# ==========================================
app = FastAPI(title="AgizaDigital Tenant Backend")

# ==========================================
# 2. UPLOADS DIRECTORY & MOUNTING
# ==========================================
if not os.path.exists("uploads"):
    os.makedirs("uploads")

# Now 'app' is defined, so this will work perfectly!
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ==========================================
# 3. MIDDLEWARE
# ==========================================
app.add_middleware(TenantGuardMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 4. DARAJA INITIALIZATION
# ==========================================
daraja = DarajaClient(
    consumer_key="pdPwGechTyzwB34IXME7BXj5s2cuevIUpBCHJ5BoM1HgHXHA",
    consumer_secret="5LRJPgO10JCly01TD2c9BY6B80CTpueGUzkpXRxQQEXA8dVpoEdUWYdmAIFLZjNF",
    shortcode="174379",
    passkey="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
    base_url="https://sandbox.safaricom.co.ke"
)

# --- WebSocket Manager (Multi-Tenant Rooms) ---
class KitchenConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, restaurant_id: str):
        await websocket.accept()
        if restaurant_id not in self.active_connections:
            self.active_connections[restaurant_id] = []
        self.active_connections[restaurant_id].append(websocket)

    def disconnect(self, websocket: WebSocket, restaurant_id: str):
        if restaurant_id in self.active_connections:
            self.active_connections[restaurant_id].remove(websocket)

    async def broadcast_order(self, order_data: dict, restaurant_id: str):
        if restaurant_id in self.active_connections:
            for connection in self.active_connections[restaurant_id]:
                await connection.send_json(order_data)

manager = KitchenConnectionManager()

# --- Dependencies ---
def get_db():
    db = SessionLocal() 
    try:
        yield db
    finally:
        db.close()

# --- PYDANTIC SCHEMAS ---
class OrderItemSchema(BaseModel):
    menu_item_id: Optional[int] = None 
    quantity: int
    name: Optional[str] = "Item"

class OrderCreateSchema(BaseModel):
    table_number: str
    items: List[OrderItemSchema]
    restaurant_id: str = "agiza_rest_001" 
    payment_method: str = "mpesa_upfront"
    notes: Optional[str] = ""
    total: Optional[int] = 0
    waiter_name: Optional[str] = "Unknown Waiter" # <-- NEW: Captures the waiter's name from the frontend

# --- ENDPOINTS ---

@app.post("/api/orders", status_code=201)
async def create_order(payload: OrderCreateSchema, db: Session = Depends(get_db)):
    pay_later_methods = ["cash", "card", "mpesa_on_delivery", "mpesa"]
    initial_status = OrderStatus.SENT_TO_KITCHEN if payload.payment_method in pay_later_methods else OrderStatus.DRAFT

    new_order = Order(
        table_number=payload.table_number, 
        status=initial_status,
        restaurant_id=payload.restaurant_id,
        notes=payload.notes,
        payment_method=payload.payment_method
    )
    
    # NEW: Safely attach the waiter's name to the order if the database column exists
    if hasattr(Order, 'waiter_name'):
        new_order.waiter_name = payload.waiter_name

    db.add(new_order)
    db.commit()
    
    item_names_for_kds = []
    for item in payload.items:
        order_item = OrderItem(
            order_id=new_order.id, 
            menu_item_id=item.menu_item_id, 
            quantity=item.quantity
        )
        db.add(order_item)
        item_names_for_kds.append(f"{item.quantity}x {item.name}")
    
    db.commit()
    db.refresh(new_order)

    if initial_status == OrderStatus.SENT_TO_KITCHEN:
        await manager.broadcast_order({
            "event": "NEW_ORDER",
            "order_id": new_order.id,
            "table": new_order.table_number,
            "notes": new_order.notes,
            "items": item_names_for_kds
        }, payload.restaurant_id)
        return {"order_id": new_order.id, "status": "sent_to_kitchen"}

    return {"order_id": new_order.id, "status": "draft"}

@app.get("/api/menu", response_model=List[dict])
def get_menu(restaurant_id: str = "agiza_rest_001", db: Session = Depends(get_db)):
    items = db.query(MenuItem).filter(
        MenuItem.is_available == True,
        MenuItem.restaurant_id == restaurant_id
    ).all()
    return [
        {
            "id": item.id,
            "name": item.name,
            "price": item.price,
            "category": item.category,
            "description": item.description,
            "image_url": getattr(item, 'image_url', None) 
        }
        for item in items
    ]

def format_phone_number(phone: str) -> str:
    clean_phone = re.sub(r'\D', '', phone)
    if clean_phone.startswith("07") or clean_phone.startswith("01"):
        return "254" + clean_phone[1:]
    if clean_phone.startswith("254") and len(clean_phone) == 12:
        return clean_phone
    if (clean_phone.startswith("7") or clean_phone.startswith("1")) and len(clean_phone) == 9:
        return "254" + clean_phone
    return clean_phone

@app.post("/api/orders/{order_id}/pay")
async def trigger_mpesa_stk(order_id: int, phone: str, db: Session = Depends(get_db)):
    formatted_phone = format_phone_number(phone)
    
    if len(formatted_phone) != 12 or not formatted_phone.startswith("254"):
         raise HTTPException(status_code=400, detail="Invalid phone number.")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = OrderStatus.PENDING_PAYMENT
    order.customer_phone = formatted_phone 
    db.commit()
    
    try:
        current_callback_url = "https://rebbecca-unstammering-allena.ngrok-free.dev/api/callbacks/mpesa"
        
        response = await daraja.initiate_stk_push(
            phone_number=formatted_phone,
            amount=1, 
            callback_url=current_callback_url,
            reference=f"Order-{order_id}", 
            description="Restaurant Order"
        )
        
        if response.get("ResponseCode") == "0":
            return {"status": "pending", "message": "STK Push sent."}
        else:
            print(f"Safaricom Rejection Details: {response}") 
            exact_error = response.get("errorMessage") or response.get("CustomerMessage") or "Unknown Safaricom Error"
            raise HTTPException(status_code=400, detail=f"Safaricom says: {exact_error}")
            
    except Exception as e:
        print(f"Error triggering STK: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orders/{order_id}")
def get_order_status(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"id": order.id, "status": order.status}

@app.post("/api/callbacks/mpesa")
async def mpesa_callback(payload: dict, db: Session = Depends(get_db)):
    result = parse_mpesa_callback(payload)
    
    if result['success']:
        print(f"💰 Payment Successful. Ref: {result['metadata'].get('MpesaReceiptNumber')}")
        
        order = db.query(Order).filter(
            Order.status == OrderStatus.PENDING_PAYMENT
        ).order_by(Order.id.desc()).first()
        
        if order:
            order.status = OrderStatus.PAID
            db.commit()
            
            order_items_data = [item.menu_item.name for item in order.items]

            await manager.broadcast_order({
                "event": "NEW_ORDER",
                "order_id": order.id,
                "table": order.table_number,
                "items": order_items_data 
            }, order.restaurant_id)
            print(f"✅ Order {order.id} sent to kitchen!")
            
        else:
            print("⚠️ Payment received but no pending order found.")

        return {"status": "processed"}
    else:
        print(f"❌ Payment Failed: {result['result_desc']}")
        return {"status": "failed"}

# --- Kitchen Endpoints ---
@app.websocket("/ws/kitchen/{restaurant_id}")
async def websocket_kitchen(websocket: WebSocket, restaurant_id: str):
    await manager.connect(websocket, restaurant_id) 
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, restaurant_id)

@app.get("/api/kitchen/orders")
def get_kitchen_orders(restaurant_id: str = "agiza_rest_001", db: Session = Depends(get_db)):
    active_statuses = [OrderStatus.PAID, OrderStatus.SENT_TO_KITCHEN, OrderStatus.PREPARING]
    
    orders = db.query(Order).filter(
        Order.status.in_(active_statuses),
        Order.restaurant_id == restaurant_id
    ).all()
    
    return [
        {
            "id": o.id,
            "table_number": o.table_number,
            "status": o.status,
            "notes": o.notes,
            "created_at": o.created_at,
            "payment_method": o.payment_method,
            "items": [i.menu_item.name for i in o.items] 
        }
        for o in orders
    ]

@app.patch("/api/kitchen/orders/{order_id}/status")
def update_order_status(order_id: int, payload: dict, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    new_status = payload.get("status")
    if new_status == "ready":
        order.status = OrderStatus.READY
    elif new_status == "completed":
        order.status = OrderStatus.COMPLETED
        
    db.commit()
    return {"success": True, "status": order.status}

@app.get("/api/orders")
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).all()
    
    order_list = []
    for order in orders:
        items_for_kitchen = []
        for item in order.items:
            food = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
            items_for_kitchen.append({
                "name": food.name if food else f"Item #{item.menu_item_id}",
                "quantity": item.quantity
            })
            
        order_list.append({
            "id": order.id,
            "table_number": order.table_number,
            "notes": order.notes,
            "status": order.status.name if hasattr(order.status, 'name') else order.status, 
            "payment_method": order.payment_method,
            "items": items_for_kitchen
        })
        
    return order_list

@app.put("/api/orders/{order_id}/complete")
def complete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order.status = OrderStatus.COMPLETED  
    db.commit()
    
    return {"message": f"Order {order_id} marked as completed!", "order_id": order_id}

# --- ADMIN ENDPOINTS ---

@app.get("/api/admin/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    
    valid_statuses = [OrderStatus.PAID, OrderStatus.COMPLETED]
    
    total_revenue = db.query(func.sum(MenuItem.price * OrderItem.quantity))\
        .join(OrderItem, MenuItem.id == OrderItem.menu_item_id)\
        .join(Order, Order.id == OrderItem.order_id)\
        .filter(Order.status.in_(valid_statuses)).scalar() or 0

    mpesa_count = db.query(Order).filter(Order.payment_method.contains("mpesa")).count()
    cash_count = db.query(Order).filter(Order.payment_method == "cash").count()
    card_count = db.query(Order).filter(Order.payment_method == "card").count()
    
    recent_sales = db.query(Order).filter(Order.status.in_(valid_statuses)).order_by(Order.id.desc()).limit(5).all()

    # --- NEW: REAL STAFF PERFORMANCE LOGIC ---
    # Groups all paid/completed orders by the waiter and calculates their total revenue
    try:
        staff_sales = db.query(
            Order.waiter_name,
            func.sum(MenuItem.price * OrderItem.quantity).label('revenue')
        ).join(OrderItem, Order.id == OrderItem.order_id)\
         .join(MenuItem, MenuItem.id == OrderItem.menu_item_id)\
         .filter(Order.status.in_(valid_statuses))\
         .group_by(Order.waiter_name).all()

        staff_performance = [
            {"name": row[0] or "Unknown Waiter", "revenue": float(row[1] or 0)}
            for row in staff_sales
        ]
        # Sort from highest sales to lowest
        staff_performance.sort(key=lambda x: x["revenue"], reverse=True)
    except Exception as e:
        print("Safeguard: waiter_name column missing in Order model. Returning empty array.", e)
        staff_performance = []

    return {
        "total_revenue": total_revenue,
        "mpesa_orders": mpesa_count,
        "cash_orders": cash_count,
        "card_orders": card_count,
        "recent_sales": [
            {"id": s.id, "table": s.table_number, "method": s.payment_method} 
            for s in recent_sales
        ],
        "staff_performance": staff_performance # Now passing REAL data to the frontend!
    }

@app.get("/api/admin/menu")
def admin_get_menu(db: Session = Depends(get_db)):
    items = db.query(MenuItem).all()
    return items

@app.patch("/api/admin/menu/{item_id}")
async def update_menu_item(
    item_id: int,
    name: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    category: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    is_available: Optional[str] = Form(None), 
    image: Optional[UploadFile] = File(None), 
    db: Session = Depends(get_db)
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if name is not None: item.name = name
    if price is not None: item.price = price
    if category is not None: item.category = category
    if description is not None: item.description = description
    
    if is_available is not None: 
        item.is_available = is_available.lower() == 'true'
        
    if image:
        file_path = f"uploads/{image.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        item.image_url = f"http://localhost:8000/{file_path}"
        
    db.commit()
    return {"success": True, "message": f"Updated {item.name}"}

@app.delete("/api/admin/menu/{item_id}")
async def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    return {"success": True, "message": "Item permanently deleted"}

@app.post("/api/admin/menu", status_code=201)
async def create_menu_item(
    name: str = Form(...),
    price: float = Form(...),
    category: str = Form("General"),
    description: str = Form(""),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    image_url = None
    if image:
        file_path = f"uploads/{image.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"http://localhost:8000/{file_path}"

    new_item = MenuItem(
        name=name,
        price=price,
        category=category,
        description=description,
        image_url=image_url,
        restaurant_id="agiza_rest_002",
        is_available=True
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@app.get("/api/admin/staff")
def get_staff(db: Session = Depends(get_db)):
    return db.query(Staff).all()

@app.post("/api/admin/staff", status_code=201)
def create_staff(payload: dict, db: Session = Depends(get_db)):
    new_staff = Staff(
        name=payload["name"],
        username=payload["username"],
        role=payload["role"],
        pin=payload["pin"],
        restaurant_id="agiza_rest_002"
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return new_staff

@app.delete("/api/admin/staff/{staff_id}")
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    db.delete(staff)
    db.commit()
    return {"message": "Staff deleted"}

@app.post("/api/admin/logs/login")
def record_login(staff_id: int, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    new_log = LoginLog(staff_name=staff.name, role=staff.role)
    db.add(new_log)
    db.commit()
    return {"status": "logged"}

@app.get("/api/admin/logs/login")
def get_login_logs(db: Session = Depends(get_db)):
    logs = db.query(LoginLog).order_by(LoginLog.id.desc()).limit(10).all()
    return logs    

@app.delete("/api/admin/orders/{order_id}")
def void_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
    db.delete(order)
    db.commit()
    return {"message": f"Order #{order_id} has been voided"}    

@app.patch("/api/admin/staff/{staff_id}")
def update_staff_pin(staff_id: int, data: dict, db: Session = Depends(get_db)):
    staff_member = db.query(Staff).filter(Staff.id == staff_id).first()
    
    if not staff_member:
        raise HTTPException(status_code=404, detail="Staff not found")

    if "pin" in data:
        staff_member.pin = data["pin"]
    
    db.add(staff_member)
    db.commit()          
    db.refresh(staff_member) 
    
    return {"message": "Update successful", "staff": staff_member}    

@app.patch("/api/orders/{order_id}/status")
def update_order_status(order_id: int, status_update: dict, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if "status" in status_update:
        order.status = status_update["status"]
        
    db.add(order)
    db.commit()
    return {"message": f"Order {order_id} marked as {order.status}"}