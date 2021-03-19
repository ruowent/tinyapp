// helper function to look up if email address exsits in the object database
const getUserByEmail = (email, database) => {

  for (let user in database) {
    const userObj = database[user];
    if (userObj.email === email) {
      return userObj;
    }
  }
};

// function that returns a string of 6 random alphanumeric characters
const generateRandomString = () => {
  const arr = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 6; i > 0; i--) {
    result += arr[Math.floor(Math.random() * arr.length)];
  }
  return result;
};


// Function which returns the URLs where the userID is equal to the id of the currently logged-in user
const urlsForUser = (id, database) => {

  const urlArr = [];
  // Display only URLs shortened by logged in user
  for (let shortURL in database) {
    if (database[shortURL].userID === id) {
      const urlObj = {
        shortURL: shortURL,
        longURL: database[shortURL].longURL
      };
      urlArr.push(urlObj);
    }
  }
  return urlArr;
};


module.exports = { getUserByEmail, generateRandomString, urlsForUser };