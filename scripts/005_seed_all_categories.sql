-- Clear existing strategies
TRUNCATE TABLE strategies CASCADE;

-- SaaS & Startup Outreach (12 strategies: 2 free, 10 pro)
INSERT INTO strategies (name, description, tier, category, input_fields, prompt) VALUES
  (
    'Product Demo Pitch',
    'Generate an email inviting potential customers to try a SaaS demo',
    'free',
    'SaaS & Startup',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write a short, value-driven email inviting {recipient} to try the SaaS product "{subject}". Focus on solving their pain points and the value they will get from a demo. Be enthusiastic but professional. Maximum 150 words.'
  ),
  (
    'Free Trial Offer',
    'Invite users to start a free trial',
    'free',
    'SaaS & Startup',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write a compelling email to {recipient} offering a free trial of "{subject}". Highlight the benefits and make it easy to get started. Maximum 150 words.'
  ),
  (
    'Pain Point Solution',
    'Identify a customer problem and position your SaaS as the solution',
    'pro',
    'SaaS & Startup',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write a personalized cold email to {recipient} showing how the SaaS product "{subject}" solves a key problem they likely face. Research their business type and show deep understanding of their challenges. Maximum 200 words.'
  ),
  (
    'Feature Announcement',
    'Send an update about a new feature release',
    'pro',
    'SaaS & Startup',
    ARRAY['product_name', 'feature_name', 'recipient_name', 'recipient_email'],
    'Write an update email to {recipient} announcing a new feature for "{subject}". Explain how this feature improves their workflow and creates value. Be excited and clear about the benefits. Maximum 200 words.'
  ),
  (
    'Competitor Comparison',
    'Show how your product is better than competitors',
    'pro',
    'SaaS & Startup',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} comparing "{subject}" to their current solution. Be respectful but show clear advantages. Use specific features and benefits. Maximum 200 words.'
  ),
  (
    'ROI Calculator',
    'Show the financial value of using your product',
    'pro',
    'SaaS & Startup',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} demonstrating the ROI of "{subject}". Use numbers, time savings, and cost reductions. Be specific and credible. Maximum 200 words.'
  ),
  (
    'Case Study Share',
    'Share a success story from a similar customer',
    'pro',
    'SaaS & Startup',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} sharing a case study of how "{subject}" helped a similar company. Include metrics and outcomes. Maximum 200 words.'
  ),
  (
    'Integration Announcement',
    'Announce a new integration that might interest them',
    'pro',
    'SaaS & Startup',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} announcing a new integration for "{subject}" with tools they likely use. Explain how this makes their workflow seamless. Maximum 200 words.'
  ),
  (
    'Onboarding Assistance',
    'Offer help getting started with your product',
    'pro',
    'SaaS & Startup',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write a helpful email to {recipient} offering personalized onboarding for "{subject}". Make it feel like white-glove service. Maximum 200 words.'
  ),
  (
    'Limited Time Discount',
    'Create urgency with a special offer',
    'pro',
    'SaaS & Startup',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering a limited-time discount for "{subject}". Create urgency while maintaining professionalism. Maximum 200 words.'
  ),
  (
    'Annual Plan Upgrade',
    'Encourage switching to annual billing',
    'pro',
    'SaaS & Startup',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} highlighting the benefits of annual billing for "{subject}". Focus on savings and convenience. Maximum 200 words.'
  ),
  (
    'Webinar Invitation',
    'Invite to a product webinar or training',
    'pro',
    'SaaS & Startup',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an invitation email to {recipient} for a webinar about "{subject}". Explain what they will learn and why it is valuable. Maximum 200 words.'
  ),

-- Freelancers & Agencies (11 strategies: 2 free, 9 pro)
  (
    'Portfolio Pitch',
    'Share past projects and pitch your service to a potential client',
    'free',
    'Freelancers & Agencies',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering freelance services in {subject}. Reference past successful projects and demonstrate expertise. Be confident but not arrogant. Maximum 150 words.'
  ),
  (
    'Follow-Up Reminder',
    'Gentle follow-up after no response',
    'free',
    'Freelancers & Agencies',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write a friendly follow-up email to {recipient} about your previous offer for {subject} services. Be polite and add new value in the follow-up. Don''t be pushy. Maximum 150 words.'
  ),
  (
    'Service Offer Proposal',
    'Offer to improve something specific about their site or marketing',
    'pro',
    'Freelancers & Agencies',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write a cold email to {recipient} proposing improvements to their website or marketing using {subject} services. Point out specific areas where they could improve. Be helpful, not critical. Maximum 200 words.'
  ),
  (
    'Quick Win Offer',
    'Offer a small project to prove your value',
    'pro',
    'Freelancers & Agencies',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering a quick, low-risk project in {subject}. Make it easy to say yes. Maximum 200 words.'
  ),
  (
    'Niche Expertise',
    'Highlight your specialization in their industry',
    'pro',
    'Freelancers & Agencies',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} emphasizing your expertise in their industry for {subject}. Show understanding of their unique challenges. Maximum 200 words.'
  ),
  (
    'Fixed Price Package',
    'Pitch a packaged service at a fixed price',
    'pro',
    'Freelancers & Agencies',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering a fixed-price package for {subject}. Make pricing clear and transparent. Maximum 200 words.'
  ),
  (
    'Retainer Proposal',
    'Pitch ongoing monthly services',
    'pro',
    'Freelancers & Agencies',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} proposing a monthly retainer for {subject} services. Explain the benefits of ongoing support. Maximum 200 words.'
  ),
  (
    'Referral Introduction',
    'Reach out based on a mutual connection',
    'pro',
    'Freelancers & Agencies',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} mentioning a mutual connection and offering {subject} services. Build trust through the referral. Maximum 200 words.'
  ),
  (
    'Problem Spotted',
    'Point out an issue you noticed and offer to fix it',
    'pro',
    'Freelancers & Agencies',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} tactfully pointing out an issue with their online presence and offering {subject} services to fix it. Be helpful, not judgmental. Maximum 200 words.'
  ),
  (
    'Seasonal Opportunity',
    'Pitch services relevant to upcoming season or event',
    'pro',
    'Freelancers & Agencies',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering {subject} services for an upcoming season or event. Create timely relevance. Maximum 200 words.'
  ),
  (
    'Results Guarantee',
    'Offer a results-based guarantee',
    'pro',
    'Freelancers & Agencies',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering {subject} services with a results guarantee. Build confidence and reduce risk. Maximum 200 words.'
  ),

-- Real Estate Outreach (10 strategies: 2 free, 8 pro)
  (
    'Property Pitch',
    'Introduce a property for sale or rent to a buyer',
    'free',
    'Real Estate',
    ARRAY['property_address', 'recipient_name', 'recipient_email'],
    'Write a property pitch email to {recipient} about the property at {subject}. Highlight key features, location benefits, and why it''s a great opportunity. Be descriptive and enthusiastic. Maximum 150 words.'
  ),
  (
    'Open House Invitation',
    'Invite to an open house viewing',
    'free',
    'Real Estate',
    ARRAY['property_address', 'recipient_name', 'recipient_email'],
    'Write an invitation to {recipient} for an open house at {subject}. Create excitement and make it easy to attend. Maximum 150 words.'
  ),
  (
    'Investor Offer',
    'Offer a property deal to investors or partners',
    'pro',
    'Real Estate',
    ARRAY['property_address', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} pitching the property at {subject} as an investment opportunity. Focus on ROI, market trends, and investment potential. Use financial terminology. Maximum 200 words.'
  ),
  (
    'Owner Outreach',
    'Contact property owners to list their property',
    'pro',
    'Real Estate',
    ARRAY['property_address', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} convincing them to list their property at {subject} with your agency. Highlight your track record, market knowledge, and how you''ll get them the best deal. Maximum 200 words.'
  ),
  (
    'Market Update',
    'Share market insights relevant to their property',
    'pro',
    'Real Estate',
    ARRAY['property_address', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} providing market insights about {subject} area. Position yourself as a knowledgeable advisor. Maximum 200 words.'
  ),
  (
    'Price Reduction Alert',
    'Announce a price drop on a property',
    'pro',
    'Real Estate',
    ARRAY['property_address', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} announcing a price reduction for {subject}. Create urgency around the opportunity. Maximum 200 words.'
  ),
  (
    'Off-Market Deal',
    'Pitch an exclusive off-market property',
    'pro',
    'Real Estate',
    ARRAY['property_address', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering exclusive access to an off-market property at {subject}. Create a sense of exclusivity. Maximum 200 words.'
  ),
  (
    'Neighborhood Expert',
    'Position yourself as the local area expert',
    'pro',
    'Real Estate',
    ARRAY['property_address', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} establishing yourself as the expert for {subject} area. Share local insights and market knowledge. Maximum 200 words.'
  ),
  (
    'Buyer Match',
    'Tell seller you have interested buyers',
    'pro',
    'Real Estate',
    ARRAY['property_address', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} mentioning you have interested buyers for properties like {subject}. Create seller interest. Maximum 200 words.'
  ),
  (
    'Relocation Services',
    'Offer help with relocation and moving',
    'pro',
    'Real Estate',
    ARRAY['property_address', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering comprehensive relocation services for {subject}. Make the move feel stress-free. Maximum 200 words.'
  ),

-- B2B Services & Consultants (12 strategies: 2 free, 10 pro)
  (
    'Cold Introduction',
    'Introduce your B2B service to a new lead',
    'free',
    'B2B Services',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write a professional cold email to {recipient} introducing your B2B service: {subject}. Clearly explain what you do and why it matters to their business. Be direct and value-focused. Maximum 150 words.'
  ),
  (
    'Problem Solver',
    'Address a specific pain point in their industry',
    'free',
    'B2B Services',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} addressing a common problem in their industry and how {subject} solves it. Be empathetic and solution-focused. Maximum 150 words.'
  ),
  (
    'Case Study Pitch',
    'Share proof of results from another client',
    'pro',
    'B2B Services',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write a persuasive email to {recipient} about {subject}, referencing a client success story with specific results. Use numbers and concrete outcomes. Build credibility through proof. Maximum 200 words.'
  ),
  (
    'Consultation Offer',
    'Offer a free consultation or audit',
    'pro',
    'B2B Services',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering a free consultation or audit for {subject}. Make it no-pressure and focused on providing value. Explain what they''ll learn from the consultation. Maximum 200 words.'
  ),
  (
    'Industry Insight',
    'Share valuable industry research or trends',
    'pro',
    'B2B Services',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} sharing industry insights related to {subject}. Position yourself as a thought leader. Maximum 200 words.'
  ),
  (
    'Partnership Proposal',
    'Propose a strategic partnership',
    'pro',
    'B2B Services',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} proposing a partnership around {subject}. Explain mutual benefits and synergies. Maximum 200 words.'
  ),
  (
    'White Paper Share',
    'Offer a valuable resource or guide',
    'pro',
    'B2B Services',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering a white paper or guide about {subject}. Make the resource sound valuable and relevant. Maximum 200 words.'
  ),
  (
    'Scalability Focus',
    'Help them scale their operations',
    'pro',
    'B2B Services',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} showing how {subject} helps them scale efficiently. Focus on growth and systems. Maximum 200 words.'
  ),
  (
    'Cost Reduction',
    'Show how you can save them money',
    'pro',
    'B2B Services',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} demonstrating cost savings from {subject}. Use specific examples and ROI. Maximum 200 words.'
  ),
  (
    'Technology Upgrade',
    'Pitch modernization of their systems',
    'pro',
    'B2B Services',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} proposing technology upgrades with {subject}. Highlight competitive advantages. Maximum 200 words.'
  ),
  (
    'Compliance Solution',
    'Help with regulatory compliance',
    'pro',
    'B2B Services',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering {subject} services for compliance needs. Emphasize risk mitigation. Maximum 200 words.'
  ),
  (
    'Performance Benchmarking',
    'Compare their performance to industry standards',
    'pro',
    'B2B Services',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering benchmarking services for {subject}. Help them understand where they stand. Maximum 200 words.'
  ),

-- Digital Product & Creator Outreach (11 strategies: 2 free, 9 pro)
  (
    'Product Launch Email',
    'Announce a new product or course launch',
    'free',
    'Digital Products',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an announcement email to {recipient} for the new digital product launch: {subject}. Create excitement, explain the benefits, and include a clear call-to-action. Maximum 150 words.'
  ),
  (
    'Early Bird Discount',
    'Offer special pricing for early adopters',
    'free',
    'Digital Products',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering early bird pricing for {subject}. Create urgency with limited availability. Maximum 150 words.'
  ),
  (
    'Affiliate Partnership',
    'Invite someone to promote your digital product',
    'pro',
    'Digital Products',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} inviting them to join the affiliate program for {subject}. Explain the commission structure, why their audience would love it, and how easy it is to promote. Maximum 200 words.'
  ),
  (
    'Influencer Collaboration',
    'Pitch collaboration to influencers or content creators',
    'pro',
    'Digital Products',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write a collaboration offer email to {recipient} for the digital product {subject}. Show you understand their content and audience. Propose a mutually beneficial partnership. Maximum 200 words.'
  ),
  (
    'Course Bundle Offer',
    'Offer multiple products at a discount',
    'pro',
    'Digital Products',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering a bundle deal for {subject}. Emphasize value and savings. Maximum 200 words.'
  ),
  (
    'Success Story',
    'Share testimonials and results from users',
    'pro',
    'Digital Products',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} sharing success stories from {subject} users. Include specific results and transformations. Maximum 200 words.'
  ),
  (
    'Content Sample',
    'Give a preview or free sample',
    'pro',
    'Digital Products',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering a free sample or preview of {subject}. Make it valuable enough to convert. Maximum 200 words.'
  ),
  (
    'Limited Enrollment',
    'Create scarcity with limited spots',
    'pro',
    'Digital Products',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} announcing limited enrollment for {subject}. Use ethical scarcity tactics. Maximum 200 words.'
  ),
  (
    'Money-Back Guarantee',
    'Remove risk with a strong guarantee',
    'pro',
    'Digital Products',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} highlighting the money-back guarantee for {subject}. Reduce purchase anxiety. Maximum 200 words.'
  ),
  (
    'Upsell Existing Customers',
    'Pitch additional products to past buyers',
    'pro',
    'Digital Products',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient}, an existing customer, about {subject}. Show how it complements their previous purchase. Maximum 200 words.'
  ),
  (
    'Live Workshop Invite',
    'Invite to a live training or webinar',
    'pro',
    'Digital Products',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an invitation to {recipient} for a live workshop about {subject}. Create excitement and show unique value. Maximum 200 words.'
  ),

-- Domain Sellers (13 strategies: 2 free, 11 pro)
  (
    'Generic Domain Sale Pitch',
    'Simple outreach offering a domain for sale',
    'free',
    'Domain Sellers',
    ARRAY['domain_name', 'recipient_name', 'recipient_email'],
    'Write a cold email to {recipient} offering to sell the domain {subject}. Clearly explain why this domain is valuable and create urgency. Be direct and professional. Maximum 150 words.'
  ),
  (
    'Direct Inquiry',
    'Ask if they are interested in buying',
    'free',
    'Domain Sellers',
    ARRAY['domain_name', 'recipient_name', 'recipient_email'],
    'Write a simple email to {recipient} asking if they would be interested in acquiring {subject}. Keep it short and direct. Maximum 150 words.'
  ),
  (
    'Business Fit Strategy',
    'Explain why the domain fits their brand',
    'pro',
    'Domain Sellers',
    ARRAY['domain_name', 'recipient_name', 'recipient_email'],
    'Write a personalized email to {recipient} showing why the domain {subject} perfectly fits their brand and business. Demonstrate understanding of their company and explain the strategic value. Maximum 200 words.'
  ),
  (
    'Scarcity Strategy',
    'Emphasize urgency and exclusivity',
    'pro',
    'Domain Sellers',
    ARRAY['domain_name', 'recipient_name', 'recipient_email'],
    'Write a persuasive email to {recipient} creating urgency for buying the domain {subject}. Use scarcity and FOMO tactics ethically. Mention other interest or limited availability. Maximum 200 words.'
  ),
  (
    'Brand Protection',
    'Highlight the importance of securing the domain',
    'pro',
    'Domain Sellers',
    ARRAY['domain_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} emphasizing brand protection for {subject}. Show risks of not owning the domain. Maximum 200 words.'
  ),
  (
    'SEO Value',
    'Highlight search engine optimization benefits',
    'pro',
    'Domain Sellers',
    ARRAY['domain_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} explaining the SEO advantages of {subject}. Use technical benefits and ranking potential. Maximum 200 words.'
  ),
  (
    'Market Expansion',
    'Show how the domain helps them expand',
    'pro',
    'Domain Sellers',
    ARRAY['domain_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} showing how {subject} enables market expansion. Focus on growth opportunities. Maximum 200 words.'
  ),
  (
    'Competitor Angle',
    'Warn about competitors acquiring the domain',
    'pro',
    'Domain Sellers',
    ARRAY['domain_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} subtly warning that competitors could acquire {subject}. Create competitive urgency. Maximum 200 words.'
  ),
  (
    'Investment Opportunity',
    'Position domain as an appreciating asset',
    'pro',
    'Domain Sellers',
    ARRAY['domain_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} positioning {subject} as an investment asset. Discuss appreciation and future value. Maximum 200 words.'
  ),
  (
    'Premium Branding',
    'Emphasize premium brand perception',
    'pro',
    'Domain Sellers',
    ARRAY['domain_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} explaining how {subject} creates premium brand perception. Focus on credibility and trust. Maximum 200 words.'
  ),
  (
    'Industry Authority',
    'Show how the domain establishes authority',
    'pro',
    'Domain Sellers',
    ARRAY['domain_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} showing how {subject} establishes industry authority. Use positioning and perception benefits. Maximum 200 words.'
  ),
  (
    'Geographic Advantage',
    'Highlight location-based benefits',
    'pro',
    'Domain Sellers',
    ARRAY['domain_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} explaining geographic advantages of {subject}. Focus on local market penetration. Maximum 200 words.'
  ),
  (
    'Memorable Branding',
    'Emphasize memorability and word-of-mouth',
    'pro',
    'Domain Sellers',
    ARRAY['domain_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} highlighting how {subject} is memorable and easy to share. Focus on viral potential. Maximum 200 words.'
  ),

-- Recruiters & HR Agencies (10 strategies: 2 free, 8 pro)
  (
    'Candidate Outreach',
    'Contact potential job candidates',
    'free',
    'Recruiting',
    ARRAY['job_title', 'recipient_name', 'recipient_email'],
    'Write a short, friendly email to {recipient} inviting them to apply for the {subject} position. Highlight why the role is exciting and why they''d be a great fit. Maximum 150 words.'
  ),
  (
    'Follow-Up Email',
    'Follow up after initial contact',
    'free',
    'Recruiting',
    ARRAY['job_title', 'recipient_name', 'recipient_email'],
    'Write a polite follow-up email to {recipient} after an interview or job offer for {subject}. Be professional and show continued interest. Maximum 150 words.'
  ),
  (
    'Client Prospecting',
    'Offer recruiting services to a company',
    'pro',
    'Recruiting',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering recruiting services for {subject}. Explain how you can help them find top talent and solve their hiring challenges. Maximum 200 words.'
  ),
  (
    'Passive Candidate',
    'Reach out to someone not actively looking',
    'pro',
    'Recruiting',
    ARRAY['job_title', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} who is not actively job hunting about an opportunity for {subject}. Be respectful of their current role. Maximum 200 words.'
  ),
  (
    'Exclusive Opportunity',
    'Pitch a high-level exclusive role',
    'pro',
    'Recruiting',
    ARRAY['job_title', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} about an exclusive, confidential opportunity for {subject}. Create intrigue and prestige. Maximum 200 words.'
  ),
  (
    'Referral Request',
    'Ask for candidate referrals',
    'pro',
    'Recruiting',
    ARRAY['job_title', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} asking for referrals for {subject} position. Make it easy for them to help. Maximum 200 words.'
  ),
  (
    'Industry Move',
    'Pitch a career change opportunity',
    'pro',
    'Recruiting',
    ARRAY['job_title', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} about a career change opportunity for {subject}. Highlight growth and new challenges. Maximum 200 words.'
  ),
  (
    'Contract Role',
    'Pitch short-term or contract work',
    'pro',
    'Recruiting',
    ARRAY['job_title', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} about a contract opportunity for {subject}. Emphasize flexibility and high pay. Maximum 200 words.'
  ),
  (
    'Company Culture Pitch',
    'Highlight workplace culture and benefits',
    'pro',
    'Recruiting',
    ARRAY['job_title', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} focusing on company culture for {subject} role. Make the workplace sound amazing. Maximum 200 words.'
  ),
  (
    'Remote Opportunity',
    'Pitch a remote or hybrid position',
    'pro',
    'Recruiting',
    ARRAY['job_title', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} about a remote or hybrid {subject} opportunity. Highlight location flexibility. Maximum 200 words.'
  ),

-- Investors & Business Brokers (12 strategies: 2 free, 10 pro)
  (
    'Partnership Offer',
    'Pitch collaboration or co-investment',
    'free',
    'Investment',
    ARRAY['opportunity_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering a potential investment or partnership opportunity for {subject}. Explain mutual benefits and why you''d be good partners. Maximum 150 words.'
  ),
  (
    'Investment Opportunity',
    'Present a new investment opportunity',
    'free',
    'Investment',
    ARRAY['opportunity_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} presenting an investment opportunity in {subject}. Include key metrics and potential returns. Maximum 150 words.'
  ),
  (
    'Acquisition Interest',
    'Express interest in buying a company or digital asset',
    'pro',
    'Investment',
    ARRAY['business_name', 'recipient_name', 'recipient_email'],
    'Write a professional email to {recipient} expressing interest in acquiring {subject}. Be respectful, show serious intent, and request preliminary information. Use sophisticated business language. Maximum 200 words.'
  ),
  (
    'Sell-Side Pitch',
    'Offer to represent or sell someone business',
    'pro',
    'Investment',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering brokerage services to sell their business related to {subject}. Highlight your track record and explain your process. Be professional and credible. Maximum 200 words.'
  ),
  (
    'Portfolio Company',
    'Introduce a portfolio company opportunity',
    'pro',
    'Investment',
    ARRAY['opportunity_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} introducing a portfolio company for {subject}. Highlight growth potential and strategic fit. Maximum 200 words.'
  ),
  (
    'Due Diligence Request',
    'Request information for investment review',
    'pro',
    'Investment',
    ARRAY['business_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} requesting due diligence materials for {subject}. Be professional and detail what you need. Maximum 200 words.'
  ),
  (
    'Exit Strategy',
    'Help business owners plan their exit',
    'pro',
    'Investment',
    ARRAY['service_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering exit strategy services for {subject}. Focus on maximizing value. Maximum 200 words.'
  ),
  (
    'Market Timing',
    'Emphasize current market conditions',
    'pro',
    'Investment',
    ARRAY['opportunity_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} highlighting favorable market timing for {subject}. Use market data and trends. Maximum 200 words.'
  ),
  (
    'Synergy Opportunity',
    'Show strategic fit between companies',
    'pro',
    'Investment',
    ARRAY['business_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} explaining synergies between companies for {subject}. Focus on combined value. Maximum 200 words.'
  ),
  (
    'Growth Capital',
    'Offer funding for expansion',
    'pro',
    'Investment',
    ARRAY['opportunity_type', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} offering growth capital for {subject}. Explain terms and value-add services. Maximum 200 words.'
  ),
  (
    'Distressed Asset',
    'Pitch turnaround investment opportunity',
    'pro',
    'Investment',
    ARRAY['business_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} about a turnaround opportunity for {subject}. Show restructuring potential. Maximum 200 words.'
  ),
  (
    'Strategic Buyer',
    'Connect seller with strategic acquirer',
    'pro',
    'Investment',
    ARRAY['business_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} introducing a strategic buyer for {subject}. Highlight premium valuation potential. Maximum 200 words.'
  ),

-- General Purpose (10 strategies: 2 free, 8 pro)
  (
    'Personalized Introduction',
    'Introduce yourself and your service',
    'free',
    'General',
    ARRAY['topic', 'recipient_name', 'recipient_email'],
    'Write a polite cold introduction email to {recipient} about {subject}. Start a business relationship professionally. Be warm, clear, and respectful. Maximum 150 words.'
  ),
  (
    'Reconnection Email',
    'Reconnect with a previous contact',
    'free',
    'General',
    ARRAY['topic', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} reconnecting about {subject}. Reference your past interaction and provide a reason to reconnect. Be friendly and genuine. Maximum 150 words.'
  ),
  (
    'Upsell / Cross-Sell',
    'Offer an existing client a new service or upgrade',
    'pro',
    'General',
    ARRAY['product_name', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient}, an existing client, offering an additional service or product: {subject}. Show how it complements what they already have. Be helpful, not salesy. Maximum 200 words.'
  ),
  (
    'Thank You Follow-Up',
    'Thank someone after a meeting or call',
    'pro',
    'General',
    ARRAY['topic', 'recipient_name', 'recipient_email'],
    'Write a thank you email to {recipient} after a meeting about {subject}. Summarize next steps and show appreciation. Maximum 200 words.'
  ),
  (
    'Event Invitation',
    'Invite to an event, conference, or meetup',
    'pro',
    'General',
    ARRAY['topic', 'recipient_name', 'recipient_email'],
    'Write an invitation to {recipient} for an event about {subject}. Make it sound valuable and worth attending. Maximum 200 words.'
  ),
  (
    'Feedback Request',
    'Ask for feedback or testimonial',
    'pro',
    'General',
    ARRAY['topic', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} requesting feedback about {subject}. Make it easy and show appreciation. Maximum 200 words.'
  ),
  (
    'Congratulations Message',
    'Congratulate on an achievement and offer help',
    'pro',
    'General',
    ARRAY['topic', 'recipient_name', 'recipient_email'],
    'Write a congratulatory email to {recipient} about {subject}. Be genuine and offer relevant help. Maximum 200 words.'
  ),
  (
    'Problem Notification',
    'Alert them to an issue you noticed',
    'pro',
    'General',
    ARRAY['topic', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} alerting them to an issue with {subject}. Be helpful, not alarmist. Maximum 200 words.'
  ),
  (
    'Resource Share',
    'Share a helpful resource or tool',
    'pro',
    'General',
    ARRAY['topic', 'recipient_name', 'recipient_email'],
    'Write an email to {recipient} sharing a valuable resource about {subject}. Provide context on why it is useful. Maximum 200 words.'
  ),
  (
    'Breakup Email',
    'Final follow-up before moving on',
    'pro',
    'General',
    ARRAY['topic', 'recipient_name', 'recipient_email'],
    'Write a polite breakup email to {recipient} about {subject} after multiple follow-ups. Leave the door open professionally. Maximum 200 words.'
  )
ON CONFLICT DO NOTHING;
