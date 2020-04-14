const commando=require('discord.js-commando');
class BanCommand extends commando.Command
{
    constructor(client)
    {
super(client,{
    name:'ban',
    group:'admin',
memberName:'ban',
description:'ban a user'
});
    }
    async run(message,args)
    {
        let bannedUser = message.guild.member(message.mention.users.first());
        if(!bannedUser){
message.channel.send('Пользователь не найден');
return;
        }
        if(!message.member.hasPermission('MANAGE_MESSAGE')){
            message.channel.send('тыж не Одмин');
            return;
        }
        let words = args.split(' ');
        let reason = words.slice(1).join(' ');
        console.log(reason);
        message.guild.member(bannedUser).ban(reason)
        .then(console.log)
        .cath(console.error);
    }
}
module.exports=BanCommand;