// helper function to look up if email address exsits in the object database
const getUserByEmail = (email, database) => {

  for (user in database) {
    const userObj = database[user];
    if (userObj.email === email) {
      return userObj;
    }
  }
};

module.exports = { getUserByEmail };