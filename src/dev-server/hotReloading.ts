import { Server, Packet } from "../../imports/wocket.ts";

export async function HotReload(
  toWatch: string,
  port: number,
  action: () => Promise<void> | void
) {
  const server = new Server();

  server.run({
    hostname: "0.0.0.0",
    port: port,
  });

  server.on("Reload", (packet: Packet) => {
    server.to("Reload", packet.message);
  });

  let kind = "";
  const events = ["remove", "modify"];
  for await (const { kind: eventKind } of Deno.watchFs(toWatch)) {
    if (events.includes(eventKind)) {
      if (kind !== eventKind) {
        server.to("Reload", "compiling");
        await action();
        server.to("Reload", "reload");
        kind = eventKind;
      }
      // debounce recompile
      setTimeout(() => (kind = ""), 5000);
    }
  }
}

export function clientConnection(
  port: number,
  onNet: string | null | undefined
) {
  return `    <script role="hot-reload">
      (() => {
        if ("WebSocket" in window) {
          const socket = new WebSocket("ws://${onNet ?? "localhost"}:${port}");

          socket.addEventListener("open", () => {
            console.log(
              "%c Snel %c Hot Reloading %c",
              "background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff",
              "background:#ff3e00 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff",
              "background:transparent"
            );

            socket.send(
              JSON.stringify({
                connect_to: ["Reload"],
              })
            );
          });

          socket.addEventListener("close", () => {
            console.log(
              "%c Hot Reloading %c connection cut off 🔌 %c",
              "background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff",
              "background:#ff3e00 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff",
              "background:transparent"
            );
          });

          socket.addEventListener("error", () => {
            console.log(
              "%c Hot Reloading %c connection error %c",
              "background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff",
              "background:#ff3e00 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff",
              "background:transparent"
            );
          });

          const Reload = () => setTimeout(() => window.location.reload(), 500);

          socket.addEventListener("message", (event) => {
            try {
              const { message } = JSON.parse(event.data);

              if (message === "reload") {
                console.log(
                  "%c 🔥 %c Reloading... %c",
                  "background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff",
                  "background:#ff3e00 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff",
                  "background:transparent"
                );
                Reload();
              }

              if (message === "compiling") {
                console.log(
                  "%c 🔥 %c Recompiling... %c",
                  "background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff",
                  "background:#ff3e00 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff",
                  "background:transparent"
                );
              }
            } catch (error) {
              /* nothing here */
            }
          });
        } else {
          console.log(
            "%c Hot Reloading %c your browser not support websockets :( %c",
            "background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff",
            "background:#ff3e00 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff",
            "background:transparent"
          );
        }
      })();
    </script>`;
}
