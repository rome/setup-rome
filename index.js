const core = require('@actions/core');
const github = require('@actions/github');
const process = require('process');
const toolCache = require('@actions/tool-cache');
const io = require('@actions/io');
const path = require('path');
const fs = require('fs');

const ARCH = process.env['RUNNER_ARCH'].toLowerCase();

console.log("Hello");

async function main() {
    console.log("main");
    try {
        let path = await io.which("rome", true);
        core.info(`Use pre-installed Rome ${path}`);
    } catch {
        core.info("Rome is not installed, installing it now...");
        try {
            core.startGroup("Installing Rome");
            await install();
        } finally {
            core.endGroup();
        }
    }
}

async function install() {
    // Get version of tool to be installed
    const url = await getDownloadUrl();

    const binaryDirectory = path.join(_getTempDirectory(), ".rome_bin");
    const binaryPath = path.join(binaryDirectory, getBinaryName());

    core.debug("Download tool from '${url}'");
    // Download the specific version of the tool, e.g. as a tarball
    await toolCache.downloadTool(url, binaryPath);

    if (process.platform == "linux" || process.platform == "darwin") {
        fs.chmod(binaryPath, 0o755);
    }

    // Expose the tool by adding it to the PATH
    core.addPath(binaryPath)
}

function getBinaryName() {
    if (isWindows()) {
        return "rome.exe"
    }

    return "rome";
}

function _getTempDirectory() {
    const tempDirectory = process.env['RUNNER_TEMP'] || '';
    return tempDirectory
}

function isWindows() {
    return process.platform === "windows";
}

async function getDownloadUrl() {
    const preview = core.getInput('preview');

    core.debug(`OS: ${process.platform}`);
    core.debug(`Architecture: ${ARCH}`);

    let url = `https://github.com/rome/tools/releases/download/v0.1.20220324/${encodeURIComponent(getDownloadBinaryName())}`;

    return url;
}

function getDownloadBinaryName() {
    switch (process.platform) {
        case "windows":
        case "linux":
        case "darwin":
            return `rome-${process.platform}-${ARCH}`;
        case "windows":
            return `rome-windows-${ARCH}.exe`;

        default:
            core.error(`Unsupported platform ${process.platform}`);
            throw new Error("Unsupported platform");
    }
}

module.exports = main

if (require.main === module) {
    main();
}