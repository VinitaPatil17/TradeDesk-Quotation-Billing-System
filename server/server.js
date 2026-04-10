const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const app = express();
app.set("trust proxy", 1);
const isAuthenticated = require("./middleware/authMiddleware");

const authRoutes = require("./routes/auth");

app.use(express.json());

app.use(session({
    secret: "tradedesk-secret-key", // 🔐 can be anything
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // true only in HTTPS
        sameSite: "none"
    }
}));

app.use("/api", authRoutes);

app.use(cors({
    origin: "https://tradedesk.co.in",
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.static("public"));
//app.use(express.static("views"));

app.set("view engine", "ejs");
app.set("views", "views");

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.render("welcome"); // or "welcome" whatever your first page is
});
app.get("/login",(req,res)=>{
res.render("login", {activePage:"login"});
});

app.get("/dashboard", isAuthenticated, (req, res) => {
    res.render("dashboard", {activePage:"dashboard"});
});
app.get("/products",(req,res)=>{
res.render("products", {activePage:"products"});
});

app.get("/ledgers",(req,res)=>{
res.render("ledgers",{activePage:"ledgers"});
});

app.get("/quotation",(req,res)=>{
res.render("quotation",{activePage:"quotation"});
});

app.get("/quotationTemplate",(req,res)=>{
res.render("quotationTemplate",{activePage:"quotationTemplate"});
});

app.get("/settings",(req,res)=>{
res.render("settings",{activePage:"settings"});
});

app.get("/forgot-password",(req,res)=>{
res.render("forgot-password",{activePage:"forgot-password"});
});

app.get("/verify-otp",(req,res)=>{
res.render("verify-otp",{activePage:"verify-otp"});
});

app.get("/reset-password",(req,res)=>{
res.render("reset-password",{activePage:"reset-password"});
});

const productRoutes = require("./routes/productRoutes");
app.use("/api", productRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});