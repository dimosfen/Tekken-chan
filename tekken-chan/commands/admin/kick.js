const commando=require('discord.js-commando');
class KickCommand extends commando.Command
{
    constructor(client)
    {
super(client,{
    name:'kick',
    group:'admin',
memberName:'kick',
description:'Kicks a user'
});
    }
    async run(message,args)
    {
        let kickedUser = message.guild.member(message.mention.users.first());
        if(!kickedUser){
message.channel.send('Пользователь не найден');
return;
        }
        if(!message.member.hasPermission('MANAGE_MESSAGE')){
            message.channel.send('тыж не админ');
            return;
        }
        let words = args.split(' ');
        let reason = words.slice(1).join(' ');
        console.log(reason);
        message.guild.member(kickedUser).kick(reason)
        .then(console.log)
        .cath(console.error);
    }
}
module.exports=KickCommand;