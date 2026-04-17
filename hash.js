const bcrypt = require("bcrypt");

const password = "skyline1711"; // password you want to give client

bcrypt.hash(password, 10).then(hash => {
    console.log(hash);
});