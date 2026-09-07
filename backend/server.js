const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

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


// Start server

app.listen(PORT, function() {

    console.log(`Server running on http://localhost:${PORT}`);


});