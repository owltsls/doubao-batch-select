// ============================================================
//  豆包会话批量勾选 —— 控制台版（无需油猴，绕过 CSP）
//  用法：打开豆包会话 → 进入「选择模式」→ F12 打开 Console
//        → 把下面整段代码粘贴进去 → 回车执行
//  执行后会自动勾选全部、并向下滚动加载长列表；
//  全部勾好后，你手动点「删除」即可。
//  若个别漏勾，控制台里再输入  doubaoCheck()  回车重跑一次。
// ============================================================

(async () => {
  'use strict';

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // 选豆包 Semi 勾选框：select-mode 内的 input，真实状态在 aria-checked
  function findBoxes() {
    return document.querySelectorAll(
      '[data-attr="select-mode"] input.semi-checkbox-input,' +
      '[data-attr="select-mode"] input[type="checkbox"],' +
      'input.semi-checkbox-input,input[type="checkbox"][aria-checked]'
    );
  }

  // 找到一个可滚动的容器（用于把长列表滚到底加载更多）
  function findScrollEl() {
    const hints = ['[data-attr="select-mode"]', '[class*="conversation" i]', '[class*="chat" i]', '[class*="list" i]', '[class*="scroll" i]'];
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
      if (!unchecked) return;
      const target = el.tagName === 'INPUT' ? (el.closest('.semi-checkbox') || el) : el;
      try { target.click(); }
      catch (e) { target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); }
      done++;
    });
    console.log(`[豆包助手] 扫描 ${total} 个勾选框，本次新勾选 ${done} 个`);
    return total;
  }

  // 自动滚动加载 + 反复勾选，直到没有新增
  async function run() {
    console.log('[豆包助手] 开始批量勾选…');
    const scrollEl = findScrollEl();
    let prev = -1, same = 0, guard = 0;
    while (guard++ < 400) {
      const t = checkAll();
      // 滚到底加载更多
      const before = scrollEl.scrollHeight;
      scrollEl.scrollTop = scrollEl.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(400);
      const t2 = checkAll();
      if (t2 === prev) { if (++same >= 2) break; } else { same = 0; }
      prev = t2;
      if (scrollEl.scrollHeight <= before && t2 > 0) { if (same >= 1) break; }
    }
    checkAll();
    console.log('[豆包助手] 完成 ✅ 请手动点「删除」按钮');
  }

  // 暴露一个全局函数，方便漏勾时随时重跑
  window.doubaoCheck = checkAll;

  await run();
})();
