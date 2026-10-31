/**
 * PeerJS WebRTC Local Hotspot Multiplayer Manager
 * Enables mobile devices connected to the same Wi-Fi / hotspot to join and sync in real time.
 */

import Peer, { DataConnection } from 'peerjs';

export interface PlayerNetState {
  id: string;
  name: string;
  team: 'blue' | 'red';
  x: number;
  y: number;
  z: number;
  rotY: number;
  pitch: number;
  weaponId: string;
  isShooting: boolean;
  isCrouched: boolean;
  health: number;
}

export interface ShootPacket {
  shooterId: string;
  weaponId: string;
  origin: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  targetId?: string;
  damage?: number;
  headshot?: boolean;
}

export interface KillPacket {
  killerId: string;
  killerName: string;
  victimId: string;
  victimName: string;
  weaponId: string;
  headshot: boolean;
}

export type NetMessage =
  | { type: 'STATE'; payload: PlayerNetState }
  | { type: 'SHOOT'; payload: ShootPacket }
  | { type: 'KILL'; payload: KillPacket }
  | { type: 'DAMAGE'; payload: { targetId: string; damage: number; headshot: boolean; attackerId: string } };

export class NetworkManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  public peerId: string = '';
  public roomCode: string = '';
  public isHost: boolean = false;
  public isConnected: boolean = false;

  public onPeerState?: (state: PlayerNetState) => void;
  public onPeerShoot?: (shoot: ShootPacket) => void;
  public onPeerDamage?: (damage: { targetId: string; damage: number; headshot: boolean; attackerId: string }) => void;
  public onPeerKill?: (kill: KillPacket) => void;
  public onPeerJoin?: (peerId: string) => void;
  public onPeerLeave?: (peerId: string) => void;
  public onStatusChange?: (status: string) => void;

  /**
   * Initializes host room with random code (e.g. PJ-4821)
   */
  public hostMatch(onReady: (code: string) => void, onError: (err: string) => void) {
    this.disconnect();
    this.isHost = true;
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    this.roomCode = `PJ-${randomCode}`;
    const fullPeerId = `poria-jam-${this.roomCode}`;

    try {
      this.peer = new Peer(fullPeerId, {
        debug: 1,
      });

      this.peer.on('open', (id) => {
        this.peerId = id;
        this.isConnected = true;
        this.onStatusChange?.(`Hosting match on room [${this.roomCode}]`);
        onReady(this.roomCode);
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('Peer host error:', err);
        // If ID taken, generate another
        if (err.type === 'unavailable-id') {
          this.hostMatch(onReady, onError);
        } else {
          onError(err.message || 'Network error');
        }
      });
    } catch (e: unknown) {
      onError((e as Error)?.message || 'Failed to initialize PeerJS');
    }
  }

  /**
   * Joins match with room code
   */
  public joinMatch(code: string, onConnected: () => void, onError: (err: string) => void) {
    this.disconnect();
    this.isHost = false;
    const formattedCode = code.toUpperCase().startsWith('PJ-') ? code.toUpperCase() : `PJ-${code.toUpperCase()}`;
    this.roomCode = formattedCode;
    const targetPeerId = `poria-jam-${formattedCode}`;

    try {
      this.peer = new Peer({
        debug: 1,
      });

      this.peer.on('open', (id) => {
        this.peerId = id;
        this.onStatusChange?.(`Connecting to host [${formattedCode}]...`);

        const conn = this.peer!.connect(targetPeerId, {
          reliable: false, // Low-latency UDP-style data channel for FPS gaming
        });

        conn.on('open', () => {
          this.setupConnection(conn);
          this.isConnected = true;
          this.onStatusChange?.(`Connected to host [${formattedCode}]!`);
          onConnected();
        });

        conn.on('error', (err) => {
          onError(err.message || 'Connection failed to host');
        });
      });

      this.peer.on('error', (err) => {
        console.warn('Peer client error:', err);
        onError(err.message || 'Could not find match host');
      });
    } catch (e: unknown) {
      onError((e as Error)?.message || 'Failed to initialize PeerJS');
    }
  }

  private setupConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);
    this.onPeerJoin?.(conn.peer);

    conn.on('data', (data) => {
      try {
        const msg = data as NetMessage;
        switch (msg.type) {
          case 'STATE':
            this.onPeerState?.(msg.payload);
            // If host, forward to other peers
            if (this.isHost) {
              this.broadcast(msg, conn.peer);
            }
            break;
          case 'SHOOT':
            this.onPeerShoot?.(msg.payload);
            if (this.isHost) {
              this.broadcast(msg, conn.peer);
            }
            break;
          case 'DAMAGE':
            this.onPeerDamage?.(msg.payload);
            if (this.isHost) {
              this.broadcast(msg, conn.peer);
            }
            break;
          case 'KILL':
            this.onPeerKill?.(msg.payload);
            if (this.isHost) {
              this.broadcast(msg, conn.peer);
            }
            break;
        }
      } catch (err) {
        console.warn('Network packet parse error:', err);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.onPeerLeave?.(conn.peer);
    });

    conn.on('error', () => {
      this.connections.delete(conn.peer);
    });
  }

  public broadcast(msg: NetMessage, excludePeerId?: string) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        conn.send(msg);
      }
    });
  }

  public sendState(state: PlayerNetState) {
    this.broadcast({ type: 'STATE', payload: state });
  }

  public sendShoot(shoot: ShootPacket) {
    this.broadcast({ type: 'SHOOT', payload: shoot });
  }

  public sendDamage(targetId: string, damage: number, headshot: boolean, attackerId: string) {
    this.broadcast({ type: 'DAMAGE', payload: { targetId, damage, headshot, attackerId } });
  }

  public sendKill(kill: KillPacket) {
    this.broadcast({ type: 'KILL', payload: kill });
  }

  public disconnect() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.isConnected = false;
    this.peerId = '';
    this.roomCode = '';
  }
}

export const networkManager = new NetworkManager();
