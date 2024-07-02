# SST Cloudflared

This is an example on how to use [SST](https://sst.dev/) to deploy a docker container and expose it through a [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/). The setup includes a private Docker network, a Cloudflare Tunnel for secure access, and DNS records for a subdomain.

## Prerequisites

Before you begin, ensure you have the following:

- **Docker**: Installed and running on your machine.
- **Cloudflare API Token**: Required for managing DNS and Tunnel configurations.
- **Cloudflare Account ID**: Your Cloudflare account ID.
- **Domain**: Your cloudflare owned domain

## Installation

1. **Install SST CLI:**

   ```bash
   curl -fsSL https://sst.dev/install | bash
   ```

2. **Set Environment Variables:**

   Replace `aaaaaaaa_aaaaaaaaaaaa_aaaaaaaa` with your actual Cloudflare API token and account ID.

   ```bash
   export CLOUDFLARE_API_TOKEN=aaaaaaaa_aaaaaaaaaaaa_aaaaaaaa
   export CLOUDFLARE_DEFAULT_ACCOUNT_ID=aaaaaaaa_aaaaaaaaaaaa_aaaaaaaa
   ```

3. **Set environment specific values:**

   Replace config values

   ```typescript
   const config = {
     domain: "domain.com",
     subdomain: "subdomain",
     containerPort: "8080", // Port your container exposes internally
   };
   ```

   **Note:**

   ```typescript
   hosts: [
        {
          host: "host.docker.internal",
          ip: "host-gateway",
        },
      ],
   ```

   is not required if the container is not accessing services at `localhost`.

4. **Install Dependencies:**
   ```bash
   sst install
   ```
5. **Deploy the Project:**
   ```bash
   sst deploy
   ```

## Resources

[SST](https://sst.dev/docs/)

[Docker](https://docs.docker.com/engine/)

[Docker Provider](https://www.pulumi.com/registry/packages/docker/)
