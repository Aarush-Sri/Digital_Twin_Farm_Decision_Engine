import '@testing-library/jest-dom';

if (typeof window !== 'undefined' && window.HTMLElement) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}
