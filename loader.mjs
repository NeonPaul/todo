import url from 'url';
import path from 'path';

export function resolve(specifier, parentModuleUrl, defaultResolve) {
  const nmTest = /^\/~\//

  if(nmTest.test(specifier)) {
    return defaultResolve(specifier.replace(nmTest, ''))
  }

  return defaultResolve(specifier, parentModuleUrl)
}