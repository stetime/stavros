import { Database } from "bun:sqlite"
import logger from "../utils/logger.js"

interface Source {
  id?: string
  url: string
  title: string
  image?: string
  latestpostDate?: string
  latestpostGuid?: string
  etags?: string
  lastModified?: string
}

class Db {
  private db: Database
  constructor(dbPath: string = "./db.sqlite") {
    this.db = new Database(dbPath, { create: true, strict: true })
    this.db.run("PRAGMA journal_mode = WAL")
    logger.info("database initialised")
    this.init()
  }

  private init() {
    this.db.run(
      `CREATE TABLE IF NOT EXISTS sources (
        id TEXT UNIQUE NOT NULL,
        url TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        image TEXT,
        latest_post_date TEXT,
        latest_post_guid TEXT,
        etags TEXT,
        last_modified TEXT
      );`
    )
    this.db.run(
      `CREATE TABLE IF NOT EXISTS games (
        game TEXT PRIMARY KEY UNIQUE NOT NULL
      ) WITHOUT ROWID
      `
    )
    this.db.run(
      `CREATE TABLE IF NOT EXISTS names(
        name TEXT PRIMARY KEY UNIQUE NOT NULL
      ) WITHOUT ROWID
       `
    )
    this.db.run(
      `CREATE TABLE IF NOT EXISTS prefixes(
        prefix TEXT PRIMARY KEY UNIQUE NOT NULL
      ) WITHOUT ROWID`
    )
  }

  getFeeds(): Source[] {
    return this.db.prepare("SELECT * FROM sources").all() as Source[]
  }

  getFeed(url: string): Source | null {
    return this.db
      .prepare("SELECT * FROM sources WHERE url = ?")
      .get(url) as Source | null
  }

  addFeed(url: string, title: string, image?: string): Source | undefined {
    const id = Bun.randomUUIDv7()
    const row = this.db
      .prepare(
        "INSERT INTO sources (id, url, title, image) VALUES (?, ?, ?) RETURNING *"
      )
      .get(id, url, title, image ?? null)
    return row as Source | undefined
  }

  updateFeed(feedId: string, date: string, guid: string): void {
    this.db
      .prepare(
        "UPDATE sources SET latest_post_date = ?, latest_post_guid = ? where id = ?"
      )
      .run(date, guid, feedId)
  }

  updateUrl(feedId: string, url: string): void {
    this.db.prepare("UPDATE sources SET url = ? WHERE id = ?").run(url, feedId)
  }

  purgeFeed(feedId: string): boolean {
    const result = this.db
      .prepare("DELETE FROM sources WHERE id = ?")
      .run(feedId)
    return result.changes > 0
  }

  getGames(): string[] {
    const result = this.db.prepare("SELECT game FROM games").all() as Array<{
      game: string
    }>
    return result.map((r) => r.game)
  }

  getGame(): string | null {
    const result = this.db
      .prepare("SELECT game FROM games ORDER BY RANDOM() LIMIT 1")
      .get() as { game: string } | undefined
    return result ? result.game : null
  }

  getNick() {
    const prefix = this.db
      .prepare("SELECT prefix FROM prefixes ORDER BY RANDOM() LIMIT 1")
      .get()
    const name = this.db
      .prepare("SELECT name FROM names ORDER BY RANDOM() LIMIT 1")
      .get()
    return { prefix, name }
  }

  findPrefix(query: string) {
    return this.db
      .prepare("SELECT prefix FROM prefixes WHERE prefix = ?")
      .get(query)
  }

  findName(query: string) {
    return this.db.prepare("SELECT name FROM names WHERE name = ?").get(query)
  }

  findGame(query: string) {
    return this.db.prepare("SELECT game FROM games WHERE game = ?").get(query)
  }

  addPrefix(prefix: string) {
    this.db
      .prepare("INSERT INTO prefixes (prefix) VALUES (?) RETURNING *")
      .run(prefix)
  }

  addName(name: string) {
    this.db.prepare("INSERT INTO names (name) VALUES (?) RETURNING *").run(name)
  }

  addGame(game: string) {
    this.db.prepare("INSERT INTO games (game) VALUES (?) RETURNING *").run(game)
  }

  close() {
    this.db.close()
    logger.info("database disconnected")
  }
}

export const db = new Db()
