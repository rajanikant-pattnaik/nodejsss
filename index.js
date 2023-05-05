import express from "express";
import path from "path";
import connectDb from "./config/connectDb.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const user = mongoose.model("messages", userSchema);
const app = express();

dotenv.config();

connectDb();

app.use(express.static(path.join(path.resolve(), "public")));

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "sdjasdbajsdbjasd");
    req.user = await user.findById(decoded._id);
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  res.render("logout", { name: req.user.name });
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let nuser = await user.findOne({ email });
  if (!nuser) {
    return res.redirect("/register");
  }
  const isMatched = await bcrypt.compare(password, nuser.password);
  if (!isMatched) return res.render("login", { message: "Invalid password" });
  const token = jwt.sign({ _id: nuser._id }, "sdjasdbajsdbjasd");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  let nuser = await user.findOne({ email });
  if (nuser) {
    return res.redirect("/login");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  nuser = await user.create({ name, email, password: hashedPassword });
  const token = jwt.sign({ _id: nuser._id }, "sdjasdbajsdbjasd");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});
app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

const PORT = 5000 || process.env.PORT;
app.listen(PORT, () => {
  console.log(`The app is running at port ${PORT}`);
});
