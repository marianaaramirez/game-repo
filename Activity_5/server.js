const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static("public"));

//Conect MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "catCafe"
});

db.connect((err) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log("MySQL connected");
});

//Obtain cats
app.get("/api/cats", (req, res) => {

    db.query(
        "SELECT * FROM Cats",
        (err, results) => {

            if(err){
                return res.status(500).json(err);
            }

            res.json(results);
        }
    );
});

//Obtain menu 
app.get("/api/menu/:day", (req, res) => {

    const day = req.params.day;

    db.query(
        "SELECT * FROM MenuItems WHERE dayOfWeek = ?",
        [day],
        (err, results) => {

            if(err){
                return res.status(500).json(err);
            }

            res.json(results);
        }
    );
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);