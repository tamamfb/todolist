-- Add default "Home" category for all existing users who don't have it yet
INSERT INTO Category (user_id, name, created_at, updated_at)
SELECT 
    u.id as user_id,
    'Home' as name,
    NOW() as created_at,
    NOW() as updated_at
FROM User u
WHERE NOT EXISTS (
    SELECT 1 
    FROM Category c 
    WHERE c.user_id = u.id 
    AND c.name = 'Home'
);
