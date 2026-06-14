const express = require('express');
const router = express.Router();
const pool = require('../db'); 
const authenticateToken = require('../middleware/authMiddleware'); 

// POST /api/campaigns/join
router.post('/join', authenticateToken, async (req, res) => {
  const { campaign_code } = req.body;
  const userId = req.user.id;

  if (!campaign_code) {
    return res.status(400).json({ error: 'Campaign code is required.' });
  }

  try {
    const campaignResult = await pool.query(
      'SELECT id, campaign_name, dm_user_id FROM campaigns WHERE campaign_code = $1',
      [campaign_code.trim().toUpperCase()]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid campaign code.' });
    }

    const campaign = campaignResult.rows[0];

    if (campaign.dm_user_id === userId) {
      return res.status(409).json({ error: 'You are the DM of this campaign.' });
    }

    const existing = await pool.query(
      'SELECT id FROM campaign_members WHERE campaign_id = $1 AND user_id = $2',
      [campaign.id, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You are already a member of this campaign.' });
    }

    await pool.query(
      `INSERT INTO campaign_members (campaign_id, user_id, role, status)
       VALUES ($1, $2, 'player', 'active')`,
      [campaign.id, userId]
    );

    res.status(201).json({
      message: 'Successfully joined campaign.',
      campaign: { id: campaign.id, name: campaign.campaign_name }
    });
  } catch (err) {
    console.error('Error joining campaign:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/campaigns/my - list campaigns the user belongs to
router.get('/my', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT c.id, c.campaign_name, c.campaign_code, cm.role, cm.status
       FROM campaigns c
       JOIN campaign_members cm ON cm.campaign_id = c.id
       WHERE cm.user_id = $1`,
      [userId]
    );

    res.json({ campaigns: result.rows });
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
