-- Replace Digital Products category with Affiliate Marketing
UPDATE strategies 
SET category = 'Affiliate Marketing'
WHERE category = 'Digital Products';

-- Delete old Digital Products strategies
DELETE FROM strategies WHERE category = 'Digital Products';

-- Add new Affiliate Marketing strategies (11 strategies: 2 free, 9 pro)
INSERT INTO strategies (name, description, tier, category, input_fields, prompt) VALUES
  (
    'Commission Opportunity',
    'Pitch a high-paying affiliate partnership',
    'free',
    'Affiliate Marketing',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering an affiliate partnership for {subject}. Highlight the commission rate, conversion potential, and why their audience would love this product. Maximum 150 words.'
  ),
  (
    'Product Launch Promotion',
    'Invite affiliates to promote a new product launch',
    'free',
    'Affiliate Marketing',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} inviting them to promote the launch of {subject}. Explain the timing opportunity and exclusive bonuses for early promoters. Maximum 150 words.'
  ),
  (
    'High Converter Pitch',
    'Emphasize proven conversion rates',
    'pro',
    'Affiliate Marketing',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} highlighting the high conversion rates of {subject}. Include specific metrics, average order value, and EPC data. Make the numbers compelling. Maximum 200 words.'
  ),
  (
    'Exclusive Affiliate Offer',
    'Offer exclusive bonuses or higher commission',
    'pro',
    'Affiliate Marketing',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering exclusive affiliate terms for {subject}. Highlight special commission rates, bonuses, or early access that makes them feel valued. Maximum 200 words.'
  ),
  (
    'Audience Alignment',
    'Show perfect fit between product and their audience',
    'pro',
    'Affiliate Marketing',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} explaining why {subject} is a perfect match for their audience. Reference their content style, niche, and follower demographics. Maximum 200 words.'
  ),
  (
    'Recurring Commission',
    'Highlight ongoing passive income opportunity',
    'pro',
    'Affiliate Marketing',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} emphasizing the recurring commission structure of {subject}. Focus on building passive income and long-term earnings. Maximum 200 words.'
  ),
  (
    'Marketing Materials Provided',
    'Emphasize ready-to-use promotional assets',
    'pro',
    'Affiliate Marketing',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} highlighting all the marketing materials provided for {subject}. Mention email swipes, banners, social media content, and how easy promotion will be. Maximum 200 words.'
  ),
  (
    'Cookie Duration Advantage',
    'Highlight long cookie window for affiliates',
    'pro',
    'Affiliate Marketing',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} emphasizing the extended cookie duration for {subject}. Explain how this increases their earning potential. Maximum 200 words.'
  ),
  (
    'Bonus Structure',
    'Pitch performance bonuses and tiers',
    'pro',
    'Affiliate Marketing',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} explaining the bonus structure for {subject} affiliates. Detail performance tiers and how top performers earn more. Maximum 200 words.'
  ),
  (
    'Webinar Partnership',
    'Invite to co-host a promotional webinar',
    'pro',
    'Affiliate Marketing',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} inviting them to co-host a promotional webinar for {subject}. Explain the format, commission structure, and value for their audience. Maximum 200 words.'
  ),
  (
    'Affiliate Success Story',
    'Share earnings from other successful affiliates',
    'pro',
    'Affiliate Marketing',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} sharing success stories of top affiliates promoting {subject}. Include specific earnings and strategies. Create FOMO and aspiration. Maximum 200 words.'
  ),
  (
    'Limited Spots Available',
    'Create urgency with limited affiliate program spots',
    'pro',
    'Affiliate Marketing',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} announcing limited spots in the {subject} affiliate program. Create urgency while maintaining credibility. Maximum 200 words.'
  )
ON CONFLICT DO NOTHING;
