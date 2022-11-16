const { parse } = require("csv-parse");
const path = require("path");
const fs = require("fs");

const planets = require("./planets.mongo");

function isHabitablePlanet(planet) {
	return (
		planet["koi_disposition"] === "CONFIRMED" &&
		planet["koi_insol"] > 0.36 &&
		planet["koi_insol"] < 1.11 &&
		planet["koi_prad"] < 1.6
	);
}

// now what is happening is that while the data is being loaded and calculated module.exports is exporting as soon as planets model is required
// therefore we will use js promise to resolve this data first and then export
function loadPlanetsData() {
	return new Promise((resolve, reject) => {
		fs.createReadStream(
			path.join(__dirname, "..", "..", "data", "kepler-data.csv")
		)
			.pipe(
				parse({
					comment: "#",
					columns: true,
				})
			)
			.on("data", async (data) => {
				if (isHabitablePlanet(data)) {
					savePlanet(data);
				}
			})
			.on("error", (err) => {
				console.log(err);
				reject(err);
			})
			.on("end", async () => {
				const countPlanets = (await getAllPlanets()).length;
				console.log(countPlanets);
				// console.log(`${habitablePlanets.length} habitable planets found!`);
				resolve();
			});
	});
}

async function getAllPlanets() {
	//if we do planet.find({}) only then all the documents inside that collection will be returned
	//otherwise we can pass an argument as a filter planets.find({keplerName:'kepler-62 f'},{ })
	// since mongoose functions are asynchronous therefore we need to await
	return await planets.find({});
}

async function savePlanet(planet) {
	//now this function loadPlanetsData will be called by server.js many times and every instance will run it
	//creating many copies of planets which we dont want
	//to solve this provlem mongoose solves this problem by upsert - update + insert
	//first argument is the filter and second argument is the data to be updated or inserted
	try {
		await planets.updateOne(
			{
				keplerName: planet.kepler_name,
			},
			{
				keplerName: planet.kepler_name,
			},
			{
				upsert: true,
			}
		);
	} catch (err) {
		console.error(`Could not save planet ${err}`);
	}
}

module.exports = {
	loadPlanetsData,
	getAllPlanets,
};
