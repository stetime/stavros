import Database from "better-sqlite3"
import type { Database as DatabaseType, Statement } from "better-sqlite3"
import logger from "../utils/logger.js"
import path from "path"
import { mkdirSync } from "fs"
import { randomUUID } from "crypto"

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
  private db: DatabaseType
  private statements: {
    updateFeed: Statement
    updateUrl: Statement
    getFeed: Statement
    deleteFeed: Statement
    getFeeds: Statement
    addFeed: Statement
  }

  constructor(
    dbPath: string = process.env.dbPath ||
      path.join(process.cwd(), "data", "app.db")
  ) {
    mkdirSync(path.dirname(dbPath), { recursive: true })
    this.db = new Database(dbPath)
    this.db.exec("PRAGMA journal_mode = WAL")
    this.db.exec("PRAGMA synchronous = NORMAL")
    this.db.exec("PRAGMA wal_autocheckpoint = 1000")
    logger.info("database initialised")
    this.init()

    // Initialize statements after tables are created
    this.statements = {
      updateFeed: this.db.prepare<
        Source,
        [string | null, string | null, string]
      >(
        "UPDATE sources SET latest_post_date = ?, latest_post_guid = ? WHERE id = ?"
      ),
      updateUrl: this.db.prepare<Source, [string, string]>(
        "UPDATE sources SET url = ? WHERE id = ?"
      ),
      getFeed: this.db.prepare<Source, [string]>(
        "SELECT * FROM sources WHERE url = ?"
      ),
      deleteFeed: this.db.prepare<Source, [string]>(
        "DELETE FROM sources WHERE id = ?"
      ),
      getFeeds: this.db.prepare<Source, []>("SELECT * FROM sources"),
      addFeed: this.db.prepare<Source, [string, string, string, string | null]>(
        "INSERT INTO sources (id, url, title, image) VALUES (?, ?, ?, ?) RETURNING *"
      ),
    }
  }

  init() {
    this.db.exec(
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
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS games (
        game TEXT PRIMARY KEY UNIQUE NOT NULL
      ) WITHOUT ROWID
      `
    )
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS names(
        name TEXT PRIMARY KEY UNIQUE NOT NULL
      ) WITHOUT ROWID
       `
    )
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS prefixes(
        prefix TEXT PRIMARY KEY UNIQUE NOT NULL
      ) WITHOUT ROWID`
    )
  }

  getFeeds(): Source[] {
    return this.statements.getFeeds.all() as Source[]
  }

  getFeed(url: string): Source | null {
    return (this.statements.getFeed.get(url) as Source) ?? null
  }

  addFeed(
    url: string,
    title: string,
    image: string | null
  ): Source | undefined {
    const id = randomUUID()
    return this.statements.addFeed.get(id, url, title, image ?? null) as
      | Source
      | undefined
  }

  updateFeed(
    feedId: string,
    date: string | undefined,
    guid: string | undefined
  ): void {
    logger.debug("running update statement")
    this.statements.updateFeed.run(date ?? null, guid ?? null, feedId)
  }

  updateUrl(feedId: string, url: string): void {
    this.statements.updateUrl.run(url, feedId)
  }

  purgeFeed(feedId: string): boolean {
    const result = this.statements.deleteFeed.run(feedId)
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
