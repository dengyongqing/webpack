/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Sean Larkin @thelarkinn
*/

"use strict";

const WebpackError = require("../WebpackError");
const makeSerializable = require("../util/makeSerializable");

class NoAsyncChunksWarning extends WebpackError {
	constructor() {
		super(
			"webpack performance recommendations: \n" +
				"You can limit the size of your bundles by using import() or require.ensure to lazy load some parts of your application.\n" +
				"For more info visit https://webpack.js.org/guides/code-splitting/"
		);

		this.name = "NoAsyncChunksWarning";

		Error.captureStackTrace(this, this.constructor);
	}

	serialize(context) {
		const { write } = context;

		write(this.name);

		super.serialize(context);
	}

	deserialize(context) {
		const { read } = context;

		this.name = read();

		super.deserialize(context);
	}
}

makeSerializable(NoAsyncChunksWarning, "webpack/lib/NoAsyncChunksWarning");

module.exports = NoAsyncChunksWarning;
