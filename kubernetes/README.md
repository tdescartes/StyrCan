# Kubernetes Deployment Files

This directory contains Kubernetes manifests for deploying StyrCan on your home server.

## Prerequisites

1. Kubernetes cluster running (k3s, microk8s, or full Kubernetes)
2. kubectl configured to connect to your cluster
3. Persistent storage provisioner (local-path, nfs, etc.)
4. Ingress controller (optional, for external access)

## Quick Start

### 1. Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Create ConfigMap and Secrets

```bash
# Edit secrets.yaml with your actual values first!
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml
```

### 3. Deploy Database and Redis

```bash
kubectl apply -f postgres-pv.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f redis-deployment.yaml
```

### 4. Wait for Database to be Ready

```bash
kubectl wait --for=condition=ready pod -l app=postgres -n styrcan --timeout=300s
```

### 5. Deploy Backend and Frontend

```bash
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
```

### 6. Expose Services (Optional - External Access)

```bash
kubectl apply -f ingress.yaml
```

## Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n styrcan

# Check services
kubectl get svc -n styrcan

# View logs
kubectl logs -f deployment/backend -n styrcan
kubectl logs -f deployment/frontend -n styrcan
```

## Access the Application

### Within Cluster

- Backend: http://backend-service.styrcan.svc.cluster.local:8000
- Frontend: http://frontend-service.styrcan.svc.cluster.local:3000

### NodePort Access (from your network)

- Backend: http://<node-ip>:30800
- Frontend: http://<node-ip>:30300

### Ingress Access (if configured)

- http://styrcan.local (add to /etc/hosts)

## Scaling

```bash
# Scale backend
kubectl scale deployment/backend --replicas=3 -n styrcan

# Scale frontend
kubectl scale deployment/frontend --replicas=2 -n styrcan
```

## Cleanup

```bash
kubectl delete namespace styrcan
```
