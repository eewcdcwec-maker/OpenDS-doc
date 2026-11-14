---
title: Remote connector cluster
---

# Remote connector cluster

By default, setup creates a local kind cluster for platform-hosted connectors. Connectors can
instead run on an existing Kubernetes cluster, which then runs only the connectors. The identity
services stay on the OpenDS server and are reached through the platform's public HTTPS address.

:::warning Switch before you create connectors
After the switch, connectors on the local cluster keep running, but OpenDS ignores them. They
disappear from **Discover** and refuse lifecycle actions, so they can no longer be managed, and
you create new connectors on the remote cluster. If the installation already has connectors,
export their data before you switch, and import it into the new connectors afterwards.
:::

The cluster needs:

- **DNS**: a wildcard record for the connector domain that partners and the platform can
  resolve.
- **Private ingress address**: serves both the public and the private IngressClass and is
  reachable only by the platform
  (`--ingress-gateway`), so that the management API never uses the public ingress.
- **Outbound HTTPS**: from the pods to the platform domain. The domain must resolve reliably
  inside the pods, because connectors otherwise cannot fetch their credentials (see step 4
  below).
- **Storage**: a default StorageClass for the connector databases and Vaults.
- **Network policies**: a network implementation that enforces NetworkPolicy, which isolates
  the connectors from each other ([Architecture](/architecture#connector-hosting)).

The remote settings are set in `.env`, as listed in the advanced section of
`.env.example`, or passed to setup:

```bash
bash manage.sh setup --public-domain <DOMAIN> --connector-cluster remote \
  --kubeconfig <FILE> --connector-domain <CONNECTOR_DNS_DOMAIN> --target <NAME> \
  --ingress-gateway http://<PRIVATE_INGRESS_ADDRESS>
```

Setup keeps a private copy of the kubeconfig in `.deploy/kubeconfig-remote`. Each connector
receives `<slug>-controlplane.<domain>` and `<slug>-dataplane.<domain>` on the public
IngressClass (`nginx` by default, with the ingress-nginx CORS annotations) and
`<slug>.management.<domain>` on a private one (`nginx-internal`).

## Example: a kind cluster on a second server

In this example, the OpenDS server is at `10.0.0.10` and the second server at `10.0.0.20` on
the same private network. Connector names use sslip.io, so no DNS records are needed. The steps
run on the second server from a copy of the OpenDS repository, with Docker, `kind`, `kubectl`
and `helm` installed.

1. Create the cluster. The API listens on the private address. The public ingress uses port 80,
   and the private one only the loopback port 19090:

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

   ```bash
   kind create cluster --name connectors --config connectors-kind.yaml
   kind get kubeconfig --name connectors > kubeconfig-connectors
   ```

2. Install the two ingress controllers from the chart in the repository. The public one uses
   the repository's values. The private one serves the class `nginx-internal`:

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

3. Start the private gateway. It is an nginx that only the OpenDS server may use, and it sends
   management host names to the private ingress and everything else to the public one:

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

   ```bash
   docker run -d --name connector-gateway --restart unless-stopped --network host \
     -v "$PWD/connector-gateway/default.conf:/etc/nginx/conf.d/default.conf:ro" \
     nginx:1.27-alpine
   ```

4. Check DNS inside the pods. Connector images give up on a name as soon as one lookup fails,
   so two cases need a fix in the `coredns` ConfigMap
   (`kubectl -n kube-system edit configmap coredns`, then
   `kubectl -n kube-system rollout restart deployment coredns`):

   - **sslip.io names of private addresses**: some resolvers refuse to answer them, so the
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

   - **Failing search domains**: pods inherit the server's DNS search domains from
     `/etc/resolv.conf` and try short names under them first. If a search domain's resolver
     fails such lookups, answer "no such name" for it, here for `example.internal`:

     ```text
     example.internal:53 {
         errors
         template ANY ANY example.internal {
             rcode NXDOMAIN
         }
     }
     ```

   Test with `kubectl run dnstest --rm -i --restart=Never --image=alpine:3.20 -- getent hosts
   <your platform domain>`, which must print an address every time.

5. On the OpenDS server, copy `kubeconfig-connectors` over and run setup:

   ```bash
   bash manage.sh setup --public-domain <DOMAIN> --connector-cluster remote \
     --kubeconfig kubeconfig-connectors --connector-domain 10-0-0-20.sslip.io \
     --target connectors-1 --ingress-gateway http://10.0.0.20:19080
   ```

   New connectors then start on the second server.

One Kubernetes target serves one OpenDS installation, and each connector records its target.
Connectors on another target are ignored and refuse lifecycle actions, so never point an
existing target name at another cluster.
