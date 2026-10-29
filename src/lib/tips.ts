export interface WaitingMessage {
  text: string;
  category: "motivation" | "tip" | "wisdom";
}

export const WAITING_MESSAGES: WaitingMessage[] = [
  { text: "Good business isn't about rushing; it's about getting every ledger entry right.", category: "motivation" },
  { text: "Tip: Press Shift + ? anywhere to open the Interactive Keyboard Shortcuts guide.", category: "tip" },
  { text: "Consistency in tracking invoices turns small wholesalers into commercial powerhouses.", category: "motivation" },
  { text: "Tip: You can export all your invoices directly to CSV for Excel with one click.", category: "tip" },
  { text: "Connecting to secure distributed nodes... Your data safety is encrypted.", category: "wisdom" },
  { text: "Tip: Mark invoices as 'Paid' instantly right from the table dropdown.", category: "tip" },
  { text: "Patience and persistence are the quiet foundations of wholesale wealth.", category: "motivation" },
  { text: "Tip: Press G then D to jump to Dashboard, or G then I for Invoices.", category: "tip" },
  { text: "Syncing verified records with real-time cloud redundancy...", category: "wisdom" },
  { text: "Tip: You can select multiple customers or invoices and batch delete them anytime.", category: "tip" },
  { text: "A balanced ledger today saves hundreds of hours of reconciliation tomorrow.", category: "motivation" },
  { text: "Tip: Switch between Light, Dark, and Midnight themes anytime in Settings or Sidebar.", category: "tip" },
];

export function getRandomWaitingMessage(): WaitingMessage {
  const index = Math.floor(Math.random() * WAITING_MESSAGES.length);
  return WAITING_MESSAGES[index];
}
