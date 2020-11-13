var driver = require("../index");

describe("Decode uplink", () => {
    it("should decode uplink function defined", () => {
        // When / Then
        expect(typeof driver.decodeUplink === "function").toBe(true);
    });

    it("should decode uplink function take exactly 1 parameter", () => {
        // When / Then
        expect(driver.decodeUplink.length).toBe(1);
    });

    it("should decode uplink containing only temperature", () => {
        // Given
        const bytes = [0x00, 0x0c, 0x44];
        const input = {};
        input.bytes = bytes;

        // When
        const result = driver.decodeUplink(input);

        // Then
        const expected = {
            temperature: 31.4,
        };
        expect(result).toStrictEqual(expected);
    });

    it("should decode uplink containing only humidity", () => {
        // Given
        const bytes = [0x01, 0x0c, 0x44];
        const input = {};
        input.bytes = bytes;

        // When
        const result = driver.decodeUplink(input);

        // Then
        const expected = {
            humidity: 31.4,
        };
        expect(result).toStrictEqual(expected);
    });

    it("should decode uplink containing only pulse counter", () => {
        // Given
        const bytes = [0x02, 0x0c];
        const input = {};
        input.bytes = bytes;

        // When
        const result = driver.decodeUplink(input);

        // Then
        const expected = {
            pulseCounter: 12,
        };
        expect(result).toStrictEqual(expected);
    });

    it("should decode uplink containing three measurements", () => {
        // Given
        const bytes = [0x00, 0x0c, 0x44, 0x01, 0x0c, 0x44, 0x02, 0x0c];
        const input = {};
        input.bytes = bytes;

        // When
        const result = driver.decodeUplink(input);

        // Then
        const expected = {
            temperature: 31.4,
            humidity: 31.4,
            pulseCounter: 12,
        };
        expect(result).toStrictEqual(expected);
    });

    it("should fail decode uplink when payload exceeds 8 bytes", () => {
        // Given
        const bytes = [0x00, 0x0c, 0x44, 0x01, 0x0c, 0x44, 0x02, 0x0c, 0xaa];
        const input = {};
        input.bytes = bytes;

        // When / Then
        expect(() => driver.decodeUplink(input)).toThrow("Invalid uplink payload: length exceeds 8 bytes");
    });

    it("should decode uplink containing three measurements", () => {
        // Given
        const bytes = [0x00, 0x0c, 0x44, 0x01, 0x0c, 0x44, 0x02, 0x0c];
        const input = {};
        input.bytes = bytes;

        // When
        const result = driver.decodeUplink(input);

        // Then
        const expected = {
            temperature: 31.4,
            humidity: 31.4,
            pulseCounter: 12,
        };
        expect(result).toStrictEqual(expected);
    });

    it("should fail decode uplink when payload contains unknown measurement", () => {
        // Given
        const bytes = [0x03, 0xaa];
        const input = {};
        input.bytes = bytes;

        // When / Then
        expect(() => driver.decodeUplink(input)).toThrow("Invalid uplink payload: unknown id '3'");
    });

    it("should fail decode uplink when payload contains temperature index out of bounds", () => {
        // Given
        const bytes = [0x01, 0x0c, 0x44, 0x00, 0x0c, 0x44, 0x00, 0x0c];
        const input = {};
        input.bytes = bytes;

        // When / Then
        expect(() => driver.decodeUplink(input)).toThrow(
            "Invalid uplink payload: index out of bounds when reading temperature",
        );
    });

    it("should fail decode uplink when payload contains humidity index out of bounds", () => {
        // Given
        const bytes = [0x00, 0x0c, 0x44, 0x01, 0x0c, 0x44, 0x01, 0x0c];
        const input = {};
        input.bytes = bytes;

        // When / Then
        expect(() => driver.decodeUplink(input)).toThrow(
            "Invalid uplink payload: index out of bounds when reading humidity",
        );
    });
});

describe("Encode downlink", () => {
    it("should encode downlink function defined", () => {
        // When / Then
        expect(typeof driver.encodeDownlink === "function").toBe(true);
    });

    it("should encode downlink function take exactly 1 parameter", () => {
        // When / Then
        expect(driver.encodeDownlink.length).toBe(1);
    });

    it("should encode downlink containing only pulseCounterThreshold", () => {
        // Given
        const input = {
            pulseCounterThreshold: 10,
        };

        // When
        const result = driver.encodeDownlink(input);

        // Then
        const expected = {
            bytes: [0x00, 0x0a],
            fPort: 16
        };
        expect(result).toStrictEqual(expected);
    });

    it("should fail encode downlink when pulseCounterThreshold exceeds 255", () => {
        // Given
        const input = {
            pulseCounterThreshold: 256,
        };

        // When / Then
        expect(() => driver.encodeDownlink(input)).toThrow("Invalid downlink: pulseCounterThreshold cannot exceed 255");
    });

    it("should encode downlink containing only alarm", () => {
        // Given
        const input = {
            alarm: true,
        };

        // When
        const result = driver.encodeDownlink(input);

        // Then
        const expected = {
            bytes: [0x01, 0x01],
            fPort: 16
        };
        expect(result).toStrictEqual(expected);
    });

    it("should encode downlink containing alarm and pulseCounterThreshold", () => {
        // Given
        const input = {
            pulseCounterThreshold: 10,
            alarm: true,
        };

        // When
        const result = driver.encodeDownlink(input);

        // Then
        const expected = {
            bytes: [0x00, 0x0a, 0x01, 0x01],
            fPort: 16
        };
        expect(result).toStrictEqual(expected);
    });
});

describe("Decode downlink", () => {
    it("should decode downlink function defined", () => {
        // When / Then
        expect(typeof driver.decodeDownlink === "function").toBe(true);
    });

    it("should decode downlink function take exactly 1 parameter", () => {
        // When / Then
        expect(driver.decodeDownlink.length).toBe(1);
    });

    it("should decode downlink containing only pulseCounterThreshold", () => {
        // Given
        const bytes = [0x00, 0x0a];
        const input = {};
        input.bytes = bytes;

        // When
        const result = driver.decodeDownlink(input);

        // Then
        const expected = {
            pulseCounterThreshold: 10,
        };
        expect(result).toStrictEqual(expected);
    });

    it("should fail decode downlink when payload contains pulseCounterThreshold index out of bounds", () => {
        // Given
        const bytes = [0x00, 0x0a, 0x00];
        const input = {};
        input.bytes = bytes;

        // When / Then
        expect(() => driver.decodeDownlink(input)).toThrow(
            "Invalid downlink payload: index out of bounds when reading pulseCounterThreshold",
        );
    });

    it("should decode downlink containing only alarm", () => {
        // Given
        const bytes = [0x01, 0x01];
        const input = {};
        input.bytes = bytes;

        // When
        const result = driver.decodeDownlink(input);

        // Then
        const expected = {
            alarm: true,
        };
        expect(result).toStrictEqual(expected);
    });

    it("should fail decode downlink when payload contains alarm index out of bounds", () => {
        // Given
        const bytes = [0x00, 0x0a, 0x01];
        const input = {};
        input.bytes = bytes;

        // When / Then
        expect(() => driver.decodeDownlink(input)).toThrow(
            "Invalid downlink payload: index out of bounds when reading alarm",
        );
    });

    it("should decode downlink containing alarm and pulseCounterThreshold", () => {
        // Given
        const bytes = [0x00, 0x0a, 0x01, 0x01];
        const input = {};
        input.bytes = bytes;

        // When
        const result = driver.decodeDownlink(input);

        // Then
        const expected = {
            pulseCounterThreshold: 10,
            alarm: true,
        };
        expect(result).toStrictEqual(expected);
    });

    it("should fail decode downlink when unknown id", () => {
        // Given
        const bytes = [0x00, 0x0a, 0x02];
        const input = {};
        input.bytes = bytes;

        // When / Then
        expect(() => driver.decodeDownlink(input)).toThrow("Invalid downlink payload: unknown id '2'");
    });
});

describe("Extract points", () => {
    it("should extract points function defined", () => {
        // When / Then
        expect(typeof driver.extractPoints === "function").toBe(true);
    });

    it("should extract points function take exactly 1 parameter", () => {
        // When / Then
        expect(driver.extractPoints.length).toBe(1);
    });

    it("should extract points from message with temperature", () => {
        // Given
        const value = 31.4;
        const input = {};
        input.message = {
            temperature: value,
        };
        const now = new Date();
        input.time = now;

        // When
        const result = driver.extractPoints(input);

        // Then
        const expected = {
            temperature: {
                eventTime: now,
                value: value,
            },
        };
        expect(result).toStrictEqual(expected);
    });

    it("should extract points from message with humidity", () => {
        // Given
        const value = 31.4;
        const input = {};
        input.message = {
            humidity: value,
        };
        const now = new Date();
        input.time = now;

        // When
        const result = driver.extractPoints(input);

        // Then
        const expected = {
            humidity: {
                eventTime: now,
                value: value,
            },
        };
        expect(result).toStrictEqual(expected);
    });

    it("should extract points from message with pulseCounter", () => {
        // Given
        const value = 10;
        const input = {};
        input.message = {
            pulseCounter: value,
        };
        const now = new Date();
        input.time = now;

        // When
        const result = driver.extractPoints(input);

        // Then
        const expected = {
            pulseCounter: {
                eventTime: now,
                value: value,
            },
        };
        expect(result).toStrictEqual(expected);
    });

    it("should extract points from full message", () => {
        // Given
        const temperatureVal = 31.4;
        const humidityVal = 31.4;
        const pulsCounterVal = 10;
        const input = {};
        input.message = {
            temperature: temperatureVal,
            humidity: humidityVal,
            pulseCounter: pulsCounterVal,
        };
        const now = new Date();
        input.time = now;

        // When
        const result = driver.extractPoints(input);

        // Then
        const expected = {
            temperature: {
                eventTime: now,
                value: temperatureVal,
            },
            humidity: {
                eventTime: now,
                value: humidityVal,
            },
            pulseCounter: {
                eventTime: now,
                value: pulsCounterVal,
            },
        };
        expect(result).toStrictEqual(expected);
    });
});
