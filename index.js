const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const port = 8000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const employeeSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
});

const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

// hiiiiiiiiiiiiiiiiiii
//heloo

const Message = mongoose.model("Message", messageSchema);

const Employee = mongoose.model("Employeee", employeeSchema, "employeees");

mongoose
  .connect("mongodb+srv://lakshan0714:lakshan123@hr.mb9wr19.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });

app.listen(port, () => {
  console.log("Server running on port 8000");
});

app.use(express.static("build"));

// Route for serving the HomeScreen
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/build/index.html");
});

// Create JWT token
const createToken = (email, role) => {
  const payload = { email, role };
  const token = jwt.sign(payload, "Q$r2K6WBn!jCW%Zk", { expiresIn: "1h" });
  return token;
};

// Login endpoint
app.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res
      .status(400)
      .json({ message: "Email, password, and role are required" });
  }

  try {
    // Find user in the database
    const user = await Employee.findOne({ email, password, role });

    if (user) {
      const token = createToken(user.email, user.role);

      // Send the token, role, and the user (employee) details in the response
      return res.status(200).json({
        token,
        role: user.role,
        employee: {
          username: user.email, // Assuming the email is used as the username
          name: user.email.split("@")[0], // Example to extract name from email, adjust as needed
          // Include other necessary fields if available, e.g., user.name, user.id, etc.
        },
      });
    } else {
      return res
        .status(404)
        .json({ message: "Invalid email, password, or role!" });
    }
  } catch (error) {
    console.error("Error finding user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint to send a message
app.post("/sendMessage", async (req, res) => {
  const { sender, receiver, message } = req.body;

  if (!sender || !receiver || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();
    return res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/getMessages", async (req, res) => {
  const { user1, user2 } = req.query;

  console.log("Fetching messages for:", { user1, user2 });

  if (!user1 || !user2) {
    return res.status(400).json({ message: "Both users are required" });
  }

  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ timestamp: 1 });

    console.log("Retrieved messages:", messages);

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error retrieving messages:", error);
    return res
      .status(500)
      .json({ message: "Internal server error xxxxxxxxxx" });
  }
});
