const { Client, MessageEmbed } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
require('dotenv').config()
const fs = require('fs')
const bot = new Client()

let db = new sqlite3.Database('./settings.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE)
db.run('CREATE TABLE IF NOT EXISTS data(server, channel, embed, content, title, description, img, imgurl)')

console.clear()

bot.on('ready', () => {
    console.log('WelcomeBot is legally ready!')
})

bot.on('message', (message) => {
    let args = message.content.split(' ');

    if (message.content === '<@!867880449560805377>') {
        const embed = new MessageEmbed().setTitle('Need assistance?').setDescription('The global prefix is `g?`')
        message.channel.send(embed)
    }
    if (message.content === `g?ping`) {
        message.channel.send(`:ping_pong: **Pong!** The current bot latency is \`${bot.ws.ping} ms\``)
    }
    if (message.content === `g?help`) {
        const embed = new MessageEmbed().setTitle('Commands').setDescription("`ping`, `help`, `invite`, `config`, `unconfig`, `confighelp`\n(I'm not some multipurpose bot)")
        message.channel.send(embed)
    }
    if (message.content === `g?invite`) {
        const embed = new MessageEmbed().setDescription('[**Invite me!**](https://discord.com/oauth2/authorize?client_id=867880449560805377&permissions=68624&scope=bot)')
        message.channel.send(embed)
    }
    if (args[0] === 'g?config') {
        if (message.member.hasPermission('ADMINISTRATOR')) {
            var rm = args.shift()
            if (!args.join(' ')) {
                message.reply(`Please specify a JSON configuration!`)
            } else {
                try { 
                    var json = JSON.parse(args.join(' '))
                    if (!json.embed === true && !json.embed === false && !json['content']['img'] === true && !json['content']['img'] === false) return message.reply('Please specify `true` or `false` for boolean preferences!')
                    if (json.embed === true) {
                        var content = json['content']
                        if (content['img'] === true) {
                            message.channel.send('A new configuration was added! Now just wait for some members to roll in.')
                            console.log(content['title'], content['desc'], content['imgurl'])
                            db.run(`INSERT OR IGNORE INTO data(server, channel, embed, content, title, description, img, imgurl) VALUES("${message.guild.id}", "${json.channel.replace('<#', '').replace('>', '')}", "${true}", "0", "${content['title']}", "${content['desc']}", ${true}, "${content['imgurl']}")`)
                        } else {
                            message.channel.send('A new configuration was added! Now sit back and relax.')
                            console.log(content['title'], content['desc'])
                            db.run(`INSERT OR IGNORE INTO data(server, channel, embed, content, title, description, img, imgurl) VALUES("${message.guild.id}", "${json.channel.replace('<#', '').replace('>', '')}", "${true}", "0", "${content['title']}", "${content['desc']}", ${false}, "${null}")`)
                        }
                    } else {
                        message.channel.send('A new configuration was added! Watch those cool messages go by!')
                        console.log(json.channel, json.content)
                        db.run(`INSERT OR IGNORE INTO data(server, channel, embed, content, title, description, img, imgurl) VALUES("${message.guild.id}", "${json.channel.replace('<#', '').replace('>', '')}", "${false}", "${json.content}", "${null}", "${null}", ${false}, "${null}")`)
                    } 
                } catch(err) { message.reply('That is an improper JSON format! Please check it and try again or run g?confighelp for some templates.') }
            }
        }
    }
    if (message.content === 'g?unconfig') {
        if (message.member.hasPermission('ADMINISTRATOR')) {
            db.run(`DELETE FROM data WHERE server = "${message.guild.id}"`)
            message.channel.send('Your server configuration has been removed successfully!')
        }
    }
    if (message.content === 'g?confighelp') {
        const embed = new MessageEmbed().setTitle('Templates').setDescription('(plain text) `{"channel": "#channel", "embed": false, "content": "welcome!"}`\n(embed) `{"channel": "#channel", "embed": true, "content": {"title": "hello there", "desc": "that wasnt a meme reference!", "img": false}}`\n(embed with image) `{"channel": "#channel", "embed": true, "content": {"title": "hello there", "desc": "that wasnt a meme reference!", "img": true, "imgurl": "https://example.com/picture.png"}}').setFooter('get a programmer to help you')
        message.channel.send(embed)
    }
})

bot.on('guildMemberAdd', function(member) {
    db.all('SELECT * FROM data', [], (err, rows) => {
        if (err) { throw err; }
        rows.forEach((row) => {
          if (row.server === member.guild.id) {
            if (row.content === '0') {
                if (row.img === 1) {
                        const embed = new MessageEmbed().setTitle(row.title).setDescription(row.description).setImage(row.imgurl).setAuthor(member.user.tag, member.user.displayAvatarURL()).setTimestamp()
                        bot.channels.cache.get(row.channel).send(embed)
                } else {
                        const embed = new MessageEmbed().setTitle(row.title).setDescription(row.description).setAuthor(member.user.tag, member.user.displayAvatarURL()).setTimestamp()
                        bot.channels.cache.get(row.channel).send(embed)
                }
            } else {
                bot.channels.cache.get(row.channel).send(`${member}, ${row.content}`)
            }
        }
        });
      });
  })

bot.login(process.env.TOKEN)