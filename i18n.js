(function () {
  const routesElement = document.getElementById('language-urls');
  if (!routesElement) return;
  const routes = JSON.parse(routesElement.textContent);
  const switcher = document.querySelector('[data-lang-switcher]');
  const aliases = { zh: 'zh-CN', 'zh-cn': 'zh-CN', 'zh-hans': 'zh-CN', 'zh-tw': 'zh-TW', 'zh-hant': 'zh-TW', en: 'en' };
  const requested = new URLSearchParams(location.search).get('lang');
  const normalized = requested && (aliases[requested.toLowerCase()] || Object.keys(routes).find(lang=>lang.toLowerCase()===requested.toLowerCase()));
  // Compatibility with old ?lang= links. Content and canonical are now rendered
  // into physical locale pages; browser language and storage do not rewrite them.
  if (normalized && routes[normalized]) {
    const destination = new URL(routes[normalized], location.href);
    destination.hash = location.hash;
    location.replace(destination.href);
    return;
  }
  if (switcher) switcher.addEventListener('change', () => {
    const route = routes[switcher.value];
    if (!route) return;
    const destination = new URL(route, location.href);
    destination.hash = location.hash;
    location.assign(destination.href);
  });
})();
