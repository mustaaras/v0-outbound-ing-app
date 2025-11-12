-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  industry TEXT,
  company_size TEXT,
  location TEXT,
  description TEXT,
  website TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contacts table (email addresses associated with companies)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  department TEXT,
  phone TEXT,
  linkedin_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  source TEXT, -- 'manual', 'snov', 'public_finder', 'imported', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

-- Create user_saved_contacts table (track which contacts a user has saved)
CREATE TABLE IF NOT EXISTS user_saved_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  notes TEXT,
  tags TEXT[], -- Array of tags for organization
  last_contacted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'replied', 'converted', 'unsubscribed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

-- Create contact_search_history table (track searches performed)
CREATE TABLE IF NOT EXISTS contact_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  search_type TEXT NOT NULL, -- 'domain', 'title', 'company_name', etc.
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_contacts_user_id ON user_saved_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_contacts_contact_id ON user_saved_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_contacts_status ON user_saved_contacts(status);

-- Add full-text search indexes
CREATE INDEX IF NOT EXISTS idx_companies_name_search ON companies USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_contacts_name_search ON contacts USING gin(to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '')));
CREATE INDEX IF NOT EXISTS idx_contacts_title_search ON contacts USING gin(to_tsvector('english', coalesce(title, '')));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_saved_contacts_updated_at BEFORE UPDATE ON user_saved_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS) policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_search_history ENABLE ROW LEVEL SECURITY;

-- Companies: Anyone can read, only authenticated users can insert/update
CREATE POLICY "Companies are viewable by everyone" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert companies" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update companies" ON companies
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Contacts: Anyone can read, only authenticated users can insert/update
CREATE POLICY "Contacts are viewable by everyone" ON contacts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert contacts" ON contacts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contacts" ON contacts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- User saved contacts: Users can only see their own
CREATE POLICY "Users can view their own saved contacts" ON user_saved_contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved contacts" ON user_saved_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved contacts" ON user_saved_contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved contacts" ON user_saved_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Search history: Users can only see their own
CREATE POLICY "Users can view their own search history" ON contact_search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON contact_search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a view for easy querying of saved contacts with company info
CREATE OR REPLACE VIEW user_contacts_view AS
SELECT 
  usc.id as saved_contact_id,
  usc.user_id,
  usc.notes,
  usc.tags,
  usc.last_contacted_at,
  usc.status,
  usc.created_at as saved_at,
  c.id as contact_id,
  c.email,
  c.first_name,
  c.last_name,
  c.title,
  c.department,
  c.phone,
  c.linkedin_url as contact_linkedin,
  c.is_verified,
  c.source,
  comp.id as company_id,
  comp.name as company_name,
  comp.domain as company_domain,
  comp.industry,
  comp.company_size,
  comp.location,
  comp.website,
  comp.linkedin_url as company_linkedin
FROM user_saved_contacts usc
JOIN contacts c ON usc.contact_id = c.id
LEFT JOIN companies comp ON c.company_id = comp.id;

-- Grant access to the view
GRANT SELECT ON user_contacts_view TO authenticated;

COMMENT ON TABLE companies IS 'Stores company information including name, domain, and metadata';
COMMENT ON TABLE contacts IS 'Stores individual contact information linked to companies';
COMMENT ON TABLE user_saved_contacts IS 'Tracks which contacts each user has saved with status and notes';
COMMENT ON TABLE contact_search_history IS 'Logs all contact searches performed by users';
