const express = require("express");
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const { getUserByEmail } = require('./helpers.js');

const app = express();
const PORT = process.env.PORT || 8080; // default port 8080


// morgan middleware allows to log the request in the terminal
app.use(morgan('short'));

// Setting session cookie
app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
  })
);

// Setting ejs as the template engine
app.set("view engine", "ejs");

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// // create a middlware function
// const setCurrentUser = (req, res, next) => {

//   const userId = req.session['user_id'];
//   const userObj = usersDb[userId] || null;

//   req.currentUser = userObj;

//   console.log(req.currentUser);
//   // 2 potential values
//   // a. undefined => not logged in
//   // b. user object

//   // call next to pass the flow to the next middleware
//   next();

// };

// // activate the middleware function
// app.use(setCurrentUser);


// Define urlDatabase object { shortURL: { LongURL, userID } }
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "kiwi@gmail.com",
    password: "$2b$10$eBSEkIqKskLoTgYXgA8d5ues/j99mBfNPADcHgfiGC7EoXEoJf/sq"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2b$10$eBSEkIqKskLoTgYXgA8d5ues/j99mBfNPADcHgfiGC7EoXEoJf/sq"
  }
}

// function that returns a string of 6 random alphanumeric characters
const generateRandomString = () => {
  const arr = '0123456789abcdefghijklmnopqrstuvwxyz'
  var result = '';
  for (var i = 6; i > 0; i--) {
    result += arr[Math.floor(Math.random() * arr.length)];
  }
  return result;
};



// Function which returns the URLs where the userID is equal to the id of the currently logged-in user
const urlsForUser = (id) => {

  const urlArr = [];
  // Display only URLs shortened by logged in user
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      const urlObj = {
        shortURL: shortURL,
        longURL: urlDatabase[shortURL].longURL
      }
      urlArr.push(urlObj);
    }
  }
  return urlArr;
};



// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// Display the register form
app.get("/register", (req, res) => {

  const templateVars = {
    user: users[req.session["user_id"]]
  };

  res.render("register", templateVars);
});

app.post("/register", (req, res) => {

  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  const emailCheck = getUserByEmail(email, users);

  // send 400 error code if email or password field is blank or there's a duplicate
  if (!email || !password || emailCheck) {
    res.sendStatus(400);
    res.redirect("/register");
  }

  const id = generateRandomString();

  users[id] = {
    id,
    email,
    password
  }

  req.session["user_id"] = users[id].id;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {

  const templateVars = {
    user: users[req.session["user_id"]]
  };

  res.render("login", templateVars);
});

app.post("/login", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;
  const userObj = getUserByEmail(email, users);

  // if email doesn't exist, send 403 error
  if (!userObj) {
    res.sendStatus(403);
  }

  // if password doesn't match, send 403 error
  if (!bcrypt.compareSync(password, userObj.password)) {
    res.sendStatus(403);
  }

  // create cookie using the userObj.id then redirect to /urls
  req.session["user_id"] = userObj.id;
  console.log(req.session["user_id"])
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  // Clear the cookies
  req.session["user_id"] = null;
console.log('clear session',req.session["user_id"])
  res.redirect("/login");
});

// Create new shortURL for longURL provided by user, then redirect to the shortURL page
app.post("/urls/new", (req, res) => {
  const shortURL = generateRandomString();
  const userID = req.session["user_id"];

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: userID
  };

  res.redirect(`/urls/${shortURL}`);
});

// Display URLs info
app.get("/urls", (req, res) => {

  const userID = req.session["user_id"];

  // Display an error message if user is not logged in
  if (!userID) {
    res.send("Please login or register first!");
  }
  
  const urlArr = urlsForUser(userID);

  const templateVars = {
    user: users[userID],
    urls: urlArr
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session["user_id"];

  // If user is not logged in, redirect to login page
  if (!userID) {
    res.redirect("/login");
  }

  const templateVars = {
    user: users[userID]
  };
  res.render("urls_new", templateVars);
});

// Displays URL info and render it to urls_show ejs file
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session["user_id"];

  const templateVars = {
    user: users[userID],
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL
  };

  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {

  res.send(urlDatabase)
});

// Update the longURL and return to /urls page
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = req.body.longURL;

  res.redirect("/urls");
});

// Delete the URL record
app.post("/urls/:shortURL/delete", (req, res) => {

  const userID = req.session["user_id"];
  const shortURL = req.params.shortURL;
  const urlUserID = urlDatabase[shortURL].userID;

  // Display an error message if user is not logged in
  if (!userID) {
    res.send("Please login or register first!");
  }

  if (urlUserID !== userID) {
    res.send(`You don't have access to user's (${urlUserID}) page!`)
  }
  

  if (urlUserID === userID) {
  delete urlDatabase[shortURL];
  }
  res.redirect("/urls");

});

// Redirect to website using shortURL
app.get("/u/:shortURL", (req, res) => {
  const userID = req.session["user_id"];
  const urlUserID = req.params.id;

  // Display an error message if user is not logged in
  if (!userID) {
    res.send("Please login or register first!");
  }

  if (urlUserID !== userID) {
    res.send(`You don't have access to user's (${urlUserID}) page!`)
  }

  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;

  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});