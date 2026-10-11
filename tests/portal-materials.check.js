async page => {
  const origin = 'http://127.0.0.1:8770';
  const results = [];
  const assert = (value, message) => { if (!value) throw Error(message); };
  for (const [width, height] of [[1600, 1000], [1280, 720], [375, 812]]) {
    const context = await page.context().browser().newContext({ viewport: { width, height } });
    if (origin.startsWith('http://127.0.0.1')) await context.route('https://www.scansci.com/api/**', route => route.fulfill({ contentType: 'application/json', body: '{"user":null,"favorites":[],"stats":{}}' }));
    const check = await context.newPage();
    const errors = [];
    check.on('pageerror', error => errors.push(error.message));
    const cards = check.locator('#toolGrid .tool-card');
    const materialNav = check.locator('#portalNavigation [data-view="materials"]');
    const assertOnline = async () => {
      await check.locator('article[data-app-id="scansci-reader"]').waitFor();
      assert(await check.locator('article[data-app-id="scansci-logos"], article[data-app-id="scansci-symbols"]').count() === 0, 'Materials remain in online tools');
      const total = await cards.count();
      assert(await check.locator('#toolCount').innerText() === `共 ${total} / ${total} 个在线轻工具`, 'Online count includes materials');
      assert(await check.locator('article[data-app-id="scansci-reader"] .tool-card__status').innerText() === 'NEW', 'Reader lost its NEW badge');
    };
    const assertMaterials = async () => {
      await check.locator('article[data-app-id="scansci-logos"]').waitFor();
      assert(JSON.stringify(await cards.evaluateAll(elements => elements.map(el => el.dataset.appId).sort())) === JSON.stringify(['scansci-logos', 'scansci-symbols']), 'The material library must contain exactly the two libraries');
      assert(await materialNav.getAttribute('aria-current') === 'page', 'Materials navigation is not selected');
      assert(await check.title() === '素材库 | ScanSci', 'Material page title is incorrect');
      assert(await check.locator('#toolCount').innerText() === '共 2 / 2 个素材库', 'Material count is incorrect');
      assert(await check.getByRole('heading', { name: '素材库', exact: true }).isVisible(), 'Material heading is missing');
      assert(await check.locator('.stats-inline').isHidden() && await check.locator('.miniprogram-notice').isHidden(), 'Home announcements remain in the material library');
      assert(await check.locator('article[data-app-id="scansci-logos"] .tool-card__status').innerText() === 'NEW', 'Logo lost its NEW badge');
      for (const [id, path] of [['scansci-logos', '/logos/'], ['scansci-symbols', '/symbols/']]) {
        const card = check.locator(`article[data-app-id="${id}"]`);
        assert(new URL(await card.locator('a').first().getAttribute('href')).pathname === path, 'Library destination changed: ' + id);
        await card.locator('img').evaluate(img => img.decode());
      }
      assert(!await check.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Material page overflows horizontally');
    };
    try {
      await check.goto(origin + '/', { waitUntil: 'domcontentloaded' });
      await assertOnline();
      assert(await materialNav.locator('svg.lucide-images').count() === 1, 'Materials must use the Lucide Images icon');
      await materialNav.focus();
      await materialNav.press('Enter');
      assert(new URL(check.url()).hash === '#materials', 'Materials navigation changed the wrong URL');
      await assertMaterials();
      await check.goBack();
      await assertOnline();
      await check.goForward();
      await assertMaterials();
      await check.getByRole('button', { name: '折叠侧边栏', exact: true }).click();
      assert(await check.locator('#sidebarToggle').getAttribute('aria-expanded') === 'false', 'Sidebar did not collapse');
      if (width > 760) {
        await check.getByRole('link', { name: '在线轻工具', exact: true }).click();
        await assertOnline();
        await materialNav.click();
        await assertMaterials();
      }
      await check.reload({ waitUntil: 'domcontentloaded' });
      await assertMaterials();
      assert(await check.locator('#sidebarToggle').getAttribute('aria-expanded') === 'false', 'Refresh lost the collapsed sidebar');
      await check.getByRole('button', { name: '展开侧边栏', exact: true }).click();
      await check.screenshot({ path: `output/playwright/materials/${origin.startsWith('http:') ? 'local' : 'live'}-${width}.png`, fullPage: true, animations: 'disabled' });
      if (width === 1600) {
        for (const path of ['/easymd/', '/easymd/about/', '/easymd/docs/mcp/', '/easymd/docs/skill/']) {
          const response = await check.request.get(origin + path);
          assert(response.ok() && (await response.text()).includes('data-view="materials"'), 'An EasyMD entry is missing the materials navigation: ' + path);
        }
        await check.getByRole('link', { name: 'EasyMD', exact: true }).click();
        const editor = check.locator('#easymdRoot .cm-content').first();
        await editor.waitFor({ timeout: 45000 });
        await editor.evaluate(el => { window.__materialsEditor = el; });
        await materialNav.click();
        await assertMaterials();
        await check.getByRole('link', { name: 'EasyMD', exact: true }).click();
        await editor.waitFor();
        assert(await editor.evaluate(el => el === window.__materialsEditor), 'Materials navigation remounted EasyMD');
        await materialNav.click();
        await assertMaterials();
      }
      assert(errors.length === 0, 'Browser errors: ' + errors.join('; '));
      results.push({ width, height, libraries: ['科研素材库', 'Logo 库'], route: new URL(check.url()).hash, keyboard: true, history: true, refresh: true, collapsedNavigation: true, errors, passed: true });
    } finally {
      await context.close();
    }
  }
  return results;
}
