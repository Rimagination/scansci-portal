import { mountEasyMD as mount } from "/easymd/native/assets/scansci-CCWgnyKk.js";
const styles = ["/easymd/native/assets/scansci-entry-DDrX8oAq.css"];
export async function mountEasyMD(element) {
  await Promise.all(styles.map(href => new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = () => { link.remove(); reject(new Error('Editor stylesheet failed to load')); };
    document.head.insertBefore(link, document.querySelector('link[href^="/styles.css"]'));
  })));
  mount(element);
}
