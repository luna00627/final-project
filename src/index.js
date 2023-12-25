const express = require("express");
const path = require("path");
const excelModule = require(path.join(__dirname, "../energy/food"));
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
app.get("/user", (req, res) => {
    const userData = req.session.userData;
    res.render("user", { userData });
});
app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/home",async(req, res) => {
    const userData = req.session.userData;
    res.render("home",{userData});
})
app.get("/about",async(req, res) => {
    const userData = req.session.userData;
    res.render("about",{userData});
})
app.get("/cal", async(req, res) => {
    // Access user data from session if needed
    const userData = req.session.userData;
    const calories = calculator(userData);
    const foodData = await excelModule.readExcel();
    // Render recipe.html and pass any necessary data
    res.render("cal", {calories, foodData});
});
app.get("/recipe", async(req, res) => {
    const foodData = await excelModule.readExcel();
    console.log("foodData:", foodData);
    res.render("recipe", {foodData});
});
// Register User
app.post("/user", async (req, res) => {
    try {
        // 取得表單提交的資料
        const updatedData = {
            password: req.body.password,
            gender: req.body.gender,
            age: req.body.age,
            weight: req.body.weight,
            height: req.body.height,
            exercise: req.body.exercise,
            goal: req.body.goal
        };
        if (req.body.newPassword && req.body.newPassword === req.body.confirmPassword) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(req.body.newPassword, saltRounds);
            updatedData.password = hashedPassword;
        }
        // 更新使用者資料
        const updatedUser = await collection.findOneAndUpdate(
            { name: req.session.userData.name },
            { $set: updatedData },
            { new: true }
        );

        // 更新 session 中的使用者資料
        req.session.userData = updatedUser;

        // 重新導向到使用者首頁或其他適當的頁面
        res.redirect("/home");
    } catch (error) {
        // 處理錯誤，例如顯示錯誤訊息或重新導向到錯誤頁面
        console.error(error);
        res.send("Error updating user data");
    }
});
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
function calculator(userData){
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
    console.log(ans);
    return ans;
}

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
            res.redirect("/home"); // Redirect to /cal route
        }
    }
    catch {
        res.send("wrong Details");
    }
});


const port = process.env.PORT||5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});