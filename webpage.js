let mainElement = null;// 主要内容对应的元素
let parts = []; // 定义一个数组,用于存储mainElement直接子元素的内嵌文本和对应的gptPart

let showFloatingWindow = false;// 定义一个变量,用于控制悬浮窗的显示状态
let floatingWindow = null;// 定义一个变量,用于存储悬浮窗元素

// 监听contextmenu事件
document.addEventListener('contextmenu', function (event) {
    event.preventDefault(); // 阻止默认的右键菜单
    togglePartCorners();
    showFloatingWindow = !showFloatingWindow; // 切换悬浮窗的显示状态
});

// 创建悬浮窗元素
function createFloatingWindow() {
    floatingWindow = document.createElement('div');
    floatingWindow.style.position = 'fixed';
    floatingWindow.style.zIndex = '9999';
    floatingWindow.style.background = 'white';
    floatingWindow.style.border = '1px solid black';
    floatingWindow.style.padding = '10px';
    floatingWindow.style.display = 'none'; // 初始状态下隐藏悬浮窗
    document.body.appendChild(floatingWindow);
}

// 更新悬浮窗的内容和位置
function updateFloatingWindow(part) {
    if (part) {
        floatingWindow.innerText = part.gptPart;
        // 设置悬浮窗的位置,使其显示在 part 上方
        let rect = part.cornerDivs[0].getBoundingClientRect();
        floatingWindow.style.left = rect.left + 'px';
        floatingWindow.style.top = (rect.top - floatingWindow.offsetHeight - 10) + 'px';
        floatingWindow.style.display = 'block'; // 显示悬浮窗
    } else {
        floatingWindow.style.display = 'none'; // 隐藏悬浮窗
    }
}
// 查找鼠标当前覆盖的 part
function findCurrentPart(mouseX, mouseY) {
    // 获取 mainElement 的位置和大小
    let rect = mainElement.getBoundingClientRect();

    // 判断鼠标是否在 mainElement 的区域内
    if (mouseX < rect.left || mouseX > rect.right) {
        // 如果鼠标在横轴方向不在 mainElement 区域内,直接返回 null
        return null;
    }

    // 遍历 parts 数组,查找鼠标当前覆盖的 part
    for (let part of parts) {
        if (mouseY >= part.startY && mouseY <= part.endY) {
            // 如果鼠标在纵轴方向覆盖了当前 part,则返回该 part
            return part;
        }
    }

    // 如果没有找到覆盖的 part,返回 null
    return null;
}

let currentPart = null; // 记录当前鼠标所在的 part
// 监听 mousemove 事件
document.addEventListener('mousemove', function (event) {
    if (showFloatingWindow) {
        let mouseX = event.clientX;
        let mouseY = window.pageYOffset + event.clientY;
        currentPart = findCurrentPart(mouseX, mouseY);
        updateFloatingWindow(currentPart); // 更新悬浮窗的内容和位置
    }
});

// 监听 scroll 事件
window.addEventListener('scroll', function () {
    if (showFloatingWindow && currentPart) {
        updateFloatingWindow(currentPart); // 根据之前记录的 currentPart 来更新悬浮窗位置
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
                currentPart = {
                    text: text,
                    gptPart: null, // 初始化gptPart为null
                    startY: child.offsetTop, // 记录子元素的起始纵坐标
                    endY: child.offsetTop + child.offsetHeight // 记录子元素的结束纵坐标
                };
                parts.push(currentPart);
            } else {
                // 否则,将文本合并到当前的part
                currentPart.text += text;
                currentPart.endY = child.offsetTop + child.offsetHeight; // 更新结束纵坐标
            }
        }
    }

    // 根据 parts 数组,在 mainElement 上创建标识各个 part 的 div 元素,但先不显示
    for (let i = 0; i < parts.length; i++) {
        let part = parts[i];

        // 创建四个 div 元素,分别用于标识 part 的四个角落
        let topLeft = document.createElement('div');
        let topRight = document.createElement('div');
        let bottomLeft = document.createElement('div');
        let bottomRight = document.createElement('div');

        // 设置四个角落 div 的共同样式
        let cornerStyle = {
            position: 'absolute',
            width: '20px',
            height: '20px',
            border: '2px solid green',
            display: 'none' // 先不显示
        };

        // 设置每个角落 div 的特定样式和位置
        Object.assign(topLeft.style, cornerStyle, {
            left: '0',
            top: part.startY + 'px',
            borderRight: 'none',
            borderBottom: 'none'
        });

        Object.assign(topRight.style, cornerStyle, {
            right: '0',
            top: part.startY + 'px',
            borderLeft: 'none',
            borderBottom: 'none'
        });

        Object.assign(bottomLeft.style, cornerStyle, {
            left: '0',
            top: (part.endY - 20) + 'px',
            borderRight: 'none',
            borderTop: 'none'
        });

        Object.assign(bottomRight.style, cornerStyle, {
            right: '0',
            top: (part.endY - 20) + 'px',
            borderLeft: 'none',
            borderTop: 'none'
        });

        // 将四个角落 div 添加到 mainElement 中
        mainElement.appendChild(topLeft);
        mainElement.appendChild(topRight);
        mainElement.appendChild(bottomLeft);
        mainElement.appendChild(bottomRight);

        // 将四个角落 div 存储到 part 对象中,以便后续显示
        part.cornerDivs = [topLeft, topRight, bottomLeft, bottomRight];
    }
}

async function analyzePart(part) {
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
    } catch (error) {
        console.error("请求失败:", error);
        // 这里可以根据需要进行错误处理,例如重试或提示用户
    }
}


// 定义一个start函数,用于在注入脚本后立即执行
async function start() {
    findMainContent();

    extractChildText();

    createFloatingWindow(); // 创建悬浮窗元素

    // 使用 Promise.all 实现并发调用 analyzePart
    await Promise.all(parts.map(analyzePart));

}

// 调用start函数
start();