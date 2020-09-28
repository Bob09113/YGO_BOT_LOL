const Discord = require('discord.js');
const fs = require('fs')

const cmds = require('./commands.json')

const bot = new Discord.Client();
const g = require('./data/_guild.json')

const config = require('./confg.json');
const { deck } = require('./decks/decks');



function permErr(perm){
    return new Discord.MessageEmbed().setTitle('MISSING PERMS').setColor('#ff0000').setDescription(`Required Perms: ${perm}`);
}
function toDate(ms = 0){
    return new Date(ms)
}
function toMS(time = ''){
    if(!time){
        return 10;
    }else{
        t = time.split('')
        let sel = time[time.length-1];
        t = t.join('');
        t = parseInt(t)
        if(isNaN(t)){
            return 10;
        }else{
            if(sel === 's'){
                return t*1000;
            }else if(sel === 'm'){
                return t*60000;
            }else if(sel === 'h'){
                return t*(60000*60)
            }else if(sel === 'd'){
                return t*((60000*60)*24)
            }else{
                return 10;
            }
        }
    }
}
function toReadable(ms = 0){
    let n = new Date(ms);
    let year = n.getUTCFullYear();
    let month = n.getUTCMonth();
    let day = n.getUTCDate();
    return `${month}/${day}/${year}`
}

function dateLeaderboard(message, l){
    let a = []
    message.guild.members.cache.forEach(member => {
        if(l === 'create'){
            a.push(`${member.nickname || member.user.username} - ${member.user.createdTimestamp}`);
        }else if(l === 'join'){
            a.push(`${member.nickname || member.user.username} - ${member.joinedTimestamp}`);
        }
    })
    let b = a.sort((a,b) => parseInt(b.split(' - ')[1])-parseInt(a.split(' - ')[1]));
    //console.log(b)
    b.reverse();
    for(var i = 0;i<b.length;i++){
        let l = b[i].split(' - ')
        l[1] = parseInt(l[1])
        b[i] = `**${i+1}. ${l[0]}:** ${toReadable(l[1])}`;
    }
    return new Discord.MessageEmbed()
    .setTitle('Account Creations')
    .setColor(g.color)
    .setDescription(b.join('\n'))
}


function leaderboard(message){
    let a = []
    message.guild.members.cache.forEach(member => {
        let m = require(`./data/members/${member.id}.json`)
        let loss = m.losses || 1
        let ratio = Math.floor((m.wins/loss)*100)/100
        a.push(`${member.nickname || member.user.username} ${m.wins}W/${m.losses}L - ${ratio*100}`);
    })
    let b = a.sort((a,b) => parseInt(b.split(' - ')[1])-parseInt(a.split(' - ')[1]));
    //console.log(b)
    b = b.slice(0,20);
    for(var i = 0;i<b.length;i++){
        let l = b[i].split(' - ')
        l[1] = parseInt(l[1])/100
        b[i] = `**${i+1}. ${l[0]}:** ${l[1]}`;
        if(l[1] === 0){
            b = b.slice(0, i)
        }
    }
    return new Discord.MessageEmbed()
    .setTitle('Top 20 W/L Ratios')
    .setColor(g.color)
    .setDescription(b.join('\n'))
}


bot.on('ready', async () => {
    let guild = require('./data/_guild.json')
    console.log(`Logged in as ${bot.user.username} in ${bot.guilds.cache.size} server`);
    bot.user.setActivity(`${guild.prefix}help`, {
        type: 'PLAYING',
    })
    let c = bot.channels.cache.get('690420795419263017')
    bot.channels.cache.forEach(channel => {
        if(channel.name === 'admin-chat'){
            console.log(channel.id)
        }
    })
})

bot.on('guildDelete', async guild => {
    console.log(guild.name)
})

bot.on('guildMemberAdd', async member => {
    let guild = require('./data/_guild.json')
    let channel = member.guild.channels.cache.get(guild.welcome)
    let stats = {
        wins: 0,
        losses: 0,
        common: 0,
        rare: 0,
        super: 0,
        secret: 0,
        ultra: 0,
        warns: 0,
        mutes: 0,
    }
    fs.writeFile(`./data/members/${member.id}.json`, JSON.stringify(stats), function(){});
    (await member.guild.fetchInvites()).forEach(inv => {
        let i = require(`./data/invites/${inv.code}.json`)
        if(inv.uses>i.uses){
            let embed = new Discord.MessageEmbed()
            .setTitle(`${member.user.tag} invited with code ${inv.code}`)
            .setColor(guild.color)
            .setThumbnail(member.user.avatarURL())
            .setDescription(`
                **Inviter** - ${inv.inviter.tag}
                **Invite Uses** - ${inv.uses}
            `)
            channel.send(embed);
            i.uses = inv.uses;
            fs.writeFile(`./data/invites/${inv.code}.json`, JSON.stringify(i), function(){});
        }
    })
})

bot.on('guildMemberRemove', async member => {
    let guild = require('./data/_guild.json')
    //let mem = require(`./data/members/${member.id}.json`)
    let channel = member.guild.channels.cache.get(guild.leave)

    channel.send(`So sad to see ${member.user.tag} go...`)

})

bot.on('inviteCreate', async inv => {
    let st = {
        code: inv.code,
        creation: inv.createdTimestamp,
        expiration: inv.expiresTimestamp,
        inviter: inv.inviter.id,
        uses: inv.uses,
    }
    fs.writeFile(`./data/invites/${inv.code}.json`, JSON.stringify(st), function(){})
})

bot.on('message', async message => {
    if(message.author.bot) return;
    if(message.content === '!d bump'){message.delete()}
    let guild = require('./data/_guild.json')
    let userData = require(`./data/members/${message.author.id}.json`)
    let prefix = guild.prefix;
    if(!message.content.startsWith(prefix)) return;
    let arr = message.content.split(' ')
    let cmd = arr[0].toLowerCase();
    cmd = cmd.split('').slice(prefix.length).join('');
    let args = arr.slice(1)
    if(message.channel.type == 'dm'){
        if(cmd === 'reason'){
            let channel = bot.channels.cache.get('756594896051372043');
            let reason = args.join(' ');
            if(!reason){
                message.channel.send('Please supply a reason!')
            }else{
                channel.send(
                    new Discord.MessageEmbed()
                    .setTitle(message.author.tag)
                    .setColor('#ff0000')
                    .setDescription(`**${reason}**`)
                )
                message.channel.send('Thanks for your answer!')
            }
        }else{
            return;
        }
    }

    if(cmd === 'help'){
        let embed = new Discord.MessageEmbed()
        .setTitle(`${message.guild.name}`)
        .setColor(guild.color)
        let sel = args[0]
        if(!sel){
            embed.setDescription(`
                ***Do ${prefix}help {command} for commands usage***
                **Help** - Show this command
                **Prefix** - Set the bot prefix
                **Member/User** - Show basic info on a user
                **Server/Guild** - Show server info
                **Kick** - Kick a member
                **Ban** - Ban a member
                **Mute** - Mute a member
                **Warn** - Warn a member
                **Profile** - Show a member's stats
                **w** - Add or remove wins from a member
                **l** - Add or remove losses from a member
                **leaderboard** - Show a leaderboard of W/L Ratios
                **ages** - Show all member's account ages(UTC)
                **joined** - Show all member's joined dates(UTC)
                **add-token** - Add tokens to a member's account
                **add-token** - Remove tokens from a member's account
                **set-token** - Set a member's token count to a specified number
            `)
        }else{
            sel = sel.toLowerCase();
            let com = cmds[sel];
            if(!com){
                embed.setDescription(`
                    ***Do ${prefix}help {command} for commands usage***
                    **Help** - Show this command
                    **Prefix** - Set the bot prefix
                    **Member/User** - Show basic info on a user
                    **Server/Guild** - Show server info
                    **Kick** - Kick a member
                    **Ban** - Ban a member
                    **Mute** - Mute a member
                    **Warn** - Warn a member
                    **Profile** - Show a member's stats
                    **w** - Add or remove wins from a member
                    **l** - Add or remove losses from a member
                    **leaderboard** - Show a leaderboard of W/L Ratios
                    **ages** - Show all member's account ages(UTC)
                    **joined** - Show all member's joined dates(UTC)
                    **add-token** - Add tokens to a member's account
                    **add-token** - Remove tokens from a member's account
                    **set-token** - Set a member's token count to a specified number
                `)
            }else{
                embed.setDescription(`${prefix}${com}`)
            }
        }
        message.channel.send(embed)
    }

    if(cmd === 'prefix'){
        if(!message.member.hasPermission('MANAGE_GUILD')){
            message.channel.send(permErr('Manage Guild'))
        }else{
            let pref = args[0]
            if(!pref) return;
            pref = pref.toLowerCase();
            guild.prefix = pref;
            fs.writeFile('./data/_guild.json', JSON.stringify(guild), function(){})
            message.channel.send(
                new Discord.MessageEmbed()
                .setTitle(`${pref} is now the prefix`)
                .setColor(guild.color)
            )
            bot.user.setActivity(`${guild.prefix}help`, {
                type: 'PLAYING'
            })
        }
    }

    if(cmd === 'member' || cmd === 'user'){
        let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        let embed = new Discord.MessageEmbed()
        .setTitle(member.user.tag)
        .setColor(guild.color)
        .setDescription(`
            **ID** - ${member.id}
            **Account Creation** - ${toDate(member.user.createdAt)}
            **Joined Server** - ${toDate(member.joinedAt)}
        `)

        message.channel.send(embed)
    }

    if(cmd === 'server' || cmd === 'guild'){
        message.channel.send(
            new Discord.MessageEmbed()
            .setTitle(`${message.guild.name}`)
            .setColor(guild.color)
            .setDescription(`
                **Creation** - ${toDate(message.guild.createdTimestamp)}
                **Member Count** - ${message.guild.members.cache.size}
                **Channel Count** - ${message.guild.channels.cache.size}
                **Role Count** - ${message.guild.roles.cache.size}
                **Highest Role** - ${message.guild.roles.highest}
                **Prefix** - ${guild.prefix}
                **Color** - ${guild.color}
                **Welcome Channel** - ${message.guild.channels.cache.get(guild.welcome)}
                **Leave Channel** - ${message.guild.channels.cache.get(guild.leave)}
            `)
        )
    }

    if(cmd === 'kick'){
        if(!message.member.hasPermission('KICK_MEMBER')){
            message.channel.send(permErr('Kick Members'))
        }else{
            let member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
            if(!member){message.channel.send('You must give a valid member!'); return}
            let reason = args.slice(1).join(' ') || 'No Reason Given';
            member.send(
                new Discord.MessageEmbed()
                .setTitle(`Kicked from ${message.guild.name} by ${message.author.tag}`)
                .setColor('#ff0000')
                .setDescription(`**Reason** - ${reason}`)
            ).then(msg => {
                setTimeout(function(){member.kick()}, 3000);
                message.channel.send(`Member kicked for reason: ${reason}`)
            })
        }
    }

    if(cmd === 'ban'){
        if(!message.member.hasPermission('BAN_MEMBER')){
            message.channel.send(permErr('Ban Members'))
        }else{
            let member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
            if(!member){message.channel.send('You must give a valid member!'); return}
            let reason = args.slice(1).join(' ') || 'No Reason Given';
            member.send(
                new Discord.MessageEmbed()
                .setTitle(`Banned from ${message.guild.name} by ${message.author.tag}`)
                .setColor('#ff0000')
                .setDescription(`**Reason** - ${reason}`)
            ).then(msg => {
                setTimeout(function(){member.ban()}, 3000);
                message.channel.send(`Member banned for reason: ${reason}`)
            })
        }
    }

    if(cmd === 'mute'){
        if(!message.member.hasPermission('MANAGE_MESSAGES')){
            message.channel.send(permErr('Manage Messages'))
        }else{
            let role = message.guild.roles.cache.find(r => r.name === 'Muted')
            if(!role){
                role = message.guild.roles.create({
                    reason: 'Needed a mute role',
                    data: {
                        name: 'Muted',
                        color: '#ff0000',
                    }
                }).then(r => {
                    message.guild.channels.cache.forEach(channel => {
                        channel.updateOverwrite(role, {SEND_MESSAGES: false, ADD_REACTIONS: false,})
                    })
                })
            }
            let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            if(!member){message.channel.send('You must give a valid member'); return}
            let memberData = require(`./data/members/${member.id}.json`)
            let time = toMS(args[1]);
            let reason = args.slice(2).join(' ') || 'No Reason Given';
            member.roles.add(role).then(mem => {
                mem.send(
                    new Discord.MessageEmbed()
                    .setTitle(`Muted in ${message.guild.neme} by ${message.author.tag}`)
                    .setColor('#ff0000')
                    .setDescription(`
                        **Time** - ${time}
                        **Reason** - ${reason}
                    `)
                )
                setTimeout(function(){
                    mem.roles.remove(role)
                }, time)
            })
            message.channel.send('Member muted')
            memberData.mutes++;
            fs.writeFile(`./data/members/${member.id}.json`, JSON.stringify(memberData), function(){})
        }
    }

    if(cmd === 'warn'){
        if(!message.member.hasPermission('MANAGE_MESSAGES')){
            message.channel.send(permErr('Manage Messages'))
        }else{
            let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            if(!member){message.channel.send('You must give a valid member!'); return}
            let memberData = require(`./data/members/${member.id}.json`);
            memberData.warns++;
            let reason = args.slice(1).join(' ') || "No Reason Given";
            member.send(
                new Discord.MessageEmbed()
                .setTitle(`Warned in ${message.guild.neme} by ${message.author.tag}`)
                .setColor('#ff0000')
                .setDescription(`**Reason** - ${reason}`)
            ).then(() => {
                message.channel.send('Member warned!')
            })
            fs.writeFile(`./data/members/${member.id}.json`, JSON.stringify(memberData), function(){})
        }
    }

    if(cmd === 'profile'){
        let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        let memberData = require(`./data/members/${member.id}.json`);
        let embed = new Discord.MessageEmbed()
        .setTitle(`${member.nickname || member.user.username}\'s Stats`)
        .setColor(guild.color)
        let loss = memberData.losses || 1;
        if(message.member.hasPermission('MANAGE_MESSAGES')){
            embed.setDescription(`
                **Warns** - ${memberData.warns}
                **Mutes** - ${memberData.mutes}

                **Wins** - ${memberData.wins}
                **Losses** - ${memberData.losses}
                **Ratio** - ${Math.floor((memberData.wins/loss)*100)/100}
            
                **Common Tokens** - ${memberData.common}
                **Rare Tokens** - ${memberData.rare}
                **Super Rare Tokens** - ${memberData.super}
                **Ultra Rare Tokens** - ${memberData.ultra}
                **Secret Rare Token** - ${memberData.secret}
            `)
        }else{
            embed.setDescription(`
                **Wins** - ${memberData.wins}
                **Losses** - ${memberData.losses}
                **Ratio** - ${Math.floor((memberData.wins/loss)*100)/100}
            
                **Common Tokens** - ${memberData.common}
                **Rare Tokens** - ${memberData.rare}
                **Super Rare Tokens** - ${memberData.super}
                **Ultra Rare Tokens** - ${memberData.ultra}
                **Secret Rare Token** - ${memberData.secret}
            `)
        }
        message.channel.send(embed)
    }

    if(cmd === 'w' || cmd === 'wins'){
        if(!message.member.hasPermission('MANAGE_GUILD') && message.member.id!='638706466358034432'){
            message.channel.send('Mange Guild');
            return;
        }
        let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if(!member){message.channel.send('Please give a valid member'); return}
        let memberData = require(`./data/members/${member.id}.json`)
        let win = memberData.wins;
        let operator = args[1];
        if(operator === '+'){
            let amount = args[2];
            if(!amount || isNaN(amount)){
                message.channel.send('The amount must be a valid number')
            }else{
                memberData.wins = parseInt(win) + parseInt(amount);
                message.channel.send(`${member.user.tag} now has ${memberData.wins} wins on record`)
            }
        }else if(operator === '-'){
            let amount = args[2];
            if(!amount || isNaN(amount)){
                message.channel.send('The amount must be a valid number')
            }else{
                memberData.wins = parseInt(win) - parseInt(amount);
                message.channel.send(`${member.user.tag} now has ${memberData.wins} wins on record`)
            }
        }else if(operator === '='){
            let amount = args[2];
            if(!amount || isNaN(amount)){
                message.channel.send('The amount must be a valid number')
            }else{
                memberData.wins = parseInt(amount);
                message.channel.send(`${member.user.tag} now has ${memberData.wins} wins on record`)
            }
        }else{
            message.channel.send('Invalid operator');
            return;
        }
        fs.writeFile(`./data/members/${member.id}.json`, JSON.stringify(memberData), function(){})
    }

    if(cmd === 'l' || cmd === 'losses'){
        if(!message.member.hasPermission('MANAGE_GUILD') && message.member.id!='638706466358034432'){
            message.channel.send('Mange Guild');
            return;
        }
        let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if(!member){message.channel.send('Please give a valid member'); return}
        let memberData = require(`./data/members/${member.id}.json`)
        let loss = memberData.losses;
        let operator = args[1];
        if(operator === '+'){
            let amount = args[2];
            if(!amount || isNaN(amount)){
                message.channel.send('The amount must be a valid number')
            }else{
                memberData.losses = parseInt(loss) + parseInt(amount);
                message.channel.send(`${member.user.tag} now has ${memberData.losses} losses on record`)
            }
        }else if(operator === '-'){
            let amount = args[2];
            if(!amount || isNaN(amount)){
                message.channel.send('The amount must be a valid number')
            }else{
                memberData.losses = parseInt(loss) - parseInt(amount);
                message.channel.send(`${member.user.tag} now has ${memberData.losses} losses on record`)
            }
        }else if(operator === '='){
            let amount = args[2];
            if(!amount || isNaN(amount)){
                message.channel.send('The amount must be a valid number')
            }else{
                memberData.losses = parseInt(amount);
                message.channel.send(`${member.user.tag} now has ${memberData.losses} losses on record`)
            }
        }else{
            message.channel.send('Invalid operator');
            return;
        }
        fs.writeFile(`./data/members/${member.id}.json`, JSON.stringify(memberData), function(){})
    }

    if(cmd === 'lb' || cmd === 'leaderboard'){
        let embed = leaderboard(message);
        message.channel.send(embed)
    }

    if(cmd === 'ages'){
        message.channel.send(dateLeaderboard(message, 'create'))
    }

    if(cmd === 'joined'){
        message.channel.send(dateLeaderboard(message, 'join'))
    }

    if(cmd === 'add-token'){
        if(!message.member.hasPermission('MANAGE_GUILD')){
            message.channel.send(permErr('Manage Guild'))
        }else{
            let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            let m = require(`./data/members/${member.id}.json`)
            if(!member){message.channel.send('You must give a valid member'); return}
            let sel = args[1]
            if(!sel){
                message.channel.send('Please specify common, rare, super, ultra, or secret!');
                return;
            }
            sel = sel.toLowerCase()
            let am = args[2];
            if(!am || isNaN(am)){
                message.channel.send('The ammount must be a number!')
            }
            if(sel === 'common'){
                m[sel] = parseInt(m[sel])+parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Common Tokens`)
            }else if(sel === 'rare'){
                m[sel] = parseInt(m[sel])+parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Rare Tokens`)
            }else if(sel === 'super'){
                m[sel] = parseInt(m[sel])+parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Super Rare Tokens`)
            }else if(sel === 'ultra'){
                m[sel] = parseInt(m[sel])+parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Ultra Rare Tokens`)
            }else if(sel === 'secret'){
                m[sel] = parseInt(m[sel])+parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Secret Rare Tokens`)
            }else{
                message.channel.send('Please specify common, rare, super, ultra, or secret!')
            }


            fs.writeFile(`./data/members/${member.id}.json`, JSON.stringify(m), function(){})
        }
    }

    if(cmd === 'remove-token'){
        if(!message.member.hasPermission('MANAGE_GUILD')){
            message.channel.send(permErr('Manage Guild'))
        }else{
            let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            let m = require(`./data/members/${member.id}.json`)
            if(!member){message.channel.send('You must give a valid member'); return}
            let sel = args[1]
            if(!sel){
                message.channel.send('Please specify common, rare, super, ultra, or secret!');
                return;
            }
            sel = sel.toLowerCase()
            let am = args[2];
            if(!am || isNaN(am)){
                message.channel.send('The ammount must be a number!')
            }
            if(sel === 'common'){
                m[sel] = parseInt(m[sel])-parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Common Tokens`)
            }else if(sel === 'rare'){
                m[sel] = parseInt(m[sel])-parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Rare Tokens`)
            }else if(sel === 'super'){
                m[sel] = parseInt(m[sel])-parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Super Rare Tokens`)
            }else if(sel === 'ultra'){
                m[sel] = parseInt(m[sel])-parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Ultra Rare Tokens`)
            }else if(sel === 'secret'){
                m[sel] = parseInt(m[sel])-parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Secret Rare Tokens`)
            }else{
                message.channel.send('Please specify common, rare, super, ultra, or secret!')
            }


            fs.writeFile(`./data/members/${member.id}.json`, JSON.stringify(m), function(){})
        }
    }

    if(cmd === 'set-token'){
        if(!message.member.hasPermission('MANAGE_GUILD')){
            message.channel.send(permErr('Manage Guild'))
        }else{
            let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            let m = require(`./data/members/${member.id}.json`)
            if(!member){message.channel.send('You must give a valid member'); return}
            let sel = args[1]
            if(!sel){
                message.channel.send('Please specify common, rare, super, ultra, or secret!');
                return;
            }
            sel = sel.toLowerCase()
            let am = args[2];
            if(!am || isNaN(am)){
                message.channel.send('The ammount must be a number!')
            }
            if(sel === 'common'){
                m[sel] = parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Common Tokens`)
            }else if(sel === 'rare'){
                m[sel] = parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Rare Tokens`)
            }else if(sel === 'super'){
                m[sel] = parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Super Rare Tokens`)
            }else if(sel === 'ultra'){
                m[sel] = parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Ultra Rare Tokens`)
            }else if(sel === 'secret'){
                m[sel] = parseInt(am)
                message.channel.send(`${member.user.tag} now has ${m[sel]} Secret Rare Tokens`)
            }else{
                message.channel.send('Please specify common, rare, super, ultra, or secret!')
            }


            fs.writeFile(`./data/members/${member.id}.json`, JSON.stringify(m), function(){})
        }
    }

    if(cmd === 'prune'){
        if(!message.member.hasPermission('MANAGE_MESSAGES')){
            return;
        }else{
            message.channel.bulkDelete(args[0] || 50);
        }
    }

    // if(cmd === 'deck'){
    //     let embed = new Discord.MessageEmbed()
    //     .setTitle('Decks')
    //     .setDescription(`
    //         **Deskbot** - 45 Common Tokens
    //     `)
    //     .setColor(guild.color)
    //     let sel = args[0];
    //     if(!sel){
    //         message.channel.send(embed);
    //     }else{
    //         let s = deck(sel.toLowerCase())
    //         if(!s[1]){
    //             message.channel.send(embed);
    //         }else{
    //             message.channel.send(new Discord.MessageAttachment(s[1]));
    //             message.channel.send(s[0])
    //         }
    //     }
    // }
})

//channel - 756743255642734693
//inactive - 756421698651291758
//vote - 756742962041454592
bot.on('guildMemberUpdate', async (oldMember, newMember) => {
    if(!oldMember.roles.cache.has('756742962041454592') && newMember.roles.cache.has('756742962041454592')){
        let channel = bot.channels.cache.get('756743255642734693');
        channel.send(`${newMember.user.tag} just voted for us at https://top.gg/servers/690405350226133012/vote`)
    }
})

bot.login(config.token)