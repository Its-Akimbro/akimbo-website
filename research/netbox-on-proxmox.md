# NetBox Community on a single Proxmox host: deployment and backup

Research for [#3](https://github.com/Its-Akimbro/akimbo-website/issues/3). Sources checked 2026-11-24. At that date the current releases were NetBox v4.7.6 and netbox-docker 5.1.2 (`gh release list`). Proxmox VE 9 runs on Debian 13 and PBS docs are at 4.2.

## Recommendation (TL;DR)

1. **Run NetBox as a native install in an unprivileged Debian 13 LXC.** Use the official NetBox install procedure, either by hand or bootstrapped with the community-scripts `netbox` helper. Do not use netbox-docker for this setup.
2. **Use two backup layers.**
   - (a) A Proxmox vzdump backup of the CT, in snapshot mode, to Proxmox Backup Server (PBS).
   - (b) A nightly `pg_dump` and a tar of `media/`, `scripts/` and `reports/`, plus `configuration.py` (it holds `SECRET_KEY` and `API_TOKEN_PEPPERS`). Write these to storage the vzdump job also captures, and copy them off-host.
3. **Upgrade by hand. Never run the helper script's `update` blindly.** First take a `pg_dump` and a Proxmox snapshot, then read the release notes, then follow NetBox's documented `upgrade.sh` flow.
4. **Get backups off the box.** A PBS installed on the same hypervisor is explicitly "not recommended" by Proxmox. If PBS has to share the host, at minimum sync or copy it somewhere else.

## Facts by topic

### NetBox requirements and components

- NetBox v4.7 supports Python 3.12, 3.13 and 3.14, PostgreSQL 15+ and Redis 6.0+. The install steps were tested on Ubuntu 24.04. The docs state **no hardware requirements**. ([NetBox install docs](https://netboxlabs.com/docs/netbox/installation/))
- The stack is PostgreSQL, Redis, the NetBox Django app under Gunicorn, an `rqworker` (the `netbox-rq` service), and nginx or Apache in front. The Python-package install method is "experimental" and "not recommended for production use". (same source)
- From v4.7, the `ltree` PostgreSQL extension is required. The NetBox DB user needs `CREATE` privilege unless a DBA pre-installs the extension. ([Upgrading](https://netboxlabs.com/docs/netbox/installation/upgrading/))
- Debian 13 (trixie) ships python3 3.13.5, PostgreSQL 17 and redis-server 8.0.2 ([packages.debian.org](https://packages.debian.org/trixie/python3)). All are inside NetBox's supported range, so a stock Debian 13 CT needs no third-party repos.
- **API tokens:** v1 tokens are deprecated as of v4.6 and will be removed in v5.0. v2 tokens are hashed with `API_TOKEN_PEPPERS`. "Although NetBox will run without `API_TOKEN_PEPPERS` defined, the use of v2 API tokens will be unavailable." ([required-parameters.md](https://github.com/netbox-community/netbox/blob/main/docs/configuration/required-parameters.md), [rest-api.md](https://github.com/netbox-community/netbox/blob/main/docs/integrations/rest-api.md)) The Client Portal will need a read-only v2 token, so the pepper must be set and must be backed up. If it is lost, every v2 token stops working.
- `SECRET_KEY` "can be changed at any time without impacting stored data" but doing so invalidates sessions. (required-parameters.md)

### LXC vs VM (Proxmox guidance)

- Proxmox: "It is not recommended to run docker directly on your Proxmox VE host. While it can be convenient to run 'Application Containers' directly as Proxmox Containers, doing so is currently a tech preview. For use cases requiring container orchestration or live migration, it is still recommended to run them inside a Proxmox QEMU virtual machine." ([PVE admin guide](https://pve.proxmox.com/pve-docs/pve-admin-guide.html), "LXC vs LXD vs Proxmox Containers vs Docker")
- Containers share the host kernel, so "full virtual machines provide better isolation" for untrusted users. Unprivileged containers are the default and are considered "safe by design". "Privileged containers should only be used in trusted environments." ([Linux Container wiki](https://pve.proxmox.com/wiki/Linux_Container))
- NetBox here is internal only. Its users are the owner plus the portal backend, so a native install is a system-container workload and fits an unprivileged LXC. LXC is cheaper in RAM and disk than a VM. Its backups are file-level (pxar) to PBS, which allows single-file restore. *(This is my inference from the points above, not a statement Proxmox makes.)*

### Native install vs netbox-docker vs community helper script

**netbox-docker** ([repo](https://github.com/netbox-community/netbox-docker), [wiki](https://github.com/netbox-community/netbox-docker/wiki))

- It is "currently maintained by the community. The community is expected to help each other." It is not supported by NetBox Labs.
- It needs Docker 20.10.10+ and compose 1.28.0+. Pin `vX.Y.Z-a.b.c` or `vX.Y-a.b.c` tags in production. The image and repo versions "must stay in sync".
- Upgrading is `docker compose down`, then `git pull` on the `release` branch, then `docker compose pull`, then `up -d`. Migrations run automatically on start. ([Updating](https://github.com/netbox-community/netbox-docker/wiki/Updating))
- The compose file pins `postgres:18-alpine` and `valkey:9.1-alpine` ([docker-compose.yml](https://github.com/netbox-community/netbox-docker/blob/release/docker-compose.yml)). When upstream bumps the PostgreSQL major version, you have to dump, delete the volume and restore. The wiki warns: "test this procedure first".
- `env/netbox.env` ships a fixed example `SECRET_KEY` and `API_TOKEN_PEPPER_1`. Both must be replaced.
- Proxmox does not recommend Docker inside an LXC, so on Proxmox this option means a VM: a heavier guest plus a second OS and Docker to patch.

**Native install** (official docs)

- This is the path NetBox Labs documents and tests.
- Upgrade steps: install the new release next to the old one. Copy across `configuration.py`, `ldap_config.py`, `local_requirements.txt`, media, scripts, reports and `gunicorn.py`. Run `./upgrade.sh`, then `systemctl restart netbox netbox-rq`. ([Upgrading](https://netboxlabs.com/docs/netbox/installation/upgrading/))
- PostgreSQL comes from the OS, so it follows Debian's lifecycle instead of netbox-docker's pin.

**community-scripts helper** ([ct/netbox.sh](https://github.com/community-scripts/ProxmoxVE/blob/main/ct/netbox.sh), [install/netbox-install.sh](https://github.com/community-scripts/ProxmoxVE/blob/main/install/netbox-install.sh))

- It creates an unprivileged Debian 13 LXC with defaults of 2 vCPU, 2048 MB RAM and a 4 GB disk. It then does a **native** install: PostgreSQL 16, Redis, the NetBox release tarball in `/opt/netbox`, systemd `netbox` and `netbox-rq` units, Apache with a self-signed certificate, and a daily housekeeping cron job. In other words, it automates the official procedure.
- Gaps to fix after running it:
  - It sets `ALLOWED_HOSTS = ["*"]`.
  - It does **not** set `API_TOKEN_PEPPERS`, so v2 tokens stay unavailable until you add one.
  - It writes the secret key to `~/netbox.creds` and then overwrites that file with `>` in the admin-user step, so the key survives only in `configuration.py`.
  - It pins PostgreSQL 16 (`PG_VERSION="16" setup_postgresql`) rather than using Debian 13's stock PostgreSQL 17.
- Its `update` function jumps straight to the **latest** GitHub release. It moves `/opt/netbox` aside, deploys the new tarball, copies config, media, scripts and reports back, runs `upgrade.sh`, and then **deletes the backup directory**. It takes **no database backup** and does not check release notes or plugin compatibility. Take a `pg_dump` and a PVE snapshot before using it, or upgrade manually.
- Running `bash -c "$(curl ...)"` as root on the hypervisor means trusting that repo. Read the two scripts before running them; they are short.

**Upgrade path rule:** NetBox "can generally be upgraded directly to any newer release with no interim steps", but only from the latest minor release of the current major. Example: v2.11.8 can go straight to v3.3.2, but v2.10.x must go to v2.11 first. ([Upgrading](https://netboxlabs.com/docs/netbox/installation/upgrading/)) Expect the same rule before a v4 to v5 jump: get onto the last v4.x first. "Always be sure to save a backup ... prior to starting the upgrade process," and verify that plugins support the target release.

### Sizing

- NetBox publishes no hardware sizing. The helper uses 2 vCPU, 2 GB RAM and a 4 GB disk.
- *Unsourced judgment:* the 4 GB disk is tight once the venv, PostgreSQL, logs, changelog history and local dump files are included. Plan for roughly 2 vCPU, 2 to 4 GB RAM and a 16 to 32 GB disk, and grow as needed. One MSP's NetBox data is small.
- If PBS runs as a guest, its own recommendation is 4+ cores and at least 4 GiB RAM, plus 1 GiB per TiB of datastore. ([PBS system requirements](https://pbs.proxmox.com/docs/system-requirements.html))

### Backup and restore

**What NetBox itself says needs backing up** ([Replicating NetBox](https://netboxlabs.com/docs/netbox/administration/replicating-netbox/))

- The database:
  - Dump with `pg_dump --username netbox --password --host localhost netbox > netbox.sql`.
  - Restore with `drop database` and `create database`, then `psql -v ON_ERROR_STOP=1 netbox < netbox.sql`. Without `ON_ERROR_STOP`, psql "continues after an error and still exits with status 0".
  - Dumps **do not include PostgreSQL roles or permissions**. Recreate them per the install docs.
  - `--exclude-table-data=core_objectchange` drops changelog data, which is often most of the DB size.
- Media: `tar -czf netbox_media.tar.gz netbox/media/`.
- The page does not mention config or secrets. In practice `configuration.py` (`SECRET_KEY`, `API_TOKEN_PEPPERS`, DB password) plus `scripts/` and `reports/` must also be kept. The upgrade docs list the same files as the ones to carry forward. Redis holds only cache and queue data and is not covered.

**netbox-docker equivalents** ([Troubleshooting wiki](https://github.com/netbox-community/netbox-docker/wiki/Troubleshooting))

- `docker compose exec -T postgres sh -c 'pg_dump -cU $POSTGRES_USER $POSTGRES_DB' | gzip > db_dump.sql.gz`
- `docker compose exec -T netbox tar c -zf - -C /opt/netbox/netbox/media ./ > media-backup.tar.gz`

**Proxmox layer** ([PVE admin guide, Backup and Restore](https://pve.proxmox.com/pve-docs/pve-admin-guide.html))

- CT snapshot mode suspends the container briefly, snapshots its volumes and archives the snapshot. It "requires that all backed up volumes are on a storage that supports snapshots", such as ZFS or LVM-thin. Mount points other than rootfs are excluded unless `backup=1` is set. Bind and device mounts are never included.
- VM snapshot mode is a live backup. With the guest agent (`agent: 1`) it calls `guest-fsfreeze-freeze` and thaw. The docs note "a small inconsistency risk".
- A filesystem-level snapshot of a running PostgreSQL is crash-consistent, not application-consistent. That is why the `pg_dump` layer matters. Dumping to a directory inside the CT rootfs shortly before the vzdump job means the PBS backup contains a clean dump too. *(Inference.)*
- For CT backups to PBS there is a "change detection mode" setting (the pxar metadata mode) that makes incremental CT backups faster.

**PBS placement** ([PBS installation](https://pbs.proxmox.com/docs/installation.html), [Managing Remotes & Sync](https://pbs.proxmox.com/docs/managing-remotes.html))

- "Installing the backup server directly on the hypervisor is not recommended. It is safer to use a separate physical server to store backups. Should the hypervisor server fail, you can still access the backups."
- PBS sync jobs pull or push datastores between PBS instances, with an example labelled `offsite`. "To further decrease the impact of a failed host, you can set up periodic, efficient, incremental datastore synchronization from other Proxmox Backup Server instances."
- With a single server, the realistic options are:
  - PBS on a separate cheap box or NAS.
  - PBS as a guest or on the host with a datastore on a separate disk, plus a sync job or a copy of the nightly `pg_dump` and tarball to offsite object storage. *(Options are my synthesis; quotes are Proxmox's.)*

### Restore drill (minimum)

1. Restore the CT from PBS (`pct restore`) to a new CTID on an isolated bridge.
2. Or build a fresh CT, recreate the Postgres role and DB, run `psql -v ON_ERROR_STOP=1` on the dump, untar media, scripts and reports, drop in `configuration.py`, and run `upgrade.sh`.
3. Log in, check object counts, and test the portal's v2 token. If the token fails, the pepper was not restored.

## Caveats and open points

- I found no official NetBox Labs guidance for Proxmox specifically. The LXC recommendation combines NetBox's native install docs with Proxmox's container guidance.
- `API_TOKEN_PEPPERS` is a hard dependency for the Client Portal: v1 tokens go away in NetBox v5.0. Treat the pepper as a backup-critical secret.
- Keep NetBox off Cloudflare entirely. The portal backend should reach it over an internal bridge or VLAN, using a read-only v2 token with an IP restriction. Replace the helper's `ALLOWED_HOSTS = ["*"]` with the internal hostname.
- Do not run PBS on the same disks as the guests. A single-host PBS is only protection against logical mistakes, not against losing the host.
