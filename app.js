const express = require('express');
const bodyParser = require('body-parser');
const ftp = require('basic-ftp');
const fs = require('fs');
require('dotenv').config(); // dotenv로 환경 변수 로드

const app = express();
app.use(bodyParser.json({ limit: '10mb' })); // Base64 이미지 데이터 처리

app.post('/upload', async (req, res) => {
    try {
        const { image, filename } = req.body;

        // Base64 디코딩
        const base64Data = image.replace(/^data:image\/png;base64,/, '');
        const tempFilePath = `/web/img/ftp_event/${filename}`;
        fs.writeFileSync(tempFilePath, base64Data, 'base64');

        // FTP 업로드
        const client = new ftp.Client();
        client.ftp.verbose = true;

        try {
            await client.access({
                host: process.env.FTP_HOST,
                user: process.env.FTP_USER,
                password: process.env.FTP_PASSWORD,
                secure: true
            });
            await client.uploadFrom(tempFilePath, `/web/img/ftp_event/${filename}`);
            res.json({
                success: true,
                url: `http://yogibo.kr/${filename}`
            });
        } finally {
            client.close();
        }

        // 임시 파일 삭제
        fs.unlinkSync(tempFilePath);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

// 서버 실행
app.listen(4300, () => {
    console.log('Server running on http://localhost:4300');
});
