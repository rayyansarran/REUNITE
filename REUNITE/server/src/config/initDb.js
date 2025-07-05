const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcryptjs');

// Debug logging
console.log('Environment variables:', {
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_HOST: process.env.DB_HOST
});

async function initializeDatabase() {
    // First, connect to default postgres database to create our database
    const client = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'postgres' // Connect to default postgres database first
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL');

        // Check if our database exists
        const dbCheck = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [process.env.DB_NAME]
        );

        // Create database if it doesn't exist
        if (dbCheck.rows.length === 0) {
            console.log(`Creating database: ${process.env.DB_NAME}`);
            await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log('Database created successfully');
        } else {
            console.log('Database already exists');
        }

        await client.end();

        // Now connect to our database to create tables
        const dbClient = new Client({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        await dbClient.connect();
        console.log(`Connected to ${process.env.DB_NAME}`);

        // Create tables if they don't exist
        await createTables(dbClient);
        
        await dbClient.end();
        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

async function createTables(client) {
    try {
        // Create colleges table first (since users will reference it)
        await client.query(`
            CREATE TABLE IF NOT EXISTS colleges (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                location VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Colleges table checked/created');

        // Create users table with all new fields
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                firstName VARCHAR(255),
                lastName VARCHAR(255),
                phoneNumber VARCHAR(20),
                collegeName VARCHAR(255),
                yearOfGraduation INTEGER,
                currentCareerStatus VARCHAR(255),
                linkedinProfileUrl VARCHAR(500),
                studentMailId VARCHAR(255),
                bio TEXT,
                profilePicture VARCHAR(255) DEFAULT 'uploads/default.jpg',
                collegeId INTEGER REFERENCES colleges(id),
                status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'deactive', 'pending')),
                role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Users table checked/created');

        // Create posts table
        await client.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                image VARCHAR(255),
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
                is_college_specific BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Posts table checked/created');

        // Create comments table
        await client.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                text TEXT NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Comments table checked/created');

        // Create replies table
        await client.query(`
            CREATE TABLE IF NOT EXISTS replies (
                id SERIAL PRIMARY KEY,
                text TEXT NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Replies table checked/created');

        // Create likes table
        await client.query(`
            CREATE TABLE IF NOT EXISTS likes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, post_id)
            )
        `);
        console.log('Likes table checked/created');

        // Insert some default colleges
        await insertDefaultColleges(client);

        // Create default admin user
        await createDefaultAdmin(client);

        // Create indexes
        await createIndexes(client);

        // Create trigger function and triggers
        await createTriggers(client);

    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}

async function insertDefaultColleges(client) {
    try {
        const colleges = [
            { name: 'MIT', location: 'Cambridge, MA' },
            { name: 'Harvard', location: 'Cambridge, MA' },
            { name: 'Stanford', location: 'Stanford, CA' },
            { name: 'IIT Delhi', location: 'New Delhi, India' },
            { name: 'IIT Bombay', location: 'Mumbai, India' },
            { name: 'IIT Madras', location: 'Chennai, India' },
            { name: 'BITS Pilani', location: 'Pilani, India' },
            { name: 'NIT Trichy', location: 'Tiruchirappalli, India' }
        ];

        for (const college of colleges) {
            await client.query(`
                INSERT INTO colleges (name, location) 
                VALUES ($1, $2) 
                ON CONFLICT (name) DO NOTHING
            `, [college.name, college.location]);
        }
        console.log('Default colleges inserted');
    } catch (error) {
        console.error('Error inserting default colleges:', error);
        throw error;
    }
}

async function createDefaultAdmin(client) {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Check if admin user already exists
        const adminCheck = await client.query(
            "SELECT 1 FROM users WHERE email = $1",
            ['admin@alumni.com']
        );

        if (adminCheck.rows.length === 0) {
            // Create default admin user
            await client.query(`
                INSERT INTO users (username, email, password, firstName, lastName, phoneNumber, collegeName, yearOfGraduation, currentCareerStatus, linkedinProfileUrl, studentMailId, bio, profilePicture, collegeId, status, role)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                ON CONFLICT (email) DO NOTHING
            `, [
                'admin',
                'admin@alumni.com',
                hashedPassword,
                'Admin',
                'User',
                '1234567890',
                'MIT',
                2024,
                'Administrator',
                'https://www.linkedin.com/in/admin-user',
                'admin@alumni.com',
                'Default administrator account for the alumni platform.',
                'uploads/default.jpg',
                1,
                'active',
                'admin'
            ]);
            console.log('Default admin user created');
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Error creating default admin user:', error);
        // Don't throw error here as it's not critical for database initialization
    }
}

async function createIndexes(client) {
    try {
        // Create indexes if they don't exist
        const indexes = [
            { name: 'idx_users_college_id', table: 'users', column: 'collegeId' },
            { name: 'idx_users_status', table: 'users', column: 'status' },
            { name: 'idx_users_role', table: 'users', column: 'role' },
            { name: 'idx_users_email', table: 'users', column: 'email' },
            { name: 'idx_posts_user_id', table: 'posts', column: 'user_id' },
            { name: 'idx_posts_college_id', table: 'posts', column: 'college_id' },
            { name: 'idx_posts_is_college_specific', table: 'posts', column: 'is_college_specific' },
            { name: 'idx_comments_post_id', table: 'comments', column: 'post_id' },
            { name: 'idx_comments_user_id', table: 'comments', column: 'user_id' },
            { name: 'idx_replies_comment_id', table: 'replies', column: 'comment_id' },
            { name: 'idx_replies_user_id', table: 'replies', column: 'user_id' },
            { name: 'idx_likes_post_id', table: 'likes', column: 'post_id' },
            { name: 'idx_likes_user_id', table: 'likes', column: 'user_id' }
        ];

        for (const index of indexes) {
            await client.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_indexes WHERE indexname = '${index.name}'
                    ) THEN
                        CREATE INDEX ${index.name} ON ${index.table}(${index.column});
                    END IF;
                END $$;
            `);
        }
        console.log('Indexes checked/created');
    } catch (error) {
        console.error('Error creating indexes:', error);
        throw error;
    }
}

async function createTriggers(client) {
    try {
        // Create trigger function for snake_case columns
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updatedat_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        // Create triggers for all tables with updated_at columns
        const tables = ['posts', 'comments', 'replies', 'colleges', 'users'];
        for (const table of tables) {
            await client.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_trigger 
                        WHERE tgname = 'update_${table}_updatedat'
                    ) THEN
                        CREATE TRIGGER update_${table}_updatedat
                            BEFORE UPDATE ON ${table}
                            FOR EACH ROW
                            EXECUTE FUNCTION update_updatedat_column();
                    END IF;
                END $$;
            `);
        }

        console.log('Triggers checked/created');
    } catch (error) {
        console.error('Error creating triggers:', error);
        throw error;
    }
}

// Export the initialization function
module.exports = initializeDatabase; 