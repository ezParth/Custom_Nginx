import { parseYAMLConfig, validateConfig } from "./config";
import { ConfigSchemaType, rootConfigSchema } from "./config_schema";
import { program } from "commander";
import cluster, { Worker } from "node:cluster";
import os from "os";
import http from "http";
import {
  workerMessageReplySchema,
  workerMessageReplyType,
  workerMessageSchema,
  workerMessageType,
} from "./server_schema";

interface createServerConfig {
  port: number;
  workerCount: number;
  config: ConfigSchemaType;
}

const createServer = async (config: createServerConfig) => {
  const { workerCount } = config;
  const workers = new Array(workerCount);

  if (cluster.isPrimary) {
    console.log("Master Process is up!");

    for (let i = 0; i < workerCount; i++) {
      cluster.fork({ config: JSON.stringify(config.config) });
      console.log(`Worker node ${i + 1} spinned up`);
    }

    const server = http.createServer((req, res) => {
      const index = Math.floor(Math.random() * workerCount);
      const worker: Worker | undefined =
        Object.values(cluster.workers ?? [])[index];

      if (!worker) {
        console.log("Worker is undefined");
        res.writeHead(500);
        res.end("Internal Server Error: No available worker");
        return;
      }

      const payload: workerMessageType = {
        requestType: "HTTP",
        headers: req.headers,
        body: null,
        url: `${req.url}`,
      };

      worker.send(JSON.stringify(payload));

      const onMessage = async (workerReply: string) => {
        try {
          const reply = await workerMessageReplySchema.parseAsync(
            JSON.parse(workerReply)
          );

          if (reply.errorCode) {
            res.writeHead(parseInt(reply.errorCode));
            res.end(reply.error);
          } else {
            res.writeHead(200);
            res.end(reply.data);
          }
        } catch (error) {
          console.error("Error parsing worker reply:", error);
          res.writeHead(500);
          res.end("Internal Server Error");
        } finally {
          worker.off("message", onMessage);
        }
      };

      worker.on("message", onMessage);
    });

    server.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } else {
    const config = await rootConfigSchema.parseAsync(
      JSON.parse(process.env.config as string)
    );

    process.on("message", async (msg: string) => {
      try {
        const validatedMessage = await workerMessageSchema.parseAsync(
          JSON.parse(msg)
        );

        const requestUrl: string = validatedMessage.url;
        const rule = config.server.rules.find((e) => e.path === requestUrl);

        if (!rule) {
          const reply: workerMessageReplyType = {
            errorCode: "404",
            error: "Rule not found!",
          };
          if (process.send) process.send(JSON.stringify(reply));
          return;
        }

        const upstreamID = rule.upstreams[0];
        const upstream = config.server.upstream.find(
          (e) => e.id === upstreamID
        );

        if (!upstream) {
          const reply: workerMessageReplyType = {
            errorCode: "500",
            error: "Upstream not found!",
          };
          if (process.send) process.send(JSON.stringify(reply));
          return;
        }

        const proxyReq = http.request(
          { host: upstream.url, path: requestUrl },
          (proxyRes) => {
            let body = "";

            proxyRes.on("data", (chunk) => {
              body += chunk;
            });

            proxyRes.on("end", () => {
              const reply: workerMessageReplyType = { data: body };
              if (process.send) process.send(JSON.stringify(reply));
            });
          }
        );

        proxyReq.on("error", (err) => {
          console.error("Error in proxy request:", err);
          const reply: workerMessageReplyType = {
            errorCode: "500",
            error: "Proxy request failed!",
          };
          if (process.send) process.send(JSON.stringify(reply));
        });

        proxyReq.end();
      } catch (error) {
        console.error("Error in worker message handler:", error);
        const reply: workerMessageReplyType = {
          errorCode: "500",
          error: "Internal Server Error",
        };
        if (process.send) process.send(JSON.stringify(reply));
      }
    });
  }
};

const main = async () => {
  try {
    program.option("--config <path>");
    program.parse();

    const options = program.opts();

    if (options && "config" in options) {
      const validatedConfig = await validateConfig(
        await parseYAMLConfig(options.config)
      );

      await createServer({
        port: validatedConfig.server.listen,
        workerCount: validatedConfig.server.workers ?? os.cpus().length,
        config: validatedConfig,
      });
    }
  } catch (error) {
    console.log("Error in server.ts file: ", error);
  }
};

main();
