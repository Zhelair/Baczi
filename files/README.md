# BaZi Knowledge Library

This folder is yours. Add as many `.md` files as you want, in any subfolders.
The scraper reads all of them on every run — zero API cost, instant.

## File format

Each `##` heading = one rule. Three metadata lines, blank line, then description.

```
## pattern_name
tags: Tag1, Tag2, Tag3
school: classical
confidence: high

Description of the rule. Can be multiple sentences or paragraphs.

---
```

**pattern** — short unique ID in English pinyin.
Examples: `Zi_Wu_clash`, `Jia_Ji_combine`, `strong_Geng_water_output`, `Chen_Xu_Chou_Wei_four_punishments`

**tags** — all stems/branches involved + topic keywords.
Stems: `Jia Yi Bing Ding Wu Ji Geng Xin Ren Gui`
Branches: `Zi Chou Yin Mao Chen Si Wu Wei Shen You Xu Hai`
Topics: `clash combine punishment destruction harm element daymaster luck_cycle`
`year month day hour heavenly_stem earthly_branch strong weak`
`resource output wealth power companion wood fire earth metal water`

**school** — `classical` | `zi_ping` | `dong_gong` | `joey_yap` | `unknown`

**confidence** — `high` | `medium` | `low`

---

## Tips

- One file per topic works well: `clashes.md`, `combinations.md`, `daymaster-strength.md`
- Reference books by name in the rule description for traceability
- You can have files in subfolders — scraper scans recursively
- Re-running the scraper is always safe — upserts, never duplicates
- This folder can live in Google Drive and be synced locally.
  Set `KNOWLEDGE_DIR` in `.env.local` to point to it.
