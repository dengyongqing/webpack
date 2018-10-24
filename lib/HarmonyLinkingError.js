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
}

makeSerializable(HarmonyLinkingError, "webpack/lib/HarmonyLinkingError");

module.exports = HarmonyLinkingError;
