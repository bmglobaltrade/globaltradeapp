Table Schema:

1.users 
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  mobile_number TEXT UNIQUE,
  status TEXT,
  profile_setup_at TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_mobile_verified BOOLEAN DEFAULT FALSE
); #used to handle user details that are the base for login and signup
2.auth_credentials

CREATE TABLE auth_credentials (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  password_algo TEXT,
  password_set_at TIMESTAMP,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP,
  failed_attempts INT,
  locked_until TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP

); #handles the password seperately to avoid the password column null when user continues or signup with google


3. oauth_accounts:
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,         -- e.g., 'google', 'github'
  provider_user_id TEXT NOT NULL, -- unique ID from provider
  email TEXT,                     -- email from provider
  access_token TEXT,              -- optional: store if you need API calls
  refresh_token TEXT,             -- optional: store if you need refresh
  token_expires_at TIMESTAMP,     -- expiry of access token
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE (provider, provider_user_id) -- one record per provider per user
 
);  #handles user account creation using google,facebook etc..

4. auth_sessions
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT UNIQUE,      -- long-lived token
  created_at TIMESTAMP,
  expires_at TIMESTAMP,           -- when session should expire
  revoked_at TIMESTAMP            -- if user logs out or token invalidated
); #handles the jwt (session tokens)


5.user_profile:
CREATE TABLE user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    profile_img_url TEXT,
    mobile_number VARCHAR(20) UNIQUE,              -- 🔒 one phone = one user
    country_code CHAR(3) REFERENCES country(code), -- ISO 3166-1 alpha-3
    address TEXT,
    company_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()

); #profile setup table for handling essential details

6.user_kyc
 CREATE TABLE user_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    government_id_type VARCHAR(50),          -- e.g., Passport, PAN, Aadhaar
    government_id_number VARCHAR(100),
    government_id_url TEXT,                  -- uploaded doc
    
    gstin_number VARCHAR(50),                -- Indian GSTIN, optional
    business_cert_url TEXT,                  -- business license, registration docs
    
    authorized_person_name VARCHAR(150),     -- name on docs
    trader_type VARCHAR(50),                 -- importer, exporter, both
    
    status VARCHAR(20) DEFAULT 'pending',    -- pending / approved / rejected
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
); # handling profile setup auth_docs

7.verifications
CREATE TABLE verifications (
  id SERIAL PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,     -- mobile or email
  code VARCHAR(64) NOT NULL,            -- OTP or token
  type VARCHAR(10) NOT NULL,            -- 'mobile' or 'email'
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);#handles the verification codes like otp 
