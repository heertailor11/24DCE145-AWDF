
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const NodeCache = require("./utils/cache");
const Task = require("./models/Task");
const User = require("./models/User");
const authMiddleware = require("./middleware/auth");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   Middleware
========================= */

app.use(cors());
app.use(express.json());

/* =========================
   Cache statistics
========================= */

let cacheHits = 0;
let cacheMisses = 0;

/* =========================
   Helper: invalidate cache
========================= */

function invalidateTaskCache(taskId) {
    NodeCache.del("all_tasks");

    if (taskId) {
        NodeCache.del(`task_${taskId}`);
    }
}

/* =========================
   Register
========================= */

app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Registration successful"
        });
    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
});

/* =========================
   Login
========================= */

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});

/* =========================
   Current user
========================= */

app.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({
            message: "Could not fetch user",
            error: error.message
        });
    }
});

/* =========================
   GET all tasks - CACHED
========================= */

app.get("/tasks", authMiddleware, async (req, res) => {
    try {
        const cachedTasks = NodeCache.get("all_tasks");

        if (cachedTasks !== undefined) {
            cacheHits++;
            return res.json(cachedTasks);
        }

        cacheMisses++;

        const tasks = await Task.find();

        NodeCache.set("all_tasks", tasks);

        res.json(tasks);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching tasks",
            error: error.message
        });
    }
});

/* =========================
   GET single task - CACHED
========================= */

app.get("/tasks/:id", authMiddleware, async (req, res) => {
    try {
        const cacheKey = `task_${req.params.id}`;
        const cachedTask = NodeCache.get(cacheKey);

        if (cachedTask !== undefined) {
            cacheHits++;
            return res.json(cachedTask);
        }

        cacheMisses++;

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        NodeCache.set(cacheKey, task);

        res.json(task);
    } catch (error) {
        res.status(400).json({
            message: "Error fetching task",
            error: error.message
        });
    }
});

/* =========================
   POST create task
========================= */

app.post("/tasks", authMiddleware, async (req, res) => {
    try {
        const task = new Task(req.body);
        const savedTask = await task.save();

        invalidateTaskCache();

        res.status(201).json(savedTask);
    } catch (error) {
        res.status(400).json({
            message: "Error creating task",
            error: error.message
        });
    }
});

/* =========================
   PUT update task
========================= */

app.put("/tasks/:id", authMiddleware, async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        invalidateTaskCache(req.params.id);

        res.json(task);
    } catch (error) {
        res.status(400).json({
            message: "Error updating task",
            error: error.message
        });
    }
});

/* =========================
   DELETE task
========================= */

app.delete("/tasks/:id", authMiddleware, async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        invalidateTaskCache(req.params.id);

        res.json({
            message: "Task deleted successfully"
        });
    } catch (error) {
        res.status(400).json({
            message: "Error deleting task",
            error: error.message
        });
    }
});

/* =========================
   Cache debug endpoint
========================= */

app.get("/debug/cache", authMiddleware, (req, res) => {
    res.json({
        cacheHits,
        cacheMisses,
        cacheKeys: NodeCache.keys(),
        cacheStats: NodeCache.getStats()
    });
});

/* =========================
   404 handler
========================= */

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});


/* =========================
   Start server
========================= */

if (require.main === module) {
    mongoose
        .connect(process.env.MONGO_URI)
        .then(() => {
            console.log("MongoDB Connected");

            app.listen(PORT, () => {
                console.log(`Server running on Port ${PORT}`);
            });
        })
        .catch((error) => {
            console.error("MongoDB connection failed:", error.message);
            process.exitCode = 1;
        });
}

module.exports = app;
