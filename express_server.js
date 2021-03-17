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
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/register", (req, res) => {

  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  console.log(templateVars);
  res.render("register", templateVars);
});

const emailLookup = (emailInput) => {

  for (user in users) {
    const userObj = users[user];
    if (userObj.email === emailInput) {
      // return falsy value to indicate there's a duplicate email record
      return false;
    }
  }
  // return truthy value to indicate there no duplicate email address
  return true;
};

app.post("/register", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;
  const emailCheck = emailLookup(email);
  console.log('email, password, emailCheck', email, password, emailCheck)

  // send 400 error code if email or password field is blank or there's a duplicate
  if (!email || !password || !emailCheck) {
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

app.post("/login", (req, res) => {
  res.cookie("username",req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  console.log(req.cookies)
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  // Store shortURL and longURL key value pairs to the object
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = {
    user: users[req.cookies["user_id"]],
    shortURL: shortURL,
    longURL: urlDatabase[shortURL]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  console.log('shortURL',shortURL)
  urlDatabase[shortURL] = req.body.longURL;
  console.log('show urlDatabase obj: ', urlDatabase);
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;

  delete urlDatabase[shortURL];  
  res.redirect("/urls");

});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
 });
 
 app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
 });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});