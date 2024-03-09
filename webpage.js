let mainElement = null;// 主要内容对应的元素
let rightClicked = false;
let textContextMenu = null;// 定义一个变量,用于存储文本菜单元素
let imageContextMenu = null;// 定义一个变量,用于存储图像菜单元素
let lastSelectedRange = null;// 定义一个变量,用于存储最后一次选中的区域
// 定义一个start函数,用于在注入脚本后立即执行
window.onload = async function () {
    // 监听contextmenu事件
    document.addEventListener('contextmenu', function (event) {
        event.preventDefault(); // 阻止默认的右键菜单
        rightClicked = true;
        controlDividersShow();

    });

    findMainContent();
    processSelectedText();
    extractChildText();

    // 获取所有分割线元素
    let dividers = document.querySelectorAll('.分割线');

    // 将分割线元素转为数组,并传入 Promise.all
    await Promise.all(Array.from(dividers).map(analyzePart));

}

function processSelectedText() {
    // 定义一个变量,用于存储上一次选择的文本
    let lastSelectedText = '';
    // 监听鼠标左键松开事件
    document.addEventListener('mouseup', function (event) {
        if (event.button === 0) { // 检查是否为鼠标左键
            // 获取选中的文本
            let selection = window.getSelection();
            let selectedText = selection.toString().trim();
            if (lastSelectedText === selectedText) {
                selectedText = '';
            }
            if (selectedText === '') {
                // 如果点击对象不是 textContextMenu 或其子元素,则删除 textContextMenu
                if (!event.target.closest('[data-role="context-menu"]')) {
                    if (textContextMenu) {
                        removeTextContextMenu();
                    }
                }
                return;
            }
            removeTextContextMenu();
            showTextContextMenu(event.clientX, event.clientY);
            // 更新 lastSelectedText
            lastSelectedText = selectedText;
            // 存储最后一次选中的区域
            lastSelectedRange = selection.getRangeAt(0);
        }
    });

    // 监听鼠标移动事件
    document.addEventListener('mousemove', function (event) {
        // 如果鼠标移动到图片上
        if (event.target.tagName === 'IMG') {
            // 创建并显示上下文菜单
            showImageContextMenu(event.clientX, event.clientY, event.target);
        } else {
            if (!event.target.closest('[data-role="image-context-menu"]')) {
                removeImageContextMenu();
            }
        }
    });
}

// 创建并显示上下文菜单的函数
function showImageContextMenu(mouseX, mouseY, target) {
    if (imageContextMenu) {
        if (target !== imageContextMenu.target) {
            removeImageContextMenu();
        } else {
            return;
        }
    }
    // 如果 imageContextMenu 不存在,则创建它
    if (!imageContextMenu) {
        imageContextMenu = document.createElement('div');
        imageContextMenu.target = target;
        // 给目标图片添加凸起效果
        target.style.transform = 'scale(1.05)';
        target.style.transition = 'transform 0.3s';
        imageContextMenu.setAttribute('data-role', 'image-context-menu');
        imageContextMenu.style.position = 'absolute';
        imageContextMenu.style.left = (mouseX + window.scrollX) + 'px';
        imageContextMenu.style.top = (mouseY + window.scrollY) + 'px';
        imageContextMenu.style.zIndex = '1000';
        imageContextMenu.style.backgroundColor = '#fff';
        imageContextMenu.style.border = '1px solid #ccc';
        imageContextMenu.style.padding = '10px';
        imageContextMenu.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.2)';

        // 创建 "解释" 选项
        let explainOption = document.createElement('div');
        explainOption.innerText = '解释';
        explainOption.style.cursor = 'pointer';
        explainOption.addEventListener('click', function () {
            explainImage(lastSelectedRange);
        });
        imageContextMenu.appendChild(explainOption);

        // 创建 "提问" 选项
        let askOption = document.createElement('div');
        askOption.innerText = '提问';
        askOption.style.cursor = 'pointer';
        askOption.addEventListener('click', function () {
            askQuestionWithImage(lastSelectedRange);
        });
        imageContextMenu.appendChild(askOption);

        // 将菜单添加到文档中
        document.body.appendChild(imageContextMenu);
    }
}

// 显示右键菜单
function showTextContextMenu(mouseX, mouseY) {
    // 创建菜单元素
    textContextMenu = document.createElement('div');
    textContextMenu.setAttribute('data-role', 'context-menu'); // 添加自定义属性,用于标识contextMenu元素
    textContextMenu.style.position = 'absolute';
    textContextMenu.style.background = 'white';
    textContextMenu.style.border = '1px solid black';
    textContextMenu.style.padding = '5px';

    // 创建 "解释" 选项
    let explainOption = document.createElement('div');
    explainOption.innerText = '解释';
    explainOption.style.cursor = 'pointer';
    explainOption.addEventListener('click', function () {
        explainText(lastSelectedRange);
    });
    textContextMenu.appendChild(explainOption);

    // 创建 "提问" 选项
    let askOption = document.createElement('div');
    askOption.innerText = '提问';
    askOption.style.cursor = 'pointer';
    askOption.addEventListener('click', function () {
        askQuestion(lastSelectedRange);
    });
    textContextMenu.appendChild(askOption);

    // 将菜单添加到文档中
    document.body.appendChild(textContextMenu);

    // 设置菜单的位置为鼠标当前位置
    textContextMenu.style.left = (mouseX + window.scrollX) + 'px';
    textContextMenu.style.top = (mouseY + window.scrollY) + 'px';
}

// 解释文本函数
function explainText(range) {
    // 创建一个固定高度的输出框
    let outputBox = document.createElement('div');
    outputBox.style.height = '200px'; // 设置输出框的高度像素
    outputBox.style.width = '100%'; // 设置输出框的宽度为100%
    outputBox.style.display = 'flex'; // 将输出框设置为 flex 容器
    outputBox.style.overflow = 'hidden'; // 防止输出框本身出现滚动条
    outputBox.style.fontSize = '12px'; // 设置较小的字号
    outputBox.style.lineHeight = '1.1'; // 设置行距

    // 创建可滚动的左边区域
    let leftScrollable = document.createElement('div');
    leftScrollable.style.width = '50%'; // 设置左边区域的宽度为 50%
    leftScrollable.style.height = '100%'; // 设置左边区域的高度为100%
    leftScrollable.style.overflowY = 'auto'; // 设置垂直滚动条
    leftScrollable.style.borderRight = '1px solid #ddd'; // 给左边区域添加右边框来区分左右两侧
    leftScrollable.style.backgroundColor = '#f9f9f9'; // 设置背景颜色以区分周围内容
    leftScrollable.style.boxShadow = 'inset -5px 0px 5px -5px rgba(0,0,0,0.1)'; // 内阴影效果
    leftScrollable.style.scrollbarWidth = 'none'; // 隐藏滚动条（适用于新版浏览器）
    leftScrollable.style.webkitOverflowScrolling = 'touch'; // 启用惯性滚动效果
    leftScrollable.style.webkitScrollbarWidth = 'none'; // 隐藏滚动条

    const systemContent = "you are a helpful assistant"; // 系统信息，请根据实际情况修改
    let userContent = '';
    userContent += '大背景：' + mainElement.innerText;
    userContent += '参考大背景，详细解释这段文本：' + range.toString(); // 用户选中的文本
    // 使用正则表达式过滤掉非文本内容
    userContent = userContent.replace(/<img.*?>/g, '').trim();

    let leftArea = document.createElement('div');
    leftArea.innerText = 'gpt4'; // 设置左边区域的文本为 "claude4"
    leftScrollable.appendChild(leftArea); // 将左边区域添加到可滚动容器中
    outputBox.appendChild(leftScrollable); // 将左边可滚动容器添加到输出框中
    askGpt4(systemContent, userContent, leftArea);

    // 创建可滚动的右边区域
    let rightScrollable = document.createElement('div');
    rightScrollable.style.width = '50%'; // 设置右边区域的宽度为 50%
    rightScrollable.style.height = '100%'; // 设置右边区域的高度为100%
    rightScrollable.style.overflowY = 'auto'; // 设置垂直滚动条
    rightScrollable.style.borderLeft = '1px solid #ddd'; // 给右边区域添加左边框来区分左右两侧
    rightScrollable.style.backgroundColor = '#f9f9f9'; // 设置背景颜色以区分周围内容
    rightScrollable.style.boxShadow = 'inset 5px 0px 5px -5px rgba(0,0,0,0.1)'; // 内阴影效果
    rightScrollable.style.scrollbarWidth = 'none'; // 隐藏滚动条（适用于新版浏览器）
    rightScrollable.style.webkitOverflowScrolling = 'touch'; // 启用惯性滚动效果
    rightScrollable.style.webkitScrollbarWidth = 'none'; // 隐藏滚动条

    let rightArea = document.createElement('div');
    rightArea.innerText = 'claude3'; // 设置右边区域的文本为 "claude3"
    rightScrollable.appendChild(rightArea); // 将右边区域添加到可滚动容器中
    outputBox.appendChild(rightScrollable); // 将右边可滚动容器添加到输出框中
    askClaude3(systemContent, userContent, rightArea);

    // 将选中区域的结束位置移动到原来的结束位置
    range.collapse(false);

    // 将输出框插入到选中文本的末尾
    range.insertNode(outputBox);

    removeTextContextMenu(); // 删除contextMenu

    lastSelectedRange = null;
}

// 提问函数
function askQuestion(range) {
    // 创建一个固定高度的输出框
    let outputBox = document.createElement('div');
    outputBox.style.height = '200px'; // 设置输出框的高度像素
    outputBox.style.width = '100%'; // 设置输出框的宽度为100%
    outputBox.style.display = 'flex'; // 将输出框设置为 flex 容器
    outputBox.style.overflow = 'hidden'; // 防止输出框本身出现滚动条
    outputBox.style.fontSize = '12px'; // 设置较小的字号
    outputBox.style.lineHeight = '1.1'; // 设置行距

    // 创建可滚动的左边区域
    let leftScrollable = document.createElement('div');
    leftScrollable.style.width = '50%'; // 设置左边区域的宽度为 50%
    leftScrollable.style.height = '100%'; // 设置左边区域的高度为100%
    leftScrollable.style.overflowY = 'auto'; // 设置垂直滚动条
    leftScrollable.style.borderRight = '1px solid #ddd'; // 给左边区域添加右边框来区分左右两侧
    leftScrollable.style.backgroundColor = '#f9f9f9'; // 设置背景颜色以区分周围内容
    leftScrollable.style.boxShadow = 'inset -5px 0px 5px -5px rgba(0,0,0,0.1)'; // 内阴影效果
    leftScrollable.style.scrollbarWidth = 'none'; // 隐藏滚动条（适用于新版浏览器）
    leftScrollable.style.webkitOverflowScrolling = 'touch'; // 启用惯性滚动效果
    leftScrollable.style.webkitScrollbarWidth = 'none'; // 隐藏滚动条

    const systemContent = "you are a helpful assistant"; // 系统信息，请根据实际情况修改
    let userContent = '';
    userContent += '大背景：' + mainElement.innerText;
    userContent += '\n小背景：' + range.toString(); // 用户选中的文本
    // 使用正则表达式过滤掉非文本内容
    userContent = userContent.replace(/<img.*?>/g, '').trim();
    // 使用 prompt 函数获取用户输入的问题
    let question = prompt("请输入你的问题:");
    if (question) {
        // 如果用户输入了问题,将问题添加到 userContent 中
        userContent += "\n简单参考大背景，重点参考小背景，回答问题: " + question;
        let leftArea = document.createElement('div');
        leftArea.innerText = 'gpt4'; // 设置左边区域的文本为 "claude4"
        leftScrollable.appendChild(leftArea); // 将左边区域添加到可滚动容器中
        outputBox.appendChild(leftScrollable); // 将左边可滚动容器添加到输出框中
        askGpt4(systemContent, userContent, leftArea);

        // 创建可滚动的右边区域
        let rightScrollable = document.createElement('div');
        rightScrollable.style.width = '50%'; // 设置右边区域的宽度为 50%
        rightScrollable.style.height = '100%'; // 设置右边区域的高度为100%
        rightScrollable.style.overflowY = 'auto'; // 设置垂直滚动条
        rightScrollable.style.borderLeft = '1px solid #ddd'; // 给右边区域添加左边框来区分左右两侧
        rightScrollable.style.backgroundColor = '#f9f9f9'; // 设置背景颜色以区分周围内容
        rightScrollable.style.boxShadow = 'inset 5px 0px 5px -5px rgba(0,0,0,0.1)'; // 内阴影效果
        rightScrollable.style.scrollbarWidth = 'none'; // 隐藏滚动条（适用于新版浏览器）
        rightScrollable.style.webkitOverflowScrolling = 'touch'; // 启用惯性滚动效果
        rightScrollable.style.webkitScrollbarWidth = 'none'; // 隐藏滚动条

        let rightArea = document.createElement('div');
        rightArea.innerText = 'claude3'; // 设置右边区域的文本为 "claude3"
        rightScrollable.appendChild(rightArea); // 将右边区域添加到可滚动容器中
        outputBox.appendChild(rightScrollable); // 将右边可滚动容器添加到输出框中
        askClaude3(systemContent, userContent, rightArea);

        // 将选中区域的结束位置移动到原来的结束位置
        range.collapse(false);

        // 将输出框插入到选中文本的末尾
        range.insertNode(outputBox);
    }

    removeTextContextMenu(); // 删除contextMenu

    lastSelectedRange = null;
}

// 解释图像函数
function explainImage(range) {
    // 创建一个固定高度的输出框
    let outputBox = document.createElement('div');
    outputBox.style.height = '200px'; // 设置输出框的高度像素
    outputBox.style.width = '100%'; // 设置输出框的宽度为100%
    outputBox.style.display = 'flex'; // 将输出框设置为 flex 容器
    outputBox.style.overflow = 'hidden'; // 防止输出框本身出现滚动条
    outputBox.style.fontSize = '12px'; // 设置较小的字号
    outputBox.style.lineHeight = '1.1'; // 设置行距

    // 创建可滚动的左边区域
    let leftScrollable = document.createElement('div');
    leftScrollable.style.width = '50%'; // 设置左边区域的宽度为 50%
    leftScrollable.style.height = '100%'; // 设置左边区域的高度为100%
    leftScrollable.style.overflowY = 'auto'; // 设置垂直滚动条
    leftScrollable.style.borderRight = '1px solid #ddd'; // 给左边区域添加右边框来区分左右两侧
    leftScrollable.style.backgroundColor = '#f9f9f9'; // 设置背景颜色以区分周围内容
    leftScrollable.style.boxShadow = 'inset -5px 0px 5px -5px rgba(0,0,0,0.1)'; // 内阴影效果
    leftScrollable.style.scrollbarWidth = 'none'; // 隐藏滚动条（适用于新版浏览器）
    leftScrollable.style.webkitOverflowScrolling = 'touch'; // 启用惯性滚动效果
    leftScrollable.style.webkitScrollbarWidth = 'none'; // 隐藏滚动条

    let imageUrl = imageContextMenu.target.src;
    let userContent = '';
    userContent += '大背景：' + mainElement.innerText;
    if (range != null) {
        userContent += '\n小背景：';
    }
    userContent = userContent.replace(/<img.*?>/g, '').trim();
    userContent += '简单参考大背景，重点参考小背景，详细分析图片';
    let leftArea = document.createElement('div');
    leftArea.innerText = 'gpt4'; // 设置左边区域的文本为 "claude4"
    leftScrollable.appendChild(leftArea); // 将左边区域添加到可滚动容器中
    outputBox.appendChild(leftScrollable); // 将左边可滚动容器添加到输出框中
    askGpt4Vision(userContent, leftArea, imageUrl);

    // 创建可滚动的右边区域
    let rightScrollable = document.createElement('div');
    rightScrollable.style.width = '50%'; // 设置右边区域的宽度为 50%
    rightScrollable.style.height = '100%'; // 设置右边区域的高度为100%
    rightScrollable.style.overflowY = 'auto'; // 设置垂直滚动条
    rightScrollable.style.borderLeft = '1px solid #ddd'; // 给右边区域添加左边框来区分左右两侧
    rightScrollable.style.backgroundColor = '#f9f9f9'; // 设置背景颜色以区分周围内容
    rightScrollable.style.boxShadow = 'inset 5px 0px 5px -5px rgba(0,0,0,0.1)'; // 内阴影效果
    rightScrollable.style.scrollbarWidth = 'none'; // 隐藏滚动条（适用于新版浏览器）
    rightScrollable.style.webkitOverflowScrolling = 'touch'; // 启用惯性滚动效果
    rightScrollable.style.webkitScrollbarWidth = 'none'; // 隐藏滚动条

    let rightArea = document.createElement('div');
    rightArea.innerText = 'claude3'; // 设置右边区域的文本为 "claude3"
    rightScrollable.appendChild(rightArea); // 将右边区域添加到可滚动容器中
    outputBox.appendChild(rightScrollable); // 将右边可滚动容器添加到输出框中
    askClaude3Vision(userContent, rightArea, imageUrl);

    // 获取图片元素的父元素
    let parentElement = imageContextMenu.target.parentElement;

    // 在图片元素后面插入输出框
    parentElement.insertBefore(outputBox, imageContextMenu.target.nextSibling);

    removeImageContextMenu(); // 删除contextMenu

    lastSelectedRange = null;
}

// 提问函数
function askQuestionWithImage(range) {
    // 创建一个固定高度的输出框
    let outputBox = document.createElement('div');
    outputBox.style.height = '200px'; // 设置输出框的高度像素
    outputBox.style.width = '100%'; // 设置输出框的宽度为100%
    outputBox.style.display = 'flex'; // 将输出框设置为 flex 容器
    outputBox.style.overflow = 'hidden'; // 防止输出框本身出现滚动条
    outputBox.style.fontSize = '12px'; // 设置较小的字号
    outputBox.style.lineHeight = '1.1'; // 设置行距

    // 创建可滚动的左边区域
    let leftScrollable = document.createElement('div');
    leftScrollable.style.width = '50%'; // 设置左边区域的宽度为 50%
    leftScrollable.style.height = '100%'; // 设置左边区域的高度为100%
    leftScrollable.style.overflowY = 'auto'; // 设置垂直滚动条
    leftScrollable.style.borderRight = '1px solid #ddd'; // 给左边区域添加右边框来区分左右两侧
    leftScrollable.style.backgroundColor = '#f9f9f9'; // 设置背景颜色以区分周围内容
    leftScrollable.style.boxShadow = 'inset -5px 0px 5px -5px rgba(0,0,0,0.1)'; // 内阴影效果
    leftScrollable.style.scrollbarWidth = 'none'; // 隐藏滚动条（适用于新版浏览器）
    leftScrollable.style.webkitOverflowScrolling = 'touch'; // 启用惯性滚动效果
    leftScrollable.style.webkitScrollbarWidth = 'none'; // 隐藏滚动条

    let imageUrl = imageContextMenu.target.src;
    let userContent = '';
    userContent += '大背景：' + mainElement.innerText;
    if (range != null) {
        userContent += '小背景：';
    }
    userContent = userContent.replace(/<img.*?>/g, '').trim();
    // 使用 prompt 函数获取用户输入的问题
    let question = prompt("请输入你的问题:");
    if (question) {
        // 如果用户输入了问题,将问题添加到 userContent 中
        userContent += "简单参考大背景，重点参考小背景，重点详细分析图片，回答问题: " + question;
        let leftArea = document.createElement('div');
        leftArea.innerText = 'gpt4'; // 设置左边区域的文本为 "claude4"
        leftScrollable.appendChild(leftArea); // 将左边区域添加到可滚动容器中
        outputBox.appendChild(leftScrollable); // 将左边可滚动容器添加到输出框中
        askGpt4Vision(userContent, leftArea, imageUrl);

        // 创建可滚动的右边区域
        let rightScrollable = document.createElement('div');
        rightScrollable.style.width = '50%'; // 设置右边区域的宽度为 50%
        rightScrollable.style.height = '100%'; // 设置右边区域的高度为100%
        rightScrollable.style.overflowY = 'auto'; // 设置垂直滚动条
        rightScrollable.style.borderLeft = '1px solid #ddd'; // 给右边区域添加左边框来区分左右两侧
        rightScrollable.style.backgroundColor = '#f9f9f9'; // 设置背景颜色以区分周围内容
        rightScrollable.style.boxShadow = 'inset 5px 0px 5px -5px rgba(0,0,0,0.1)'; // 内阴影效果
        rightScrollable.style.scrollbarWidth = 'none'; // 隐藏滚动条（适用于新版浏览器）
        rightScrollable.style.webkitOverflowScrolling = 'touch'; // 启用惯性滚动效果
        rightScrollable.style.webkitScrollbarWidth = 'none'; // 隐藏滚动条

        let rightArea = document.createElement('div');
        rightArea.innerText = 'claude3'; // 设置右边区域的文本为 "claude3"
        rightScrollable.appendChild(rightArea); // 将右边区域添加到可滚动容器中
        outputBox.appendChild(rightScrollable); // 将右边可滚动容器添加到输出框中
        askClaude3Vision(userContent, rightArea, imageUrl);

        // 获取图片元素的父元素
        let parentElement = imageContextMenu.target.parentElement;

        // 在图片元素后面插入输出框
        parentElement.insertBefore(outputBox, imageContextMenu.target.nextSibling);
    }
    removeImageContextMenu(); // 删除contextMenu

    lastSelectedRange = null;
}

function removeTextContextMenu() {
    if (textContextMenu) {
        textContextMenu.remove(); // 从DOM中删除contextMenu元素
        textContextMenu = null; // 将contextMenu变量设为null
    }
}

// 删除contextMenu的函数
function removeImageContextMenu() {
    if (imageContextMenu) {
        // 移除目标图片的凸起效果
        if (imageContextMenu.target) {
            imageContextMenu.target.style.transform = 'scale(1)'; // 图片恢复原状
        }
        imageContextMenu.remove(); // 从DOM中删除contextMenu元素
        imageContextMenu = null; // 将contextMenu变量设为null
    }
}

// 监听 mousemove 事件
document.addEventListener('mousemove', function (event) {
    // 获取所有的分割线元素
    let dividers = document.querySelectorAll('.分割线');

    // 获取 mainElement 的位置信息
    let mainRect = mainElement.getBoundingClientRect();

    // 判断鼠标是否在 mainElement 的区域内
    if (event.clientX < mainRect.left || event.clientX > mainRect.right) {
        // 如果鼠标在横轴方向不在 mainElement 区域内,隐藏所有分割线的 gptTextElement
        dividers.forEach(divider => {
            let gptTextElement = divider.querySelector('.gptText');
            if (gptTextElement) {
                gptTextElement.style.display = 'none';
            }
        });
        return;
    }

    // 将分割线元素转换为数组
    let dividersArray = Array.from(dividers);

    // 找到第一个 y 坐标大于鼠标 y 坐标的分割线
    let targetDivider = dividersArray.find(divider => {
        let rect = divider.getBoundingClientRect();
        return rect.top > event.clientY;
    });

    // 如果找到了目标分割线
    if (targetDivider) {
        // 显示目标分割线的 gptTextElement
        let gptTextElement = targetDivider.querySelector('.gptText');
        if (gptTextElement) {
            gptTextElement.style.display = 'block';
        }

        // 隐藏其他分割线的 gptTextElement
        dividersArray.forEach(divider => {
            if (divider !== targetDivider) {
                let otherGptTextElement = divider.querySelector('.gptText');
                if (otherGptTextElement) {
                    otherGptTextElement.style.display = 'none';
                }
            }
        });
    } else {
        // 如果没有找到目标分割线,则隐藏所有分割线的 gptTextElement
        dividersArray.forEach(divider => {
            let gptTextElement = divider.querySelector('.gptText');
            if (gptTextElement) {
                gptTextElement.style.display = 'none';
            }
        });
    }
});

// 定义一个函数,用于显示或隐藏所有 part 的分割线
function controlDividersShow() {
    let dividers = document.querySelectorAll('.分割线');
    for (let divider of dividers) {
        // 判断当前分割线是否可见（通过检查其 display 属性）
        if (divider.style.display === 'none') {
            // 如果分割线当前是隐藏的，则显示它
            divider.style.display = ''; // 清空 display 属性以显示分割线
        } else {
            // 如果分割线当前是显示的，则隐藏它
            divider.style.display = 'none'; // 设置 display 为 'none' 隐藏分割线
        }
    }
}

function findMainContent() {
    // 获取所有元素
    let elements = [document.body];
    let maxScore = 0;
    let tmpMainElement = null;

    // 遍历所有元素,对每个元素评分
    while (elements.length > 0) {
        let element = elements.shift();

        // 如果元素宽度低于30%,跳过该元素及其子元素
        if (element.offsetWidth / window.innerWidth < 0.5) {
            continue;
        }
        // 如果元素高度低于30%,跳过该元素及其子元素
        if (element.offsetHeight / window.innerHeight < 0.5) {
            continue;
        }

        // 计算元素的得分
        let score = 0;
        let childWidths = []; // 存储直接子元素的宽度

        // 获取直接子元素的宽度
        for (let child of element.children) {
            // 如果子元素的宽度大于等于10并且高度大于等于10,才将其宽度加入childWidths数组
            if (child.offsetWidth >= 10 && child.offsetHeight >= 10) {
                childWidths.push(child.offsetWidth);
            }
        }

        // 找到宽度的众数
        let widthCounts = {}; // 用于统计每个宽度出现的次数
        let maxCount = 0; // 记录出现次数最多的宽度的次数
        let modeWidth = null; // 记录众数宽度

        for (let width of childWidths) {
            if (widthCounts[width]) {
                widthCounts[width]++;
            } else {
                widthCounts[width] = 1;
            }

            if (widthCounts[width] > maxCount) {
                maxCount = widthCounts[width];
                modeWidth = width;
            }
        }

        // 计算得分:等于众数宽度的直接子元素数量
        if (modeWidth !== null) {
            score = widthCounts[modeWidth];
        }

        // 更新最高分和主要元素
        if (score > maxScore) {
            maxScore = score;
            tmpMainElement = element;
        }

        // 将当前元素的子元素加入队列
        for (let child of element.children) {
            elements.push(child);
        }

    }

    // 移除之前的红框样式
    if (mainElement) {
        mainElement.style.border = '';
    }

    mainElement = tmpMainElement;

    // // 用红框标出主要元素
    // mainElement.style.border = "1px solid red";
}

function extractChildText() {
    // 获取众数宽度
    let widthCounts = {}; // 用于统计每个宽度出现的次数
    let maxCount = 0; // 记录出现次数最多的宽度的次数
    let modeWidth = null; // 记录众数宽度

    for (let child of mainElement.children) {
        if (child.offsetWidth >= 10 && child.offsetHeight >= 10) {
            if (widthCounts[child.offsetWidth]) {
                widthCounts[child.offsetWidth]++;
            } else {
                widthCounts[child.offsetWidth] = 1;
            }

            if (widthCounts[child.offsetWidth] > maxCount) {
                maxCount = widthCounts[child.offsetWidth];
                modeWidth = child.offsetWidth;
            }
        }
    }

    // 遍历mainElement的直接子元素，并收集内嵌文本
    let partIndex = 0; // part 的索引
    let accumulatedText = ''; // 用于累积子元素的内嵌文本
    for (let child of mainElement.children) {
        // 如果子元素宽度不等于众数宽度,则跳过
        if (child.offsetWidth !== modeWidth) {
            continue;
        }

        // 获取子元素的内嵌文本,并去除首尾空格
        let text = child.innerText.trim();

        // 如果内嵌文本为空，则跳过
        if (text === '') {
            continue;
        }

        // 将非空的内嵌文本加入到累积文本中
        accumulatedText += text;

        // 检查累积的内嵌文本长度是否大于250
        if (accumulatedText.length > 250) {
            // 创建要插入的div元素，并设置类名和成员
            let divider = document.createElement('div');
            divider.className = '分割线'; // 设置类名
            divider.className += ` 分割线-${partIndex}`; // 添加具有索引的类名，以区分不同的分割线
            // 设置分割线的样式，使其可见
            divider.style.borderTop = '1px solid #131313'; // 上边框
            divider.style.borderBottom = '1px solid #131313';// 下边框
            divider.style.display = 'none';
            divider.style.backgroundColor = '#232222'; // 背景色
            divider.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.2)'; // 添加阴影效果
            // 创建并隐藏包含累积文本的成员，不在页面上显示
            // 创建新的DOM元素来存储gptText
            const textElement = document.createElement('div');
            textElement.className = 'text'; // 给元素添加一个类名，便于以后的查询
            textElement.style.display = 'none';
            textElement.innerText = accumulatedText

            divider.appendChild(textElement);

            // 将分割线div插入到当前子元素中
            child.appendChild(divider);

            // 清空累积的内嵌文本，为下次累积做准备
            accumulatedText = '';
            // 增加part索引，为下一个分割线做准备
            partIndex++;
        }
    }

}

async function analyzePart(divider) {
    // 循环判断 rightClicked 是否为 true
    while (!rightClicked) {
        // 如果 rightClicked 不为 true,等待 1 秒后再次判断
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const apiUrl = 'https://sapi.onechat.fun/v1/chat/completions';
    const apiKey = 'sk-Uu3jdGcVYyZymoTX63C4Cf38E7A44198982490612d1f48D5';

    // 获取分割线中的文本内容
    const partText = divider.textContent; // 假设divider是包含文本的DOM元素

    const requestBody = {
        model: 'gpt-3.5-turbo-0125',
        stream: false,
        messages: [
            {
                role: 'system',
                content: '你是一位资深的网页内容分析专家。接下来我会给你一段网页内容的文本,请你对这段文本进行深入分析和总结,告诉我这段文本的核心内容、表达的主旨、涉及的主题、蕴含的情感等,力求让我能够最大程度地理解这段文本所传达的信息。在分析过程中,请结合你的专业知识和经验,深入挖掘文本的内在含义。回答请使用中文。'
            },
            {
                role: 'user',
                content: partText
            }
        ],
        max_tokens: 4096
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`服务器响应异常: ${response.statusText}`);
        }

        const responseData = await response.json();
        // 将API返回的内容赋值给divider的gptText属性
        console.log(divider);

        // 创建新的DOM元素来存储gptText
        const gptTextElement = document.createElement('div');
        gptTextElement.style.display = 'none'; // 隐藏元素，不在页面上显示
        gptTextElement.className = 'gptText'; // 给元素添加一个类名，便于以后的查询
        gptTextElement.innerText = responseData.choices[0].message.content;
        // 修改 gptTextElement 的文本样式
        gptTextElement.style.fontSize = '12px'; // 设置较小的字号
        gptTextElement.style.lineHeight = '1.1'; // 设置行距
        // 将新创建的元素添加到分割线元素中
        divider.appendChild(gptTextElement);
        generateQuestion(partText, responseData.choices[0].message.content, gptTextElement);
    } catch (error) {
        console.error("请求失败:", error);
        // 这里可以根据需要进行错误处理,例如重试或提示用户
    }
}

async function askGpt4(systemContent, userContent, area) {
    console.log(userContent);
    const apiUrl = 'https://api.onechat.fun/v1/chat/completions';
    const apiKey = 'sk-nsvh2iZjUIkWXoko9fFe8a5e8a904aF39b4688FbF8B2F057';
    const requestBody = {
        model: 'gpt-4-32k',
        stream: true, // 启用流式传输
        messages: [
            {
                role: 'system',
                content: systemContent
            },
            {
                role: 'user',
                content: userContent
            }
        ],
        max_tokens: 4096
    };

    console.log(requestBody);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`服务器响应异常: ${response.statusText}`);
        }

        // 处理流式传输的数据
        const reader = response.body.getReader();
        let accumlativeContent = 'gpt4\n'; // 用于累计响应内容的变量

        while (true) {
            const {value: chunk, done} = await reader.read();
            if (done) {
                break;
            }
            const decodedChunk = new TextDecoder("utf-8").decode(chunk);
            // 将解码后的数据按行分割
            const lines = decodedChunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const jsonStr = line.slice('data:'.length).trim();
                    if (jsonStr === '[DONE]') {
                        // 如果收到 [DONE] 标记,表示传输结束,跳出循环
                        break;
                    }
                    // 解析 JSON 数据
                    const data = JSON.parse(jsonStr);
                    // 提取 delta 中的 content
                    const content = data.choices[0].delta.content;
                    if (content) {
                        accumlativeContent += content;
                        // 将累计的响应内容绑定到 leftArea 上
                        area.innerText = accumlativeContent;
                    }
                }
            }
        }
        generateQuestion(userContent, area.innerText, area);
    } catch (error) {
        console.error("请求失败:", error);
        // 这里可以根据需要进行错误处理,例如重试或提示用户
    }
}

async function askClaude3(systemContent, userContent, area) {
    console.log(userContent);
    const apiUrl = 'https://api.onechat.fun/v1/chat/completions';
    const apiKey = 'sk-nsvh2iZjUIkWXoko9fFe8a5e8a904aF39b4688FbF8B2F057';
    const requestBody = {
        model: 'claude-3-opus-20240229',
        stream: true, // 启用流式传输
        messages: [
            {
                role: 'system',
                content: systemContent
            },
            {
                role: 'user',
                content: userContent
            }
        ],
        max_tokens: 4096
    };

    console.log(requestBody);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`服务器响应异常: ${response.statusText}`);
        }

        // 处理流式传输的数据
        const reader = response.body.getReader();
        let accumlativeContent = 'claude3\n'; // 用于累计响应内容的变量

        while (true) {
            const {value: chunk, done} = await reader.read();
            if (done) {
                break;
            }
            const decodedChunk = new TextDecoder("utf-8").decode(chunk);
            // 将解码后的数据按行分割
            const lines = decodedChunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const jsonStr = line.slice('data:'.length).trim();
                    if (jsonStr === '[DONE]') {
                        // 如果收到 [DONE] 标记,表示传输结束,跳出循环
                        break;
                    }
                    // 解析 JSON 数据
                    const data = JSON.parse(jsonStr);
                    // 提取 delta 中的 content
                    const content = data.choices[0].delta.content;
                    if (content) {
                        accumlativeContent += content;
                        // 将累计的响应内容绑定到 leftArea 上
                        area.innerText = accumlativeContent;
                    }
                }
            }
        }
        generateQuestion(userContent, area.innerText, area);
    } catch (error) {
        console.error("请求失败:", error);
        // 这里可以根据需要进行错误处理,例如重试或提示用户
    }
}

async function askGpt4Vision(userContent, area, imageUrl) {
    console.log(userContent);
    const apiUrl = 'https://gpts.onechat.fun/v1/chat/completions';
    const apiKey = 'sk-LzTNvNbkGuITnfvh17AdF8167dCb4413B105E5Dc7f1d276c';
    // 构建请求体
    const requestBody = {
        model: "gpt-4-vision-preview",
        stream: true,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: userContent
                    },
                    {
                        type: "image_url",
                        image_url: imageUrl
                    }
                ]
            }
        ],
        max_tokens: 4096
    };
    console.log(requestBody);
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`服务器响应异常: ${response.statusText}`);
        }

        // 处理流式传输的数据
        const reader = response.body.getReader();
        let accumlativeContent = ''; // 用于累计响应内容的变量

        while (true) {
            const {value: chunk, done} = await reader.read();
            if (done) {
                break;
            }
            const decodedChunk = new TextDecoder("utf-8").decode(chunk);
            // 将解码后的数据按行分割
            const lines = decodedChunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const jsonStr = line.slice('data:'.length).trim();
                    if (jsonStr === '[DONE]') {
                        // 如果收到 [DONE] 标记,表示传输结束,跳出循环
                        break;
                    }
                    // 解析 JSON 数据
                    const data = JSON.parse(jsonStr);
                    // 提取 delta 中的 content
                    const content = data.choices[0].delta.content;
                    if (content) {
                        accumlativeContent += content;
                        // 将累计的响应内容绑定到 leftArea 上
                        area.innerText = accumlativeContent;
                    }
                }
            }
        }
        generateQuestion(userContent, area.innerText, area);
    } catch (error) {
        console.error("请求失败:", error);
        // 这里可以根据需要进行错误处理,例如重试或提示用户
    }
}

async function askClaude3Vision(userContent, area, imageUrl) {
    console.log(userContent);
    const apiUrl = 'https://api.onechat.fun/v1/chat/completions';
    const apiKey = 'sk-nsvh2iZjUIkWXoko9fFe8a5e8a904aF39b4688FbF8B2F057';

    // 构造请求体
    const requestBody = {
        model: 'claude-3-opus-20240229',
        stream: true, // 启用流式传输
        messages: [
            {
                role: 'user',
                content: [
                    {"type": "text", "text": "图片在说什么？"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": imageUrl
                        }
                    }
                ]
            }
        ],
        max_tokens: 4096
    };

    console.log(requestBody);

    try {
        // 发送请求
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`服务器响应异常: ${response.statusText}`);
        }

        // 处理流式传输的数据
        const reader = response.body.getReader();
        let accumlativeContent = 'claude3\n'; // 用于累计响应内容的变量

        while (true) {
            // 读取流式数据
            const {value: chunk, done} = await reader.read();
            if (done) {
                break;
            }
            const decodedChunk = new TextDecoder("utf-8").decode(chunk);
            // 将解码后的数据按行分割
            const lines = decodedChunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const jsonStr = line.slice('data:'.length).trim();
                    if (jsonStr === '[DONE]') {
                        // 如果收到 [DONE] 标记,表示传输结束,跳出循环
                        break;
                    }
                    // 解析 JSON 数据
                    const data = JSON.parse(jsonStr);
                    // 提取 delta 中的 content
                    const content = data.choices[0].delta.content;
                    if (content) {
                        accumlativeContent += content;
                        // 将累计的响应内容绑定到 area 元素上
                        area.innerText = accumlativeContent;
                    }
                }
            }
        }
        generateQuestion(userContent, area.innerText, area);
    } catch (error) {
        console.error("请求失败:", error);
        // 这里可以根据需要进行错误处理,例如重试或提示用户
    }
}

async function generateQuestion(userContent, answer, area) {
    const apiUrl = 'https://sapi.onechat.fun/v1/chat/completions';
    const apiKey = 'sk-Uu3jdGcVYyZymoTX63C4Cf38E7A44198982490612d1f48D5';

    // 构建请求体
    const requestBody = {
        model: 'gpt-3.5-turbo-0125',
        stream: false,
        max_tokens: 4096,
        messages: [
            {
                role: 'system',
                content: '你是一个擅长生成多个问题的助手，每个问题占一行'
            },
            {
                role: 'user',
                content: "背景信息: " + userContent + "\n已有答案: " + answer
            }
        ],
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`服务器响应异常: ${response.statusText}`);
        }

        const responseData = await response.json();
        area.innerText += '\n\n' + responseData.choices[0].message.content;
    } catch (error) {
        console.error("请求失败:", error);
        // 这里可以根据需要进行错误处理,例如重试或提示用户
    }
}