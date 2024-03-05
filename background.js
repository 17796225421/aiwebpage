import {extractWebpageContent} from './gpt.js';

// 监听插件安装事件
chrome.runtime.onInstalled.addListener(() => {
    console.log('插件已安装');
});

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // 页面加载完成后,注入content script获取页面文本
        chrome.scripting.executeScript({
            target: {tabId: tabId},
            function: getPageText
        });
    }
});

// content script函数,用于获取页面文本
function getPageText() {
    // 获取页面中所有非script和style标签的文本内容
    const pageText = document.body.innerText;
    // 将获取到的文本传递给background
    chrome.runtime.sendMessage({action: 'pageText', data: pageText});
}

// 监听content script发送的消息
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'pageText') {
        // 打印获取到的页面文本
        console.log('当前页面文本:', message.data);

        let webpageContent = await extractWebpageContent(message.data);

        console.log('页面内容：', webpageContent);
    }
});