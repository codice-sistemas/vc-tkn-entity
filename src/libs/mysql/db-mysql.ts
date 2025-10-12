// db-mysql.ts
import mysql from "mysql2/promise";

export interface IUser {
        id: number,
        name: string,
        doc: string,
        birthDate: string,
        password?: string,
        vcHash?: string,
        ifHash?: string,
        auth_sub?: string,
        role?: string,
}

let db: mysql.Connection | null = null;

export async function getDb(): Promise<mysql.Connection> {
  if (db) return db;

  db = await initDB();

  return db;
}

export async function initDB() : Promise<mysql.Connection> {
    const connection = await mysql.createConnection({
        host: "localhost", 
        user: "vc-tkn-usr", 
        password: "vc-tkn-pwd", 
        database: `vc_tkn`, 
    });

    // Create table if not exists
    await connection.query("CREATE DATABASE IF NOT EXISTS vc_tkn;");
/*
    // Create table if not exists
    await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name TEXT NOT NULL,
        doc VARCHAR(25) NOT NULL,
        birthDate DATE NOT NULL,
        password TEXT NULL, 
        vcHash VARCHAR(255) NULL,
        ifHash VARCHAR(255) NULL,
        auth_sub VARCHAR(255) NULL,
        role TEXT NULL, 
        UNIQUE INDEX document_udx (doc), 
        UNIQUE INDEX vc_hash_udx (vcHash), 
        UNIQUE INDEX if_hash_udx (ifHash), 
        INDEX auth_sub_udx (auth_sub)  
    );
    `);


    await connection.query(`
    CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        from_aa VARCHAR(255) NOT NULL,
        to_aa VARCHAR(255) NOT NULL,
        message TEXT NULL, 
        types_needed_json TEXT NULL,
        types_granted_json TEXT NULL,
        date_request DATE,
        date_response DATE, 
        INDEX requests_client_idx (to_aa, date_response),
        INDEX requests_if_idx (from_aa, to_aa, date_response)        
    );
    `);
*/    
    return connection;
}
