const express = require('express');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers.js');
const app = express();
const PORT = 8080; // default port 8080

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
app.set('view engine', 'ejs');

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// create a middlware function to extract userObj
const setCurrentUser = (req, res, next) => {

  const userId = req.session['user_id'];
  const userObj = users[userId];

  req.currentUser = userObj;
  // call next to pass the flow to the next middleware
  next();
};

// activate the middleware function
app.use(setCurrentUser);

// Define urlDatabase object { shortURL: { LongURL, userID } }
const urlDatabase = {};

const users = {
  'aJ48lW': {
    id: 'aJ48lW',
    email: 'kiwi@gmail.com',
    password: '$2b$10$eBSEkIqKskLoTgYXgA8d5ues/j99mBfNPADcHgfiGC7EoXEoJf/sq'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: '$2b$10$eBSEkIqKskLoTgYXgA8d5ues/j99mBfNPADcHgfiGC7EoXEoJf/sq'
  }
};

// Redirections on / page access
app.get("/", (req, res) => {
  const user = req.currentUser;

  // Redirect to /urls page if user already logged in
  if (user) {
    return res.redirect('/urls');
  }

  // Redirect to /login page if user hasn't logged in
  res.redirect('/login');
});

// Display URLs info
app.get('/urls', (req, res) => {

  const userID = req.session['user_id'];

  // Display an error message if user is not logged in
  if (!userID) {
    return res.send('Please login or register first!');
  }
  // Save urls under the logged in user's id into an array
  const urlArray = urlsForUser(userID, urlDatabase);

  const templateVars = {
    user: users[userID],
    urls: urlArray
  };

  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {

  const userID = req.session['user_id'];

  // If user is not logged in, redirect to login page
  if (!userID) {
    return res.redirect('/login');
  }

  const templateVars = {
    user: users[userID]
  };

  res.render('urls_new', templateVars);
});

// Displays URL info and render it to urls_show ejs file
app.get('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const userObj = req.currentUser;


  // Checking user conditions and display error message
  if (!urlDatabase[shortURL]) {
    return res.send('Short URL does not exist. Please check again.');
  }

  // Display an error message if user is not logged in
  if (!userObj) {
    return res.send('Please login to get access.');
  }

  const userID = userObj.id;
  const urlUserID = urlDatabase[shortURL].userID;

  // Display an error message if user does not own this shortURL
  if (userID !== urlUserID) {
    return res.send('You do not have access to view this page.');
  }

  const templateVars = {
    user: userObj,
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL
  };
  
  res.render('urls_show', templateVars);

});

// Redirect to website using shortURL
app.get('/u/:id', (req, res) => {
  const shortURL = req.params.id;

  // Display an error message if shortURL does not exist
  if (!urlDatabase[shortURL]) {
    return res.send('Short URL does not exist. Please check again.');
  }

  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// Create new shortURL for longURL provided by user, then redirect to the shortURL page
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  const userObj = req.currentUser;

  if (!userObj) {
    return res.send('Please login to get access');
  }

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: userObj.id
  };

  res.redirect(`/urls/${shortURL}`);
});



// Update the longURL and return to /urls page
app.post('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const userObj = req.currentUser;

  // Checking user conditions and display error message
  if (!urlDatabase[shortURL]) {
    return res.send('Short URL does not exist. Please check again.');
  }

  // Display an error message if user is not logged in
  if (!userObj) {
    return res.send('Please login to get access.');
  }

  const userID = userObj.id;
  const urlUserID = urlDatabase[shortURL].userID;

  // Display an error message if user does not own this shortURL
  if (userID !== urlUserID) {
    return res.send('You do not have access to view this page.');
  }

  urlDatabase[shortURL].longURL = req.body.longURL;

  res.redirect('/urls');
});

// Delete the URL record
app.post('/urls/:id/delete', (req, res) => {

  const shortURL = req.params.id;
  const userObj = req.currentUser;

  // Checking user conditions and display error message
  if (!urlDatabase[shortURL]) {
    return res.send('Short URL does not exist. Please check again.');
  }

  // Display an error message if user is not logged in
  if (!userObj) {
    return res.send('Please login to get access.');
  }

  const userID = userObj.id;
  const urlUserID = urlDatabase[shortURL].userID;

  // Display an error message if user does not own this shortURL
  if (userID !== urlUserID) {
    return res.send('You do not have access to view this page.');
  }

  delete urlDatabase[shortURL];


  res.redirect('/urls');
});

// Display login page
app.get('/login', (req, res) => {
  const userObj = req.currentUser;

  if (userObj) {
    return res.redirect('/urls');
  }

  const templateVars = { user: userObj };

  res.render('login', templateVars);
});

// Display the register form
app.get('/register', (req, res) => {
  const userObj = req.currentUser;

  if (userObj) {
    return res.redirect('/urls');
  }

  const templateVars = { user: userObj };

  res.render('register', templateVars);
});

app.post('/login', (req, res) => {

  const email = req.body.email;
  const password = req.body.password;
  const userObj = getUserByEmail(email, users);

  // if email doesn't exist, send 403 error
  if (!userObj) {
    res.status(403);
    return res.send('Incorrect email address provided.');
  }
  
  if (!bcrypt.compareSync(password, userObj.password)) {
    res.status(403);
    return res.send('Incorrect password provided.');
  }

  // create cookie using the userObj.id then redirect to /urls
  req.session['user_id'] = userObj.id;

  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  let password = req.body.password;
  const emailCheck = getUserByEmail(email, users);

  // send 400 error code if email or password field is blank
  if (!email || !password) {

    res.status(400);
    return res.send('Please fill out both email and password fields.');
  }
  // Send error status 400 and indiciate the email address exists
  if (emailCheck) {
    res.status(400);
    return res.send('Email address already exist. Please use a new email.');
  }

  password = bcrypt.hashSync(req.body.password, 10);

  // Add new user info to the users object under the id key
  users[id] = { id, email, password };

  // Create seesion cookie for newly created user
  req.session['user_id'] = users[id].id;

  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  // Clear the cookies
  req.session['user_id'] = null;

  return res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});