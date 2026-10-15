# Susu Group Tracker

A small JSON API for managing one rotating savings group. Members contribute a fixed amount each week, and a complete week's pot is paid to the next member in join order.

## Project structure

```text
src/
  config/                Environment variables & configuration validation
  controllers/           HTTP request handling & response formatting
  domain/                Core Susu business rules & invariants
  middleware/            Global error handling & 404 route handling
  routes/                API route definitions & router aggregation
  services/              Application business logic & Susu state management
  utils/                 Money parsing & formatting helper utilities
  app.js                 Express app initialization & middleware configuration
  server.js              Server startup, port binding & graceful shutdown
tests/
  unit/                  Domain, money, and service unit tests
  integration/           End-to-end HTTP API tests
```

## Requirements

- Node.js 18 or newer
- npm

## Run

```sh
npm install
npm start
```

Alternatively:
- Start development mode with hot-reloading: `npm run dev`
- Direct node invocation: `node server.js` or `node src/server.js`

The API listens on `http://localhost:3000` by default. Set `PORT` to use another port.
State is held in memory, so restarting the server clears the group and its history.

## API

All request and response bodies are JSON. Money amounts must be decimal **strings** with no more than two decimal places; for example, `"50.00"`. Responses use the same format.

### Create the group

```sh
curl -i -X POST http://localhost:3000/group \
  -H 'Content-Type: application/json' \
  -d '{"weeklyContribution":"50.00"}'
```

Only one group can be created during a server run.

### Add members

```sh
curl -i -X POST http://localhost:3000/members \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ama"}'
```

Repeat for each member. The supplied name (or ID) is the member identifier.

### Record contributions

```sh
curl -i -X POST http://localhost:3000/contributions \
  -H 'Content-Type: application/json' \
  -d '{"member":"Ama","amount":"50.00"}'
```

Partial payments are allowed; submit another contribution for the remaining amount.
The API rejects unknown members, non-positive amounts, invalid decimal precision, and
payments above the member's remaining balance.

### Close the current week

```sh
curl -i -X POST http://localhost:3000/weeks/close \
  -H 'Content-Type: application/json' \
  -d '{}'
```

An incomplete week returns `closed: false` and each member's outstanding amount. It
does not advance the week or discard payments. Once all members have paid in full,
closing pays the pot to the next member in join order and advances the week.

### View the report

```sh
curl http://localhost:3000/report
```

The report includes the current week, each member's paid and outstanding amounts,
whether they have paid in full, and the payout history.

## Tests

```sh
npm test
```

The automated tests use Node's built-in test runner and cover money precision, payment
validation, partial payments, incomplete and successful week closes, payout order,
reports, and the HTTP API.

See [NOTES.md](./NOTES.md) for assumptions and possible future improvements.
