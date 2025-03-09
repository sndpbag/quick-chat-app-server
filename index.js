 
 

// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");
// const cors = require("cors");
// const { Server } = require("socket.io");
// const http = require("http");
// const rateLimit = require("express-rate-limit");
 


// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: "*",
//         methods: ["GET", "POST"]
//     }
// });

// // Middleware
// app.use(cors());
// app.use(express.json());


// // MongoDB Connection
// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(() => console.log("MongoDB Connected"))
// .catch(err => console.log(err));


// // User Schema
// const UserSchema = new mongoose.Schema({
//     fullName: String,
//     email: { type: String, unique: true },
//     password: String,
//     terms: Boolean,
//     socketId: { type: String, default: "" }  // 👈 নতুন ফিল্ড
// });


// //  message schema
// const messageSchema = new mongoose.Schema({
//     text: { type: String, required: true }, // ম্যাসেজ টেক্সট
//     sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // প্রেরক (User এর ObjectId)
//     receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // প্রাপক (User এর ObjectId)
//     timestamp: { type: Date, default: Date.now } // টাইমস্ট্যাম্প
// });

// const Message = mongoose.model("Message", messageSchema);
// const User = mongoose.model("User", UserSchema);




// // ✅ **Signup Route**
// app.post("/signup", async (req, res) => {
//     try {
//         // 1️⃣ **ইউজার ইনপুট সংগ্রহ করুন**
//         const { fullName, email, password, terms } = req.body;
       

//         // 2️⃣ **ইনপুট ভ্যালিডেশন**
//         if (!fullName || !email || !password || terms === false) {
//             return res.status(400).json({ error: "All fields are required!" });
//         }
//         if (password.length < 6) {
//             return res.status(400).json({ error: "Password must be at least 6 characters long!" });
//         }

//         // 3️⃣ **ইমেইল ডাটাবেজে আছে কিনা চেক করুন**
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ error: "Email already exists!" });
//         }

//         // 4️⃣ **পাসওয়ার্ড হ্যাশ করুন**
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // 5️⃣ **নতুন ইউজার তৈরি করুন**
//         const newUser = new User({ fullName, email, password: hashedPassword, terms });
//         await newUser.save();

//         // 6️⃣ **সফল হলে রেসপন্স দিন**
//         res.status(201).json({ message: "User registered successfully!", user: { fullName, email } });

//         // ✅ **Debugging এর জন্য Console লগ করা**
//         console.log("New User Created:", newUser);
        
//     } catch (error) {
//         console.error("Signup Error:", error);
//         res.status(500).json({ error: "Internal Server Error!" });
//     }
// });



// // Rate Limiting Middleware (Login Brute-force Attack Protection)
// const loginLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 মিনিটের সময়সীমা
//     max: 5, // ৫ বার ভুল পাসওয়ার্ড দিলে ব্লক করবে
//     message: { error: "Too many login attempts. Please try again later." },
//     standardHeaders: true, 
//     legacyHeaders: false, 
// });



 
// const users = {}; // Store userId → socketId mapping

// io.on("connection", (socket) => {
//     console.log("User connected with Socket ID:", socket.id);

//     // 🔹 User register করলে তার socket ID সংরক্ষণ করুন
//     socket.on("registerUser", async (userId) => {
//         users[userId] = socket.id; // Store user socket ID
//         await User.updateOne({ _id: userId }, { socketId: socket.id });
//         console.log(`User ${userId} registered with Socket ID: ${socket.id}`);
//     });

//     // 🔹 Private message পাঠানো
//     socket.on("sendPrivateMessage", async (messageData) => {
//         console.log("Private Message Received:", messageData);

//         try {
//             // নতুন ম্যাসেজ ডাটাবেজে সংরক্ষণ করুন
//             const newMessage = new Message({
//                 text: messageData.text,
//                 sender: messageData.sender,
//                 receiver: messageData.receiver,
//                 timestamp: new Date(),
//             });

//             console.log(newMessage)

//             await newMessage.save();

//             // 🔹 Receiver এর socket ID বের করুন
//             const receiverSocketId = users[messageData.receiver];

//             if (receiverSocketId) {
//                 // 🔹 Receiver-কে private message পাঠানো
//                 io.to(receiverSocketId).emit("receivePrivateMessage", {
//                     _id: newMessage._id,
//                     text: newMessage.text,
//                     sender: newMessage.sender,
//                     receiver: newMessage.receiver,
//                     timestamp: newMessage.timestamp,
//                 });
//             }

//             // 🔹 Sender-কে তার ম্যাসেজ আপডেট করার জন্য পাঠানো
//             socket.emit("receivePrivateMessage", {
//                 _id: newMessage._id,
//                 text: newMessage.text,
//                 sender: newMessage.sender,
//                 receiver: newMessage.receiver,
//                 timestamp: newMessage.timestamp,
//             });

//         } catch (error) {
//             console.error("Error saving message:", error);
//         }
//     });

//     // 🔹 Disconnect হলে database থেকে socket ID মুছে ফেলা
//     socket.on("disconnect", async () => {
//         console.log("User disconnected:", socket.id);

//         try {
//             const userId = Object.keys(users).find((key) => users[key] === socket.id);
//             if (userId) {
//                 delete users[userId]; // Remove user from memory
//                 await User.updateOne({ _id: userId }, { $unset: { socketId: "" } });
//                 console.log(`Socket ID removed for user ${userId}`);
//             }
//         } catch (error) {
//             console.error("Error removing socket ID:", error);
//         }
//     });
// });



// // io.on("connection", (socket) => {
// //     console.log("User connected with Socket ID:", socket.id);


// //      // যখন ক্লায়েন্ট ম্যাসেজ পাঠাবে
// //      socket.on("sendMessage", async (messageData) => {
// //         console.log("Message Received:", messageData);

// //         try {
// //             // নতুন ম্যাসেজ ডাটাবেজে সংরক্ষণ করুন
// //             const newMessage = new Message({
// //                 text: messageData.text,
// //                 sender: messageData.sender,
// //             });

// //             await newMessage.save();

// //             // সকল ইউজারকে ম্যাসেজ পাঠিয়ে দিন
// //             io.emit("receiveMessage", newMessage);
// //         } catch (error) {
// //             console.error("Error saving message:", error);
// //         }
// //     });


// //     // 🔹 Disconnect হলে database থেকে socket ID মুছে ফেলা
// //     socket.on("disconnect", async () => {
// //         console.log("User disconnected:", socket.id);

// //         try {
// //             await User.updateOne({ socketId : socket.id }, { $unset: { socketId: "" } });
// //             console.log("Socket ID removed from database.");
// //         } catch (error) {
// //             console.error("Error removing socket ID:", error);
// //         }
// //     });
// // });




// // Login Route with Rate Limiting
// app.post("/login", loginLimiter, async (req, res) => {
//     const { email, password } = req.body;
    
//     try {
//         // Check if user exists
//         const user = await User.findOne({ email });
//         if (!user) return res.status(400).json({ error: "User not found!" });

//         // Validate password
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) return res.status(400).json({ error: "Incorrect password!" });

//         // Update socket ID (if needed for chat system)
//         user.socketId = req.body.socketId || null;
//         await user.save();

//         res.json({ fullName: user.fullName, socketId: user.socketId, id: user._id });

//     } catch (error) {
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });





// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));


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
    socketId: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    lastActive: Date,
});

// // Message schema
const messageSchema = new mongoose.Schema({
    text: { type: String, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    timestamp: { type: Date, default: Date.now },
    lastMessageAt: { type: Date, default: Date.now }

});

// Chat Schema (example)
// const messageSchema = new mongoose.Schema({
//     participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//     messages: [{
//       sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//       content: String,
//       timestamp: { type: Date, default: Date.now }
//     }],
//     lastMessageAt: { type: Date, default: Date.now }
//   });

const Message = mongoose.model("Message", messageSchema);
const User = mongoose.model("User", UserSchema);

// Rate Limiting Middleware (Login Brute-force Attack Protection)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 মিনিটের সময়সীমা
    max: 5, // ৫ বার ভুল পাসওয়ার্ড দিলে ব্লক করবে
    message: { error: "Too many login attempts. Please try again later." },
    standardHeaders: true, 
    legacyHeaders: false, 
});

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

        // 4️⃣ **পাসওয়ার্ড হ্যাশ করুন**
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

        res.json({ fullName: user.fullName, socketId: user.socketId, id: user._id });

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// API 1: GET /users/:userId - Gets user details
app.get('/users/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      
      // Find user by ID
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Update last active timestamp
      user.lastActive = new Date();
      await user.save();
      
      // Notify connected clients about user activity via Socket.io
      io.to(`user-${userId}`).emit('user_activity', { userId, action: 'profile_viewed' });
      
      // Return user data
      return res.status(200).json({
        success: true,
        data: {
          id: user._id,
          username: user.fullName,
          email: user.email,
          isOnline:user.socketId,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt,
          lastActive: user.lastActive
        }
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });
  
  // API 2: GET /users/:userId/recent-chats - Gets recent chats for a user
  app.get('/users/:userId/recent-chats', async (req, res) => {
    try {
      const userId = req.params.userId;

    
      
      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Find recent chats for the user, sorted by last message time
      const recentChats = await Message.find({ participants: userId })
        .sort({ lastMessageAt: -1 })
        .limit(20)
        .populate('participants', 'username firstName lastName')
        .populate('messages.sender', 'username');

        console.log("Fetched Chats:", recentChats); // ✅ Debugging Log
      
      // Format the response data
      const formattedChats = recentChats.map(chat => ({
        id: chat._id,
        participants: chat.participants.map(p => ({
          id: p._id,
          username: p.username,
          name: `${p.firstName} ${p.lastName}`.trim()
        })),
        lastMessage: chat.messages.length > 0 ? {
          content: chat.messages[chat.messages.length - 1].content,
          sender: chat.messages[chat.messages.length - 1].sender.username,
          timestamp: chat.messages[chat.messages.length - 1].timestamp
        } : null,
        unreadCount: 0 // This would need additional logic to calculate
      }));
      
      // Notify through Socket.io that user checked their chats
      io.to(`user-${userId}`).emit('user_activity', { userId, action: 'checked_recent_chats' });
      
      return res.status(200).json({
        success: true,
        data: formattedChats
      });
    } catch (error) {
      console.error('Error fetching recent chats:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });

 
 
 

 

// Get messages between two users
app.get("/messages/:senderId/:receiverId", async (req, res) => {
    try {
        const { senderId, receiverId } = req.params;
        
        const messages = await Message.find({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        }).sort({ timestamp: 1 });
        
        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get all users
app.get("/users", async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }); // Exclude password
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Socket.IO for real-time messaging
const users = {}; // Store userId → socketId mapping

io.on("connection", (socket) => {
    console.log("User connected with Socket ID:", socket.id);

    // User register করলে তার socket ID সংরক্ষণ করুন
    socket.on("registerUser", async (userId) => {
        if (!userId) {
            return socket.emit('registerError', { error: 'User ID is required' });
        }
        
        users[userId] = socket.id; // Store user socket ID
        await User.updateOne({ _id: userId }, { socketId: socket.id });
        console.log(`User ${userId} registered with Socket ID: ${socket.id}`);
    });

    // Private message পাঠানো
    socket.on("sendPrivateMessage", async (messageData) => {
        console.log("Private Message Received:", messageData);

        try {
            // Validate message data
            if (!messageData.text || !messageData.sender || !messageData.receiver) {
                return socket.emit('messageError', { error: 'Incomplete message data' });
            }
            
            // নতুন ম্যাসেজ ডাটাবেজে সংরক্ষণ করুন
            const newMessage = new Message({
                text: messageData.text,
                sender: messageData.sender,
                receiver: messageData.receiver,
                timestamp: new Date(),
            });

            await newMessage.save();

            // Receiver এর socket ID বের করুন
            const receiverSocketId = users[messageData.receiver];

            if (receiverSocketId) {
                // Receiver-কে private message পাঠানো
                io.to(receiverSocketId).emit("receivePrivateMessage", {
                    _id: newMessage._id,
                    text: newMessage.text,
                    sender: newMessage.sender,
                    receiver: newMessage.receiver,
                    timestamp: newMessage.timestamp,
                });
            }

            // Sender-কে তার ম্যাসেজ আপডেট করার জন্য পাঠানো
            socket.emit("messageSent", {
                _id: newMessage._id,
                text: newMessage.text,
                sender: newMessage.sender,
                receiver: newMessage.receiver,
                timestamp: newMessage.timestamp,
            });

        } catch (error) {
            console.error("Error saving message:", error);
            socket.emit('messageError', { error: 'Failed to save message' });
        }
    });

    // Disconnect হলে database থেকে socket ID মুছে ফেলা
    socket.on("disconnect", async () => {
        console.log("User disconnected:", socket.id);

        try {
            const userId = Object.keys(users).find((key) => users[key] === socket.id);
            if (userId) {
                delete users[userId]; // Remove user from memory
                await User.updateOne({ _id: userId }, { $unset: { socketId: "" } });
                console.log(`Socket ID removed for user ${userId}`);
            }
        } catch (error) {
            console.error("Error removing socket ID:", error);
        }
    });
});

app.get('/', (req, res) => {
  res.send('Chat Server API is running!')
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));