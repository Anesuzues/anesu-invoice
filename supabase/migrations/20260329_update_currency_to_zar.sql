-- Update existing companies to use ZAR as default currency
UPDATE companies 
SET currency = 'ZAR' 
WHERE currency IS NULL OR currency = 'USD';