
export const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

export const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
];

export const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href', 'title'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'p': ['class'],
  'span': ['class']
};
