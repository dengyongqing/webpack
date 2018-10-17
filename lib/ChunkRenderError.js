/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const WebpackError = require("./WebpackError");
const makeSerializable = require("./util/makeSerializable");

/** @typedef {import("./Chunk")} Chunk */

class ChunkRenderError extends WebpackError {
	/**
	 * Create a new ChunkRenderError
	 * @param {Chunk} chunk A chunk
	 * @param {string} file Related file
	 * @param {Error} error Original error
	 */
	constructor(chunk, file, error) {
		super();

		this.name = "ChunkRenderError";
		this.error = error;
		this.message = error.message;
		this.details = error.stack;
		this.file = file;
		this.chunk = chunk;

		Error.captureStackTrace(this, this.constructor);
	}

	serialize(context) {
		const { write } = context;

		write(this.name);
		write(this.error);
		write(this.message);
		write(this.details);
		write(this.file);
		write(this.chunk);

		super.serialize(context);
	}

	deserialize(context) {
		const { read } = context;

		this.name = read();
		this.error = read();
		this.message = read();
		this.details = read();
		this.file = read();
		this.chunk = read();

		super.serialize(context);
	}
}

makeSerializable(ChunkRenderError, "webpack/lib/ChunkRenderError");

module.exports = ChunkRenderError;
