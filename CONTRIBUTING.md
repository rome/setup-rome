# Contributing

We can use help in a bunch of areas and any help is appreciated. Our [GitHub issues](https://github.com/rome/tools/issues) serve as a place for any discussion, whether it's bug reports, questions, project direction etc. As the project grows this policy may change.

Our [Discord server](https://discord.gg/rome) is open for help and more adhoc discussion. All activity on the Discord is still moderated and will be strictly enforced under the project's [Code of Conduct](https://github.com/rome/tools/blob/main/CODE_OF_CONDUCT.md).

## Getting Started

Building this project requires Node 16 or above.

```bash
git clone https://github.com/rome/setup-rome.git
cd setup-rome
npm install
```

Then run `npm start` to automatically rebuild the `dist/index.js`. Make sure, to commit any changes to the generated file. 

```bash
npm start
```

## Teseting

Create a draft PR for your changes. The PR CI job verifies that all generated files are up to date and Rome's set up correctly after running the action.