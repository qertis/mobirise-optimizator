#!/usr/bin/env node

const [,, ...arg] = process.argv;
const isHelpFloag = arg.some(argument => argument === '--help' || argument === 'h')
if (isHelpFloag) {
  console.log('Usage: mobirise-optimizator [options]\n' +
    '\n' +
    'Options:');
  const mainOptions = {
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
  Object.keys(mainOptions).forEach(function(key) {
    const result = `--${key}`.padEnd(35) + mainOptions[key];
    console.log(result.toString());
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
 * @description SEO: norefferer links
 * @param {string} html
 * @return {string}
 */
function addRelsToExternal(html) {
  if (!argv.whiteList) {
    return html;
  }
  const whiteList = '([^/]+\.)?' + argv.whiteList.split(',').join('|');
  const str = '(<a\s*(?!.*\brel=)[^>]*)(href="https?://)((?!(?:' + whiteList + '))[^"]+)"((?!.*\brel=)[^>]*)(?:[^>]*)>';
  return html
      .replace(new RegExp(str, 'igm'), function replacer (match, p1, p2, p3, offset, string) {
        const anchor = p1 + p2 + p3 +'"' + string + " " + 'rel="nofollow noreferrer noopener noindex">';
        return anchor;
      });
}

/**
 * @description Speed: minify css, js, html
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
 * @description SEO: text optimization
 * @param {string} html
 * @return {string}
 */
function typograf(html) {
  const tp = new Typograf({locale: ['ru', 'en-US']});
  return tp.execute(html);
}

/**
 * @description SEO: remove odd anchors
 * @param {string} html
 * @return {string}
 */
function removeOddHtml(html) {
  const removeEngineSection = (html) => {
    const ANCHOR_REGEX = /<section class="engine"><a.[^]*?<\/a><\/section>/g;
    return html
        .replace(ANCHOR_REGEX, '');
  }
  const removeEmptySymbols = (html) => {
    const EMPTY_SYMBOLS = '';
    if (String.prototype.hasOwnProperty('replaceAll')) {
      return html
          .replaceAll(EMPTY_SYMBOLS, '');
    }
    return html
        .replace(new RegExp(EMPTY_SYMBOLS, 'igm'), '');
  }
  return removeEmptySymbols(removeEngineSection(html));
}

/**
 * @description SEO: set custom opensearch engine
 * @param {string} html
 * @return {string}
 */
function opensearch(html) {
  if (!(argv.openSearchTitle && argv.openSearchPath)) {
    return html;
  }
  const OPENSEARCH_REPLACE_LINK = `<link rel='search' type='application/opensearchdescription+xml' title="${argv.openSearchTitle}" href='${argv.openSearchPath}'>`;
  return html
      .replace('</head>', OPENSEARCH_REPLACE_LINK + '</head>');
}

/**
 * @description SEO: set custom structured data
 * @param {string} html
 * @return {string}
 */
function ld(html) {
  if (!argv.ldFile) {
    return html;
  }
  const jsonld = fs.readFileSync(argv.ldFile).toString();
  return html
      .replace('</head>', `<script type="application/ld+json">${jsonld}</script></head>`);
}

/**
 * @description SPEED: PWA Service Worker Registration
 * @param {string} html
 * @return {string}
 */
function pwa(html) {
  if (!(argv.pwaManifestPath && argv.pwaSwPath && argv.pwaInstallServiceWorkerPath)) {
    return html;
  }
  const SW_INSTALL = "<script async custom-element='amp-install-serviceworker' src='https://cdn.ampproject.org/v0/amp-install-serviceworker-0.1.js'></script>";
  const htmlModified = html
      .replace('</head>', SW_INSTALL + `<link rel="manifest" href="${argv.pwaManifestPath}" crossOrigin="use-credentials"><meta name="theme-color" content="#16161d"/></head>`
  );
  const SW_AMP = `<amp-install-serviceworker src='${argv.pwaSwPath}' layout='nodisplay' data-iframe-src='${argv.pwaInstallServiceWorkerPath}'></amp-install-serviceworker>`;
  return htmlModified
      .replace('</body>', SW_AMP + '</body>');
}

/**
 * @description hide mobirize links
 * @param {string} html
 * @return {string}
 */
function CSSHacks(html) {
  const cssFile = `
<style>
  #mobiriseBanner {
    display: none !important;
  }
  body > section:last-of-type:has(a) {
    display: none !important;
  }
  /* fallback for :has not supported */
  body > section:last-of-type {
    display: none !important;
  }
</style>
  `;
  return html
      .replace('</head>', `${cssFile}</head>`);
}

/**
 * @returns {string}
 */
function main() {
  let result = minify();
  result = typograf(result);
  result = CSSHacks(result);
  result = removeOddHtml(result);
  result = addRelsToExternal(result);
  result = opensearch(result);
  result = ld(result);
  result = pwa(result);

  fs.writeFileSync(outputFile, result);

  return result;
}

return main();
