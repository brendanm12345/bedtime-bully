# Bedtime Penalty App

Automatically sends yourself a Venmo payment link if you don't go to bed on time, with your accountability partner CC'd.

Warning: BYO Oura Ring.

## How It Works

1. Fetches your sleep data from Oura Ring API each morning
2. Checks if you went to bed after midnight (the target bedtime)
3. If late, sends an email to you (with your friend CC'd 😉) containing a Venmo payment link
4. You click the link to pay your $1 penalty

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```
OURA_TOKEN=your_oura_personal_access_token
FRIEND_VENMO_USERNAME=friends_venmo_username
MY_EMAIL=your_gmail@gmail.com
FRIEND_EMAIL=friends_email@example.com
EMAIL_APP_PASSWORD=your_gmail_app_password
```

**Getting your Oura token:**
1. Go to https://cloud.ouraring.com/personal-access-tokens
2. Create a new token with sleep data access

**Getting a Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Generate a new app password for "Mail"

### 3. Install the LaunchAgent (macOS)

The app runs automatically at 9 AM every day via macOS LaunchAgent.

```bash
# Copy the plist to LaunchAgents
cp com.brendan.bedtime-penalty.plist ~/Library/LaunchAgents/

# Load it - the app is now running on a cron job
launchctl load ~/Library/LaunchAgents/com.brendan.bedtime-penalty.plist
```

## Usage

### Manual run

```bash
node main.js
```

### Manage the scheduled task

```bash
# Stop
launchctl unload ~/Library/LaunchAgents/com.brendan.bedtime-penalty.plist

# Start
launchctl load ~/Library/LaunchAgents/com.brendan.bedtime-penalty.plist

# Check status
launchctl list | grep bedtime
```

### View logs

```bash
cat bedtime.log
cat bedtime-error.log
```

## Configuration

Edit these constants in `main.js` to customize:

| Variable | Default | Description |
|----------|---------|-------------|
| `TARGET_BEDTIME_HOUR` | 0 | Target bedtime hour (0 = midnight) |
| `TARGET_BEDTIME_MINUTE` | 0 | Target bedtime minute |
| `PENALTY_AMOUNT` | 1 | Dollar amount for penalty |
| `ENFORCEMENT_MORNINGS` | [1,2,3,4,5] | Days to enforce (Mon-Fri) |
