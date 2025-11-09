-- Remove Digital Products category and replace with E-commerce & Dropshipping
DELETE FROM strategies WHERE category = 'Digital Products';

-- E-commerce & Dropshipping (12 strategies: 2 free, 10 pro)
INSERT INTO strategies (name, description, tier, category, input_fields, prompt) VALUES
  (
    'Product Launch Email',
    'Announce a new product to potential customers',
    'free',
    'E-commerce & Dropshipping',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an announcement email to {recipient} for the new product launch: {subject}. Create excitement, explain the benefits, and include a clear call-to-action. Maximum 150 words.'
  ),
  (
    'Flash Sale Promotion',
    'Create urgency with a limited-time sale',
    'free',
    'E-commerce & Dropshipping',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} announcing a flash sale for {subject}. Create urgency with limited time and stock. Maximum 150 words.'
  ),
  (
    'Abandoned Cart Recovery',
    'Bring customers back to complete their purchase',
    'pro',
    'E-commerce & Dropshipping',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write a friendly email to {recipient} reminding them about {subject} left in their cart. Offer assistance and create urgency. Maximum 200 words.'
  ),
  (
    'New Customer Welcome',
    'Welcome first-time buyers and encourage repeat purchase',
    'pro',
    'E-commerce & Dropshipping',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write a welcome email to {recipient} after their first purchase of {subject}. Thank them, offer support, and suggest related products. Maximum 200 words.'
  ),
  (
    'Product Bundle Offer',
    'Sell multiple products together at a discount',
    'pro',
    'E-commerce & Dropshipping',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering a product bundle with {subject}. Emphasize value and savings. Maximum 200 words.'
  ),
  (
    'Seasonal Collection',
    'Promote seasonal or holiday products',
    'pro',
    'E-commerce & Dropshipping',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} introducing seasonal collection featuring {subject}. Create excitement around the season. Maximum 200 words.'
  ),
  (
    'Free Shipping Offer',
    'Promote free shipping to increase conversions',
    'pro',
    'E-commerce & Dropshipping',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} announcing free shipping for {subject}. Emphasize the savings and limited time. Maximum 200 words.'
  ),
  (
    'Back in Stock Alert',
    'Notify customers when popular items return',
    'pro',
    'E-commerce & Dropshipping',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} announcing {subject} is back in stock. Create urgency before it sells out again. Maximum 200 words.'
  ),
  (
    'Loyalty Rewards',
    'Reward repeat customers with exclusive offers',
    'pro',
    'E-commerce & Dropshipping',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering loyalty rewards for {subject}. Show appreciation for their continued business. Maximum 200 words.'
  ),
  (
    'Customer Review Request',
    'Ask satisfied customers to leave reviews',
    'pro',
    'E-commerce & Dropshipping',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} requesting a review for {subject}. Make it easy and show how reviews help. Maximum 200 words.'
  ),
  (
    'Cross-Sell Recommendation',
    'Suggest complementary products',
    'pro',
    'E-commerce & Dropshipping',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} recommending products that complement their purchase of {subject}. Be helpful, not pushy. Maximum 200 words.'
  ),
  (
    'VIP Early Access',
    'Give loyal customers early access to new products',
    'pro',
    'E-commerce & Dropshipping',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering VIP early access to {subject}. Make them feel special and valued. Maximum 200 words.'
  );
