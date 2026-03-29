const prisma = require("../lib/prisma");

// 1. Add item to menu
exports.createMenuItem = async (req, res) => {
  try {
    const { id } = req.params; // Restaurant ID
    const { name, price, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Invalid item name." });
    }
    if (price === undefined || isNaN(price)) {
      return res.status(400).json({ success: false, message: "Valid price is required." });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        price: parseFloat(price),
        description: description ? description.trim() : null,
        restaurantId: parseInt(id)
      }
    });
    res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add menu item." });
  }
};

// 2. Get the menu for a restaurant
exports.getMenuForRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId: parseInt(id) }
    });
    res.json({ success: true, count: menuItems.length, data: menuItems });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch menu." });
  }
};

// 3. Update a menu item
exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params; // Menu Item ID
    const { name, price, description } = req.body;

    const updatedMenuItem = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: { 
        name: name ? name.trim() : undefined, 
        price: price ? parseFloat(price) : undefined,
        description: description ? description.trim() : undefined
      },
    });
    res.json({ success: true, data: updatedMenuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update." });
  }
};

// 4. Delete a menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.menuItem.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: "Menu item deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete." });
  }
};