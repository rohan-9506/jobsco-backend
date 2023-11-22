global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

const mongoose = require('mongoose');

mongoose.set("strictQuery", true);
mongoose.connect("mongodb+srv://rohanrai40679:Shivani8826@cluster0.qhakv4a.mongodb.net/job_board", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
var db = mongoose.connection;
db.on("open",()=>console.log("connected to DB"));
db.on("error",()=>console.log("error occured to DB"));