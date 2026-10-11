async (page) => {
  const origin = 'http://127.0.0.1:8768';
  const reports = [];
  for (const [width, height] of [[1600, 1000], [1280, 720], [375, 812]]) {
    const context = await page.context().browser().newContext({ viewport: { width, height } });
    if (origin.startsWith('http://127.0.0.1')) await context.route('https://www.scansci.com/api/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ user: null, favorites: [], stats: {} }) }));
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
    const check = await context.newPage();
    const errors = [];
    check.on('pageerror', error => errors.push(error.message));
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    try {
      await check.goto(origin + '/', { waitUntil: 'domcontentloaded' });
      await check.locator('.tool-card').first().waitFor();
      assert(await check.locator('#easymdRoot .cm-content').count() === 0, 'Home eagerly loaded the editor');
      assert(await check.locator('.sidebar-nav-item[aria-label="Logo 库"]').count() === 0, 'Logo remains in the sidebar');
      assert(await check.locator('article[data-app-id="scansci-logos"]').count() === 0, 'Logo remains in online tools');
      await check.getByRole('link', { name: '素材库', exact: true }).click();
      assert(await check.locator('article[data-app-id="scansci-logos"] .tool-card__status').innerText() === 'NEW', 'Logo card is missing its NEW badge');
      assert(await check.locator('.tool-card').count() === 2, 'The material library must contain both libraries');
      await check.getByRole('link', { name: '在线轻工具', exact: true }).click();
      await check.getByRole('link', { name: 'EasyMD', exact: true }).click();
      assert(new URL(check.url()).pathname === '/easymd/', 'EasyMD did not use its own path');
      assert(await check.locator('.main-head').isHidden() && await check.locator('.miniprogram-notice').isHidden(), 'Home controls remain in the editor');
      const editor = check.locator('#easymdRoot');
      const button = name => editor.getByRole('button', { name, exact: true }).filter({ visible: true }).first();
      const input = editor.locator('.cm-content:visible').first();
      await input.waitFor({ timeout: 45000 });
      const headerTools = name => check.locator('.easymd-head').getByRole('button', { name, exact: true }).filter({ visible: true });
      const tools = headerTools('打开组件工具');
      assert(await tools.count() === 1, 'The title must have one visible component toggle');
      const toolsBox = await tools.boundingBox();
      const titleBox = await check.locator('.easymd-head h1').boundingBox();
      assert(toolsBox.x + toolsBox.width <= titleBox.x && Math.abs((toolsBox.y + toolsBox.height / 2) - (titleBox.y + titleBox.height / 2)) < 2, 'Component toggle is not directly before the EasyMD title');
      assert(await tools.getAttribute('aria-expanded') === 'false', 'Component button has no closed state');
      assert(await tools.locator('svg.lucide-shapes').count() === 1, 'Component button is not the Lucide Shapes design icon');
      assert(check.frames().every(frame => frame === check.mainFrame() || frame.url() === 'about:srcdoc'), 'Editor is hosted in an external frame');
      assert(await check.locator('#sidebarToggle svg:visible').count() === 1, 'Sidebar toggle shows overlapping icons');
      await button('新建文件').click();
      await input.fill('# ScanSci 接入检查\n\n编辑与预览保持同步。');
      await input.press('ControlOrMeta+End');
      await input.press('Enter');
      await input.pressSequentially('草稿保留检查');
      if (width >= 1024) {
        const panels = editor.locator('[data-slot="resizable-panel"]:visible');
        const contentBox = await input.boundingBox();
        const rootBox = await editor.boundingBox();
        assert(await panels.count() === 2, 'Collapsed component tools still occupy a panel');
        assert(Math.abs((await panels.first().boundingBox()).x - rootBox.x) <= 1, 'An empty component rail remains beside the editor');
        await input.evaluate(element => { window.__toolsEditorContent = element; });
        await tools.click();
        assert(await headerTools('收起组件工具').getAttribute('aria-expanded') === 'true', 'Component tools did not open');
        assert(await panels.count() === 3, 'The component library did not expand');
        assert(await input.evaluate(element => element === window.__toolsEditorContent), 'Opening components remounted the editor');
        assert((await input.boundingBox()).width < contentBox.width, 'Opening the component library did not allocate its width');
        await check.getByRole('button', { name: '插入居中短线标题', exact: true }).click();
        assert((await input.innerText()).includes('居中短线标题'), 'Selecting a component did not insert content');
        const inserted = await input.innerText();
        assert(inserted.indexOf('居中短线标题') > inserted.indexOf('草稿保留检查'), 'Opening component tools lost the editor cursor');
        await headerTools('收起组件工具').click();
        assert(await panels.count() === 2, 'Closing components did not release the column');
        assert(await input.evaluate(element => element === window.__toolsEditorContent), 'Closing components remounted the editor');
        assert(Math.abs((await panels.first().boundingBox()).x - rootBox.x) <= 1, 'Closing tools left an empty rail');
      } else {
        await tools.click();
        assert(await headerTools('收起组件工具').getAttribute('aria-expanded') === 'true', 'Mobile header tools did not open');
        await check.getByRole('button', { name: '插入居中短线标题', exact: true }).click();
        await headerTools('打开组件工具').waitFor();
      }
      const draft = await input.innerText();
      assert(draft.includes('草稿保留检查'), 'The native editor cannot edit');
      if (width < 1024) await button('预览').click();
      await check.locator('iframe[title="Markdown 预览"]:visible').waitFor({timeout:12000});
      await check.frameLocator('iframe[title="Markdown 预览"]:visible').getByText('ScanSci 接入检查', { exact: true }).waitFor({ timeout: 12000 });
      if (width < 1024) await button('编辑').click();
      if (width === 1600) {
        await button('导出 HTML').click();
        await check.waitForFunction(async () => (await navigator.clipboard.readText()).includes('ScanSci 接入检查'), null, { timeout: 12000 });
        const downloadPromise = check.waitForEvent('download');
        await button('导出 Markdown').click();
        await (await downloadPromise).saveAs('.local/portal-tools/editor-export.md');
      }
      if (width === 1600 || width === 375) {
        if (width < 1024) await button('预览').click();
        const exportIcon = await button('导出到微信').locator('svg').innerHTML();
        const sendIcon = await button('发送到公众号').locator('svg').innerHTML();
        assert(exportIcon !== sendIcon, 'WeChat export and sending reuse the same icon');
        await button('导出到微信').click();
        await check.waitForFunction(async () => (await navigator.clipboard.readText()).includes('ScanSci 接入检查'), null, { timeout: 12000 });
        await button('发送到公众号').click();
        const dialog = check.getByRole('dialog');
        await dialog.getByText('导出到微信公众号', { exact: true }).waitFor({ timeout: 12000 });
        const copy = dialog.getByRole('button', { name: '复制排版', exact: true });
        await copy.click();
        await dialog.getByRole('button', { name: '已复制 · 再次复制', exact: true }).waitFor();
        await check.waitForFunction(async () => (await navigator.clipboard.readText()).includes('ScanSci 接入检查'));
        const accountLink = dialog.getByRole('link', { name: '打开公众号后台 ↗', exact: true });
        assert(await accountLink.getAttribute('href') === 'https://mp.weixin.qq.com/', 'The WeChat account link is incorrect');
        if (width === 1600) {
          const popupPromise = check.waitForEvent('popup');
          await accountLink.click();
          const popup = await popupPromise;
          await popup.waitForURL(url => url.origin === 'https://mp.weixin.qq.com', { timeout: 10000 });
          await popup.close();
          await check.bringToFront();
        }
        await check.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        if (width < 1024) await button('编辑').click();
      }
      const before = await check.locator('#easymdRoot').boundingBox();
      await check.getByRole('button', { name: '折叠侧边栏', exact: true }).click();
      await check.waitForFunction(() => document.documentElement.classList.contains('is-sidebar-collapsed'));
      await check.waitForTimeout(220);
      const after = await check.locator('#easymdRoot').boundingBox();
      assert(await check.locator('#sidebarToggle').getAttribute('aria-expanded') === 'false', 'The collapse state is inaccessible');
      assert(await check.locator('#sidebarToggle svg:visible').count() === 1, 'Collapse toggle shows both icons');
      if (width > 760) {
        assert(after.width > before.width + 170, 'Collapsing the sidebar did not widen the editor');
        assert(after.x >= 72 && after.x < 96, 'Collapsed workspace is displaced');
      } else {
        assert(after.height > before.height, 'Mobile collapse did not free editing space');
      }
      assert(after.x >= 0 && after.x + after.width <= width && after.y + after.height <= height + 1, 'The editor is clipped');
      assert(await input.innerText() === draft, 'Collapsing the sidebar reset the draft');
      await check.screenshot({ path: `.local/portal-tools/native-${width}-${height}.png`, animations: 'disabled' });
      await check.getByRole('button', { name: '展开侧边栏', exact: true }).click();
      await check.getByRole('link', { name: '在线轻工具', exact: true }).click();
      assert(await check.locator('#easymdView').isHidden(), 'Editor stayed visible on the home page');
      await check.goBack();
      assert(await input.innerText() === draft, 'Returning from the directory reset the draft');
      await check.reload({ waitUntil: 'domcontentloaded' });
      await input.waitFor({ timeout: 45000 });
      assert(new URL(check.url()).pathname === '/easymd/', 'Refreshing the direct URL failed');
      await check.waitForFunction(() => document.querySelector('#easymdRoot .cm-content')?.textContent?.includes('草稿保留检查'), null, { timeout: 12000 });
      assert((await input.innerText()).includes('草稿保留检查'), 'Saved editor draft did not survive a refresh');
      await check.getByRole('button', { name: '折叠侧边栏', exact: true }).click();
      await check.reload({ waitUntil: 'domcontentloaded' });
      assert(await check.locator('#sidebarToggle').getAttribute('aria-expanded') === 'false', 'Collapse preference was not restored');
      await check.getByRole('button', { name: '展开侧边栏', exact: true }).click();
      await check.getByRole('link', { name: '开源工具', exact: true }).click();
      assert(await check.locator('#openSourceView').isVisible() && await check.locator('#easymdView').isHidden(), 'The open-source route regressed');
      await check.getByRole('link', { name: '在线轻工具', exact: true }).click();
      await check.locator('#guestLoginBtn').waitFor();
      await check.locator('#guestLoginBtn').click();
      await check.getByRole('dialog', { name: '登录 / 注册' }).waitFor();
      await check.getByRole('button', { name: '关闭登录窗口' }).click();
      const overflow = await check.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert(!overflow, 'Portal overflows horizontally');
      assert(errors.length === 0, 'Uncaught browser errors: ' + errors.join('; '));
      reports.push({ width, height, before, after, errors, passed: true });
    } catch (error) {
      await check.screenshot({ path: `.local/portal-tools/native-failure-${width}-${height}.png`, animations: 'disabled' });
      throw error;
    } finally {
      await context.close();
    }
  }
  return reports;
}
