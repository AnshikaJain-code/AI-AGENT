import User from "../models/user.js";
export const login_c = async (req, res) => {
  const { name, password } = req.body;

  
  if (!name || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  
  const user = await User.findOne({ name });

 
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

 
  if (user.password !== password) {
    return res.status(401).json({ message: "Password incorrect" });
  }

 
  res.status(200).json({ message: "Login successful" });
};
