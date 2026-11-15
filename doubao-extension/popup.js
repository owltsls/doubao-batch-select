// 扩展弹窗：点击按钮，向当前豆包页的内容脚本发消息触发勾选
document.getElementById('run').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !/doubao\.com/.test(tab.url || '')) {
    alert('请先打开豆包页面（doubao.com），再点此按钮。');
    return;
  }
  chrome.tabs.sendMessage(tab.id, { action: 'run' });
  window.close();
});
