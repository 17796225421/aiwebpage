let lastElement = null; // 记录上一次的元素
let isLeftClickDisabled = false; // 是否禁用左键点击的标志
const selectedElement = new Map(); // 用于存储选中的元素和其内嵌文本

document.addEventListener('mousedown', function (event) {
    if (event.button === 2) { // 右键按下
        isLeftClickDisabled = true; // 设置禁用左键点击的标志为 true
        document.addEventListener('mousemove', handleMouseMove); // 监听鼠标移动
        document.addEventListener('click', handleLeftClick, {capture: true}); // 在捕获阶段监听左键点击
        document.addEventListener('keydown', handleKeyDown); // 监听键盘按下事件
    }
});

document.addEventListener('mouseup', function (event) {
    if (event.button === 2) { // 右键松开
        isLeftClickDisabled = false; // 设置禁用左键点击的标志为 false
        document.removeEventListener('mousemove', handleMouseMove); // 移除鼠标移动监听
        document.removeEventListener('click', handleLeftClick, {capture: true}); // 移除左键点击监听
        document.removeEventListener('keydown', handleKeyDown); // 移除键盘按下事件监听
        if (lastElement) {
            lastElement.style.border = ''; // 清除边框
            lastElement = null;
        }
    }
});

document.addEventListener('contextmenu', function (event) {
    event.preventDefault(); // 阻止默认的右键菜单
});

function handleMouseMove(event) {
    const element = document.elementFromPoint(event.clientX, event.clientY); // 获取鼠标指向的元素
    if (element !== lastElement) { // 与上一次元素不同
        if (lastElement) {
            lastElement.style.border = ''; // 清除上一次元素的边框
        }
        element.style.border = '2px solid red'; // 为当前元素添加边框
        lastElement = element;
    }
}

function handleLeftClick(event) {
    if (isLeftClickDisabled) {
        event.preventDefault(); // 阻止左键点击的默认操作
        event.stopPropagation(); // 阻止事件冒泡
        if (lastElement) {
            const text = lastElement.textContent; // 获取元素的内嵌文本
            const path = getElementPath(lastElement); // 获取元素的唯一路径
            if (selectedElement.has(path)) {
                // 如果哈希表中已经存在该元素,则从哈希表中删除,并取消绿色背景和边距
                selectedElement.delete(path);
                lastElement.style.backgroundColor = '';
                lastElement.style.padding = '';
            } else {
                // 如果哈希表中不存在该元素,则加入哈希表,并设置绿色背景和边距
                selectedElement.set(path, text);
                lastElement.style.backgroundColor = 'SeaGreen';
                lastElement.style.padding = '30px'; // 添加内边距,增加元素间距
            }
            console.log(selectedElement);
        }
    }
}

// 处理键盘按下事件
function handleKeyDown(event) {
    if (event.key === 'w' && lastElement) {
        const parentElement = lastElement.parentNode; // 获取当前元素的父元素
        if (parentElement) {
            // 将红色边框应用于父元素
            parentElement.style.border = '2px solid red';
            lastElement.style.border = ''; // 清除当前元素的边框
            lastElement = parentElement; // 更新 lastElement 为父元素
        }
    }
}

/**
 * 获取元素的唯一路径
 * @param {Element} element - 目标元素
 * @returns {string} - 元素的唯一路径
 */
function getElementPath(element) {
    const path = [];
    while (element.parentNode) {
        let siblingIndex = 1;
        let sibling = element;
        while (sibling.previousSibling) {
            sibling = sibling.previousSibling;
            if (sibling.nodeType === 1 && sibling.nodeName === element.nodeName) {
                siblingIndex++;
            }
        }
        path.unshift(element.nodeName.toLowerCase() + (siblingIndex > 1 ? siblingIndex : ''));
        element = element.parentNode;
    }
    return path.join('>');
}