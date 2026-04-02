-- migration 022_add_package_names.sql
ALTER TABLE flocks
ADD COLUMN IF NOT EXISTS package_basic_name TEXT DEFAULT 'Basic',
ADD COLUMN IF NOT EXISTS package_standard_name TEXT DEFAULT 'Standard',
ADD COLUMN IF NOT EXISTS package_premium_name TEXT DEFAULT 'Premium';

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS package_basic_name TEXT DEFAULT 'Basic',
ADD COLUMN IF NOT EXISTS package_standard_name TEXT DEFAULT 'Standard',
ADD COLUMN IF NOT EXISTS package_premium_name TEXT DEFAULT 'Premium';
