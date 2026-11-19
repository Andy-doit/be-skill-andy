<#
.SYNOPSIS
  Link be-skill-andy skills into Claude Code, Codex, and Antigravity skill folders (Windows junctions).

.DESCRIPTION
  Creates directory junctions from this repository's `skills/` folder into:
  - Claude Code: %USERPROFILE%\.claude\skills
  - Codex: %USERPROFILE%\.agents\skills
  - Antigravity: %USERPROFILE%\.gemini\config\plugins\be-skill-andy (or %USERPROFILE%\.gemini\config\skills)

.PARAMETER Tools
  claude, codex, antigravity, or all (default: all).

.PARAMETER Uninstall
  Remove only junctions pointing into this repository.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1
  powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1 -Tools claude,antigravity
  powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1 -Uninstall
#>
param(
  [string[]]$Tools = @("all"),
  [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$SrcSkills = Join-Path $RepoRoot "skills"
$HomeDir = $env:USERPROFILE

$Targets = [ordered]@{
  "claude"      = @("$HomeDir\.claude\skills")
  "codex"       = @("$HomeDir\.agents\skills")
  "antigravity" = @("$HomeDir\.gemini\config\skills")
}

$Selected = if ($Tools -contains "all") { $Targets.Keys } else { $Tools }
$Skills = Get-ChildItem $SrcSkills -Directory | Where-Object { Test-Path (Join-Path $_.FullName "SKILL.md") }

foreach ($tool in $Selected) {
  if (-not $Targets.Contains($tool)) {
    Write-Warning "Unknown tool '$tool' (allowed: $($Targets.Keys -join ', '), all)"
    continue
  }

  foreach ($dst in $Targets[$tool]) {
    Write-Host "`n== Setting up $tool -> $dst =="

    if ($Uninstall) {
      if (-not (Test-Path $dst)) {
        Write-Host "  (directory does not exist)"
        continue
      }
      Get-ChildItem $dst | Where-Object { $_.LinkType -eq "Junction" -and "$($_.Target)".StartsWith($SrcSkills) } | ForEach-Object {
        $_.Delete()
        Write-Host "  [Removed Junction]: $($_.Name)"
      }
      continue
    }

    if (-not (Test-Path $dst)) {
      New-Item -ItemType Directory -Force -Path $dst | Out-Null
    }

    foreach ($s in $Skills) {
      $junctionPath = Join-Path $dst $s.Name
      if (Test-Path $junctionPath) {
        $item = Get-Item $junctionPath
        if ($item.LinkType -eq "Junction" -and "$($item.Target)" -eq $s.FullName) {
          Write-Host "  [OK] Already linked: $($s.Name)"
        } else {
          Write-Warning "  [SKIP] Path exists and is not ours: $junctionPath"
        }
      } else {
        New-Item -ItemType Junction -Path $junctionPath -Target $s.FullName | Out-Null
        Write-Host "  [Linked]: $($s.Name) -> $($s.FullName)"
      }
    }
  }
}

# Register as Antigravity Plugin if Antigravity is selected
if ($Selected -contains "antigravity" -or $Selected -contains "all") {
  $pluginDst = Join-Path $HomeDir ".gemini\config\plugins\be-skill-andy"
  Write-Host "`n== Registering Antigravity Plugin -> $pluginDst =="
  
  if ($Uninstall) {
    if (Test-Path $pluginDst) {
      $item = Get-Item $pluginDst
      if ($item.LinkType -eq "Junction") {
        $item.Delete()
        Write-Host "  [Removed Plugin Junction]: be-skill-andy"
      }
    }
  } else {
    $pluginDirParent = Split-Path $pluginDst -Parent
    if (-not (Test-Path $pluginDirParent)) {
      New-Item -ItemType Directory -Force -Path $pluginDirParent | Out-Null
    }
    if (Test-Path $pluginDst) {
      $item = Get-Item $pluginDst
      if ($item.LinkType -eq "Junction" -and "$($item.Target)" -eq $RepoRoot) {
        Write-Host "  [OK] Plugin already linked: be-skill-andy"
      } else {
        Write-Warning "  [SKIP] Plugin path exists: $pluginDst"
      }
    } else {
      New-Item -ItemType Junction -Path $pluginDst -Target $RepoRoot | Out-Null
      Write-Host "  [Linked Plugin]: be-skill-andy -> $RepoRoot"
    }
  }
}

Write-Host "`n✅ Installation / Update script completed."
