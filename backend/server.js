const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

const PORT = 5000;


// Middleware

app.use(cors());
app.use(express.json());


// Connect to SQLite database

const dbPath = path.join(__dirname, "..", "assignment_tracker.db");

const db = new sqlite3.Database(dbPath, function(error) {

    if (error) {
        console.error("Database connection failed:", error.message);
    } else {
        console.log("Connected to SQLite database!");
    }

});
app.post("/api/register", async function(req, res) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email and password are required"
        });
    }

    const checkSql = `
        SELECT id
        FROM users
        WHERE email = ?
    `;

    db.get(checkSql, [email], async function(error, user) {
        if (error) {
            console.error(error.message);
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (user) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const insertSql = `
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `;

        db.run(
            insertSql,
            [name, email, hashedPassword],
            function(error) {
                if (error) {
                    console.error(error.message);
                    return res.status(500).json({
                        message: "Failed to register user"
                    });
                }

                res.status(201).json({
                    message: "User registered successfully",
                    userId: this.lastID
                });
            }
        );
    });
});

// Home route

app.get("/", function(req, res) {

    res.send("Student Assignment Tracker Backend is running!");

});


// GET all assignments

app.get("/api/assignments", function(req, res) {

    const sql = `
        SELECT
            id,
            subject,
            title,
            due_date AS dueDate,
            priority,
            status
        FROM assignments
        ORDER BY id ASC
    `;

    db.all(sql, [], function(error, rows) {

        if (error) {

            console.error(error.message);

            return res.status(500).json({
                message: "Failed to get assignments"
            });

        }

        res.json(rows);

    });

});


// POST new assignment

app.post("/api/assignments", function(req, res) {

    const {
        subject,
        title,
        dueDate,
        priority
    } = req.body;

    const sql = `
        INSERT INTO assignments
        (subject, title, due_date, priority, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [subject, title, dueDate, priority, "Pending"],
        function(error) {

            if (error) {

                console.error(error.message);

                return res.status(500).json({
                    message: "Failed to add assignment"
                });

            }

            res.status(201).json({
                id: this.lastID,
                subject: subject,
                title: title,
                dueDate: dueDate,
                priority: priority,
                status: "Pending"
            });

        }
    );

});


// PUT - Update assignment status

app.put("/api/assignments/:id", function(req, res) {

    const id = Number(req.params.id);
    const status = req.body.status;

    const sql = `
        UPDATE assignments
        SET status = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [status, id],
        function(error) {

            if (error) {

                console.error(error.message);

                return res.status(500).json({
                    message: "Failed to update assignment"
                });

            }

            if (this.changes === 0) {

                return res.status(404).json({
                    message: "Assignment not found"
                });

            }

            res.json({
                message: "Assignment updated successfully"
            });

        }
    );

});


// DELETE assignment

app.delete("/api/assignments/:id", function(req, res) {

    const id = Number(req.params.id);

    const sql = `
        DELETE FROM assignments
        WHERE id = ?
    `;

    db.run(
        sql,
        [id],
        function(error) {

            if (error) {

                console.error(error.message);

                return res.status(500).json({
                    message: "Failed to delete assignment"
                });

            }

            if (this.changes === 0) {

                return res.status(404).json({
                    message: "Assignment not found"
                });

            }

            res.json({
                message: "Assignment deleted successfully"
            });

        }
    );

});
app.post("/api/login", async function(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const sql = `
        SELECT *
        FROM users
        WHERE email = ?
    `;

    db.get(sql, [email], async function(error, user) {
        if (error) {
            console.error(error.message);
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email
            },
            "student_tracker_secret_key",
            {
                expiresIn: "1h"
            }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    });
});

// Start server

app.listen(PORT, function() {

    console.log(`Server running on http://localhost:${PORT}`);


});