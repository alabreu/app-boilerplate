import type { pt } from './pt'

/** English messages — o tipo força paridade de chaves com o pt. */
export const en: Record<keyof typeof pt, string> = {
  // Common
  'common.back': 'Back',

  // Home (menu button)
  'home.menuButton': 'Menu',
  'home.menuButtonUnread': 'Menu — unread news available',

  // Menu
  'menu.feedback': 'Send feedback',
  'menu.language': 'Language',
  'menu.news': "What's new",
  'menu.donate': 'Support the app',
  'menu.login': 'Sign in',

  // Auth
  'auth.title': 'Sign in',
  'auth.subtitle': 'Sign in to sync your data on any device.',
  'auth.google': 'Continue with Google',
  'auth.or': 'or',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.signIn': 'Sign in',
  'auth.signUp': 'Create account',
  'auth.toSignUp': 'No account? Create one',
  'auth.toSignIn': 'Already have an account? Sign in',
  'auth.guestNote': 'You can keep using the app without an account.',
  'auth.soon': 'Sign-in will be available soon.',
  'auth.error': "Couldn't sign in. Check your details and try again.",
  'auth.checkEmailTitle': 'Confirm your email',
  'auth.checkEmailBody':
    "If this address doesn't have an account yet, we sent a confirmation link to {email}. Open it to activate the account and sign in.",
  'auth.checkEmailSpam':
    "Didn't arrive? Check your spam — it can take a few minutes.",
  'auth.backToSignIn': 'Back to sign in',
  'auth.signedInAs': 'Signed in as',
  'auth.signOut': 'Sign out',

  // Feedback
  'feedback.title': 'Send feedback',
  'feedback.intro':
    'Your feedback helps improve the app. Tell us what you think.',
  'feedback.typeLabel': 'Type',
  'feedback.type.bug': 'Bug',
  'feedback.type.idea': 'Idea',
  'feedback.type.other': 'Other',
  'feedback.messageLabel': 'Message',
  'feedback.messagePlaceholder': 'What happened? What could be better?',
  'feedback.emailLabel': 'Your email (optional)',
  'feedback.emailPlaceholder': 'so we can get back to you',
  'feedback.send': 'Send',
  'feedback.sentTitle': 'Thank you!',
  'feedback.sentBody': 'We received your feedback. 🙌',
  'feedback.sentMailBody':
    'We opened your email with the feedback — just hit send. 🙌',
  'feedback.error': "Couldn't send right now. Try again in a moment.",
  'feedback.another': 'Send another',

  // Donations
  'donate.title': 'Support the app',
  'donate.body':
    'This app is free. If it helps you, a donation of any amount helps keep the servers and development going.',
  'donate.button': 'Make a donation',
  'donate.thanks': 'Every amount makes a difference. Thank you! 💜',
  'donate.soon': 'Donations will be available soon.',

  // Language
  'language.title': 'Language',
  'language.subtitle': 'Choose the app language.',

  // News (changelog)
  'news.title': "What's new",
  'news.subtitle': "What's new in the app.",
  'news.badgeNew': 'new',

  // Admin (operator panel — /admin)
  'admin.title': 'Admin',
  'admin.restricted': 'Restricted area.',
  'admin.users': 'Users',
  'admin.dau': 'DAU',
  'admin.wau': 'WAU',
  'admin.mau': 'MAU',
  'admin.feedback': 'Feedback',
  'admin.sessionsByDay': 'Sessions per day (30d)',
  'admin.noData': 'No data yet.',
  'admin.feedbackInbox': 'Feedback inbox',
  'admin.feedbackEmpty': 'No feedback yet.',

  // Update toast
  'update.available': 'New version available',
  'update.action': 'Update',
  'update.updating': 'Updating…',
  'update.dismiss': 'Dismiss',

  // Game (HUD)
  'game.name': 'Fissure',
  'game.biomass': 'Biomass',
  'game.ore': 'Ore',
  'game.core': 'Core',
  'game.hordeDormant': 'Horde {n}/{total} · underground is quiet',
  'game.hordeIn': 'Horde {n}/{total} in {s}s',
  'game.hordeWarning': 'Tremor! Horde {n}/{total} in {s}s',
  'game.hordeActive': 'Horde {n}/{total}: {left} creatures',
  'game.collector': 'Collector',
  'game.turret': 'Turret',
  'game.tools': 'Drills',
  'game.toolsLevel': 'Drills x{n}',
  'game.explore': 'Explore',
  'game.cancel': 'Cancel',
  'game.close': 'Close',
  'game.merge': 'Merge',
  'game.level': 'Lv.{n}',
  'game.levelMax': 'Max level',
  'game.unitTurret': 'Turret Lv.{n}',
  'game.unitCollector': 'Collector Lv.{n}',
  'game.turretStats': 'damage {damage} · range {range}',
  'game.collectorStats': 'power {power} per hit',
  'game.mergeTip': 'Tap another identical one to merge',
  'game.mergeNone': 'Build another identical one to merge',
  'game.restart': 'Play again',
  'game.wonTitle': 'Colony stabilized',
  'game.wonBody':
    'All {waves} hordes were contained. The fissure closes, for now.',
  'game.lostTitle': 'The core fell',
  'game.lostBody': 'The creatures took the refinery. Try defending earlier.',
  'game.statsTaps': '{n} taps',
  'game.statsCollected': '{bio} biomass · {ore} ore',
  'game.statsMerges': '{n} merges · {k} creatures',
  'game.canvasLabel':
    'Colony map. Tap elements to collect, drag to move the camera.',
  'game.aboutTitle': 'Fissure — POC',
  'game.aboutBody':
    'A colony of humans and robots scrapes the surface of a dead industrial world. What slept underground has woken up.',

  // Map regions
  'region.colony': 'Colony',
  'region.forest': 'Toxic grove',
  'region.fissure': 'Fissure',
  'region.fungus': 'Fungus field',
  'region.quarry': 'Quarry',
  'region.ruins': 'Ruins',
  'region.field': 'Field',
  'region.scrapyard': 'Scrapyard',
  'region.wastes': 'Wastes',

  // Hints (one line at a time, guiding the loop)
  'hint.tap':
    'Tap a tree or rock. Each tap wears it down; when it falls, you get the resource.',
  'hint.more':
    'Keep collecting: a Collector costs {biomass} biomass and {ore} ore.',
  'hint.buyCollector':
    'You can buy a Collector now: it repeats the taps on its own.',
  'hint.automation':
    'The collector works on its own. Your taps still speed things up.',
  'hint.explore':
    'Tap the fog next door to send the probe and reveal the area.',
  'hint.buildTurret': 'Build turrets: something is stirring underground.',
  'hint.place': 'Tap a free (marked) tile to place the turret.',
  'hint.merge': 'Tap a turret, then another identical one to merge them.',
  'hint.mergeSelect': 'Now tap another turret of the same level to merge.',
  'hint.hordeIncoming':
    'Tremor! The fissure to the east is about to spit creatures.',
  'hint.hordeNow': 'Horde! Defend the core. Tapping creatures helps too.',
  'hint.hordeCleared': 'Horde contained. Back to collecting and reinforcing.',
  'hint.placeInvalid': "Can't build here: needs a free, revealed tile.",
  'hint.noResources': 'Not enough resources.',
}
