// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // 判断页面是否刷新且是http/https页面
    if (changeInfo.status === 'loading' && /^http/.test(tab.url)) {
        // 向标签页注入脚本
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["webpage.js"]
        });
    }
});