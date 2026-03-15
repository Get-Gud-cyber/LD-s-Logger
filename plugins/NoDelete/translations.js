function slavicNoun(number, $1, $2, $5) {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) return $5;
  n %= 10;
  if (n === 1) return $1;
  if (n >= 2 && n <= 4) return $2;
  return $5;
}

function latinNoun(number, $1, $x) {
  return number === 1 ? $1 : $x;
}

export let massive = {
  settings: {
    titles: {
      settings: { "en-GB": "Settings", uk: "Налаштування", ru: "Настройки" },
      filters: { "en-GB": "Filters", uk: "Фільтри", ru: "Фильтры" },
      logger: { "en-GB": "Logger Settings" },
      logs: { "en-GB": "Saved Logs" }
    },
    // New Logger Strings
    serverMode: { "en-GB": "Server Filter Mode (Off = Blacklist, On = Whitelist)" },
    serverList: { "en-GB": "Server IDs (Comma separated)" },
    ignoreMuted: { "en-GB": "Ignore Muted Channels" },
    autoDelete: { "en-GB": "Auto-Delete Logs Older Than" },
    clearLogsButton: { "en-GB": "Clear All Logs Permanently" },
    noLogs: { "en-GB": "No logs currently saved." },
    // Legacy Strings
    showTimestamps: { "en-GB": "Show the time of deletion", uk: "Показувати час видалення", ru: "Показывать время удаления" },
    ewTimestampFormat: { "en-GB": "Use 12-hour format", uk: "Використовувати 12-годинний формат", ru: "Использовать 12-часовой формат" },
    youDeletedItWarning: { "en-GB": "The messages YOU deleted - are not saved", uk: "Повідомлення які видалили ВИ - не зберігаются", ru: "Сообщения удаленные ВАМИ - не сохраняются" },
    ignoreBots: { "en-GB": "Ignore bots", uk: "Ігнорувати ботів", ru: "Игнорировать ботов" },
    confirmClear: {
      title: { "en-GB": "Hold on!", uk: "Почекай-но!", ru: "Положди-ка!" },
      description: { "en-GB": (amount) => `This will clear ${amount} logs. Are you sure?` },
      yes: { "en-GB": "Yes", uk: "Так", ru: "Да" },
      no: { "en-GB": "Cancel", uk: "Відминити", ru: "Отменить" },
    },
    removeLogButton: { "en-GB": "DELETE" },
  },
  thisMessageWasDeleted: { "en-GB": "This message was deleted", uk: "Це повідомлення було видалено", ru: "Это сообщение было удалено" },
};

export const locale = () => vendetta.metro.findByStoreName("LocaleStore").locale;
const defaultLocale = "en-GB";

export function getTranslation(find, fn) {
  let value = massive;
  for (const key of find.split(".")) {
    // biome-ignore lint/suspicious/noPrototypeBuiltins: meow
    if (value?.hasOwnProperty(key)) {
      value = value[key];
    } else {
      value = massive;
    }
  }
  if (value === massive) return find;
  let localized = value[locale()] ?? value[defaultLocale] ?? find;
  if (typeof localized === "function" && !fn) localized = localized();
  return fn ? { make: localized } : localized;
}
