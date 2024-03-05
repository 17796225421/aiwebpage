let lastElement = null; // 记录上一次的元素
let isLeftClickDisabled = false; // 是否禁用左键点击的标志

document.addEventListener('mousedown', function(event) {
    if (event.button === 2) { // 右键按下
        isLeftClickDisabled = true; // 设置禁用左键点击的标志为 true
        document.addEventListener('mousemove', handleMouseMove); // 监听鼠标移动
        document.addEventListener('click', handleLeftClick, { capture: true }); // 在捕获阶段监听左键点击
    }
});


document.addEventListener('mouseup', function(event) {
    if (event.button === 2) { // 右键松开
        isLeftClickDisabled = false; // 设置禁用左键点击的标志为 false
        document.removeEventListener('mousemove', handleMouseMove); // 移除鼠标移动监听
        document.removeEventListener('click', handleLeftClick, { capture: true }); // 移除左键点击监听
        if (lastElement) {
            lastElement.style.border = ''; // 清除边框
            lastElement = null;
        }
    }
});
document.addEventListener('contextmenu', function(event) {
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
        // 执行您需要的操作
        if (lastElement) {
            const innerText = lastElement.innerText; // 获取选中元素的内嵌文本
            console.log(innerText); // 打印内嵌文本
            lastElement.style.color = 'green'; // 将选中元素的文字颜色设置为绿色
            const innerElements = lastElement.getElementsByTagName('*'); // 获取选中元素内部的所有元素
            for (let i = 0; i < innerElements.length; i++) {
                innerElements[i].style.color = 'green'; // 将每个内部元素的文字颜色设置为绿色
            }
        }
    }
}