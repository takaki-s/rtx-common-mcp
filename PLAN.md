# Yamaha RTX Command Reference MCP Server - Development Plan

This plan outlines the development of a **Yamaha RTX Command Reference MCP Server** in TypeScript. This server allows an LLM to browse, search, and retrieve detailed technical documentation for Yamaha RTX router commands from the official [RTpro manual](https://www.rtpro.yamaha.co.jp/RT/manual/rt-common/).

## 1. Project Overview
- **Goal**: Create an MCP server that provides structured CLI command reference data.
- **Tech Stack**: Node.js 24, TypeScript, `@modelcontextprotocol/sdk`, `pnpm`, `cheerio`, `vitest`.
- **Data Source**: Live scraping of `https://www.rtpro.yamaha.co.jp/RT/manual/rt-common/`.
- **Connectivity**: Reference-only (no direct router connection required).

## 2. Implementation Phases

### Phase 1: Research & Discovery (Done)
- Analyze manual structure (frameset, DITA-generated content).
- Identify key navigation pages (`toc.html`, `cmdref_index.html`).
- Confirm encoding (UTF-8).

### Phase 2: Infrastructure & Tooling (Done)
- Initialize project with modern TypeScript/ESM settings.
- Switch to `pnpm` for efficient dependency management.
- Introduce `tsx` for easier testing/debugging.
- Introduce `eslint` with strict type-checked rules.

### Phase 3: Core Scraper Development (Done)
- Implement `YamahaDocClient` with native `fetch`.
- Robust recursive parsing for the hierarchical TOC.
- Precise command resolution using the alphabetical index (`cmdref_index.html`).

### Phase 4: MCP Tool Implementation (Done)
- `list_categories`: Browse functional chapters.
- `list_commands_by_category`: List commands in a chapter.
- `search_commands`: Keyword search across the index.
- `get_command_details`: Get full documentation by command name.

### Phase 5: Robust Testing (Done)
- Set up **Vitest** with coverage reporting.
- Achieve 94%+ logic coverage.
- Verify resolution, parsing, and error handling.

### Phase 6: Command Data Model Expansion (Next)
- **Update CommandDetail Interface**: Add `notes` and `applicableModels`.
- **Refine Parser**: Capture `[ノート]` and `[適用モデル]` sections formally.
- **Enhanced Mapping**: Ensure combined sections like `[設定値及び初期値]` are fully decomposed.

## 3. Key Technical Considerations
- **Native ESM**: All imports/exports use modern Node.js standards.
- **LLM-First Design**: Tools accept intuitive command names instead of technical paths.
- **Scalability**: Scraper handles varying DITA output patterns across the manual.
