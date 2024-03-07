let mainElement = null;// 主要内容对应的元素
let parts = []; // 定义一个数组,用于存储mainElement直接子元素的内嵌文本和对应的gptPart
let rightClicked = false;
let showFloatingWindow = false;// 定义一个变量,用于控制悬浮窗的显示状态
let floatingWindow = null;// 定义一个变量,用于存储悬浮窗元素
let contextMenu = null;// 定义一个变量,用于存储菜单元素

// 定义一个start函数,用于在注入脚本后立即执行
window.onload = async function () {
    // 监听contextmenu事件
    document.addEventListener('contextmenu', function (event) {
        event.preventDefault(); // 阻止默认的右键菜单
        rightClicked = true;
        togglePartCorners();
        showFloatingWindow = !showFloatingWindow; // 切换悬浮窗的显示状态
        if (!showFloatingWindow) {
            // 如果关闭悬浮窗,则隐藏当前的悬浮窗
            updateFloatingWindow(null);
        }
    });

    findMainContent();
    processSelectedText();
    extractChildText();
    createFloatingWindow(); // 创建悬浮窗元素

    // 使用 Promise.all 实现并发调用 analyzePart
    await Promise.all(parts.map(analyzePart));

}

function processSelectedText() {
    // 定义一个变量来存储上一次选择的文本
    let lastSelectedText = '';

    // 监听鼠标左键松开事件
    document.addEventListener('mouseup', function (event) {
        if (event.button === 0) { // 检查是否为鼠标左键
            // 删除当前所有的contextMenu元素
            let contextMenus = document.querySelectorAll('div[data-role="context-menu"]');
            contextMenus.forEach(menu => menu.remove());

            // 获取选中的文本
            let selectedText = window.getSelection().toString().trim();

            // 如果选中的文本与上一次选择的文本相同,说明是再次点击了选中的文本,此时不弹出菜单
            if (selectedText === lastSelectedText) {
                lastSelectedText = ''; // 清空上一次选择的文本
                return;
            }

            // 如果选中的文本不为空,弹出菜单
            if (selectedText !== '') {
                showContextMenu(selectedText, event.clientX, event.clientY);
                lastSelectedText = selectedText; // 更新上一次选择的文本
            } else {
                lastSelectedText = ''; // 如果选中的文本为空,清空上一次选择的文本
            }
        }
    });
}

// 显示右键菜单
function showContextMenu(selectedText, mouseX, mouseY) {
    console.log(selectedText);

    // 创建菜单元素
    contextMenu = document.createElement('div');
    contextMenu.setAttribute('data-role', 'context-menu'); // 添加自定义属性,用于标识contextMenu元素
    contextMenu.style.position = 'absolute';
    contextMenu.style.background = 'white';
    contextMenu.style.border = '1px solid black';
    contextMenu.style.padding = '5px';

    // 创建 "解释" 选项
    let explainOption = document.createElement('div');
    explainOption.innerText = '解释';
    explainOption.style.cursor = 'pointer';
    explainOption.addEventListener('click', function () {
        explainText(selectedText);
    });
    contextMenu.appendChild(explainOption);

    // 创建 "提问" 选项
    let askOption = document.createElement('div');
    askOption.innerText = '提问';
    askOption.style.cursor = 'pointer';
    askOption.addEventListener('click', function () {
        askQuestion(selectedText);
    });
    contextMenu.appendChild(askOption);

    // 将菜单添加到文档中
    document.body.appendChild(contextMenu);

    // 获取选中文本的位置
    let selection = window.getSelection();
    let range = selection.getRangeAt(0);
    let rect = range.getBoundingClientRect();

    // 设置菜单的位置为鼠标当前位置
    contextMenu.style.left = mouseX + 'px';
    contextMenu.style.top = mouseY + 'px';
}

// 解释文本函数
function explainText(text) {
    console.log('解释文本:', text);
    // 在这里实现解释文本的逻辑
}

// 提问函数
function askQuestion(text) {
    console.log('提问:', text);
    // 在这里实现提问的逻辑
}


// 创建悬浮窗元素
function createFloatingWindow() {
    floatingWindow = document.createElement('div');
    floatingWindow.style.position = 'fixed';
    floatingWindow.style.zIndex = '9999';
    floatingWindow.style.background = 'white';
    floatingWindow.style.border = '1px solid black';
    floatingWindow.style.padding = '7px';
    floatingWindow.style.display = 'none'; // 初始状态下隐藏悬浮窗
    document.body.appendChild(floatingWindow);
}

// 更新悬浮窗的内容和位置
function updateFloatingWindow(part) {
    if (part && showFloatingWindow) {
        // 如果存在part并且showFloatingWindow为true,则更新悬浮窗内容和位置
        floatingWindow.innerText = part.gptPart;

        // 设置悬浮窗的位置,使其显示在 part 左下角
        let rect = mainElement.getBoundingClientRect();
        let floatingWindowRect = floatingWindow.getBoundingClientRect();

        // 计算悬浮窗的左边距
        let left = rect.left;

        // 计算悬浮窗的上边距
        let top = rect.top + part.endY;

        // 检查悬浮窗是否会超出屏幕底部
        if (top + floatingWindowRect.height > window.innerHeight) {
            // 如果悬浮窗超出屏幕底部,将其贴着屏幕底部显示
            top = window.innerHeight - floatingWindowRect.height;
        }

        floatingWindow.style.left = left + 'px';
        floatingWindow.style.top = top + 'px';

        floatingWindow.style.display = 'block'; // 显示悬浮窗
    } else {
        floatingWindow.style.display = 'none'; // 隐藏悬浮窗
    }
}

// 查找鼠标当前覆盖的part
function findCurrentPart(mouseX, mouseY) {
    console.log(mouseY);

    let rect = mainElement.getBoundingClientRect();

    // 判断鼠标是否在mainElement的区域内
    if (mouseX < rect.left || mouseX > rect.right) {
        // 如果鼠标在横轴方向不在mainElement区域内,直接返回null
        return null;
    }

    // 将鼠标的绝对坐标转换为相对于mainElement的坐标
    let relativeY = mouseY - rect.top;

    // 遍历parts数组,查找鼠标当前覆盖的part
    for (let part of parts) {
        if (relativeY >= part.startY && relativeY <= part.endY) {
            // 如果鼠标在纵轴方向覆盖了当前part,则返回该part
            return part;
        }
    }

    // 如果没有找到覆盖的part,返回null
    return null;
}

let currentPart = null; // 记录当前鼠标所在的 part
// 监听 mousemove 事件
document.addEventListener('mousemove', function (event) {
    if (showFloatingWindow) {
        currentPart = findCurrentPart(event.clientX, event.clientY);
        updateFloatingWindow(currentPart); // 更新悬浮窗的内容和位置
    }
});


// 定义一个函数,用于显示或隐藏所有 part 的绿色拐角
function togglePartCorners() {
    for (let part of parts) {
        for (let div of part.cornerDivs) {
            div.style.display = (div.style.display === 'none' ? 'block' : 'none');
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

    // 遍历mainElement的直接子元素
    let currentPart = null; // 当前正在合并的part
    for (let child of mainElement.children) {
        // 如果子元素宽度不等于众数宽度,则跳过
        if (child.offsetWidth !== modeWidth) {
            continue;
        }

        // 获取子元素的内嵌文本,并去除首尾空格
        let text = child.innerText.trim();

        // 如果内嵌文本不为空
        if (text !== '') {
            // 如果当前没有正在合并的part,或者合并后的文本长度大于等于250,则创建新的part
            if (!currentPart || (currentPart.text + text).length >= 250) {
                let rect = child.getBoundingClientRect();
                currentPart = {
                    text: text,
                    gptPart: null, // 初始化gptPart为null
                    startY: rect.top - mainElement.getBoundingClientRect().top,
                    endY: rect.bottom - mainElement.getBoundingClientRect().top
                };
                parts.push(currentPart);
            } else {
                // 否则,将文本合并到当前的part
                currentPart.text += text;
                currentPart.endY = child.getBoundingClientRect().bottom - mainElement.getBoundingClientRect().top;
            }
        }
    }
    // 根据 parts 数组,在 mainElement 上创建标识各个 part 的 div 元素,但先不显示
    for (let i = 0; i < parts.length; i++) {
        let part = parts[i];

        // 创建四个 div 元素,分别用于标识 part 的四个拐角
        let topLeft = document.createElement('div');
        let topRight = document.createElement('div');
        let bottomLeft = document.createElement('div');
        let bottomRight = document.createElement('div');

        // 获取 mainElement 的位置信息
        let mainRect = mainElement.getBoundingClientRect();

        // 设置四个拐角div的样式,使用绝对定位
        topLeft.style.position = 'absolute';
        topLeft.style.left = mainRect.left + 'px';
        topLeft.style.top = mainRect.top + part.startY + 'px';
        topLeft.style.width = '0';
        topLeft.style.height = '0';
        topLeft.style.borderBottom = '7px solid transparent';
        topLeft.style.borderLeft = '7px solid royalblue';
        topLeft.style.zIndex = '9999';
        topLeft.style.display = 'none';

        topRight.style.position = 'absolute';
        topRight.style.left = mainRect.right - 10 + 'px';
        topRight.style.top = mainRect.top + part.startY + 'px';
        topRight.style.width = '0';
        topRight.style.height = '0';
        topRight.style.borderBottom = '7px solid transparent';
        topRight.style.borderRight = '7px solid royalblue';
        topRight.style.zIndex = '9999';
        topRight.style.display = 'none';

        bottomLeft.style.position = 'absolute';
        bottomLeft.style.left = mainRect.left + 'px';
        bottomLeft.style.top = mainRect.top + part.endY - 10 + 'px';
        bottomLeft.style.width = '0';
        bottomLeft.style.height = '0';
        bottomLeft.style.borderTop = '7px solid transparent';
        bottomLeft.style.borderLeft = '7px solid royalblue';
        bottomLeft.style.zIndex = '9999';
        bottomLeft.style.display = 'none';

        bottomRight.style.position = 'absolute';
        bottomRight.style.left = mainRect.right - 10 + 'px';
        bottomRight.style.top = mainRect.top + part.endY - 10 + 'px';
        bottomRight.style.width = '0';
        bottomRight.style.height = '0';
        bottomRight.style.borderTop = '7px solid transparent';
        bottomRight.style.borderRight = '7px solid royalblue';
        bottomRight.style.zIndex = '9999';
        bottomRight.style.display = 'none';

        // 将四个拐角 div 添加到 document.body 中,而不是 mainElement
        document.body.appendChild(topLeft);
        document.body.appendChild(topRight);
        document.body.appendChild(bottomLeft);
        document.body.appendChild(bottomRight);

        // 将四个拐角 div 存储到 part 对象中,以便后续显示
        part.cornerDivs = [topLeft, topRight, bottomLeft, bottomRight];
    }
}

async function analyzePart(part) {
    // 循环判断 rightClicked 是否为 true
    while (!rightClicked) {
        // 如果 rightClicked 不为 true,等待 1 秒后再次判断
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const apiUrl = 'https://sapi.onechat.fun/v1/chat/completions';
    const apiKey = 'sk-Uu3jdGcVYyZymoTX63C4Cf38E7A44198982490612d1f48D5';
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
                content: part.text
            }
        ]
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
        part.gptPart = responseData.choices[0].message.content;
        for (let div of part.cornerDivs) {
            div.style.borderLeftColor = 'green';
            div.style.borderRightColor = 'green';
        }
    } catch (error) {
        console.error("请求失败:", error);
        // 这里可以根据需要进行错误处理,例如重试或提示用户
    }
}


