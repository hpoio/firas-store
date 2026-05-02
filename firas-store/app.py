import os
from datetime import datetime
from flask import Flask, render_template, abort, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy

base_dir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, 
            static_folder=os.path.join(base_dir, 'static'),
            static_url_path='/static')

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(base_dir, 'orders.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'firas-store-secret-key-2024'

db = SQLAlchemy(app)

# --- Product Model ---
class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Integer, nullable=False)
    image = db.Column(db.String(200), nullable=False)
    stock_quantity = db.Column(db.Integer, default=10)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'image': self.image,
            'stock_quantity': self.stock_quantity
        }

# --- Order Model ---
class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Integer, nullable=False)
    customer_name = db.Column(db.String(200), nullable=False)
    customer_phone = db.Column(db.String(50), nullable=False)
    size = db.Column(db.String(20), nullable=False)
    color = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), default='Pending')
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    completed = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f"<Order {self.id} - {self.product_name}>"

# --- Seed Products ---
DEFAULT_PRODUCTS = [
    {"id": 1, "name": "Classic Polo Shirt", "price": 3500, "image": "1.jpg.jpg", "stock_quantity": 10},
    {"id": 2, "name": "Modern Sport Pants", "price": 3350, "image": "2.jpg.jpg", "stock_quantity": 8},
    {"id": 3, "name": "Premium Leather Jacket", "price": 8500, "image": "3.jpg.jpg", "stock_quantity": 5},
    {"id": 4, "name": "Summer Cotton Tees", "price": 2500, "image": "4.jpg.jpg", "stock_quantity": 15}
]

def seed_products():
    if Product.query.count() == 0:
        for p in DEFAULT_PRODUCTS:
            product = Product(
                id=p['id'],
                name=p['name'],
                price=p['price'],
                image=p['image'],
                stock_quantity=p['stock_quantity']
            )
            db.session.add(product)
        db.session.commit()

# --- Routes ---
@app.route('/')
@app.route('/shop')
def index():
    products = Product.query.all()
    return render_template('index.html', PRODUCTS=[p.to_dict() for p in products], products=[p.to_dict() for p in products])

@app.route('/product/<int:product_id>')
def product_detail(product_id):
    product = Product.query.get(product_id)
    if product:
        return render_template('product_detail.html', product=product.to_dict())
    return abort(404)

@app.route('/order', methods=['POST'])
def place_order():
    product_name = request.form.get('product_name')
    price = request.form.get('price', type=int)
    customer_name = request.form.get('customer_name')
    customer_phone = request.form.get('customer_phone')
    size = request.form.get('size')
    color = request.form.get('color')

    if not all([product_name, price, customer_name, customer_phone, size, color]):
        flash("Please fill in all required fields.", "error")
        return redirect(request.referrer or url_for('index'))

    new_order = Order(
        product_name=product_name,
        price=price,
        customer_name=customer_name,
        customer_phone=customer_phone,
        size=size,
        color=color
    )
    db.session.add(new_order)
    db.session.commit()

    text = (
        f"Hello! I'd like to place an order:\n"
        f"Product: {product_name}\n"
        f"Size: {size}\n"
        f"Color: {color}\n"
        f"Customer: {customer_name}\n"
        f"Phone: {customer_phone}\n"
        f"Price: {price} DA"
    )
    encoded_text = text.replace('\n', '%0A')
    whatsapp_url = f"https://wa.me/213657744371?text={encoded_text}"
    return redirect(whatsapp_url)

@app.route('/checkout')
def checkout():
    products = Product.query.all()
    return render_template('checkout.html', products=[p.to_dict() for p in products])

@app.route('/firas_admin')
def admin_dashboard():
    orders = Order.query.order_by(Order.timestamp.desc()).all()
    products = Product.query.all()
    return render_template('admin.html', orders=orders, products=products)

@app.route('/order/<int:order_id>/delete', methods=['POST'])
def delete_order(order_id):
    order = Order.query.get_or_404(order_id)
    db.session.delete(order)
    db.session.commit()
    flash("Order deleted successfully.", "success")
    return redirect(url_for('admin_dashboard'))

@app.route('/order/<int:order_id>/complete', methods=['POST'])
def complete_order(order_id):
    order = Order.query.get_or_404(order_id)
    order.completed = not order.completed
    db.session.commit()
    flash("Order status updated.", "success")
    return redirect(url_for('admin_dashboard'))

@app.route('/order/<int:order_id>/status', methods=['POST'])
def update_order_status(order_id):
    order = Order.query.get_or_404(order_id)
    new_status = request.form.get('status')
    if new_status in ['Pending', 'Shipped', 'Delivered']:
        order.status = new_status
        db.session.commit()
        flash(f"Order #{order.id} status updated to {new_status}.", "success")
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/product/<int:product_id>/stock', methods=['POST'])
def update_stock(product_id):
    product = Product.query.get_or_404(product_id)
    new_stock = request.form.get('stock_quantity', type=int)
    if new_stock is not None and new_stock >= 0:
        product.stock_quantity = new_stock
        db.session.commit()
        flash(f"Stock for '{product.name}' updated to {new_stock}.", "success")
    return redirect(url_for('admin_dashboard'))

# --- Initialize Database ---
with app.app_context():
    db.create_all()
    seed_products()

if __name__ == '__main__':
    app.run(debug=True)
