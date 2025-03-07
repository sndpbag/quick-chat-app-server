 
 

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const rateLimit = require("express-rate-limit");
 


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


// User Schema
const UserSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, unique: true },
    password: String,
    terms: Boolean,
    socketId: { type: String, default: "" }  // 👈 নতুন ফিল্ড
});
const User = mongoose.model("User", UserSchema);




// ✅ **Signup Route**
app.post("/signup", async (req, res) => {
    try {
        // 1️⃣ **ইউজার ইনপুট সংগ্রহ করুন**
        const { fullName, email, password, terms } = req.body;
       

        // 2️⃣ **ইনপুট ভ্যালিডেশন**
        if (!fullName || !email || !password || terms === false) {
            return res.status(400).json({ error: "All fields are required!" });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long!" });
        }

        // 3️⃣ **ইমেইল ডাটাবেজে আছে কিনা চেক করুন**
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists!" });
        }

        // 4️⃣ **পাসওয়ার্ড হ্যাশ করুন**
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5️⃣ **নতুন ইউজার তৈরি করুন**
        const newUser = new User({ fullName, email, password: hashedPassword, terms });
        await newUser.save();

        // 6️⃣ **সফল হলে রেসপন্স দিন**
        res.status(201).json({ message: "User registered successfully!", user: { fullName, email } });

        // ✅ **Debugging এর জন্য Console লগ করা**
        console.log("New User Created:", newUser);
        
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ error: "Internal Server Error!" });
    }
});



// Rate Limiting Middleware (Login Brute-force Attack Protection)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 মিনিটের সময়সীমা
    max: 5, // ৫ বার ভুল পাসওয়ার্ড দিলে ব্লক করবে
    message: { error: "Too many login attempts. Please try again later." },
    standardHeaders: true, 
    legacyHeaders: false, 
});



// Login Route with Rate Limiting
app.post("/login", loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found!" });

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Incorrect password!" });

        // Update socket ID (if needed for chat system)
        user.socketId = req.body.socketId || null;
        await user.save();

        res.json({ fullName: user.fullName, socketId: user.socketId });

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});





app.get('/', (req, res) => {
  res.send('Hello World!')
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));