/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const WebpackError = require("./WebpackError");
const makeSerializable = require("./util/makeSerializable");

class NoModeWarning extends WebpackError {
	constructor() {
		super();

		this.name = "NoModeWarning";
		this.message =
			"configuration\n" +
			"The 'mode' option has not been set, webpack will fallback to 'production' for this value. " +
			"Set 'mode' option to 'development' or 'production' to enable defaults for each environment.\n" +
			"You can also set it to 'none' to disable any default behavior. " +
			"Learn more: https://webpack.js.org/concepts/mode/";

		Error.captureStackTrace(this, this.constructor);
	}
}

makeSerializable(NoModeWarning, "webpack/lib/NoModeWarning");

module.exports = NoModeWarning;
