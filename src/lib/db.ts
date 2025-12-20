import { Database } from "bun:sqlite"
import logger from "../utils/logger.js"
import path from "path"
import { mkdirSync } from "fs"

export interface Source {
  id?: string
  url: string
  title: string
  image?: string
  latest_post_date?: string
  latest_post_guid?: string
  etags?: string
  lastModified?: string
}

class Db {
  private db: Database
  constructor(
    dbPath: string = process.env.dbPath ||
      path.join(process.cwd(), "data", "app.db")
  ) {
    console.log("CWD:", process.cwd())
    mkdirSync(path.dirname(dbPath), { recursive: true })
    this.db = new Database(dbPath, { create: true, strict: true })
    this.db.run("PRAGMA journal_mode = WAL")
    logger.info("database initialised")
    this.init()
  }

  init() {
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

  addFeed(
    url: string,
    title: string,
    image: string | null
  ): Source | undefined {
    const id = Bun.randomUUIDv7()
    const row = this.db
      .prepare(
        "INSERT INTO sources (id, url, title, image) VALUES (?, ?, ?, ?) RETURNING *"
      )
      .get(id, url, title, image ?? null)
    return row as Source | undefined
  }

  updateFeed(
    feedId: string,
    date: string | undefined,
    guid: string | undefined
  ): void {
    console.log(date, guid, feedId)
    this.db
      .prepare(
        "UPDATE sources SET latest_post_date = ?, latest_post_guid = ? where id = ?"
      )
      .run(date ?? null, guid ?? null, feedId)
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
    const row = this.db
      .prepare(
        `
    SELECT
      (SELECT prefix FROM prefixes ORDER BY RANDOM() LIMIT 1) AS prefix,
      (SELECT name   FROM names    ORDER BY RANDOM() LIMIT 1) AS name
  `
      )
      .get() as { prefix: string; name: string } | undefined
    return row ? row : null
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
