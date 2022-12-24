# setup-rome
This action sets up Rome for use in actions by downloading it and adding it to the path.


## Usage 

See [action.yml](./action.yml)

With latest version:

```yml
steps:
    - uses: rome/setup-rome@v0.4
      with:
        version: latest 
    - run: rome --help
```

With a specific version:

```yml
steps:
    - uses: rome/setup-rome@v0.4
      with:
        version: 0.10.0 
    - run: rome --help
```

Installs the specified version of Rome and adds it to the path. The version can be one of:

* `latest`: Installs the latest stable version of Rome.
* `preview`: Installs the latest preview version of Rome.
* `0.10.0`: Installs the version 0.10.0. Semver ranges aren't supported at the time being.


## Scenarios

### Check the formatting

```yml
steps:
    - uses: rome/setup-rome@v0.4
      with:
        version: 11.0.0
    - uses: actions/checkout@v2
    - run: rome ci .
```

Checks the formatting of all supported files in your repository. Fails the build if a file doesn't match the expected formatting. 

## Supported Runners

* OS: Windows, Linux, MacOS,
* Architecture: x64, ARM64
