let lastElement = null; // 记录上一次的元素

document.addEventListener('mousedown', function(event) {
    if (event.button === 2) { // 右键按下
        document.addEventListener('mousemove', handleMouseMove); // 监听鼠标移动
    }
});

document.addEventListener('mouseup', function(event) {
    if (event.button === 2) { // 右键松开
        document.removeEventListener('mousemove', handleMouseMove); // 移除鼠标移动监听
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
        console.log('鼠标指向元素:', element); // 打印当前鼠标指向的元素
        element.style.border = '2px solid red'; // 为当前元素添加边框
        lastElement = element;
    }
}