const apiUrl = 'https://sapi.onechat.fun/v1/chat/completions';
const apiKey = 'sk-keajPSyenhp0c4SmEc8f3eE21c35405e8e02F872D03bD12f';

// 定义每个分块的最大长度
const MAX_CHUNK_LENGTH = 200;

export async function extractWebpageContent(text) {
    // 将长文本分块
    const chunks = splitTextIntoChunks(text, MAX_CHUNK_LENGTH);

    // 并发请求所有分块
    const requests = chunks.map(chunk => requestExtraction(chunk));

    // 等待所有请求完成
    const results = await Promise.all(requests);

    // 将结果拼装起来
    const extractedContent = results.join('\n');

    return extractedContent;
}

// 将长文本分块的函数
function splitTextIntoChunks(text, maxLength) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        // 找到最近的换行符作为分块的结束位置
        let end = text.indexOf('\n', start + maxLength);
        if (end === -1) {
            end = text.length;
        }
        const chunk = text.slice(start, end);
        chunks.push(chunk);
        start = end + 1;
    }
    return chunks;
}

// 发送单个分块请求的函数
async function requestExtraction(text) {
    const requestBody = {
        model: 'gpt-3.5-turbo-0125',
        stream: false,
        messages: [
            {
                role: 'system',
                content: '你是一个专业的网页正文提取工具,请只返回提取结果,不要包含任何解释说明或其他无关文字。'
            },
            {
                role: 'user',
                content: `请从下面的网页源码中提取正文内容,要求:
                1. 只提取网页的标题、小标题、正文,不要带有"标题:"、"小标题:"、"正文:"等前缀
                2. 去除导航栏、广告、推荐内容、评论、版权说明等无关内容
                3. 按照文章先后顺序排列提取的内容  
                4. 不要包含任何HTML标签
                5. 将提取结果翻译成中文
                
                网页源码:
                ${text}`
            }
        ]
    };

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
    const content = responseData.choices[0].message.content;

    return content;
}