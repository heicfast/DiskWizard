# DiskWizard Roadmap

## Now — core recovery flow (this milestone, UI complete)

- [x] 3-step recovery flow (Select Location → Scan → Preview & Recover)
- [x] Device inventory: internal/external/SD/lost partitions/BitLocker-locked
- [x] Two-phase scan simulation (quick MFT → advanced carving) with HUD
- [x] Results: tree/list/preview, filters, smart de-dup (~65%), context menu
- [x] Recovery funnel: destination guard, progress, completion
- [x] License posture machine (trial 2 GB → Pro), gate markers
- [x] Disk Health (S.M.A.R.T.) — the always-free feature
- [x] BitLocker unlock flow (password / recovery key)
- [x] SD Card Rescue (SDR) restore-access pre-phase
- [x] Theme system (5 palettes, blossom default) + theme-reactive logo

## Next — advanced repairing (priority after the core is production ready)

> **TODO (from the product plan):** the advanced repairing ships as the next
> priority once the core idea and implementations are completed fully
> production-ready. The UI surface is already staged (`File Repair` page +
> the Enable-file-repair toggle in the destination dialog).

- [ ] Advanced Photo Repair — JPEG/JPG/PNG/GIF to good condition, preview
      before final recovery (integrated function, not a separate product)
- [ ] Document Repair — extract and repair all components of corrupted
      .doc/.docx, .xls/.xlsx, .pdf/.pptx
- [ ] Video Repair — sample-guided reconstruction, deep video reconstruct
- [ ] Repair-during-recovery pipeline (queue + counters in scan-complete stats)

## Core connection (parallel workstream)

- [ ] Rust scan engine: FS plugin factory (NTFS/FAT/exFAT/ReFS/ext/HFS+) + RAW carving
- [ ] SMART transports (SAT/ATA, NVMe health log)
- [ ] BitLocker FVE key service + XTS-AES stream
- [ ] .rsf session save/resume
- [ ] License worker (L0–L10 ladder)
- [ ] NSIS + MSIX release builds (workflows staged)
