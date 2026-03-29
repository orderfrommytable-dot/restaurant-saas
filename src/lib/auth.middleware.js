const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  // 1. Check if the user brought a wristband in the "Authorization" header
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Access denied. No VIP wristband provided." });
  }

  try {
    // 2. The header looks like "Bearer eyJhbGci...", so we split it to just get the token
    const token = authHeader.split(" ")[1];

    // 3. Verify the token using your secret key from the .env file
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach the user's ID to the request so the Brain knows exactly who is logged in
    req.user = verified;

    // 5. Everything is good! Open the door and let them through to the Brain.
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid or expired wristband." });
  }
};

module.exports = protect;