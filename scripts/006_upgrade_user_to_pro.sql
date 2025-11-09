-- Upgrade specific user to Pro tier
UPDATE users 
SET tier = 'pro'
WHERE email = 'huldil@icloud.com';
