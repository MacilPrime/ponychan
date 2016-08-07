/* @flow */

export default function pageHasFocus() {
  if (document.hasFocus)
    return document.hasFocus();
  if (document.visibilityState)
    return document.visibilityState == 'visible';
  return true;
}
