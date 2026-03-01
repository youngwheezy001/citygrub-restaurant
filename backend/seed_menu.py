import os
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, MenuItem, Staff

# 1. Create Tables (if they don't exist)
Base.metadata.create_all(bind=engine)

# 2. Make sure the uploads folder exists for the images
if not os.path.exists("uploads"):
    os.makedirs("uploads")

def seed_menu():
    db: Session = SessionLocal()
    
    # Check if menu already exists to avoid duplicates
    if db.query(MenuItem).count() > 0:
        print("⚠️  Menu already seeded. Clearing old menu to apply the CityGrub update...")
        db.query(MenuItem).delete()
        db.commit()

    print("🌱 Seeding 'CityGrub' Menu (Text Only)...")

    items = [
        # --- BREAKFAST ---
        {"name": "Jolly Breakfast Combo", "price": 1510.00, "category": "Breakfast", "description": "2 Sausages, 2 eggs, saute potatoes and baked beans"},
        {"name": "All Inclusive Breakfast", "price": 1510.00, "category": "Breakfast", "description": "Grilled steak or chicken, 2 pancakes, 2 eggs and homefries"},
        {"name": "Spanish Omelette", "price": 813.00, "category": "Breakfast", "description": "3 eggs whisked with onion, tomatoes & green pepper served with toast"},
        {"name": "Plain Croissant", "price": 375.00, "category": "Breakfast", "description": "Classic flaky and buttery croissant"},
        
        # --- SNACKS & BITES ---
        {"name": "Meat Pie", "price": 463.00, "category": "Snacks", "description": "Savory pastry filled with seasoned meat"},
        {"name": "Chicken Pie", "price": 463.00, "category": "Snacks", "description": "Flaky pastry filled with deliciously seasoned chicken"},
        {"name": "Samosa Pair (Beef)", "price": 400.00, "category": "Snacks", "description": "Two crispy beef samosas"},
        {"name": "French Fries", "price": 535.00, "category": "Snacks", "description": "Crispy and golden potato fries"},
        {"name": "Masala Fries", "price": 800.00, "category": "Snacks", "description": "Fries seasoned with aromatic masala spices"},

        # --- MAINS ---
        {"name": "Double Beef Burger", "price": 1870.00, "category": "Mains", "description": "Two succulent beef patties, cheese, lettuce and tomato"},
        {"name": "Chicken Curry", "price": 1533.00, "category": "Mains", "description": "Chicken cubes in creamy curry sauce"},
        {"name": "Biryani (Chicken)", "price": 1140.00, "category": "Signature Meals", "description": "Aromatic spiced rice dish with tender chicken"},
        {"name": "Grilled Chicken Breast", "price": 1510.00, "category": "Mains", "description": "Served with gravy, salad and sauce"},
        {"name": "Special Pilau", "price": 390.00, "category": "Signature Meals", "description": "Traditional spiced rice served with kachumbari."},
        {"name": "Butter Chicken", "price": 750.00, "category": "Indian Corner", "description": "Tender chicken cooked in a rich, creamy tomato and butter sauce."},
        {"name": "Vegetable Korma", "price": 640.00, "category": "Indian Corner", "description": "Mixed vegetables simmered in a mild, creamy cashew nut sauce."},
        {"name": "Mutton Mishkaki", "price": 450.00, "category": "Sizzling Meals", "description": "Marinated mutton skewers grilled to perfection."},
        {"name": "Garlic Naan", "price": 120.00, "category": "Sides", "description": "Freshly baked flatbread topped with crushed garlic and butter."},

        # --- DRINKS ---
        {"name": "House Coffee (White)", "price": 415.00, "category": "Drinks", "description": "Rich creamy coffee"},
        {"name": "Masala Dawa", "price": 430.00, "category": "Drinks", "description": "Hot lemon, ginger and honey drink with spices"},
        {"name": "Espresso", "price": 375.00, "category": "Drinks", "description": "Strong black coffee"},
        {"name": "Caramel Latte", "price": 535.00, "category": "Drinks", "description": "Espresso with steamed milk and caramel syrup"},
        {"name": "Passion Juice", "price": 210.00, "category": "Juices", "description": "Freshly squeezed, chilled passion fruit juice."},
        {"name": "Camel Tea", "price": 250.00, "category": "Tea", "description": "Rich and creamy traditional tea made with camel milk."}
    ]

    # Bulk insert
    for item_data in items:
        menu_item = MenuItem(
            name=item_data["name"],
            price=item_data["price"],
            category=item_data["category"],
            description=item_data.get("description", ""),
            image_url=None, # <-- Intentionally left blank for manual upload!
            restaurant_id="agiza_rest_002", 
            is_available=True
        )
        db.add(menu_item)
    
    db.commit()
    print(f"✅ Successfully added {len(items)} items to the CityGrub menu!")
    db.close()

def set_admin_pin():
    db: Session = SessionLocal()
    
    admin = db.query(Staff).filter(Staff.role == "Admin").first()
    
    if admin:
        admin.pin = "1234"
        print("✅ Existing Admin PIN updated to 1234")
    else:
        new_admin = Staff(
            name="Principal Admin",
            username="admin",
            role="Admin",
            pin="1234"
        )
        db.add(new_admin)
        print("✅ New Admin created with PIN 1234")
        
    db.commit()
    db.close()

if __name__ == "__main__":
    seed_menu()
    set_admin_pin()