# Sprint 6 — DevOps, K8s Deployment & CI/CD

**Theme:** Dockerise, configure Kubernetes deployment, build pipeline  
**Status:** 🔄 In Progress  
**Duration:** Week 6

---

## Goals

- Create production Dockerfile using Next.js standalone output
- Create `build.sh` pipeline script (Docker build, scan, push, deploy)
- Create ArgoCD `app.yaml` for GitOps deployment
- Create Helm `values.yaml` for environment configuration
- Mirror ordering-frontend deployment pattern

## Deliverables

### codevertex-website repo
- [x] `Dockerfile` — multi-stage: deps → builder → runner (node:20-alpine)
- [x] `entrypoint.sh` — environment variable injection at runtime

### devops-k8s/apps/codevertex-website/
- [x] `app.yaml` — ArgoCD Application manifest
- [x] `values.yaml` — Helm configuration (image, env, ingress, health checks, scaling)

### codevertex-website repo (CI script)
- [x] `build.sh` — Trivy scan + Docker build + push + K8s deploy + Helm values update

## Kubernetes Configuration

| Setting | Value |
|---------|-------|
| Namespace | `codevertex` |
| Domain | `codevertexafrica.com` |
| Image | `docker.io/codevertex/codevertex-website` |
| Replicas | 1 base, autoscale 1–2 |
| Port | 3000 (Next.js) |
| Health check | `GET /healthz` |
| TLS | cert-manager / letsencrypt-prod |

## Environment Variables (K8s)

Sensitive vars come from `codevertex-website-secrets` K8s secret:
- `DATABASE_URL`
- `ANTHROPIC_API_KEY`

Public vars set directly in `values.yaml`:
- `NEXT_PUBLIC_TREASURY_TENANT=codevertex`
- `NEXT_PUBLIC_SSO_URL=https://accounts.codevertexafrica.com`

## Notes

- Image tags are updated by `build.sh` only — never edit `values.yaml` image tag manually
- `NEXT_PUBLIC_*` vars must be passed as Docker `--build-arg` because Next.js bakes them at build time
- Registry: `docker.io/codevertex/codevertex-website`

## Next Steps (Post Sprint 6)
- Add GitHub Actions workflow `.github/workflows/deploy.yml`
- Set up Trivy severity threshold (CRITICAL,HIGH exit code 1)
- Add Dependabot for dependency updates
