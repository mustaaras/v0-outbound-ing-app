-- Seed strategies data for domain selling outreach
INSERT INTO strategies (name, description, tier, prompt) VALUES
  -- Free tier strategies (3)
  (
    'Direct Value Pitch',
    'Straightforward pitch highlighting the domain''s value and potential',
    'free',
    'Write a cold email to sell the domain {domain} to {recipient}. Clearly explain why this domain is valuable, its potential for their business, and create urgency. Be direct and professional. Maximum 150 words.'
  ),
  (
    'Brandability Focus',
    'Emphasize how memorable and brandable the domain name is',
    'free',
    'Write a cold email to sell the domain {domain} to {recipient}. Focus on the brandability, memorability, and marketing advantages of this domain name. Explain how it could strengthen their brand identity. Maximum 150 words.'
  ),
  (
    'Industry Match',
    'Position the domain as perfect for their specific industry',
    'free',
    'Write a cold email to sell the domain {domain} to {recipient}. Demonstrate how this domain is perfectly suited for their industry or niche. Show understanding of their business and why this domain fits their needs. Maximum 150 words.'
  ),
  
  -- Pro tier strategies (17)
  (
    'SEO Authority Angle',
    'Highlight SEO benefits and search visibility advantages',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Emphasize the SEO advantages, keyword relevance, and organic traffic potential of this domain. Use specific SEO terminology and benefits. Maximum 200 words.'
  ),
  (
    'Competitive Advantage',
    'Show how owning this domain gives them an edge over competitors',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Position this domain as a competitive advantage that could keep it away from competitors. Create FOMO around competitors potentially acquiring it. Maximum 200 words.'
  ),
  (
    'Investment Opportunity',
    'Frame the domain as a valuable digital asset and investment',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Present this domain as a smart investment and valuable digital asset. Discuss appreciation potential and long-term value. Be sophisticated and investment-focused. Maximum 200 words.'
  ),
  (
    'Short & Premium',
    'Emphasize the rarity and premium nature of short/valuable domains',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Highlight the premium nature, short length, or rarity of this domain. Explain why premium domains command higher prices and are worth the investment. Maximum 200 words.'
  ),
  (
    'Market Expansion',
    'Position the domain as key to entering new markets',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Show how this domain could facilitate their market expansion, geographic growth, or entry into new customer segments. Be strategic and growth-focused. Maximum 200 words.'
  ),
  (
    'Trust & Credibility',
    'Focus on how the domain builds instant trust and credibility',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Emphasize how this domain instantly conveys trust, professionalism, and credibility. Explain the psychological impact of a great domain on customers. Maximum 200 words.'
  ),
  (
    'Traffic & Revenue',
    'Highlight existing traffic, type-ins, or revenue potential',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Focus on traffic potential, direct type-in visitors, and revenue generation opportunities. Use data-driven language about monetization. Maximum 200 words.'
  ),
  (
    'Exact Match Keywords',
    'Emphasize exact match keyword benefits and relevance',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Highlight that this domain contains exact match keywords for their industry/niche. Explain the marketing and SEO advantages of exact match domains. Maximum 200 words.'
  ),
  (
    'Global Appeal',
    'Show the domain''s international potential and broad appeal',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Emphasize the domain''s global appeal, international recognition, and cross-cultural marketability. Perfect for businesses with worldwide ambitions. Maximum 200 words.'
  ),
  (
    'Product Launch Ready',
    'Position domain as perfect for launching a new product/service',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Frame this domain as ideal for launching a new product, service, or business venture. Create excitement about new possibilities. Maximum 200 words.'
  ),
  (
    'Defensive Registration',
    'Suggest protecting their brand by acquiring the domain',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Position this as a defensive acquisition to protect their brand, prevent competitors from getting it, or secure related brand assets. Security-focused. Maximum 200 words.'
  ),
  (
    'Age & History',
    'Leverage domain age, history, or established presence',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Emphasize the domain''s age, established history, and built-in authority. Explain why aged domains are more valuable than new registrations. Maximum 200 words.'
  ),
  (
    'Extension Premium',
    'Highlight the value of having the .com or premium TLD',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Focus on the premium nature of the .com extension (or other premium TLD) and why it''s superior to alternatives. Emphasize .com dominance and trust. Maximum 200 words.'
  ),
  (
    'Time-Sensitive Offer',
    'Create urgency with limited-time pricing or availability',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Create genuine urgency with a time-sensitive offer, limited availability, or other interested parties. Make them act quickly without being pushy. Maximum 200 words.'
  ),
  (
    'Success Story Parallel',
    'Reference similar domains and their success stories',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Draw parallels to similar successful domains or companies that built empires on great domain names. Inspire them with success stories. Maximum 200 words.'
  ),
  (
    'Consultant Recommendation',
    'Position yourself as a domain consultant offering expert advice',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Approach as a knowledgeable domain consultant offering expert insight. Provide genuine value and strategic advice about their domain needs. Consultative selling. Maximum 200 words.'
  ),
  (
    'Partnership Proposal',
    'Offer creative deal structures or partnership opportunities',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Propose creative deal structures like payment plans, partnerships, or revenue sharing. Be flexible and collaborative in tone. Show willingness to work together. Maximum 200 words.'
  ),
  (
    'Viral Marketing Potential',
    'Emphasize how memorable the domain is for word-of-mouth growth',
    'pro',
    'Write a cold email to sell the domain {domain} to {recipient}. Highlight the domain''s viral marketing potential, word-of-mouth advantages, and how easily customers will remember and share it. Focus on organic growth benefits. Maximum 200 words.'
  )
ON CONFLICT DO NOTHING;
