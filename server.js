const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const Razorpay = require('razorpay');

const app = express();
const PORT = 3000;

// Initialize Razorpay with test mode keys
const razorpay = new Razorpay({
  key_id: 'rzp_test_OhPudikJuCcT72', // Your real test key
  key_secret: 'T3UMIKhzDWeOSdwwFsQEq4Uc' // Your real key secret
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serves your HTML/CSS/JS

// Connect to MongoDB
mongoose.connect('mongodb+srv://dt555855:<DIRMHVtWKQKqN9yA>@e-shop.aismjpw.mongodb.net/?retryWrites=true&w=majority&appName=E-shop');

// Create a schema and model
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const User = mongoose.model('User', UserSchema);

// Contact schema and model
const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', ContactSchema);

// Add this if not already present
const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  category: String
}, { collection: 'products' });
const Product = mongoose.model('Product', ProductSchema);

// Cart schema and model
const CartItemSchema = new mongoose.Schema({
  user: String, // user email or id
  name: String,
  price: Number,
  image: String,
  description: String,
  quantity: { type: Number, default: 1 }
});
const CartItem = mongoose.model('CartItem', CartItemSchema);

// Order schema and model
const OrderSchema = new mongoose.Schema({
  name: String,
  email: String,
  items: [
    {
      name: String,
      price: Number,
      image: String,
      description: String,
      quantity: Number
    }
  ],
  total: Number,
  paymentMethod: String, // e.g. 'Razorpay', 'Card', 'UPI', etc.
  paymentId: String,     // e.g. Razorpay payment ID
  transactionId: String, // e.g. Razorpay order ID
  createdAt: { type: Date, default: Date.now }
}, { collection: 'orders' });
const Order = mongoose.model('Order', OrderSchema);

// API route to add a user
app.post('/api/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).send('User added');
  } catch (error) {
    res.status(500).send('Error adding user');
  }
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Basic validation (can be improved)
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists.' });
    }
    const newUser = new User({ name, email, password });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user.' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    res.status(200).json({ message: 'Login successful.', name: user.name });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in.' });
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();
    res.status(201).json({ message: 'Message sent successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message.' });
  }
});

// Get all contact messages (admin only)
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ _id: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contacts.' });
  }
});

// API endpoint to add a product
app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;
    if (!name || !description || !price || !image || !category) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const newProduct = new Product({ name, description, price, image, category });
    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding product.' });
  }
});

// API endpoint to get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Add to cart endpoint
app.post('/api/cart', async (req, res) => {
  const { user, name, price, image, description } = req.body;
  if (!user || !name || !price || !image || !description) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  // Check if item already in cart for this user
  let item = await CartItem.findOne({ user, name });
  if (item) {
    item.quantity += 1;
    await item.save();
  } else {
    item = new CartItem({ user, name, price, image, description, quantity: 1 });
    await item.save();
  }
  res.json({ message: 'Product added to cart!' });
});

// Get cart for user endpoint
app.get('/api/cart', async (req, res) => {
  const { user } = req.query;
  if (!user) return res.status(400).json({ message: 'User is required.' });
  const items = await CartItem.find({ user });
  res.json(items);
});

// Delete cart item endpoint
app.delete('/api/cart', async (req, res) => {
  const { user, name } = req.query;
  if (!user || !name) return res.status(400).json({ message: 'User and name are required.' });
  await CartItem.deleteOne({ user, name });
  res.json({ message: 'Item removed from cart.' });
});

// Delete cart item endpoint by _id
app.delete('/api/cart/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'ID is required.' });
  await CartItem.deleteOne({ _id: id });
  res.json({ message: 'Item removed from cart.' });
});

// Update cart item quantity endpoint by _id
app.patch('/api/cart/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  if (!id || typeof quantity !== 'number' || quantity < 1) {
    return res.status(400).json({ message: 'Valid ID and quantity are required.' });
  }
  await CartItem.updateOne({ _id: id }, { $set: { quantity } });
  res.json({ message: 'Quantity updated.' });
});

// Test Razorpay connection endpoint
app.get('/api/test-razorpay', async (req, res) => {
  try {
    console.log('Testing Razorpay connection...');
    console.log('Key ID:', 'rzp_test_OhPudikJuCcT72');
    console.log('Key Secret:', 'T3UMIKhzDWeOSdwwFsQEq4Uc');
    
    // Try to create a test order
    const testOptions = {
      amount: 100, // 1 rupee in paise
      currency: 'INR',
      receipt: 'test_' + Date.now(),
      payment_capture: 1
    };
    
    const testOrder = await razorpay.orders.create(testOptions);
    console.log('Test order created:', testOrder);
    res.json({ 
      success: true, 
      message: 'Razorpay connection successful',
      testOrder: testOrder 
    });
  } catch (error) {
    console.error('Razorpay test error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Razorpay connection failed: ' + error.message,
      details: error.error || error
    });
  }
});

// Create payment order endpoint
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount } = req.body; // amount in rupees
    console.log('Creating order for amount:', amount);
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount provided' });
    }
    
    // Create real Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise and round
      currency: 'INR',
      receipt: 'order_' + Date.now(),
      payment_capture: 1
    };
    console.log('Razorpay options:', options);
    
    const order = await razorpay.orders.create(options);
    console.log('Order created successfully:', order);
    res.json(order);
  } catch (error) {
    console.error('Razorpay order creation error:', error.message);
    console.error('Error details:', error);
    
    // Check if it's an authentication error
    if (error.error && error.error.description) {
      res.status(500).json({ error: `Razorpay Error: ${error.error.description}` });
    } else {
      res.status(500).json({ error: 'Failed to create payment order: ' + error.message });
    }
  }
});

// Verify payment endpoint
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Verify the payment signature
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', 'T3UMIKhzDWeOSdwwFsQEq4Uc') // Use your test key_secret
      .update(text)
      .digest('hex');
    
    if (signature === razorpay_signature) {
      res.json({ verified: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ verified: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Save order endpoint
app.post('/api/orders', async (req, res) => {
  try {
    const { name, email, items, total, paymentMethod, paymentId, transactionId } = req.body;
    if (!name || !email || !items || !Array.isArray(items) || items.length === 0 || !total) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const newOrder = new Order({ name, email, items, total, paymentMethod, paymentId, transactionId });
    await newOrder.save();
    res.status(201).json({ message: 'Order saved successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving order.' });
  }
});

// Get all orders (admin)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
