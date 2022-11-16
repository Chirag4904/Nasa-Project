const express = require("express");
const cors = require("cors");
const path = require("path");
// const planetsRouter = require("./routes/planets/planets.router");
// const launchesRouter = require("./routes/launches/launches.router");

const api = require("./routes/api");

const app = express();

app.use(
	cors({
		origin: "http://localhost:3000",
	})
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "..", "client", "build")));

// app.use("/planets", planetsRouter);
// app.use("/launches", launchesRouter);

app.use("/v1", api);
//using * after / will match all the urls after / with the react frontend so all the req will go to react which will be handeled by react router
//eg /history /upcoming /fewfwef and eveything else except /launches and /planets as they are being handled above by nodejs and express
app.get("/*", (req, res) => {
	res.sendFile(
		path.join(__dirname, "..", "..", "client", "build", "index.html")
	);
});

module.exports = app;
