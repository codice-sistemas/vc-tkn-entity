// userRepository-mysql.ts
import mysql from "mysql2/promise";
import { getDb, IUser } from "./db-mysql";
import { JWTPayload } from "jose";

export class UserRepository {
  _db : mysql.Connection | null = null;
  constructor(db?: mysql.Connection) {
    if(db){
      this._db = db;      
    }
  }

  async getDb() : Promise<mysql.Connection> {
    if(this._db){
      return this._db;
    }
    return getDb();
  }

  async getUserByVcHash(vcHash: string): Promise<IUser | null> {
    
      let db = await this.getDb();

      let row = await db.execute(
        `SELECT * FROM users WHERE vcHash = ? LIMIT 1`,
        [vcHash]);
      
      if (!row) {
        return null;
      }

      return this._getIUser(row);      
    
  }

  async getUserByIfHash(ifHash: string): Promise<IUser | null> {
    
      let db = await this.getDb();

      let row = await db.execute(
        `SELECT * FROM users WHERE ifHash = ? LIMIT 1`,
        [ifHash]);
      
      if (!row) {
        return null;
      }

      return this._getIUser(row);      
    
  }

  _getIUser(row: any): IUser
  {
    const user: IUser = {
        id: row.id,
        name: row.name,
        doc: row.doc,
        birthDate: row.birthDate, 
        password: row.password ?? undefined,
        vcHash: row.vcHash ?? undefined,
        ifHash: row.ifHash ?? undefined,
        auth_sub: row.auth_sub ?? undefined,
        role: row.role ?? undefined,
      };
      return user;
  }


  async create(name: string, doc: string, birthDate: string, password: string, vcHash: string, auth?:JWTPayload, ifHash?: string): Promise<IUser> {
    let db = await this.getDb();
    let auth_sub;
    let role = "user";
    if(auth && auth.sub){
      auth_sub = auth.sub;
      role = (auth as any).realm_access.roles[0] as string;
    }

    const [result]: any = await db.execute(
      "INSERT INTO users (name, doc, birthDate, password, vcHash, auth_sub, role, ifHash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, doc, birthDate, password, vcHash, auth_sub, role, ifHash]
    );


    return { id: result.insertID, name, doc, birthDate, password, vcHash, auth_sub, role };
  }

  async read(id: number | undefined) {
    if (!id) return null;
    const db = await this.getDb();
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
    const row: any = Array.isArray(rows) && rows.length ? rows[0]: null;
    return row;
  }

  async update(id: number, data: { 
    name?: string | undefined;
    doc?: string | undefined; 
    birthDate?: Date | undefined; 
    password?: string | undefined; 
    vcHash?: string | undefined;
    classCode?: string | undefined;
  }) {
    let db = await this.getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.doc) {
      fields.push("doc = ?");
      values.push(data.doc);
    }
    if (data.birthDate) {
      fields.push("birthDate = ?");
      values.push(data.birthDate);
    }
    if (data.password) {
      fields.push("password = ?");
      values.push(data.password);
    }
    if (data.vcHash) {
      fields.push("vcHash = ?");
      values.push(data.vcHash);
    }
    if (data.classCode) {
      fields.push("classCode = ?");
      values.push(data.classCode);
    }
    values.push(id);

    if (fields.length === 0) return null;
    
    values.push(id);
    await db.execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
    return this.read(id);
  }

  
  async delete(id: number) {
    const db = await this.getDb();
    const [result]: any = await db.execute("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  async list(classCode: string) {
    console.log("listando");
    let db = await this.getDb();
    const [rows] = await db.execute("SELECT * FROM users WHERE classCode = ?", [classCode]);
    return rows;
  }
  
  async listUser(id: number) {
    let db = await this.getDb();
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
    return rows;
  }
}
