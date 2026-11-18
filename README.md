# 🥞 Pankakeria

Welcome to a tiny pancake shop with a big breakfast rush! Pankakeria is a cozy Reddit game about flipping golden pancakes, matching customer orders, and making every stack a little sweeter.

## 🍓 How to play

1. Flip the pancake three times by hitting the green timing zone.
2. Add the toppings shown on the order ticket.
3. Serve the finished pancake and welcome the next customer.

Complete orders to earn coins and build your best shift score. Every customer gets a fresh order with one to five topping categories and different quantities.

## ⏱️ Shift rules

- Each shift starts with 60 seconds.
- A correct order earns 100 coins, adds 5 seconds, and earns one star, up to five stars.
- Every third successful order in a row adds a small streak tip.
- A wrong order earns a smaller payout based on the topping mismatch and removes 1.5 stars. 
- The shift ends when time runs out or you make three mistakes.

## 🎮 Controls

- Tap **Flip pancake** when the moving marker is inside the green zone. Flip three times; the meter gets quicker and the target gets tighter.
- Tap or drag an ingredient tool onto the pancake to add it.
- Use **Clear plate** to start topping again if you need to correct the pancake.
- Use the sound button to turn the bakery music and effects on or off.

## 🏆 Best shifts

After a shift ends, the bakery leaderboard compares each Reddit player's best saved shift. Player rows include an avatar, username, coins, time, and orders served. Your own row is highlighted, and the list can be scrolled when it gets long.

## 🧁 Built with

Devvit Web, React, TypeScript, Hono, and tRPC.

## 🛠️ Development

Install dependencies with `npm install`, sign in with `npx devvit login`, then run `npm run dev` to start a Reddit playtest.

Useful commands:

- `npm run dev` — Start a playtest.
- `npm run build` — Build the client and server.
- `npm run test` — Run type checks, linting, unit tests, and a build.

## 📁 Project map

- `src/client/` — Game, splash screen, interactions, sounds, and styles.
- `src/server/` — Reddit app routes and saved leaderboard scores.
- `src/shared/` — Types and utilities shared by the client and server.
- `public/assets/` — Pancake, ingredient, and bakery artwork.

## 🌼 Made for cozy chaos

Every shift brings a new customer, a new topping mix, and one more chance to become the neighborhood's top pancake chef. Grab a spatula and let the breakfast rush begin!
