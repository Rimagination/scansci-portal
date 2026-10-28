// Run with playwright-cli run-code --filename=model-rank/check_browser.js
// after serving the repository at http://127.0.0.1:8765/.
async page => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:8765/model-rank/', { waitUntil: 'load' });
  check(await page.locator('[data-benchmark]').first().getAttribute('data-benchmark') === 'aa-index', 'Artificial Analysis is not the first benchmark');
  check(await page.locator('[data-benchmark="aa-index"]').getAttribute('aria-pressed') === 'true', 'Artificial Analysis is not selected on load');
  const categories = await page.locator('[data-category]').evaluateAll(nodes => nodes.map(node => node.dataset.category));
  let families = 0, variants = 0;
  for (const category of categories) {
    await page.locator(`[data-category="${category}"]`).click();
    const count = await page.locator('[data-benchmark]').count();
    for (let i = 0; i < count; i++) {
      await page.locator('[data-benchmark]').nth(i).click();
      families++;
      const selected = await page.locator('[data-benchmark][aria-pressed="true"]').getAttribute('data-benchmark');
      if (selected === 'aa-index') {
        if (await page.getByText('数据暂不可用').isVisible()) {
          check((await page.getByRole('link', { name: '查看原始来源 ↗' }).getAttribute('href')).includes('artificialanalysis.ai'), 'Artificial Analysis source link is missing');
        } else {
          check(await page.locator('#rows tr').count() >= 5, 'Artificial Analysis results are incomplete');
        }
        continue;
      }
      const items = await page.locator('[data-variant] option').evaluateAll(nodes => nodes.map(node => node.value));
      for (const item of items.length ? items : [selected]) {
        if (items.length) await page.locator('[data-variant]').selectOption(item);
        const rows = await page.locator('#rows tr').count();
        const contents = await page.locator('#rows').innerText();
        check(rows > 0 && !contents.includes('暂无符合条件') && !contents.includes('NaN'), `${category}/${item} has no usable results`);
        variants++;
      }
    }
  }
  await page.locator('[data-category="visualization"]').click();
  await page.locator('[data-benchmark="chart2code-direct"]').click();
  await page.locator('[data-variant]').selectOption('chart2code-edit');
  const gpt = page.locator('#rows tr').filter({ hasText: 'GPT-5.2' }).first();
  check((await gpt.innerText()).includes('33.03') && (await gpt.innerText()).includes('75.66'), 'Chart2Code paper values changed');
  await page.locator('[data-category="reproduction"]').click();
  for (const name of ['完整复现率', '建模', '执行', '验证']) check(await page.getByRole('columnheader', { name, exact: true }).count(), `PaperBench ${name} is missing`);
  await page.locator('[data-category="writing"]').click();
  check((await page.locator('#rows').innerText()).includes('人类'), 'LitReview Arena human reference is missing');
  await page.locator('[data-benchmark="english-writing"]').click();
  check((await page.locator('#rows tr').count()) >= 100, 'English writing results were truncated');
  await page.locator('[data-category="overall"]').click();
  check(await page.locator('[data-benchmark="aa-index"]').getAttribute('aria-pressed') === 'true', 'Returning to overall did not select Artificial Analysis');
  await page.locator('[data-benchmark="aihot"]').click();
  const missingPrice = page.locator('#rows tr').filter({ hasText: '价格缺失或待核验' }).first();
  if (await missingPrice.count()) {
    await page.locator('#search').fill(await missingPrice.locator('.model-name').innerText());
    check((await page.locator('#rows').innerText()).includes('价格缺失或待核验'), 'AIHOT search lost the missing-price label');
  }
  await page.locator('[data-view="frontier"]').click();
  check(await page.locator('#chart svg').count(), 'AIHOT frontier is missing');
  check((await page.locator('.frontier-summary').innerText()).includes('价格未核验的模型未纳入图表'), 'AIHOT missing price is not excluded from frontier');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-category="visualization"]').click();
  await page.locator('[data-variant]').selectOption('figcode-r');
  check((await page.locator('#rows tr').count()) === 24, 'FigCode R results are missing');
  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }));
  check(dimensions.content <= dimensions.viewport, `Mobile page overflows: ${JSON.stringify(dimensions)}`);
  check(errors.length === 0, `Browser errors: ${errors.join('; ')}`);
  return { categories: categories.length, families, variants, errors, dimensions };
}
