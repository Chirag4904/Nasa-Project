// const launches = new Map();

const axios = require("axios");
const launchesDatabase = require("./launches.mongo");
const planets = require("./planets.mongo");
// let latestFlightNumber = 100;
// const launch = {
// 	flightNumber: 100,
// 	mission: "Kepler exploration X",
// 	rocket: "Explorer IS1",
// 	launchDate: new Date("December 27, 2030"),
// 	target: "Kepler-442 b",
// 	customer: ["NASA", "NOAA"],
// 	upcoming: true,
// 	success: true,
// };

// launches.set(launch.flightNumber, launch);
// saveLaunch(launch);
const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";

async function populateLaunches() {
	console.log("Downloading launch data...");
	const response = await axios.post(SPACEX_API_URL, {
		query: {},
		options: {
			pagination: false,
			populate: [
				{
					path: "rocket",
					select: {
						name: 1,
					},
				},
				{
					path: "payloads",
					select: {
						customers: 1,
					},
				},
			],
		},
	});

	if (response.status !== 200) {
		console.log("Problem downloading launch data");
		throw new Error("Launch data download failed");
	}

	const launchDocs = response.data.docs;
	for (const launchDoc of launchDocs) {
		const payloads = launchDoc["payloads"];
		const customers = payloads.flatMap((payload) => {
			return payload["customers"];
		});
		const launch = {
			flightNumber: launchDoc["flight_number"],
			mission: launchDoc["name"],
			rocket: launchDoc["rocket"]["name"],
			launchDate: launchDoc["date_local"],
			upcoming: launchDoc["upcoming"],
			success: launchDoc["success"],
			customers: customers,
		};

		console.log(launch.flightNumber, launch.customers);

		await saveLaunch(launch);
	}
}

async function loadLaunchData() {
	const firstLaunch = await findLaunch({
		flightNumber: 1,
		rocket: "Falcon 1",
		mission: "FalconSat",
	});
	if (firstLaunch) {
		console.log("Launch data already loAded");
	} else {
		await populateLaunches();
	}

	// console.log("Downloaded launch data");
	// console.log(response.data.docs[1]["payloads"]);
	// console.log("first");
}

async function getAllLaunches(skip, limit) {
	// return Array.from(launches.values());
	//setting id and v as 0 to exlude them in response
	return await launchesDatabase
		.find({}, { __id: 0, __v: 0 })
		.sort({ flightNumber: 1 })
		.skip(skip)
		.limit(limit);
}

async function saveLaunch(launch) {
	//upsert
	try {
		//we can use findOneAndUpdate instead of updateOne which is similar but it will return only those properties
		//which we set in our update i.e second argument
		await launchesDatabase.findOneAndUpdate(
			{
				flightNumber: launch.flightNumber,
			},
			launch,
			{ upsert: true }
		);
	} catch (err) {
		console.error(`Could not save launch ${err}`);
	}
}

async function getLatestFlightNumber() {
	const latestLaunch = await launchesDatabase.findOne().sort("-flightNumber");
	if (!latestLaunch) {
		//default flightNumber
		return 100;
	}
	return latestLaunch.flightNumber;
}

async function scheduleNewLaunch(launch) {
	const planet = await planets.findOne({ keplerName: launch.target });

	//if planet wes not found in planet database
	if (!planet) {
		throw new Error("No matching planet found");
	}
	const newFlightNumber = (await getLatestFlightNumber()) + 1;
	const newLaunch = Object.assign(launch, {
		success: true,
		upcoming: true,
		customers: ["CAP", "NASA"],
		flightNumber: newFlightNumber,
	});

	await saveLaunch(newLaunch);
}

// function addNewLaunch(launch) {
// 	latestFlightNumber++;
// 	launches.set(
// 		latestFlightNumber,
// 		Object.assign(launch, {
// 			customer: ["NOAA", "NASA"],
// 			upcoming: true,
// 			success: true,
// 			flightNumber: latestFlightNumber,
// 		})
// 	);
// }

async function findLaunch(filter) {
	return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId) {
	return await findLaunch({ flightNumber: launchId });
}

async function abortLaunchById(launchId) {
	// const aborted = launches.get(launchId);
	// aborted.upcoming = false;
	// aborted.success = false;
	// return aborted;
	const aborted = await launchesDatabase.updateOne(
		{ flightNumber: launchId },
		{
			upcoming: false,
			success: false,
		}
	);
	return aborted.acknowledged && aborted.modifiedCount === 1;
}

module.exports = {
	loadLaunchData,
	getAllLaunches,
	scheduleNewLaunch,
	existsLaunchWithId,
	abortLaunchById,
};
