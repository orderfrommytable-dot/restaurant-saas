const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs"); // The password scrambler
const jwt = require("jsonwebtoken"); // The VIP wristband maker

// 1. REGISTER A NEW USER
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if they left it blank
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Check if the email is already taken
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email is already registered" });
    }

    // Scramble (Hash) the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save the new user to the database
    const user = await prisma.user.create({
      data: {
        email: email,
        name: name,
        password: hashedPassword // NEVER save the real password!
      }
    });

    res.status(201).json({ success: true, message: "User registered successfully! 🎉" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error registering user" });
  }
};

// 2. LOGIN AN EXISTING USER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user in the database
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // Compare the typed password with the scrambled one in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // Generate the VIP Wristband (Token)
    const token = jwt.sign(
      { id: user.id }, 
      process.env.JWT_SECRET, // Uses the secret key from your .env file
      { expiresIn: "1d" } // Token expires in 1 day
    );

    res.json({ success: true, message: "Login successful!", token: token });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error logging in" });
  }
};