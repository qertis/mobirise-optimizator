# mobirise-optimizator

Remove sponsor link for mobirise web sites.

## Install
```bash
npm -g install https://github.com/qertis/mobirise-optimizator.git
```

## Example
```bash
mobirise-optimizator.js index.html 
    --white-list="gotointeractive.com" 
    --minifier=true 
    --input-dir "./mobirise/" 
    --output-dir "www/"
    --ld-file="static/json-ld.json" 
    --open-search-title="gotois: Search" 
    --open-search-path="//gotointeractive.com/opensearch.xml" 
    --pwa-manifest-path="/manifest.json" 
    --pwa-sw-path="/sw.js" 
    --pwa-install-service-worker-path="/install-service-worker.html" 
```

## Flags

white-list - setup white list anchors

minifier - minimize html tags

input-dir - directory when you save project

output-dir - directory when you public project

ld-file - linked data json file

open-search-title - open search title

open-search-path - path for open search xml manifest

pwa-manifest-path - path for pwa manifest

pwa-sw-path - path for sw pwa

pwa-install-service-worker-path - path for pwa worker