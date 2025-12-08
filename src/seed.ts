import { Database } from "bun:sqlite"
import logger from "./utils/logger"

interface Source {
  id: string
  url: string
  title: string
  image?: string
  latestpostDate?: string
  latestpostGuid?: string
  etags?: string
  lastModified?: string
}

class sqlitedb {
  private db: Database
  constructor(dbPath: string = "../db.sqlite") {
    this.db = new Database(dbPath, { create: true, strict: true })
    this.db.run("PRAGMA journal_mode = WAL")
    logger.info("db initialised")
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
      ) WITHOUT ROWID;
      `
    )
    this.db.run(
      `CREATE TABLE IF NOT EXISTS names (
        name TEXT PRIMARY KEY UNIQUE NOT NULL
      ) WITHOUT ROWID;
      `
    )
    this.db.run(
      `CREATE TABLE IF NOT EXISTS prefixes (
        prefix TEXT PRIMARY KEY UNIQUE NOT NULL
      ) WITHOUT ROWID;
      `
    )
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

  addFeed(url: string, title: string, image?: string): Source | undefined {
    const id = Bun.randomUUIDv7()
    const row = this.db
      .prepare(
        "INSERT INTO sources (id, url, title, image) VALUES (?, ?, ?, ?) RETURNING *"
      )
      .get(id, url, title, image ?? null)
    return row as Source | undefined
  }

  getNames() {
    return this.db.prepare("SELECT * FROM games").all()
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
      .get()

    return row // { prefix: "cool", name: "dragon" }
  }
}

const db = new sqlitedb()

async function seedPrefixes() {
  const json = (await Bun.file("./prefixes.json").json()) as { body: string }[]
  console.log(`unfiltered prefixes length: ${json.length}`)
  const set = [...new Set(json.map((prefix) => prefix.body))] as string[]
  set.forEach((prefix) => db.addPrefix(prefix))
}

async function seedGames() {
  const json = (await Bun.file("./games.json").json()) as { body: string }[]
  console.log(`unfiltered games length: ${json.length}`)
  const set = [...new Set(json.map((game) => game.body))] as string[]
  console.log(`filtered set length: ${set.length}`)
  set.forEach((game) => db.addGame(game))
}

async function seedNames() {
  const json = (await Bun.file("./names.json").json()) as { body: string }[]
  console.log(`unfiltered games length: ${json.length}`)
  const set = [...new Set(json.map((name) => name.body))] as string[]
  set.forEach((name) => db.addName(name))
}

async function seedFeeds() {
  const json = await Bun.file("./feeds.json").json()
  json.forEach((item) => {
    const j = {
      url: item.url,
      title: item.title,
      image: item.image,
      latestpostDate: item.latestPost.pubDate.$date,
      latestpostGuid: item.latestPost.guid,
    }
    db.addFeed(j.url, j.title, j.image)
  })
}

seedFeeds()
