# Simple driver guide

This example describes how you to create a simple driver using ThingPark X IoT Flow framework.

The concepts and API is describe [here](../../README.md)

* [Simple driver](#simple-driver-guide)
  * [Minimal driver](#minimal-driver)
  * [Encoding and decoding downlinks](#encoding-and-decoding-downlinks)
  * [Extracting points](#extracting-points)
  * [Returning errors](#returning-errors)
  * [Testing](#testing)

You can find the complete code [here](./example/index.js).

## Minimal driver

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
    "name": "simple-driver",
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
    "name": "simple-driver",
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

## Encoding and decoding downlinks

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

## Extracting points

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

## Returning errors

As you have noticed, only one kind of error throw is possible when writing Thingpark-X IoT Flow drivers:

```javascript
throw new Error(message);
```

Where `message` is the string that will be catched by the IoT Flow framework.

_Note: All throws that do not throw an `Error` object will be ignored by the IoT Flow framework._

## Testing

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

### Add jest dependency

To add the jest dependency, please run the following command:

```shell
npm install --save-dev jest
```

### Update package.json to add a script

First, you need to add the `test` script in the `package.json`:

```json
  "scripts": {
    "test": "jest"
  }
```

Then, you will be able to launch tests using command `npm test`

### Create file

You can create a folder named `test` and create a file inside named `driver.spec.ts`.

Note that `.spec.ts` extension shall be used for files containing unit test cases.

### Import the code of the driver

In order to use the functions defined in the driver, you must add the following code at the beggining of the file:

```javascript
var driver = require("../index");
```

### Always test that the functions you defined are in fact correctly defined

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

### Test that the errors you should throw are actually thrown

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

### Test at least one "correct" case

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

### Execute tests

To execute tests, you must use the following command:

```shell
npm test
```
