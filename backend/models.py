from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey, func, Boolean
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from database import Base 

# Order State Machine
class OrderStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_PAYMENT = "pending_payment"
    PAID = "paid"
    SENT_TO_KITCHEN = "sent_to_kitchen"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    is_available = Column(Boolean, default=True)
    category = Column(String) 
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    
    restaurant_id = Column(String, index=True, default="agiza_rest_001")

class Order(Base):
    __tablename__ = "orders"
    
    waiter_name = Column(String, nullable=True, default="Unknown Waiter")
    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String)
    total_amount = Column(Float)
    customer_phone = Column(String, nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.DRAFT)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    restaurant_id = Column(String, index=True, default="agiza_rest_001")
    notes = Column(String, nullable=True)
    payment_method = Column(String, default="mpesa_upfront")
    
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"))
    quantity = Column(Integer)
    
    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem")

# MOVED TO THE BOTTOM AND FIXED INDENTATION
class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    username = Column(String, unique=True, index=True)
    role = Column(String)  # Admin, Manager, Chef, Waiter
    pin = Column(String)   # 4-digit login PIN for tablets
    restaurant_id = Column(String, index=True)

class RestaurantSettings(Base):
    __tablename__ = "restaurant_settings"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_name = Column(String, default="CityGrub")
    logo_url = Column(String, nullable=True)
    mpesa_till = Column(String, nullable=True)
    vat_percentage = Column(Float, default=16.0)
    service_charge = Column(Float, default=0.0)
    total_tables = Column(Integer, default=15)
    is_accepting_orders = Column(Boolean, default=True)

class LoginLog(Base):
    __tablename__ = "login_logs"
    id = Column(Integer, primary_key=True, index=True)
    staff_name = Column(String)
    role = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())    