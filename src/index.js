const assert = require("assert");
const fs = require("fs");
const path = require("path");
const process = require("process");

const core = require("@actions/core");
const io = require("@actions/io");
const github = require("@actions/github");
const toolCache = require("@actions/tool-cache");

async function main() {
	try {
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
	} catch (error) {
		core.setFailed(error);
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
	// Create a temp directory because `addPath` adds the directory and not the binary to the path.
	const romeDirectory = path.join(_getTempDirectory(), ".rome_bin");
	const romeBinary = path.join(romeDirectory, `rome${getBinaryExtension()}`);

	const tagName = await resolveReleaseTagName();
	const url = await getDownloadUrl(tagName);

	try {
		core.debug(`Download tool from '${url}' to ${romeBinary}.`);
		await toolCache.downloadTool(url, romeBinary);
	} catch (error) {
		const statusCode = error.httpStatusCode;
		if (
			typeof (statusCode) === "number" &&
			statusCode >= 400 &&
			statusCode < 500
		) {
			core.error(error);
			const version = core.getInput("version");
			const releaseUrl = `https://github.com/rome/tools/releases/${encodeURIComponent(
				tagName,
			)}`;

			throw new Error(
				`Failed to retrieve the binary for Rome version '${version}'. Is ${version} (${releaseUrl}) a valid (rusty-) Rome version?`,
			);
		}

		core.error("Failed to retrieve the Rome binary from '${url}'.");

		throw error;
	}

	if (process.platform === "linux" || process.platform === "darwin") {
		fs.chmodSync(romeBinary, 0o755);
	}

	core.addPath(romeDirectory);
}

async function getDownloadUrl(tagName) {
	const binaryName = `${getDownloadBinaryBaseName()}${getBinaryExtension()}`;

	return `https://github.com/rome/tools/releases/download/${encodeURIComponent(
		tagName,
	)}/${encodeURIComponent(binaryName)}`;
}

async function resolveReleaseTagName() {
	const version = core.getInput("version");
	return resolveVersion(version);
}

/**
 *
 * @param {string} version
 * @returns {Promise<String>}
 */
async function resolveVersion(version) {
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

	// we filter releases that have "cli" in their tag name
	const releases = repository?.releases?.nodes.filter(
		(release) => release.tagName.toLowerCase().includes("cli"),
	);

	if (releases == null) {
		throw new Error("Failed to retrieve the list of releases");
	}

	// fetch latest version
	if (version === "latest") {
		let first_prod_release = releases.find((release) => !release.isPrerelease);
		core.info(
			`Chosen first production release with version ${first_prod_release.tagName}`,
		);
		return first_prod_release.tagName;
	}

	// fetch latest preview version
	if (version === "preview") {
		const firstPreRelease = releases.find((release) => release.isPrerelease);

		if (firstPreRelease == null) {
			core.error("Failed to retrieve pre-release, falling back to latest.");
			core.info(`Choosing latest release with version ${releases[0].tagName}`);
			return releases[0].tagName;
		}

		core.info(`Resolved latest preview version to ${firstPreRelease.tagName}`);

		return firstPreRelease.tagName;
	}

	// fetch specific version (x.y.z)
	const release = releases.find((release) => release.tagName.includes(version));
	if (release == null) {
		throw new Error(`Unable to find a release for the version ${version}`);
	}

	core.info(`Resolved version ${version} to ${release.tagName}`);
	return release.tagName;
}

function getDownloadBinaryBaseName() {
	switch (process.platform) {
		case "win32":
		case "linux":
		case "darwin":
			const arch = getRunnerArchitecture();
			return `rome-${process.platform}-${arch}`;

		default:
			throw new Error(`Unsupported platform ${process.platform}`);
	}
}

function getRunnerArchitecture() {
	const arch = process.env["RUNNER_ARCH"];
	assert(
		arch,
		"Expected the arch to be exposed in the RUNNER_ARCH environment variable.",
	);

	switch (arch) {
		case "X64":
		case "ARM64":
			return arch.toLocaleLowerCase();

		default:
			throw new Error(`Unsupported architecture ${arch}.`);
	}
}

function getBinaryExtension() {
	if (process.platform === "win32") {
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
	main().catch((err) => {
		console.log(error);
		process.exit(1);
	});
}
