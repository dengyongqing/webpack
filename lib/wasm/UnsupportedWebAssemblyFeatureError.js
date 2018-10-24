/*
	MIT License http://www.opensource.org/licenses/mit-license.php
*/

"use strict";

const WebpackError = require("../WebpackError");
const makeSerializable = require("../util/makeSerializable");

class UnsupportedWebAssemblyFeatureError extends WebpackError {
	/** @param {string} message Error message */
	constructor(message) {
		super(message);

		this.name = "UnsupportedWebAssemblyFeatureError";
		this.hideStack = true;

		Error.captureStackTrace(this, this.constructor);
	}
}

makeSerializable(
	UnsupportedWebAssemblyFeatureError,
	"webpack/lib/wasm/UnsupportedWebAssemblyFeatureError"
);

module.exports = UnsupportedWebAssemblyFeatureError;
