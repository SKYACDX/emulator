import type * as Party from "partykit/server";

// Link-cable relay: a "room" = a game session, its id = the code the two
// players share out of band. Caps at 2 connections (a link cable only ever
// has two ends) and forwards every message verbatim to the other peer.
// No parsing of the bytes — that's the emulator cores' job, not ours.
export default class Relay implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    const peers = [...this.room.getConnections()];
    if (peers.length > 2) {
      conn.close(4000, "Room full (2 players max)");
    }
  }

  onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    for (const conn of this.room.getConnections()) {
      if (conn.id !== sender.id) conn.send(message);
    }
  }
}

Relay satisfies Party.Worker;
