# IoT Flow JavaScript driver developer guide

This project describes how to build a javascript driver for the ThingPark X IoT Flow framework.

A driver allows to easily integrate new devices in ThingPark X IoT Flow. With it you define
how to decode uplinks/downlinks, how to encode downlinks and how to extract points.

* [IoT Flow JavaScript driver developer guide](#IoT-Flow-JavaScript-driver-developer-guide)
  * [Concepts](#concepts)
    * [Driver](#driver)
    * [Thing](#thing)
    * [Point](#point)
    * [Application](#application)
    * [Uplink](#uplink)
    * [Downlink](#downlink)
  * [API](#API)
    * [Driver definition](#driver-definition)
    * [Driver functions](#driver-functions)
      * [Uplink decode](#uplink-decode)
      * [Downlink encode](#downlink-encode)
      * [Downlink decode](#downlink-decode)
      * [Points extraction](#points-extraction)
  * [Examples](#examples)
    * [Simple driver](#simple-driver)
    * [Advanced driver](#advanced-driver)

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
        "description": "the uplink payload byte array",
        "type": array,
        "items": {
            "type": "number"
        },
        "required": true
    },
    "fPort": {
        "description": "the uplink payload fPort",
        "type": "number",
        "required": false
    },
    "time": {
        "description": "the datetime of the uplink message, it is a real javascript Date object",
        "type": "string",
        "format": "date-time",
        "required": true
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

The `input` is an object provided by the IoT Flow framework that is represented by the following json-schema:

```
{
    "message": {
        "description": "the object message as returned by the decodeUplink function",
        "type": "object",
        "required": true
    },
    "time": {
        "description": "the datetime of the uplink message, it is a real javascript Date object",
        "type": "string",
        "format": "date-time",
        "required": true
    }
}
```

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

## Examples

### Simple driver

You will find [here](examples/simple-driver/README.md) a tutorial explaining how to create your first driver. It follows
the creation of a driver for a fictive device exposing a temperature, humidity and a pulse counter. 

### Advanced driver

If your device payload is complex and requires several source code files to increase readability and maintainability you
can look at this example [here](examples/advanced-driver/README.md). In this tutorial, we will restart from the
previously created driver and transform it to use several files
