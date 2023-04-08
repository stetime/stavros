import Parser from 'rss-parser'

const parser = new Parser()

const result = await parser.parseURL('https://www.youtube.com/feeds/videos.xml?channel_id=UCwPvdwZZ35dm6xozp-zpcpQ')
console.log(result)