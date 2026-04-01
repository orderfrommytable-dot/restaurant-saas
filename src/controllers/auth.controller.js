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

    // NOTE: In production, you would send 'generatedOtp' via Email/SMS here.
    console.log(`🔑 SECURITY CODE FOR ${email}: ${generatedOtp}`);

    res.json({ 
      success: true, 
      message: "Verification code sent!", 
      dev_otp: generatedOtp // Sending this back only for testing purposes!
    });
  } catch (error) {
    res.status(400).json({ success: false, message: "User already exists or data invalid" });
  }
};

// --- 2. VERIFY (The 4-Digit Check) ---
exports.verify = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.otp === otp) {
      // Unlock the account
      await prisma.user.update({
        where: { email },
        data: { isVerified: true, otp: null }
      });

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.json({ success: true, token, message: "Account verified!" });
    } else {
      res.status(400).json({ success: false, message: "Invalid security code" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Verification failed" });
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
    res.status(500).json({ success: false, message: "Login error" });
  }
};