const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const channelUrl = req.query.url || 'https://www.youtube.com/@BeastBoyShub/videos';

        try {
            const browser = await puppeteer.launch({
                args: chromium.args,
                executablePath: await chromium.executablePath,
                headless: chromium.headless,
            });
            const page = await browser.newPage();
            await page.goto(channelUrl, { waitUntil: 'networkidle2' });

            const videoData = await page.evaluate(() => {
                const videos = [];
                document.querySelectorAll('ytd-grid-video-renderer').forEach(video => {
                    const title = video.querySelector('#video-title').innerText;
                    const link = video.querySelector('#video-title').href;
                    const thumbnail = video.querySelector('img').src;
                    const url = new URL(link);
                    const videoId = url.searchParams.get("v") || url.pathname.split("/").pop();
                    const embedLink = `https://www.youtube.com/embed/${videoId}`;
                    videos.push({ title, link, thumbnail, embedLink });
                });
                return videos;
            });

            await browser.close();

            res.status(200).json(videoData);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'An error occurred while scraping.' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

