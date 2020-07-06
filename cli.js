#!/usr/bin/env node

const [,, ...arg] = process.argv;
if (arg.some(argument => argument === '--help' || argument === 'h')) {
  console.log('Usage: mobirise-optimizator [options]\n' +
    '\n' +
    'Options:');
  var mainOptions = {
    'white-list': 'Specify an domain: <gotointeractive.com,baskovsky.ru>',
    'minifier': 'Boolean: <true>',
    'input-dir': 'Client path: <mobirise/>',
    'output-dir': 'Client path: <www/>',
    'ld-file': 'Client path: <static/json-ld.json>',
    'open-search-title': 'String name: <my search>',
    'open-search-path': 'Server path: </opensearch.xml>',
    'pwa-manifest-path': 'Server path: </manifest.json>',
    'pwa-sw-path': 'Server path: </sw.js>',
    'pwa-install-service-worker-path': 'Server path: </install-service-worker.html>',
  };
  var mainOptionKeys = Object.keys(mainOptions);
  mainOptionKeys.forEach(function(key) {
    var option = mainOptions[key];
    const xxx = `--${key}`.padEnd(35) + option
    console.log(xxx.toString())
  });
  return;
}

const fs = require('fs');
const exec = require('child_process').execSync;
const { argv } = require('yargs');
const Typograf = require('typograf');

const inputFile = argv.inputDir + argv._;
const outputFile = argv.outputDir + argv._;

/**
 * SEO: norefferer links
 *
 * @param {string} html
 * @return {string}
 */
function addRelsToExternal(html) {
  if (!argv.whiteList) {
    return html;
  }
  const whiteList = '([^/]+\.)?' + argv.whiteList.split(',').join('|');
  const str = '(<a\s*(?!.*\brel=)[^>]*)(href="https?://)((?!(?:' + whiteList + '))[^"]+)"((?!.*\brel=)[^>]*)(?:[^>]*)>';

  return html.replace(new RegExp(str, 'igm'), function replacer (match, p1, p2, p3, offset, string) {
    const anchor = p1 + p2 + p3 +'"' + string + " " + 'rel="nofollow noreferrer noopener noindex">';
    return anchor;
  });
}

/**
 * Speed: minify css, js, html
 *
 * @return {string}
 */
function minify() {
  if (!argv.minifier) {
    return fs.readFileSync(inputFile).toString();
  }
  return exec('html-minifier ' + inputFile + '\
      --collapse-whitespace \
      --remove-comments \
      --use-short-doctype \
      --minify-css \
      --minify-js \
      --file-ext=html').toString();
}

/**
 * SEO: text optimization
 *
 * @param {string} html
 * @return {string}
 */
function typograf(html) {
  const tp = new Typograf({locale: ['ru', 'en-US']});
  return tp.execute(html)
}

/**
 * SEO: remove odd anchors
 *
 * @param {string} html
 * @return {string}
 */
function removeOddHtml(html) {
  const ANCHOR_REGEX = /<section class="engine"><a.[^]*?<\/a><\/section>/g;
  return html.replace(ANCHOR_REGEX, '');
}

/**
 * SEO: set custom opensearch engine
 *
 * @param {string} html
 * @return {string}
 */
function opensearch(html) {
  if (!(argv.openSearchTitle && argv.openSearchPath)) {
    return html;
  }
  const OPENSEARCH_REPLACE_LINK = `<link rel='search' type='application/opensearchdescription+xml' title="${argv.openSearchTitle}" href='${argv.openSearchPath}'>`;
  return html.replace('</head>', OPENSEARCH_REPLACE_LINK + '</head>');
}

/**
 * SEO: set custom structured data
 *
 * @param {string} html
 * @return {string}
 */
function ld(html) {
  if (!argv.ldFile) {
    return html;
  }
  const jsonld = fs.readFileSync(argv.ldFile).toString();
  return html.replace('</head>', `<script type="application/ld+json">${jsonld}</script></head>`);
}

/**
 * SPEED: PWA Service Worker Registration
 *
 * @param {string} html
 * @return {string}
 */
function pwa(html) {
  if (!(argv.pwaManifestPath && argv.pwaSwPath && argv.pwaInstallServiceWorkerPath)) {
    return html;
  }

  const SW_INSTALL = "<script async custom-element='amp-install-serviceworker' src='https://cdn.ampproject.org/v0/amp-install-serviceworker-0.1.js'></script>";
  const htmlModified = html.replace('</head>', SW_INSTALL +
    `<link rel="manifest" href="${argv.pwaManifestPath}" crossOrigin="use-credentials">
    <meta name="theme-color" content="#16161d"/></head>`
  );
  const SW_AMP = `<amp-install-serviceworker src='${argv.pwaSwPath}' layout='nodisplay' data-iframe-src='${argv.pwaInstallServiceWorkerPath}'></amp-install-serviceworker>`;
  return htmlModified.replace('</body>', SW_AMP + '</body>');
}

let result = minify();
result = typograf(result);
result = removeOddHtml(result);
result = addRelsToExternal(result);
result = opensearch(result);
result = ld(result);
result = pwa(result);

fs.writeFileSync(outputFile, result);

return result;
