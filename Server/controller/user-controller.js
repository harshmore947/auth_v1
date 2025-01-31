const { User } = require("../model/user-model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const z = require("zod");

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
    // Validate input
    // const result = userSignupSchema.safeParse(req.body);
    // if (!result.success) {
    //   return res.status(400).json({ msg: "Invalid input", errors: result.error.errors });
    // }

    const { userName, email, password } = req.body;

    // Check if the user exists
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(403).json({ msg: "User already exists, please login" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ userName, email, password: hashedPassword });
    await newUser.save();

    // Generate JWT Token (only storing user ID)
    const accessToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "1h" } // Default expiry 1 hour
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


module.exports = { signupUser, loginUser };
