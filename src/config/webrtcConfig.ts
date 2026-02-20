/** WebRTC ICE servers for NAT traversal. TURN required for production (NAT/firewall). */

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

function getStunServers(): RTCIceServer[] {
  return [{ urls: 'stun:stun.l.google.com:19302' }];
}

function getTurnServer(): RTCIceServer | null {
  const url = process.env.NEXT_PUBLIC_TURN_URL;
  if (!url) return null;
  const username = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const credential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
  if (!username || !credential) return null;
  return { urls: url, username, credential };
}

/** Returns ICE servers: STUN (always) + TURN (if env configured). */
export function getIceServers(): RTCIceServer[] {
  const turn = getTurnServer();
  return turn ? [...getStunServers(), turn] : getStunServers();
}
