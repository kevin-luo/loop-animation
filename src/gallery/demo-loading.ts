import './demo-loading.css';

const attached = new WeakSet<HTMLIFrameElement>();

function markReady(frame: HTMLIFrameElement) {
  frame.closest<HTMLElement>('.demo-frame-wrap')?.classList.add('is-loaded');
}

function attach(frame: HTMLIFrameElement) {
  if (attached.has(frame)) return;
  attached.add(frame);
  frame.addEventListener('load', () => markReady(frame), { once: true });

  try {
    if (frame.src && frame.contentDocument?.readyState === 'complete') markReady(frame);
  } catch {
    // The demos are same-origin in production, but the load event remains the fallback.
  }
}

function scan(root: ParentNode = document) {
  root.querySelectorAll<HTMLIFrameElement>('.demo-frame-wrap iframe').forEach(attach);
}

scan();

const app = document.querySelector('#app');
if (app) {
  const observer = new MutationObserver(() => scan(app));
  observer.observe(app, { childList: true, subtree: true });
  window.addEventListener('beforeunload', () => observer.disconnect(), { once: true });
}
