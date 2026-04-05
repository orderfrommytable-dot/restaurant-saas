const prisma = require("../lib/prisma");

// 1. POST: Customer places an order
exports.createOrder = async (req, res) => {
  try {
    const { restaurantId, tableNumber, items, totalAmount } = req.body;

    const order = await prisma.order.create({
      data: {
        tableNumber: String(tableNumber),
        items: items, 
        restaurantId: parseInt(restaurantId),
        status: "PENDING",
        totalAmount: totalAmount ? parseFloat(totalAmount) : null,
        paymentStatus: "UNPAID"
      }
    });

    // --- REAL-TIME MAGIC WITH LOGS ---
    const io = req.app.get("io");
    if (io) {
      console.log(`📢 SHOUTING TO KITCHEN: New order for restaurant ID: ${order.restaurantId}`);
      io.emit("newOrder", { restaurantId: order.restaurantId });
    } else {
      console.log("❌ ERROR: Socket.io is not attached to the app!");
    }
    // ---------------------------------

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error("ORDER ERROR:", error);
    res.status(500).json({ success: false, message: "Could not place order." });
  }
};

// 1.5 PUT: Customer pays for the order
exports.payOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { paymentStatus: "PAID" }
    });
    
    // Optional: emit an event that an order was paid, 
    // but typically kitchen just cares about food status
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to process payment." });
  }
};

// 2. GET: Owner views orders
exports.getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: parseInt(restaurantId), userId: req.user.id }
    });
    if (!restaurant) return res.status(403).json({ success: false, message: "Unauthorized" });

    const orders = await prisma.order.findMany({
      where: { restaurantId: parseInt(restaurantId) },
      orderBy: { createdAt: 'desc' } 
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching orders." });
  }
};

// 3. PUT: Owner updates the order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update order status." });
  }
};