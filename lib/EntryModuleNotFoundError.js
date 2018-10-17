/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const WebpackError = require("./WebpackError");
const makeSerializable = require("./util/makeSerializable");

class EntryModuleNotFoundError extends WebpackError {
	constructor(err) {
		super("Entry module not found: " + err);

		this.name = "EntryModuleNotFoundError";
		this.details = err.details;
		this.error = err;

		Error.captureStackTrace(this, this.constructor);
	}

	serialize(context) {
		const { write } = context;

		write(this.name);
		write(this.details);
		write(this.error);

		super.serialize(context);
	}

	deserialize(context) {
		const { read } = context;

		this.name = read();
		this.details = read();
		this.error = read();

		super.serialize(context);
	}
}

makeSerializable(
	EntryModuleNotFoundError,
	"webpack/lib/EntryModuleNotFoundError"
);

module.exports = EntryModuleNotFoundError;
