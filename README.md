# IoT Flow JavaScript driver developer guide

This project describes how to build a javascript driver for the ThingPark X IoT Flow framework.

A driver allows to easily integrate new devices in ThingPark X IoT Flow. With it you define
how to decode uplinks/downlinks, how to encode downlinks and how to extract points.

-   [IoT Flow JavaScript driver developer guide](#IoT-Flow-JavaScript-driver-developer-guide)
    -   [Concepts](#concepts)
        -   [Driver](#driver)
        -   [Thing](#thing)
        -   [Point](#point)
        -   [Application](#application)
        -   [Uplink](#uplink)
        -   [Downlink](#downlink)
    -   [API](#API)
        -   [Driver definition](#driver-definition)
        -   [Driver functions](#driver-functions)
            -   [Uplink decode](#uplink-decode)
            -   [Downlink encode](#downlink-encode)
            -   [Downlink decode](#downlink-decode)
            -   [Points extraction](#points-extraction)
    -   [Quickstart](#quickstart)
        -   [Minimal driver](#minimal-driver)
        -   [Encoding and decoding downlinks](#encoding-and-decoding-downlinks)
        -   [Extracting points](#extracting-points)
        -   [Returning errors](#returning-errors)
        -   [Testing](#testing)

## Concepts

### Driver

The `driver` is the piece of code responsible to decode uplinks/downlinks and to encode downlinks for a device
applicative stack. It is the core part of the IoT Flow framework to interact with new devices.

### Thing

The `thing` is the cloud representation of a device that can interact with the IoT Flow framework. It can be of two
kinds:

* A device: a physical device that uses a communication protocol (for example LoRaWAN)
* A "virtual" device: some application running on an appliance that acts like a physical device or which represents an
  aggregated view of several devices (for example an aggregated temperature)

### Point

The `point` represents a value that could be extracted from a `thing`. It maps directly with a sensor, an
actuator or a configuration variable. It is defined by an `id`, a `unitId` and a `type`.
The `point` extracted by the driver is composed of a list of point in time values (although most of the time there is only one of them).
It has a mandatory `eventTime` and a `value` and/or `coordinates`.
The `value` represents the actual value of the point at the given `eventTime` while the `coordinates` represents the
GPS position of the `thing` at the given `eventTime`. It is possible to provide only the `coordinates` in which case it
represents the position of the device at the provided `eventTime`

### Application

The `application` identifies an applicative stack implemented by a device. It is composed of 3 information:
* who specifies this applicative stack, could be either a manufacturer or an entity defining a public standard (`producerId`)
* the applicative stack name (`moduleId`)
* the applicative stack version (`version`)

### Uplink

A packet sent from the `thing` to the cloud

### Downlink

A packet sent from the cloud to the `thing`

## API

A driver is composed of 2 parts:
* a static descriptive definition that describes the driver
* a javascript code made of four possible functions to perform the encoding and decoding tasks

### Driver definition

The driver definition must be declared in the driver's NPM's `package.json`.

This is the first condition for a driver to be valid: being an NPM package that includes a `driver` object in its
`package.json` which declares it least a `producerId`, a `type` and an `application`.

Here is an example of a `driver` definition:

```json
{
  "name": "example-driver",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "jest"
  },
  "driver": {
    "producerId": "actility",
    "type": "thingpark-x-js",
    "application": {
      "producerId": "myProducer",
      "moduleId": "myModule",
      "version": "1"
    },
    "points": {
      "temperature": {
        "unitId": "Cel",
        "type": "double"
      },
      "humidity": {
        "unitId": "%RH",
        "type": "double"
      },
      "pulseCounter": {
        "type": "int64"
      }
    }
  },
  "devDependencies": {
    "jest": "^24.9.0"
  }
}
```

In this example, we declare a driver produced by `actility` which can treat payloads from an example `application`
specified by `myProducer` and whose name is `myModule` and version is `1`.

This driver is of type `thingpark-x-js` and this must be declared and shall not be set to another value.

This driver also declares that it will extract 3 points which are: `temperature`, `humidity` and `pulseCounter`.

`producerId` and `application` are _mandatory_ for Thingpark X IoT Flow framework to select the correct driver.
The `points` section is _mandatory_ only when using the `extractPoints(input)` function (see [here](#point-extraction)
for a complete description). It describes a "contract" of points that can be extracted with the driver.

### Driver functions

The following sections describe the four javascript functions that a driver can declare to perform encoding and decoding
tasks.

A driver must at least declare a `decodeUplink(input)` function to be valid (see next section)

#### Uplink decode

Uplinks are decoded by calling the following function:

```
function decodeUplink(input) {...}
```

_Note:_ _this function is required in order for the driver to be valid_

The `input` is an object provided by the IoT Flow framework that is represented by the following json-schema:

```
{
    "bytes": {
        "type": array,
        "items": {
            "type": "number"
        },
        "required": true
    },
    "fPort": {
        "type": "number",
        "required": false
    }
}
```

and the returned object of the function must be the decoded object.

#### Downlink encode

Downlinks are encoded by calling the following function:

```
function encodeDownlink(input) {...}
```

The `input` is an object provided by the IoT Flow framework that is represented by the following json-schema:

```
{
    "message": {
        "type": "object",
        "required": true
    }
}
```

where the `message` object is the higher-level object representing your downlink.

The function must return an object containg 2 fields:
* bytes: array of numbers as it will be sent to the device.
* fPort: the fPort on which the downlink must be sent

#### Downlink decode

Downlinks are decoded by calling the following function:

```
function decodeDownlink(input) {...}
```

The `input` is an object provided by the IoT Flow framework that is represented by the following json-schema:

```
{
    "bytes": {
        "type": array,
        "items": {
            "type": "number"
        },
        "required": true
    },
    "fPort": {
        "type": "number",
        "required": false
    }
}
```

and the returned object of the function must be the decoded object.

#### Points extraction

Points can be extracted once an uplink has been decoded. In order to extract points, a driver must provide the following function:

```
function extractPoints(input) {...}
```

where the input is an object as returned by the `decodeUplink(input)` function.

The returned object is defined by the following json-schema:

```
{
    "type": "object",
    "additionalProperties": {
        "type": "object",
        "properties": {
            "eventTime": {
                "type": "string",
                "format": "date-time",
                "required": true
            },
            "value": {
                "type": ["string", "number", "boolean"],
                "required": false
            },
            "coordinates": {
                "type": array,
                "items": {
                    "type": "number"
                }
                "required": false
            }
        }
    }
}
```

`value` and `coordinates` _could_ be missing on a point, one of them is actually needed, so your
driver _must_ return either `value` or `coordinates` (as well as `eventTime`) for _every_ point.

Here's an example:

```
{
    "temperature": {
        "eventTime": "2019-01-01T10:00:00+01:00",
        "value": 31.4
    },
    "gps": {
        "eventTime": "2019-01-01T10:00:00+01:00",
        "coordinates": [
            48.875158,
            2.333822
        ]
    }
}
```

## Quickstart

You can find the complete following example [here](./example/index.js).

### Minimal driver

Pre-requirements: you need to have npm installed with version > 5. To test the installed version run:

```sh
$ npm -v
```

We'll start by creating a new npm project that will contain the driver. From an empty directory in a terminal run:

```sh
$ npm init
```

After completing all the information requested by npm you will find a new file `package.json` on the directory you ran
`npm init` similar to the following (ignoring the name, version, author, etc):

```json
{
    "name": "myDriver",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
    },
    "author": "",
    "license": "ISC"
}
```

Add the `driver` object (see [here](#driver-definition)) to the `package.json` file containing the description of your driver:

```json
{
    "name": "my-driver",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
    },
    "author": "",
    "license": "ISC",
    "driver": {
        "producerId": "my-driver-producer",
        "type": "thingpark-x-js",
        "application": {
            "producerId": "my-app-producer",
            "moduleId": "my-app-module",
            "version": "1"
        }
    }
}
```

Now that we have a valid npm project, we will create the driver itself. Open a new file named `index.js` where we will
define only an uplink decode:

_index.js_:

```javascript
function decodeUplink(input) {
    var result = {};
    var bytes = input.bytes;
    if (bytes.length > 8) {
        throw new Error("Invalid uplink payload: length exceeds 8 bytes");
    }
    for (i = 0; i < bytes.length; i++) {
        switch (bytes[i]) {
            // Temperature - 2 bytes
            case 0x00:
                if (bytes.length < i + 3) {
                    throw new Error("Invalid uplink payload: index out of bounds when reading temperature");
                }
                var tmp = (bytes[i + 1] << 8) | bytes[i + 2];
                tmp = readShort(tmp);
                result.temperature = tmp / 100;
                i += 2;
                break;
            // Humidity - 2 bytes
            case 0x01:
                if (bytes.length < i + 3) {
                    throw new Error("Invalid uplink payload: index out of bounds when reading humidity");
                }
                var tmp = (bytes[i + 1] << 8) | bytes[i + 2];
                tmp = readShort(tmp);
                result.humidity = tmp / 100;
                i += 2;
                break;
            // Pulse counter - 1 byte
            case 0x02:
                result.pulseCounter = bytes[i + 1];
                i += 1;
                break;
            default:
                throw new Error("Invalid uplink payload: unknown id '" + bytes[i] + "'");
        }
    }
    return result;
}
```

In this function, we use a utility function called `readShort`, you must add the following code in your `index.js`:

```javascript
function readShort(bin) {
    var result = bin & 0xffff;
    if (0x8000 & result) {
        result = -(0x010000 - result);
    }
    return result;
}
```

As you can see by inspecting the code, the driver defines a very simple decode function where only two
objects can be retrieved from the payload: temperature, humidity (2 bytes each) and pulse counter (1 byte).

Now that your driver is finished you can create the npm package. Simply run:

```shell
npm pack
```

This will create a new file with the `.tgz` extension in the current folder containing the complete driver.

### Encoding and decoding downlinks

In the previous step we wrote and packaged a simple driver, which implemented the minimal functionality (i.e.: an uplink decode function).
Now lets extend that driver in order to encode and decode downlinks.

First, lets add a `encodDownlink(input)` function in `index.js`:

```javascript
function encodeDownlink(input) {
    var result = {};
    var bytes = [];
    if (typeof input.pulseCounterThreshold !== "undefined") {
        if (input.pulseCounterThreshold > 255) {
            throw new Error("Invalid downlink: pulseCounterThreshold cannot exceed 255");
        }
        bytes.push(0x00);
        bytes.push(input.pulseCounterThreshold);
    }
    if (typeof input.alarm !== "undefined") {
        bytes.push(0x01);
        if (input.alarm) {
            bytes.push(0x01);
        } else {
            bytes.push(0x00);
        }
    }
    result.bytes = bytes;
    result.fPort = 16;
    return result;
}
```

The `encodeDownlink(input)` function takes an object as parameter (see [here](#downlink-encode)) containing the object (called `message`)
that will be encoded as a downlink. Then the function only checks for two objects inside `message` (`pulseCounterThreshold` and `alarm`)
and write their contents as well as their id as byte array.

We can also add a `decodeDownlink(input)` function. This function will allow us to decode the bytes as they are returned from
`encodeDownlink(input)` and return us the object that represents the downlink.

Add the following function in `index.js`:

```javascript
function decodeDownlink(input) {
    var result = {};
    var bytes = input.bytes;
    for (i = 0; i < bytes.length; i += 2) {
        switch (bytes[i]) {
            // Pulse counter threshold - 1 byte
            case 0x00:
                if (bytes.length < i + 2) {
                    throw new Error("Invalid downlink payload: index out of bounds when reading pulseCounterThreshold");
                }
                result.pulseCounterThreshold = bytes[i + 1];
                break;
            // Alarm - 1 byte
            case 0x01:
                if (bytes.length < i + 2) {
                    throw new Error("Invalid downlink payload: index out of bounds when reading alarm");
                }
                result.alarm = bytes[i + 1] === 1;
                break;
            default:
                throw new Error("Invalid downlink payload: unknown id '" + bytes[i] + "'");
        }
    }
    return result;
}
```

The function takes an `input` object (see [here](#downlink-decode)) that will contain `bytes`. This simple driver will only
decode both objects as returned from `encodeDownlink(input)`: `pulseCounterThreshold` and `alarm`.

After adding `encodeDownlink(input)` and `decodeDownlink(input)` functions you can re-package your driver.

### Extracting points

Now that you have a driver that is able to decode uplinks and downlinks as well as encoding downlinks, lets go further
and extract points from our payloads.

As described [here](#point), a thing can have zero or more attributes, and the attributes that you want to extract as points must
be first statically declared on the `package.json` file.

So lets add both `temperature` and `pulseCounter` points to our package (inside the `driver` object):

```json
{
    "name": "my-driver",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
    },
    "author": "",
    "license": "ISC",
    "driver": {
        "producerId": "my-driver-producer",
        "type": "thingpark-x-js",
        "application": {
            "producerId": "my-app-producer",
            "moduleId": "my-app-module",
            "version": "1"
        },
        "points": {
            "temperature": {
                "unitId": "Cel",
                "type": "double"
            },
            "pulseCounter": {
                "type": "int64"
            }
        }
    }
}
```

As explained in [Point](#point) section, a point can contain a `unitId`, which represents its unit (see [Units]()) and a `type` (see [Point types]()).
In this case we have two `points` (or "containers") where our values will be grouped: `temperature` which is of type `double` and has unit `Celsius`, and `pulseCounter` which has type `int64` and has no unit because it is a counter.

After having defined the points' "contract", we can now add the `extractPoints(input)` function that will implement it.

Add the following function in `index.js`:

```javascript
function extractPoints(input) {
    var result = {};
    if (typeof input.message.temperature !== "undefined") {
        result.temperature = {
            eventTime: input.time,
            value: input.message.temperature,
        };
    }
    if (typeof input.message.humidity !== "undefined") {
        result.humidity = {
            eventTime: input.time,
            value: input.message.humidity,
        };
    }
    if (typeof input.message.pulseCounter !== "undefined") {
        result.pulseCounter = {
            eventTime: input.time,
            value: input.message.pulseCounter,
        };
    }
    return result;
}
```

As you can see, the `input.time` is required so you can set the `eventTime` field on each point. Here, we simply retrieve
the value from the input, for example the `temperature` value is `input.message.temperature`.

### Returning errors

As you have noticed, only one kind of error throw is possible when writing Thingpark-X IoT Flow drivers:

```javascript
throw new Error(message);
```

Where `message` is the string that will be catched by the IoT Flow framework.

_Note: All throws that do not throw an `Error` object will be ignored by the IoT Flow framework._

### Testing

Testing your driver is a very important process, thus the user is highly encouraged to test the driver in most possible
use cases as well as error cases.

You can find the full example tests [here](./example/test/driver.spec.js).

We provide a full test of our example driver [here](./example/test/driver.spec.js). We used [Jest](https://jestjs.io/) as our testing framweork.

_Note: when testing, you will need to export the functions that you test (unless of course you copy / paste the functions into the testing file). This is *not* needed in your driver if not tested_

To exports functions, you can add the following at the end of the `index.js` file:

```javascript
exports.decodeUplink = decodeUplink;
exports.decodeDownlink = decodeDownlink;
exports.encodeDownlink = encodeDownlink;
exports.extractPoints = extractPoints;
```

#### Add jest dependency

To add the jest dependency, please run the following command:

```shell
npm install --save-dev jest
```

#### Update package.json to add a script

First, you need to add the `test` script in the `package.json`:

```json
  "scripts": {
    "test": "jest"
  }
```

Then, you will be able to launch tests using command `npm test`

#### Create file

You can create a folder named `test` and create a file inside named `driver.spec.ts`.

Note that `.spec.ts` extension shall be used for files containing unit test cases.

#### Import the code of the driver

In order to use the functions defined in the driver, you must add the following code at the beggining of the file:

```javascript
var driver = require("../index");
```

#### Always test that the functions you defined are in fact correctly defined

```javascript
describe("Decode uplink correct definition", () => {
    it("should decode uplink function defined", () => {
        // When / Then
        expect(typeof driver.decodeUplink === "function").toBe(true);
    });

    it("should decode uplink function take exactly 1 parameter", () => {
        // When / Then
        expect(driver.decodeUplink.length).toBe(1);
    });
});
```

Although this might seem like a waste of time, a wrongly defined driver will not be loaded by the IoT Flow framework and therefore it will be useless.

#### Test that the errors you should throw are actually thrown

```javascript
describe("Decode uplink correct definition", () => {
    it("should fail decode uplink when payload exceeds 8 bytes", () => {
        // Given
        const bytes = [0x00, 0x0c, 0x44, 0x01, 0x0c, 0x44, 0x02, 0x0c, 0xaa];
        const input = {};
        input.bytes = bytes;

        // When / Then
        expect(() => driver.decodeUplink(input)).toThrow("Invalid uplink payload: length exceeds 8 bytes");
    });
});
```

In this case we provided a payload containing 9 bytes while our example driver will throw an error if the payload exceeds 8 bytes.

#### Test at least one "correct" case

```javascript
describe("Decode uplink correct definition", () => {
    it("should decode uplink containing three measurements", () => {
        // Given
        const bytes = [0x00, 0x0c, 0x44, 0x01, 0x0c, 0x44, 0x02, 0x0c];
        const input = {};
        input.bytes = bytes;

        const expected = {
            temperature: 31.4,
            humidity: 31.4,
            pulseCounter: 12,
        };

        // When
        const result = driver.decodeUplink(input);

        // Then
        expect(result).toStrictEqual(expected);
    });
});
```

In this case we test a full payload that is correctly decoded by our example driver.

#### Execute tests

To execute tests, you must use the following command:

```shell
npm test
```
