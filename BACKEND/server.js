const http = require("http");
const app = require("./app");
const { initiateSocket } = require("./socket");
const cors = require("cors");


app.use(cors({
  origin: "https://maarg-pa2r.onrender.com",
  credentials: true
}));

const port = process.env.PORT || 3000;

const server = http.createServer(app);

initiateSocket(server);


server.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
});
