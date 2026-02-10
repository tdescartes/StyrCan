# StyrCan Scripts

This folder contains utility scripts for project setup, deployment, and maintenance.

## 📜 Available Scripts

### Setup Scripts

- **[setup.ps1](./setup.ps1)** - PowerShell script for initial project setup on Windows
  - Sets up development environment
  - Installs dependencies
  - Configures services

### Validation Scripts

- **[validate-templates.sh](./validate-templates.sh)** - Bash script to validate configuration templates
  - Validates Kubernetes manifests
  - Checks Docker configurations
  - Verifies environment files

## 🚀 Usage

### Windows (PowerShell)

```powershell
# Run setup script
.\scripts\setup.ps1
```

### Linux/MacOS (Bash)

```bash
# Run validation script
./scripts/validate-templates.sh
```

---

For general project information, see the main [README.md](../README.md) in the root directory.
