/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Sean Larkin @thelarkinn
*/

"use strict";

const { formatSize } = require("../SizeFormatHelpers");
const WebpackError = require("../WebpackError");
const makeSerializable = require("../util/makeSerializable");

class AssetsOverSizeLimitWarning extends WebpackError {
	constructor(assetsOverSizeLimit, assetLimit) {
		const assetLists = assetsOverSizeLimit
			.map(asset => `\n  ${asset.name} (${formatSize(asset.size)})`)
			.join("");

		super(`asset size limit: The following asset(s) exceed the recommended size limit (${formatSize(
			assetLimit
		)}).
This can impact web performance.
Assets: ${assetLists}`);

		this.name = "AssetsOverSizeLimitWarning";
		this.assets = assetsOverSizeLimit;

		Error.captureStackTrace(this, this.constructor);
	}

	serialize(context) {
		const { write } = context;

		write(this.name);
		write(this.module);
		write(this.warning);
		write(this.details);

		super.serialize(context);
	}

	deserialize(context) {
		const { read } = context;

		this.name = read();
		this.module = read();
		this.warning = read();
		this.details = read();

		super.deserialize(context);
	}
}

makeSerializable(
	AssetsOverSizeLimitWarning,
	"webpack/lib/performance/AssetsOverSizeLimitWarning"
);

module.exports = AssetsOverSizeLimitWarning;
