const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac'
};

// QQ音乐解析函数
async function resolveQQMusicUrl(shareUrl) {
    return new Promise((resolve, reject) => {
        // 访问分享链接，获取重定向URL
        const request = https.get(shareUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            followRedirect: false
        }, (res) => {
            if (res.statusCode === 302 || res.statusCode === 301) {
                const redirectUrl = res.headers.location;
                // 从重定向URL中提取歌曲ID
                const match = redirectUrl.match(/song\/(\w+)/);
                if (match) {
                    const songId = match[1];
                    // 调用QQ音乐API获取音频文件URL
                    const apiUrl = `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?songmid=${songId}&filename=M500${songId}${songId}.mp3&guid=1234567890&cid=205361747&uin=0&fromtag=1`;
                    
                    https.get(apiUrl, { 
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } 
                    }, (apiRes) => {
                        let data = '';
                        apiRes.on('data', chunk => data += chunk);
                        apiRes.on('end', () => {
                            try {
                                const json = JSON.parse(data);
                                if (json.data && json.data.items && json.data.items.length > 0) {
                                    const vkey = json.data.items[0].vkey;
                                    const filename = json.data.items[0].filename;
                                    const realUrl = `http://dl.stream.qqmusic.qq.com/${filename}?vkey=${vkey}&guid=1234567890&uin=0&fromtag=1`;
                                    resolve({ url: realUrl, songId: songId });
                                } else {
                                    reject(new Error('无法获取音频信息'));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        });
                    }).on('error', reject);
                } else {
                    reject(new Error('无法提取歌曲ID'));
                }
            } else {
                // 尝试从响应体中提取信息
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const match = data.match(/songmid['":\s]+(\w+)/);
                        if (match) {
                            const songId = match[1];
                            resolve({ url: null, songId: songId, needApi: true });
                        } else {
                            reject(new Error('无法获取歌曲信息'));
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            }
        });
        
        request.on('error', reject);
        request.setTimeout(10000, () => {
            request.destroy();
            reject(new Error('请求超时'));
        });
    });
}

const server = http.createServer(async (req, res) => {
    // 处理QQ音乐解析API
    if (req.url.startsWith('/api/qq-music')) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const shareUrl = url.searchParams.get('url');
        
        if (!shareUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '缺少url参数' }));
            return;
        }
        
        try {
            const result = await resolveQQMusicUrl(shareUrl);
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(result));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    }
    
    // 处理静态文件请求
    let filePath = path.join(__dirname, decodeURIComponent(req.url === '/' ? 'index.html' : req.url));
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('按 Ctrl+C 停止服务器');
});