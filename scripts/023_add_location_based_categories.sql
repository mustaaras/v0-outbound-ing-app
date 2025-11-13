-- Add 5 new location-based categories with strategies
-- Migration: 023_add_location_based_categories.sql

-- Local Services (Home improvement, contractors, etc.)
INSERT INTO strategies (name, description, tier, category, input_fields, prompt) VALUES
  (
    'Service Area Expansion',
    'Help local service businesses expand their coverage area',
    'free',
    'Local Services',
    '["recipient", "service_area", "service_type"]',
    'Write a cold email to {recipient} offering to help their {service_type} business expand into new service areas. Highlight the benefits of covering {service_area} and how it could increase their revenue. Focus on local market opportunities and growth potential. Maximum 150 words.'
  ),
  (
    'Emergency Service Partnership',
    'Partner with local services for emergency response',
    'free',
    'Local Services',
    '["recipient", "emergency_service", "location"]',
    'Write a cold email to {recipient} proposing a partnership for {emergency_service} in {location}. Emphasize the importance of reliable emergency services and how this partnership could save lives and build community trust. Create urgency around emergency preparedness. Maximum 150 words.'
  ),
  (
    'Seasonal Service Promotion',
    'Promote seasonal services like HVAC maintenance or lawn care',
    'light',
    'Local Services',
    '["recipient", "seasonal_service", "season"]',
    'Write a cold email to {recipient} promoting {seasonal_service} services for the upcoming {season}. Explain the importance of seasonal maintenance and how it prevents costly repairs. Include specific benefits and create urgency for {season} preparation. Maximum 180 words.'
  ),
  (
    'Referral Network Building',
    'Build referral networks between complementary local services',
    'light',
    'Local Services',
    '["recipient", "complementary_service", "mutual_benefits"]',
    'Write a cold email to {recipient} proposing a referral partnership with {complementary_service} providers. Explain how this network could benefit both businesses through increased customer referrals and {mutual_benefits}. Focus on mutual growth and community building. Maximum 180 words.'
  ),
  (
    'Local SEO Optimization',
    'Offer local SEO services to improve online visibility',
    'pro',
    'Local Services',
    '["recipient", "service_type", "local_competition"]',
    'Write a cold email to {recipient} offering local SEO optimization for their {service_type} business. Highlight how better search visibility could help them stand out from {local_competition} and attract more local customers. Include specific SEO benefits and ROI potential. Maximum 200 words.'
  ),
  (
    'Service Guarantee Program',
    'Offer service guarantee programs to build trust',
    'pro',
    'Local Services',
    '["recipient", "service_guarantee", "industry_standard"]',
    'Write a cold email to {recipient} proposing a {service_guarantee} program that exceeds {industry_standard}. Explain how this guarantee builds customer trust and differentiates them from competitors. Include success stories and implementation details. Maximum 200 words.'
  ),
  (
    'Fleet & Equipment Upgrade',
    'Help service businesses upgrade their equipment and fleet',
    'pro',
    'Local Services',
    '["recipient", "equipment_type", "efficiency_gains"]',
    'Write a cold email to {recipient} offering financing or leasing options for {equipment_type} upgrades. Demonstrate how these upgrades could deliver {efficiency_gains} and improve service quality. Focus on ROI and competitive advantages. Maximum 200 words.'
  );

-- Hospitality & Food Service
INSERT INTO strategies (name, description, tier, category, input_fields, prompt) VALUES
  (
    'Event Catering Partnership',
    'Partner with restaurants for event catering opportunities',
    'free',
    'Hospitality & Food Service',
    '["recipient", "event_type", "catering_capacity"]',
    'Write a cold email to {recipient} proposing a catering partnership for {event_type} events. Highlight their {catering_capacity} and how this partnership could expand their business reach. Focus on quality, reliability, and event success. Maximum 150 words.'
  ),
  (
    'Local Delivery Expansion',
    'Help restaurants expand their delivery service area',
    'free',
    'Hospitality & Food Service',
    '["recipient", "delivery_radius", "delivery_platform"]',
    'Write a cold email to {recipient} offering to help expand their delivery service to cover {delivery_radius}. Explain the benefits of {delivery_platform} integration and increased revenue potential from delivery orders. Maximum 150 words.'
  ),
  (
    'Seasonal Menu Collaboration',
    'Collaborate on seasonal or themed menu items',
    'light',
    'Hospitality & Food Service',
    '["recipient", "seasonal_theme", "menu_innovation"]',
    'Write a cold email to {recipient} proposing a collaboration on {seasonal_theme} menu items featuring {menu_innovation}. Explain how this could attract new customers and create buzz in the local community. Focus on creativity and marketing potential. Maximum 180 words.'
  ),
  (
    'Group Dining Programs',
    'Develop programs for corporate or group dining',
    'light',
    'Hospitality & Food Service',
    '["recipient", "group_size", "corporate_benefits"]',
    'Write a cold email to {recipient} offering group dining solutions for {group_size} parties. Highlight {corporate_benefits} and how this could become a steady revenue stream. Include package options and booking procedures. Maximum 180 words.'
  ),
  (
    'Local Sourcing Partnership',
    'Partner with local farms and suppliers for fresh ingredients',
    'pro',
    'Hospitality & Food Service',
    '["recipient", "local_ingredient", "farm_to_table_benefits"]',
    'Write a cold email to {recipient} proposing a local sourcing partnership for {local_ingredient}. Emphasize {farm_to_table_benefits} including freshness, community support, and marketing advantages. Position this as a competitive differentiator. Maximum 200 words.'
  ),
  (
    'Loyalty Program Integration',
    'Integrate advanced loyalty and rewards programs',
    'pro',
    'Hospitality & Food Service',
    '["recipient", "loyalty_features", "retention_rate_improvement"]',
    'Write a cold email to {recipient} offering advanced loyalty program integration with {loyalty_features}. Demonstrate how this could improve customer retention by {retention_rate_improvement} and increase lifetime value. Include implementation timeline and expected ROI. Maximum 200 words.'
  ),
  (
    'Private Event Venue',
    'Transform restaurant space into private event venue',
    'pro',
    'Hospitality & Food Service',
    '["recipient", "venue_capacity", "event_types"]',
    'Write a cold email to {recipient} offering to help convert their space into a premium venue for {event_types} with capacity for {venue_capacity} guests. Highlight additional revenue streams and community event hosting opportunities. Maximum 200 words.'
  );

-- Healthcare & Wellness
INSERT INTO strategies (name, description, tier, category, input_fields, prompt) VALUES
  (
    'New Patient Acquisition',
    'Help healthcare providers attract new patients',
    'free',
    'Healthcare & Wellness',
    '["recipient", "specialty_area", "patient_demographic"]',
    'Write a cold email to {recipient} offering strategies to attract new patients in {specialty_area} focusing on {patient_demographic}. Emphasize the growing demand and community health needs. Create urgency around patient acquisition. Maximum 150 words.'
  ),
  (
    'Telemedicine Integration',
    'Offer telemedicine solutions for expanded reach',
    'free',
    'Healthcare & Wellness',
    '["recipient", "telemedicine_benefits", "patient_convenience"]',
    'Write a cold email to {recipient} proposing telemedicine integration to provide {telemedicine_benefits}. Highlight {patient_convenience} and how this could expand their patient base beyond local boundaries. Maximum 150 words.'
  ),
  (
    'Wellness Program Development',
    'Develop community wellness and prevention programs',
    'light',
    'Healthcare & Wellness',
    '["recipient", "wellness_focus", "community_impact"]',
    'Write a cold email to {recipient} offering to develop {wellness_focus} programs for the community. Explain the {community_impact} and how this positions them as wellness leaders. Include program structure and expected outcomes. Maximum 180 words.'
  ),
  (
    'Patient Education Platform',
    'Create platforms for patient education and engagement',
    'light',
    'Healthcare & Wellness',
    '["recipient", "education_topic", "patient_engagement_benefits"]',
    'Write a cold email to {recipient} proposing a patient education platform focused on {education_topic}. Highlight {patient_engagement_benefits} and how this improves patient outcomes and satisfaction. Include content strategy and implementation approach. Maximum 180 words.'
  ),
  (
    'Specialty Service Expansion',
    'Help clinics expand into new specialty services',
    'pro',
    'Healthcare & Wellness',
    '["recipient", "new_specialty", "market_demand"]',
    'Write a cold email to {recipient} offering to help expand into {new_specialty} services. Demonstrate the {market_demand} and revenue potential. Include market analysis and implementation roadmap. Maximum 200 words.'
  ),
  (
    'Healthcare Technology Integration',
    'Integrate advanced healthcare technology solutions',
    'pro',
    'Healthcare & Wellness',
    '["recipient", "healthcare_technology", "efficiency_improvements"]',
    'Write a cold email to {recipient} offering {healthcare_technology} integration to achieve {efficiency_improvements}. Explain how this technology enhances patient care and operational efficiency. Include ROI projections and implementation support. Maximum 200 words.'
  ),
  (
    'Community Health Partnership',
    'Build partnerships with community health organizations',
    'pro',
    'Healthcare & Wellness',
    '["recipient", "community_partner", "health_outcomes"]',
    'Write a cold email to {recipient} proposing a partnership with {community_partner} to improve {health_outcomes}. Focus on collaborative care models and community health impact. Include partnership structure and measurable goals. Maximum 200 words.'
  );

-- Retail & Shopping
INSERT INTO strategies (name, description, tier, category, input_fields, prompt) VALUES
  (
    'Local Event Sponsorship',
    'Sponsor community events to increase brand visibility',
    'free',
    'Retail & Shopping',
    '["recipient", "event_type", "brand_exposure_benefits"]',
    'Write a cold email to {recipient} offering event sponsorship opportunities for {event_type}. Highlight {brand_exposure_benefits} and how this increases local brand recognition and customer foot traffic. Maximum 150 words.'
  ),
  (
    'Loyalty Program Enhancement',
    'Upgrade existing loyalty programs with new features',
    'free',
    'Retail & Shopping',
    '["recipient", "loyalty_upgrade", "customer_retention_improvement"]',
    'Write a cold email to {recipient} proposing to upgrade their loyalty program with {loyalty_upgrade}. Explain how this could improve customer retention by {customer_retention_improvement} and increase repeat business. Maximum 150 words.'
  ),
  (
    'Pop-up Shop Collaboration',
    'Create pop-up shop experiences in strategic locations',
    'light',
    'Retail & Shopping',
    '["recipient", "pop_up_concept", "traffic_increase"]',
    'Write a cold email to {recipient} offering pop-up shop collaboration with {pop_up_concept}. Demonstrate how this could increase foot traffic by {traffic_increase} and attract new customer segments. Include logistics and marketing strategy. Maximum 180 words.'
  ),
  (
    'Community Engagement Initiative',
    'Develop programs that engage with the local community',
    'light',
    'Retail & Shopping',
    '["recipient", "community_program", "brand_loyalty_benefits"]',
    'Write a cold email to {recipient} proposing a {community_program} to strengthen community ties. Explain {brand_loyalty_benefits} and how this builds long-term customer relationships. Include program timeline and success metrics. Maximum 180 words.'
  ),
  (
    'E-commerce Integration',
    'Help brick-and-mortar stores develop online presence',
    'pro',
    'Retail & Shopping',
    '["recipient", "ecommerce_platform", "omnichannel_benefits"]',
    'Write a cold email to {recipient} offering {ecommerce_platform} integration for omnichannel retail. Highlight {omnichannel_benefits} including expanded reach and increased revenue. Include implementation strategy and expected growth. Maximum 200 words.'
  ),
  (
    'Personalization Technology',
    'Implement personalized shopping experiences',
    'pro',
    'Retail & Shopping',
    '["recipient", "personalization_tech", "conversion_rate_improvement"]',
    'Write a cold email to {recipient} offering {personalization_tech} to create personalized shopping experiences. Demonstrate how this could improve conversion rates by {conversion_rate_improvement} through targeted recommendations and offers. Maximum 200 words.'
  ),
  (
    'Sustainability Initiative',
    'Develop eco-friendly retail practices and marketing',
    'pro',
    'Retail & Shopping',
    '["recipient", "sustainability_focus", "customer_appeal"]',
    'Write a cold email to {recipient} proposing sustainability initiatives focusing on {sustainability_focus}. Explain how this appeals to environmentally conscious customers and {customer_appeal}. Include implementation plan and marketing strategy. Maximum 200 words.'
  );

-- Fitness & Personal Care
INSERT INTO strategies (name, description, tier, category, input_fields, prompt) VALUES
  (
    'Membership Growth Campaign',
    'Help fitness centers attract new members',
    'free',
    'Fitness & Personal Care',
    '["recipient", "membership_offer", "target_demographic"]',
    'Write a cold email to {recipient} offering a membership growth campaign targeting {target_demographic}. Highlight the benefits of {membership_offer} and how it could expand their member base. Create urgency around joining. Maximum 150 words.'
  ),
  (
    'Wellness Partnership',
    'Create partnerships between fitness and wellness providers',
    'free',
    'Fitness & Personal Care',
    '["recipient", "wellness_partner", "cross_promotion_benefits"]',
    'Write a cold email to {recipient} proposing a partnership with {wellness_partner} for cross-promotion. Explain {cross_promotion_benefits} and how this creates comprehensive wellness packages for customers. Maximum 150 words.'
  ),
  (
    'Group Fitness Classes',
    'Develop and market group fitness class programs',
    'light',
    'Fitness & Personal Care',
    '["recipient", "class_type", "community_engagement"]',
    'Write a cold email to {recipient} offering to develop {class_type} group fitness programs. Highlight {community_engagement} benefits and how this builds community around health and wellness. Include class scheduling and marketing ideas. Maximum 180 words.'
  ),
  (
    'Personal Training Expansion',
    'Expand personal training services and packages',
    'light',
    'Fitness & Personal Care',
    '["recipient", "training_specialty", "client_acquisition_benefits"]',
    'Write a cold email to {recipient} proposing expansion into {training_specialty} personal training. Explain {client_acquisition_benefits} and how this differentiates them in the market. Include certification and program development. Maximum 180 words.'
  ),
  (
    'Digital Fitness Platform',
    'Integrate digital fitness tracking and virtual training',
    'pro',
    'Fitness & Personal Care',
    '["recipient", "digital_platform", "engagement_improvements"]',
    'Write a cold email to {recipient} offering {digital_platform} integration for enhanced member engagement. Demonstrate how this could improve member retention through {engagement_improvements} and data-driven insights. Maximum 200 words.'
  ),
  (
    'Corporate Wellness Program',
    'Develop corporate wellness partnerships for employee health',
    'pro',
    'Fitness & Personal Care',
    '["recipient", "corporate_program", "business_development_opportunities"]',
    'Write a cold email to {recipient} offering corporate wellness programs for local businesses. Highlight {business_development_opportunities} and how this creates steady revenue streams. Include program customization and ROI for businesses. Maximum 200 words.'
  ),
  (
    'Recovery & Rehabilitation Services',
    'Add recovery services like massage therapy or cryotherapy',
    'pro',
    'Fitness & Personal Care',
    '["recipient", "recovery_service", "performance_enhancement"]',
    'Write a cold email to {recipient} proposing to add {recovery_service} for member recovery and {performance_enhancement}. Explain the competitive advantage and additional revenue potential. Include service integration and staff training requirements. Maximum 200 words.'
  );

-- Update the category count references in the UI
-- Note: This will be handled in the UI update migration