const { User } = require("../model/user-model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const z = require("zod");
const nodemailer = require("nodemailer");

// User Signup Schema Validation
const userSignupSchema = z.object({
  userName: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// Partial schema for login
const userLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string(),
});

// Signup Controller
const signupUser = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    // Check if the user already exists by email or username
    const userExist = await User.findOne({ 
      $or: [{ email }, { userName }] 
    });

    if (userExist) {
      return res.status(403).json({ 
        msg: "User with this email or username already exists, please login" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ userName, email, password: hashedPassword });
    await newUser.save();

    // Generate JWT Token
    const accessToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "1h" } 
    );

    res.status(201).json({
      msg: "User created successfully",
      accessToken,
      user: { userName: newUser.userName, email: newUser.email },
    });

  } catch (error) {
    res.status(500).json({ msg: "Error in register user controller", error: error.message });
  }
};

// Login Controller
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const userExist = await User.findOne({ email });
    if (!userExist) {
      return res.status(404).json({ msg: "User not found, please sign up" });
    }

    // Compare password
    const isMatchPassword = await bcrypt.compare(password, userExist.password);
    if (!isMatchPassword) {
      return res.status(403).json({ msg: "Incorrect password" });
    }

    // Generate JWT Token
    const accessToken = jwt.sign(
      { userId: userExist._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "1h" }
    );

    // Set cookie with the token
    res.cookie("accessToken", accessToken, {
      httpOnly: true,  // Prevents JavaScript access (more secure)
      secure: process.env.NODE_ENV === "production",  // Use HTTPS in production
      sameSite: "Strict", // Helps prevent CSRF attacks
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.status(200).json({
      msg: `${userExist.userName} logged in successfully`,
      user: userExist,
    });

  } catch (error) {
    res.status(500).json({ msg: "Error in user login", error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Generate a reset token (expires in 15 minutes)
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Reset link
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Configure Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h3>Password Reset</h3>
        <p>Click the link below to reset your password. This link is valid for 15 minutes.</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ msg: "Password reset link sent to your email" });

  } catch (error) {
    res.status(500).json({ msg: "Error in forgot password process", error: error.message });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired token" });
    }

    // Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ msg: "Password reset successful, you can now login" });

  } catch (error) {
    res.status(500).json({ msg: "Error in resetting password", error: error.message });
  }
};


module.exports = { signupUser, loginUser, forgotPassword, resetPassword };
