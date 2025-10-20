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
        host: process.env.DATABASE_ADD, 
        user: process.env.DATABASE_USR, 
        password: process.env.DATABASE_PWD, 
        database: process.env.DATABASE_NAM, 
    });

    // Create table if not exists
    const dbName = process.env.DATABASE_NAM;
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, process.env.DATABASE_NAM);
    return connection;
}
