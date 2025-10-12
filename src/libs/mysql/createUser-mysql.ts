// createUser-mysql.ts
//import mysql from "mysql2/promise";
import { initDB } from "./db-mysql";
import { UserRepository } from "./userRepository-mysql";

export class CreateUser {
  constructor() {}
/*
  async create() {
    const db = await initDB();

    const repo = new UserRepository(db);

    // Clear old data
    await db.execute("DELETE FROM users");

    const c1 = await repo.create("Client1", "docClient1", "2000-01-01", "xptzclient1", "");
    const c2 = await repo.create("Client2", "docClient2", "2000-01-01", "xptzclient2", "");
    const p1 = await repo.create("IParticipant1", "docIParticipant1", "2000-01-01", "xptziparticipant1", "");
    const p2 = await repo.create("IParticipant2", "docIParticipant2", "2000-01-01", "xptziparticipant2", "");

    console.log("Created:", c1, c2, p1, p2);

    console.log("List:", await repo.list());

    console.log("Read user 1: ", await repo.read(c1.id));
    console.log("Read user 2: ", await repo.read(c2.id));
    console.log("Read iparticipant 1: ", await repo.read(p1.id));
    console.log("Read iparticipant 2: ", await repo.read(p2.id));

    await db.end();  
  }  
*/
  async update(id: number, data: {
    name?: string;
    doc?: string;
    birthDate?: Date;
    password?: string;
    vcHash?: string;
  }) {
    const db = await initDB();
    const repo = new UserRepository(db);

    const updated = await repo.update(id, data);

    console.log("Updated user: ", updated);

    await db.end();
  }
  async delete(id : number) {

    const db = await initDB();
    const repo = new UserRepository(db);
    
    const user = await repo.listUser(id);

    await repo.delete(id);
    
    console.log("Deleted user: ", user);
    
    await db.end();
  }
  async list() {

    const db = await initDB();
    const repo = new UserRepository(db);
    
    const user = await repo.list();

    console.log("Users Listed");
    
    await db.end();
  }  
  async listUser(id : number) {

    const db = await initDB();
    const repo = new UserRepository(db);
    
    const user = await repo.listUser(id);

    console.log("User Listed");
    
    await db.end();
  }
}