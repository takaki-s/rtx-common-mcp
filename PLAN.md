# Yamaha RTX Command Reference MCP Server - Development Plan

This plan outlines the development of a **Yamaha RTX Command Reference MCP Server** in TypeScript. This server allows an LLM to browse, search, and retrieve detailed technical documentation for Yamaha RTX router commands from the official [RTpro manual](https://www.rtpro.yamaha.co.jp/RT/manual/rt-common/).

## 1. Project Overview
- **Goal**: Create an MCP server that provides structured CLI command reference data.
- **Tech Stack**: Node.js, TypeScript, `@modelcontextprotocol/sdk`.
- **Data Source**: Live scraping of `https://www.rtpro.yamaha.co.jp/RT/manual/rt-common/`.
- **Connectivity**: Reference-only (no direct router connection required).

## 2. Implementation Phases

### Phase 1: Research & Discovery
- **HTML Analysis**: Analyze the DOM structure of the [RT-Common index](https://www.rtpro.yamaha.co.jp/RT/manual/rt-common/) to map categories to command lists.
- **Command Page Mapping**: Identify patterns for:
    - **Syntax** (書式)
    - **Parameters** (設定値リスト)
    - **Description** (説明)
    - **Default Values** (初期値)
- **Encoding Verification**: Confirm if the pages use `Shift_JIS` or `UTF-8` and implement `iconv-lite` if necessary.

### Phase 2: Project Infrastructure (TypeScript)
- **Scaffold**: Initialize a Node.js project with `typescript`, `@modelcontextprotocol/sdk`, `axios`, and `cheerio`.
- **Configuration**: Set up `tsconfig.json` for ESM and modern Node.js features.
- **Doc Client**: Build a central `YamahaDocClient` class for HTTP requests, caching, and HTML parsing.

### Phase 3: MCP Tool Implementation
Implement four primary tools:
1.  **`list_categories`**: Fetch the top-level functional groups (e.g., Interface, IP, Security, System Management).
2.  **`list_commands_by_category`**: Retrieve a list of commands within a group, including short descriptions.
3.  **`search_commands`**: Keyword-based search across indexed command names and descriptions.
4.  **`get_command_details`**: Fetch a structured JSON object for a specific command (Syntax, Parameters, Description, Defaults, Examples).

### Phase 4: Data Optimization & Robustness
- **In-Memory Caching**: Implement TTL caching for lists and command details.
- **Error Handling**: Gracefully handle 404s or site structure changes.
- **Structured Output**: Ensure tools return data (Markdown/JSON) optimized for LLM consumption.

### Phase 5: Validation & Finalization
- **Manual Testing**: Verify parsing accuracy for complex commands (e.g., `nat descriptor`, `ip filter`).
- **MCP Inspector**: Use the MCP Inspector to validate protocol compliance.

## 3. Key Technical Considerations
- **Japanese Content**: The documentation is in Japanese; the MCP server will preserve technical accuracy while providing a structure the LLM can translate or explain.
- **Dynamic Scraping**: Since we are not using a static database, robust selectors are required to handle variations in the manual's layout.
