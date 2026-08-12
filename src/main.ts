import './site.css';

const params = new URLSearchParams(window.location.search);
const demo = params.get('demo');
const embedded = params.get('embed') === '1';
const exporting = params.get('export') === '1';

if (embedded) document.documentElement.dataset.embed = '1';
if (exporting) document.documentElement.dataset.export = '1';

const demoLoaders: Record<string, () => Promise<unknown>> = {
  eclipse: () => import('./examples/eclipse/studio'),
  water: () => import('./examples/water/main'),
  'water-v2': () => import('./examples/water-v2/main'),
  dns: () => import('./examples/dns/main'),
  binary: () => import('./examples/binary/main'),
};

async function boot() {
  if (!demo) {
    await import('./gallery/studio');
    return;
  }

  const load = demoLoaders[demo];
  if (!load) {
    document.body.innerHTML = `<main class="route-error"><h1>Demo not found</h1><a href="./">Back to gallery</a></main>`;
    return;
  }

  await load();

  if (embedded) {
    requestAnimationFrame(() => {
      window.__LOOP_ANIMATION__?.play();
    });
  }
}

boot().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<main class="route-error"><h1>Failed to load demo</h1><pre>${String(error)}</pre></main>`;
});
