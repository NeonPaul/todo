import url from 'url';
import path from 'path';
import paths from './src/assets'

export function resolve(specifier, parentModuleUrl, defaultResolve) {
  if(/\.css$/.test(specifier)) {
    return {
      url: new url.URL(specifier, parentModuleUrl).pathname,
      format: 'dynamic'
    }
  }

  return defaultResolve(specifier, parentModuleUrl)
}

export function dynamicInstantiate(url) {
  return {
    exports: ['default'],
    execute: exports => {
      exports.default.set(paths.toUrl(url))
    }
  }
}