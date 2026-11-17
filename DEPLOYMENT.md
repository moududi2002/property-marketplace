<!-- 📍 /DEPLOYMENT.md -->

# Production Deployment Guide

Complete step-by-step VPS deployment for Property Marketplace.
Assumes Ubuntu 22.04 LTS. Replace `example.com` with your domain.

## 1. Initial Server Setup

```bash
# As root
sudo bash infrastructure/scripts/setup-server.sh

# Create app user
adduser deploy
usermod -aG sudo deploy
su - deploy