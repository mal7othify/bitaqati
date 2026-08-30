/* Google Analytics 4 (gtag.js) bootstrap. The CSP disallows inline scripts,
   so the usual copy-paste snippet can't be embedded; instead the server emits
   a meta tag with the measurement ID and loads this file, which sets up the
   dataLayer and injects the gtag loader itself. */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const id = document.querySelector<HTMLMetaElement>('meta[name="ga-measurement-id"]')?.content;

if (id) {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    /* gtag requires the live Arguments object, not a copied array */
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id);

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

export {};
