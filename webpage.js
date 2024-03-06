let mainElement = null;

function findMainContent() {
    console.log("开始查找");
    // 获取所有元素
    let elements = [document.body];
    let maxScore = 0;
    let tmpMainElement = null;

    // 遍历所有元素,对每个元素评分
    while (elements.length > 0) {
        let element = elements.shift();

        // 如果元素宽度低于30%,跳过该元素及其子元素
        if (element.offsetWidth / window.innerWidth < 0.3) {
            continue;
        }
        // 如果元素高度低于30%,跳过该元素及其子元素
        if (element.offsetHeight / window.innerHeight < 0.3) {
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

        console.log("得分 " + score);
    }

    // 移除之前的红框样式
    if (mainElement) {
        mainElement.style.border = '';
    }

    mainElement = tmpMainElement;

    // 用红框标出主要元素
    mainElement.style.border = "1px solid red";
}

// 定义一个start函数,用于在注入脚本后立即执行
function start() {
    document.addEventListener('contextmenu', function (event) {
        event.preventDefault(); // 阻止默认的右键菜单
    });

    // 每5秒调用一次findMainContent函数
    setInterval(findMainContent, 5000);
}

// 调用start函数
start();