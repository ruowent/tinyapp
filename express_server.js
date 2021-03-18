const express = require("express");
const morgan = require('morgan');
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");

const app = express();
const PORT = 8080; // default port 8080


// morgan middleware allows to log the request in the terminal
app.use(morgan('short'));
app.use(cookieParser());

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "kiwi@gmail.com",
    password: "1234"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
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

// helper function to look up if email address exsits in the object database
const emailLookup = (emailInput) => {

  for (user in users) {
    const userObj = users[user];
    if (userObj.email === emailInput) {
      return userObj;
    }
  }
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

app.get("/register", (req, res) => {

  const templateVars = {
    user: users[req.cookies["user_id"]]
  };

  res.render("register", templateVars);
});

app.post("/register", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;
  const emailCheck = emailLookup(email);

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

  res.cookie("user_id", users[id].id);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {

  const templateVars = {
    user: users[req.cookies["user_id"]]
  };

  res.render("login", templateVars);
});

app.post("/login", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;
  const userObj = emailLookup(email);

  // if email doesn't exist, send 403 error
  if (!userObj) {
    res.sendStatus(403);
  }

  // if password doesn't match, send 403 error
  if (userObj.password !== password) {
    res.sendStatus(403);
  }

  // create cookie using the userObj.id then redirect to /urls
  res.cookie("user_id", userObj.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// Create new shortURL for longURL provided by user, then redirect to the shortURL page
app.post("/urls/new", (req, res) => {
  const shortURL = generateRandomString();
  const userID = req.cookies["user_id"];

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: userID
  };

  res.redirect(`/urls/${shortURL}`);
});

// Display URLs info
app.get("/urls", (req, res) => {

  const userID = req.cookies["user_id"];

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
  const userID = req.cookies["user_id"];

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
  const userID = req.cookies["user_id"];

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

  const userID = req.cookies["user_id"];
  const urlUserID = req.params.id;

  // Display an error message if user is not logged in
  if (!userID) {
    res.send("Please login or register first!");
  }

  if (urlUserID !== userID) {
    res.send(`You don't have access to user's (${urlUserID}) page!`)
  }
  
  const shortURL = req.params.shortURL;
  if (urlUserID === userID) {
  delete urlDatabase[shortURL];
  }
  res.redirect("/urls");

});

// Redirect to website using shortURL
app.get("/u/:shortURL", (req, res) => {
  const userID = req.cookies["user_id"];
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
