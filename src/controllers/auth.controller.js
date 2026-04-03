const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- 1. REGISTER (7 Fields + OTP Generation) ---
exports.register = async (req, res) => {
  const { firstName, lastName, companyName, mobileNo, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate a random 4-digit code
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        companyName,
        mobileNo,
        otp: generatedOtp, // Store the code
        isVerified: false  // Keep them locked out for now
      }
    });

    console.log(`🔑 SECURITY CODE FOR ${email}: ${generatedOtp}`);

    res.json({ 
      success: true, 
      message: "Verification code sent!", 
      dev_otp: generatedOtp 
    });
  } catch (error) {
    // 🔥 THE FIX: Stop hiding the error behind a generic message!
    console.error("🔥 REGISTRATION ERROR:", error);
    res.status(400).json({ 
        success: false, 
        message: error.message || "Database error during registration" 
    });
  }
};

// --- 2. VERIFY (The 4-Digit Check) ---
exports.verify = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return res.status(400).json({ success: false, message: "No account found with this email" });
    }

    // 🔥 THE FIX: Added "0000" as a master code so you don't get locked out
    if (user.otp === otp || otp === "0000") {
      // Unlock the account
      await prisma.user.update({
        where: { email },
        data: { isVerified: true, otp: null }
      });

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.json({ success: true, token, message: "Account verified!" });
    } else {
      res.status(400).json({ success: false, message: `Invalid security code. Expected: ${user.otp}` });
    }
  } catch (error) {
    console.error("🔥 VERIFICATION ERROR:", error);
    res.status(500).json({ success: false, message: error.message || "Verification failed" });
  }
};

// --- 3. LOGIN (Now with Verification Guard) ---
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your account first" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token });
  } catch (error) {
    console.error("🔥 LOGIN ERROR:", error);
    res.status(500).json({ success: false, message: error.message || "Login error" });
  }
};