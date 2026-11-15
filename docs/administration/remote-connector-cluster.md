---
title: Remote connector cluster
---

# Remote connector cluster

By default, setup creates a local kind cluster for platform-hosted connectors. Connectors can
instead run on an existing Kubernetes cluster dedicated to connector workloads. The identity
services remain on the OpenDS server and are accessed through the platform's public HTTPS
address.

:::warning[Switch before creating connectors]
After switching to a remote cluster, connectors on the local cluster continue running, but
OpenDS no longer manages them. They disappear from **Discover** and refuse lifecycle actions,
so they can no longer be managed. New connectors are created on the remote cluster instead.

If the installation already has connectors, export their data before switching. After creating
the new connectors on the remote cluster, import the exported data.
:::

## Requirements

The remote cluster requires:

- **DNS**: a wildcard record for the connector domain that both other participants and the
  platform can resolve.
- **Private ingress address**: an address serving both the public and the private
  IngressClasses. It must be reachable only by the platform and is configured with
  `--ingress-gateway`. Management API traffic must use this private ingress rather than the
  public ingress.
- **Outbound HTTPS**: pods must be able to reach the platform domain over HTTPS. The domain
  must resolve reliably inside the pods, because connectors otherwise cannot fetch their
  credentials (see [step 4](#4-check-dns-resolution-inside-the-pods) below).
- **Storage**: a default StorageClass for the connector databases and Vaults.
- **Network policies**: a network implementation that enforces Kubernetes NetworkPolicy, which
  isolates connectors from one another ([Architecture](/architecture#connector-hosting)).

Configure the remote cluster in `.env`, using the advanced settings listed in `.env.example`,
or pass the settings to `setup`:

```bash
bash manage.sh setup --public-domain <DOMAIN> --connector-cluster remote \
  --kubeconfig <FILE> --connector-domain <CONNECTOR_DNS_DOMAIN> --target <NAME> \
  --ingress-gateway http://<PRIVATE_INGRESS_ADDRESS>
```

Setup stores a private copy of the kubeconfig in `.deploy/kubeconfig-remote`.

Each connector receives three host names:

- `<slug>-controlplane.<domain>` and `<slug>-dataplane.<domain>` use the public IngressClass
  (`nginx` by default), with the ingress-nginx CORS annotations.
- `<slug>.management.<domain>` uses the private IngressClass (`nginx-internal`).

## Example: a kind cluster on a second server

This example uses two servers on the same private network:

- OpenDS server: `10.0.0.10`
- Connector server: `10.0.0.20`

Connector names use sslip.io, so no DNS records are needed. Run the following steps on the
second server from a copy of the OpenDS repository, with Docker installed.

Setup on the OpenDS server downloads the tested versions of `kind`, `kubectl` and `helm` into
`.tools/`. Copy that folder to the second server and add it to the `PATH`. The second server
also needs the two kernel limits listed under
[Requirements](/getting-started/installation#requirements).

### 1. Create the cluster

Configure the Kubernetes API to listen on the private address. Map the public ingress to port
80 and the private ingress to the loopback port 19090.

```yaml title="connectors-kind.yaml"
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
networking:
  apiServerAddress: "10.0.0.20"
  apiServerPort: 16443
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
      - containerPort: 8090
        hostPort: 19090
        listenAddress: "127.0.0.1"
```

Create the cluster and export its kubeconfig:

```bash
kind create cluster --name connectors --config connectors-kind.yaml
kind get kubeconfig --name connectors > kubeconfig-connectors
```

### 2. Install the ingress controllers

Install two ingress controllers from the chart in the repository. The public controller uses
the repository's values. The private controller serves the class `nginx-internal`.

```yaml title="traefik-internal-values.yaml"
providers:
  kubernetesCRD: { enabled: false }
  kubernetesIngress: { enabled: false }
  kubernetesIngressNGINX:
    enabled: true
    ingressClass: "nginx-internal"
    controllerClass: "k8s.io/ingress-nginx-internal"
ingressClass: { enabled: false }
ingressRoute: { dashboard: { enabled: false } }
ports:
  web: { hostPort: 8090 }
  websecure: { expose: { default: false } }
service: { spec: { type: ClusterIP } }
```

Install both controllers and configure their IngressClasses:

```bash
helm upgrade --install traefik infra/kubernetes/charts/traefik-41.7.1.tgz \
  -n traefik --create-namespace --wait --values infra/kubernetes/traefik-values.yaml
helm upgrade --install traefik-internal infra/kubernetes/charts/traefik-41.7.1.tgz \
  -n traefik-internal --create-namespace --wait --values traefik-internal-values.yaml
kubectl apply -f infra/kubernetes/traefik-ingressclass.yaml
kubectl apply -f - <<'EOF'
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: nginx-internal
spec:
  controller: k8s.io/ingress-nginx-internal
EOF
```

### 3. Start the private gateway

The private gateway is an nginx instance that accepts connections only from the OpenDS server.
It sends management host names to the private ingress and all other connector host names to
the public ingress.

```nginx title="connector-gateway/default.conf"
map $host $connector_upstream {
    ~\.management\.  127.0.0.1:19090;
    default          127.0.0.1:80;
}
server {
    listen 10.0.0.20:19080;
    allow 10.0.0.10;
    deny all;
    client_max_body_size 110m;
    location / {
        proxy_pass http://$connector_upstream;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}
```

Start the gateway:

```bash
docker run -d --name connector-gateway --restart unless-stopped --network host \
  -v "$PWD/connector-gateway/default.conf:/etc/nginx/conf.d/default.conf:ro" \
  nginx:1.27-alpine
```

### 4. Check DNS resolution inside the pods

Connector images give up on a name as soon as one lookup fails, so two DNS situations may need
a fix in the `coredns` ConfigMap. Edit the ConfigMap and restart CoreDNS afterwards:

```bash
kubectl -n kube-system edit configmap coredns
kubectl -n kube-system rollout restart deployment coredns
```

**sslip.io names of private addresses.** Some resolvers refuse to answer these names, so the
cluster answers them itself:

```text
10-0-0-20.sslip.io:53 {
    errors
    template IN A 10-0-0-20.sslip.io {
        answer "{{ .Name }} 60 IN A 10.0.0.20"
    }
    template IN AAAA 10-0-0-20.sslip.io {
        rcode NOERROR
    }
}
```

**Failing search domains.** Pods inherit the server's DNS search domains from
`/etc/resolv.conf` and try short names under them first. If a search domain's resolver fails
such lookups, answer "no such name" for it. This example is for `example.internal`:

```text
example.internal:53 {
    errors
    template ANY ANY example.internal {
        rcode NXDOMAIN
    }
}
```

Test the DNS resolution from inside a pod:

```bash
kubectl run dnstest --rm -i --restart=Never --image=alpine:3.20 \
  -- getent hosts <your platform domain>
```

The command must print an address every time.

### 5. Configure OpenDS to use the remote cluster

Copy `kubeconfig-connectors` to the OpenDS server and run setup:

```bash
bash manage.sh setup --public-domain <DOMAIN> --connector-cluster remote \
  --kubeconfig kubeconfig-connectors --connector-domain 10-0-0-20.sslip.io \
  --target connectors-1 --ingress-gateway http://10.0.0.20:19080
```

New connectors then start on the second server.

## HTTPS for connector traffic

In this example, the public ingress serves the connectors over plain HTTP on port 80, so
protocol messages and data exchanged between participants are not encrypted. For real data,
terminate HTTPS for the connector domain in front of the public ingress, for example with a
load balancer or a certificate on the ingress controller.

## Kubernetes targets

One Kubernetes target serves one OpenDS installation, and each connector records the target on
which it was provisioned. Connectors assigned to another target are ignored and refuse
lifecycle actions. **Never assign an existing target name to a different cluster.**
