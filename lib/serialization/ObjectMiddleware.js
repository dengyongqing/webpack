/*
	MIT License http://www.opensource.org/licenses/mit-license.php
*/

"use strict";

const ErrorObjectSerializer = require("./ErrorObjectSerializer");
const MapObjectSerializer = require("./MapObjectSerializer");
const PlainObjectSerializer = require("./PlainObjectSerializer");
const RegExpObjectSerializer = require("./RegExpObjectSerializer");
const SerializerMiddleware = require("./SerializerMiddleware");
const SetObjectSerializer = require("./SetObjectSerializer");

/** @typedef {new (...params: any[]) => any} Constructor */

/*

Format:

File -> Section*
Section -> ObjectSection | ReferenceSection | EscapeSection | OtherSection

ObjectSection -> ESCAPE (
	number:relativeOffset (number > 0) |
	string:request (string|null):export
) Section:value* ESCAPE ESCAPE_END_OBJECT
ReferenceSection -> ESCAPE number:relativeOffset (number < 0)
EscapeSection -> ESCAPE ESCAPE_ESCAPE_VALUE (escaped value ESCAPE)
EscapeSection -> ESCAPE ESCAPE_UNDEFINED (escaped value ESCAPE)
OtherSection -> any (except ESCAPE)

Why using null as escape value?
Multiple null values can merged by the BinaryMiddleware, which makes it very efficient
Technically any value can be used.

*/

/**
 * @typedef {Object} ObjectSerializerContext
 * @property {function(any): void} write
 */

/**
 * @typedef {Object} ObjectDeserializerContext
 * @property {function(): any} read
 */

/**
 * @typedef {Object} ObjectSerializer
 * @property {function(any, ObjectSerializerContext): void} serialize
 * @property {function(ObjectDeserializerContext): any} deserialize
 */

const ESCAPE = null;
const ESCAPE_ESCAPE_VALUE = null;
const ESCAPE_END_OBJECT = true;
const ESCAPE_UNDEFINED = false;

const CURRENT_VERSION = 1;

const plainObjectSerializer = new PlainObjectSerializer();

const serializers = new Map();
const serializerInversed = new Map();

const loadedRequests = new Set();

const NOT_SERIALIZABLE = {};

serializers.set(Object, {
	request: "",
	name: null,
	serializer: plainObjectSerializer
});

serializers.set(Array, {
	request: "",
	name: null,
	serializer: plainObjectSerializer
});

const jsTypes = new Map();
jsTypes.set(Map, new MapObjectSerializer());
jsTypes.set(Set, new SetObjectSerializer());
jsTypes.set(RegExp, new RegExpObjectSerializer());
jsTypes.set(Error, new ErrorObjectSerializer(Error));
jsTypes.set(EvalError, new ErrorObjectSerializer(EvalError));
jsTypes.set(RangeError, new ErrorObjectSerializer(RangeError));
jsTypes.set(ReferenceError, new ErrorObjectSerializer(ReferenceError));
jsTypes.set(SyntaxError, new ErrorObjectSerializer(SyntaxError));
jsTypes.set(TypeError, new ErrorObjectSerializer(TypeError));

{
	let i = 1;
	for (const [type, serializer] of jsTypes) {
		serializers.set(type, {
			request: "",
			name: i++,
			serializer
		});
	}
}

for (const { request, name, serializer } of serializers.values()) {
	serializerInversed.set(`${request}/${name}`, serializer);
}

class ObjectMiddleware extends SerializerMiddleware {
	/**
	 * @param {Constructor} Constructor the constructor
	 * @param {string} request the request which will be required when deserializing
	 * @param {string} name the name to make multiple serializer unique when sharing a request
	 * @param {ObjectSerializer} serializer the serializer
	 * @returns {void}
	 */
	static register(Constructor, request, name, serializer) {
		const key = request + "/" + name;

		if (serializers.has(Constructor)) {
			throw new Error(
				`ObjectMiddleware.register: serializer for ${
					Constructor.name
				} is already registered`
			);
		}

		if (serializerInversed.has(key)) {
			throw new Error(
				`ObjectMiddleware.register: serializer for ${key} is already registered`
			);
		}

		serializers.set(Constructor, {
			request,
			name,
			serializer
		});

		serializerInversed.set(key, serializer);
	}

	/**
	 * @param {Constructor} Constructor the constructor
	 * @returns {void}
	 */
	static registerNotSerializable(Constructor) {
		if (serializers.has(Constructor)) {
			throw new Error(
				`ObjectMiddleware.registerNotSerializable: serializer for ${
					Constructor.name
				} is already registered`
			);
		}

		serializers.set(Constructor, NOT_SERIALIZABLE);
	}

	static getSerializerFor(object) {
		const c = object.constructor;
		const config = serializers.get(c);

		if (!config) throw new Error(`No serializer registered for ${c.name}`);
		if (config === NOT_SERIALIZABLE) throw NOT_SERIALIZABLE;

		return config;
	}

	static getDeserializerFor(request, name) {
		const key = request + "/" + name;
		const serializer = serializerInversed.get(key);

		if (serializer === undefined) {
			throw new Error(`No deserializer registered for ${key}`);
		}

		return serializer;
	}

	_handleFunctionSerialization(fn, context) {
		return () => {
			const r = fn();

			if (r instanceof Promise)
				return r.then(data => this.serialize([data], context));

			return this.serialize([r], context);
		};
	}

	_handleFunctionDeserialization(fn, context) {
		return () => {
			const r = fn();

			if (r instanceof Promise)
				return r.then(data => this.deserialize(data, context)[0]);

			return this.deserialize(r, context)[0];
		};
	}

	/**
	 * @param {any[]} data data items
	 * @param {TODO} context TODO
	 * @returns {any[]|Promise<any[]>} serialized data
	 */
	serialize(data, context) {
		/** @type {any[]} */
		const result = [CURRENT_VERSION];
		let currentPos = 0;
		const referenceable = new Map();
		const addReferenceable = item => {
			referenceable.set(item, currentPos++);
		};
		let currentPosTypeLookup = 0;
		const objectTypeLookup = new Map();
		const cycleStack = new Set();
		const process = item => {
			// check if we can emit a reference
			const ref = referenceable.get(item);

			if (ref !== undefined) {
				result.push(ESCAPE, ref - currentPos);

				return;
			}

			if (Buffer.isBuffer(item)) {
				addReferenceable(item);

				result.push(item);
			} else if (typeof item === "object" && item !== null) {
				if (cycleStack.has(item)) {
					throw new Error(
						`Circular references can't be serialized (${Array.from(cycleStack)
							.concat([item])
							.map(obj => obj.constructor.name)
							.join(" -> ")})`
					);
				}

				const { request, name, serializer } = ObjectMiddleware.getSerializerFor(
					item
				);
				const key = `${request}/${name}`;
				const lastIndex = objectTypeLookup.get(key);

				if (lastIndex === undefined) {
					objectTypeLookup.set(key, currentPosTypeLookup++);

					result.push(ESCAPE, request, name);
				} else {
					result.push(ESCAPE, currentPosTypeLookup - lastIndex);
				}

				cycleStack.add(item);

				serializer.serialize(item, {
					write(value) {
						process(value);
					}
				});

				cycleStack.delete(item);

				result.push(ESCAPE, ESCAPE_END_OBJECT);

				addReferenceable(item);
			} else if (typeof item === "string") {
				if (item !== "") {
					// empty strings are shorter when not emitting a reference (this saves 1 byte per empty string)
					addReferenceable(item);
				}

				result.push(item);
			} else if (item === ESCAPE) {
				result.push(ESCAPE, ESCAPE_ESCAPE_VALUE);
			} else if (typeof item === "function") {
				result.push(this._handleFunctionSerialization(item));
			} else if (item === undefined) {
				result.push(ESCAPE, ESCAPE_UNDEFINED);
			} else {
				result.push(item);
			}
		};

		try {
			for (const item of data) {
				process(item);
			}
		} catch (e) {
			if (e === NOT_SERIALIZABLE) return null;

			throw e;
		}

		return result;
	}

	/**
	 * @param {any[]} data data items
	 * @param {TODO} context TODO
	 * @returns {any[]|Promise<any[]>} deserialized data
	 */
	deserialize(data, context) {
		let currentDataPos = 0;
		const read = () => {
			if (currentDataPos >= data.length)
				throw new Error("Unexpected end of stream");

			return data[currentDataPos++];
		};

		if (read() !== CURRENT_VERSION)
			throw new Error("Version missmatch, serializer changed");

		let currentPos = 0;
		const referenceable = new Map();
		const addReferenceable = item => {
			referenceable.set(currentPos++, item);
		};
		let currentPosTypeLookup = 0;
		const objectTypeLookup = new Map();
		const result = [];
		const decodeValue = () => {
			const item = read();

			if (item === ESCAPE) {
				const nextItem = read();

				if (nextItem === ESCAPE_ESCAPE_VALUE) {
					return ESCAPE;
				} else if (nextItem === ESCAPE_UNDEFINED) {
					return undefined;
				} else if (nextItem === ESCAPE_END_OBJECT) {
					throw new Error(
						`Unexpected end of object at position ${currentDataPos - 1}`
					);
				} else if (typeof nextItem === "number" && nextItem < 0) {
					// relative reference
					return referenceable.get(currentPos + nextItem);
				} else {
					const request = nextItem;
					let serializer;

					if (typeof request === "number") {
						serializer = objectTypeLookup.get(currentPosTypeLookup - request);
					} else {
						const name = read();

						if (request && !loadedRequests.has(request)) {
							require(request);

							loadedRequests.add(request);
						}

						serializer = ObjectMiddleware.getDeserializerFor(request, name);

						objectTypeLookup.set(currentPosTypeLookup++, serializer);
					}
					const item = serializer.deserialize({
						read() {
							const item = decodeValue();

							return item;
						}
					});
					const end1 = read();

					if (end1 !== ESCAPE) {
						throw new Error("Expected end of object");
					}

					const end2 = read();

					if (end2 !== ESCAPE_END_OBJECT) {
						throw new Error("Expected end of object");
					}

					addReferenceable(item);

					return item;
				}
			} else if (typeof item === "string") {
				if (item !== "") {
					addReferenceable(item);
				}

				return item;
			} else if (Buffer.isBuffer(item)) {
				addReferenceable(item);

				return item;
			} else if (typeof item === "function") {
				return this._handleFunctionDeserialization(item, context);
			} else {
				return item;
			}
		};

		while (currentDataPos < data.length) {
			result.push(decodeValue());
		}

		return result;
	}
}

module.exports = ObjectMiddleware;
