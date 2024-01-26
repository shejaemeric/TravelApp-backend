const User = require("./models/UserModel");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

// Replace this with your MongoDB Atlas connection string
const mongoURI =
  "mongodb+srv://shejaemeric051:dKEP7xOAaDi1QGAW@project.yjqodfk.mongodb.net/?retryWrites=true&w=majority";

// Connect to MongoDB Atlas
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

// Handle MongoDB connection events
db.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

db.once("open", () => {
  console.log("Connected to MongoDB Atlas");
});

// Authentication Endpoint - Register
app.post("/api/register", async (req, res) => {
  try {
    const { name, password, email } = req.body;

    // Check if email is already taken
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already taken" });
    }

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: await bcrypt.hash(password, 10), // Hash the password
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "Registration successful",
      userId: savedUser._id,
      user: savedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// User Retrieval Endpoint - Get All Users
app.get("/api/users", async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find({}, { password: 0 }); // Exclude password from the response

    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// User Retrieval Endpoint - Get User by ID
app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find user by ID in the database
    const user = await User.findById(id);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Exclude sensitive information like password before sending the response
    const { _id, name, email } = user;

    res.status(200).json({ user: { _id, name, email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if the password is correct
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate a JWT token for authentication
    const token = jwt.sign({ userId: user._id }, "your-secret-key", {
      expiresIn: "1h",
    });

    res.status(200).json({ token, userId: user._id, user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Data Synchronization Endpoint - Update User
app.put("/api/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { newData } = req.body;

    // Update user in the database
    await User.findByIdAndUpdate(id, newData);

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Data Synchronization Endpoint - Delete User
app.delete("/api/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Delete user from the database
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
