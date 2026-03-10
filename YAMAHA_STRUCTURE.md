# Yamaha RTX Command Reference - URL & Content Structure

The Yamaha RTX (RT-Common) manual is organized as a framed web application.

## 1. Base URL
`https://www.rtpro.yamaha.co.jp/RT/manual/rt-common/`

## 2. Core Navigation Pages
- **Index (Frameset)**: `index.html` (root)
- **Table of Contents (TOC)**: `toc.html`
    - Contains a hierarchical list of chapters and commands.
    - Best for browsing functional groups.
- **Alphabetical Command Index**: `cmdref_index.html`
    - Contains a flat, exhaustive list of all commands mapped to their exact CLI syntax.
    - Best for resolving a command string (e.g., "ip route") to its reference page.

## 3. Command Page URL Pattern
Commands are stored in subdirectories based on their functional category.
- **Pattern**: `[category_slug]/[command_filename].html`

## 4. Page Content Structure (DITA-generated)
The command pages follow a formal semantic structure described in chapter 1.2 of the manual.

### Core Sections for Parsing:
- **Command Name**: `h1.title`
- **Syntax ([書式])**: 
    - Bold text: Command name.
    - Italic text: Parameters.
    - Brackets `[ ]`: Optional items.
- **Parameters & Defaults ([設定値及び初期値])**: 
    - Defines argument ranges and factory defaults.
- **Description ([説明])**: 
    - The primary explanation of the command behavior.
- **Notes ([ノート])**: 
    - Specific precautions and technical constraints.
- **Examples ([設定例])**: 
    - Practical CLI snippets.
- **Applicable Models ([適用モデル])**: 
    - List of router models that support the command.

### Key CSS Selectors:
- Section Container: `div.section`
- Section Title: `h2.sectiontitle`
- Syntax Lines: `li.sli` or `.ph.synph`
- Parameters: `li.li` with `.keyword.varname`
- Code Blocks: `.pre.codeblock`

## 5. Technical Details
- **Encoding**: UTF-8 (Current manual version).
- **Target Frame**: All links in the TOC and Index specify `target="contentwin"`.
