const core = require("@actions/core");
const github = require("@actions/github");
const process = require("process");
const toolCache = require("@actions/tool-cache");
const io = require("@actions/io");
const path = require("path");
const fs = require("fs");

const ARCH = process.env["RUNNER_ARCH"].toLowerCase();

async function main() {
	const romePath = await resolveRome();

	if (romePath == null) {
		core.info("Rome is not installed, installing it now...");
		try {
			core.startGroup("Installing Rome");
			await install();
		} finally {
			core.endGroup();
		}
	} else {
		core.info(`Use pre-installed Rome ${romePath}`);
	}
}

/**
 * Resolves the path to the rome binary.
 * @returns {PromiseLike<string | null>} the path to the Rome binary or `null` if Rome isn't installed
 */
async function resolveRome() {
	try {
		return await io.which("rome", true);
	} catch {
		return null;
	}
}

/**
 * Installs rome and adds it to the path.
 */
async function install() {
	// Get version of tool to be installed
	const url = await getDownloadUrl();

	// Create a temp directory because `addPath` adds the directory and not the binary to the path.
	const romeDirectory = path.join(_getTempDirectory(), ".rome_bin");
	const romeBinary = path.join(romeDirectory, `rome${getBinaryExtension()}`);

	core.debug(`Download tool from '${url}' to ${romeBinary}.`);
	await toolCache.downloadTool(url, romeBinary);

	if (process.platform == "linux" || process.platform == "darwin") {
		fs.chmodSync(romeBinary, 0o755);
	}

	// Expose the tool by adding it to the PATH
	core.addPath(romeDirectory);
}

async function getDownloadUrl() {
	const preview = core.getInput("preview");

	core.debug(`OS: ${process.platform}`);
	core.debug(`Architecture: ${ARCH}`);

	const binaryName = `${getDownloadBinaryBaseName()}${getBinaryExtension()}`;

	return `https://github.com/rome/tools/releases/download/v0.1.20220324/${encodeURIComponent(
		binaryName,
	)}`;
}

function getDownloadBinaryBaseName() {
	switch (process.platform) {
		case "windows":
		case "linux":
		case "darwin":
			return `rome-${process.platform}-${ARCH}`;

		default:
			core.error(`Unsupported platform ${process.platform}`);
			throw new Error("Unsupported platform");
	}
}

function getBinaryExtension() {
	if (process.platform == "windows") {
		return ".exe";
	}
	return "";
}

// Retrieves the temp directory. Copied from @actions/tool-cache
function _getTempDirectory() {
	io.mkdirP();
	return process.env["RUNNER_TEMP"] || "";
}

module.exports = main;

if (require.main === module) {
	main();
}
