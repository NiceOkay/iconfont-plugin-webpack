'use strict';

const Base = require('run-plugin-webpack');
const SvgiconsToSvgfont = require('svgicons2svgfont');
const Font = require('fonteditor-core').Font;
const woff2 = require('fonteditor-core').woff2;
const fs = require('fs');
const path = require('path');
const svgToTtf = require('svg2ttf');

// checks if a recompilation is necessary
function shouldReplace(svg, cssPath, newCssContent) {
	try {
		fs.accessSync(svg.path, fs.constants ? fs.constants.R_OK : fs.R_OK);
        fs.accessSync(cssPath, fs.constants ? fs.constants.R_OK : fs.R_OK);
	} catch(e) {
		return true;
	}
	const oldSvg = fs.readFileSync(svg.path).toString();
	const newSvg = svg.contents.toString();

    const oldCss = fs.readFileSync(cssPath).toString();

	const svgDifferent = oldSvg !== newSvg; // returns true if new SVG is different
	const cssDifferent = oldCss !== newCssContent; // returns true if new SCSS is different

	// only rerender if svgs or scss are different
    return svgDifferent || cssDifferent ? true : false;
}

function noop() {

}

const Plugin = Base.extends(function(options) {
	this.options = this.getOptions(options);
});

Plugin.prototype.getOptions = function(options) {
	const opts = Object(options);
	if(!opts.src || 'string' !== typeof opts.src) {
		throw new TypeError('`src` is invalid!');
	}
	if(!opts.dest || 'string' !== typeof opts.dest.font || 'string' !== typeof opts.dest.css) {
		throw new TypeError('`dest` is invalid!');
	}
	if(typeof opts.dest.alias !== 'undefined' && typeof opts.dest.alias !== 'string') {
		throw new TypeError('`alias` is invalid!');
	}
	if(typeof opts.dest.aliasPath !== 'undefined' && typeof opts.dest.aliasPath !== 'string') {
		throw new TypeError('`aliasPath` is invalid!');
	}
	if(typeof opts.dest.type !== 'undefined' && !Array.isArray(opts.dest.type)) {
		throw new TypeError('`type` is invalid!');
	}
	const defaultTypes = ['eot', 'ttf', 'svg', 'woff', 'woff2'];
	const src = path.resolve(opts.src);
	const dest = {
		font: path.resolve(opts.dest.font),
		css: path.resolve(opts.dest.css),
		alias: typeof opts.dest.alias === 'string' ? opts.dest.alias : null,
		aliasPath: typeof opts.dest.aliasPath === 'string' ? opts.dest.aliasPath : null,
		type: opts.dest.type
			? opts.dest.type.filter((type) => {
				return defaultTypes.find((defaultType) => {
					return type === defaultType;
				});
			})
			: defaultTypes
	};
	const cssTemplate = ('function' === typeof opts.cssTemplate
		? opts.cssTemplate
		: require('./src/template')
	);
	return {
		src: src,
		dest: {
			font: dest.font,
			css: dest.css,
			alias: dest.alias,
			aliasPath: dest.aliasPath,
			type: dest.type.length < 1 ? defaultTypes : dest.type
		},
		cssTemplate: cssTemplate,
		family: ('string' === typeof opts.family && opts.family) || 'iconfont'
	};
};

Plugin.prototype.main = function() {
	const src = this.options.src;
	const readdir = fs.readdirSync(src);
	const useMultipleGroups = readdir.some(function(file) {
		return fs.lstatSync(path.join(src, file)).isDirectory();
	});
	const context = this;
	const promises = (useMultipleGroups
		? readdir.reduce(function(box, dir) {
			const dirPath = path.join(src, dir);
			if (fs.lstatSync(dirPath).isDirectory()) {
				const files = fs.readdirSync(dirPath).map(function(file) {
					return path.resolve(dirPath, file);
				});
				box.push(context.generateFonts(dir, files));
			}
			return box;
		}, [])
		: [ this.generateFonts(this.options.family, readdir.map(function(file) {
			return path.resolve(src, file);
		})) ]
	);
	return Promise.all(promises);
};

Plugin.prototype.generateFonts = function(family, files) {
	const svgs = files.filter(RegExp.prototype.test.bind(/\.svg$/i));
	const context = this;
	return new Promise(function(resolve, reject) {
		const buffer = [];
		const unicodes = [];
		const fileStream = new SvgiconsToSvgfont({
			fontName: family,
			prependUnicode: true,
			log: noop,
			fontHeight: 5000,
			normalize: true
		}).on('data', function(data) {
			return buffer.push(data);
		}).on('end', function() {
			return resolve({
				contents: Buffer.concat(buffer).toString(),
				unicodes: unicodes
			});
		}).on('error', function(err) {
			return reject(err);
		});
		let startUnicode = 0xEA01;
		svgs.forEach(function(file) {
			const glyph = fs.createReadStream(file);
			const unicode = String.fromCharCode(startUnicode++);
			const name = path.parse(file).name;
			unicodes.push({ name: name, unicode: unicode });
			glyph.metadata = {
				name: name,
				unicode: [ unicode ]
			};
			fileStream.write(glyph);
		});
		fileStream.end();
	}).then(function(args) {
		const ttf = new Buffer(svgToTtf(args.contents.toString()).buffer);
		const fontCreator = Font.create(ttf, {
			type: 'ttf',
			hinting: true,
			compound2simple: true,
			inflate: null,
			combinePath: true
		});
		
		const files = context.options.dest.type.map(async function(type) {
			let buffer = null;
			
			if (type === 'woff2') {
				buffer = await woff2.init().then(() => {
					return fontCreator.write({type: 'woff2'});
				});
			} else {
				buffer = fontCreator.write({
					type: type,
					hinting: true,
					deflate: null
				});
			}
			
			const filePath = context.options.dest.font
				.replace(/\[family\]/g, family)
				.replace(/\[type\]/g, type);
			
			return { path:filePath, contents: buffer };
		}, []);
		
		return { files: files, unicodes: args.unicodes };
	}).then(async function(args) {
		const files = await Promise.all(args.files);
		const unicodes = args.unicodes;
		const pathToFonts = context.options.dest.alias !== null || context.options.dest.aliasPath !== null
			? path.resolve(path.dirname(context.options.dest.css), path.dirname(context.options.dest.font)).replace(/\\/g, '/').replace(context.options.dest.aliasPath, context.options.dest.alias)
			: path.relative(path.dirname(context.options.dest.css), path.dirname(context.options.dest.font)).replace(/\\/g, '/');
		const cssContent = context.options.cssTemplate({
			unicodes: unicodes,
			family: family,
			fontPath: pathToFonts,
			fontTypes: context.options.dest.type
		});
		const cssPath = context.options.dest.css.replace(/\[family\]/g, family);

		if(!shouldReplace(files[0], cssPath, cssContent)) {
			return;
		}
		files.forEach(function(file) {
			return context.addFile(file.path, file.contents);
		});
		return Promise.resolve(cssContent)
		.then(function(cssContent) {
			const cssPath = context.options.dest.css.replace(/\[family\]/g, family);
			context.addFile(cssPath, cssContent);
		});
	}).catch(console.dir);
};

module.exports = Plugin;
