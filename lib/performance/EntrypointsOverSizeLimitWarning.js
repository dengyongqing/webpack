/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Sean Larkin @thelarkinn
*/

"use strict";

const { formatSize } = require("../SizeFormatHelpers");
const WebpackError = require("../WebpackError");
const makeSerializable = require("../util/makeSerializable");

class EntrypointsOverSizeLimitWarning extends WebpackError {
	constructor(entrypoints, entrypointLimit) {
		const entrypointList = entrypoints
			.map(
				entrypoint =>
					`\n  ${entrypoint.name} (${formatSize(
						entrypoint.size
					)})\n${entrypoint.files.map(asset => `      ${asset}`).join("\n")}`
			)
			.join("");

		super(`entrypoint size limit: The following entrypoint(s) combined asset size exceeds the recommended limit (${formatSize(
			entrypointLimit
		)}). This can impact web performance.
Entrypoints:${entrypointList}\n`);

		this.name = "EntrypointsOverSizeLimitWarning";

		Error.captureStackTrace(this, this.constructor);
	}
}

makeSerializable(
	EntrypointsOverSizeLimitWarning,
	"webpack/lib/performance/EntrypointsOverSizeLimitWarning"
);

module.exports = EntrypointsOverSizeLimitWarning;
