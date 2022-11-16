const {
	getAllLaunches,
	scheduleNewLaunch,
	existsLaunchWithId,
	abortLaunchById,
} = require("../../models/launches.model");

const { getPagination } = require("../../services/query");

async function httpGetAllLaunches(req, res) {
	const { skip, limit } = getPagination(req.query);
	const launches = await getAllLaunches(skip, limit);
	// console.log(launches);
	return res.status(200).json(launches);
}

async function httpAddNewLaunch(req, res) {
	const launch = req.body;
	//validation
	if (
		!launch.mission ||
		!launch.rocket ||
		!launch.launchDate ||
		!launch.target
	) {
		return res.status(400).json({
			error: "Missing required launch property",
		});
	}
	launch.launchDate = new Date(launch.launchDate);
	//we can also use isNan function to validate the date
	if (launch.launchDate.toString() === "Invalid Date") {
		return res.status(400).json({
			error: "Invalid launch date",
		});
	}
	//this mutates the original launch object too
	await scheduleNewLaunch(launch);

	return res.status(201).json(launch);
}

async function httpAbortLaunch(req, res) {
	const launchId = Number(req.params.id);
	//if launch doesn't exist
	const exists = await existsLaunchWithId(launchId);
	if (!exists) {
		return res.status(404).json({
			error: "Launch not found",
		});
	}

	//if launch exists, abort
	const aborted = await abortLaunchById(launchId);
	if (!aborted) {
		return res.status(400).json({
			error: "Launch not aborted",
		});
	}
	// ok: true,
	console.log(aborted);
	return res.status(200).json({
		ok: true,
	});
}

module.exports = {
	httpGetAllLaunches,
	httpAddNewLaunch,
	httpAbortLaunch,
};
