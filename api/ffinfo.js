const axios = require('axios');
const cheerio = require('cheerio');

// Helper function to extract data
const extractData = ($, label) => {
    const element = $(`td:contains("${label}")`).next('td');
    return element.text().trim();
};

module.exports = async (req, res) => {
    // Allow CORS for all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { uid } = req.query;

    if (!uid || !/^[0-9]+$/.test(uid)) {
        return res.status(400).json({ error: 'A valid UID query parameter is required.' });
    }

    const targetUrl = 'https://freefireinfo.in/get-free-fire-account-information-via-uid/';

    try {
        const response = await axios.post(targetUrl, new URLSearchParams({ uid }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        if ($('body').text().includes('Player Not Found') || $('table').length === 0) {
            return res.status(404).json({ error: 'Player not found or invalid UID.' });
        }

        const brRankRaw = extractData($, 'BR Rank');
        const [br_rank, br_points_str] = brRankRaw.replace(')', '').split(' (');
        
        const csRankRaw = extractData($, 'CS Rank');
        const [cs_rank, cs_points_str] = csRankRaw.replace(')', '').split(' (');

        const guildRaw = extractData($, 'Guild');
        const guildMatch = guildRaw.match(/(.+?) \(ID: (\d+)\) Role: (.+)/);

        const playerData = {
            uid: uid,
            nickname: extractData($, 'Nickname'),
            likes: parseInt(extractData($, 'Total Likes'), 10) || 0,
            level: parseInt(extractData($, 'Level'), 10) || 0,
            experience: parseInt(extractData($, 'Experience'), 10) || 0,
            honor_score: parseInt(extractData($, 'Honor Score'), 10) || 0,
            br_rank: br_rank || "N/A",
            br_points: parseInt(br_points_str, 10) || 0,
            cs_rank: cs_rank || "N/A",
            cs_points: parseInt(cs_points_str, 10) || 0,
            last_login: extractData($, 'Last Seen'),
            account_created: extractData($, 'Create Time'),
            bio: extractData($, 'Signature'),
            booyah_pass_level: parseInt(extractData($, 'Booyah Pass'), 10) || 0,
            equipped_pet: extractData($, 'Pet'),
            guild: guildMatch ? {
                name: guildMatch[1].trim(),
                id: guildMatch[3],
                role: guildMatch[4].trim()
            } : { name: 'No Guild', id: null, role: null }
        };

        res.status(200).json(playerData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
};
