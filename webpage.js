let mainElement = null;// 主要内容对应的元素
let parts = []; // 定义一个数组,用于存储mainElement直接子元素的内嵌文本和对应的gptPart
let rightClicked = false;
let showFloatingWindow = false;// 定义一个变量,用于控制悬浮窗的显示状态
let floatingWindow = null;// 定义一个变量,用于存储悬浮窗元素
let textContextMenu = null;// 定义一个变量,用于存储文本菜单元素
let imageContextMenu = null;// 定义一个变量,用于存储图像菜单元素
let lastSelectedRange = null;// 定义一个变量,用于存储最后一次选中的区域
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
    outputBox.style.height = '400px'; // 设置输出框的高度像素
    outputBox.style.width = '100%'; // 设置输出框的宽度为100%
    outputBox.style.display = 'flex'; // 将输出框设置为 flex 容器
    outputBox.style.overflow = 'hidden'; // 防止输出框本身出现滚动条

    // 创建可滚动的左边区域
    let leftScrollable = document.createElement('div');
    leftScrollable.style.width = '50%'; // 设置左边区域的宽度为 50%
    leftScrollable.style.height = '100%'; // 设置左边区域的高度为100%
    leftScrollable.style.overflowY = 'auto'; // 设置垂直滚动条
    leftScrollable.style.borderRight = '1px solid #ddd'; // 给左边区域添加右边框来区分左右两侧
    leftScrollable.style.backgroundColor = '#f9f9f9'; // 设置背景颜色以区分周围内容
    leftScrollable.style.boxShadow = 'inset -5px 0px 5px -5px rgba(0,0,0,0.1)'; // 内阴影效果

    const systemContent = "你是一个帮助助手。"; // 系统信息，请根据实际情况修改
    let userContent = range.toString(); // 用户选中的文本
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
    outputBox.style.height = '400px'; // 设置输出框的高度像素
    outputBox.style.width = '100%'; // 设置输出框的宽度为100%
    outputBox.style.display = 'flex'; // 将输出框设置为 flex 容器
    outputBox.style.overflow = 'hidden'; // 防止输出框本身出现滚动条

    // 创建可滚动的左边区域
    let leftScrollable = document.createElement('div');
    leftScrollable.style.width = '50%'; // 设置左边区域的宽度为 50%
    leftScrollable.style.height = '100%'; // 设置左边区域的高度为100%
    leftScrollable.style.overflowY = 'auto'; // 设置垂直滚动条
    leftScrollable.style.borderRight = '1px solid #ddd'; // 给左边区域添加右边框来区分左右两侧
    leftScrollable.style.backgroundColor = '#f9f9f9'; // 设置背景颜色以区分周围内容
    leftScrollable.style.boxShadow = 'inset -5px 0px 5px -5px rgba(0,0,0,0.1)'; // 内阴影效果

    const systemContent = "你是一个帮助助手。"; // 系统信息，请根据实际情况修改
    let userContent = range.toString(); // 用户选中的文本
    // 使用正则表达式过滤掉非文本内容
    userContent = userContent.replace(/<img.*?>/g, '').trim();
    // 使用 prompt 函数获取用户输入的问题
    let question = prompt("请输入你的问题:");
    if (question) {
        // 如果用户输入了问题,将问题添加到 userContent 中
        userContent += "\n问题: " + question;
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
    outputBox.style.height = '400px'; // 设置输出框的高度像素
    outputBox.style.width = '100%'; // 设置输出框的宽度为100%
    outputBox.style.display = 'flex'; // 将输出框设置为 flex 容器
    outputBox.style.overflow = 'hidden'; // 防止输出框本身出现滚动条

    // 创建可滚动的左边区域
    let leftScrollable = document.createElement('div');
    leftScrollable.style.width = '50%'; // 设置左边区域的宽度为 50%
    leftScrollable.style.height = '100%'; // 设置左边区域的高度为100%
    leftScrollable.style.overflowY = 'auto'; // 设置垂直滚动条
    leftScrollable.style.borderRight = '1px solid #ddd'; // 给左边区域添加右边框来区分左右两侧
    leftScrollable.style.backgroundColor = '#f9f9f9'; // 设置背景颜色以区分周围内容
    leftScrollable.style.boxShadow = 'inset -5px 0px 5px -5px rgba(0,0,0,0.1)'; // 内阴影效果

    const systemContent = "输出图片的完整信息，要求详细、精确、有条理，说中文";
    let text = imageContextMenu.target.src + '\n';
    if (range != null) {
        text += '图片上下文信息：' + range.toString().replace(/<img.*?>/g, '').trim()
    }
    const userContent = text;
    console.log(userContent);

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

    let rightArea = document.createElement('div');
    rightArea.innerText = 'claude3'; // 设置右边区域的文本为 "claude3"
    rightScrollable.appendChild(rightArea); // 将右边区域添加到可滚动容器中
    outputBox.appendChild(rightScrollable); // 将右边可滚动容器添加到输出框中
    askClaude3(systemContent, userContent, rightArea);

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
    outputBox.style.height = '400px'; // 设置输出框的高度像素
    outputBox.style.width = '100%'; // 设置输出框的宽度为100%
    outputBox.style.display = 'flex'; // 将输出框设置为 flex 容器
    outputBox.style.overflow = 'hidden'; // 防止输出框本身出现滚动条

    // 创建可滚动的左边区域
    let leftScrollable = document.createElement('div');
    leftScrollable.style.width = '50%'; // 设置左边区域的宽度为 50%
    leftScrollable.style.height = '100%'; // 设置左边区域的高度为100%
    leftScrollable.style.overflowY = 'auto'; // 设置垂直滚动条
    leftScrollable.style.borderRight = '1px solid #ddd'; // 给左边区域添加右边框来区分左右两侧
    leftScrollable.style.backgroundColor = '#f9f9f9'; // 设置背景颜色以区分周围内容
    leftScrollable.style.boxShadow = 'inset -5px 0px 5px -5px rgba(0,0,0,0.1)'; // 内阴影效果

    const systemContent = "输出图片的完整信息，要求详细、精确、有条理，说中文";
    let text = imageContextMenu.target.src + '\n';
    if (range != null) {
        text += '图片上下文信息：' + range.toString().replace(/<img.*?>/g, '').trim()
    }
    let userContent = text;
    // 使用 prompt 函数获取用户输入的问题
    let question = prompt("请输入你的问题:");
    if (question) {
        // 如果用户输入了问题,将问题添加到 userContent 中
        userContent += "\n问题: " + question;
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

        let rightArea = document.createElement('div');
        rightArea.innerText = 'claude3'; // 设置右边区域的文本为 "claude3"
        rightScrollable.appendChild(rightArea); // 将右边区域添加到可滚动容器中
        outputBox.appendChild(rightScrollable); // 将右边可滚动容器添加到输出框中
        askClaude3(systemContent, userContent, rightArea);

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

async function askGpt4(systemContent, userContent, area) {
    area.innerText = systemContent + userContent;
    return;
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
        ]
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
    } catch (error) {
        console.error("请求失败:", error);
        // 这里可以根据需要进行错误处理,例如重试或提示用户
    }
}

async function askClaude3(systemContent, userContent, area) {
    area.innerText = systemContent + userContent;
    return;
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
        ]
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
    } catch (error) {
        console.error("请求失败:", error);
        // 这里可以根据需要进行错误处理,例如重试或提示用户
    }
}