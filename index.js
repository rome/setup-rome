const core = require('@actions/core');
const github = require('@actions/github');
const process = require('process');
const toolCache = require('@actions/tool-cache');
const io = require('@actions/io');

const OS = process.env['RUNNER_OS'];
const ARCH = process.env['RUNNER_ARCH'];

async function main() {
    try {
        await io.which("rome", true);
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

    core.debug("Download tool from '${url}'");
    // Download the specific version of the tool, e.g. as a tarball
    const pathToBinary = await toolCache.downloadTool(url, getBinaryName());

    // Expose the tool by adding it to the PATH
    core.addPath(pathToBinary)
}

function getBinaryName() {
    if (isWindows()) {
        return "rome.exe"
    }

    return "rome";
}

function isWindows() {
    return ARCH === "windows";
}

async function getDownloadUrl() {
    const preview = core.getInput('preview');

    core.debug(OS);
    core.debug(ARCH);

    let extension = "";

    if (isWindows()) {
        extension = ".exe"
    }

    let url = `https://github.com/rome/tools/releases/download/v0.1.20220324/rome-linux/${encodeURIComponent(OS)}-${encodeURIComponent(ARCH)}${extension}`;



    return url;
}

module.exports = main