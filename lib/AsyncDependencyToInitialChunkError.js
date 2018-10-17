/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Sean Larkin @thelarkinn
*/

"use strict";

const WebpackError = require("./WebpackError");
const makeSerializable = require("./util/makeSerializable");

/** @typedef {import("./Module")} Module */

class AsyncDependencyToInitialChunkError extends WebpackError {
	/**
	 * Creates an instance of AsyncDependencyToInitialChunkError.
	 * @param {string} chunkName Name of Chunk
	 * @param {Module} module module tied to dependency
	 * @param {TODO} loc location of dependency
	 */
	constructor(chunkName, module, loc) {
		super(
			`It's not allowed to load an initial chunk on demand. The chunk name "${chunkName}" is already used by an entrypoint.`
		);

		this.name = "AsyncDependencyToInitialChunkError";
		this.module = module;
		this.loc = loc;

		Error.captureStackTrace(this, this.constructor);
	}

	serialize(context) {
		const { write } = context;

		write(this.name);
		write(this.module);
		write(this.loc);

		super.serialize(context);
	}

	deserialize(context) {
		const { read } = context;

		this.name = read();
		this.module = read();
		this.loc = read();

		super.serialize(context);
	}
}

makeSerializable(
	AsyncDependencyToInitialChunkError,
	"webpack/lib/AsyncDependencyToInitialChunkError"
);

module.exports = AsyncDependencyToInitialChunkError;
