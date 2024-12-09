const express = require('express');
const bodyParser = require('body-parser');
const ftp = require('basic-ftp');
const fs = require('fs');
require('dotenv').config();

const app = express();
const tempDir = './temp'; // 로컬 임시 디렉토리

// 임시 디렉토리 생성
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

app.use(bodyParser.json({ limit: '10mb' }));

app.post('/upload', async (req, res) => {
    const client = new ftp.Client();
    try {
        const { image, filename } = req.body;

        // Base64 디코딩 및 파일 저장
        const base64Data = image.replace(/^data:image\/png;base64,/, '');
        const tempFilePath = `${tempDir}/${filename}`;
        fs.writeFileSync(tempFilePath, base64Data, 'base64');

        // FTP 업로드
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: true
        });
        await client.uploadFrom(tempFilePath, `/web/img/ftp_event/${filename}`);

        const publicUrl = `http://yogibo.kr/web/img/ftp_event/${filename}`;
        res.json({ success: true, url: publicUrl });

        // 임시 파일 삭제
        fs.unlinkSync(tempFilePath);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    } finally {
        client.close();
    }
});

// 서버 실행
app.listen(4300, () => {
    console.log('Server running on http://localhost:4300');
});
