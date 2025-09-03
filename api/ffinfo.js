const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
    // Basic API setup and validation
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { uid } = req.query;
    if (!uid || !/^[0-9]+$/.test(uid)) {
        return res.status(400).json({ error: 'A valid UID query parameter is required.' });
    }

    let browser = null;

    try {
        // Launching the browser with serverless-optimized settings
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        const targetUrl = 'https://freefireinfo.in/get-free-fire-account-information-via-uid/';
        await page.goto(targetUrl);

        // Interacting with the form on the page
        await page.type('input[name="uid"]', uid);
        await page.click('button[type="submit"]');

        // Waiting for the result table to show up (max 15 seconds)
        await page.waitForSelector('table', { timeout: 15000 });

        // Running JavaScript on the result page to extract all data at once
        const playerData = await page.evaluate(() => {
            const data = {};
            const allRows = document.querySelectorAll('table tr');

            const extractData = (label) => {
                for (const row of allRows) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length === 2 && cells[0].textContent.trim() === label) {
                        return cells[1].textContent.trim();
                    }
                }
                return null;
            };

            data.nickname = extractData('Nickname');
            if (!data.nickname) { // If nickname isn't found, the player is invalid
                return { error: 'Player not found or invalid UID.' };
            }
            
            data.likes = parseInt(extractData('Total Likes'), 10) || 0;
            data.level = parseInt(extractData('Level'), 10) || 0;
            data.experience = parseInt(extractData('Experience'), 10) || 0;
            data.honor_score = parseInt(extractData('Honor Score'), 10) || 0;
            data.last_login = extractData('Last Seen');
            data.account_created = extractData('Create Time');
            data.bio = extractData('Signature');
            data.booyah_pass_level = parseInt(extractData('Booyah Pass'), 10) || 0;
            data.equipped_pet = extractData('Pet');

            // Parsing complex fields like Rank and Guild
            const brRankRaw = extractData('BR Rank') || '';
            const [br_rank, br_points_str] = brRankRaw.replace(')', '').split(' (');
            data.br_rank = br_rank || "N/A";
            data.br_points = parseInt(br_points_str, 10) || 0;

            const csRankRaw = extractData('CS Rank') || '';
            const [cs_rank, cs_points_str] = csRankRaw.replace(')', '').split(' (');
            data.cs_rank = cs_rank || "N/A";
            data.cs_points = parseInt(cs_points_str, 10) || 0;

            const guildRaw = extractData('Guild') || '';
            const guildMatch = guildRaw.match(/(.+?) \(ID: (\d+)\) Role: (.+)/);
            data.guild = guildMatch ? { name: guildMatch[1].trim(), id: guildMatch[2], role: guildMatch[3].trim() } : { name: 'No Guild', id: null, role: null };

            return data;
        });

        if (playerData.error) {
            return res.status(404).json({ error: playerData.error });
        }

        res.status(200).json({ uid, ...playerData });

    } catch (error) {
        console.error("Puppeteer error:", error.message);
        if (error.name === 'TimeoutError') {
            res.status(404).json({ error: 'Player not found or the source website took too long to respond.' });
        } else {
            res.status(500).json({ error: 'An internal server error occurred while scraping.' });
        }
    } finally {
        // ALWAYS close the browser
        if (browser !== null) {
            await browser.close();
        }
    }
};
