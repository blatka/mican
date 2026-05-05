const _ta = typeof document !== 'undefined' ? document.createElement('textarea') : null

// Decodes all HTML entities (&#038;, &#8217;, &amp;, &rsquo;, etc.)
export function decodeHtml(str) {
  if (!str || !_ta) return str ?? ''
  _ta.innerHTML = str
  return _ta.value
}
