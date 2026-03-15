import settings from "./settings.jsx";
import * as common from "../../common";
import { FluxDispatcher } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { before as patchBefore } from "@vendetta/patcher";
import { findByStoreName } from "@vendetta/metro";
import { getTranslation } from "./translations.js";

common.makeDefaults(storage, {
	ignore: { users: [], bots: false },
	logger: {
		logs: [],
		serverMode: false,
		serverIds: "",
		ignoreMuted: true,
		exceptChannels: "",
		autoDeleteTime: 604800000 
	},
	timestamps: true,
	ew: false,
});

let MessageStore, ChannelStore, UserGuildSettingsStore;
let deleteable = [];
const patches = [];

function cleanOldLogs() {
	if (!storage.logger.autoDeleteTime || storage.logger.autoDeleteTime === 0) return;
	const cutoff = Date.now() - storage.logger.autoDeleteTime;
	storage.logger.logs = storage.logger.logs.filter(log => log.timestamp > cutoff);
}

export default {
	settings,
	onUnload() {
		for (const unpatch of patches) unpatch();
	},
	onLoad() {
		try {
			cleanOldLogs();

			patches.push(
				patchBefore("dispatch", FluxDispatcher, (args) => {
					try {
						if (!MessageStore) MessageStore = findByStoreName("MessageStore");
						if (!ChannelStore) ChannelStore = findByStoreName("ChannelStore");
						if (!UserGuildSettingsStore) UserGuildSettingsStore = findByStoreName("UserGuildSettingsStore");

						const event = args[0];
						if (!event) return;

						// --- INJECT LOCAL LOGS INTO CHAT ON CHANNEL LOAD ---
						if (event.type === "LOAD_MESSAGES_SUCCESS" && event.messages) {
							const channelId = event.channelId;
							// Find logs belonging to this specific channel
							const savedLogs = storage.logger.logs.filter(l => l.channelId === channelId);

							if (savedLogs.length > 0) {
								for (const log of savedLogs) {
									// Inject Deleted Messages
									if (log.type === "delete" && !event.messages.some(m => m.id === log.id)) {
										event.messages.push({
											id: log.id,
											channel_id: channelId,
											content: `**[🗑️ Deleted]**\n${log.content}`,
											author: {
												id: "1", // dummy ID
												username: log.author.split("#")[0] || "Unknown",
												discriminator: log.author.split("#")[1] || "0",
												avatar: null
											},
											timestamp: new Date(log.timestamp).toISOString(),
											type: 0,
											flags: 0
										});
									} 
									// Inject Edited Messages
									else if (log.type === "edit") {
										const existingMsg = event.messages.find(m => m.id === log.id);
										if (existingMsg && !existingMsg.content.includes("[✏️ Original]")) {
											existingMsg.content = `**[✏️ Original]**: ${log.oldContent}\n**[✏️ New]**: ${existingMsg.content}`;
										}
									}
								}
								// Re-sort the messages so they appear in chronological order
								event.messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
							}
							return args;
						}

						// --- NORMAL LIVE LOGGING ---
						const isDelete = event.type === "MESSAGE_DELETE";
						const isEdit = event.type === "MESSAGE_UPDATE";

						if (!isDelete && !isEdit) return;

						const channelId = event.channelId || event.message?.channelId;
						const messageId = event.id || event.message?.id;
						if (!channelId || !messageId) return;

						const oldMessage = MessageStore.getMessage(channelId, messageId);
						if (!oldMessage) return;

						if (storage.ignore.users.includes(oldMessage?.author?.id)) return;
						if (storage.ignore.bots && oldMessage?.author?.bot) return;

						const channel = ChannelStore.getChannel(channelId);
						const guildId = channel?.guild_id;

						const exceptedChannels = storage.logger.exceptChannels.split(",").map(id => id.trim()).filter(Boolean);
						const isExcepted = exceptedChannels.includes(channelId);

						if (guildId && !isExcepted) {
							if (storage.logger.ignoreMuted && UserGuildSettingsStore.isChannelMuted(guildId, channelId)) return;

							const targetServers = storage.logger.serverIds.split(",").map(id => id.trim()).filter(Boolean);
							const isWhitelist = storage.logger.serverMode;
							const inList = targetServers.includes(guildId);

							if (isWhitelist && !inList) return; 
							if (!isWhitelist && inList) return; 
						}

						if (isDelete) {
							// Save with channelId so it can be injected later
							storage.logger.logs.unshift({
								id: messageId,
								channelId: channelId, 
								type: "delete",
								content: oldMessage.content,
								author: `${oldMessage.author?.username}#${oldMessage.author?.discriminator || "0"}`,
								timestamp: Date.now()
							});

							if (deleteable.includes(messageId)) {
								deleteable.splice(deleteable.indexOf(messageId), 1);
								return args;
							}
							deleteable.push(messageId);

							let automodMessage = getTranslation("thisMessageWasDeleted");
							if (storage.timestamps) {
								const d = new Date();
								automodMessage += ` (${storage.ew ? d.toLocaleTimeString('en-US', { hour12: true }) : d.toLocaleTimeString('en-GB', { hour12: false })})`;
							}

							args[0] = {
								type: "MESSAGE_EDIT_FAILED_AUTOMOD",
								messageData: {
									type: 1,
									message: { channelId: channelId, messageId: messageId },
								},
								errorResponseBody: { code: 200000, message: automodMessage },
							};
						} 
						else if (isEdit) {
							const newContent = event.message.content;
							if (!newContent || oldMessage.content === newContent) return;
							
							// Save with channelId
							storage.logger.logs.unshift({
								id: messageId,
								channelId: channelId,
								type: "edit",
								oldContent: oldMessage.content,
								newContent: newContent,
								author: `${oldMessage.author?.username}#${oldMessage.author?.discriminator || "0"}`,
								timestamp: Date.now()
							});
						}

						cleanOldLogs();
						return args;

					} catch (e) {
						console.error(e);
					}
				})
			);
		} catch (e) {
			console.error("[NoDelete Permanent] Failed to load", e);
		}
	},
};
