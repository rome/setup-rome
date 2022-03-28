# setup-rome
This action sets up Rome for use in actions by downloading the latest version and caching it. 


## Usage 

See [action.yml](./action.yml)

### Basic

```yml
steps:
    - uses: rome/setup-rome@v0.0.1
    - run: rome --help
```

Installs the latest *stable* version of Rome and adds it to the path.

### Preview version

Installs the latest *preview* version of Rome and adds it to the path.

```yml
steps:
    - uses: rome/setup-rome@v0.0.1
      with: 
        preview: true
    - run: rome --help
```


## Supported Runners

* OS: Windows, Linux, MacOS,
* Architecture: x64, ARM64
