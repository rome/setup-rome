const fs = require("fs");
const path = require("path");
const process = require("process");

const core = require("@actions/core");
const io = require("@actions/io");
const github = require("@actions/github");
const toolCache = require("@actions/tool-cache");

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
	const binaryName = `${getDownloadBinaryBaseName()}${getBinaryExtension()}`;
	const tagName = await resolveReleaseTagName();

	return `https://github.com/rome/tools/releases/download/${encodeURIComponent(
		tagName,
	)}/${encodeURIComponent(binaryName)}`;
}

async function resolveReleaseTagName() {
	if (!core.getBooleanInput("preview")) {
		return "latest";
	}

	const token = core.getInput("github-token", { required: true });
	const octokit = github.getOctokit(token);

	const { repository } = await octokit.graphql(
		`
    { 
        repository(owner: "rome", name: "tools") {
            releases(orderBy: { field:CREATED_AT, direction:DESC }, first: 100) {
                nodes {
                    isPrerelease
                    tagName
                }
            }
        }
    }`,
		{},
	);

	const releases = repository?.releases?.nodes;

	if (releases == null) {
		throw new Error("Failed to retrieve the list of releases");
	}

	const firstPreRelease = releases.find((release) => release.isPrerelease);

	if (firstPreRelease == null) {
		core.error("Failed to retrieve pre-release, falling back to latest.");
		return "latest";
	}

	return firstPreRelease.tagName;
}

function getDownloadBinaryBaseName() {
	switch (process.platform) {
		case "win32":
		case "linux":
		case "darwin":
			return `rome-${process.platform}-${ARCH}`;

		default:
			core.error(`Unsupported platform ${process.platform}`);
			throw new Error("Unsupported platform");
	}
}

function getBinaryExtension() {
	if (process.platform == "win32") {
		return ".exe";
	}
	return "";
}

// Retrieves the temp directory. Copied from @actions/tool-cache
function _getTempDirectory() {
	const tempDirectory = process.env["RUNNER_TEMP"];

	if (tempDirectory == null) {
		core.warning(
			"Temp directory not exposed via 'RUNNER_TEMP' environment variable. Uses current directory instead.",
		);
		return "";
	}
	return tempDirectory;
}

module.exports = main;

if (require.main === module) {
	main();
}
