const MESSAGES = [
  "Nice work! That focused block adds up more than you think.",
  "Session complete — you showed up and did the work. That's the whole game.",
  "Great focus! Small consistent sessions beat rare heroic ones.",
  "Done! Give yourself a minute to stretch before the next one.",
  "You just banked another deep-work session. Keep the streak going.",
  "That's a wrap. Progress compounds — well done.",
  "Solid session. Your future self is grateful for this one.",
  "Focus complete! Momentum like this is how goals actually get hit.",
];

export function pickEncouragement(): string {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}
