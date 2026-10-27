export {};

declare global {
  interface Window {
    io: typeof import('socket.io-client').io;
  }
}
