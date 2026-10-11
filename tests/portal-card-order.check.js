async page => {
  const origin = 'http://127.0.0.1:8770';
  const fixture = 'http://127.0.0.1:8782';
  const browser = page.context().browser();
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const results = [];
  for (const [width, height] of [[1600, 1000], [1280, 720], [375, 812]]) {
    await page.request.post(fixture + '/__reset');
    let user = 1;
    let failNext = false;
    let holdNext = false;
    let held = false;
    let release;
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width === 375, isMobile: width === 375 });
    const bridge = async (route, account) => {
      const request = route.request();
      const url = new URL(request.url());
      const response = await context.request.fetch(fixture + url.pathname + url.search, {
        method: request.method(), headers: { 'X-Test-User': String(account) },
        ...(request.postData() ? { data: request.postData() } : {})
      });
      await route.fulfill({ status: response.status(), contentType: 'application/json', body: await response.body() });
    };
    await context.route('https://www.scansci.com/api/**', async route => {
      if (route.request().url().endsWith('/me/card-order')) {
        if (failNext) {
          failNext = false;
          await route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false}' });
          return;
        }
        if (holdNext) {
          holdNext = false;
          held = true;
          await new Promise(resolve => { release = resolve; });
        }
      }
      await bridge(route, user);
      if (route.request().url().endsWith('/auth/logout')) user = 0;
    });
    const check = await context.newPage();
    const errors = [];
    let stage = 'initial';
    check.on('pageerror', error => errors.push(error.message));
    const gridFor = section => section === 'open-source' ? '#openSourceView .open-source-grid' : '#toolGrid';
    const ids = async section => check.locator(gridFor(section)).evaluate(el => [...el.children].map(card => card.dataset.appId));
    const saved = async () => check.waitForFunction(() => {
      const status = document.getElementById('cardOrderStatus');
      return !status.hidden && status.textContent === '卡片顺序已保存到账号';
    });
    const load = async section => {
      stage = 'load ' + section;
      await check.goto(origin + '/#' + (section === 'online' ? 'online-tools' : section));
      await check.waitForFunction(() => document.getElementById('userName').textContent === '本地投稿者');
      await check.locator(gridFor(section) + ' .card-order-handle').first().waitFor();
    };
    const stored = async account => (await (await context.request.get(fixture + '/api/me', { headers: { 'X-Test-User': String(account) } })).json()).card_orders;
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const dragFirstAfterSecond = async section => {
      stage = 'drag ' + section;
      const grid = check.locator(gridFor(section));
      const before = await ids(section);
      const source = grid.locator(width === 1600 && section === 'online' ? '.tool-card__link' : '.card-order-handle').first();
      await source.scrollIntoViewIfNeeded();
      const from = await source.boundingBox();
      const target = grid.locator('.tool-card, .open-source-card').nth(1);
      const x = from.x + from.width / 2;
      const y = from.y + from.height / 2;
      if (width === 375) {
        const cdp = await context.newCDPSession(check);
        const touch = (type, tx, ty) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: tx, y: ty, id: 1 }] });
        await touch('touchStart', x, y);
        await touch('touchMove', x + 12, y + 12);
        let rect = await target.boundingBox();
        if (rect.y + rect.height / 2 > height - 120) {
          const scroll = await check.evaluate(() => scrollY);
          await touch('touchMove', x, height - 20);
          await check.waitForFunction(start => scrollY > start + 40, scroll);
          for (let i = 0; i < 45; i++) {
            rect = await target.boundingBox();
            if (rect.y + rect.height / 2 < height - 120) break;
            await check.waitForTimeout(50);
          }
          assert(rect.y + rect.height / 2 < height - 100, 'Touch dragging did not auto-scroll to the next card');
        }
        rect = await target.boundingBox();
        await touch('touchMove', rect.x + rect.width / 2, rect.y + rect.height / 2 + 30);
        await touch('touchEnd');
        await cdp.detach();
      } else {
        const rect = await target.boundingBox();
        await check.mouse.move(x, y);
        await check.mouse.down();
        await check.mouse.move(rect.x + rect.width - 24, rect.y + rect.height / 2, { steps: 8 });
        await check.mouse.up();
      }
      await saved();
      const after = await ids(section);
      assert(after[0] === before[1] && after[1] === before[0], section + ' did not reorder after real pointer input');
      assert(same((await stored(1))[section], after), section + ' UI and account database differ');
      assert(!await check.locator('.card-drag-preview').count(), 'Drag left a ghost behind');
      assert(new URL(check.url()).origin === origin, 'Dragging opened a tool link');
      return after;
    };
    try {
      await load('online');
      const defaults = { online: await ids('online') };
      assert(await check.locator('#toolGrid .card-order-handle').count() === defaults.online.length, 'A tool is missing its sorting control');
      assert(await check.locator('[data-app-id="scansci-reader"] .tool-card__status').innerText() === 'NEW', 'Reader lost NEW');
      const firstCard = check.locator('#toolGrid > .tool-card').first();
      const cardRect = await firstCard.boundingBox();
      const gripRect = await firstCard.locator('.card-order-handle').boundingBox();
      assert(gripRect.width <= 24 && Math.abs(cardRect.y + cardRect.height - gripRect.y - gripRect.height - 10) < 2, 'Sorting control is not small and at the card bottom');
      if (width === 1600) {
        await context.route('https://reader.scansci.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Normal tool click</title>' }));
        await firstCard.locator('.tool-card__title-link').click();
        await check.waitForURL('https://reader.scansci.com/');
        await load('online');
      }
      const online = await dragFirstAfterSecond('online');
      await check.reload();
      await check.waitForFunction(() => document.getElementById('userName').textContent === '本地投稿者');
      assert(same(await ids('online'), online), 'Refresh lost the account order');
      await load('materials');
      defaults.materials = await ids('materials');
      assert(await check.locator('[data-app-id="scansci-logos"] .tool-card__status').innerText() === 'NEW', 'Logo lost NEW');
      const materials = await dragFirstAfterSecond('materials');
      await check.screenshot({ path: `output/playwright/card-order/materials-${width}.png`, fullPage: true, animations: 'disabled' });
      await load('open-source');
      defaults['open-source'] = await ids('open-source');
      const openSourceId = defaults['open-source'][0];
      await check.locator(`[data-card-move="${openSourceId}"]`).press('End');
      await saved();
      assert((await ids('open-source')).at(-1) === openSourceId, 'Open-source keyboard sort did not move to the end');
      assert(same((await stored(1))['open-source'], await ids('open-source')), 'Open-source order was not persisted');
      assert(!await check.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Cards overflow the page');
      stage = 'account menu';
      assert(await check.locator('#logoutBtn').isHidden(), 'Logout remains permanently visible');
      await check.locator('#userAccountBtn').click();
      await check.locator('#logoutBtn').waitFor();
      assert(await check.locator('#userAccountBtn').getAttribute('aria-expanded') === 'true', 'Avatar did not open the account options');
      const menu = await check.locator('#userAccountMenu').boundingBox();
      assert(menu.x >= 0 && menu.y >= 0 && menu.x + menu.width <= width && menu.y + menu.height <= height, 'Account options overflow the viewport');
      await check.locator('#logoutBtn').press('Escape');
      await check.locator('#logoutBtn').waitFor({ state: 'hidden' });
      if (width === 1600) {
        await load('online');
        stage = 'rapid saves and retry';
        const id = online[0];
        holdNext = true;
        await check.locator(`[data-card-move="${id}"]`).press('End');
        for (let i = 0; !held && i < 50; i++) await check.waitForTimeout(20);
        assert(held, 'Slow save was not exercised');
        await check.locator(`[data-card-move="${id}"]`).press('Home');
        release();
        await saved();
        assert(same((await stored(1)).online, await ids('online')), 'Rapid moves saved an older order');
        failNext = true;
        await check.locator(`[data-card-move="${id}"]`).press('End');
        await check.getByRole('button', { name: '重新保存', exact: true }).waitFor();
        assert((await check.locator('#cardOrderStatus').innerText()).includes('暂未保存'), 'Save failure was hidden');
        await check.getByRole('button', { name: '重新保存', exact: true }).click();
        await saved();
        assert(same((await stored(1)).online, await ids('online')), 'Retry did not persist the pending order');
        const expected = await stored(1);
        for (const account of [1, 2]) {
          const other = await browser.newContext({ viewport: { width, height } });
          await other.route('https://www.scansci.com/api/**', route => bridge(route, account));
          const device = await other.newPage();
          for (const section of ['online', 'materials', 'open-source']) {
            await device.goto(origin + '/#' + (section === 'online' ? 'online-tools' : section));
            await device.waitForFunction(name => document.getElementById('userName').textContent === name, account === 1 ? '本地投稿者' : '本地审核员');
            const actual = await device.locator(gridFor(section)).evaluate(el => [...el.children].map(card => card.dataset.appId));
            assert(same(actual, account === 1 ? expected[section] : defaults[section]), `Account ${account} order mismatch in ${section}`);
          }
          await other.close();
        }
        await load('open-source');
        assert(await check.locator('#logoutBtn').isHidden(), 'Logout remains permanently visible');
        await check.locator('#userAccountBtn').click();
        await check.locator('#logoutBtn').waitFor();
        assert(await check.locator('#userAccountBtn').getAttribute('aria-expanded') === 'true', 'Avatar did not open the account options');
        await check.locator('#logoutBtn').press('Escape');
        await check.locator('#logoutBtn').waitFor({ state: 'hidden' });
        await check.locator('#userAccountBtn').click();
        await check.locator('#logoutBtn').click();
        await check.locator('#userMiniCard').waitFor({ state: 'hidden' });
        assert(same(await ids('open-source'), defaults['open-source']), 'Logout leaked the previous account order');
        await check.locator('.open-source-grid .card-order-handle').first().click();
        await check.locator('#authModal').waitFor();
      }
      assert(errors.length === 0, 'Browser errors: ' + errors.join('; '));
      results.push({ width, pointer: width === 375 ? 'native touch + auto-scroll' : 'mouse', accountPersistence: true, refresh: true, keyboard: true, ...(width === 1600 ? { accountIsolation: true, freshDevice: true, rapidMoves: true, failureRetry: true, logout: true } : {}), errors, passed: true });
    } catch (error) {
      await check.screenshot({ path: `output/playwright/card-order/failure-${width}.png`, fullPage: true });
      throw Error(`${width}: ${stage}: ${error.message}; status=${await check.locator('#cardOrderStatus').innerText()}; account=${await check.locator('#userName').innerText()}; order=${JSON.stringify(await ids(stage.includes('open-source') ? 'open-source' : 'online'))}`);
    } finally {
      release?.();
      await context.close();
    }
  }
  return results;
}
