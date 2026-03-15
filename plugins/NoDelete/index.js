import settings from "./settings.jsx";
import * as common from "../../common";
import { FluxDispatcher } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { before as patchBefore } from "@vendetta/patcher";
import { findByStoreName } from "@vendetta/metro";

// Define our default storage state
common.makeDefaults(storage, {
	ignore: { users: [], bots: false },
	logger: {
		logs: [],
		serverMode: false, // false = blacklist, true = whitelist
		serverIds: "", // comma separated list
		ignoreMuted: true,
		autoDeleteTime: 604800000 // default 1 week in ms
	},
	timestamps: true,
	ew: false,
});

let MessageStore, ChannelStore, UserGuildSettingsStore;
const patches = [];

// Helper to clean old logs
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
			// Run initial cleanup
			cleanOldLogs();

			patches.push(
				patchBefore("dispatch", FluxDispatcher, (args) => {
					try {
						if (!MessageStore) MessageStore = findByStoreName("MessageStore");
						if (!ChannelStore) ChannelStore = findByStoreName("ChannelStore");
						if (!UserGuildSettingsStore) UserGuildSettingsStore = findByStoreName("UserGuildSettingsStore");

						const event = args[0];
						if (!event) return;

						const isDelete = event.type === "MESSAGE_DELETE";
						const isEdit = event.type === "MESSAGE_UPDATE";

						if (!isDelete && !isEdit) return;

						const channelId = event.channelId || event.message?.channelId;
						const messageId = event.id || event.message?.id;
						if (!channelId || !messageId) return;

						// Fetch the original cached message
						const oldMessage = MessageStore.getMessage(channelId, messageId);
						if (!oldMessage) return; // Cannot log if we don't know what it said

						// User/Bot Ignored Filters
						if (storage.ignore.users.includes(oldMessage?.author?.id)) return;
						if (storage.ignore.bots && oldMessage?.author?.bot) return;
						// Ignore self
						if (oldMessage?.author?.id === findByStoreName("UserStore").getCurrentUser()?.id) return;

						// Guild & Mute Filters
						const channel = ChannelStore.getChannel(channelId);
						const guildId = channel?.guild_id;

						if (guildId) {
							// Check muted
							if (storage.logger.ignoreMuted && UserGuildSettingsStore.isChannelMuted(guildId, channelId)) return;

							// Check Server Whitelist/Blacklist
							const targetServers = storage.logger.serverIds.split(",").map(id => id.trim()).filter(Boolean);
							const isWhitelist = storage.logger.serverMode;
							const inList = targetServers.includes(guildId);

							if (isWhitelist && !inList) return; 
							if (!isWhitelist && inList) return; 
						}

						// Process Delete
						if (isDelete) {
							storage.logger.logs.unshift({
								id: messageId,
								type: "delete",
								content: oldMessage.content,
								author: `${oldMessage.author?.username}#${oldMessage.author?.discriminator || "0"}`,
								timestamp: Date.now()
							});
						} 
						// Process Edit
						else if (isEdit) {
							const newContent = event.message.content;
							if (!newContent || oldMessage.content === newContent) return; // Ignore non-content updates
							
							storage.logger.logs.unshift({
								id: messageId,
								type: "edit",
								oldContent: oldMessage.content,
								newContent: newContent,
								author: `${oldMessage.author?.username}#${oldMessage.author?.discriminator || "0"}`,
								timestamp: Date.now()
							});
						}

						// Keep array clean
						cleanOldLogs();

						// We DO NOT modify args[0] anymore. Let Discord delete/edit it normally in the UI.
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
						if (!ChannelStore) ChannelStore = findByStoreName("ChannelStore");
						if (!UserGuildSettingsStore) UserGuildSettingsStore = findByStoreName("UserGuildSettingsStore");

						const event = args[0];
						if (!event) return;

						const isDelete = event.type === "MESSAGE_DELETE";
						const isEdit = event.type === "MESSAGE_UPDATE";

						if (!isDelete && !isEdit) return;

						const channelId = event.channelId || event.message?.channelId;
						const messageId = event.id || event.message?.id;
						if (!channelId || !messageId) return;

						// Fetch the original cached message
						const oldMessage = MessageStore.getMessage(channelId, messageId);
						if (!oldMessage) return; // Cannot log if we don't know what it said

						// User/Bot Ignored Filters
						if (storage.ignore.users.includes(oldMessage?.author?.id)) return;
						if (storage.ignore.bots && oldMessage?.author?.bot) return;
						// Ignore self
						if (oldMessage?.author?.id === findByStoreName("UserStore").getCurrentUser()?.id) return;

						// Guild & Mute Filters
						const channel = ChannelStore.getChannel(channelId);
						const guildId = channel?.guild_id;

						if (guildId) {
							// Check muted
							if (storage.logger.ignoreMuted && UserGuildSettingsStore.isChannelMuted(guildId, channelId)) return;

							// Check Server Whitelist/Blacklist
							const targetServers = storage.logger.serverIds.split(",").map(id => id.trim()).filter(Boolean);
							const isWhitelist = storage.logger.serverMode;
							const inList = targetServers.includes(guildId);

							if (isWhitelist && !inList) return; 
							if (!isWhitelist && inList) return; 
						}

						// Process Delete
						if (isDelete) {
							storage.logger.logs.unshift({
								id: messageId,
								type: "delete",
								content: oldMessage.content,
								author: `${oldMessage.author?.username}#${oldMessage.author?.discriminator || "0"}`,
								timestamp: Date.now()
							});
						} 
						// Process Edit
						else if (isEdit) {
							const newContent = event.message.content;
							if (!newContent || oldMessage.content === newContent) return; // Ignore non-content updates (like embeds loading)
							
							storage.logger.logs.unshift({
								id: messageId,
								type: "edit",
								oldContent: oldMessage.content,
								newContent: newContent,
								author: `${oldMessage.author?.username}#${oldMessage.author?.discriminator || "0"}`,
								timestamp: Date.now()
							});
						}

						// Keep array clean
						cleanOldLogs();

						// We DO NOT modify args[0] anymore. Let Discord delete/edit it normally in the UI.
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
						if (!MessageStore) MessageStore = findByStoreName("MessageStore");
						const event = args[0];

						if (!event || event?.type !== "MESSAGE_DELETE") return;
						if (!event?.id || !event?.channelId) return;

						const message = MessageStore.getMessage(event.channelId, event.id);

						if (storage["ignore"]["users"].includes(message?.author?.id)) return;
						if (storage["ignore"]["bots"] && message?.author?.bot) return;

						if (deleteable.includes(event.id)) {
							deleteable.splice(deleteable.indexOf(event.id), 1);
							return args;
						}
						deleteable.push(event.id);

						let automodMessage = getTranslation("thisMessageWasDeleted");
						if (storage["timestamps"]) automodMessage += ` (${moment().format(storage["ew"] ? "hh:mm:ss.SS a" : "HH:mm:ss.SS")})`;

						// overwrite the message delete event with the automod edit fail one
						args[0] = {
							type: "MESSAGE_EDIT_FAILED_AUTOMOD",
							messageData: {
								type: 1,
								message: {
									channelId: event.channelId,
									messageId: event.id,
								},
							},
							errorResponseBody: {
								code: 200000,
								message: automodMessage,
							},
						};
						return args;
					} catch (e) {
						console.error(e);
						alert(`[Nodelete → dispatcher patch] died\n${e.stack}`);
					}
				})
			);

			/* thanks fres#2400 (<@843448897737064448>) for example patch
			 * add ignore user button
			 */
			const contextMenuUnpatch = patchBefore("render", findByProps("ScrollView").View, (args) => {
				try {
					const a = findInReactTree(args, (r) => r.key === ".$UserProfileOverflow");
					if (!a || !a.props || a.props.sheetKey !== "UserProfileOverflow") return;
					const props = a.props.content.props;
					const _labels = massive.optionLabels.flatMap(Object.values);
					if (props.options.some((option) => _labels.includes(option?.label))) return;

					const focusedUserId = Object.keys(a._owner.stateNode._keyChildMapping)
						.find((str) => a._owner.stateNode._keyChildMapping[str] && str.match(/(?<=\$UserProfile)\d+/))
						?.slice?.(".$UserProfile".length);

					const optionPosition = props.options.findLastIndex((option) => option.isDestructive);
					if (!storage["ignore"]["users"].includes(focusedUserId)) {
						props.options.splice(optionPosition + 1, 0, {
							isDestructive: true,
							label: getTranslation("optionLabels.0"), // START IGNORING
							onPress: () => {
								storage["ignore"]["users"].push(focusedUserId);
								showToast(getTranslation("toastLabels.0").replaceAll("{user}", props.header.title));

								props.hideActionSheet();
							},
						});
					} else {
						props.options.splice(optionPosition + 1, 0, {
							label: getTranslation("optionLabels.1"), // STOP IGNORING
							onPress: () => {
								storage["ignore"]["users"].splice(
									storage["ignore"]["users"].findIndex((userId) => userId === focusedUserId),
									1
								);
								showToast(getTranslation("toastLabels.1").replaceAll("{user}", props.header.title));

								props.hideActionSheet();
							},
						});
					}
				} catch (e) {
					console.error(e);
					let successful = false;
					try {
						successful = contextMenuUnpatch();
					} catch (_) {
						successful = false;
					}
					alert(`[NoDelete → context menu patch] failed. Patch ${successful ? "dis" : "en"}abled\n${e.stack}`);
				}
			});
			patches.push(contextMenuUnpatch);
		} catch (e) {
			console.error(e);
			alert(`[NoDelete] dead\n${e.stack}`);
		}
	},
};
