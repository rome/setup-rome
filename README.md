# setup-rome
This action sets up Rome for use in actions by downloading it and adding it to the path.


## Usage 

See [action.yml](./action.yml)

```yml
steps:
    - uses: rome/setup-rome@v0.1
      with:
        version: latest 
    - run: rome --help
```

Installs the specified version of Rome and adds it to the path. The version can be one of:

* `latest`: Installs the latest stable version of Rome. Be mindful that Rome hasn't reached the `1.0.0` version yet, and thus, even minor or patch releases can contain breaking changes. 
* `preview`: Installs the latest preview version of Rome.
* `0.4.0`: Installs the version 0.4.0. Semver ranges aren't supported at the time being.


## Scenarios

### Check the formatting

```yml
steps:
    - uses: rome/setup-rome@v0.1
      with:
        version: 0.4.0
    - uses: actions/checkout@v2
    - run: rome format --ci .
```

Checks the formatting of all supported files in your repository. Fails the build if a file doesn't match the expected formatting. 

## Supported Runners

* OS: Windows, Linux, MacOS,
* Architecture: x64, ARM64
