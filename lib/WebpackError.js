/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Jarid Margolin @jaridmargolin
*/

"use strict";

const makeSerializable = require("./util/makeSerializable");

/** @typedef {import("./Dependency").DependencyLocation} DependencyLocation */

class WebpackError extends Error {
	/**
	 * Creates an instance of WebpackError.
	 * @param {string=} message error message
	 */
	constructor(message) {
		super(message);

		this.details = undefined;
		this.missing = undefined;
		this.module = undefined;
		/** @type {DependencyLocation} */
		this.loc = undefined;
		/** @type {boolean} */
		this.hideStack = undefined;

		Error.captureStackTrace(this, this.constructor);
	}

	inspect() {
		return this.stack + (this.details ? `\n${this.details}` : "");
	}

	serialize({ write }) {
		write(this.name);
		write(this.message);
		write(this.stack);
		write(this.details);
		write(this.missing);
		write(this.loc);
		write(this.hideStack);
	}

	deserialize({ read }) {
		this.name = read();
		this.message = read();
		this.stack = read();
		this.details = read();
		this.missing = read();
		this.loc = read();
		this.hideStack = read();
	}
}

makeSerializable(WebpackError, "webpack/lib/WebpackError");

module.exports = WebpackError;
