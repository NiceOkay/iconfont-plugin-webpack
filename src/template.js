'use strict';

const TEMPLATE = `
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
  @if (null == $group) {
    $group: nth(map-keys($__iconfont__data), 1);
  }
  @if (false == map-has-key($__iconfont__data, $group)) {
    @warn 'Undefined Iconfont Family!';
    @return ();
  }
  @return map-get($__iconfont__data, $group);
}

// helper function to get the correct icon of a group
@function iconfont-item($name) {
  $slash: str-index($name, '/');
  $group: null;
  @if ($slash) {
    $group: str-slice($name, 0, $slash - 1);
    $name: str-slice($name, $slash + 1);
  } @else {
    $group: nth(map-keys($__iconfont__data), 1);
  }
  $group: iconfont-group($group);
  @if (false == map-has-key($group, $name)) {
    @warn 'Undefined Iconfont Glyph!';
    @return '';
  }
  @return map-get($group, $name);
}

// complete mixing to include the icon
// usage:
// .my_icon{ @include iconfont('star') }
@mixin iconfont($icon) {
  $slash: str-index($icon, '/');
  $group: null;
  @if ($slash) {
    $group: str-slice($icon, 0, $slash - 1);
  } @else {
    $group: nth(map-keys($__iconfont__data), 1);
  }
  &:before {
    font-family: $group;
    font-style: normal;
    font-weight: 400;
    content: iconfont-item($icon);
  }
}

// creates the font face tag if the variable is set to true (default)
@if $create-font-face == true {
  @font-face {
   font-family: "__FAMILY__";
   __FONT_SRC__
  }
}

// creates icon classes for each individual loaded svg (default)
@if $create-icon-classes == true {
  .#{$icon-common-class} {
    font-style: normal;
    font-weight: 400;

    @each $icon, $content in map-get($__iconfont__data, "__FAMILY__") {
      &.#{$icon-prefix}#{$icon}:before {
        font-family: "__FAMILY__";
        content: iconfont-item("__FAMILY__/#{$icon}");
      }
    }
  }
}
`;

function toSCSS(glyphs) {
  return JSON.stringify(glyphs, null, '\t')
    .replace(/\{/g, '(')
    .replace(/\}/g, ')')
    .replace(/\\\\/g, '\\');
}

module.exports = function(args) {
  const family = args.family;
  const pathToFonts = args.fontPath;
  const glyphs = args.unicodes.reduce(function(glyphs, glyph) {
    glyphs[glyph.name] = '\\' + glyph.unicode.charCodeAt(0).toString(16).toLowerCase();
    return glyphs;
  }, {});
  const data = {};
  data[family] = glyphs;
  
  const fontSrc = (() => {
    let types = {
      'eot': 'embedded-opentype',
      'ttf': 'truetype',
      'svg': 'svg',
      'woff': 'woff',
      'woff2': 'woff2'
    };
    let str = '';
    let src = [];
    
    for (let type in types) {
      if (!args.fontTypes.includes(type)) {
        continue;
      }
      
      let query ='';
      if ('eot' === type) {
        str += `src: url('${pathToFonts}/${family}.${type}');\n`;
        query = '?#iefix';
      }
      src.push(`url('${pathToFonts}/${family}.${type}${query}') format('${types[type]}')`);
    }
    
    str += `src: ${src.join(',')};`;
    
    return str;
  })();

    const replacements = {
        __FAMILY__: family,
        //__RELATIVE_FONT_PATH__: pathToFonts
        __FONT_SRC__: fontSrc
    };

    const str = TEMPLATE.replace(RegExp(Object.keys(replacements).join('|'), 'gi'), function(matched) {
        return replacements[matched];
    });

  return [
    `$__iconfont__data: map-merge(if(global_variable_exists('__iconfont__data'), $__iconfont__data, ()), ${toSCSS(data)});`,
    str
  ].join('\n\n');
};