// Run with playwright-cli run-code using this file's contents.
async (page) => {
  const tab = await page.context().newPage();
  const checks = [], errors = [], searches = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); checks.push(message); };
  const base = 'http://127.0.0.1:8766/reader/?journal_autocomplete_check=1';
  const rows = {
    PRL: [{ id: 17515, title: 'PHYSICAL REVIEW LETTERS', issn: '0031-9007', eissn: '1079-7114', jcr_quartile: 'Q1' }, { id: 22162, title: 'PATTERN RECOGNITION LETTERS', issn: '0167-8655' }],
    PNAS: [{ id: 12999, title: 'PROCEEDINGS OF THE NATIONAL ACADEMY OF SCIENCES OF THE UNITED STATES OF AMERICA', issn: '0027-8424', eissn: '1091-6490', jcr_quartile: 'Q1' }],
    'Nat Commun': [{ id: 12993, title: 'Nature Communications', issn: '2041-1723', jcr_quartile: 'Q1' }],
  };
  const options = tab.locator('#journal-search-options [role="option"]');
  const menu = tab.locator('#journal-search-menu');
  const input = tab.locator('#search-input');
  const openDirectory = async () => {
    await tab.locator('.sidebar [data-view="journals"]').click();
    await tab.locator('#journal-journals-tab').click();
  };
  const search = async (query, count) => {
    await input.fill(query);
    await tab.waitForFunction(({ query, count }) => state.query === query && loadedJournalSearchQuery === query && !state.loading && document.querySelectorAll('#journal-search-options [role="option"]').length === count, { query, count });
  };
  tab.on('pageerror', error => errors.push(error.message));
  try {
    await tab.addInitScript(() => {
      const entries = { 'allfield-data-source': 'crossref', 'allfield-theme': 'light' };
      Object.defineProperty(window, 'localStorage', { configurable: true, value: { getItem: key => entries[key] ?? null, setItem: (key, value) => { entries[key] = String(value); }, removeItem: key => { delete entries[key]; } } });
    });
    await tab.route('**/api/reader/journals/search?**', async route => {
      const query = new URL(route.request().url()).searchParams.get('q'); searches.push(query);
      if (query === 'SLOW') await new Promise(resolve => setTimeout(resolve, 600));
      if (query === 'FAIL') return route.fulfill({ status: 503, json: { ok: false } });
      const items = Object.hasOwn(rows, query) ? rows[query] : Object.values(rows).flat().filter(item => item.issn === query || item.eissn === query);
      await route.fulfill({ json: { ok: true, items } });
    });
    await tab.route('https://api.crossref.org/**', route => route.fulfill({ json: { message: { items: [], 'total-results': 0 } } }));
    await tab.route('**/api/me', route => route.fulfill({ status: 401, json: { ok: false } }));
    await tab.route('https://fonts.googleapis.com/**', route => route.abort());
    await tab.goto(base, { waitUntil: 'domcontentloaded' });
    await openDirectory();
    await search('PRL', 2);
    assert(await input.getAttribute('role') === 'combobox' && await input.getAttribute('aria-expanded') === 'true', 'journal input exposes an expanded combobox');
    assert((await options.first().innerText()).includes('PHYSICAL REVIEW LETTERS') && (await options.first().innerText()).includes('0031-9007'), 'abbreviation suggests full title and ISSN');
    await tab.screenshot({ path: 'D:/scansci/scansci-portal-repo/.local/reader-autocomplete/desktop.png' });
    await input.press('ArrowDown');
    assert(await input.getAttribute('aria-activedescendant') === 'journal-search-option-0', 'Down selects first candidate');
    await input.press('ArrowDown');
    assert(await options.nth(1).getAttribute('aria-selected') === 'true', 'Down advances candidate');
    await input.press('ArrowUp');
    await input.press('Enter');
    await tab.waitForFunction(() => state.view === 'journal' && !state.loading);
    assert(await tab.locator('#journal-updates-title').innerText() === 'PHYSICAL REVIEW LETTERS' && tab.url().includes('#journal/issn%3A00319007'), 'Enter opens the selected journal update page');
    await openDirectory(); await search('Nat Commun', 1);
    await options.first().click();
    await tab.waitForFunction(() => state.view === 'journal' && !state.loading);
    assert(await tab.locator('#journal-updates-title').innerText() === 'Nature Communications', 'mouse selection opens the suggested journal');
    await openDirectory(); await search('PNAS', 1);
    await input.press('Escape');
    assert(await menu.isHidden() && !tab.url().includes('#journal/'), 'Escape closes suggestions and keeps the directory');
    await input.press('ArrowUp');
    assert(await options.last().getAttribute('aria-selected') === 'true', 'Up reopens and selects the last candidate');
    await tab.mouse.click(300, 10);
    assert(await menu.isHidden(), 'click outside closes suggestions');
    await input.focus();
    assert(await menu.isVisible(), 'refocusing reopens current results');
    await input.press('Tab');
    assert(await menu.isVisible(), 'focus inside search form preserves suggestions');
    await tab.keyboard.press('Tab');
    assert(await menu.isHidden(), 'Tab outside the search closes suggestions');
    await search('PRL', 2);
    await input.fill('');
    await tab.waitForFunction(() => !state.query && !state.loading);
    assert(await menu.isHidden(), 'clearing input closes the menu');
    await input.fill('PRL');
    assert(!((await options.allTextContents()).some(text => text.includes('Nature'))), 'repeated query never displays a different catalogue as suggestions');
    await tab.waitForFunction(() => document.querySelectorAll('#journal-search-options [role="option"]').length === 2);
    await input.fill('SLOW');
    await tab.waitForFunction(() => state.query === 'SLOW' && state.loading);
    assert((await tab.locator('#journal-search-status').innerText()).includes('联想'), 'pending search displays a loading message');
    await search('PNAS', 1);
    await tab.waitForTimeout(650);
    assert((await options.first().innerText()).includes('NATIONAL ACADEMY'), 'late previous response cannot replace the current query');
    await search('UNKNOWN', 0);
    assert((await tab.locator('#journal-search-status').innerText()).includes('未找到'), 'empty results explain how to refine the query');
    await search('constructor', 0);
    assert(searches.includes('constructor'), 'reserved object names remain ordinary search text');
    await input.fill('FAIL'); await tab.waitForFunction(() => Boolean(state.error) && !state.loading);
    assert((await tab.locator('#journal-search-status').innerText()).includes('暂时不可用'), 'API failures display a retryable error');
    await search('PRL', 2);
    const beforeIME = searches.length;
    await input.dispatchEvent('compositionstart');
    await input.evaluate(element => { element.value = '中文'; element.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true })); });
    await tab.waitForTimeout(240);
    assert(searches.length === beforeIME && await menu.isHidden(), 'IME composition does not submit partial text');
    await input.dispatchEvent('compositionend');
    await tab.waitForFunction(() => loadedJournalSearchQuery === '中文' && !state.loading);
    assert(searches.includes('中文'), 'IME completion searches the committed text');
    await tab.evaluate(journal => {
      followedJournals.add('issn:00319007');
      followedJournalRecords.set('issn:00319007', { id: 'issn:00319007', name: journal.title, issn: [journal.issn], field: '', publisher: '' });
      render();
    }, rows.PRL[0]);
    await input.press('Escape');
    await tab.locator('#journal-followed-tab').click();
    await search('PRL', 1);
    assert(await tab.locator('.journal-card').count() === 1 && (await options.first().innerText()).includes('PHYSICAL REVIEW'), 'subscribed search uses abbreviations and limits suggestions to subscriptions');
    await tab.evaluate(() => document.documentElement.dataset.theme = 'dark');
    assert(await menu.evaluate(element => getComputedStyle(element).backgroundColor) === 'rgb(27, 34, 29)', 'dropdown follows the dark theme');
    await tab.screenshot({ path: 'D:/scansci/scansci-portal-repo/.local/reader-autocomplete/dark.png' });
    await tab.setViewportSize({ width: 390, height: 844 });
    await tab.evaluate(() => document.documentElement.dataset.theme = 'light');
    await input.focus();
    const bounds = await menu.boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= 390, 'mobile suggestions fit within the viewport');
    assert(await tab.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile page has no horizontal overflow');
    await tab.screenshot({ path: 'D:/scansci/scansci-portal-repo/.local/reader-autocomplete/mobile.png' });
    const touch = await tab.context().newCDPSession(tab);
    await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    const optionBounds = await options.first().boundingBox();
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 0, x: optionBounds.x + optionBounds.width / 2, y: optionBounds.y + optionBounds.height / 2 }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.detach();
    await tab.waitForFunction(() => state.view === 'journal' && !state.loading);
    assert(await tab.locator('#journal-updates-title').innerText() === 'PHYSICAL REVIEW LETTERS', 'touch selection opens the correct journal');
    await tab.evaluate(() => switchView('papers'));
    assert(await menu.isHidden() && await input.getAttribute('role') === null, 'other Reader views retain their ordinary search input');
    assert(errors.length === 0, 'no page JavaScript errors');
    return { passed: checks.length, checks, searches };
  } catch (error) {
    await tab.screenshot({ path: 'D:/scansci/scansci-portal-repo/.local/reader-autocomplete/failure.png' });
    throw new Error(`${error.message}; completed=${checks.length}; errors=${JSON.stringify(errors)}`);
  } finally { await tab.close(); }
}
