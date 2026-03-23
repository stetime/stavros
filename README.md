# Stavros

A Discord bot that announces RSS/Atom feed updates to a channel, among other things.

## Features

- **RSS/Atom feed monitoring** - Subscribe to feeds and get announcements when new posts appear
- **Twitter link conversion** - Automatically converts `twitter.com`/`x.com` links to `fxtwitter.com` for media embeds
- **Nickname rotation** - Randomly cycles the bot's nickname from a database of prefixes + names
- **Game/activity rotation** - Randomly sets what the bot is "playing"
- **YouTube feed support** - Detects YouTube channel URLs and converts them to RSS feeds
- **Reddit PVM command** - Fetches random "PVM" content from a specific subreddit

## This is a Hobby Bot

This bot was built for one specific Discord server. As such:

- **No permissions model** - Any user can run any command (add feeds, purge feeds, add games/names, etc.)
- **Hardcoded configuration** - Channel and guild IDs are set via environment variables
- **Single-server design** - Not architected for multi-guild support
- **Specific use case** - Built around the particular needs and quirks of one community

If you're looking for a general-purpose Discord bot, this probably isn't it. If you want something similar for your own server, you'll need to adapt the configuration and possibly add your own permissions/guards.

## Setup

### Environment Variables

```bash
token=                    # Discord bot token
channelId=                # Channel to post RSS updates and bot messages
guildId=                  # Discord server ID for nickname/activity changes
dbPath=                   # Path to SQLite database (optional, defaults to ./data/app.db)
CHECK_INTERVAL=           # RSS polling interval in ms (optional, defaults to 60000)
TWITTER_BEARER_TOKEN=     # Twitter API bearer token for posting nicknames
NODE_ENV=production       # Set to production for actual Twitter posts
```

### Running

**Note:** This bot uses discord.js and will not work with Bun due to WebSocket quirks on Bun's end. Use Node.

**Local development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm run start
```

**Docker:**
```bash
docker build -t stavros .
docker run stavros
```

## Commands

| Command | Description |
|---------|-------------|
| `/addfeed <url>` | Subscribe to an RSS/Atom feed |
| `/feeds` | List all subscribed feeds |
| `/purge` | Remove a feed subscription |
| `/addgame <name>` | Add a game to the activity rotation |
| `/addname <name>` | Add a name to the nickname rotation |
| `/addprefix <prefix>` | Add a prefix to the nickname rotation |
| `/getpvm` | Fetch a random PVM from Reddit |

## Architecture

```
src/
├── index.ts          # Main entry point, Discord client setup
├── commands/         # Slash command implementations
├── lib/
│   ├── db.ts         # SQLite database wrapper
│   ├── rss.ts        # RSS parsing and feed management
│   ├── youtube.ts    # YouTube channel URL to RSS conversion
│   ├── twitter.ts    # Twitter API integration
│   ├── reddit.ts     # Reddit API integration
│   └── generators.ts # Nickname and activity rotation logic
└── utils/
    ├── logger.ts     # Winston logging configuration
    └── errorHandler.ts
```

### Database

SQLite with direct SQL (no ORM). Tables:
- `sources` - RSS feed subscriptions
- `games` - Games for activity rotation
- `names` - Names for nickname rotation
- `prefixes` - Prefixes for nickname rotation

### Feed Management

Feeds are polled on the configured interval. New posts are detected by comparing:
- Publication date, or
- GUID if no date is available

Updates are announced as embeds with title, link, description, and thumbnail.

## License

ISC
