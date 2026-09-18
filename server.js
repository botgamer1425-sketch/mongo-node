const express = require("express");
const fs = require("fs");
const EventEmitter = require("events");
const path = require("path");

const app = express();
const PORT = 3000;

// File paths
const usersFile = path.join(__dirname, "users.json");
const auditFile = path.join(__dirname, "audit.log");

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// Helper Functions
// ===============================

function readUsers() {
    const data = fs.readFileSync(usersFile, "utf-8");
    return JSON.parse(data);
}

function saveUsers(users) {
    fs.writeFileSync(
        usersFile,
        JSON.stringify(users, null, 2)
    );
}

// ===============================
// EventEmitter
// ===============================

const userEvents = new EventEmitter();

// Signup event
userEvents.on("signup", (user) => {
    const message =
        `[${new Date().toLocaleString()}] SIGNUP: ${user.name} (${user.email})\n`;

    fs.appendFileSync(auditFile, message);
});

// Login event
userEvents.on("login", (user) => {
    const message =
        `[${new Date().toLocaleString()}] LOGIN: ${user.name} (${user.email})\n`;

    fs.appendFileSync(auditFile, message);
});

// ===============================
// Sign Up Route
// ===============================

app.post("/signup", (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    const users = readUsers();

    // Check if email already exists
    const existingUser = users.find(
        user => user.email === email
    );

    if (existingUser) {
        return res.status(400).json({
            message: "Email already registered."
        });
    }

    // Create new user
    const newUser = {
        name,
        email,
        password
    };

    users.push(newUser);

    // Save user to JSON file
    saveUsers(users);

    // Emit signup event
    userEvents.emit("signup", newUser);

    res.json({
        message: "Registration successful!"
    });
});

// ===============================
// Login Route
// ===============================

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required."
        });
    }

    const users = readUsers();

    // Find matching user
    const user = users.find(
        user =>
            user.email === email &&
            user.password === password
    );

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password."
        });
    }

    // Emit login event
    userEvents.emit("login", user);

    res.json({
        message: "Login successful!",
        name: user.name
    });
});

// ===============================
// Start Server
// ===============================

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});