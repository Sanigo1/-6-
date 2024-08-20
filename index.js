const { Client, EmbedBuilder, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, TextInputBuilder, ModalBuilder, ModalActionRowBuilder, TextInputStyle } = require('discord.js');
const express = require('express');
const app = express();
const port = 3000;
const db = require('pro.db');
const config = require('./config.js');  

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

client.on('ready', () => {
    console.log(require('chalk').blue('Wick Studio!') + require('chalk').red('\nDEVELOPER Sanigo') + require('chalk').blue(`\n${client.user.tag} is Ready`));
    client.user.setActivity('Wick Studio!');
    client.user.setStatus('dnd');
});

const Support = config.supportRoleID;
const cat = config.categoryID;

client.on('messageCreate', Message => {
    if (Message.content.startsWith(config.setupCommand)) {  
        const Embed = new EmbedBuilder()
            .setTitle(`الدعم الفني`) 
//هاذا عدله حط اسم التكت الي تبيه مثال شكوى على اداري وزي كذا هاذا اسم التكت او نوعه
            .setDescription(`**الرجاء احترام الاداري الذي في التكت
            وعدم كثرت المنشن 
            وعدم التلفظ ب الكلام البذي**`);
//هاذا قانون التكت الي برا يجي تحت اسم التكت 
        const Row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('openticket').setLabel('الدعم الفني').setStyle(ButtonStyle.Primary)
            );
        
        Message.delete();
        Message.channel.send({ components: [Row], embeds: [Embed] });
    }
});

client.on('interactionCreate', async Interaction => {
    try {
        if (!Interaction.isButton()) return;

        if (Interaction.customId === 'openticket') {
            try {
                db.add(`ticket`, 1);
                const id = db.get(`ticket`);

                const channel = await Interaction.guild.channels.create({
                    name: `ticket-${id}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: Interaction.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        },
                        {
                            id: Interaction.user.id, 
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                        },
                        {
                            id: `${Support}`,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                        }
                    ], 
                    parent: `${cat}`
                });

                await Interaction.reply({ content: `${channel}`, ephemeral: true });

                const Embed = new EmbedBuilder()
                    .setTitle('مرحبا بك عزيزي العضو الرجاء كتابت المشكلة دون منشن ')
//هاذا الكلام الي اول ما يفتح التكت يقوله للعضو
                    .setDescription(`** نورت التكت عزيزي العضو الرجاء قرات الكلام الي فوق وشكراً **`) 
//هاذي رسالة الترحيب اذا العصو فتح تكت تقدر تعدلها
                    .setTimestamp()
                    .setImage(config.ticketImageURL);  
//خلاص ما فيه شي تحت تعدله 
//'Wick Studio
//'Wick Studio
//'Wick Studio
                await channel.send({ 
                    content: `**<@&${Support}> - ${Interaction.user} **`, 
                    embeds: [Embed], 
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder().setCustomId('claim').setLabel('استلام التذكرة').setStyle(ButtonStyle.Success),
                                new ButtonBuilder().setCustomId('unclaim').setLabel('ترك التذكرة').setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder().setCustomId('close').setLabel('قفل التذكرة').setStyle(ButtonStyle.Danger),
                                new ButtonBuilder().setCustomId('notify').setLabel('استدعاء').setStyle(ButtonStyle.Primary)
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder().setCustomId('add_member').setLabel('إضافة عضو').setStyle(ButtonStyle.Primary),
                                new ButtonBuilder().setCustomId('remove_member').setLabel('إزالة عضو').setStyle(ButtonStyle.Danger)
                            )
                    ] 
                });

                db.set(`ticketOwner_${channel.id}`, Interaction.user.id);
            } catch (error) {
                console.error('Error handling ticket creation:', error);
                await Interaction.reply({ content: 'حدث خطأ أثناء محاولة إنشاء التذكرة.', ephemeral: true });
            }
        } else {
            if (!Interaction.member.roles.cache.has(Support)) {
                return Interaction.reply({ content: 'ليس لديك الصلاحيات اللازمة لاستخدام هذا الزر.', ephemeral: true });
            }

            switch (Interaction.customId) {
                case 'claim':
                    try {
                        if (db.get(`Channels_${Interaction.channel.id}`) === true) {
                            await Interaction.reply({ content: `التذكره بالفعل قيد العمل`, ephemeral: true });
                        } else {
                            db.set(`Tickets_${Interaction.user.id}_${Interaction.channel.id}`, true);
                            await Interaction.reply({ embeds: [new EmbedBuilder().setDescription(`**تم استلام التيكت بواسطه الاداري ${Interaction.user}**`)]});
                            db.set(`Channels_${Interaction.channel.id}`, true);
                        }
                    } catch (error) {
                        console.error('Error claiming ticket:', error);
                        await Interaction.reply({ content: 'حدث خطأ أثناء محاولة استلام التذكرة.', ephemeral: true });
                    }
                    break;

                case 'unclaim':
                    try {
                        if (db.get(`Channels_${Interaction.channel.id}`) === true) {
                            db.set(`Tickets_${Interaction.user.id}_${Interaction.channel.id}`, false);
                            await Interaction.reply({ embeds: [new EmbedBuilder().setDescription(`**تم اترك التيكت بواسطه الاداري ${Interaction.user}**`)]});
                            db.set(`Channels_${Interaction.channel.id}`, false);
                        }
                    } catch (error) {
                        console.error('Error unclaiming ticket:', error);
                        await Interaction.reply({ content: 'حدث خطأ أثناء محاولة ترك التذكرة.', ephemeral: true });
                    }
                    break;

                case 'close':
                    try {
                        await Interaction.reply({ content: `**سيتم حذف التذكره خلال 5 ثواني شكرا لك**`});
                        setTimeout(() => {
                            Interaction.channel.delete();
                        }, 5000);
                    } catch (error) {
                        console.error('Error closing ticket:', error);
                        await Interaction.reply({ content: 'حدث خطأ أثناء محاولة قفل التذكرة.', ephemeral: true });
                    }
                    break;

                case 'notify':
                    try {
                        const ticketOwner = db.get(`ticketOwner_${Interaction.channel.id}`);
                        const notifyUser = await Interaction.guild.members.fetch(ticketOwner);

                        if (notifyUser) {
                            await notifyUser.send(`تم استدعائك بواسطة: ${Interaction.user} في التذكرة: ${Interaction.channel}`);
                            await Interaction.reply({ content: 'تم إرسال الرسالة بنجاح!', ephemeral: true });
                        } else {
                            await Interaction.reply({ content: 'لم يتم العثور على المستخدم.', ephemeral: true });
                        }
                    } catch (error) {
                        console.error('Error notifying user:', error);
                        await Interaction.reply({ content: 'حدث خطأ أثناء محاولة استدعاء المستخدم.', ephemeral: true });
                    }
                    break;

                case 'add_member':
                    try {
                        await Interaction.reply({ content: 'يرجى إدخال ID العضو الذي تريد إضافته.', ephemeral: true });

                        const filter = response => !isNaN(response.content) && response.author.id === Interaction.user.id;
                        const collected = await Interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

                        if (collected.size > 0) {
                            const memberId = collected.first().content;
                            const member = await Interaction.guild.members.fetch(memberId);

                            if (member) {
                                await Interaction.channel.permissionOverwrites.edit(member, {
                                    ViewChannel: true,
                                    SendMessages: true
                                });
                                await Interaction.followUp({ content: `تم إضافة ${member} إلى التذكرة بنجاح.`, ephemeral: true });
                            } else {
                                await Interaction.followUp({ content: 'لم يتم العثور على العضو.', ephemeral: true });
                            }
                        } else {
                            await Interaction.followUp({ content: 'لم يتم إدخال أي ID عضوي.', ephemeral: true });
                        }
                    } catch (error) {
                        console.error('Error adding member:', error);
                        await Interaction.followUp({ content: 'حدث خطأ أثناء محاولة إضافة العضو.', ephemeral: true });
                    }
                    break;

                case 'remove_member':
                    try {
                        await Interaction.reply({ content: 'يرجى منشن العضو الذي تريد إزالته.', ephemeral: true });

                        const filter = response => response.mentions.members.size > 0 && response.author.id === Interaction.user.id;
                        const collected = await Interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

                        if (collected.size > 0) {
                            const member = collected.first().mentions.members.first();

                            if (member) {
                                await Interaction.channel.permissionOverwrites.edit(member, {
                                    ViewChannel: false,
                                    SendMessages: false
                                });
                                await Interaction.followUp({ content: `تم إزالة ${member} من التذكرة بنجاح.`, ephemeral: true });
                            } else {
                                await Interaction.followUp({ content: 'لم يتم العثور على العضو.', ephemeral: true });
                            }
                        } else {
                            await Interaction.followUp({ content: 'لم يتم منشن أي عضو.', ephemeral: true });
                        }
                    } catch (error) {
                        console.error('Error removing member:', error);
                        await Interaction.followUp({ content: 'حدث خطأ أثناء محاولة إزالة العضو.', ephemeral: true });
                    }
                    break;

                default:
                    break;
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
    }
});

client.on('interactionCreate', async Interaction => {
    if (Interaction.isModalSubmit() && Interaction.customId === 'rename_ticket_modal') {
        try {
            const newTicketName = Interaction.fields.getTextInputValue('new_ticket_name');
            await Interaction.channel.setName(newTicketName);
            await Interaction.reply({ content: `تم تغيير اسم التذكرة إلى ${newTicketName}.`, ephemeral: true });
        } catch (error) {
            console.error('Error renaming ticket:', error);
            await Interaction.reply({ content: 'حدث خطأ أثناء محاولة تغيير اسم التذكرة.', ephemeral: true });
        }
    }
});

client.login(config.botToken);  // تأكد من إدخال التوكن الصحيح في config.js
