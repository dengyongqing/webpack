/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const WebpackError = require("./WebpackError");
const makeSerializable = require("./util/makeSerializable");

class ModuleDependencyWarning extends WebpackError {
	constructor(module, err, loc) {
		super(err.message);

		this.name = "ModuleDependencyWarning";
		this.details = err.stack
			.split("\n")
			.slice(1)
			.join("\n");
		this.module = module;
		this.loc = loc;
		this.error = err;

		Error.captureStackTrace(this, this.constructor);
	}

	serialize(context) {
		const { write } = context;

		write(this.error);

		super.serialize(context);
	}

	deserialize(context) {
		const { read } = context;

		this.error = read();

		super.deserialize(context);
	}
}

makeSerializable(
	ModuleDependencyWarning,
	"webpack/lib/ModuleDependencyWarning"
);

module.exports = ModuleDependencyWarning;
