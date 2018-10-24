/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Maksim Nazarjev @acupofspirt
*/

"use strict";

const WebpackError = require("./WebpackError");
const makeSerializable = require("./util/makeSerializable");

class ConcurrentCompilationError extends WebpackError {
	constructor() {
		super();

		this.name = "ConcurrentCompilationError";
		this.message =
			"You ran Webpack twice. Each instance only supports a single concurrent compilation at a time.";

		Error.captureStackTrace(this, this.constructor);
	}
}

makeSerializable(
	ConcurrentCompilationError,
	"webpack/lib/ConcurrentCompilationError"
);

module.exports = ConcurrentCompilationError;
