const prisma = require("../lib/prisma");

// 1. CREATE: Linked to User via 'connect'
exports.createRestaurant = async (req, res) => {
  try {
    const { name, location, openingTime, closingTime, numberOfTables } = req.body;
    const userId = req.user.id; 

    if (!name) return res.status(400).json({ success: false, message: "Name is required" });

    const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
    
    // Parse to int safely, fallback to 1
    const tablesCount = parseInt(numberOfTables) || 1;

    const restaurant = await prisma.restaurant.create({
      data: { 
        name: name.trim(), 
        slug: slug,
        location: location ? location.trim() : null,
        openingTime: openingTime ? openingTime.trim() : null,
        closingTime: closingTime ? closingTime.trim() : null,
        numberOfTables: tablesCount,
        owner: {
          connect: { id: userId } 
        }
      }
    });

    res.status(201).json({ success: true, data: restaurant });
  } catch (error) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({ success: false, message: "Database Error" });
  }
};

// 2. GET ALL: Only show restaurants owned by the logged-in user
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { userId: req.user.id }
    });
    res.json({ success: true, data: restaurants });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching restaurants" });
  }
};

// 3. GET BY ID: Ensure user owns it before showing private details
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: { 
        id: parseInt(req.params.id),
        userId: req.user.id // Security check
      }
    });
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching restaurant" });
  }
};

// 4. UPDATE: Only owner can update
exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.updateMany({
      where: { 
        id: parseInt(req.params.id),
        userId: req.user.id 
      },
      data: req.body
    });
    res.json({ success: true, message: "Updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

// 5. DELETE: Only owner can delete
exports.deleteRestaurant = async (req, res) => {
  try {
    await prisma.restaurant.deleteMany({
      where: { 
        id: parseInt(req.params.id),
        userId: req.user.id 
      }
    });
    res.json({ success: true, message: "Restaurant deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

// 6. GET PUBLIC: For the QR Code (No login needed)
exports.getRestaurantBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: { menuItems: true }
    });
    if (!restaurant) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error" });
  }
};