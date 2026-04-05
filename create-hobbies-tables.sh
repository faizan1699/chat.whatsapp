
echo "🔧 Creating hobbies tables..."

TABLES=$(psql "postgresql://postgres.localhost:5432/nextjs_webrtc" -t -c "\dt" -U faizan169 -W 2>/dev/null | grep -E "(hoby|user_hoby)" || true)

if [ "$TABLES" != "true" ]; then
    echo "📋 Creating hoby table..."
    psql "postgresql://postgres.localhost:5432/nextjs_webrtc" -U faizan169 -c "
    CREATE TABLE IF NOT EXISTS \"hoby\" (
        \"id\" TEXT NOT NULL,
        \"name\" TEXT NOT NULL,
        \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \"updatedAt\" TIMESTAMP(3) NOT NULL,
        CONSTRAINT \"hoby_pkey\" PRIMARY KEY (\"id\")
    );

    CREATE UNIQUE INDEX IF NOT EXISTS \"hoby_name_key\" ON \"hoby\"(\"name\");
    " || echo "❌ Failed to create hoby table"

    echo "📋 Creating user_hoby table..."
    psql "postgresql://postgres.localhost:5432/nextjs_webrtc" -U faizan169 -c "
    CREATE TABLE IF NOT EXISTS \"user_hoby\" (
        \"id\" TEXT NOT NULL,
        \"userId\" TEXT NOT NULL,
        \"hobbyId\" TEXT NOT NULL,
        \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \"user_hoby_pkey\" PRIMARY KEY (\"id\")
    );

    CREATE INDEX IF NOT EXISTS \"user_hoby_userId_idx\" ON \"user_hoby\"(\"userId\");
    CREATE INDEX IF NOT EXISTS \"user_hoby_hobbyId_idx\" ON \"user_hoby\"(\"hobbyId\");
    CREATE UNIQUE INDEX IF NOT EXISTS \"user_hoby_userId_hobbyId_key\" ON \"user_hoby\"(\"userId\", \"hobbyId\");
    " || echo "❌ Failed to create user_hoby table"

    echo "📋 Adding foreign key constraints..."
    psql "postgresql://postgres.localhost:5432/nextjs_webrtc" -U faizan169 -c "
    ALTER TABLE \"user_hoby\" 
    ADD CONSTRAINT IF NOT EXISTS \"user_hoby_userId_fkey\" 
    FOREIGN KEY (\"userId\") REFERENCES \"users\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT IF NOT EXISTS \"user_hoby_hobbyId_fkey\" 
    FOREIGN KEY (\"hobbyId\") REFERENCES \"hoby\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE;
    " || echo "❌ Failed to add foreign keys"

    echo "📋 Inserting default hobbies..."
    psql "postgresql://postgres.localhost:5432/nextjs_webrtc" -U faizan169 -c "
    INSERT INTO \"hoby\" (id, name, \"updatedAt\") VALUES
    ('hobby_001', 'cricket', CURRENT_TIMESTAMP),
    ('hobby_002', 'football', CURRENT_TIMESTAMP),
    ('hobby_003', 'tennis', CURRENT_TIMESTAMP),
    ('hobby_004', 'badminton', CURRENT_TIMESTAMP),
    ('hobby_005', 'swimming', CURRENT_TIMESTAMP),
    ('hobby_006', 'cycling', CURRENT_TIMESTAMP),
    ('hobby_007', 'running', CURRENT_TIMESTAMP),
    ('hobby_008', 'gym', CURRENT_TIMESTAMP),
    ('hobby_009', 'yoga', CURRENT_TIMESTAMP),
    ('hobby_010', 'basketball', CURRENT_TIMESTAMP)
    ON CONFLICT (name) DO NOTHING;
    " || echo "❌ Failed to insert default hobbies"

    echo "✅ Hobbies tables created successfully!"
else
    echo "ℹ️  Hobbies tables already exist"
fi
