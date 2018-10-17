/*
	MIT License http://www.opensource.org/licenses/mit-license.php
*/

"use strict";

const WebpackError = require("./WebpackError");
const makeSerializable = require("./util/makeSerializable");

class HarmonyLinkingError extends WebpackError {
	/** @param {string} message Error message */
	constructor(message) {
		super(message);

		this.name = "HarmonyLinkingError";
		this.hideStack = true;

		Error.captureStackTrace(this, this.constructor);
	}

	serialize(context) {
		const { write } = context;

		write(this.name);
		write(this.hideStack);

		super.serialize(context);
	}

	deserialize(context) {
		const { read } = context;

		this.name = read();
		this.hideStack = read();

		super.serialize(context);
	}
}

makeSerializable(HarmonyLinkingError, "webpack/lib/HarmonyLinkingError");

module.exports = HarmonyLinkingError;
