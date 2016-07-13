// basic build

'use strict';

// engine. Inclded files are specified along
// with any options and custom filters
var nunjucks = require('nunjucks');
nunjucks
  .configure('./_includes', {autoescape: false})
  .addFilter('sortbyorder', function (arr) {
    return arr.sort(dynamicSortMultiple("order", "title"));
});

var
  devBuild = ((process.env.NODE_ENV || '').trim().toLowerCase() !== 'production'),
  metalsmith    = require('metalsmith'),
  markdown      = require('metalsmith-markdown'),
  assets        = require('metalsmith-assets'),
  layouts       = require('metalsmith-layouts'),
  collections   = require('metalsmith-collections'),
  jquery        = require('metalsmith-jquery'),
  browsersync   = devBuild ? require('metalsmith-browser-sync') : null,
  ignore        = require('metalsmith-ignore'),

  ms = metalsmith(__dirname) // the working directory
    .source('content')    // the page source directory
    .destination('_site')
    .use(ignore([
      'images/*'
    ]))
    .use(collections({
      concepts: {
        pattern: '*.md'
      },
      tasks: {
        pattern: 'tasks/*.md'
      }
    }))
    .use(preTemplate())
    .use(markdown())
    .use(jquery(function ($) {
      $('table').addClass('table');
    }))
    .use(addVars())
    .use(layouts({
      engine: "nunjucks",
      directory: "_layouts",
      default: "default.html",
      rename: true
    }))
    .use(assets({
      source: "_static"
    }))
    .use(assets({
      source: "content/images",
      destination: "images"
    }));
    if (browsersync) ms.use(browsersync({ // start test server
      server: "_site/",
      files: ["content/**/*"]
    }));
    ms.build(function (err) {  // build the site
      if (err) throw err;   // and throw errors
    });

console.log("Finished.");

function preTemplate() {
  // lets you use nunjucks variables inside of your markdown
  // files.
  return function (files, metalsmith, done) {

    for (var f in files) {
      var data = files[f].contents.toString();
      data = nunjucks.renderString(data, files[f]);
      files[f].contents = new Buffer(data);
    }
    done();
  };
}

function addVars() {
  // lets you use nunjucks variables inside of your markdown
  // files.
  return function (files, metalsmith, done) {

    var path = require('path');

    for (var f in files) {
      files[f].url = f;
      files[f].filename = path.parse(f).base;
    }
    done();
  };
}

function dynamicSort(property) {
  var sortOrder = 1;
  if(property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a,b) {
    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
    return result * sortOrder;
  }
}

function dynamicSortMultiple() {
  /*
   * save the arguments object as it will be overwritten
   * note that arguments object is an array-like object
   * consisting of the names of the properties to sort by
   */
  var props = arguments;
  return function (obj1, obj2) {
    var i = 0, result = 0, numberOfProperties = props.length;
    /* try getting a different result from 0 (equal)
     * as long as we have extra properties to compare
     */
    while(result === 0 && i < numberOfProperties) {
      result = dynamicSort(props[i])(obj1, obj2);
      i++;
    }
    return result;
  }
}


