/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "sst-local-gpt",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: { docker: true, random: true, cloudflare: true },
    };
  },
  async run() {
    const domain = "digitalmarket.dev";

    const gpt = new docker.Container("OpenWebUI", {
      name: "open-webui",
      image: "ghcr.io/open-webui/open-webui:main",
      restart: "always",
      volumes: [
        {
          volumeName: "open-webui",
          containerPath: "/app/backend/data",
        },
      ],
      ports: [
        {
          external: 3000,
          internal: 8080,
        },
      ],
      hosts: [
        {
          host: "host.docker.internal",
          ip: "host-gateway",
        },
      ],
    });

    const tunnel = new cloudflare.Tunnel("Tunnel", {
      accountId: sst.cloudflare.DEFAULT_ACCOUNT_ID,
      name: "demo",
      secret: new random.RandomPassword("TunnelSecret", {
        length: 16,
        special: false,
      }).result,
    });


    new cloudflare.TunnelConfig("TunnelConfig", {
      accountId: sst.cloudflare.DEFAULT_ACCOUNT_ID,
      tunnelId: tunnel.id,
      config: {
        ingressRules: [
          {
            hostname: "gpt." + domain,
            service: "http://192.168.68.55:3000",
          },
          {
            service: "http_status:404"
          }
        ],
      },
    });


    const zone = cloudflare.getZoneOutput({
      name: domain,
    });

    new cloudflare.Record("TunnelDNS", {
      zoneId: zone.zoneId,
      name: "gpt." + domain,
      type: "CNAME",
      value: $interpolate`${tunnel.id}.cfargotunnel.com`,
      proxied: true,
    });

    new docker.Container("Cloudflared", {
      name: "cloudflared",
      image: "cloudflare/cloudflared:latest",
      command: [
        "tunnel",
        "--no-autoupdate",
        "run",
        "--token",
        tunnel.tunnelToken,
      ],
    });
  },
});
