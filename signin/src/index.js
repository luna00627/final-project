const express = require("express");
const path = require("path");
const collection = require("./config");
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
// convert data into json format
app.use(express.json());
// Static file
app.use(express.static("public"));

app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

app.use(express.urlencoded({ extended: false }));
//use EJS as the view engine
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});
app.get("/cal", (req, res) => {
     // Access user data from session
     const userData = req.session.userData;
    res.render("cal", {userData});
});
app.get("/recipe", (req, res) => {
    // Access user data from session if needed
    const calories = req.session.calories;

    // Render recipe.html and pass any necessary data
    res.render("recipe", {calories });
});
// Register User
app.post("/signup", async (req, res) => {

    const data = {
        name: req.body.username,
        password: req.body.password,
        gender: req.body.gender,
        age: req.body.age,
        weight: req.body.weight,
        height: req.body.height,
        exercise: req.body.exercise,
        goal: req.body.goal

    }

    // Check if the username already exists in the database
    const existingUser = await collection.findOne({ name: data.name });

    if (existingUser) {
        res.send('User already exists. Please choose a different username.');
    } else {
        // Hash the password using bcrypt
        const saltRounds = 10; // Number of salt rounds for bcrypt
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword; // Replace the original password with the hashed one

        const userdata = await collection.insertMany(data);
        res.render("login");
    }

});
app.post("/cal", async (req, res) => {
    const userData = req.session.userData;
    
    if (!userData) {
        // If userData is not found in session, redirect to login
        res.redirect("/");
        return;
    } 
    const { gender, age, weight, height, goal, exercise } =  userData;
    let ans = 0;

    if (gender === "boy") {
        ans = 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) + 5;
    } else if (gender === "girl") {
        ans = 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) - 161;
    }
    
    if (exercise === "no") {
        ans *= 1.2;
    } else if (exercise === "small") {
        ans *= 1.4;
    } else if (exercise === "medium") {
        ans *= 1.6;
    } else if (exercise === "large") {
        ans *= 1.8;
    } else if (exercise === "extra") {
        ans *= 2;
    }

    if (goal === "cut") {
        ans *= 0.8;
    } else if (goal === "cutLight") {
        ans *= 0.9;
    } else if (goal === "bulk") {
        ans *= 1.1;
    } else if (goal === "bulkLight") {
        ans *= 1.2;
    }
    
    ans = Math.round(ans);
    console.log("ans value:", ans);
    req.session.calories = ans;
    res.redirect("/recipe");
        
});

// Login user 
app.post("/login", async (req, res) => {
    try {
        const check = await collection.findOne({ name: req.body.username });
        if (!check) {
            res.send("User name cannot found")
        }
        // Compare the hashed password from the database with the plaintext password
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            res.send("wrong Password");
        }
        else {
            req.session.userData = check;
            console.log("Redirecting to /cal");
            res.redirect("/cal"); // Redirect to /cal route
        }
    }
    catch {
        res.send("wrong Details");
    }
});


const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});