<div align="center">
   <div>
        <a href="" target="_blank" rel="noopener">
            <img style="object-fit: cover;" align="center" width="128" height="128" src="img/restclients-icon.png" alt="" />
        </a>
    </div>
</div>

<br />

# Rest Clients

Rest Clients is a simple and secured Rest API Client, pure design and zero dependency, local storage and easy to share. This tool is intended to make HTTP requests sent via command line.


This project is inspired by [REST Client](https://github.com/Huachao/vscode-restclient).

### Features

Rest Clients includes multiple features to make sending request easier.

- Send `HTTP request` in `.rcs`, `.rest` or `.http` file
- Auto show request context like Network in Chrome dev tool
- Compose _MULTIPLE_ requests in a single file (separated by `###` delimiter)
- Show response body raw content
- Authentication support for:
  - Basic Auth
- Environments and static/dynamic variables support
  - Use variables in any place of request(_URL_, _Headers_, _Body_)
  - Support **environment**, **file** static variables
  - Interactively assign file **prompt** variables per request
  - Built-in dynamic variables
    - `{{$guid}}`
    - `{{$randomInt min max}}`
    - `{{$timestamp [offset option]}}`
    - `{{$datetime rfc1123|iso8601 [offset option]}}`
    - `{{$localDatetime rfc1123|iso8601 [offset option]}}`
    - `{{$processEnv [%]envVarName}}`
    - `{{$dotenv [%]variableName}}`
  - Easily create/update/delete environments and environment variables in `setting file`
  - File variables can reference environment, dynamic variables
  - Support for multiple environments and a shared environment to provide variables that available in all environments
- Scripting to extract data from response, set variables and more.
- `HTTP` language support
  - `.rcs`, `.http` and `.rest` file extensions support
  - Comments (line starts with `#` or `//`) support
  - Support `json` and `xml` response body preview

## 🚀 Quick Starts

To quick starts, run the following command:

```bash
git clone https://github.com/restclients/restclients.git
cd ./example
npx restclients -r ./example -n "posts" -s "example.config.js" -d ".env" -e "int" -f example
```

### Installation & Usage

```bash
npm install restclients
```

Define a command in package.json

```js
"scripts": {
    "rcs": "restclients -r rootDir -s rcs.setting.js -d .env"
}
```

Run the following command to send request.

```bash
### send all requests
npm run rcs
### send requests with option
npm run rcs -- -n namePattern -f filePattern
```

**Options**

- --rootDir, -r\
   Specify the root directory to search rest clients file
- --namePattern, -n\
   Specify the rest request name match pattern
- --filePattern, -f\
   Specify the rest clients file name match pattern
- --verbose, -v\
   Show verbose log
- --dotenvFile, -d\
   Specify the dot env file path
- --settingFile, -s\
   Specify the setting file path
- --environment, -e\
   Specify the target environment

## HTTP file

In the `HTTP file`, define the request content

```http
https://test.example.com/users/1
```

The standard [RFC 2616](http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html) that including request method, headers, and body.

```http
POST https://test.example.com/users/1 HTTP/1.1
content-type: application/json

{
    "name": "Jimmy",
    "updatedTime": "2024-12-08T01:49:07.039Z"
}
```

In addtion, save multiple requests in the same `HTTP` file with a new line starting with three or more consecutive `#` symbol as a separator.

```http
GET https://test.example.com/users/1 HTTP/1.1

### Get group profile

GET https://test.example.com/groups/1 HTTP/1.1

### Update user profile

POST https://test.example.com/users/1 HTTP/1.1
content-type: application/json

{
    "name": "Jimmy",
    "updatedTime": "2024-12-08T01:49:07.039Z"
}
```

> The content after the starting `###` is the request name. Use the `-n` option to match the request name of which requests are to be executed.

```bash
## Only send the "Get group profile" API request
restclients -n "Get group profile"
```

> The request in the same `HTTP` file is executed in sequence.

### Request Line

The first non-empty line following the request separator is the _Request Line_.
Below are some examples of _Request Line_:

```http
GET https://test.example.com/users/1 HTTP/1.1
```

```http
GET https://test.example.com/users/1
```

```http
https://test.example.com/users/1
```

If request method is missing, restclients use **GET** method, the above three requests are the same.

### Query String

Generally, the request query string is in the request line as following:

```http
GET https://test.example.com/users?page=2&pageSize=10
```

Sometimes, too many query parameters are in a single request, putting all the query parameters in _Request Line_ is hard to read and modify. So, separate query parameters into multiple lines(one or more query parameters a line), we will parse the lines immediately after the _Request Line_ which starts with `?` and `&`.

```http
GET https://test.example.com/users
    ?page=2
    &pageSize=10
```

```http
GET https://test.example.com/users
    ?page=2&pageSize=10
    &name=Jimmy
```

### Request Headers

The lines which are immediately follow the _Request Line_ and before the first empty line will be parsed as _Request Headers_. These headers should follow the standard `field-name: field-value` format, with each line representing a single header. By default if you don't explicitly specify a `User-Agent` header, `Rest Clients` will automatically add one with the value `restclients`. To change the default value, add `$restclients.userAgent` setting.

Below are examples of _Request Headers_:

```http
https://test.example.com/users/1
User-Agent: my-restclients
Content-Type: application/json
```

### Request Body

A blank line is used to separate the _Request Headers_ and _Request Body_. The request body content is after the blank line and before the request separator line starting with `###` or EOF.

```http
POST https://test.example.com/users/1 HTTP/1.1
Content-Type: application/xml
Authorization: Bearer xxx

<request>
    <name>sample</name>
    <updatedTime>Wed, 21 Oct 2015 18:27:50 GMT</updatedTime>
</request>
```

If the request body start with the letter `< `, the rest should be a file path to read the data from. It can be a absolute or relative (relative to `rootDir` or current `HTTP file`) file path.

```http
POST https://test.example.com/users/1 HTTP/1.1
Content-Type: application/xml
Authorization: Bearer xxx

< /Uses/xxx/example/sample.txt

```

```http
POST https://test.example.com/users/1 HTTP/1.1
Content-Type: application/xml
Authorization: Bearer xxx

< ./sample.txt
```

If there is letter `@` after `<`, the variables in the file will be processed (UTF-8 is assumed as the default encoding). To change the default encoding, append the encoding type following the `@`.

```http
POST https://test.example.com/users/1 HTTP/1.1
Content-Type: application/xml
Authorization: Bearer xxx

<@ ./sample.txt
```

```http
POST https://test.example.com/users/1 HTTP/1.1
Content-Type: application/xml
Authorization: Bearer xxx

<@utf16le ./sample.utf16le.txt
```

If the content type of request body is `application/x-www-form-urlencoded`, the request body can be one line or multiple lines which start with `&`.

```http

POST https://test.example.com/users/login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

name=foo&password=pass&option=id%26email
```

```http
POST https://test.example.com/users/login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

name=foo
&password=pass
&option=id%26email

```

If the content type of request body is `multipart/form-data`, the body part can be a file or plain text.

```http
POST https://test.example.com/users/profile HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryM6cFocZWsx5Brf1A

------WebKitFormBoundaryM6cFocZWsx5Brf1A
Content-Disposition: form-data; name="form"

test data
------WebKitFormBoundaryM6cFocZWsx5Brf1A
Content-Disposition: form-data; name="file"; filename="sample.txt"
Content-Type: application/octet-stream


< ./sample.txt
------WebKitFormBoundaryM6cFocZWsx5Brf1A--
```

## Authentication

Support **Basic Auth**, **Bearer Token**.

### Basic Auth

HTTP Basic Auth is a widely used protocol for simple username/password authentication.

```http
GET https://test.example.com/users/1 HTTP/1.1
Authorization: Basic user:passwd
```

```http
GET https://test.example.com/users/1 HTTP/1.1
Authorization: Basic dXNlcjpwYXNzd2Q=
```

### Bearer Token

Send the request with a **Bearer Token**

```http
GET https://test.example.com/users/1 HTTP/1.1
Authorization: Bearer tokencontent
```

## Use Variables

When define a **HTTP Request**, **variables** can be used to parametrize its elements. A variable can be in the **Requset Line**, **Query String**, **Request Headers** and **Request Body** (including the external file content).

> A **variable** is enclosed in double curly braces as `{{variable}}`.

> If the **variable** can not be resolved, send request with the original content.

```http
### POST https://test.example.com/users/1 with body `{{data}}`

@hostname=test.exmaple.com
POST https://{{hostname}}/users/1 HTTP/1.1
Authorization: Bearer tokencontent

{{data}}
```

Support several types of variables listed below in priority order. If variable names conflict, the value of the one higher on this list will be used.

- Prompt variables defined in `HTTP file`, input value before request sending and available within the same files only.

- Environment variables defined in `Setting File` and available in any `HTTP file`.

- File variables defined in `HTTP file` and available within the same files only.

In additional, Rest Clients provides built-in dynamic variables with dynamically generated values or get values from `process environment` and [`dot env file`](https://github.com/motdotla/dotenv).

### Environment variables

Environment variables help to store a set of environment definitions inside your project. For example, instead of providing a hostname in your request explicitly, you can create the {{hostname}} variable in different environments: a local hostname in the int environment and a public hostname in the stage environment. The special **shared** environment(identified by special environment name _$shared_) to provide a set of variables that are available in all environments.

Then run the restclients command with a option `-e` to select an environment. Only variables defined in selected environment and shared environment are available.

Environment variables are defined in `setting file`, the default file path is `restclients.config.js` and the option `-s` is to change the default file path. In user defined environment, to access **shared** environment, use the `{{$shared variableName}}` syntax.

The following sample `setting file` defines two environments: `int` and `stage`.

```js
module.exports = {
  $restclients: {
    userAgent: "myRestclients",
  },
  $shared: {
    key1: "KEYYYY",
    key2: "KEYYY2",
  },
  int: {
    hostname: "int.example.com",
    token: "INT_TOKEN",
    key: "{{$shared key1}}",
  },
  stage: {
    hostname: "stage.example.com",
    token: "STAGE_TOKEN",
    key: "{{$shared key2}}",
  },
};
```

The example Rest Clients request is as follows:

```http
POST https://{{hostname}}/users/1 HTTP/1.1
Authorization: {{token}}
Content-Type: application/json

{
    "key": "{{key}}"
}
```

### Prompt variables

The scope of a prompt variable is a `HTTP file`, in which it was declared. Input the variable value before sending a request. A `HTTP Request` can have more than one prompt variable.

The prompt variables are defined like a single-line comment **`// @prompt {var1}`** or **`# @prompt {var1}`**.

A variable description can also be defined by **`// @prompt {var1} {description}`** or **`# @prompt {var1} {description}`** which will prompt an input popup with the specified description message.

The reference syntax is the same as others, like **`{{var}}`**. The prompt variable will override the other conflict variable.

```http
@hostname = test.example.com
@port = 8633
@host = {{hostname}}:{{port}}
@contentType = application/json

### basic
# @prompt userId
# @prompt email Your email address display on webpage
# @prompt password Your password
POST https://{{host}}/users/{{userId}} HTTP/1.1
Content-Type: {{contentType}}

{
    "email": "{{email}}",
    "password": "{{password}}"
}
```

### File variables

The scope of a file variable is an `HTTP file`, in which it was declared. Use file variables if you want to refer to the same variable in multiple requests within the same file.

To create file variable, type **`@variableName = variableValue`** above the `Request Line` section. For example:

```http
@hostname = test.example.com
@port = 8633
@host = {{hostname}}:{{port}}
@contentType = application/json
@createdAt = {{$datetime iso8601}}

###

@userId=1

GET https://{{host}}/users/{{userId}} HTTP/1.1

###

@name=Jimmy Choo

POST https://{{host}}/users?name={%name} HTTP/1.1
Content-Type: {{contentType}}

{
    "content": "foo bar",
    "created_at": "{{createdAt}}"
}
```

> Use the _backslash_ `\` to escape special characters in variable value as `\n`.

> Use the _percent_ `%` to url encode (with `encodeURIComponent` function) the variable value as `{{%name}}`.

> Use the _at sign_ `@` to base64 encode the variable value as `{{@name}}`.

### Dynamic variables

Dynamic variables generate a value each time you run the request. Their names start with `$`.

- `{{$guid}}`: generate a v4 UUID
- `{{$processEnv [%]envVarName}}`: access local machine environment variable value. If the sensitive information like secret keys which should not be committed to the code repository, store them in the local environment.

  Export environment values to shell or similar on windows:

  ```bash
  export INT_TOKEN=intintint
  export STAGE_TOKEN=stagestagestage
  export USER_NAME=useruser
  ```

  with environment variables:

  ```js
  module.exports = {
    $restclients: {
      userAgent: "myRestclients",
    },
    $shared: {
      key1: "KEYYYY",
      key2: "KEYYY2",
    },
    int: {
      hostname: "int.example.com",
      token: "INT_TOKEN",
      key: "{{$shared key1}}",
    },
    stage: {
      hostname: "stage.example.com",
      token: "STAGE_TOKEN",
      key: "{{$shared key2}}",
    },
  };
  ```

  Access local environment variable by name (e.g. `INT_TOKEN`) in the `HTTP file`. The example for `int` environment is as follows:

  ```http
  # Access INT_TOKEN from local machine environment
  GET https://test.example.com/users?user={{$processEnv USER_NAME}}
  Authorization: {{$processEnv INT_TOKEN}}
  ```

  > `%`: optional, use the value of `envVarName` in environment variable to access local environment variables.

  ```http
  # Access local machine environment variable by the value of token in environment variable
  # Access INT_TOKEN for `int` environment, and STAGE_TOKEN for `stage` environment
  GET https://test.example.com/users?user={{$processEnv USER_NAME}}
  Authorization: {{$processEnv %token}}
  ```

- `{{$dotenv [%]envVarName}}`: access the environment value stored in the [`.env`](https://github.com/motdotla/dotenv) file. Default file path is `.restclients.env`, use the option `-d` to change the defalut file path.

- `{{$randomInt min max}}`: generate a random integer between min (inclusive) and max (exclusive).

- `{{$timestamp [offset option]}}`: generate current Unix timestamp with datetime offset from now.

  - 3 hours ago, for example `{{$timestamp -3 h}}`
  - the day after tomorrow, for example `{{$timestamp 2 d}}`

- `{{$datetime rfc1123|iso8601|"custom format"|'custom format' [offset option]}}`: generate current UTC datetime string with datetime offset in _ISO8601_, _RFC1123_ or a custom format. custom format should be wrapped it in single or double quotes.

  - one year later in _ISO8601_ format, for example: `{{$datetime iso8601 1 y}}`
  - with custom datetime format, for example: `{{$datetime "DD-MM-YYYY" 1 y}}`

- `{{$localDatetime rfc1123|iso8601|"custom format"|'custom format' [offset option]}}`:
  generate current local timezone datatime string with datetime offset in _ISO8601_, _RFC1123_ or a custom format. custom format should be wrapped it in single or double quotes. \* one year later in _ISO8601_ format, for example: `{{$localDatetime iso8601 1 y}}`

      The offset options you can specify in `$timestamp`, `$datetime` and `$localDatetime` are:

      Option | Description
      -------|------------
      y      | Year
      M      | Month
      w      | Week
      d      | Day
      h      | Hour
      m      | Minute
      s      | Second
      ms     | Millisecond
- Support register `customized dynamic variables` will come soon.

The example using dynamic variables is as follow:

```http

POST https://test.example.com/users/1 HTTP/1.1
Content-Type: application/json
Authorization: {{$processEnv %token}}
Date: {{$datetime rfc1123}}

{
    "userName": "{{$dotenv USERNAME}}",
    "requestId": "{{$guid}}",
    "updatedAt": "{{$timestamp}}",
    "createdAt": "{{$timestamp -1 d}}",
    "randomInt": "{{$randomInt 5 200}}",
    "customDate": "{{$datetime 'YYYY-MM-DD'}}",
    "localDate": "{{$localDatetime 'YYYY-MM-DD'}}"
}
```

## Scripting

Support to handle the response with Javascirpt. Use __// @script file.js__ or __# @script file.js__ to specify the path and name of the Javascript file.

The example using Javascript to save oauth token from response to dotenv file.

```http
#### Get OAuth Token

# @script ./setOAuthToken.rcs.js
POST https://test.example.com/oauth/token
requestId: {{$guid}}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={{$dotenv CLIENT_ID}}
&client_secret={{$dotenv CLIENT_SECRET}}

```

`setOAuthToken.rcs.js` content is as follows:

```js
function setEnvValue(key, value) {
  const { readFileSync, writeFileSync } = require("fs");
  const { EOL } = require("os");
  const ENV_VARS = readFileSync(option.dotenvFile, "utf8").split(EOL);

  const target = ENV_VARS.indexOf(
    ENV_VARS.find((line) => {
      const keyValRegex = new RegExp(`(?<!#\\s*)${key}(?==)`);

      return line.match(keyValRegex);
    })
  );

  if (target !== -1) {
    ENV_VARS.splice(target, 1, `${key}=${value}`);
  } else {
    ENV_VARS.push(`${key}=${value}`);
  }

  writeFileSync(option.dotenvFile, ENV_VARS.join(EOL));
}

(() => {
  logging.info("set OAuth2 token start");
  logging.info("request: %j", request);
  setEnvValue(
    "OAUTH2_TOKEN",
    JSON.parse(request.res.body)?.access_token
  );
})();
```

Run the script using `Script.runInContext` function. The context passed to function is as follows:

* Context:
    * vars:
        * addEnvironmentVariable(key, value), add key/value to current environment variables
        * addFileVariable(key, value), add key/value to file variables
        * resolveVariables(...keys), resolve the value of the key in environment variables, prompt variables, file variables and dynamic variables.
            > Use syntax `resolveVariables([key1,key2,key3...])` and `resolveVariables(key1,key2,key3,...)`
    * request:
        * filename: current `HTTP file` absolute file path and file name
        * name: request name, the content after the starting `###`
        * range: request line range, for example: [50,54]
        * uri: the uri of the request, for example: file:///restclients/example/basic.rcs#L50-L54
        * header: request header defined in `HTTP file`
        * url: request url
        * method: request method
        * resolvedPromptVariable: the value of prompt variables
        * body: request body
        * scriptContent: content of the script to be executed, `Buffer` type
        * time: request cost time, for example: 932 ms
        * res:
            * statusCode: request response status code, for example 200
            * headers: response headers
            * body: response body, `Buffer` type
    * require(module): nodejs built-in require function
    * logging:
        * debug(firstArg, ...rest): debug levle logging
        * info(firstArg, ...rest): info levle logging
        * warn(firstArg, ...rest): warn levle logging
        * error(firstArg, ...rest): error levle logging
        > Using [util.format(format[, ...args])](https://nodejs.org/api/util.html#utilformatformat-args) to format message
    * option: running configuration, a frozen object and cannot be changed
        * rootDir: current root directory absolute file path, for example: /Workspace/restclients/example
        * httpClient: nodejs fetch client
        * dotenvFile: dotenv file path, for example: /Workspace/restclients/example/.env
        * settingFile: setting file path, for exmaple: /Workspace/restclients/example/example.config.js
        * environment: current selected environment, for example: `int`
        * filePattern: pattern to match the file path to be executed
        * namePattern: pattern to match the request name to be executed

## Settings

Settings is also defined in `setting file` under the reserved key `$restclients`.

```js
 module.exports = {
    $restclients: {
      userAgent: "myRestclients",
    }
    ....
 }
```

* `$restclients.userAgent`: set the default user agent value in request header

## ToDo
