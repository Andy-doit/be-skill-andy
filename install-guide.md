# Installation & Verification Guide

> Instructions for installing, verifying, updating, and uninstalling `be-skill-andy` across **Claude Code**, **Codex**, and **Antigravity**.

---

## 1. Quick Automated Installation (Windows Junctions)

Using Windows directory junctions creates zero-copy links from your cloned repository into each tool's skill folder. Any rule improvements or notes written in the repo are instantly active across all tools.

Open PowerShell in the `be-skill-andy` directory:

```powershell
# Install into all detected tools (Claude Code, Codex, Antigravity)
powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1

# Or target specific tools
powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1 -Tools claude,codex
powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1 -Tools antigravity
```

---

## 2. Manual Installation Commands

### A. Claude Code
- **Skill Path:** `%USERPROFILE%\.claude\skills\`
- **Using Directory Junctions (Recommended):**
  ```powershell
  $repo = "D:\work\AI\be-skill-andy"
  Get-ChildItem "$repo\skills" -Directory | ForEach-Object {
    New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\$($_.Name)" -Target $_.FullName
  }
  ```
- **Using File Copy (Isolated Snapshot):**
  ```powershell
  Copy-Item -Recurse -Force "D:\work\AI\be-skill-andy\skills\*" "$env:USERPROFILE\.claude\skills\"
  ```

### B. Codex
- **Skill Path:** `%USERPROFILE%\.agents\skills\`
- **Using Directory Junctions:**
  ```powershell
  $repo = "D:\work\AI\be-skill-andy"
  Get-ChildItem "$repo\skills" -Directory | ForEach-Object {
    New-Item -ItemType Junction -Path "$env:USERPROFILE\.agents\skills\$($_.Name)" -Target $_.FullName
  }
  ```
- **Using File Copy:**
  ```powershell
  Copy-Item -Recurse -Force "D:\work\AI\be-skill-andy\skills\*" "$env:USERPROFILE\.agents\skills\"
  ```

### C. Antigravity
- **Plugin Path:** `%USERPROFILE%\.gemini\config\plugins\be-skill-andy\`
- **Using Directory Junction (Recommended - Installs full plugin with rules and manifests):**
  ```powershell
  New-Item -ItemType Junction -Path "$env:USERPROFILE\.gemini\config\plugins\be-skill-andy" -Target "D:\work\AI\be-skill-andy"
  ```
- **Using File Copy (Isolated Snapshot):**
  ```powershell
  Copy-Item -Recurse -Force "D:\work\AI\be-skill-andy" "$env:USERPROFILE\.gemini\config\plugins\be-skill-andy"
  ```

---

## 3. Verify Installation Prompts

Paste these prompts into each tool to confirm proper skill activation:

### Test Prompt 1: Router Activation
```text
Thiết kế bảng orders và các migration để hỗ trợ expand-contract khi đổi tên cột
```
- **Expected Result:** Agent activates `be` router and dispatches to `be-persist`. Quotes `BE-1` (migrations sole authority) and `BE-7` (expand-contract).

### Test Prompt 2: Outbox & Concurrency
```text
Thêm cơ chế transactional outbox và idempotency key cho API thanh toán
```
- **Expected Result:** Agent activates `be-async`. Quotes `BE-2` (transactional outbox) and `BE-9` (client mutation idempotency).

### Test Prompt 3: Read-Only Audit Mode
```text
Audit module billing hiện có xem có vi phạm quy tắc backend không
```
- **Expected Result:** Agent activates `be-audit` in read-only mode. Outputs findings table with `Rule ID`, `file:line`, `Severity`, `Evidence`, and `Proposed Remedy`.

---

## 4. Updating Skills

### When using Directory Junctions (Recommended):
No reinstall needed! Run `git pull` in the `be-skill-andy` repo:
```bash
git pull origin main
```
All connected tools (Claude Code, Codex, Antigravity) immediately receive updated rules and profiles.

### When using File Copy:
Re-run the copy commands in Section 2 to overwrite the tool skill directories with updated source files.

---

## 5. Uninstalling Skills

### Automated Uninstall (Removes all junctions):
```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1 -Uninstall
```

### Manual Uninstall Commands:
```powershell
# Claude Code:
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\skills\be*"

# Codex:
Remove-Item -Recurse -Force "$env:USERPROFILE\.agents\skills\be*"

# Antigravity:
$item = Get-Item "$env:USERPROFILE\.gemini\config\plugins\be-skill-andy"
if ($item.LinkType -eq "Junction") { $item.Delete() } else { Remove-Item -Recurse -Force $item.FullName }
```
