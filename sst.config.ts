/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "sst-gpt",
      home: "local",
      providers: { docker: true, random: true, cloudflare: true },
    };
  },

  async run() {

    const config = {
      domain: "digitalmarket.dev",
      subdomain: "gpt",
      containerPort: "8080"
    }

    // Fetch the Cloudflare zone for the domain
    const zone = cloudflare.getZoneOutput({
      name: config.domain,
    });

    const privateNetwork = new docker.Network("private_network", { name: `${$app.name}-network` });

    // Container that gets exposed through the tunnel
    const container = new docker.Container("OpenWebUI", {
      name: "open-webui",
      image: "ghcr.io/open-webui/open-webui:main",
      volumes: [
        {
          volumeName: "open-webui",
          containerPath: "/app/backend/data",
        },
      ],
      hosts: [
        {
          host: "host.docker.internal",
          ip: "host-gateway",
        },
      ],
      restart: "unless-stopped",
      networksAdvanced: [
        {
          name: privateNetwork.name
        }
      ]
    });

    const tunnel = new cloudflare.Tunnel("Tunnel", {
      accountId: sst.cloudflare.DEFAULT_ACCOUNT_ID,
      name: `${$app.name}-tunnel`,
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
            hostname: `${config.subdomain}.${config.domain}`,
            service: $interpolate`http://${container.name}:${config.containerPort}`
          },
          {
            service: "http_status:404"
          }
        ],
      },
    });

    new cloudflare.Record("TunnelRecord", {
      zoneId: zone.zoneId,
      name: `${config.subdomain}.${config.domain}`,
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
      restart: "unless-stopped",
      networksAdvanced: [
        {
          name: privateNetwork.name
        }
      ]
    });
  },
});