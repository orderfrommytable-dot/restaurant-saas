const express = require("express");
const router = express.Router();

const restaurantController = require("../controllers/restaurant.controller");
const menuController = require("../controllers/menu.controller");
const authController = require("../controllers/auth.controller");
const orderController = require("../controllers/order.controller"); 
const protect = require("../lib/auth.middleware");

// --- AUTH ROUTES (Public) ---
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);

// --- RESTAURANT ROUTES ---
router.post("/restaurants", protect, restaurantController.createRestaurant); 
router.get("/restaurants", protect, restaurantController.getAllRestaurants); 
router.get("/restaurants/:id", restaurantController.getRestaurantById);
router.put("/restaurants/:id", protect, restaurantController.updateRestaurant);
router.delete("/restaurants/:id", protect, restaurantController.deleteRestaurant);

// --- MENU ROUTES ---
router.post("/restaurants/:id/menu", protect, menuController.createMenuItem);
router.get("/restaurants/:id/menu", menuController.getMenuForRestaurant); 
router.put("/menu/:id", protect, menuController.updateMenuItem);
router.delete("/menu/:id", protect, menuController.deleteMenuItem);

// --- ORDER ROUTES ---
router.post("/orders", orderController.createOrder);
router.get("/restaurants/:restaurantId/orders", protect, orderController.getRestaurantOrders);
router.put("/orders/:id/status", protect, orderController.updateOrderStatus);

// --- QR CODE / CUSTOMER ROUTE ---
router.get("/public/menu/:slug", restaurantController.getRestaurantBySlug);

module.exports = router;