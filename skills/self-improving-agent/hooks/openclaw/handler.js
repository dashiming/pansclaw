function emitReminder(prefix) {
  console.log(`${prefix} Evaluate whether this turn produced reusable learning.`);
  console.log(
    `${prefix} If yes, append concise entries to .learnings/LEARNINGS.md or .learnings/ERRORS.md.`,
  );
}

export default async function handler(event) {
  const type = event?.type ?? "";
  const action = event?.action ?? "";

  if (type === "gateway" && action === "startup") {
    emitReminder("[self-improvement]");
    return;
  }

  if (type === "command" && (action === "new" || action === "reset" || action === "stop")) {
    emitReminder("[self-improvement]");
  }
}
