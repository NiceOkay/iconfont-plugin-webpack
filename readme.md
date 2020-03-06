[![npm][npm]][npm-url]
[![deps][deps]][deps-url]

# iconfont-plugin-webpack

### Automatically generate Webfonts from your SVGs using Webpack

#### Installation

`npm install iconfont-plugin-webpack`


#### Usage

You can see a simple example within the [Demo Config](demo/webpack.config.js), but basically you just need to include the package at the top of your webpack config like this:

`const IconfontPlugin = require('iconfont-plugin-webpack');`

And then set up the configuration within the `webpackModule.plugins` like this:

```js
new IconfontPlugin({
    src: './src/asset/iconfont', // required - directory where your .svg files are located
    family: 'iconfont', // optional - the `font-family` name. if multiple iconfonts are generated, the dir names will be used.
    dest: {
        font: './src/font/[family].[type]', // required - paths of generated font files
        css: './src/css/_iconfont_[family].scss', // required - paths of generated css files
        alias: '', // optional
        aliasPath: '', // optional - will replace on alias
        type: ['eot', 'ttf', 'svg', 'woff', 'woff2'] // optional
    },
    watch: {
        pattern: 'src/asset/iconfont/**/*.svg', // required - watch these files to reload
        cwd: undefined // optional - current working dir for watching
    },
    cssTemplate: function() {}// optional - the function to generate css contents
})
```

### Resulting SCSS

The result will be a directory with Fonts in the formats eot, svg, ttf and woff as well as a
.scss file with helping mixins for your iconfont. By default this .scss looks something like this:

```scss
$__iconfont__data: map-merge(if(global_variable_exists('__iconfont__data'), $__iconfont__data, ()), (
	// iconfont data here
));


$create-font-face: true !default; // should the @font-face tag get created?

// should there be a custom class for each icon? will be .filename
$create-icon-classes: true !default; 

// what is the common class name that icons share? in this case icons need to have .icon.filename in their classes
// this requires you to have 2 classes on each icon html element, but reduced redeclaration of the font family
// for each icon
$icon-common-class: 'icon' !default;

// if you whish to prefix your filenames, here you can do so.
// if this string stays empty, your classes will use the filename, for example
// an icon called star.svg will result in a class called .star
// if you use the prefix to be 'icon-' it would result in .icon-star
$icon-prefix: '' !default; 

// helper function to get the correct font group
@function iconfont-group($group: null) {
  // ...
}

// helper function to get the correct icon of a group
@function iconfont-item($name) {
  // ...
}

// complete mixing to include the icon
// usage:
// .my_icon{ @include iconfont('star') }
@mixin iconfont($icon) {
  // ...
}

// creates the font face tag if the variable is set to true (default)
@if $create-font-face == true {
  @font-face {
   font-family: "iconfont";
   src: url('../fonts/iconfont.eot'); /* IE9 Compat Modes */
   src: url('../fonts/iconfont.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
      url('../fonts/iconfont.woff') format('woff'), /* Pretty Modern Browsers */
      url('../fonts/iconfont.ttf')  format('truetype'), /* Safari, Android, iOS */
      url('../fonts/iconfont.svg') format('svg'); /* Legacy iOS */
  }
}

// creates icon classes for each individual loaded svg (default)
@if $create-icon-classes == true {
  .#{$icon-common-class} {
    font-style: normal;
    font-weight: 400;

    @each $icon, $content in map-get($__iconfont__data, "iconfont") {
      &.#{$icon-prefix}#{$icon}:before {
        font-family: "iconfont";
        content: iconfont-item("iconfont/#{$icon}");
      }
    }
  }
}
```

### Testing the demo build

In order to test the demo build included in this package all you need to do is clone this repository, head into the root folder and execute these commands:

```sh
npm install
npm run demo
```

You will then find the generated fonts within `/demo/fonts` and the generated .scss within `/demo/scss`.

If the fonts get bigger than 8192 bytes they will get extracted into their own files,
otherwhise file-loader will embed them as base64 directly into the .css
(See configuration for file-loader in [demo/webpack.config.js](demo/webpack.config.js#L52-L63))

### Maintainers

<table>
  <tbody>
    <tr>
      <td align="center">
        <a href="https://github.com/HaoyCn">
          <img width="150" height="150" src="https://github.com/HaoyCn.png?v=3&s=150">
          </br>
          HaoyCn
        </a>
      </td>
      <td align="center">
        <a href="https://github.com/lucidlemon">
          <img width="150" height="150" src="https://github.com/lucidlemon.png?v=3&s=150">
          </br>
          Daniel Winter
        </a>
      </td>
    </tr>
  <tbody>
</table>




[npm]: https://img.shields.io/npm/v/iconfont-plugin-webpack.svg
[npm-url]: https://npmjs.com/package/iconfont-plugin-webpack

[deps]: https://david-dm.org/webpack-contrib/iconfont-plugin-webpack.svg
[deps-url]: https://david-dm.org/webpack-contrib/iconfont-plugin-webpack
