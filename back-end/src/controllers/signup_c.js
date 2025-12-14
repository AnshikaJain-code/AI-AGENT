import User from "../models/user.js";

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }


    const user = await User.create({
      name,
      email,
      password
    });


    res.status(201).json({
      message: "User created successfully",
      userId: user._id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
