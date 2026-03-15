import { React, ReactNative } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { Forms } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { getTranslation } from "./translations.js";

const { ScrollView, View, Text, TextInput } = ReactNative;

const TIME_OPTIONS = [
	{ label: "1 Day", value: 86400000 },
	{ label: "3 Days", value: 259200000 },
	{ label: "1 Week", value: 604800000 },
	{ label: "Never", value: 0 }
];

export default () => {
	useProxy(storage);
	
	const [logs, setLogs] = React.useState(storage.logger.logs || []);

	const handleRemoveLog = (logId) => {
		const newLogs = logs.filter((log) => log.id !== logId);
		storage.logger.logs = newLogs;
		setLogs(newLogs);
	};

	const handleClearLogs = () => {
		storage.logger.logs = [];
		setLogs([]);
	};

	const formatDate = (ms) => {
		const d = new Date(ms);
		return storage.ew ? d.toLocaleString('en-US', { hour12: true }) : d.toLocaleString('en-GB', { hour12: false });
	};

	return (
		<ScrollView style={{ flex: 1 }}>
			{/* LOGGER CONFIGURATION */}
			<Forms.FormSection title={getTranslation("settings.titles.logger")} titleStyleType="no_border">
				
				<Forms.FormRow 
					label={getTranslation("settings.serverMode")} 
					trailing={<Forms.FormSwitch value={storage.logger.serverMode} onValueChange={(v) => (storage.logger.serverMode = v)} />} 
				/>
				
				<View style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
					<Text style={{ color: "#b9bbbe", marginBottom: 5 }}>{getTranslation("settings.serverList")}</Text>
					<TextInput
						style={{ color: "white", backgroundColor: "#202225", padding: 10, borderRadius: 5 }}
						value={storage.logger.serverIds}
						onChangeText={(text) => (storage.logger.serverIds = text)}
						placeholder="123456789, 987654321"
						placeholderTextColor="#72767d"
					/>
				</View>

				<Forms.FormRow 
					label={getTranslation("settings.ignoreMuted")} 
					trailing={<Forms.FormSwitch value={storage.logger.ignoreMuted} onValueChange={(v) => (storage.logger.ignoreMuted = v)} />} 
				/>

				<Forms.FormRow label={getTranslation("settings.autoDelete")} />
				<ScrollView horizontal style={{ paddingHorizontal: 15, paddingBottom: 15 }}>
					{TIME_OPTIONS.map((opt) => (
						<Forms.FormRow
							key={opt.label}
							label={opt.label}
							trailing={<Forms.FormRadio selected={storage.logger.autoDeleteTime === opt.value} onPress={() => (storage.logger.autoDeleteTime = opt.value)} />}
							style={{ paddingRight: 20 }}
						/>
					))}
				</ScrollView>
			</Forms.FormSection>

			<Forms.FormDivider />

			{/* LOG VIEWER */}
			<Forms.FormSection title={getTranslation("settings.titles.logs")}>
				<Forms.FormRow
					label={getTranslation("settings.clearLogsButton")}
					trailing={<Forms.FormRow.Icon source={getAssetIDByName("ic_trash_24px")} />}
					onPress={() => {
						if (logs.length > 0) {
							showConfirmationAlert({
								title: getTranslation("settings.confirmClear.title"),
								content: getTranslation("settings.confirmClear.description", true)?.make?.(logs.length),
								confirmText: getTranslation("settings.confirmClear.yes"),
								cancelText: getTranslation("settings.confirmClear.no"),
								confirmColor: "brand",
								onConfirm: handleClearLogs,
							});
						}
					}}
				/>
				
				<View style={{ padding: 15, gap: 10 }}>
					{logs.length === 0 ? (
						<Text style={{ color: "#72767d", textAlign: "center" }}>{getTranslation("settings.noLogs")}</Text>
					) : (
						logs.map((log) => (
							<View key={log.id} style={{ backgroundColor: "#2f3136", padding: 10, borderRadius: 8, marginBottom: 10 }}>
								<Text style={{ color: "#fff", fontWeight: "bold", marginBottom: 4 }}>
									{log.author} • {log.type === "delete" ? "🗑️ Deleted" : "✏️ Edited"}
								</Text>
								<Text style={{ color: "#a3a6aa", fontSize: 12, marginBottom: 8 }}>{formatDate(log.timestamp)}</Text>
								
								{log.type === "delete" ? (
									<Text style={{ color: "#dcddde" }}>{log.content}</Text>
								) : (
									<View>
										<Text style={{ color: "#ed4245", textDecorationLine: "line-through", marginBottom: 4 }}>{log.oldContent}</Text>
										<Text style={{ color: "#57f287" }}>{log.newContent}</Text>
									</View>
								)}
								
								<Forms.FormRow
									label={getTranslation("settings.removeLogButton")}
									style={{ marginTop: 10, backgroundColor: "#202225", borderRadius: 5 }}
									onPress={() => handleRemoveLog(log.id)}
								/>
							</View>
						))
					)}
				</View>
			</Forms.FormSection>
		</ScrollView>
	);
};
			<Forms.FormSection title={getTranslation("settings.titles.settings")} titleStyleType="no_border">
				<Forms.FormRow label={getTranslation("settings.showTimestamps")} trailing={<Forms.FormSwitch value={storage.timestamps} onValueChange={(v) => (storage.timestamps = v)} />} />
				<Forms.FormRow label={getTranslation("settings.ewTimestampFormat")} trailing={<Forms.FormSwitch value={storage["ew"]} onValueChange={(v) => (storage.ew = v)} />} />
				<Forms.FormDivider />
				<Forms.FormRow label={getTranslation("settings.youDeletedItWarning")} />
			</Forms.FormSection>
			<Forms.FormSection title={getTranslation("settings.titles.filters")}>
				<Forms.FormRow label={getTranslation("settings.ignoreBots")} trailing={<Forms.FormSwitch value={storage["ignore"].bots} onValueChange={(value) => (storage["ignore"].bots = value)} />} />
				<Forms.FormRow
					label={getTranslation("settings.clearUsersLabel", true)?.make?.(users.length)}
					trailing={<Forms.FormRow.Icon source={getAssetIDByName("ic_trash_24px")} />}
					onPress={() => {
						if (users.length !== 0)
							showConfirmationAlert({
								title: getTranslation("settings.confirmClear.title"),
								content: getTranslation("settings.confirmClear.description", true)?.make?.(users.length),
								confirmText: getTranslation("settings.confirmClear.yes"),
								cancelText: getTranslation("settings.confirmClear.no"),
								confirmColor: "brand",
								onConfirm: handleClearUsers,
							});
					}}
				/>
				<ReactNative.ScrollView style={{ flex: 1, gap: 3, marginLeft: 15 }}>
					{users.map((id) => {
						const User = UserStore.getUser(id) ?? {};
						let pfp = User?.getAvatarURL?.(null,26)?.replace?.(/\.(gif|webp)/, ".png");
						if (!pfp) {
							pfp = "https://cdn.discordapp.com/embed/avatars/1.png?size=48";
							User.username = `${id} Uncached`;
							User.discriminator = "0";
							if (uncached === 0) User.username += ", press the avatar";
							uncached++;
						}

						return (
							<ItemWithRemove
								imageSource={{ uri: pfp }}
								onImagePress={() => {
									openProfile(id);
								}}
								onRemove={() => handleRemoveUser(id)}
								label={User.username + (User.discriminator == 0 ? "" : `#${User.discriminator}`)}
								labelRemove={getTranslation("settings.removeUserButton")}
							/>
						);
					})}
				</ReactNative.ScrollView>
				<Forms.FormDivider />
				<Forms.FormRow label={getTranslation("settings.addUsersInfo")} />
			</Forms.FormSection>
		</ReactNative.ScrollView>
	);
};
