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
    email: req.body.email,
    password: req.body.password,
    username: req.cookies["username"]
  };
  // test purpose
  console.log(templateVars);
  res.render("register", templateVars);
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
    username: req.cookies["username"],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = {
    username: req.cookies["username"],
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