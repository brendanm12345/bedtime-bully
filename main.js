// Run this as a daily cron job each morning (e.g., 9 AM)

require('dotenv').config();
const nodemailer = require('nodemailer');

const OURA_TOKEN = process.env.OURA_TOKEN;
const FRIEND_VENMO_USERNAME = process.env.FRIEND_VENMO_USERNAME;
const MY_EMAIL = process.env.MY_EMAIL;
const FRIEND_EMAIL = process.env.FRIEND_EMAIL;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;

const TARGET_BEDTIME_HOUR = 0; // midnight
const TARGET_BEDTIME_MINUTE = 30;
const PENALTY_AMOUNT = 1;

// Sunday = 0, Monday = 1, ... Saturday = 6
// We check MORNING after, so Monday morning = Sunday night, etc.
const ENFORCEMENT_MORNINGS = [1, 2, 3, 4, 5]; // Mon-Fri mornings (Sun-Thu nights)

function getVenmoUrl(username, amount, note) {
  const encodedNote = encodeURIComponent(note);
  return `https://venmo.com/${username}?txn=pay&amount=${amount}&note=${encodedNote}&audience=private`;
}

async function sendPenaltyEmail(venmoUrl, bedtimeStr) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: MY_EMAIL,
      pass: EMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: MY_EMAIL,
    to: MY_EMAIL,
    cc: FRIEND_EMAIL,
    subject: `🛏️ Bedtime Penalty - You owe $${PENALTY_AMOUNT}!`,
    html: `
      <h2>You went to bed late!</h2>
      <p><strong>Bedtime:</strong> ${bedtimeStr}</p>
      <p><strong>Target:</strong> Midnight</p>
      <p>You owe <strong>$${PENALTY_AMOUNT}</strong> to @${FRIEND_VENMO_USERNAME}.</p>
      <p style="margin: 20px 0;">
        <a href="${venmoUrl}" style="background-color:rgb(86, 169, 237); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Pay $${PENALTY_AMOUNT} on Venmo
        </a>
      </p>
      <p style="color: #666; font-size: 12px;">This is an automated message from your bedtime accountability app.</p>
    `,
    text: `You went to bed late!\n\nBedtime: ${bedtimeStr}\nTarget: Midnight\n\nYou owe $${PENALTY_AMOUNT} to @${FRIEND_VENMO_USERNAME}.\n\nPay here: ${venmoUrl}`,
  };

  const result = await transporter.sendMail(mailOptions);
  console.log('Email sent:', result.messageId);
  return result;
}

async function getLastNightSleep() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const startDate = yesterday.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  const res = await fetch(
    `https://api.ouraring.com/v2/usercollection/sleep?start_date=${startDate}&end_date=${endDate}`,
    { headers: { "Authorization": `Bearer ${OURA_TOKEN}` } }
  );

  const data = await res.json();

  // Get the most recent sleep record
  if (data.data && data.data.length > 0) {
    return data.data[data.data.length - 1];
  }
  return null;
}

function isBedtimeLate(bedtimeStart) {
  const bedtime = new Date(bedtimeStart);
  const hour = bedtime.getHours();
  const minute = bedtime.getMinutes();

  // If hour is between 1-11, they went to bed after midnight (late)
  if (hour > TARGET_BEDTIME_HOUR && hour < 12) {
    return true;
  }
  if (hour === TARGET_BEDTIME_HOUR && minute > TARGET_BEDTIME_MINUTE) {
    return true;
  }
  return false; // Before midnight = on time
}

async function main() {
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Only enforce on weekday mornings (for previous night)
  if (!ENFORCEMENT_MORNINGS.includes(dayOfWeek)) {
    console.log("It's a weekend morning - no enforcement today!");
    return;
  }

  console.log("Checking last night's bedtime...");

  const sleep = await getLastNightSleep();

  if (!sleep) {
    console.log("No sleep data found for last night");
    return;
  }

  const bedtimeStart = sleep.bedtime_start;
  const bedtimeStr = new Date(bedtimeStart).toLocaleTimeString();
  console.log(`Bedtime was: ${bedtimeStr}`);

  if (isBedtimeLate(bedtimeStart)) {
    console.log("LATE! Sending penalty email...");

    const note = `Bedtime penalty - went to bed at ${bedtimeStr}`;
    const venmoUrl = getVenmoUrl(FRIEND_VENMO_USERNAME, PENALTY_AMOUNT, note);

    await sendPenaltyEmail(venmoUrl, bedtimeStr);

    console.log("Penalty email sent to you and your friend!");
  } else {
    console.log("On time! No penalty.");
  }
}

main().catch(console.error);
