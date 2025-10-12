//import { BusinessError } from "../errors/BusinessError";
import { getDb } from "./db-mysql";

export interface IRequest {
    id: number;
    from_aa: string;
    to_aa: string;
    message: string | null;
    types_needed_json: string | null;   // armazenado como JSON string no banco
    types_granted_json: string | null;  // idem
    date_request: string | null;        // ISO string
    date_response: string | null;       // ISO string
}

export class RequestRepository {
    async getDb() {
        return await getDb();
    }

    async sendRequest(from: string, to: string, types: number[], message?: string): Promise<IRequest> {
        let db = await this.getDb();

        const existing = await db.execute(
            `SELECT id FROM requests WHERE from_aa = ? AND to_aa = ? AND date_response IS NULL`,
            [from, to]
        );

        if (existing) {
            throw new Error("Já existe uma requisição aguardando resposta");
        }

        const now = new Date().toISOString();
        const typesJson = JSON.stringify(types);

        await db.execute(
            `INSERT INTO requests (from_aa, to_aa, message, types_needed_json, date_request) 
             VALUES (?, ?, ?, ?, ?)`,
            [from, to, message ?? null, typesJson, now]
        );

        return this.getLastRequest(from, to)
    }

    async getLastRequest(from: string, to: string): Promise<IRequest> {
        let db = await this.getDb();
        const [rows] = await db.execute<any>(
            `SELECT * FROM requests WHERE from_aa=? AND to_aa = ? AND date_response IS NULL LIMIT 1`,
            [from, to]
        );

        return rows[0];
    }

    async verifyRequest(to: string): Promise<IRequest[]> {
        let db = await this.getDb();
        const [rows] = await db.execute(
            `SELECT * FROM requests WHERE to_aa = ? AND date_response IS NULL`,
            [to]
        );

        return rows as IRequest[];
    }

    async respondRequest(from: string, to: string, typesGranted: number[]): Promise<void> {
        let db = await this.getDb();
        const now = new Date().toISOString();
        const typesGrantedJson = JSON.stringify(typesGranted);

        await db.execute(
            `UPDATE requests 
             SET types_granted_json = ?, date_response = ? 
             WHERE to_aa = ? and from_aa = ? and date_response is null`,
            [typesGrantedJson, now, to, from]
        );
    }

    async verifyResponse(from: string, to: string): Promise<IRequest | undefined> {
        let db = await this.getDb();
        const [rows] = await db.execute(
            `SELECT * FROM requests 
             WHERE from_aa = ? AND to_aa = ? AND date_response IS NOT NULL
             ORDER BY date_response DESC
             LIMIT 1`,
            [from, to]
        );

        const results = rows as IRequest[];
        return results[0];
    }
}
