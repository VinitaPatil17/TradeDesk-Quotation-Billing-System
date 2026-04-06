const pool = require("./config/db"); // correct path

async function createUsersTable(){

    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100) UNIQUE,
            password VARCHAR(255),
            phone VARCHAR(15),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try{
        await pool.query(query);
        console.log("✅ Users table created successfully");
    }catch(err){
        console.log("❌ Error creating table:", err);
    }finally{
        process.exit(); // close script
    }
}

createUsersTable();