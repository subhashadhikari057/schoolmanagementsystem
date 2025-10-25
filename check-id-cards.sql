-- Query to check all ID cards in the database
-- Run this to verify if cards are being deleted or still in database

SELECT 
  ic.id,
  ic."issuedForId",
  u."fullName",
  ic."templateId",
  t."name" as template_name,
  ic."type",
  ic."expiryDate",
  ic."createdAt",
  ic."updatedAt",
  CASE 
    WHEN ic."expiryDate" >= NOW() THEN 'ACTIVE'
    ELSE 'EXPIRED'
  END as status
FROM "IDCard" ic
JOIN "User" u ON ic."issuedForId" = u.id
JOIN "IDCardTemplate" t ON ic."templateId" = t.id
ORDER BY ic."createdAt" DESC
LIMIT 20;

-- To check for a specific user (replace with actual user ID)
-- SELECT * FROM "IDCard" WHERE "issuedForId" = 'user-id-here';

-- To manually delete an ID card (replace with actual ID)
-- DELETE FROM "IDCard" WHERE id = 'card-id-here';

-- To count total ID cards
SELECT COUNT(*) as total_cards FROM "IDCard";

-- To check if there are duplicate active cards for same user+template
SELECT 
  "issuedForId",
  "templateId",
  COUNT(*) as card_count
FROM "IDCard"
WHERE "expiryDate" >= NOW()
GROUP BY "issuedForId", "templateId"
HAVING COUNT(*) > 1;
