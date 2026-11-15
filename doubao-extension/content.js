// 豆包会话批量勾选 - 扩展内容脚本（content script）
// 由浏览器扩展机制注入，运行在隔离环境，不受豆包页面 CSP 限制。
(function () {
  'use strict';

  const log = (...a) => console.log('[豆包助手]', ...a);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // 选豆包 Semi 勾选框：select-mode 内的 input，真实状态在 aria-checked
  function findBoxes() {
    return document.querySelectorAll(
      '[data-attr="select-mode"] input.semi-checkbox-input,' +
      '[data-attr="select-mode"] input[type="checkbox"],' +
      'input.semi-checkbox-input,input[type="checkbox"][aria-checked]'
    );
  }

  // 找到可滚动的容器（用于把长列表滚到底加载更多）
  function findScrollEl() {
    const hints = [
      '[data-attr="select-mode"]',
      '[class*="conversation" i]',
      '[class*="chat" i]',
      '[class*="list" i]',
      '[class*="scroll" i]',
    ];
    for (const h of hints) {
      const el = document.querySelector(h);
      if (el && el.scrollHeight > el.clientHeight + 50) return el;
    }
    return document.scrollingElement || document.documentElement || document.body;
  }

  // 勾选一轮：返回扫描数和本次新勾选数
  function checkAll() {
    const boxes = findBoxes();
    let total = 0, done = 0;
    boxes.forEach((el) => {
      total++;
      const aria = el.getAttribute('aria-checked');
      const unchecked = aria !== null ? aria !== 'true' : !el.checked;
      if (!unchecked) return; // 已勾选则跳过
      const target = el.tagName === 'INPUT' ? (el.closest('.semi-checkbox') || el) : el;
      try { target.click(); }
      catch (e) {
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      }
      done++;
    });
    log(`扫描 ${total} 个勾选框，本次新勾选 ${done} 个`);
    return total;
  }

  let running = false;
  async function run() {
    if (running) return;
    running = true;
    log('开始批量勾选…');
    const scrollEl = findScrollEl();
    let prev = -1, same = 0, guard = 0;
    while (guard++ < 400) {
      const t = checkAll();
      const before = scrollEl.scrollHeight;
      scrollEl.scrollTop = scrollEl.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(400);
      const t2 = checkAll();
      if (t2 === prev) { if (++same >= 2) break; } else { same = 0; }
      prev = t2;
      if (scrollEl.scrollHeight <= before && t2 > 0 && same >= 1) break;
    }
    checkAll();
    log('完成 ✅ 请手动点「删除」按钮');
    running = false;
  }

  // 右下角角标（点一下手动全选）
  let badge = null;
  function renderBadge() {
    if (!badge) {
      badge = document.createElement('div');
      badge.style.cssText =
        'position:fixed;right:12px;bottom:12px;z-index:2147483647;background:#07c160;color:#fff;' +
        'padding:6px 10px;border-radius:8px;font:13px/1.4 -apple-system,"PingFang SC",sans-serif;' +
        'box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer;user-select:none;';
      badge.addEventListener('click', () => run());
      (document.body || document.documentElement).appendChild(badge);
    }
    badge.textContent = '豆包自动勾选：点我全选';
  }

  // 出现勾选框就自动勾选（MutationObserver 实时 + 定时兜底）
  const observer = new MutationObserver(() => {
    if (findBoxes().length) run();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(() => { if (findBoxes().length) run(); }, 1500);

  // 接收扩展图标按钮的手动触发
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.action === 'run') run();
    });
  }

  renderBadge();
  log('已加载。进入会话「选择模式」将自动勾选；也可点右下角角标或扩展图标按钮手动触发。');
})();
