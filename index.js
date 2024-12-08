let express = require("express");
let app = express();
const PORT = 3000;
app.set("view engine", "ejs");

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`)
    console.log(`Press Ctrl+C to exit...`)
});