# Cindy and Dorbor website package

This ZIP contains the website as it was published on 27 September 2026.

## What is inside

- `primary-site/`: the complete invitation, guest RSVP form, private admin dashboard, server routes, database schema and migration, and envelope image.
- `previous-address-forwarder/`: the site that forwards the earlier invitation address to the primary site.
- `data/guests.json`: a backup of the current guest records, including personal invitation codes and responses. Keep this file private.

## Current addresses

- Invitation: https://cindy-dorbor-rsvp.migiromark173.chatgpt.site/
- Guest RSVP: https://cindy-dorbor-rsvp.migiromark173.chatgpt.site/rsvp
- Admin: https://cindy-dorbor-rsvp.migiromark173.chatgpt.site/admin
- Earlier invitation address: https://cindy-dorbor-traditional-wedding.migiromark173.chatgpt.site/ (forwards to the invitation above)

The admin route requires ChatGPT sign-in and server-side authorization for `migiromark173@gmail.com`. No admin link appears on the public invitation. Login credentials, session tokens, and hosted database credentials are not in this ZIP.

## Running from source

The `primary-site` is a Next/Vinext app for Cloudflare Workers. It uses Node 22 or newer and the included `pnpm-lock.yaml`. The hosting manifest uses a D1 database binding named `DB`; apply the included `drizzle/` migration before serving reservations. Configure `ADMIN_EMAIL` as a private environment variable for the account that should manage guests. The JSON backup is data, not an automatic migration: import it into a new `guests` table if deploying a fresh copy, preserving each guest's `code` so existing personal RSVP links continue working.

The live site and its hosted database remain separate from this downloadable backup. Changes made to the live guest list after this export will not appear in `data/guests.json`.
