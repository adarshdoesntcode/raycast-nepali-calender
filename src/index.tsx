import { Action, ActionPanel, Detail, getPreferenceValues, openExtensionPreferences } from "@raycast/api";
import { useState, useEffect } from "react";
import NepaliDate from "nepali-date-converter";

interface Preferences {
  weekStart: "0" | "1";
  language: "en" | "np";
}

const CONSTANTS = {
  en: {
    months: [
      "Baisakh",
      "Jestha",
      "Ashadh",
      "Shrawan",
      "Bhadra",
      "Ashwin",
      "Kartik",
      "Mangsir",
      "Poush",
      "Magh",
      "Falgun",
      "Chaitra",
    ],
    daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    actions: {
      goToToday: "Go to Today",
      copyCalendar: "Copy Calendar to Clipboard",
      navigate: "Navigate",
      prevMonth: "Previous Month",
      nextMonth: "Next Month",
      prevYear: "Previous Year",
      nextYear: "Next Year",
      openPreferences: "Open Extension Preferences",
    },
  },
  np: {
    months: ["बैशाख", "जेठ", "असार", "श्रावण", "भदौ", "आश्विन", "कार्तिक", "मंसिर", "पौष", "माघ", "फाल्गुन", "चैत्र"],
    daysShort: ["आइत", "सोम", "मंगल", "बुध", "बिहि", "शुक्र", "शनि"],
    actions: {
      goToToday: "आज जानुहोस्",
      copyCalendar: "क्यालेन्डर प्रतिलिपि गर्नुहोस्",
      navigate: "नेभिगेट गर्नुहोस्",
      prevMonth: "अघिल्लो महिना",
      nextMonth: "अर्को महिना",
      prevYear: "अघिल्लो वर्ष",
      nextYear: "अर्को वर्ष",
      openPreferences: "एक्सटेन्सन प्राथमिकताहरू खोल्नुहोस्",
    },
  },
};

function toNepaliNumber(num: number | string): string {
  const nepaliDigits: { [key: string]: string } = {
    "0": "०",
    "1": "१",
    "2": "२",
    "3": "३",
    "4": "४",
    "5": "५",
    "6": "६",
    "7": "७",
    "8": "८",
    "9": "९",
  };
  return String(num).replace(/[0-9]/g, (digit) => nepaliDigits[digit]);
}

function generateCalendarMarkdown(date: NepaliDate, prefs: Preferences): { header: string; body: string } {
  const { language, weekStart } = prefs;
  const weekStartNum = parseInt(weekStart, 10);

  const year = date.getYear();
  const month = date.getMonth(); // 0-indexed
  const i18n = CONSTANTS[language];

  const today = new NepaliDate();
  const isCurrentMonthView = today.getYear() === year && today.getMonth() === month;

  const formatNumber = (num: number) => (language === "np" ? toNepaliNumber(num) : String(num));

  const dayHeaders = weekStartNum === 0 ? i18n.daysShort : [...i18n.daysShort.slice(1), i18n.daysShort[0]];

  const firstDayOfMonth = new NepaliDate(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday

  const offset = weekStartNum === 0 ? startingDayOfWeek : startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  const nextMonthDate = new NepaliDate(year, month + 1, 1);
  nextMonthDate.setDate(0);
  const daysInMonth = nextMonthDate.getDate();

  const header = `${i18n.months[month]} ${formatNumber(year)}`;
  let body = `| ${dayHeaders.join(" | ")} |\n`;
  body += `|${" :---: |".repeat(7)}\n`;

  const calendarDays = Array(offset).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const weeks = [];
  while (calendarDays.length > 0) {
    weeks.push(calendarDays.splice(0, 7));
  }

  weeks.forEach((week) => {
    let row = "|";
    for (let i = 0; i < 7; i++) {
      const day = week[i];
      if (day) {
        const dayStr = language === "np" ? toNepaliNumber(day).padStart(2, " ") : String(day).padStart(2, " ");
        if (isCurrentMonthView && day === today.getDate()) {
          row += ` **${dayStr} ** |`;
        } else {
          row += ` ${dayStr ? dayStr : "  "} |`;
        }
      } else {
        row += "    |";
      }
    }
    body += `${row}\n`;
  });

  return { header, body: `## ${header}\n\n${body}` };
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const i18n = CONSTANTS[preferences.language];

  const [date, setDate] = useState(new NepaliDate());
  const [markdown, setMarkdown] = useState("");
  const [header, setHeader] = useState("");

  useEffect(() => {
    const { header, body } = generateCalendarMarkdown(date, preferences);
    setHeader(header);
    setMarkdown(body);
  }, [date, preferences]);

  const changeMonth = (amount: number) => {
    const newDate = new NepaliDate(date.getYear(), date.getMonth(), 1);
    newDate.setMonth(newDate.getMonth() + amount);
    setDate(newDate);
  };

  const changeYear = (amount: number) => {
    const newDate = new NepaliDate(date.getYear() + amount, date.getMonth(), 1);
    setDate(newDate);
  };

  const goToToday = () => {
    setDate(new NepaliDate());
  };

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <ActionPanel.Section title={header}>
            <Action title={i18n.actions.goToToday} onAction={goToToday} shortcut={{ modifiers: [], key: "t" }} />
            <Action.CopyToClipboard title={i18n.actions.copyCalendar} content={markdown} />
          </ActionPanel.Section>

          <ActionPanel.Section title={i18n.actions.navigate}>
            <Action
              title={i18n.actions.prevMonth}
              onAction={() => changeMonth(-1)}
              shortcut={{ modifiers: [], key: "arrowLeft" }}
            />
            <Action
              title={i18n.actions.nextMonth}
              onAction={() => changeMonth(1)}
              shortcut={{ modifiers: [], key: "arrowRight" }}
            />
            <Action
              title={i18n.actions.prevYear}
              onAction={() => changeYear(-1)}
              shortcut={{ modifiers: ["shift"], key: "arrowLeft" }}
            />
            <Action
              title={i18n.actions.nextYear}
              onAction={() => changeYear(1)}
              shortcut={{ modifiers: ["shift"], key: "arrowRight" }}
            />
          </ActionPanel.Section>

          <ActionPanel.Section>
            <Action
              title={i18n.actions.openPreferences}
              onAction={openExtensionPreferences}
              shortcut={{ modifiers: ["cmd", "shift"], key: "," }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
