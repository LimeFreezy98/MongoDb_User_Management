const express = require("express");
const mongoose = require("mongoose");

const dbURL = process.env.DB_URL || "mongodb://localhost/mtech"
const app = express();
const port = process.env.PORT || 3020;
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(express.static("public"))

mongoose.connect(dbURL);
const db = mongoose.connection;
db.on('error', (err) => {
    console.log('DB connection error:',err);
});
db.once('open', () => {
    console.log('DB connected successfully');
});

const userSchema = new mongoose.Schema({
    userID: Number,
    firstName: String,
    lastName:  String,
    email:  String, 
    age:  Number,
    
});

const User = mongoose.model("User", userSchema);

app.post("/addUser", async (req, res) => {
    try {
      const lastUser = await User.findOne().sort({ userID: -1 });
      const nextUserID = lastUser ? lastUser.userID + 1 : 1;
  
      const user = new User({
        userID: nextUserID,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        age: req.body.age,
      });
  
      await user.save();
      res.redirect("/");
      res.status(201).json({ message: "User added", user });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/editUser", async (req, res) => {
    try {
      const { userID, firstName, lastName, email, age } = req.body;
  
      const user = await User.findOneAndUpdate(
        { userID: Number(userID) },
        {
          firstName,
          lastName,
          email,
          age: Number(age),
        },
        { new: true }
      );
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.json({ message: "User updated", user });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  

app.post('/deleteUser', async (req, res) => {
    try {
        const { userID } = req.body;
    
        const result = await User.findOneAndDelete({ userID });
    
        if (!result) {
          return res.status(404).json({ message: "User not found" });
        }
    
        res.json({ message: "User deleted" });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }

});

app.get("/users", async (req, res) => {
    try {
      const { sortBy = "firstName", order = "asc" } = req.query;
  
      const sortOrder = order === "desc" ? -1 : 1;
  
      const users = await User.find().sort({ [sortBy]: sortOrder });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });



  app.get("/search", async (req, res) => {
    try{ 
        const { q } = req.query;

        const users = await User.find({ 
            $or: [
                { firstName: { $regex: q, $options: "i" } },
                { lastName: { $regex: q, $options: "i" } },
              ],
            });
        
            res.json(users);
          } catch (err) {
            res.status(500).json({ error: err.message });
          }
        });

  app.listen(port, (err) => {
    if (err) console.log(err);
    console.log(`App Server listen on port: ${port}`);

});