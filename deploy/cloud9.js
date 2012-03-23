require("coffee-script");

var app = require("./cloud9c");
app.listen(process.env.C9_PORT);