-- Migration to add status column to attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Update existing records to have the default status
UPDATE attendance 
SET status = 'active' 
WHERE status IS NULL;